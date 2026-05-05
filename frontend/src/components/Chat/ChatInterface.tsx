import { useState } from 'react';
import { OpenAPI } from '../../client';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { MedicalCenterCard } from './MedicalCenterCard';

interface MedicalCenter {
    id: number;
    name: string;
    address?: string | null;
    city?: string | null;
    category?: string | null;
    specialty?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    rating?: number | null;
    phone?: string | null;
    working_hours?: string | null;
    emergency_available?: boolean | null;
    approximate_price_level?: string | null;
    yandex_uri?: string | null;
}

interface Message {
    sender: 'user' | 'bot';
    text: string;
    recommendations?: MedicalCenter[];
}

export default function ChatInterface() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSendMessage = async () => {
        const messageText = inputValue.trim();
        if (messageText === '') return;

        const userMessage: Message = { sender: 'user', text: messageText };
        setMessages((prev) => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            const response = await fetch(`${OpenAPI.BASE}/api/v1/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('access_token') || ''}`,
                },
                body: JSON.stringify({ message: messageText }),
            });

            if (!response.ok) {
                throw new Error('No se pudo obtener respuesta del servidor');
            }

            const recommendations = (await response.json()) as MedicalCenter[];
            const botMessage: Message = {
                sender: 'bot',
                text:
                    recommendations.length > 0
                        ? `Encontre ${recommendations.length} recomendacion(es) para: "${messageText}".`
                        : `No encontre recomendaciones para: "${messageText}".`,
                recommendations,
            };

            setMessages((prev) => [...prev, botMessage]);
        } catch (error) {
            setMessages((prev) => [
                ...prev,
                {
                    sender: 'bot',
                    text: 'No pude conectar con el buscador medico. Revisa que el backend este corriendo y que YANDEX_API_KEY este disponible en el contenedor.',
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col h-[70vh]">
            <div className="flex-grow p-4 border rounded-lg overflow-y-auto">
                {messages.map((msg, index) => (
                    <div key={index} className={`mb-4 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                        <div className={`inline-block p-2 rounded-lg ${msg.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
                            {msg.text}
                        </div>
                        {msg.recommendations && (
                            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                                {msg.recommendations.map((center) => (
                                    <MedicalCenterCard key={center.id} center={center} />
                                ))}
                            </div>
                        )}
                    </div>
                ))}
                {isLoading && <div className="text-center">Buscando...</div>}
            </div>
            <div className="flex mt-4">
                <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Necesito un dentista en Kursk..."
                    disabled={isLoading}
                />
                <Button onClick={handleSendMessage} className="ml-2" disabled={isLoading}>
                    Enviar
                </Button>
            </div>
        </div>
    );
}
