import {
    Activity,
    Bot,
    ClipboardCheck,
    Send,
    Stethoscope,
    User,
} from 'lucide-react';
import { useState } from 'react';
import { OpenAPI } from '../../client';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { MedicalCenterCard } from './MedicalCenterCard';

type RiskLevel = 'low' | 'medium' | 'high';

interface MedicalCenter {
    id: number;
    name: string;
    institution_type_id?: number | null;
    institution_type_name?: string | null;
    main_services?: string[];
    main_specialties?: string[];
    recommendation_reason?: string | null;
    city?: string | null;
    district?: string | null;
    address?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    phone?: string | null;
    website?: string | null;
    working_hours?: string | null;
    rating?: number | null;
    price_level?: string | null;
    has_emergency?: boolean | null;
    is_public?: boolean | null;
    description?: string | null;
}

interface TriageAnswerOption {
    id: number;
    option_text: string;
    risk_score: number;
    next_question_id?: number | null;
}

interface TriageQuestion {
    id: number;
    question_text: string;
    answer_type: string;
    priority: number;
    is_required: boolean;
    answer_options: TriageAnswerOption[];
}

interface ChatResponse {
    message: string;
    health_need_id: number | null;
    health_need_name: string | null;
    recommended_service?: string | null;
    recommended_specialty?: string | null;
    recommended_institution_type?: string | null;
    explanation?: string | null;
    risk_level?: RiskLevel;
    risk_score?: number;
    questions: TriageQuestion[];
    recommendations: MedicalCenter[];
}

interface Message {
    sender: 'user' | 'bot';
    text: string;
    healthNeedId?: number | null;
    healthNeedName?: string | null;
    recommendedService?: string | null;
    recommendedSpecialty?: string | null;
    recommendedInstitutionType?: string | null;
    explanation?: string | null;
    riskLevel?: RiskLevel;
    riskScore?: number;
    questions?: TriageQuestion[];
    recommendations?: MedicalCenter[];
}

const normalizeChatResponse = (response: Partial<ChatResponse>): ChatResponse => ({
    message: response.message || '',
    health_need_id: response.health_need_id ?? null,
    health_need_name: response.health_need_name ?? null,
    recommended_service: response.recommended_service ?? null,
    recommended_specialty: response.recommended_specialty ?? null,
    recommended_institution_type: response.recommended_institution_type ?? null,
    explanation: response.explanation ?? null,
    risk_level: response.risk_level ?? 'low',
    risk_score: response.risk_score ?? 0,
    questions: Array.isArray(response.questions) ? response.questions : [],
    recommendations: Array.isArray(response.recommendations)
        ? response.recommendations
        : [],
});

const riskLabels: Record<RiskLevel, string> = {
    low: 'Bajo',
    medium: 'Medio',
    high: 'Alto',
};

const riskBadgeClasses: Record<RiskLevel, string> = {
    low: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300',
    medium:
        'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300',
    high: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300',
};

const initialMessages: Message[] = [
    {
        sender: 'bot',
        text: 'Hola, soy VILPU. Cuentame que necesitas y te ayudare a elegir un centro medico en Kursk.',
        questions: [],
        recommendations: [],
    },
];

export default function ChatInterface() {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedAnswers, setSelectedAnswers] = useState<
        Record<number, Record<number, TriageAnswerOption>>
    >({});
    const [submittedTriageMessages, setSubmittedTriageMessages] = useState<
        Record<number, boolean>
    >({});

    const appendBotResponse = (response: ChatResponse) => {
        setMessages((prev) => [
            ...prev,
            {
                sender: 'bot',
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
        ]);
    };

    const requestChat = async (body: unknown, path = '/api/v1/chat') => {
        const response = await fetch(`${OpenAPI.BASE}${path}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('access_token') || ''}`,
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            throw new Error('No se pudo obtener respuesta del servidor');
        }

        return normalizeChatResponse(await response.json());
    };

    const handleSendMessage = async () => {
        const messageText = inputValue.trim();
        if (messageText === '') return;

        setMessages((prev) => [...prev, { sender: 'user', text: messageText }]);
        setInputValue('');
        setIsLoading(true);

        try {
            const response = await requestChat({ message: messageText, city: 'Курск' });
            appendBotResponse(response);
        } catch (_error) {
            setMessages((prev) => [
                ...prev,
                {
                    sender: 'bot',
                    text: 'No pude conectar con el chatbot medico. Revisa que el backend este corriendo.',
                    questions: [],
                    recommendations: [],
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

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
        }));
    };

    const areRequiredQuestionsAnswered = (
        messageIndex: number,
        questions: TriageQuestion[],
    ) => {
        const answers = selectedAnswers[messageIndex] || {};
        return questions
            .filter((question) => question.is_required)
            .every((question) => Boolean(answers[question.id]));
    };

    const handleSubmitTriageAnswers = async (
        messageIndex: number,
        healthNeedId: number,
        questions: TriageQuestion[],
    ) => {
        const answersByQuestion = selectedAnswers[messageIndex] || {};
        if (!areRequiredQuestionsAnswered(messageIndex, questions)) return;

        setMessages((prev) => [
            ...prev,
            { sender: 'user', text: 'Respuestas de triaje enviadas' },
        ]);
        setIsLoading(true);

        try {
            const response = await requestChat(
                {
                    health_need_id: healthNeedId,
                    answers: questions
                        .filter((question) => answersByQuestion[question.id])
                        .map((question) => {
                            const option = answersByQuestion[question.id];
                            return {
                                question_id: question.id,
                                answer_option_id: option.id,
                                risk_score: option.risk_score,
                            };
                        }),
                    city: 'Курск',
                },
                '/api/v1/chat/answer',
            );
            appendBotResponse(response);
            setSubmittedTriageMessages((prev) => ({
                ...prev,
                [messageIndex]: true,
            }));
        } catch (_error) {
            setMessages((prev) => [
                ...prev,
                {
                    sender: 'bot',
                    text: 'No pude procesar las respuestas de triaje.',
                    questions: [],
                    recommendations: [],
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="mx-auto flex h-[78vh] w-full max-w-6xl flex-col">
            <div className="mb-4">
                <h1 className="text-2xl font-semibold tracking-normal">
                    Asistente para elegir un centro medico
                </h1>
                <p className="max-w-2xl text-sm text-muted-foreground">
                    Describe tu necesidad medica y el sistema te orientara hacia el
                    tipo de institucion adecuado.
                </p>
            </div>

            <div className="flex-grow overflow-y-auto rounded-md border bg-background p-4 shadow-sm">
                {messages.length === 0 && (
                    <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
                        Escribe tu sintoma o necesidad medica para iniciar el triaje.
                    </div>
                )}

                {messages.map((msg, index) => {
                    const questions = Array.isArray(msg.questions) ? msg.questions : [];
                    const recommendations = Array.isArray(msg.recommendations)
                        ? msg.recommendations
                        : [];
                    const answersForMessage = selectedAnswers[index] || {};
                    const isTriageSubmitted = Boolean(submittedTriageMessages[index]);
                    const canSubmitTriage =
                        questions.length > 0 &&
                        !isTriageSubmitted &&
                        areRequiredQuestionsAnswered(index, questions);
                    const hasFinalRecommendation =
                        msg.recommendedService ||
                        msg.recommendedSpecialty ||
                        msg.recommendedInstitutionType ||
                        msg.explanation;

                    return (
                        <div key={index} className="mb-5">
                            <div
                                className={`flex gap-3 ${
                                    msg.sender === 'user' ? 'justify-end' : 'justify-start'
                                }`}
                            >
                                {msg.sender === 'bot' && (
                                    <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                        <Bot className="h-4 w-4" />
                                    </div>
                                )}
                                <div
                                    className={`max-w-[82%] rounded-md px-4 py-3 text-sm leading-6 shadow-sm ${
                                        msg.sender === 'user'
                                            ? 'bg-primary text-primary-foreground'
                                            : 'border bg-card text-card-foreground'
                                    }`}
                                >
                                    {msg.text}
                                </div>
                                {msg.sender === 'user' && (
                                    <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                                        <User className="h-4 w-4" />
                                    </div>
                                )}
                            </div>

                            {questions.length > 0 && msg.healthNeedId && (
                                <section className="ml-0 mt-4 space-y-3 md:ml-11">
                                    <div className="flex items-center gap-2">
                                        <ClipboardCheck className="h-4 w-4 text-primary" />
                                        <h2 className="text-sm font-semibold">
                                            Preguntas de triaje
                                        </h2>
                                        {msg.healthNeedName && (
                                            <Badge variant="outline">{msg.healthNeedName}</Badge>
                                        )}
                                    </div>

                                    <div className="grid gap-3">
                                        {questions.map((question, questionIndex) => (
                                            <div
                                                key={question.id}
                                                className="rounded-md border bg-card p-4 shadow-sm"
                                            >
                                                <div className="mb-3 flex items-start justify-between gap-3">
                                                    <p className="text-sm font-medium">
                                                        {questionIndex + 1}. {question.question_text}
                                                    </p>
                                                    {question.is_required && (
                                                        <Badge variant="secondary">Obligatoria</Badge>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {question.answer_options.map((option) => {
                                                        const isSelected =
                                                            answersForMessage[question.id]?.id ===
                                                            option.id;

                                                        return (
                                                            <Button
                                                                key={option.id}
                                                                type="button"
                                                                variant={isSelected ? 'default' : 'outline'}
                                                                size="sm"
                                                                className="h-auto min-h-9 whitespace-normal text-left"
                                                                disabled={isLoading || isTriageSubmitted}
                                                                onClick={() =>
                                                                    handleSelectAnswer(
                                                                        index,
                                                                        question.id,
                                                                        option,
                                                                    )
                                                                }
                                                            >
                                                                {option.option_text}
                                                            </Button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <Button
                                        type="button"
                                        className="w-full sm:w-auto"
                                        disabled={isLoading || !canSubmitTriage}
                                        onClick={() =>
                                            handleSubmitTriageAnswers(
                                                index,
                                                msg.healthNeedId!,
                                                questions,
                                            )
                                        }
                                    >
                                        <Activity className="mr-2 h-4 w-4" />
                                        Analizar respuestas
                                    </Button>
                                </section>
                            )}

                            {hasFinalRecommendation && (
                                <section className="ml-0 mt-4 rounded-md border bg-card p-4 shadow-sm md:ml-11">
                                    <div className="mb-3 flex flex-wrap items-center gap-2">
                                        <Stethoscope className="h-4 w-4 text-primary" />
                                        <h2 className="text-sm font-semibold">
                                            Recomendacion final
                                        </h2>
                                        {msg.riskLevel && (
                                            <span
                                                className={`rounded-md border px-2 py-1 text-xs font-medium ${
                                                    riskBadgeClasses[msg.riskLevel]
                                                }`}
                                            >
                                                Riesgo {riskLabels[msg.riskLevel]}
                                            </span>
                                        )}
                                        {typeof msg.riskScore === 'number' && (
                                            <Badge variant="outline">Puntaje {msg.riskScore}</Badge>
                                        )}
                                    </div>

                                    <div className="grid gap-3 text-sm sm:grid-cols-3">
                                        <div>
                                            <p className="text-xs uppercase text-muted-foreground">
                                                Servicio
                                            </p>
                                            <p className="font-medium">
                                                {msg.recommendedService || 'No definido'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase text-muted-foreground">
                                                Especialidad
                                            </p>
                                            <p className="font-medium">
                                                {msg.recommendedSpecialty || 'No definida'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase text-muted-foreground">
                                                Institucion
                                            </p>
                                            <p className="font-medium">
                                                {msg.recommendedInstitutionType || 'No definida'}
                                            </p>
                                        </div>
                                    </div>

                                    {msg.explanation && (
                                        <p className="mt-4 border-t pt-4 text-sm leading-6 text-muted-foreground">
                                            {msg.explanation}
                                        </p>
                                    )}
                                </section>
                            )}

                            {recommendations.length > 0 && (
                                <section className="ml-0 mt-4 md:ml-11">
                                    <h2 className="mb-3 text-sm font-semibold">
                                        Centros medicos recomendados
                                    </h2>
                                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                                        {recommendations.map((center) => (
                                            <MedicalCenterCard
                                                key={center.id}
                                                center={center}
                                                recommendedService={msg.recommendedService}
                                                recommendedSpecialty={msg.recommendedSpecialty}
                                            />
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>
                    );
                })}
                {isLoading && (
                    <div className="text-center text-sm text-muted-foreground">
                        Analizando...
                    </div>
                )}
            </div>

            <div className="mt-4 flex gap-2">
                <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Me duele una muela..."
                    disabled={isLoading}
                />
                <Button onClick={handleSendMessage} disabled={isLoading}>
                    <Send className="mr-2 h-4 w-4" />
                    Enviar
                </Button>
            </div>
        </div>
    );
}
