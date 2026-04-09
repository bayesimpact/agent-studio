import type { CallHandler, ExecutionContext } from "@nestjs/common"
import type { Reflector } from "@nestjs/core"
import { of } from "rxjs"
import { ActivitiesInterceptor } from "./activities.interceptor"
import type { ActivitiesService } from "./activities.service"
import { TRACK_ACTIVITY_METADATA_KEY } from "./track-activity.decorator"

describe("ActivitiesInterceptor", () => {
  const buildContext = (request: Record<string, unknown>): ExecutionContext => {
    const httpArgumentsHost = {
      getRequest: () => request,
    }

    return {
      switchToHttp: () => httpArgumentsHost,
      getHandler: () => "handler",
      getClass: () => "class",
    } as unknown as ExecutionContext
  }

  const callHandler: CallHandler = {
    handle: () => of({ data: { success: true } }),
  }

  it("should log create actions without organization/project/entity data", async () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue({ action: "project.create" }),
    } as unknown as Reflector

    const activitiesService = {
      createActivity: jest.fn().mockResolvedValue(undefined),
    } as unknown as ActivitiesService

    const interceptor = new ActivitiesInterceptor(reflector, activitiesService)
    const context = buildContext({
      user: { id: "user-id" },
      organizationId: "organization-id",
      project: { id: "project-id" },
    })

    await new Promise<void>((resolve, reject) => {
      interceptor.intercept(context, callHandler).subscribe({
        complete: () => resolve(),
        error: reject,
      })
    })

    expect(activitiesService.createActivity).toHaveBeenCalledWith({
      action: "project.create",
      userId: "user-id",
      organizationId: null,
      projectId: null,
      entityId: null,
      entityType: null,
    })

    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(TRACK_ACTIVITY_METADATA_KEY, [
      "handler",
      "class",
    ])
  })

  it("should log non-create actions with context and entityFrom metadata", async () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue({
        action: "project.update",
        entityFrom: "project",
      }),
    } as unknown as Reflector

    const activitiesService = {
      createActivity: jest.fn().mockResolvedValue(undefined),
    } as unknown as ActivitiesService

    const interceptor = new ActivitiesInterceptor(reflector, activitiesService)
    const context = buildContext({
      user: { id: "user-id" },
      organizationId: "organization-id",
      project: { id: "project-uuid", name: "P" },
    })

    await new Promise<void>((resolve, reject) => {
      interceptor.intercept(context, callHandler).subscribe({
        complete: () => resolve(),
        error: reject,
      })
    })

    expect(activitiesService.createActivity).toHaveBeenCalledWith({
      action: "project.update",
      userId: "user-id",
      organizationId: "organization-id",
      projectId: "project-uuid",
      entityId: "project-uuid",
      entityType: "project",
    })
  })

  it("should not infer entity from path params when entityFrom is omitted", async () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue({ action: "project.archive" }),
    } as unknown as Reflector

    const activitiesService = {
      createActivity: jest.fn().mockResolvedValue(undefined),
    } as unknown as ActivitiesService

    const interceptor = new ActivitiesInterceptor(reflector, activitiesService)
    const context = buildContext({
      user: { id: "user-id" },
      organizationId: "organization-id",
      project: { id: "project-uuid" },
      params: { documentId: "document-id" },
    })

    await new Promise<void>((resolve, reject) => {
      interceptor.intercept(context, callHandler).subscribe({
        complete: () => resolve(),
        error: reject,
      })
    })

    expect(activitiesService.createActivity).toHaveBeenCalledWith({
      action: "project.archive",
      userId: "user-id",
      organizationId: "organization-id",
      projectId: "project-uuid",
      entityId: null,
      entityType: null,
    })
  })
})
