import { AppBridge, PostMessageTransport } from "@modelcontextprotocol/ext-apps/app-bridge"
import { useEffect, useRef, useState } from "react"

const HOST_INFO = { name: "caseai-connect", version: "1.0.0" }
const INITIALIZE_TIMEOUT_MS = 15_000

/**
 * Outer proxy (unique origin vs the host). It creates an inner iframe and
 * loads the MCP App from a blob URL so Tailwind v4 `@layer` CSS parses as a
 * normal document. `document.write` into the srcdoc iframe left utilities
 * unapplied even though the stylesheet was in the DOM.
 *
 * Inner `allow-same-origin` is same-origin with this proxy only, not the host.
 */
const SANDBOX_BOOTSTRAP_HTML = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      html, body { margin: 0; height: 100%; width: 100%; background: transparent; }
      body { display: flex; flex-direction: column; }
      iframe { border: 0; flex: 1; width: 100%; height: 100%; }
    </style>
  </head>
  <body>
    <script>
      (function () {
        var inner = document.createElement("iframe")
        inner.setAttribute("sandbox", "allow-scripts allow-same-origin")
        inner.setAttribute("title", "MCP App view")
        document.body.appendChild(inner)

        window.addEventListener("message", function (event) {
          if (event.source === window.parent) {
            var data = event.data
            if (data && data.method === "ui/notifications/sandbox-resource-ready") {
              var html = data.params && data.params.html
              if (typeof html === "string") {
                var blob = new Blob([html], { type: "text/html" })
                inner.src = URL.createObjectURL(blob)
              }
              return
            }
            if (inner.contentWindow) inner.contentWindow.postMessage(data, "*")
            return
          }
          if (inner.contentWindow && event.source === inner.contentWindow) {
            window.parent.postMessage(event.data, "*")
          }
        })
      })()
    </script>
  </body>
</html>`

function toToolResult(result: unknown): Parameters<AppBridge["sendToolResult"]>[0] {
  if (result && typeof result === "object" && "content" in result) {
    return result as Parameters<AppBridge["sendToolResult"]>[0]
  }

  return {
    content: [{ type: "text", text: "" }],
    structuredContent:
      result && typeof result === "object"
        ? (result as Record<string, unknown>)
        : { value: result },
  }
}

/**
 * POC host: double iframe without a second domain.
 * Outer frame is sandboxed unique-origin; inner frame loads the MCP App HTML.
 */
export function McpAppView({
  html,
  toolInput,
  toolResult,
}: {
  html: string
  toolInput: unknown
  toolResult: unknown
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [hasFailed, setHasFailed] = useState(false)

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    let cancelled = false
    let started = false
    let bridge: AppBridge | undefined

    const start = async () => {
      if (started || cancelled || !iframe.contentWindow) return
      started = true

      try {
        const appBridge = new AppBridge(
          null,
          HOST_INFO,
          { logging: {}, sandbox: {} },
          {
            hostContext: { displayMode: "inline", platform: "web" },
          },
        )
        bridge = appBridge
        appBridge.onsizechange = ({ height }) => {
          if (typeof height === "number") {
            iframe.style.height = `${height}px`
          }
        }

        const initialized = new Promise<void>((resolve, reject) => {
          const timeoutId = window.setTimeout(() => {
            reject(new Error("MCP App initialization timed out"))
          }, INITIALIZE_TIMEOUT_MS)
          appBridge.oninitialized = () => {
            window.clearTimeout(timeoutId)
            resolve()
          }
        })

        await appBridge.connect(
          new PostMessageTransport(iframe.contentWindow, iframe.contentWindow),
        )
        await appBridge.sendSandboxResourceReady({
          html: html.replace(/<\/iframe/gi, "<\\/iframe"),
        })
        await initialized
        if (cancelled) return

        console.debug("MCP App initialized")
        await appBridge.sendToolInput({
          arguments: (toolInput ?? {}) as Record<string, unknown>,
        })
        await appBridge.sendToolResult(toToolResult(toolResult))
      } catch (error) {
        console.debug(
          "MCP App render failed",
          error instanceof Error ? error.message : "unknown error",
        )
        if (!cancelled) setHasFailed(true)
      }
    }

    const handleLoad = () => {
      void start()
    }

    iframe.addEventListener("load", handleLoad)
    iframe.srcdoc = SANDBOX_BOOTSTRAP_HTML

    return () => {
      cancelled = true
      iframe.removeEventListener("load", handleLoad)
      const currentBridge = bridge
      void currentBridge
        ?.teardownResource({})
        .catch(() => undefined)
        .finally(() => {
          void currentBridge.close()
        })
    }
  }, [html, toolInput, toolResult])

  if (hasFailed) return null

  return (
    <iframe
      ref={iframeRef}
      className="mt-2 w-full overflow-hidden rounded-md border bg-background"
      sandbox="allow-scripts"
      style={{ minHeight: 360, border: 0 }}
      title="MCP App"
    />
  )
}
