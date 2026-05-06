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
    questions: TriageQuestion[];
    recommendations: MedicalCenter[];
}

interface Message {
    sender: 'user' | 'bot';
    text: string;
    healthNeedId?: number | null;
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
    questions: Array.isArray(response.questions) ? response.questions : [],
    recommendations: Array.isArray(response.recommendations)
        ? response.recommendations
        : [],
});

export default function ChatInterface() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const appendBotResponse = (response: ChatResponse) => {
        setMessages((prev) => [
            ...prev,
            {
                sender: 'bot',
                text: response.message,
                healthNeedId: response.health_need_id,
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
        } catch (error) {
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

    const handleAnswerQuestion = async (
        healthNeedId: number,
        question: TriageQuestion,
        option: TriageAnswerOption,
    ) => {
        setMessages((prev) => [
            ...prev,
            { sender: 'user', text: option.option_text },
        ]);
        setIsLoading(true);

        try {
            const response = await requestChat(
                {
                    health_need_id: healthNeedId,
                    answers: [
                        {
                            question_id: question.id,
                            answer_option_id: option.id,
                            risk_score: option.risk_score,
                        },
                    ],
                    city: 'Kursk',
                },
                '/api/v1/chat/answer',
            );
            appendBotResponse(response);
        } catch (error) {
            setMessages((prev) => [
                ...prev,
                {
                    sender: 'bot',
                    text: 'No pude procesar la respuesta de triaje.',
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

                    return (
                        <div key={index} className={`mb-4 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                            <div className={`inline-block p-2 rounded-lg ${msg.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
                                {msg.text}
                            </div>

                            {questions.length > 0 && msg.healthNeedId && (
                                <div className="mt-3 space-y-3">
                                    {questions.map((question) => (
                                        <div key={question.id} className="space-y-2">
                                            <p className="text-sm font-medium">{question.question_text}</p>
                                            <div className="flex flex-wrap gap-2">
                                                {question.answer_options.map((option) => (
                                                    <Button
                                                        key={option.id}
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        disabled={isLoading}
                                                        onClick={() => handleAnswerQuestion(msg.healthNeedId!, question, option)}
                                                    >
                                                        {option.option_text}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
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
