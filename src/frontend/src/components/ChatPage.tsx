import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  Cloud,
  LogOut,
  MessageCircle,
  Send,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Message } from "../backend.d";
import { Variant_user_assistant } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useClearHistory,
  useGetAssistantName,
  useGetMessages,
  useSendMessage,
} from "../hooks/useQueries";
import { type ConversationContext, generateNLPResponse } from "../lib/nlp";

interface LocalMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: bigint;
}

function formatTime(timestamp: bigint): string {
  const ms = Number(timestamp / BigInt(1_000_000));
  const date = new Date(ms);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function isUserMessage(msg: Message): boolean {
  return msg.role === Variant_user_assistant.user;
}

function toLocalMessage(msg: Message): LocalMessage {
  return {
    id: `${msg.timestamp}-${msg.role}`,
    role: isUserMessage(msg) ? "user" : "assistant",
    content: msg.content,
    timestamp: msg.timestamp,
  };
}

function TypingIndicator({ assistantName }: { assistantName: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 4, scale: 0.96 }}
      transition={{ duration: 0.25 }}
      className="flex items-end gap-2.5 justify-start px-4"
    >
      {/* Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-accent flex items-center justify-center shadow-sm">
        <Cloud className="w-4 h-4 text-primary" />
      </div>

      <div className="flex flex-col items-start gap-1">
        <span className="text-xs text-muted-foreground font-medium px-1">
          {assistantName}
        </span>
        <div className="bg-bubble-assistant border border-border/60 rounded-2xl rounded-bl-sm px-4 py-3 shadow-bubble flex items-center gap-1.5">
          <span className="typing-dot w-2 h-2 bg-muted-foreground rounded-full" />
          <span className="typing-dot w-2 h-2 bg-muted-foreground rounded-full" />
          <span className="typing-dot w-2 h-2 bg-muted-foreground rounded-full" />
        </div>
      </div>
    </motion.div>
  );
}

function ChatBubble({
  message,
  assistantName,
  index,
}: {
  message: LocalMessage;
  assistantName: string;
  index: number;
}) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 12,
        x: isUser ? 12 : -12,
      }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      transition={{
        duration: 0.35,
        delay: Math.min(index * 0.03, 0.3),
        ease: "easeOut",
      }}
      className={`flex items-end gap-2.5 px-4 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {/* Assistant avatar */}
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-accent flex items-center justify-center shadow-sm">
          <Cloud className="w-4 h-4 text-primary" />
        </div>
      )}

      <div
        className={`flex flex-col gap-1 max-w-[72%] sm:max-w-[60%] ${isUser ? "items-end" : "items-start"}`}
      >
        {/* Name label */}
        <span className="text-xs text-muted-foreground font-medium px-1">
          {isUser ? "You" : assistantName}
        </span>

        {/* Bubble */}
        <div
          className={`
            px-4 py-3 shadow-bubble leading-relaxed text-sm
            ${
              isUser
                ? "bg-bubble-user text-bubble-user-foreground rounded-2xl rounded-br-sm"
                : "bg-bubble-assistant text-bubble-assistant-foreground border border-border/60 rounded-2xl rounded-bl-sm"
            }
          `}
        >
          {message.content.split("\n").map((line, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: line order in message text is stable
            <span key={i}>
              {line}
              {i < message.content.split("\n").length - 1 && <br />}
            </span>
          ))}
        </div>

        {/* Timestamp */}
        <span className="text-[10px] text-muted-foreground/70 px-1">
          {formatTime(message.timestamp)}
        </span>
      </div>

      {/* User avatar */}
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary/50 to-primary flex items-center justify-center shadow-sm text-primary-foreground text-xs font-bold">
          You
        </div>
      )}
    </motion.div>
  );
}

function EmptyChat({ assistantName }: { assistantName: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="flex flex-col items-center justify-center h-full gap-4 px-8 text-center py-12"
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{
          duration: 4,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
        className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent flex items-center justify-center shadow-cloud"
      >
        <img
          src="/assets/generated/cloudshare-logo-transparent.dim_80x80.png"
          alt={assistantName}
          className="w-12 h-12 object-contain"
        />
      </motion.div>
      <div>
        <h3 className="font-display text-lg font-semibold text-foreground mb-1">
          Hello, I'm {assistantName}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
          I'm here to listen, support, and be present with you. What's on your
          mind today?
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2 mt-2">
        {[
          "I need to talk about something",
          "I'm feeling overwhelmed",
          "Help me reflect",
        ].map((prompt) => (
          <span
            key={prompt}
            className="px-3 py-1.5 text-xs rounded-full bg-secondary text-secondary-foreground border border-border/50"
          >
            {prompt}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

export default function ChatPage() {
  const { clear } = useInternetIdentity();
  const { data: assistantName = "Your Assistant" } = useGetAssistantName();
  const { data: messagesData, isLoading: messagesLoading } = useGetMessages();
  const sendMessage = useSendMessage();
  const clearHistory = useClearHistory();

  const [localMessages, setLocalMessages] = useState<LocalMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [lastNLPTopic, setLastNLPTopic] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Hydrate from backend
  useEffect(() => {
    if (messagesData) {
      setLocalMessages(messagesData.map(toLocalMessage));
    }
  }, [messagesData]);

  // Auto-scroll on new messages
  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on content changes
  useEffect(() => {
    scrollToBottom();
  }, [localMessages, isTyping, scrollToBottom]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || sendMessage.isPending || isTyping) return;

    const userMsg: LocalMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
      timestamp: BigInt(Date.now()) * BigInt(1_000_000),
    };

    setLocalMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Build conversation context for NLP
    const nlpContext: ConversationContext = {
      lastTopic: lastNLPTopic,
      messageCount: localMessages.length,
      assistantName: displayName,
    };

    // Try client-side NLP first for richer, more human responses
    const nlpResult = generateNLPResponse(trimmed, nlpContext);

    try {
      if (nlpResult) {
        // Use NLP-generated response — still call backend for persistence
        // but display our richer response
        const now = BigInt(Date.now()) * BigInt(1_000_000);
        const assistantMsg: LocalMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: nlpResult.response,
          timestamp: now + BigInt(1),
        };

        // Add a small delay to simulate natural response time
        await new Promise((resolve) =>
          setTimeout(resolve, 600 + Math.random() * 800),
        );
        setLastNLPTopic(nlpResult.topic);
        setLocalMessages((prev) => [...prev, assistantMsg]);

        // Fire-and-forget backend call for persistence
        sendMessage.mutate(trimmed);
      } else {
        // Fall back to backend response
        const response = await sendMessage.mutateAsync(trimmed);
        setLocalMessages((prev) => [...prev, toLocalMessage(response)]);
      }
    } catch {
      toast.error("Couldn't send message. Please try again.");
      setLocalMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
      setInput(trimmed);
    } finally {
      setIsTyping(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const handleClearHistory = async () => {
    try {
      await clearHistory.mutateAsync();
      setLocalMessages([]);
      toast.success("Chat history cleared.");
    } catch {
      toast.error("Couldn't clear history. Please try again.");
    }
  };

  const displayName = assistantName ?? "Your Assistant";

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="flex items-center justify-between px-4 sm:px-6 py-3 bg-card/90 backdrop-blur-sm border-b border-border/60 shadow-xs z-10"
      >
        {/* Left: logo + name */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/25 to-accent flex items-center justify-center shadow-sm">
              <img
                src="/assets/generated/cloudshare-logo-transparent.dim_80x80.png"
                alt="CloudShare"
                className="w-7 h-7 object-contain"
              />
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-card" />
          </div>
          <div>
            <h1 className="font-display font-semibold text-foreground leading-tight text-sm sm:text-base">
              {displayName}
            </h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Your personal assistant · Online
            </p>
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Clear history */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 px-2 sm:px-3 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-colors gap-1.5"
                title="Clear chat history"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline text-xs font-medium">
                  Clear
                </span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-3xl border-border/60 shadow-cloud-lg">
              <AlertDialogHeader>
                <div className="flex justify-center mb-3">
                  <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-destructive" />
                  </div>
                </div>
                <AlertDialogTitle className="font-display text-center">
                  Clear chat history?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-center leading-relaxed">
                  This will permanently delete all your conversations with{" "}
                  {displayName}. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="sm:justify-center gap-2">
                <AlertDialogCancel className="rounded-2xl flex-1 sm:flex-none">
                  Keep it
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => void handleClearHistory()}
                  className="rounded-2xl bg-destructive hover:bg-destructive/90 flex-1 sm:flex-none"
                >
                  Yes, clear all
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Sign out */}
          <Button
            variant="ghost"
            size="sm"
            onClick={clear}
            className="h-9 px-2 sm:px-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors gap-1.5"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline text-xs font-medium">
              Sign out
            </span>
          </Button>
        </div>
      </motion.header>

      {/* Chat area */}
      <div className="flex-1 overflow-hidden relative">
        {/* Subtle background texture */}
        <div
          className="absolute inset-0 cloud-bg opacity-20"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-background/70" aria-hidden="true" />

        <ScrollArea className="relative h-full" ref={scrollRef}>
          <div className="py-4 space-y-4 min-h-full flex flex-col">
            {messagesLoading ? (
              // Loading skeleton
              <div className="space-y-4 px-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`flex gap-2.5 ${i % 2 === 0 ? "justify-end" : ""}`}
                  >
                    {i % 2 !== 0 && (
                      <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                    )}
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-16 rounded" />
                      <Skeleton
                        className={`h-12 rounded-2xl ${i % 2 === 0 ? "w-48" : "w-56"}`}
                      />
                    </div>
                    {i % 2 === 0 && (
                      <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            ) : localMessages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <EmptyChat assistantName={displayName} />
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence initial={false}>
                  {localMessages.map((msg, i) => (
                    <ChatBubble
                      key={msg.id}
                      message={msg}
                      assistantName={displayName}
                      index={i}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Typing indicator */}
            <AnimatePresence>
              {isTyping && <TypingIndicator assistantName={displayName} />}
            </AnimatePresence>

            <div ref={bottomRef} className="h-2" />
          </div>
        </ScrollArea>
      </div>

      {/* Input area */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.2, ease: "easeOut" }}
        className="bg-card/90 backdrop-blur-sm border-t border-border/60 px-4 sm:px-6 py-4"
      >
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Message ${displayName}…`}
                disabled={isTyping || sendMessage.isPending}
                rows={1}
                className="resize-none min-h-[48px] max-h-32 rounded-2xl border-border/70 bg-muted/30 text-sm placeholder:text-muted-foreground/60 focus-visible:ring-primary/30 pr-2 py-3 leading-relaxed overflow-y-auto"
                style={{
                  height: "auto",
                }}
              />
            </div>

            <Button
              onClick={() => void handleSend()}
              disabled={!input.trim() || isTyping || sendMessage.isPending}
              className="h-12 w-12 p-0 rounded-2xl flex-shrink-0 shadow-cloud hover:shadow-cloud-lg transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:scale-100"
              aria-label="Send message"
            >
              {isTyping || sendMessage.isPending ? (
                <span className="flex gap-0.5">
                  <span className="typing-dot w-1 h-1 bg-primary-foreground rounded-full" />
                  <span className="typing-dot w-1 h-1 bg-primary-foreground rounded-full" />
                  <span className="typing-dot w-1 h-1 bg-primary-foreground rounded-full" />
                </span>
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>

          <div className="flex items-center justify-between mt-2 px-1">
            <p className="text-[10px] text-muted-foreground/60">
              Press Enter to send · Shift+Enter for new line
            </p>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
              <MessageCircle className="w-3 h-3" />
              <span>{localMessages.length} messages</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Footer */}
      <div className="text-center py-2 text-[10px] text-muted-foreground/50 bg-card/80 border-t border-border/30">
        Web by Triptika Dey
      </div>
    </div>
  );
}
