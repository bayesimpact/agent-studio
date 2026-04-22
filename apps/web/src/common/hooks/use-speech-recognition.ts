import { useCallback, useEffect, useRef, useState } from "react"

type SpeechRecognitionInstance = {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  addEventListener(type: string, listener: (event: Event) => void): void
  removeEventListener(type: string, listener: (event: Event) => void): void
}

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance

type SpeechRecognitionResult = {
  readonly isFinal: boolean
  readonly 0: { readonly transcript: string }
}

type SpeechRecognitionEventLike = Event & {
  readonly resultIndex: number
  readonly results: ArrayLike<SpeechRecognitionResult>
}

type SpeechRecognitionErrorEventLike = Event & {
  readonly error: string
  readonly message?: string
}

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

interface UseSpeechRecognitionOptions {
  language: string
  continuous?: boolean
  interimResults?: boolean
}

interface UseSpeechRecognitionResult {
  supported: boolean
  listening: boolean
  transcript: string
  start: () => void
  stop: () => void
  resetTranscript: () => void
}

export function useSpeechRecognition({
  language,
  continuous = true,
  interimResults = true,
}: UseSpeechRecognitionOptions): UseSpeechRecognitionResult {
  const [supported] = useState(() => getRecognitionCtor() !== null)
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const finalTranscriptRef = useRef("")

  useEffect(() => {
    const Ctor = getRecognitionCtor()
    if (!Ctor) return
    const recognition = new Ctor()
    recognition.continuous = continuous
    recognition.interimResults = interimResults
    recognition.lang = language
    recognitionRef.current = recognition

    const onResult = (event: Event) => {
      const speechEvent = event as SpeechRecognitionEventLike
      let interim = ""
      let final = finalTranscriptRef.current
      for (
        let resultIndex = speechEvent.resultIndex;
        resultIndex < speechEvent.results.length;
        resultIndex++
      ) {
        const result = speechEvent.results[resultIndex]
        if (!result) continue
        const piece = result[0].transcript
        if (result.isFinal) {
          final += piece
        } else {
          interim += piece
        }
      }
      finalTranscriptRef.current = final
      setTranscript((final + interim).trim())
    }

    const onError = (event: Event) => {
      const errorEvent = event as SpeechRecognitionErrorEventLike
      console.error("[useSpeechRecognition] error", {
        error: errorEvent.error,
        message: errorEvent.message,
      })
      setListening(false)
    }

    const onEnd = () => setListening(false)
    const onStart = () => setListening(true)

    recognition.addEventListener("result", onResult)
    recognition.addEventListener("error", onError)
    recognition.addEventListener("end", onEnd)
    recognition.addEventListener("start", onStart)

    return () => {
      recognition.removeEventListener("result", onResult)
      recognition.removeEventListener("error", onError)
      recognition.removeEventListener("end", onEnd)
      recognition.removeEventListener("start", onStart)
      try {
        recognition.stop()
      } catch {
        // recognition may not have been started; safe to ignore
      }
      recognitionRef.current = null
    }
  }, [language, continuous, interimResults])

  const start = useCallback(() => {
    const recognition = recognitionRef.current
    if (!recognition) return
    finalTranscriptRef.current = ""
    setTranscript("")
    try {
      recognition.start()
    } catch (error) {
      console.error("[useSpeechRecognition] failed to start", error)
    }
  }, [])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
  }, [])

  const resetTranscript = useCallback(() => {
    finalTranscriptRef.current = ""
    setTranscript("")
  }, [])

  return { supported, listening, transcript, start, stop, resetTranscript }
}
