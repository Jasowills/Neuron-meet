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
    <div className="flex h-full flex-col bg-transparent">
      <div className="border-b border-[rgba(23,32,51,0.08)] p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-dark-300">
              Conversation
            </p>
            <h3 className="mt-1 text-lg font-semibold text-dark-900">Chat</h3>
          </div>
          <button
            onClick={toggleChat}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[rgba(23,32,51,0.1)] bg-white/78 text-dark-700 transition hover:bg-white hover:text-dark-900"
            title="Close chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="rounded-[10px] border border-[rgba(23,32,51,0.1)] bg-white/70 px-5 py-8 text-center text-dark-300">
            <p className="text-sm font-medium text-dark-900">No chat yet</p>
            <p className="mt-1 text-xs text-dark-400">
              Messages stay inside this room
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
        <div className="px-4 py-2 text-sm text-dark-300">
          {typingUsersList.length === 1
            ? `${typingUsersList[0]} is typing`
            : `${typingUsersList.length} people are typing`}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="border-t border-[rgba(23,32,51,0.08)] p-4"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={handleInputChange}
            placeholder="Write a message"
            className="flex-1 rounded-[8px] border border-[rgba(23,32,51,0.12)] bg-white/84 px-4 py-3 text-[0.98rem] text-dark-900 outline-none transition placeholder:text-[#77839a] focus:border-[rgba(196,164,106,0.55)] focus:shadow-[0_0_0_4px_rgba(196,164,106,0.12)]"
          />
          <button
            type="submit"
            disabled={!message.trim()}
            className="inline-flex h-[50px] w-[50px] items-center justify-center rounded-[8px] bg-[linear-gradient(135deg,var(--nm-brand)_0%,#3153bd_100%)] text-white shadow-[0_14px_24px_rgba(32,55,138,0.2)] transition hover:translate-y-[-1px] hover:shadow-[0_18px_28px_rgba(32,55,138,0.24)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            title="Send message"
          >
            <Send className="h-4.5 w-4.5" />
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
      <div className="py-1 text-center text-xs text-dark-300">
        {message.content}
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-dark-300 text-xs uppercase tracking-[0.14em]">
          {isOwn ? "You" : message.senderName}
        </span>
        <span className="text-dark-400 text-xs">
          {formatTime(message.timestamp)}
        </span>
      </div>
      <div
        className={`max-w-[80%] rounded-[10px] border px-3 py-2.5 ${
          isOwn
            ? "border-primary-500/40 bg-primary-600 text-white"
            : "border-[rgba(23,32,51,0.1)] bg-white/72 text-dark-900"
        }`}
      >
        <p className="text-sm break-words">{message.content}</p>
      </div>
    </div>
  );
}
