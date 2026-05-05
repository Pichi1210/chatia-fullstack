
import { useState } from 'react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { MedicalCenterCard } from './MedicalCenterCard';
import { MedicalCenter } from '../../client/schemas.gen';
import { useClient } from '../../hooks/useClient';

interface Message {
    sender: 'user' | 'bot';
    text: string;
    recommendations?: MedicalCenter[];
}

export default function ChatInterface() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const client = useClient();

    const handleSendMessage = async () => {
        if (inputValue.trim() === '') return;

        const userMessage: Message = { sender: 'user', text: inputValue };
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            const response = await client.post('/api/v1/chat', { message: inputValue });
            const recommendations: MedicalCenter[] = response.data;

            const botMessage: Message = {
                sender: 'bot',
                text: recommendations.length > 0 ? 'Aquí tienes algunas recomendaciones:' : 'No he encontrado centros que coincidan con tu búsqueda.',
                recommendations: recommendations,
            };
            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            const errorMessage: Message = {
                sender: 'bot',
                text: 'Lo siento, ha ocurrido un error al procesar tu solicitud.',
            };
            setMessages(prev => [...prev, errorMessage]);
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
                                {msg.recommendations.map(center => (
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
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Necesito un dentista en Kursk..."
                    disabled={isLoading}
                />
                <Button onClick={handleSendMessage} className="ml-2" disabled={isLoading}>Enviar</Button>
            </div>
        </div>
    );
}
