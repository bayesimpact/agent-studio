import type { RootState } from "@/common/store"

export const selectFilesData = (state: RootState) => state.evaluation.datasets.files
export const selectUploaderState = (state: RootState) => state.evaluation.datasets.uploader
export const selectColumnsData = (state: RootState) => state.evaluation.datasets.columns
