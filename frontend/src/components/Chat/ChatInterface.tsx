
import { useState } from 'react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { MedicalCenterCard } from './MedicalCenterCard';

interface Message {
    sender: 'user' | 'bot';
    text: string;
    recommendations?: any[];
}

export default function ChatInterface() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSendMessage = async () => {
        if (inputValue.trim() === '') return;

        const userMessage: Message = { sender: 'user', text: inputValue };
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        // Mock bot response
        const botMessage: Message = { 
            sender: 'bot', 
            text: `He recibido tu mensaje: "${inputValue}". Aquí tienes algunas recomendaciones:`,
            recommendations: [
                {
                    id: 1,
                    name: "Mock Clinic",
                    address: "123 Mock Street, Kursk",
                    city: "Kursk",
                    category: "Clinic",
                    specialty: "Dentist",
                    latitude: 51.7393,
                    longitude: 36.1872,
                    rating: 4.5,
                    phone: "+71234567890",
                    working_hours: "Mo-Fr 09:00-18:00",
                    emergency_available: true,
                    yandex_uri: "https://yandex.ru/maps/"
                }
            ]
        };

        setTimeout(() => {
            setMessages(prev => [...prev, botMessage]);
            setIsLoading(false);
        }, 1000)
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
