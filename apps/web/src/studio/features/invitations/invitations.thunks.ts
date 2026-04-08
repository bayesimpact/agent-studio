import { createAsyncThunk } from "@reduxjs/toolkit"
import type { RootState, ThunkExtraArg } from "@/common/store"

type ThunkConfig = { state: RootState; extra: ThunkExtraArg }

export const acceptInvitation = createAsyncThunk<void, { ticketId: string }, ThunkConfig>(
  "invitations/accept",
  async ({ ticketId }, { extra: { services } }) =>
    await services.invitations.acceptInvitation(ticketId),
)
