import fetch from "node-fetch"

const baseUrl = "https://google-medgemma-1-5-4b-it-228409355387.europe-west4.run.app/v1"

const endpoints = [
  { name: "models", method: "GET", path: "/models" },
  {
    name: "chat completions",
    method: "POST",
    path: "/chat/completions",
    body: {
      model: "your-model-name",
      messages: [{ role: "user", content: "Hello" }],
    },
  },
  {
    name: "completions",
    method: "POST",
    path: "/completions",
    body: {
      model: "your-model-name",
      prompt: "Hello",
    },
  },
  {
    name: "embeddings",
    method: "POST",
    path: "/embeddings",
    body: {
      model: "your-model-name",
      input: "Hello",
    },
  },
  {
    name: "tokenize",
    method: "POST",
    path: "/tokenize",
    body: {
      model: "your-model-name",
      input: "Hello",
    },
  },
]

async function testEndpoint(ep) {
  const url = baseUrl + ep.path

  try {
    const res = await fetch(url, {
      method: ep.method,
      headers: { "Content-Type": "application/json" },
      body: ep.method === "POST" ? JSON.stringify(ep.body) : undefined,
    })

    const text = await res.text()

    if (res.ok) {
      console.log(`${ep.name} OK (${res.status})`)
      console.log("Response:", text.slice(0, 120), "...")
    } else {
      console.log(`${ep.name} FAILED (${res.status})`)
      console.log("Response:", text.slice(0, 120), "...")
    }
  } catch (err) {
    console.log(`${ep.name} NOT IMPLEMENTED / CONNECTION ERROR`)
    // @ts-expect-error
    console.log("Error:", err.message)
  }
}

describe("test endpoints", () => {
  it("test endpoints", async () => {
    for (const ep of endpoints) {
      await testEndpoint(ep)
    }
  })
})
