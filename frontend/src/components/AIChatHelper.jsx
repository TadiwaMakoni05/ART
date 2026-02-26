import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, User as UserIcon } from "lucide-react";
import api from "../services/api";

const AIChatHelper = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "ai",
      text: "Hello! I am your AI Health Helper. Ask me about general health, nutrition, or adherence tips while your provider is unavailable.",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      sender: "user",
      text: inputText.trim(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    try {
      const res = await api.post("patient/ai-chat/", {
        message: userMessage.text,
      });
      const aiMessage = {
        id: Date.now() + 1,
        sender: "ai",
        text: res.data.response,
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("AI Chat Error:", error);
      const errorMessage = {
        id: Date.now() + 1,
        sender: "ai",
        text: "Sorry, I am having trouble connecting right now. Please try again later.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className="bg-white dark:bg-neutral-900 shadow-2xl dark:shadow-black/50 rounded-lg w-[90vw] sm:w-96 h-[60vh] sm:h-[500px] max-h-[85vh] flex flex-col mb-4 border border-neutral-200 dark:border-neutral-800 overflow-hidden animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-black dark:bg-neutral-950 text-white p-4 flex justify-between items-center border-b border-transparent dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              <div>
                <h3 className="font-bold text-sm">AI Health Helper</h3>
                <p className="text-xs text-blue-100">
                  When provider is not available
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-neutral-800 dark:hover:bg-neutral-800 p-1 rounded transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4 bg-neutral-50 dark:bg-neutral-900">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 max-w-[85%] ${
                  msg.sender === "user"
                    ? "self-end flex-row-reverse"
                    : "self-start"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    msg.sender === "user"
                      ? "bg-neutral-800 dark:bg-neutral-700 text-white"
                      : "bg-blue-100 dark:bg-blue-900/40 text-black dark:text-blue-400"
                  }`}
                >
                  {msg.sender === "user" ? (
                    <UserIcon className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>
                <div
                  className={`p-3 rounded-lg text-sm whitespace-pre-wrap ${
                    msg.sender === "user"
                      ? "bg-neutral-800 dark:bg-neutral-700 text-white rounded-tr-none"
                      : "bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-tl-none"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-2 self-start max-w-[85%]">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg rounded-tl-none">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-neutral-300 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-2 h-2 bg-neutral-300 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-2 h-2 bg-neutral-300 rounded-full animate-bounce"></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSend}
            className="p-3 bg-white dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800 flex gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask a health question..."
              className="flex-1 px-3 py-2 bg-neutral-100 dark:bg-neutral-900 dark:text-neutral-100 border-transparent focus:bg-white dark:focus:bg-neutral-800 focus:border-blue-500 focus:ring-0 rounded-md text-sm transition"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="p-2 bg-black dark:bg-blue-600 text-white hover:text-black dark:hover:text-white rounded-md hover:bg-white dark:hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-black dark:bg-blue-600 hover:bg-white dark:hover:bg-blue-700 text-white p-4 rounded-full shadow-lg shadow-blue-600/30 transition transform hover:scale-105 flex items-center justify-center"
          title="AI Health Helper"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      )}
    </div>
  );
};

export default AIChatHelper;
