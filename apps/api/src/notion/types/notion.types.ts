// Simplified types for Notion Database API response

export type NotionDataBaseQueryResponse = {
  results: {
    id: string
    properties: {
      [key: string]: NotionDatabaseProperty
    }
  }[]
}

export type NotionDatabaseBasePropertyType =
  | "rich_text"
  | "number"
  | "select"
  | "multi_select"
  | "email"
  | "phone_number"
  | "date"
  | "title"
  | "status"

export type NotionDatabaseBaseProperty = {
  id: string
  type: NotionDatabaseBasePropertyType
}

export type NotionDatabaseBasePropertyTitle = NotionDatabaseBaseProperty & {
  type: "title"
  title: {
    plain_text: string
  }[]
}

export type NotionDatabaseBasePropertyDate = NotionDatabaseBaseProperty & {
  type: "date"
  date: {
    start: string
  }
}

export type NotionDatabaseBasePropertyRichText = NotionDatabaseBaseProperty & {
  type: "rich_text"
  rich_text: {
    plain_text: string
  }[]
}

export type NotionDatabaseBasePropertyNumber = NotionDatabaseBaseProperty & {
  type: "number"
  number: number
}

export type NotionDatabaseBasePropertySelect = NotionDatabaseBaseProperty & {
  type: "select"
  select: {
    name: string
  }
}

export type NotionDatabaseBasePropertyMultiSelect = NotionDatabaseBaseProperty & {
  type: "multi_select"
  multi_select: {
    name: string
  }[]
}

export type NotionDatabaseBasePropertyEmail = NotionDatabaseBaseProperty & {
  type: "email"
  email: string
}

export type NotionDatabaseBasePropertyPhoneNumber = NotionDatabaseBaseProperty & {
  type: "phone_number"
  phone_number: string
}

export type NotionDatabaseBasePropertyStatus = NotionDatabaseBaseProperty & {
  type: "status"
  status: {
    name: string
  }
}
export type NotionDatabaseProperty =
  | NotionDatabaseBasePropertyRichText
  | NotionDatabaseBasePropertyNumber
  | NotionDatabaseBasePropertySelect
  | NotionDatabaseBasePropertyMultiSelect
  | NotionDatabaseBasePropertyEmail
  | NotionDatabaseBasePropertyPhoneNumber
  | NotionDatabaseBasePropertyDate
  | NotionDatabaseBasePropertyTitle
  | NotionDatabaseBasePropertyStatus
