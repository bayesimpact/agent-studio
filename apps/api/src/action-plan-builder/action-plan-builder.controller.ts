import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  type MessageEvent,
  Post,
  Sse,
} from "@nestjs/common"
import { type Observable, Subject } from "rxjs"
import type {
  AbstractActionPlanBuilderService,
  ActionPlanBuilderArgs,
} from "./action-plan-builder.abstract"

interface ActionPlanBuilderRequestDto {
  profileText: string
  country?: string
}

@Controller("action-plan-builder")
export class ActionPlanBuilderController {
  constructor(
    @Inject("ActionPlanBuilderService")
    private readonly actionPlanBuilderService: AbstractActionPlanBuilderService,
  ) {}

  @Post("generate")
  @HttpCode(HttpStatus.OK)
  @Sse()
  generateActionPlan(@Body() request: ActionPlanBuilderRequestDto): Observable<MessageEvent> {
    const subject = new Subject<MessageEvent>()

    // Start the action plan generation asynchronously
    this.processActionPlanGeneration(request, subject)

    return subject.asObservable()
  }

  private async processActionPlanGeneration(
    request: ActionPlanBuilderRequestDto,
    subject: Subject<MessageEvent>,
  ): Promise<void> {
    let reasoning = ""

    try {
      const args: ActionPlanBuilderArgs = {
        profileText: request.profileText,
        country: request.country,
      }

      // Send initial event
      subject.next({
        data: {
          type: "progress",
          data: {
            message: "Starting action plan generation...",
          },
        },
      } as MessageEvent)

      // Generate action plan with progress callbacks
      const result = await this.actionPlanBuilderService.buildActionPlan(args, {
        onProgress: (progressMessage: string) => {
          reasoning += progressMessage

          // Send progress event
          subject.next({
            data: {
              type: "progress",
              data: {
                message: progressMessage,
              },
            },
          } as MessageEvent)
        },
      })

      // Send completion event
      subject.next({
        data: {
          type: "complete",
          data: {
            actionPlan: result.actionPlan,
            reasoning,
          },
        },
      } as MessageEvent)

      subject.complete()
    } catch (error) {
      // Send error event
      subject.next({
        data: {
          type: "error",
          data: {
            error: error instanceof Error ? error.message : "Unknown error occurred",
          },
        },
      } as MessageEvent)

      subject.error(error)
    }
  }
}
