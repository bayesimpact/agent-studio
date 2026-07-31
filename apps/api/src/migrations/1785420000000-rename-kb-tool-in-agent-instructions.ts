import type { MigrationInterface, QueryRunner } from "typeorm"

/**
 * The RAG tool was renamed `retrieveProjectDocumentChunks` ->
 * `lookup_knowledge_base`. Agent instructions are free text written by
 * users: any prompt that references the old tool name would tell the model
 * to call a tool that no longer exists.
 *
 * Data migration: rewrites the old name to the new one in EVERY
 * agent_settings revision (not only the latest), so restoring an older
 * prompt revision cannot resurrect the dead name. The regex tolerates the
 * spelling variants seen in hand-written prompts (case, plural, underscores):
 * retrieveProjectDocumentChunks, RetrievedProjectDocumentsChunks,
 * retrieve_project_document_chunks, ...
 */
export class RenameKbToolInAgentInstructions1785420000000 implements MigrationInterface {
  name = "RenameKbToolInAgentInstructions1785420000000"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "agent_settings"
      SET "instructions" = regexp_replace(
        "instructions",
        'retrieved?_?project_?documents?_?chunks',
        'lookup_knowledge_base',
        'gi'
      )
      WHERE "instructions" ~* 'retrieved?_?project_?documents?_?chunks'
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Best-effort reverse: maps back to the canonical old spelling. The
    // original variant (case/underscores) is not recoverable, and any prompt
    // that referenced lookup_knowledge_base BEFORE this migration would be
    // rewritten too — acceptable on a revert, since the old tool name is the
    // one the deployed code would then expect.
    await queryRunner.query(`
      UPDATE "agent_settings"
      SET "instructions" = replace(
        "instructions",
        'lookup_knowledge_base',
        'retrieveProjectDocumentChunks'
      )
      WHERE "instructions" LIKE '%lookup_knowledge_base%'
    `)
  }
}
