import { writeFileSync } from "node:fs"
import { createInterface } from "node:readline"
import { Logger } from "@nestjs/common"
import { NestFactory } from "@nestjs/core"
import { config as dotenvConfig } from "dotenv"
import { DataSource } from "typeorm"
import { AppModule } from "@/app.module"

const envPath = process.env.DOTENV_CONFIG_PATH
if (envPath) {
  dotenvConfig({ path: envPath, override: true })
}

import { INVITATION_SENDER } from "@/domains/auth/invitation-sender.interface"
import type { InvitationSender } from "@/domains/auth/invitation-sender.interface"
const PLACEHOLDER_AUTH0_ID_PREFIX = "00000000-0000-0000-0000-"

const logger = new Logger("ManageInvitations")

function ask(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer.trim())
    })
  })
}

async function confirmDatabaseTarget(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL
  const target =
    databaseUrl ??
    `${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_NAME}`
  logger.warn(`Target database: ${target}`)
  const answer = await ask("Do you want to proceed? (yes/no): ")
  if (answer.toLowerCase() !== "yes") {
    logger.log("Aborted by user.")
    process.exit(0)
  }
}

type PendingInvitation = {
  index: number
  membershipId: string
  email: string
  userName: string | null
  auth0Id: string
  hasAccount: boolean
  projectName: string
  organizationName: string
  role: string
  sentAt: Date
}

async function listPendingInvitations(dataSource: DataSource): Promise<PendingInvitation[]> {
  const rows = await dataSource
    .createQueryBuilder()
    .select("pm.id", "membershipId")
    .addSelect("u.email", "email")
    .addSelect("u.name", "userName")
    .addSelect("u.auth0_id", "auth0Id")
    .addSelect("p.name", "projectName")
    .addSelect("o.name", "organizationName")
    .addSelect("pm.role", "role")
    .addSelect("pm.created_at", "sentAt")
    .from("project_membership", "pm")
    .innerJoin("user", "u", "pm.user_id = u.id")
    .innerJoin("project", "p", "pm.project_id = p.id")
    .innerJoin("organization", "o", "p.organization_id = o.id")
    .where("pm.status = :status", { status: "sent" })
    .orderBy("o.name", "ASC")
    .addOrderBy("pm.created_at", "ASC")
    .getRawMany()

  return rows.map((row: Record<string, unknown>, index: number) => {
    const auth0Id = row.auth0Id as string
    return {
      index: index + 1,
      membershipId: row.membershipId,
      email: row.email,
      userName: row.userName,
      auth0Id,
      hasAccount: !auth0Id.startsWith(PLACEHOLDER_AUTH0_ID_PREFIX),
      projectName: row.projectName,
      organizationName: row.organizationName,
      role: row.role,
      sentAt: row.sentAt,
    } as PendingInvitation
  })
}

function printInvitations(invitations: PendingInvitation[]): void {
  if (invitations.length === 0) {
    logger.log("No pending invitations found.")
    return
  }

  logger.log(`Found ${invitations.length} pending invitation(s):`)
  logger.log("")
  for (const invitation of invitations) {
    const accountStatus = invitation.hasAccount ? "has account" : "no account"
    logger.log(
      `  [${invitation.index}] ${invitation.email} — ${invitation.organizationName} / ${invitation.projectName} (${invitation.role}) — ${accountStatus} — sent ${invitation.sentAt.toISOString()}`,
    )
  }
  logger.log("")
}

async function resendInvitation(
  dataSource: DataSource,
  invitationSender: InvitationSender,
  invitation: PendingInvitation,
  inviterName: string,
): Promise<void> {
  const { ticketId } = await invitationSender.sendInvitation({
    inviteeEmail: invitation.email,
    inviterName,
  })

  await dataSource
    .createQueryBuilder()
    .update("project_membership")
    .set({ invitationToken: ticketId })
    .where("id = :id", { id: invitation.membershipId })
    .execute()

  logger.log(`Invitation resent to ${invitation.email} (new ticketId: ${ticketId})`)
}

async function bootstrapCli(): Promise<void> {
  await confirmDatabaseTarget()

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ["error", "warn", "log"],
  })

  try {
    const dataSource = app.get(DataSource)
    const invitationSender = app.get(INVITATION_SENDER)
    const invitations = await listPendingInvitations(dataSource)

    printInvitations(invitations)

    if (invitations.length === 0) {
      return
    }

    const selection = await ask(
      "Enter invitation number(s) to resend (comma-separated), 'all', 'export', or 'q' to quit: ",
    )

    if (selection.toLowerCase() === "q") {
      logger.log("Aborted.")
      return
    }

    if (selection.toLowerCase() === "export") {
      const header = "email,userName,organizationName,projectName,role,hasAccount,sentAt"
      const rows = invitations.map((invitation) =>
        [
          invitation.email,
          invitation.userName ?? "",
          invitation.organizationName,
          invitation.projectName,
          invitation.role,
          invitation.hasAccount ? "yes" : "no",
          invitation.sentAt.toISOString(),
        ].join(","),
      )
      const filePath = "dontsave-pending-invitations.csv"
      writeFileSync(filePath, [header, ...rows].join("\n"))
      logger.log(`Exported to ${filePath}`)
      return
    }

    const inviterName =
      (await ask("Inviter name (default: CaseAI Connect): ")) || "CaseAI Connect"

    let toResend: PendingInvitation[]
    if (selection.toLowerCase() === "all") {
      toResend = invitations
    } else {
      const indices = selection.split(",").map((str) => Number.parseInt(str.trim(), 10))
      toResend = indices
        .map((index) => invitations.find((invitation) => invitation.index === index))
        .filter((invitation): invitation is PendingInvitation => invitation !== undefined)

      if (toResend.length === 0) {
        logger.warn("No valid selections. Aborting.")
        return
      }
    }

    logger.log(`Resending ${toResend.length} invitation(s)...`)

    for (const invitation of toResend) {
      try {
        await resendInvitation(dataSource, invitationSender, invitation, inviterName)
      } catch (error) {
        logger.error(
          `Failed to resend to ${invitation.email}: ${error instanceof Error ? error.message : "Unknown error"}`,
        )
      }
    }

    logger.log("Done.")
  } finally {
    await app.close()
  }
}

if (require.main === module) {
  void bootstrapCli()
}
