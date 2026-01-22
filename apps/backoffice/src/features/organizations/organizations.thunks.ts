import type {
  CreateOrganizationRequestDto,
  CreateOrganizationResponseDto,
  ResponseData,
} from "@caseai-connect/api-contracts"
import { createAsyncThunk } from "@reduxjs/toolkit"
import type { RootState, ThunkExtraArg } from "@/store"

type ThunkConfig = { state: RootState; extra: ThunkExtraArg }

export const createOrganization = createAsyncThunk<
  ResponseData<CreateOrganizationResponseDto>,
  CreateOrganizationRequestDto,
  ThunkConfig
>("organizations/create", async (payload, { extra }) => {
  const data = await extra.api.organizations.createOrganization(payload)
  return { data }
})
