import type { ResourceLibrary } from "@/domains/resource-libraries/resource-library.entity"
import { surfaceResourcesTool } from "./surface-resources.tool"
import { createSurfacedResourcesRegistry } from "./surfaced-resources-registry"

function buildLibrary(overrides: Partial<ResourceLibrary> = {}): ResourceLibrary {
  return {
    id: "lib-1",
    organizationId: "org-1",
    projectId: "proj-1",
    title: "Guides",
    resources: [
      {
        id: "aaaaaaaa-0000-4000-8000-000000000001",
        title: "Getting Started",
        description: "The basics.",
        linkType: "url",
        url: "https://example.com/start",
      },
      {
        id: "aaaaaaaa-0000-4000-8000-000000000002",
        title: "Charge sample",
        description: "Charge explanation.",
        linkType: "file",
        file: {
          storageRelativePath: "org-1/proj-1/charge.png",
          fileName: "charge.png",
          mimeType: "image/png",
        },
      },
    ],
    agents: [],
    ...overrides,
  } as ResourceLibrary
}

describe("surfaceResourcesTool (alias registry)", () => {
  it("resolves aliases to the full resources (real id, computed link) in the log", async () => {
    const onExecute = jest.fn()
    const sdkTool = surfaceResourcesTool({
      surfacedResourcesRegistry: createSurfacedResourcesRegistry([buildLibrary()]),
      onExecute,
    })

    await sdkTool.execute?.({ resourceIds: ["r1", "r2"] }, {} as never)

    expect(onExecute).toHaveBeenCalledWith({
      toolName: "surfaceResources",
      arguments: {
        resources: [
          {
            id: "aaaaaaaa-0000-4000-8000-000000000001",
            title: "Getting Started",
            description: "The basics.",
            link: "https://example.com/start",
          },
          {
            id: "aaaaaaaa-0000-4000-8000-000000000002",
            title: "Charge sample",
            description: "Charge explanation.",
            link: "/organizations/org-1/projects/proj-1/resource-libraries/lib-1/resources/aaaaaaaa-0000-4000-8000-000000000002/file",
          },
        ],
      },
    })
  })

  it("reports unknown aliases instead of inventing resources, and dedupes citations", async () => {
    const onExecute = jest.fn()
    const sdkTool = surfaceResourcesTool({
      surfacedResourcesRegistry: createSurfacedResourcesRegistry([buildLibrary()]),
      onExecute,
    })

    await sdkTool.execute?.({ resourceIds: ["r1", "r1", "r9"] }, {} as never)

    const loggedArguments = onExecute.mock.calls[0]?.[0]?.arguments
    expect(loggedArguments.resources).toHaveLength(1)
    expect(loggedArguments.unknownResourceIds).toEqual(["r9"])
  })

  it("tolerates alias case and whitespace", async () => {
    const onExecute = jest.fn()
    const sdkTool = surfaceResourcesTool({
      surfacedResourcesRegistry: createSurfacedResourcesRegistry([buildLibrary()]),
      onExecute,
    })

    await sdkTool.execute?.({ resourceIds: [" R1 "] }, {} as never)

    expect(onExecute.mock.calls[0]?.[0]?.arguments.resources).toHaveLength(1)
  })
})
