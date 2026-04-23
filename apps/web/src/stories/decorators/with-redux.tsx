import { combineReducers, configureStore } from "@reduxjs/toolkit"
import type { Decorator } from "@storybook/react-vite"
import { Provider } from "react-redux"
import type { Project } from "@/common/features/projects/projects.models"
import { ADS } from "@/common/store/async-data-status"
import { rootSliceList } from "@/common/store/root-slices"
import type { Services } from "@/di/services"
import type { DocumentTag } from "@/studio/features/document-tags/document-tags.models"
import type {
  ReviewCampaign,
  ReviewCampaignDetail,
} from "@/studio/features/review-campaigns/review-campaigns.models"
import type {
  MyReviewCampaign,
  TesterCampaignSurvey,
  TesterContext,
} from "@/studio/features/review-campaigns/tester/tester.models"
import type { LocalSessionSummary } from "@/studio/features/review-campaigns/tester/tester.slice"
import { studioSliceList } from "@/studio/store/slices"

const studioReducer = combineReducers(
  Object.assign({}, ...studioSliceList.map((slice) => ({ [slice.name]: slice.reducer }))),
)

const mockRootReducer = combineReducers(
  Object.assign({}, ...rootSliceList.map((slice) => ({ [slice.name]: slice.reducer })), {
    studio: studioReducer,
  }),
)

type MockRootReducerState = ReturnType<typeof mockRootReducer>

export type StoryMockState = {
  currentProject?: Project
  documentTags?: DocumentTag[]
  reviewCampaigns?: ReviewCampaign[]
  selectedReviewCampaignDetail?: ReviewCampaignDetail
  myReviewCampaigns?: MyReviewCampaign[]
  testerContext?: TesterContext
  testerLocalSessionsByCampaignId?: Record<string, LocalSessionSummary[]>
  testerSurveyByCampaignId?: Record<string, TesterCampaignSurvey>
  /**
   * When set, thunks are enabled and `extra.services` uses these mocks.
   * Services not overridden will throw at dispatch time, which is fine for
   * stories that only exercise a subset of thunks.
   */
  servicesMock?: Partial<Services>
}

function buildMockPreloadedState({
  currentProject,
  documentTags,
  reviewCampaigns,
  selectedReviewCampaignDetail,
  myReviewCampaigns,
  testerContext,
  testerLocalSessionsByCampaignId,
  testerSurveyByCampaignId,
}: StoryMockState): Partial<MockRootReducerState> {
  const studioInitial = studioReducer(undefined, { type: "@@INIT" }) as ReturnType<
    typeof studioReducer
  >
  const organizationId = currentProject?.organizationId ?? null
  return {
    organizations: {
      currentOrganizationId: organizationId,
      data: organizationId
        ? {
            status: ADS.Fulfilled,
            error: null,
            value: [
              {
                id: organizationId,
                name: "Mock organization",
                createdAt: Date.now(),
                updatedAt: Date.now(),
              },
            ],
          }
        : { status: ADS.Uninitialized, error: null, value: null },
    },
    projects: {
      currentProjectId: currentProject?.id ?? null,
      data: currentProject
        ? { status: ADS.Fulfilled, error: null, value: [currentProject] }
        : { status: ADS.Uninitialized, error: null, value: null },
    },
    studio: {
      ...studioInitial,
      documentTags: {
        data: documentTags
          ? { status: ADS.Fulfilled, error: null, value: documentTags }
          : { status: ADS.Uninitialized, error: null, value: null },
      },
      reviewCampaigns: {
        data: reviewCampaigns
          ? { status: ADS.Fulfilled, error: null, value: reviewCampaigns }
          : { status: ADS.Uninitialized, error: null, value: null },
        selectedDetail: selectedReviewCampaignDetail
          ? { status: ADS.Fulfilled, error: null, value: selectedReviewCampaignDetail }
          : { status: ADS.Uninitialized, error: null, value: null },
      },
      reviewCampaignsTester: {
        myCampaigns: myReviewCampaigns
          ? { status: ADS.Fulfilled, error: null, value: myReviewCampaigns }
          : { status: ADS.Uninitialized, error: null, value: null },
        selectedContext: testerContext
          ? { status: ADS.Fulfilled, error: null, value: testerContext }
          : { status: ADS.Uninitialized, error: null, value: null },
        selectedFeedbackBySessionId: {},
        selectedSurveyByCampaignId: testerSurveyByCampaignId ?? {},
        mySessionsByCampaignId: testerLocalSessionsByCampaignId ?? {},
      },
    },
  } as Partial<MockRootReducerState>
}

export function buildMockStore(state: StoryMockState = {}) {
  const { servicesMock } = state
  return configureStore({
    reducer: mockRootReducer,
    preloadedState: buildMockPreloadedState(state),
    middleware: (getDefault) =>
      servicesMock
        ? getDefault({
            thunk: { extraArgument: { services: servicesMock as Services } },
            serializableCheck: false,
          })
        : getDefault({ thunk: false, serializableCheck: false }),
  })
}

export function withRedux(state: StoryMockState = {}): Decorator {
  const store = buildMockStore(state)
  return (Story) => (
    <Provider store={store}>
      <Story />
    </Provider>
  )
}
