import { createAsyncThunk } from "@reduxjs/toolkit"
import type { RootState, ThunkExtraArg } from "@/store"
import type { Organization } from "./organizations.models"

type ThunkConfig = { state: RootState; extra: ThunkExtraArg }

export const createOrganization = createAsyncThunk<Organization, { name: string }, ThunkConfig>(
  "organizations/create",
  async (payload, { extra: { services } }) => {
    return await services.organizations.createOrganization(payload)
  },
)
