import {
  Controller,
  Post,
  Body,
  Sse,
  MessageEvent,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { Inject } from '@nestjs/common';
import {
  AbstractCarePlanBuilderService,
  CarePlanBuilderArgs,
  Action,
} from './care-plan-builder.abstract';

interface CarePlanBuilderRequestDto {
  profileText: string;
  currentCarePlan?: Action[];
}

interface CarePlanBuilderProgressEvent {
  type: 'progress' | 'complete' | 'error';
  data?: {
    message?: string;
    carePlan?: Action[];
    reasoning?: string;
    error?: string;
  };
}

@Controller('care-plan-builder')
export class CarePlanBuilderController {
  constructor(
    @Inject('CarePlanBuilderService')
    private readonly carePlanBuilderService: AbstractCarePlanBuilderService,
  ) {}

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  @Sse()
  generateCarePlan(
    @Body() request: CarePlanBuilderRequestDto,
  ): Observable<MessageEvent> {
    const subject = new Subject<MessageEvent>();

    // Start the care plan generation asynchronously
    this.processCarePlanGeneration(request, subject);

    return subject.asObservable();
  }

  private async processCarePlanGeneration(
    request: CarePlanBuilderRequestDto,
    subject: Subject<MessageEvent>,
  ): Promise<void> {
    let reasoning = '';

    try {
      const args: CarePlanBuilderArgs = {
        profileText: request.profileText,
        currentCarePlan: request.currentCarePlan,
      };

      // Send initial event
      subject.next({
        data: {
          type: 'progress',
          data: {
            message: 'Starting care plan generation...',
          },
        },
      } as MessageEvent);

      // Generate care plan with progress callbacks
      const result = await this.carePlanBuilderService.buildCarePlan(args, {
        onProgress: (progressMessage: string) => {
          reasoning += progressMessage;

          // Send progress event
          subject.next({
            data: {
              type: 'progress',
              data: {
                message: progressMessage,
              },
            },
          } as MessageEvent);
        },
      });

      // Send completion event
      subject.next({
        data: {
          type: 'complete',
          data: {
            carePlan: result.carePlan,
            reasoning,
          },
        },
      } as MessageEvent);

      subject.complete();
    } catch (error) {
      // Send error event
      subject.next({
        data: {
          type: 'error',
          data: {
            error:
              error instanceof Error ? error.message : 'Unknown error occurred',
          },
        },
      } as MessageEvent);

      subject.error(error);
    }
  }
}