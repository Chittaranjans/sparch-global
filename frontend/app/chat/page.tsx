'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, Briefcase } from 'lucide-react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  relevantJobs?: Array<{
    id: string;
    title: string;
    company: string;
    location: string;
  }>;
  aiPowered?: boolean;
}

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! 👋 I\'m your AI job search assistant. I can help you find jobs, analyze your resume, and answer questions about career opportunities. How can I help you today?',
      aiPowered: true
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    
    setLoading(true);
    
    try {
      const response = await api.chat(userMessage);
      
      // Add assistant response
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.message,
        relevantJobs: response.relevantJobs,
        aiPowered: response.aiPowered
      }]);
    } catch (error: any) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}. Please make sure the backend server is running on http://localhost:3000`,
        aiPowered: false
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleJobClick = (jobId: string) => {
    router.push(`/jobs/${jobId}`);
  };

  const suggestedPrompts = [
    "Show me software engineer jobs",
    "What remote positions are available?",
    "Help me find jobs in USA",
    "Tell me about senior roles"
  ];

  const handleSuggestedPrompt = (prompt: string) => {
    setInput(prompt);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Job Assistant</h1>
              <p className="text-sm text-gray-600">Powered by Gemini AI</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="space-y-6">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                )}
                
                <div className={`flex-1 max-w-2xl ${message.role === 'user' ? 'flex justify-end' : ''}`}>
                  <div
                    className={`rounded-2xl p-4 ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                        : 'bg-white shadow-md border border-gray-200'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    
                    {message.aiPowered && message.role === 'assistant' && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-indigo-600">
                        <Sparkles className="w-3 h-3" />
                        <span>AI-Powered Response</span>
                      </div>
                    )}
                    
                    {/* Relevant Jobs */}
                    {message.relevantJobs && message.relevantJobs.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <div className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <Briefcase className="w-4 h-4" />
                          Relevant Jobs:
                        </div>
                        {message.relevantJobs.map((job) => (
                          <button
                            key={job.id}
                            onClick={() => handleJobClick(job.id)}
                            className="w-full text-left p-3 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition border border-indigo-200"
                          >
                            <div className="font-semibold text-indigo-900">{job.title}</div>
                            <div className="text-sm text-indigo-700">{job.company} · {job.location}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                {message.role === 'user' && (
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
            ))}
            
            {loading && (
              <div className="flex gap-4 justify-start">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 max-w-2xl">
                  <div className="bg-white shadow-md border border-gray-200 rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Suggested Prompts (shown when no messages yet) */}
      {messages.length === 1 && (
        <div className="container mx-auto px-4 pb-4 max-w-4xl">
          <div className="text-sm text-gray-600 mb-3">Try asking:</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {suggestedPrompts.map((prompt, index) => (
              <button
                key={index}
                onClick={() => handleSuggestedPrompt(prompt)}
                className="text-left p-3 bg-white border border-gray-200 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition text-sm text-gray-700"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <div className="bg-white border-t border-gray-200 shadow-lg">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me about jobs, career advice, or anything else..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Send
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
