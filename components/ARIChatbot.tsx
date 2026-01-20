'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Pre-built responses for common questions
const FAQ_RESPONSES: Record<string, string> = {
  'shipping': `We partner with Gelato for worldwide print-on-demand shipping. Orders typically ship within 2-5 business days, with delivery times varying by location. You'll receive tracking information once your order ships.`,
  'returns': `We want you to love your purchase! If there's an issue with print quality or damage during shipping, please contact us within 14 days with photos and we'll make it right.`,
  'pricing': `Our pricing includes the base print cost, artist royalties, and a small platform fee. Final prices depend on the size, material, and finish you select. Artists receive a royalty from each sale of their work.`,
  'artkey': `ArtKey is our digital experience feature! Each physical art piece can include a QR code that links to a personalized digital portal with photos, videos, guestbook, and more. It's a way to add meaning and memories to your art.`,
  'custom': `We offer custom art commissions and personalized products. Visit our Contact page to discuss your project, or explore our Design Studio to create something unique.`,
  'artists': `We work with talented artists who share their work through our gallery. Each artist sets their own royalty, ensuring fair compensation for their creativity. Visit the Gallery to explore their collections.`,
  'order_status': `You can track your order at any time! Visit our Order Status page at /order-status and enter your email and order number (found in your confirmation email). You'll see your order status, items, and tracking information once shipped.`,
};

// Keywords to match for FAQ responses
const FAQ_KEYWORDS: Record<string, string[]> = {
  'order_status': ['order status', 'where is my order', 'track my order', 'my order', 'order number', 'check order', 'find order', 'order lookup'],
  'shipping': ['ship', 'shipping', 'delivery', 'deliver', 'track', 'tracking', 'arrive', 'when will'],
  'returns': ['return', 'refund', 'exchange', 'damaged', 'wrong', 'quality issue'],
  'pricing': ['price', 'pricing', 'cost', 'how much', 'expensive', 'fee', 'royalty'],
  'artkey': ['artkey', 'art key', 'qr code', 'digital', 'portal', 'guestbook'],
  'custom': ['custom', 'commission', 'personalize', 'design', 'create my own'],
  'artists': ['artist', 'gallery', 'who makes', 'creator'],
};

function findFAQResponse(message: string): string | null {
  const lowerMessage = message.toLowerCase();

  for (const [key, keywords] of Object.entries(FAQ_KEYWORDS)) {
    if (keywords.some(keyword => lowerMessage.includes(keyword))) {
      return FAQ_RESPONSES[key];
    }
  }

  return null;
}

function generateResponse(message: string): string {
  // Check for FAQ match first
  const faqResponse = findFAQResponse(message);
  if (faqResponse) {
    return faqResponse;
  }

  // Check for greetings
  const greetings = ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'];
  if (greetings.some(g => message.toLowerCase().includes(g))) {
    return `Hello! I'm A.R.I., your Artful Responsive Intelligence assistant. I can help you with questions about shipping, returns, pricing, our ArtKey digital experience, custom orders, and our artists. What would you like to know?`;
  }

  // Check for thanks
  if (message.toLowerCase().includes('thank')) {
    return `You're welcome! Is there anything else I can help you with?`;
  }

  // Default response
  return `I'd be happy to help with that! For more specific assistance, you can:\n\n• Visit our Contact page to reach our team directly\n• Explore the Gallery to browse artist collections\n• Check out the Shop for product options\n\nIs there something specific about shipping, pricing, returns, or ArtKey I can help clarify?`;
}

export default function ARIChatbot() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hi! I'm A.R.I. (Artful Responsive Intelligence), your guide to The Artful Experience. How can I help you today?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check if chatbot is enabled
  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        setIsEnabled(data.chatbotEnabled ?? false);
        setIsLoading(false);
      })
      .catch(() => {
        setIsEnabled(false);
        setIsLoading(false);
      });
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Don't render if disabled or still loading
  if (isLoading || !isEnabled) {
    return null;
  }

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate typing delay
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700));

    const response = generateResponse(userMessage.content);

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response,
      timestamp: new Date(),
    };

    setIsTyping(false);
    setMessages(prev => [...prev, assistantMessage]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center ${isOpen ? 'hidden' : ''}`}
        aria-label="Open chat"
      >
        <MessageCircle className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></span>
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] h-[500px] max-h-[calc(100vh-6rem)] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">A.R.I.</h3>
                <p className="text-xs text-white/80">Artful Responsive Intelligence</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
              aria-label="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-br-md'
                      : 'bg-white text-gray-800 shadow-sm rounded-bl-md border border-gray-100'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-800 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-gray-100">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-sm"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md transition-shadow"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              A.R.I. provides general assistance. For complex inquiries, please contact us.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
