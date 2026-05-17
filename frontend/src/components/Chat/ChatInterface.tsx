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
  Send,
  Shield,
  Stethoscope,
  User,
  UserRound,
} from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { useEffect, useRef, useState } from "react"

import { OpenAPI } from "@/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { apiLanguageHeaders, type AppLanguage, useLanguage } from "@/lib/i18n"
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
  chat_session_id?: string | null
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

interface ChatHistoryMessage {
  id: string
  sender: "user" | "bot"
  text: string
  response_payload?: Partial<ChatResponse> | null
  created_at: string
}

interface ChatSessionDetail {
  id: string
  messages: ChatHistoryMessage[]
}

interface ChatInterfaceProps {
  chatId?: string
  newChatKey?: string
}

interface ChatInputProps {
  onSubmit: (message: string) => void
  isLoading?: boolean
  placeholder?: string
  disabled?: boolean
  centered?: boolean
  showTools?: boolean
}

const suggestions: Record<AppLanguage, string[]> = {
  es: [
    "Tengo dolor de cabeza",
    "Necesito un analisis de sangre",
    "Busco vacunacion",
    "Consulta con especialista",
    "Emergencia medica",
  ],
  ru: [
    "У меня болит голова",
    "Нужен анализ крови",
    "Ищу вакцинацию",
    "Консультация специалиста",
    "Экстренная помощь",
  ],
}

const normalizeChatResponse = (response: Partial<ChatResponse>): ChatResponse => ({
  chat_session_id: response.chat_session_id ?? null,
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

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
})

const mapStoredMessage = (message: ChatHistoryMessage): Message => {
  if (message.sender === "user") {
    return {
      id: message.id,
      sender: "user",
      text: message.text,
    }
  }

  const response = normalizeChatResponse(
    message.response_payload || { message: message.text },
  )

  return {
    id: message.id,
    sender: "bot",
    text: response.message || message.text,
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
  }
}

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
  placeholder,
  disabled = false,
  centered = false,
  showTools = false,
}: ChatInputProps) {
  const { t } = useLanguage()
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
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder ?? t("chat.inputPlaceholder")}
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
                <span className="sr-only">{t("chat.voice")}</span>
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
              <span className="sr-only">{t("chat.send")}</span>
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
  const { language } = useLanguage()

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {suggestions[language].map((suggestion) => (
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
  const { t } = useLanguage()

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
                {t("chat.questionsTitle")}
              </h3>
              {healthNeedName && <Badge variant="outline">{healthNeedName}</Badge>}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("chat.questionsSubtitle")}
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
                {t("chat.analyzing")}
              </>
            ) : isSubmitted ? (
              t("chat.answerSent")
            ) : (
              t("chat.analyze")
            )}
          </Button>
          {!canSubmit && !isSubmitted && (
            <p className="mt-2 text-center text-xs text-muted-foreground">
              {t("chat.requiredQuestions")}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function RecommendationSummaryCard({ message }: { message: Message }) {
  const { language, t } = useLanguage()
  const riskLevel = message.riskLevel ?? "low"
  const risk = riskConfig[riskLevel]
  const RiskIcon = risk.icon
  const riskLabel =
    language === "ru"
      ? ({ low: "низкий", medium: "средний", high: "высокий" }[riskLevel])
      : risk.label

  return (
    <div className="mx-4 my-3 max-w-2xl animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between gap-3 border-b border-border bg-secondary/30 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
              <FileText className="h-4 w-4 text-accent" />
            </div>
            <h3 className="font-medium text-card-foreground">
              {t("chat.recommendationResult")}
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
              {t("chat.risk")} {riskLabel}
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
                {t("chat.service")}
              </p>
              <p className="font-medium text-card-foreground">
                {message.recommendedService || t("chat.noService")}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-border bg-secondary/30 p-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <UserRound className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("chat.specialty")}</p>
              <p className="font-medium text-card-foreground">
                {message.recommendedSpecialty || t("chat.noSpecialty")}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-border bg-secondary/30 p-3 sm:col-span-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {t("chat.type")}
              </p>
              <p className="font-medium text-card-foreground">
                {message.recommendedInstitutionType || t("chat.noType")}
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
  const { t } = useLanguage()

  return (
    <div className="mx-4 my-3 w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
          <Building2 className="h-4 w-4 text-accent" />
        </div>
        <div>
          <h3 className="font-medium text-foreground">
            {t("chat.compatibleCenters")}
          </h3>
          <p className="text-xs text-muted-foreground">
            {centers.length} {t("medical.centersFound")}
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
  const { t } = useLanguage()

  return (
    <div className="px-4 py-2">
      <div className="mx-auto flex max-w-3xl items-start gap-2">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <p className="text-xs leading-relaxed text-muted-foreground">
          {t("chat.disclaimer")}
        </p>
      </div>
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { t } = useLanguage()

  return (
    <div className="mx-4 my-3 max-w-2xl rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="space-y-3">
          <p>{message}</p>
          <Button type="button" variant="outline" size="sm" onClick={onRetry}>
            {t("chat.retry")}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function ChatInterface({ chatId, newChatKey }: ChatInterfaceProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { language, t } = useLanguage()
  const [messages, setMessages] = useState<Message[]>([])
  const [activeChatId, setActiveChatId] = useState<string | null>(chatId || null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
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

  useEffect(() => {
    const resetChat = () => {
      setActiveChatId(null)
      setMessages([])
      setError(null)
      setSelectedAnswers({})
      setSubmittedTriageMessages({})
    }

    if (newChatKey || !chatId) {
      resetChat()
      return
    }

    let isCurrent = true

    const loadChatSession = async () => {
      setIsLoadingHistory(true)
      setError(null)

      try {
        const response = await fetch(
          `${OpenAPI.BASE}/api/v1/chat/sessions/${chatId}`,
          {
            headers: {
              ...authHeaders(),
              ...apiLanguageHeaders(language),
            },
          },
        )

        if (!response.ok) {
          throw new Error("No se pudo cargar el historial")
        }

        const chatSession = (await response.json()) as ChatSessionDetail
        if (!isCurrent) return

        const restoredMessages = chatSession.messages.map(mapStoredMessage)
        const submittedMessages: Record<number, boolean> = {}

        restoredMessages.forEach((message, index) => {
          if (!message.questions?.length) return

          submittedMessages[index] = restoredMessages
            .slice(index + 1)
            .some(
              (nextMessage) =>
                nextMessage.sender === "user" &&
                (nextMessage.text === "Respuestas de triaje enviadas" ||
                  nextMessage.text === t("chat.submittedTriage")),
            )
        })

        setActiveChatId(chatSession.id)
        setMessages(restoredMessages)
        setSelectedAnswers({})
        setSubmittedTriageMessages(submittedMessages)
      } catch (_error) {
        if (isCurrent) {
          setError(t("chat.errorHistory"))
        }
      } finally {
        if (isCurrent) {
          setIsLoadingHistory(false)
        }
      }
    }

    loadChatSession()

    return () => {
      isCurrent = false
    }
  }, [chatId, newChatKey, language, t])

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
        ...apiLanguageHeaders(language),
        ...authHeaders(),
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new Error("No se pudo obtener respuesta del servidor")
    }

    return normalizeChatResponse(await response.json())
  }

  const syncActiveChat = (response: ChatResponse) => {
    if (!response.chat_session_id) return

    setActiveChatId(response.chat_session_id)
    queryClient.invalidateQueries({ queryKey: ["chatSessions"] })

    if (response.chat_session_id !== activeChatId) {
      navigate({
        to: "/chat",
        search: { chat: response.chat_session_id },
        replace: true,
      })
    }
  }

  const handleSendMessage = async (messageText: string) => {
    setError(null)
    setMessages((prev) => [
      ...prev,
      { id: createMessageId(), sender: "user", text: messageText },
    ])
    setIsLoading(true)

    try {
      const response = await requestChat({
        message: messageText,
        chat_session_id: activeChatId,
      })
      syncActiveChat(response)
      appendBotResponse(response)
    } catch (_error) {
      setError(
        t("chat.errorConnect"),
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
        text: t("chat.submittedTriage"),
      },
    ])
    setIsLoading(true)
    setError(null)

    try {
      const response = await requestChat(
        {
          chat_session_id: activeChatId,
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

      syncActiveChat(response)
      appendBotResponse(response)
      setSubmittedTriageMessages((prev) => ({
        ...prev,
        [messageIndex]: true,
      }))
    } catch (_error) {
      setError(t("chat.errorTriage"))
    } finally {
      setIsLoading(false)
    }
  }

  const showWelcomeScreen = !isLoadingHistory && messages.length === 0

  return (
    <div className="flex h-full min-h-[calc(100vh-4rem)] flex-col bg-background">
      <div className="flex-1 overflow-y-auto">
        {isLoadingHistory ? (
          <div className="flex h-full min-h-[calc(100vh-4rem)] items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t("chat.historyLoading")}
          </div>
        ) : showWelcomeScreen ? (
          <div className="relative flex h-full min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 animate-in fade-in duration-500">
            <div className="mb-10 text-center">
              <p className="mb-1 text-lg text-muted-foreground animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100">
                {t("chat.welcome")}
              </p>
              <h1 className="text-3xl font-semibold tracking-normal text-foreground animate-in fade-in slide-in-from-bottom-3 duration-500 delay-200 md:text-4xl">
                {t("chat.promptTitle")}
              </h1>
            </div>

            <div className="mb-6 w-full max-w-3xl px-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
              <ChatInput
                onSubmit={handleSendMessage}
                isLoading={isLoading}
                disabled={isLoadingHistory}
                placeholder={t("chat.inputPlaceholder")}
                centered
                showTools
              />
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-5 duration-500 delay-400">
              <SuggestionChips onSelect={handleSendMessage} />
            </div>

            <div className="absolute bottom-4 left-0 right-0 px-4">
              <p className="text-center text-xs text-muted-foreground">
                {t("chat.promptSubtitle")}
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
                {t("chat.analyzing")}
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
            disabled={isLoading || isLoadingHistory}
            placeholder={t("chat.inputPlaceholder")}
          />
        </>
      )}
    </div>
  )
}
