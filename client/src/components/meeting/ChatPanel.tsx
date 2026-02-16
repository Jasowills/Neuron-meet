import { useState, useRef, useEffect } from "react";
import { Send, X } from "lucide-react";
import { useMeetingStore, ChatMessage } from "@/store/useMeetingStore";

interface ChatPanelProps {
  onSendMessage: (content: string) => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
}

export default function ChatPanel({
  onSendMessage,
  onTypingStart,
  onTypingStop,
}: ChatPanelProps) {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { messages, typingUsers, toggleChat, localParticipant } =
    useMeetingStore();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage("");
      onTypingStop();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);

    // Handle typing indicator
    if (e.target.value.length > 0) {
      onTypingStart();

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set new timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        onTypingStop();
      }, 2000);
    } else {
      onTypingStop();
    }
  };

  const typingUsersList = Array.from(typingUsers.values());

  return (
    <div className="flex flex-col h-full bg-dark-800">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-dark-700">
        <h3 className="text-white font-semibold">In-call messages</h3>
        <button
          onClick={toggleChat}
          className="btn btn-ghost btn-icon"
          title="Close chat"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-dark-400 py-8">
            <p className="text-sm">No messages yet</p>
            <p className="text-xs mt-1">
              Messages are only visible to people in the call
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.senderId === localParticipant?.socketId}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing indicator */}
      {typingUsersList.length > 0 && (
        <div className="px-4 py-2 text-dark-400 text-sm">
          {typingUsersList.length === 1
            ? `${typingUsersList[0]} is typing...`
            : `${typingUsersList.length} people are typing...`}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-dark-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={handleInputChange}
            placeholder="Send a message..."
            className="input flex-1"
          />
          <button
            type="submit"
            disabled={!message.trim()}
            className="btn btn-primary btn-icon"
            title="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}

function MessageBubble({
  message,
  isOwn,
}: {
  message: ChatMessage;
  isOwn: boolean;
}) {
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (message.type === "SYSTEM") {
    return (
      <div className="text-center text-dark-400 text-xs py-1">
        {message.content}
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-dark-400 text-xs">
          {isOwn ? "You" : message.senderName}
        </span>
        <span className="text-dark-500 text-xs">
          {formatTime(message.timestamp)}
        </span>
      </div>
      <div
        className={`max-w-[80%] rounded-xl px-3 py-2 ${
          isOwn ? "bg-primary-600 text-white" : "bg-dark-700 text-white"
        }`}
      >
        <p className="text-sm break-words">{message.content}</p>
      </div>
    </div>
  );
}
