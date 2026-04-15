import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit"
import { notificationsActions } from "@/common/features/notifications/notifications.slice"
import type { AppDispatch, RootState } from "@/common/store/types"
import { datasetsActions } from "./datasets.slice"

const listenerMiddleware = createListenerMiddleware<RootState, AppDispatch>()

function registerListeners() {
  listenerMiddleware.startListening({
    actionCreator: datasetsActions.initData,
    effect: async (_, listenerApi) => {
      await Promise.all([
        listenerApi.dispatch(datasetsActions.listDatasets()),
        listenerApi.dispatch(datasetsActions.listFiles()),
      ])
    },
  })

  listenerMiddleware.startListening({
    matcher: isAnyOf(datasetsActions.createOne.fulfilled, datasetsActions.updateOne.fulfilled),
    effect: async (_, listenerApi) => {
      listenerApi.dispatch(datasetsActions.listDatasets())
    },
  })

  listenerMiddleware.startListening({
    actionCreator: datasetsActions.createOne.fulfilled,
    effect: async (action, listenerApi) => {
      listenerApi.dispatch(
        notificationsActions.show({
          title: `${action.meta.arg.name} created successfully`,
          type: "success",
        }),
      )
    },
  })
  listenerMiddleware.startListening({
    actionCreator: datasetsActions.createOne.rejected,
    effect: async (action, listenerApi) => {
      listenerApi.dispatch(
        notificationsActions.show({
          title: `${action.meta.arg.name} creation failed`,
          type: "error",
        }),
      )
    },
  })

  listenerMiddleware.startListening({
    actionCreator: datasetsActions.updateOne.fulfilled,
    effect: async (action, listenerApi) => {
      listenerApi.dispatch(
        notificationsActions.show({
          title: `${action.meta.arg.name} updated successfully`,
          type: "success",
        }),
      )
    },
  })
  listenerMiddleware.startListening({
    actionCreator: datasetsActions.updateOne.rejected,
    effect: async (action, listenerApi) => {
      listenerApi.dispatch(
        notificationsActions.show({
          title: `${action.meta.arg.name} update failed`,
          type: "error",
        }),
      )
    },
  })

  registerFileListeners()
}

export const datasetsMiddleware = { listenerMiddleware, registerListeners }

function registerFileListeners() {
  listenerMiddleware.startListening({
    matcher: isAnyOf(datasetsActions.uploadFile.fulfilled, datasetsActions.deleteFile.fulfilled),
    effect: async (_, listenerApi) => {
      await Promise.all([listenerApi.dispatch(datasetsActions.listFiles())])
    },
  })

  listenerMiddleware.startListening({
    actionCreator: datasetsActions.uploadFile.pending,
    effect: async (action, listenerApi) => {
      listenerApi.dispatch(
        notificationsActions.show({
          title: `Uploading ${action.meta.arg.file.name}...`,
          type: "info",
        }),
      )
    },
  })
  listenerMiddleware.startListening({
    actionCreator: datasetsActions.uploadFile.fulfilled,
    effect: async (action, listenerApi) => {
      listenerApi.dispatch(
        notificationsActions.show({
          title: `${action.meta.arg.file.name} uploaded successfully`,
          type: "success",
        }),
      )
    },
  })
  listenerMiddleware.startListening({
    actionCreator: datasetsActions.uploadFile.rejected,
    effect: async (action, listenerApi) => {
      listenerApi.dispatch(
        notificationsActions.show({
          title: `${action.meta.arg.file.name} upload failed`,
          type: "error",
        }),
      )
    },
  })

  listenerMiddleware.startListening({
    actionCreator: datasetsActions.deleteFile.fulfilled,
    effect: async (_, listenerApi) => {
      listenerApi.dispatch(
        notificationsActions.show({
          title: "File deleted successfully",
          type: "success",
        }),
      )
    },
  })
  listenerMiddleware.startListening({
    actionCreator: datasetsActions.deleteFile.rejected,
    effect: async (_, listenerApi) => {
      listenerApi.dispatch(
        notificationsActions.show({
          title: "File deletion failed",
          type: "error",
        }),
      )
    },
  })
}
