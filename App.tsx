import { useState, useEffect, useRef } from 'react';
import type { Message } from './types';

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "Olá! Sou a PsicologIA, como posso ajudar?", sender: "PsicologIA" }
  ]);
  const [inputMessage, setInputMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const appContainerRef = useRef<HTMLDivElement>(null);

  const chatBackground = "https://znrkkfmbjdtrgcovoeuq.supabase.co/storage/v1/object/public/midias/e7d30a649104448116bdb716e83cbb9d.jpg";
  const profileImage = "https://znrkkfmbjdtrgcovoeuq.supabase.co/storage/v1/object/public/midias/download.jpeg";
  const webhookUrl = "https://n8n-n8n-start.cvhx2u.easypanel.host/webhook/cae11428-77e5-4a33-9282-f8c9a97a4f55";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Adjust app height when virtual keyboard appears/disappears
  useEffect(() => {
    const visualViewport = window.visualViewport;
    if (!visualViewport) return;

    const handleResize = () => {
      if (appContainerRef.current) {
        appContainerRef.current.style.height = `${visualViewport.height}px`;
        scrollToBottom();
      }
    };

    visualViewport.addEventListener('resize', handleResize);
    handleResize(); // Initial call to set height

    return () => {
      visualViewport.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleSend = async () => {
    if (!inputMessage.trim() || isLoading) return;
    
    const userMessage: Message = { 
      id: Date.now(), 
      text: inputMessage, 
      sender: "user" 
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);
    
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: inputMessage })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        let botResponseText = '';
        
        if (data.output) {
          botResponseText = data.output;
        } else if (data.text) {
          botResponseText = data.text;
        } else if (data.message) {
          botResponseText = data.message;
        } else if (typeof data === 'string') {
          botResponseText = data;
        } else {
          botResponseText = JSON.stringify(data);
          botResponseText = botResponseText
            .replace(/{"output":|}/g, '')
            .replace(/\\n/g, '\n')
            .trim();
        }
        
        const sentences = (botResponseText.match(/[^.!?]+[.!?]+/g) || [botResponseText])
          .map(s => s.trim())
          .filter(s => s.length > 0);
        
        setIsLoading(false);
        
        if (sentences.length > 0) {
          setMessages(prev => [...prev, {
            id: Date.now(),
            text: sentences[0],
            sender: "PsicologIA"
          }]);
          
          const sendRemainingMessages = async () => {
            for (let i = 1; i < sentences.length; i++) {
              setIsLoading(true);
              await new Promise(resolve => setTimeout(resolve, 3000));
              
              setMessages(prev => [...prev, {
                id: Date.now() + i,
                text: sentences[i],
                sender: "PsicologIA"
              }]);
              
              setIsLoading(false);
            }
          };
          
          sendRemainingMessages();
        }
      } else {
        let errorMessage = "Erro na comunicação com o serviço";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          errorMessage = await response.text() || errorMessage;
        }
        
        const errorResponse: Message = {
          id: Date.now() + 1,
          text: `❌ ${errorMessage}`,
          sender: "PsicologIA"
        };
        setMessages(prev => [...prev, errorResponse]);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Webhook error:', error);
      const errorMessage: Message = {
        id: Date.now() + 1,
        text: "❌ Erro de conexão. Verifique sua internet e tente novamente.",
        sender: "PsicologIA"
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
    }
  };

  return (
    <div 
      ref={appContainerRef}
      className="flex flex-col bg-gray-100 font-sans overflow-hidden"
    >
      <header className="flex items-center px-4 py-3 bg-emerald-800 text-white shadow-md z-10">
        <img 
          src={profileImage} 
          alt="Profile" 
          className="w-10 h-10 rounded-full object-cover mr-4 border-2 border-emerald-300"
        />
        <div>
          <h1 className="font-semibold text-lg">PsicologIA</h1>
          <p className="text-xs text-emerald-300 flex items-center">
            <span className="w-2 h-2 bg-green-400 rounded-full mr-1.5"></span>
            online
          </p>
        </div>
      </header>

      <main 
        className="flex-1 overflow-y-auto p-4 space-y-4"
        style={{ 
          backgroundImage: `url(${chatBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`flex items-end my-2 ${message.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div 
              className={`max-w-[70%] rounded-2xl px-4 py-2.5 break-words ${
                message.sender === "user" 
                  ? "ml-auto bg-green-600 text-white rounded-br-none shadow-md" 
                  : "bg-white text-gray-800 rounded-bl-none shadow-md"
              }`}
            >
              {message.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-800 rounded-2xl px-4 py-2 rounded-tl-none shadow-md">
              <div className="flex items-center space-x-1.5">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      <footer className="bg-gray-200 px-4 py-3 border-t flex items-center gap-2">
        <input
          type="text"
          value={inputMessage}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputMessage(e.target.value)}
          onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleSend()}
          placeholder="Digite uma mensagem..."
          disabled={isLoading}
          className={`flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors text-gray-800 ${
            isLoading ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
          }`}
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !inputMessage.trim()}
          className={`bg-green-500 hover:bg-green-600 text-white p-3 rounded-full transition-all duration-200 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-300 disabled:cursor-not-allowed disabled:scale-100 ${
            isLoading ? 'w-12 h-12 flex justify-center items-center' : 'w-12 h-12'
          }`}
        >
          {isLoading ? (
            <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          )}
        </button>
      </footer>
    </div>
  );
}
