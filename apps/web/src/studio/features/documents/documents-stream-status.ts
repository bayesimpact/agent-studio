import { createStreamStatusManager } from "@/common/sse/stream-status-manager"
import type { AppDispatch, RootState } from "@/common/store/types"
import {
  selectHasDocumentsInProgress,
  selectIsEmbeddingStatusStreamActive,
} from "./documents.selectors"
import { listDocuments, streamDocumentEmbeddingStatuses } from "./documents.thunks"

type AbortableStreamTask = { abort: () => void; unwrap: () => Promise<void> }
type StreamListenerApi = {
  dispatch: AppDispatch
  getState: () => RootState
}

const manager = createStreamStatusManager({
  selectIsStreamActive: selectIsEmbeddingStatusStreamActive,
  selectHasItemsInProgress: selectHasDocumentsInProgress,
  dispatchStreamThunk: (listenerApi) =>
    listenerApi.dispatch(streamDocumentEmbeddingStatuses()) as unknown as AbortableStreamTask,
  dispatchRefresh: (listenerApi) => listenerApi.dispatch(listDocuments()),
})

export function stopDocumentEmbeddingStatusStream() {
  manager.stop()
}

export function syncDocumentEmbeddingStatusStreamWithDocuments(
  listenerApi: StreamListenerApi,
): void {
  manager.sync(listenerApi)
}

export async function handleDocumentsContextChanged(listenerApi: StreamListenerApi): Promise<void> {
  await listenerApi.dispatch(listDocuments())
  syncDocumentEmbeddingStatusStreamWithDocuments(listenerApi)
}

export async function startDocumentEmbeddingStatusStream(
  listenerApi: StreamListenerApi,
): Promise<void> {
  await manager.start(listenerApi)
}
