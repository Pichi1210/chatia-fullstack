import {
  AlertCircle,
  AlertTriangle,
  Building2,
  CheckCircle2,
  ClipboardList,
  FileText,
  Info,
  Loader2,
  Mic,
  Plus,
  Send,
  Settings2,
  Shield,
  Stethoscope,
  User,
  UserRound,
} from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { OpenAPI } from "@/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { MedicalCenterCard } from "./MedicalCenterCard"

type RiskLevel = "low" | "medium" | "high"

interface MedicalCenter {
  id: number
  name: string
  institution_type_id?: number | null
  institution_type_name?: string | null
  main_services?: string[]
  main_specialties?: string[]
  recommendation_reason?: string | null
  city?: string | null
  district?: string | null
  address?: string | null
  latitude?: number | null
  longitude?: number | null
  phone?: string | null
  website?: string | null
  working_hours?: string | null
  rating?: number | null
  price_level?: string | null
  has_emergency?: boolean | null
  is_public?: boolean | null
  description?: string | null
}

interface TriageAnswerOption {
  id: number
  option_text: string
  risk_score: number
  next_question_id?: number | null
}

interface TriageQuestion {
  id: number
  question_text: string
  answer_type: string
  priority: number
  is_required: boolean
  answer_options: TriageAnswerOption[]
}

interface ChatResponse {
  message: string
  health_need_id: number | null
  health_need_name: string | null
  recommended_service?: string | null
  recommended_specialty?: string | null
  recommended_institution_type?: string | null
  explanation?: string | null
  risk_level?: RiskLevel
  risk_score?: number
  questions: TriageQuestion[]
  recommendations: MedicalCenter[]
}

interface Message {
  id: string
  sender: "user" | "bot"
  text: string
  healthNeedId?: number | null
  healthNeedName?: string | null
  recommendedService?: string | null
  recommendedSpecialty?: string | null
  recommendedInstitutionType?: string | null
  explanation?: string | null
  riskLevel?: RiskLevel
  riskScore?: number
  questions?: TriageQuestion[]
  recommendations?: MedicalCenter[]
}

interface ChatInputProps {
  onSubmit: (message: string) => void
  isLoading?: boolean
  placeholder?: string
  disabled?: boolean
  centered?: boolean
  showTools?: boolean
}

const suggestions = [
  "Tengo dolor de cabeza",
  "Necesito un analisis de sangre",
  "Busco vacunacion",
  "Consulta con especialista",
  "Emergencia medica",
]

const normalizeChatResponse = (response: Partial<ChatResponse>): ChatResponse => ({
  message: response.message || "",
  health_need_id: response.health_need_id ?? null,
  health_need_name: response.health_need_name ?? null,
  recommended_service: response.recommended_service ?? null,
  recommended_specialty: response.recommended_specialty ?? null,
  recommended_institution_type: response.recommended_institution_type ?? null,
  explanation: response.explanation ?? null,
  risk_level: response.risk_level ?? "low",
  risk_score: response.risk_score ?? 0,
  questions: Array.isArray(response.questions) ? response.questions : [],
  recommendations: Array.isArray(response.recommendations)
    ? response.recommendations
    : [],
})

const riskConfig: Record<
  RiskLevel,
  {
    label: string
    color: string
    bgColor: string
    icon: typeof Shield
  }
> = {
  low: {
    label: "Bajo",
    color: "text-risk-low",
    bgColor: "bg-risk-low/10",
    icon: Shield,
  },
  medium: {
    label: "Medio",
    color: "text-risk-medium",
    bgColor: "bg-risk-medium/10",
    icon: AlertTriangle,
  },
  high: {
    label: "Alto",
    color: "text-risk-high",
    bgColor: "bg-risk-high/10",
    icon: AlertCircle,
  },
}

const createMessageId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

function ChatInput({
  onSubmit,
  isLoading = false,
  placeholder = "Describe tu necesidad medica...",
  disabled = false,
  centered = false,
  showTools = false,
}: ChatInputProps) {
  const [message, setMessage] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!textareaRef.current) return

    textareaRef.current.style.height = "auto"
    const nextHeight = Math.min(textareaRef.current.scrollHeight, 200)
    textareaRef.current.style.height = `${nextHeight}px`
  }, [message])

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const messageText = message.trim()

    if (!messageText || isLoading || disabled) return

    onSubmit(messageText)
    setMessage("")
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      event.currentTarget.form?.requestSubmit()
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "w-full transition-all duration-300",
        centered
          ? "px-4"
          : "border-t border-border bg-background/80 px-4 py-3 backdrop-blur-sm",
      )}
    >
      <div
        className={cn(
          "mx-auto flex w-full flex-col gap-2",
          centered ? "max-w-3xl" : "max-w-4xl",
        )}
      >
        <div
          className={cn(
            "relative flex items-end rounded-2xl border border-border bg-card transition-all duration-200",
            "focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20",
            centered ? "shadow-lg" : "shadow-sm",
          )}
        >
          {showTools && (
            <div className="flex items-center gap-1 pb-3 pl-3">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
              >
                <Plus className="h-4 w-4" />
                <span className="sr-only">Agregar archivo</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
              >
                <Settings2 className="h-4 w-4" />
                <span className="sr-only">Herramientas</span>
              </Button>
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            rows={3}
            className={cn(
              "flex-1 resize-none bg-transparent px-4 py-4 text-base text-foreground",
              "placeholder:text-muted-foreground",
              "focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
              centered ? "min-h-[100px]" : "min-h-[80px]",
            )}
          />

          <div className="flex items-center gap-1 pb-2 pr-2">
            {showTools && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground"
              >
                <Mic className="h-4 w-4" />
                <span className="sr-only">Entrada de voz</span>
              </Button>
            )}
            <Button
              type="submit"
              size="icon"
              disabled={!message.trim() || isLoading || disabled}
              className={cn(
                "h-9 w-9 shrink-0 rounded-full transition-all duration-200",
                message.trim() && !isLoading && !disabled
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span className="sr-only">Enviar mensaje</span>
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}

function SuggestionChips({
  onSelect,
}: {
  onSelect: (suggestion: string) => void
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {suggestions.map((suggestion) => (
        <button
          key={suggestion}
          type="button"
          onClick={() => onSelect(suggestion)}
          className="rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground transition-all duration-200 hover:border-primary/50 hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 active:scale-95"
        >
          {suggestion}
        </button>
      ))}
    </div>
  )
}

function ChatMessage({ message }: { message: Message }) {
  const isUser = message.sender === "user"

  return (
    <div
      className={cn(
        "flex  gap-3 px-4 py-3",
        isUser ? "flex-row-reverse" : "flex-row",
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full",
          isUser ? "bg-secondary" : "bg-transparent",
        )}
      >
        {isUser ? (
          <User className="h-4 w-4 text-secondary-foreground" />
        ) : (
          <img
            src="/assets/images/vilpu-logo.png"
            alt="VILPU"
            className="h-8 w-auto object-contain"
          />
        )}
      </div>

      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3",
          isUser
            ? "bg-primary text-primary-foreground"
            : "border border-border bg-card text-card-foreground",
        )}
      >
        <p className="whitespace-pre-wrap text-sm leading-relaxed">
          {message.text}
        </p>
      </div>
    </div>
  )
}

function TriageQuestionCard({
  messageIndex,
  healthNeedName,
  questions,
  selectedAnswers,
  isSubmitting,
  isSubmitted,
  canSubmit,
  onSelectAnswer,
  onSubmit,
}: {
  messageIndex: number
  healthNeedName?: string | null
  questions: TriageQuestion[]
  selectedAnswers: Record<number, TriageAnswerOption>
  isSubmitting: boolean
  isSubmitted: boolean
  canSubmit: boolean
  onSelectAnswer: (
    messageIndex: number,
    questionId: number,
    option: TriageAnswerOption,
  ) => void
  onSubmit: () => void
}) {
  return (
    <div className="mx-4 my-3 max-w-2xl animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center gap-3 border-b border-border bg-secondary/30 px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <ClipboardList className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-medium text-card-foreground">
                Preguntas de orientacion
              </h3>
              {healthNeedName && <Badge variant="outline">{healthNeedName}</Badge>}
            </div>
            <p className="text-xs text-muted-foreground">
              Responde para obtener una recomendacion precisa
            </p>
          </div>
        </div>

        <div className="divide-y divide-border">
          {questions.map((question, index) => (
            <div key={question.id} className="p-4">
              <div className="mb-3 flex items-start gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium text-secondary-foreground">
                  {index + 1}
                </span>
                <p className="text-sm font-medium text-card-foreground">
                  {question.question_text}
                  {question.is_required && (
                    <span className="ml-1 text-destructive">*</span>
                  )}
                </p>
              </div>

              <div className="ml-8 flex flex-wrap gap-2">
                {question.answer_options.map((option) => {
                  const isSelected = selectedAnswers[question.id]?.id === option.id

                  return (
                    <button
                      key={option.id}
                      type="button"
                      disabled={isSubmitting || isSubmitted}
                      onClick={() =>
                        onSelectAnswer(messageIndex, question.id, option)
                      }
                      className={cn(
                        "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-all disabled:cursor-not-allowed disabled:opacity-60",
                        isSelected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-secondary/50 text-muted-foreground hover:border-primary/50 hover:text-foreground",
                      )}
                    >
                      {isSelected && <CheckCircle2 className="h-3.5 w-3.5" />}
                      {option.option_text}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="border- border-border bg-secondary/30 px-4 py-3">
          <Button
            type="button"
            onClick={onSubmit}
            disabled={!canSubmit || isSubmitting || isSubmitted}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analizando...
              </>
            ) : isSubmitted ? (
              "Respuestas enviadas"
            ) : (
              "Analizar respuestas"
            )}
          </Button>
          {!canSubmit && !isSubmitted && (
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Responde todas las preguntas obligatorias para continuar
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function RecommendationSummaryCard({ message }: { message: Message }) {
  const riskLevel = message.riskLevel ?? "low"
  const risk = riskConfig[riskLevel]
  const RiskIcon = risk.icon

  return (
    <div className="mx-4 my-3 max-w-2xl animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between gap-3 border-b border-border bg-secondary/30 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
              <FileText className="h-4 w-4 text-accent" />
            </div>
            <h3 className="font-medium text-card-foreground">
              Resultado de orientacion
            </h3>
          </div>
          <div
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1",
              risk.bgColor,
            )}
          >
            <RiskIcon className={cn("h-3.5 w-3.5", risk.color)} />
            <span className={cn("text-xs font-medium", risk.color)}>
              Riesgo {risk.label}
            </span>
          </div>
        </div>

        <div className="grid gap-4 p-4 sm:grid-cols-2">
          <div className="flex items-start gap-3 rounded-lg border border-border bg-secondary/30 p-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Stethoscope className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                Servicio recomendado
              </p>
              <p className="font-medium text-card-foreground">
                {message.recommendedService || "No definido"}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-border bg-secondary/30 p-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <UserRound className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Especialidad</p>
              <p className="font-medium text-card-foreground">
                {message.recommendedSpecialty || "No definida"}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-border bg-secondary/30 p-3 sm:col-span-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                Tipo de institucion
              </p>
              <p className="font-medium text-card-foreground">
                {message.recommendedInstitutionType || "No definido"}
              </p>
            </div>
          </div>
        </div>

        {message.explanation && (
          <div className="border-t border-border bg-secondary/20 px-4 py-3">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {message.explanation}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function MedicalCentersGrid({
  centers,
  recommendedService,
  recommendedSpecialty,
}: {
  centers: MedicalCenter[]
  recommendedService?: string | null
  recommendedSpecialty?: string | null
}) {
  return (
    <div className="mx-4 my-3 w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
          <Building2 className="h-4 w-4 text-accent" />
        </div>
        <div>
          <h3 className="font-medium text-foreground">
            Centros medicos compatibles
          </h3>
          <p className="text-xs text-muted-foreground">
            {centers.length} centros encontrados en Kursk
          </p>
        </div>
      </div>

      <div className="grid gap-2 grid-cols-2">
        {centers.map((center) => (
          <MedicalCenterCard
            key={center.id}
            center={center}
            recommendedService={recommendedService}
            recommendedSpecialty={recommendedSpecialty}
          />
        ))}
      </div>
    </div>
  )
}

function DisclaimerBanner() {
  return (
    <div className="px-4 py-2">
      <div className="mx-auto flex max-w-3xl items-start gap-2">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <p className="text-xs leading-relaxed text-muted-foreground">
          Este sistema no reemplaza una consulta medica profesional. En caso de
          sintomas graves o emergencia, acude a urgencias o llama a los servicios
          de emergencia.
        </p>
      </div>
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="mx-4 my-3 max-w-2xl rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="space-y-3">
          <p>{message}</p>
          <Button type="button" variant="outline" size="sm" onClick={onRetry}>
            Intentar de nuevo
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<number, Record<number, TriageAnswerOption>>
  >({})
  const [submittedTriageMessages, setSubmittedTriageMessages] = useState<
    Record<number, boolean>
  >({})
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, selectedAnswers])

  const appendBotResponse = (response: ChatResponse) => {
    setMessages((prev) => [
      ...prev,
      {
        id: createMessageId(),
        sender: "bot",
        text: response.message,
        healthNeedId: response.health_need_id,
        healthNeedName: response.health_need_name,
        recommendedService: response.recommended_service,
        recommendedSpecialty: response.recommended_specialty,
        recommendedInstitutionType: response.recommended_institution_type,
        explanation: response.explanation,
        riskLevel: response.risk_level,
        riskScore: response.risk_score,
        questions: response.questions,
        recommendations: response.recommendations,
      },
    ])
  }

  const requestChat = async (body: unknown, path = "/api/v1/chat") => {
    const response = await fetch(`${OpenAPI.BASE}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new Error("No se pudo obtener respuesta del servidor")
    }

    return normalizeChatResponse(await response.json())
  }

  const handleSendMessage = async (messageText: string) => {
    setError(null)
    setMessages((prev) => [
      ...prev,
      { id: createMessageId(), sender: "user", text: messageText },
    ])
    setIsLoading(true)

    try {
      const response = await requestChat({ message: messageText })
      appendBotResponse(response)
    } catch (_error) {
      setError(
        "No pude conectar con el chatbot medico. Revisa que el backend este corriendo.",
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectAnswer = (
    messageIndex: number,
    questionId: number,
    option: TriageAnswerOption,
  ) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [messageIndex]: {
        ...(prev[messageIndex] || {}),
        [questionId]: option,
      },
    }))
  }

  const areRequiredQuestionsAnswered = (
    messageIndex: number,
    questions: TriageQuestion[],
  ) => {
    const answers = selectedAnswers[messageIndex] || {}

    return questions
      .filter((question) => question.is_required)
      .every((question) => Boolean(answers[question.id]))
  }

  const handleSubmitTriageAnswers = async (
    messageIndex: number,
    healthNeedId: number,
    questions: TriageQuestion[],
  ) => {
    const answersByQuestion = selectedAnswers[messageIndex] || {}
    if (!areRequiredQuestionsAnswered(messageIndex, questions)) return

    setMessages((prev) => [
      ...prev,
      {
        id: createMessageId(),
        sender: "user",
        text: "Respuestas de triaje enviadas",
      },
    ])
    setIsLoading(true)
    setError(null)

    try {
      const response = await requestChat(
        {
          health_need_id: healthNeedId,
          answers: questions
            .filter((question) => answersByQuestion[question.id])
            .map((question) => {
              const option = answersByQuestion[question.id]

              return {
                question_id: question.id,
                answer_option_id: option.id,
                risk_score: option.risk_score,
              }
            }),
        },
        "/api/v1/chat/answer",
      )

      appendBotResponse(response)
      setSubmittedTriageMessages((prev) => ({
        ...prev,
        [messageIndex]: true,
      }))
    } catch (_error) {
      setError("No pude procesar las respuestas de triaje.")
    } finally {
      setIsLoading(false)
    }
  }

  const showWelcomeScreen = messages.length === 0

  return (
    <div className="flex h-full min-h-[calc(100vh-4rem)] flex-col bg-background">
      <div className="flex-1 overflow-y-auto">
        {showWelcomeScreen ? (
          <div className="relative flex h-full min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 animate-in fade-in duration-500">
            <div className="mb-10 text-center">
              <p className="mb-1 text-lg text-muted-foreground animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100">
                Hola, bienvenido a VILPU
              </p>
              <h1 className="text-3xl font-semibold tracking-normal text-foreground animate-in fade-in slide-in-from-bottom-3 duration-500 delay-200 md:text-4xl">
                En que puedo ayudarte hoy?
              </h1>
            </div>

            <div className="mb-6 w-full max-w-3xl px-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
              <ChatInput
                onSubmit={handleSendMessage}
                isLoading={isLoading}
                placeholder="Describe tu necesidad medica..."
                centered
                showTools
              />
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-5 duration-500 delay-400">
              <SuggestionChips onSelect={handleSendMessage} />
            </div>

            <div className="absolute bottom-4 left-0 right-0 px-4">
              <p className="text-center text-xs text-muted-foreground">
                VILPU ofrece orientacion general. Siempre consulta a un
                profesional medico.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-7 flex flex-col items-between overflow-hidden max-w-5xl mx-auto">
            {messages.map((message, index) => {
              const questions = Array.isArray(message.questions)
                ? message.questions
                : []
              const recommendations = Array.isArray(message.recommendations)
                ? message.recommendations
                : []
              const answersForMessage = selectedAnswers[index] || {}
              const isTriageSubmitted = Boolean(submittedTriageMessages[index])
              const canSubmitTriage =
                questions.length > 0 &&
                !isTriageSubmitted &&
                areRequiredQuestionsAnswered(index, questions)
              const hasFinalRecommendation = Boolean(
                message.recommendedService ||
                  message.recommendedSpecialty ||
                  message.recommendedInstitutionType ||
                  message.explanation,
              )

              return (
                <div
                  key={message.id}
                  className="animate-in fade-in slide-in-from-bottom-2 duration-300 "
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <ChatMessage message={message} />

                  {questions.length > 0 && message.healthNeedId && (
                    <TriageQuestionCard
                      messageIndex={index}
                      healthNeedName={message.healthNeedName}
                      questions={questions}
                      selectedAnswers={answersForMessage}
                      isSubmitting={isLoading}
                      isSubmitted={isTriageSubmitted}
                      canSubmit={canSubmitTriage}
                      onSelectAnswer={handleSelectAnswer}
                      onSubmit={() =>
                        handleSubmitTriageAnswers(
                          index,
                          message.healthNeedId!,
                          questions,
                        )
                      }
                    />
                  )}

                  {hasFinalRecommendation && (
                    <RecommendationSummaryCard message={message} />
                  )}

                  {recommendations.length > 0 && (
                    <MedicalCentersGrid
                      centers={recommendations}
                      recommendedService={message.recommendedService}
                      recommendedSpecialty={message.recommendedSpecialty}
                    />
                  )}
                </div>
              )
            })}

            {isLoading && (
              <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Analizando...
              </div>
            )}

            {error && <ErrorState message={error} onRetry={() => setError(null)} />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {!showWelcomeScreen && (
        <>
          <DisclaimerBanner />
          <ChatInput
            onSubmit={handleSendMessage}
            isLoading={isLoading}
            disabled={isLoading}
            placeholder="Describe tu necesidad medica..."
          />
        </>
      )}
    </div>
  )
}
