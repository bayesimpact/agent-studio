import { type FunctionCall, type FunctionDeclaration, Type } from "@google/genai"
import { Injectable } from "@nestjs/common"
import axios from "axios"
import type { AIServiceProvider } from "../common/interfaces/ai-service.interface"
import { SimplifiedWorkshop } from "./models/simplified-workshop.model"
import type {
  NotionDataBaseQueryResponse,
  NotionDatabaseBasePropertyDate,
  NotionDatabaseBasePropertyNumber,
  NotionDatabaseBasePropertyRichText,
  NotionDatabaseBasePropertySelect,
  NotionDatabaseBasePropertyStatus,
  NotionDatabaseBasePropertyTitle,
} from "./types/notion.types"
import type { Workshop } from "./types/workshop.types"

@Injectable()
export class NotionWorkshopService implements AIServiceProvider {
  private readonly notionApiUrl = process.env.NOTION_API_URL || "https://api.notion.com/v1"
  private readonly notionSecret = process.env.NOTION_SECRET
  private readonly notionFrDatabaseId =
    process.env.NOTION_FR_DATABASE_ID || "e3b5ba04a6b94e6a845c604ae46bcee6"
  private readonly notionUsDatabaseId =
    process.env.NOTION_US_DATABASE_ID || "2a37d19cc82581569dbde2244d994d84"

  getFunctionDeclaration(): FunctionDeclaration {
    return {
      name: "workshops_search",
      description:
        "Search for workshops, training sessions, and professional events (ateliers, formations, événements professionnels)",
      parameters: {
        type: Type.OBJECT,
        properties: {
          cityName: {
            type: Type.ARRAY,
            description: "City name in French",
            items: {
              type: Type.STRING,
            },
          },
          country: {
            type: Type.STRING,
            description: "Country code fr or us, provided inside the prompt",
          },
        },
        required: ["cityName", "country"],
      },
    }
  }

  getPromptContext(): string {
    return `
### Tool: \`workshops_search\`
**Description**: Search for workshops, training sessions, and professional events from Notion database.

**Parameters**:
- \`cityName\`: City name (required)
- \`country\`: us or fr provided by the prompt

**Returns**: List of workshops with title, date, location, capacity, signup URL, type, and description
`
  }

  async executeFunction(functionCall: FunctionCall): Promise<{ workshops: SimplifiedWorkshop[] }> {
    const workshopTypes = functionCall.args?.workshopTypes as string[]
    const startDate = functionCall.args?.startDate as string | undefined
    const country = functionCall.args?.country as "us" | "fr"

    console.log("Function calling workshops with params:", workshopTypes, startDate)

    const workshops = await this.searchWorkshops(country)
    console.log("Workshops found: ", workshops.length)
    return { workshops }
  }

  async searchWorkshops(country: "us" | "fr"): Promise<SimplifiedWorkshop[]> {
    if (!this.notionSecret) {
      console.error("NOTION_SECRET is not configured")
      return []
    }

    try {
      console.log(`Calling workshops search (returning all items)`)

      // Simple query body - no filters for first version, just return all items
      const queryBody = {
        page_size: 100,
        sorts: [
          {
            property: "Date",
            direction: "ascending",
          },
        ],
      }
      const notionDatabaseId = country === "us" ? this.notionUsDatabaseId : this.notionFrDatabaseId
      const { data } = await axios.post<NotionDataBaseQueryResponse>(
        `${this.notionApiUrl}/databases/${notionDatabaseId}/query`,
        queryBody,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.notionSecret}`,
            "Notion-Version": "2022-06-28",
          },
        },
      )

      // Parse Notion API response
      if (!data.results || data.results.length === 0) {
        console.log("No workshops found in database")
        return []
      }

      console.log(`Found ${data.results.length} workshops in Notion database`)

      // Transform Notion pages to workshops
      const workshops = this.parseNotionPages(data.results)
      return SimplifiedWorkshop.fromWorkshops(workshops)
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Notion API error:", error.response?.status, error.response?.data)
      } else {
        console.error("Error fetching workshops:", error)
      }
      return []
    }
  }

  private parseNotionPages(pages: NotionDataBaseQueryResponse["results"]): Workshop[] {
    return pages
      .map((page) => {
        const properties = page.properties

        // Helper to get property values from Notion's complex structure
        const getTitle = (prop?: NotionDatabaseBasePropertyTitle) =>
          prop?.title?.[0]?.plain_text || ""
        const getRichText = (prop?: NotionDatabaseBasePropertyRichText) =>
          prop?.rich_text?.[0]?.plain_text || ""
        const getSelect = (prop?: NotionDatabaseBasePropertySelect) => prop?.select?.name || ""
        const getStatus = (prop?: NotionDatabaseBasePropertyStatus) => prop?.status?.name || ""
        const getDate = (prop?: NotionDatabaseBasePropertyDate) => prop?.date?.start || null
        const getNumber = (prop?: NotionDatabaseBasePropertyNumber) => prop?.number || 0

        // Based on actual Notion response structure
        const title = getTitle(
          properties["Intitulé de la session"] as NotionDatabaseBasePropertyTitle,
        )
        const atelierName = getRichText(
          properties["Atelier (nom)"] as NotionDatabaseBasePropertyRichText,
        )
        const date = getDate(properties.Date as NotionDatabaseBasePropertyDate)
        const capacity = getNumber(properties.Capacité as NotionDatabaseBasePropertyNumber)
        // const signupUrl = getUrl(properties["Lien d'inscription"]);
        const status = getStatus(properties.Statut as NotionDatabaseBasePropertyStatus)
        const type = getSelect(properties.Type as NotionDatabaseBasePropertySelect)
        const locationText = getRichText(properties.Lieu as NotionDatabaseBasePropertyRichText)
        const organizer = getRichText(properties.Organisateur as NotionDatabaseBasePropertyRichText)
        const description = getRichText(
          properties["Description (atelier)"] as NotionDatabaseBasePropertyRichText,
        )

        if (!date) {
          console.error("No date found for workshop:", page.id)
          return null
        }

        return {
          id: page.id,
          title: title || atelierName,
          date: {
            start: date,
            end: null,
            is_datetime: false,
          },
          capacity: capacity,
          signup_url: "NO CTA DO NOT INCLUDE IT INSIDE YOUR ACTION PLAN",
          status: status,
          atelier_name: atelierName,
          type: type,
          location_text: locationText,
          location_place: {
            name: locationText,
            address: locationText,
            latitude: 0,
            longitude: 0,
            google_place_id: "",
          },
          organizer: organizer,
          atelier_description: description,
        }
      })
      .filter((workshop) => workshop !== null) as Workshop[]
  }
}
