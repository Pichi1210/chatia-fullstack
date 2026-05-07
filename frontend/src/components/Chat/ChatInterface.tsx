import { useState } from 'react';
import { OpenAPI } from '../../client';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { MedicalCenterCard } from './MedicalCenterCard';

interface MedicalCenter {
    id: number;
    name: string;
    institution_type_id?: number | null;
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
    risk_score?: number;
    questions: TriageQuestion[];
    recommendations: MedicalCenter[];
}

interface Message {
    sender: 'user' | 'bot';
    text: string;
    healthNeedId?: number | null;
    recommendedService?: string | null;
    recommendedSpecialty?: string | null;
    recommendedInstitutionType?: string | null;
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
    risk_score: response.risk_score ?? 0,
    questions: Array.isArray(response.questions) ? response.questions : [],
    recommendations: Array.isArray(response.recommendations)
        ? response.recommendations
        : [],
});

export default function ChatInterface() {
    const [messages, setMessages] = useState<Message[]>([]);
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
                recommendedService: response.recommended_service,
                recommendedSpecialty: response.recommended_specialty,
                recommendedInstitutionType: response.recommended_institution_type,
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
            const response = await requestChat({ message: messageText });
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
        <div className="w-full max-w-2xl mx-auto flex flex-col h-[70vh]">
            <div className="flex-grow p-4 border rounded-lg overflow-y-auto">
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

                    return (
                        <div key={index} className={`mb-4 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                            <div className={`inline-block p-2 rounded-lg ${msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-white'}`}>
                                {msg.text}
                            </div>

                            {questions.length > 0 && msg.healthNeedId && (
                                <div className="mt-3 space-y-3 rounded-lg border bg-white p-3 text-gray-900 shadow-sm dark:bg-gray-900 dark:text-gray-100">
                                    {questions.map((question) => (
                                        <div key={question.id} className="space-y-2">
                                            <p className="text-sm font-medium">{question.question_text}</p>
                                            <div className="flex flex-wrap gap-2">
                                                {question.answer_options.map((option) => {
                                                    const isSelected =
                                                        answersForMessage[question.id]?.id === option.id;

                                                    return (
                                                        <Button
                                                            key={option.id}
                                                            type="button"
                                                            variant={isSelected ? 'default' : 'outline'}
                                                            size="sm"
                                                            className={
                                                                isSelected
                                                                    ? ''
                                                                    : 'border-gray-400 bg-white text-gray-900 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700'
                                                            }
                                                            disabled={isLoading || isTriageSubmitted}
                                                            onClick={() =>
                                                                handleSelectAnswer(index, question.id, option)
                                                            }
                                                        >
                                                            {option.option_text}
                                                        </Button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                    <Button
                                        type="button"
                                        className="w-full"
                                        disabled={isLoading || !canSubmitTriage}
                                        onClick={() =>
                                            handleSubmitTriageAnswers(
                                                index,
                                                msg.healthNeedId!,
                                                questions,
                                            )
                                        }
                                    >
                                        Analizar respuestas
                                    </Button>
                                </div>
                            )}

                            {(msg.recommendedService ||
                                msg.recommendedSpecialty ||
                                msg.recommendedInstitutionType) && (
                                <div className="mt-3 rounded-lg border bg-white p-3 text-sm text-gray-900 shadow-sm dark:bg-gray-900 dark:text-gray-100">
                                    {msg.recommendedService && (
                                        <p>Servicio: {msg.recommendedService}</p>
                                    )}
                                    {msg.recommendedSpecialty && (
                                        <p>Especialidad: {msg.recommendedSpecialty}</p>
                                    )}
                                    {msg.recommendedInstitutionType && (
                                        <p>
                                            Tipo de institución:{' '}
                                            {msg.recommendedInstitutionType}
                                        </p>
                                    )}
                                    {typeof msg.riskScore === 'number' && (
                                        <p>Riesgo: {msg.riskScore}</p>
                                    )}
                                </div>
                            )}

                            {recommendations.length > 0 && (
                                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {recommendations.map((center) => (
                                        <MedicalCenterCard key={center.id} center={center} />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
                {isLoading && <div className="text-center">Buscando...</div>}
            </div>
            <div className="flex mt-4">
                <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Me duele una muela..."
                    disabled={isLoading}
                />
                <Button onClick={handleSendMessage} className="ml-2" disabled={isLoading}>
                    Enviar
                </Button>
            </div>
        </div>
    );
}
