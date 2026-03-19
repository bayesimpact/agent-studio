import type { AppDispatch, RootState } from "@/store/types"
import { selectIsAdminInterface } from "../auth/auth.selectors"
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

let documentStreamTask: AbortableStreamTask | null = null
let streamReconnectTimeout: ReturnType<typeof setTimeout> | null = null
let streamGeneration = 0

function clearStreamReconnectTimeout() {
  if (!streamReconnectTimeout) return
  clearTimeout(streamReconnectTimeout)
  streamReconnectTimeout = null
}

export function stopDocumentEmbeddingStatusStream() {
  streamGeneration += 1
  documentStreamTask?.abort()
  documentStreamTask = null
  clearStreamReconnectTimeout()
}

function shouldKeepDocumentEmbeddingStatusStreamRunning(params: {
  listenerApi: StreamListenerApi
  generation: number
}): boolean {
  if (params.generation !== streamGeneration) return false
  const state = params.listenerApi.getState()
  if (!selectIsEmbeddingStatusStreamActive(state)) return false
  if (!selectIsAdminInterface(state)) return false
  return true
}

async function waitForReconnectDelay(reconnectDelayMs: number): Promise<void> {
  await new Promise<void>((resolvePromise) => {
    streamReconnectTimeout = setTimeout(() => {
      streamReconnectTimeout = null
      resolvePromise()
    }, reconnectDelayMs)
  })
}

async function runDocumentEmbeddingStatusStreamLoop(
  listenerApi: StreamListenerApi,
  generation: number,
  reconnectAttemptCount = 0,
) {
  if (!shouldKeepDocumentEmbeddingStatusStreamRunning({ listenerApi, generation })) {
    return
  }

  const streamTask = listenerApi.dispatch(
    streamDocumentEmbeddingStatuses(),
  ) as unknown as AbortableStreamTask
  documentStreamTask = streamTask

  try {
    await streamTask.unwrap()
    documentStreamTask = null
    return
  } catch {
    documentStreamTask = null
    if (!shouldKeepDocumentEmbeddingStatusStreamRunning({ listenerApi, generation })) {
      return
    }

    const nextReconnectAttemptCount = reconnectAttemptCount + 1
    const reconnectDelayMs = Math.min(15_000, 1_000 * 2 ** (nextReconnectAttemptCount - 1))
    await waitForReconnectDelay(reconnectDelayMs)

    if (!shouldKeepDocumentEmbeddingStatusStreamRunning({ listenerApi, generation })) {
      return
    }

    await listenerApi.dispatch(listDocuments())
    await runDocumentEmbeddingStatusStreamLoop(listenerApi, generation, nextReconnectAttemptCount)
  }
}

export function syncDocumentEmbeddingStatusStreamWithDocuments(
  listenerApi: StreamListenerApi,
): void {
  const state = listenerApi.getState()
  const shouldKeepStreamRunning =
    selectIsEmbeddingStatusStreamActive(state) &&
    selectIsAdminInterface(state) &&
    selectHasDocumentsInProgress(state)

  if (!shouldKeepStreamRunning) {
    stopDocumentEmbeddingStatusStream()
    return
  }

  if (documentStreamTask) {
    return
  }

  const generation = streamGeneration
  void runDocumentEmbeddingStatusStreamLoop(listenerApi, generation)
}

export async function handleDocumentsContextChanged(listenerApi: StreamListenerApi): Promise<void> {
  const state = listenerApi.getState()
  const isAdminInterface = selectIsAdminInterface(state)
  if (!isAdminInterface) {
    stopDocumentEmbeddingStatusStream()
    return
  }

  await listenerApi.dispatch(listDocuments())
  syncDocumentEmbeddingStatusStreamWithDocuments(listenerApi)
}

export async function startDocumentEmbeddingStatusStream(
  listenerApi: StreamListenerApi,
): Promise<void> {
  if (!selectIsAdminInterface(listenerApi.getState())) return
  await listenerApi.dispatch(listDocuments())
  syncDocumentEmbeddingStatusStreamWithDocuments(listenerApi)
}
