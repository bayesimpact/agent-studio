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

  // biome-ignore lint/correctness/useExhaustiveDependencies: do not add input to dependencies to avoid loop
  const handleRecognition = useCallback(async () => {
    SpeechRecognition.getRecognition()?.addEventListener("error", (event) => {
      console.error("SpeechRecognition error", event)
    })

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
