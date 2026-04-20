import { combineReducers, configureStore } from "@reduxjs/toolkit"
import type { Decorator } from "@storybook/react-vite"
import { Provider } from "react-redux"
import type { Project } from "@/common/features/projects/projects.models"
import { ADS } from "@/common/store/async-data-status"
import { rootSliceList } from "@/common/store/root-slices"
import type { DocumentTag } from "@/studio/features/document-tags/document-tags.models"
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
}

function buildMockPreloadedState({
  currentProject,
  documentTags,
}: StoryMockState): Partial<MockRootReducerState> {
  return {
    projects: {
      currentProjectId: currentProject?.id ?? null,
      data: currentProject
        ? { status: ADS.Fulfilled, error: null, value: [currentProject] }
        : { status: ADS.Uninitialized, error: null, value: null },
    },
    studio: {
      ...(studioReducer(undefined, { type: "@@INIT" }) as ReturnType<typeof studioReducer>),
      documentTags: {
        data: documentTags
          ? { status: ADS.Fulfilled, error: null, value: documentTags }
          : { status: ADS.Uninitialized, error: null, value: null },
      },
    },
  } as Partial<MockRootReducerState>
}

export function buildMockStore(state: StoryMockState = {}) {
  return configureStore({
    reducer: mockRootReducer,
    preloadedState: buildMockPreloadedState(state),
    middleware: (getDefault) => getDefault({ thunk: false, serializableCheck: false }),
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
