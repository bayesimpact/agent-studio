export class TestTools {
  public status: "completed" | "in_progress" | undefined = undefined
  public actualFormState: {
    happy?: boolean
    hourOfSleep?: number | null
    weight?: number | null
  } = {}

  private tools = {
    validateAndSetFormFieldsValues: async (args: {
      happy?: boolean
      hourOfSleep?: number | null
      weight?: number | null
    }) => {
      this.status =
        args.happy !== undefined && (args.hourOfSleep ?? 0) > 0 && (args.weight ?? 0) > 0
          ? "completed"
          : "in_progress"
      this.actualFormState = { ...args }
      return {
        status: this.status,
        actualFormState: this.actualFormState,
      }
    },
  }

  private systemPrompt = `
<SYSTEM>
Today's date: 10/03/2026
Instructions:
Your main task is to help the user fill out the form by asking questions and providing guidance. 
Ask one question at a time to fill out the form.
Fill out the information you have and ask the user for the missing information. 
Here are the fields to fill:
    happy: Is happy?
    hourOfSleep: How many sleep hours per day?
    weight: weight in kilogrammes (rounded .5)?
Each time you get a user answer that can fill the form's fields just call the tool "validateAndSetFormFieldsValues", do nothing else
If the tool does not return a status "completed", continue asking the user about the missing fields'.

Response language:
Always answer in English.

When you need to call a tool, output ONLY the following format:

<toolcall>
{"name": "...", "args": {...}}
</toolcall>

Do not add explanations.
Do not add text before or after.
Do not escape JSON.


Here are the available tools:
<TOOLS>
<TOOL name = "validateAndSetFormFieldsValues">
description: Validate fields filled with user-provided data and return the form status and the actualFormState.
arguments:
{
  "happy": boolean | undefined,
  "hourOfSleep": number | null | undefined,
  "weight": number | null | undefined
}

returned value:
{
  "status": "completed" | "in_progress",
  "actualFormState": {
    "happy": boolean | null,
    "hourOfSleep": number | null,
    "weight": number | null
  }
}

Tool usage:
Each time you think you have a valid response from the user that can fill one or more fields in the form, immediately call the tool with these fields and do nothing else
Always pass the fields that the tool previously returns: BUT you can also update previously filled information if the user changes their answer. 
Pass undefined for fields that are not filled yet.
Pass undefined if you don't know the value; do NOT hallucinate answers
</TOOL>
</SYSTEM>
`

  async callLLM(messages: any[], metadata: any) {
    const response = await fetch(
      "https://google-medgemma-1-5-4b-it-228409355387.europe-west4.run.app/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "xxxx", // vLLM skip it
        },
        body: JSON.stringify({
          model: "google/medgemma-1.5-4b-it",
          messages: [{ role: "system", content: this.systemPrompt }, ...messages],
          temperature: 0,
          metadata,
        }),
      },
    )

    const json = await response.json()
    return json.choices[0].message.content
  }

  extractToolCall(text: string) {
    const match = text.match(/<toolcall>([\s\S]*?)<\/toolcall>/)
    if (!match || !match[1]) {
      return null
    }

    try {
      return JSON.parse(match[1] as string)
    } catch {
      return null
    }
  }

  public async runAgent(
    userMessage: string,
    messagesLLM: Array<{
      role: "user" | "assistant" | "tool"
      content: string
      name?: string
    }> = [],
    metadata: any,
  ): Promise<{
    output: string
    messagesLLM: Array<{
      role: "user" | "assistant" | "tool"
      content: string
      name?: string
    }>
  }> {
    const messagesForLlm: {
      role: "user" | "assistant" | "tool"
      content: string
      name?: string
    }[] = messagesLLM
    if (userMessage.length > 0) messagesForLlm.push({ role: "user", content: userMessage })

    const output = await this.callLLM(messagesForLlm, metadata)

    const toolCall = this.extractToolCall(output)

    if (!toolCall) {
      return {
        output,
        messagesLLM: [...messagesForLlm, { role: "assistant", content: output }],
      }
    }

    const { name, args } = toolCall

    if (!(name in this.tools)) {
      throw new Error(`Unknown tool: ${name}`)
    }

    const result = await this.tools[name as keyof typeof this.tools](args)

    const toolMessage = {
      role: "user" as const,
      content: `Tool "${name}" returns : "${JSON.stringify(result)}"`,
    }

    return this.runAgent(
      "",
      [...messagesForLlm, { role: "assistant", content: output }, toolMessage],
      metadata,
    )
  }
}
