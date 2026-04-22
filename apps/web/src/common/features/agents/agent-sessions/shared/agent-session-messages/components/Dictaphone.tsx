import { Button } from "@caseai-connect/ui/shad/button"
import { MicIcon } from "lucide-react"
import { useCallback, useEffect } from "react"
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition"
import { useChatFooter } from "@/common/features/agents/agent-sessions/shared/agent-session-messages/components/context"
import { getLocale } from "@/common/utils/get-locale"

export function Dictaphone({ disabled }: { disabled: boolean }) {
  const { input } = useChatFooter()
  const {
    listening,
    transcript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
    resetTranscript,
  } = useSpeechRecognition()

  const language = getLocale().code

  // biome-ignore lint/correctness/useExhaustiveDependencies: do not add input to dependencies to avoid loop
  useEffect(() => {
    if (transcript.trim().length > 0) input.setValue(transcript)
  }, [transcript])

  useEffect(() => {
    if (input.value.trim().length === 0) resetTranscript()
  }, [input.value, resetTranscript])

  useEffect(() => {
    const mic = navigator.permissions
      ?.query({ name: "microphone" as PermissionName })
      .then((status) => status.state)
      .catch(() => "unknown")
    const featurePolicy = (
      document as unknown as {
        featurePolicy?: { getAllowlistForFeature?: (feature: string) => string[] }
      }
    ).featurePolicy
    const allowlist = featurePolicy?.getAllowlistForFeature?.("microphone")
    Promise.resolve(mic).then((state) => {
      console.info("[Dictaphone] diagnostics", {
        isSecureContext: window.isSecureContext,
        hasSpeechRecognition: !!(
          window.SpeechRecognition ||
          (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition
        ),
        browserSupportsSpeechRecognition,
        isMicrophoneAvailable,
        micPermission: state,
        microphoneAllowlist: allowlist,
        origin: window.location.origin,
      })
    })
  }, [browserSupportsSpeechRecognition, isMicrophoneAvailable])

  useEffect(() => {
    const recognition = SpeechRecognition.getRecognition()
    if (!recognition) return
    const onError = (event: Event) => {
      console.error("[Dictaphone] SpeechRecognition error", {
        error: (event as unknown as { error?: string }).error,
        message: (event as unknown as { message?: string }).message,
        event,
      })
    }
    recognition.addEventListener("error", onError)
    return () => recognition.removeEventListener("error", onError)
  }, [])

  // biome-ignore lint/correctness/useExhaustiveDependencies: do not add input to dependencies to avoid loop
  const handleRecognition = useCallback(async () => {
    if (listening) {
      input.setDisabled(false)
      await SpeechRecognition.stopListening()
    } else {
      input.setDisabled(true)
      SpeechRecognition.startListening({ language, continuous: true, interimResults: true })
    }
  }, [listening, language])

  if (!browserSupportsSpeechRecognition) {
    console.error("Speech Recognition API not supported in this browser")
    return null
  }

  if (!isMicrophoneAvailable) {
    console.error("Microphone not available")
    return null
  }

  return (
    <Button
      variant={listening ? "default" : "ghost"}
      disabled={disabled}
      onClick={handleRecognition}
    >
      <MicIcon className={listening ? "animate-pulse" : ""} />
    </Button>
  )
}
