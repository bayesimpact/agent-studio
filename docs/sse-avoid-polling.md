# Using SSE to Avoid Polling

This note explains when to use Server-Sent Events (SSE) instead of polling, and how we apply it for document embedding status updates.

## Why avoid polling

Polling means the frontend repeatedly asks the API for the same data every few seconds:

- wasted requests when nothing changes
- slower UI updates between polling intervals
- unnecessary load on the API and database

SSE is a better fit when the server needs to push small, one-way updates to the browser as soon as they happen.

## When SSE is a good choice

Use SSE when all of these are true:

- the browser only needs to receive updates from the server
- updates are incremental and event-shaped
- the client can recover by re-fetching state after reconnect
- a full two-way protocol like WebSocket would be overkill

For document embeddings, SSE is a good match because the browser only needs to learn that a document status changed from `pending` to `processing`, `completed`, or `failed`.

## Architecture used in this repository

For document embedding statuses, the flow is:

1. the worker updates `documents.embedding_status`
2. the worker publishes a Postgres notification with `pg_notify(...)`
3. the API keeps a long-lived `LISTEN` connection open
4. the documents SSE endpoint filters events by `organizationId` and `projectId`
5. the web app opens the SSE stream only while the Documents page is mounted
6. Redux patches the matching document row in place

This gives us real-time updates without polling the full document list repeatedly.

## Why combine PG notifications with SSE

`pg_notify(...)` solves server-to-server delivery inside the backend boundary:

- workers can notify the API process immediately
- the API does not need to poll the database

SSE solves server-to-browser delivery:

- the browser keeps one HTTP stream open
- the API pushes each matching event to connected clients

Together they replace both backend polling and frontend polling.

## Recommended frontend pattern

Keep components light and let Redux own the transport side effects:

- the route dispatches `startEmbeddingStatusStream` on mount
- the route dispatches `stopEmbeddingStatusStream` on unmount
- middleware opens the SSE connection
- middleware dispatches a reducer action for each event
- middleware reconnects with backoff if the stream drops
- after reconnect, middleware re-fetches the list once to resync

This pattern keeps network logic out of React components and follows the existing Redux architecture.

## Recommended event shape

Keep SSE payloads small and explicit. For embedding updates we use:

- `type`
- `documentId`
- `organizationId`
- `projectId`
- `embeddingStatus`
- `updatedAt`

This is enough to patch the correct row and ignore stale events.

## Important caveats

- SSE is not a message queue; missed events are not replayed automatically
- Postgres `NOTIFY` is also ephemeral and should stay small
- the client should always be able to recover by calling the normal list endpoint
- the API should use one dedicated listener connection, not one `LISTEN` connection per request

## Rule of thumb

If the UI needs live, one-way updates and can recover with a normal refetch, prefer SSE over polling.
