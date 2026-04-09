"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, Sparkles, X, Loader2, Mail } from "lucide-react";
import { useTranslations } from "@/i18n/locale-provider";

type Message = { text: string; isUser: boolean; isFallback?: boolean };

type AiAssistantProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
};

export function AiAssistant({
  isOpen,
  onClose,
  title,
  description,
}: AiAssistantProps) {
  const { t, locale } = useTranslations();
  const [input, setInput] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    // Lock body scroll while open
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  // Autofocus input when opening
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 250);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  /**
   * Call the real AI endpoint (/api/chat). The backend is
   * grounded on a static BetsPlug knowledge base and replies
   * in the user's locale. If the model can't confidently
   * answer, the response comes back with `fallback: true`
   * and we render a support@betsplug.com mail-link card.
   */
  const askAssistant = async (history: Message[]) => {
    setIsTyping(true);
    try {
      const payload = {
        locale,
        messages: history.map((m) => ({
          role: m.isUser ? "user" : "assistant",
          content: m.text,
        })),
      };
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as {
        reply?: string;
        answered?: boolean;
        fallback?: boolean;
      };
      const reply =
        (data.reply && data.reply.trim()) || t("chatbot.replyDefault");
      setMessages((prev) => [
        ...prev,
        { text: reply, isUser: false, isFallback: Boolean(data.fallback) },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          text: t("chatbot.replyDefault"),
          isUser: false,
          isFallback: true,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const sendMessage = (raw: string) => {
    const userMessage = raw.trim();
    if (userMessage === "") return;
    const next: Message[] = [...messages, { text: userMessage, isUser: true }];
    setMessages(next);
    askAssistant(next);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (input.trim() === "" || isTyping) return;
    const userMessage = input.trim();
    setInput("");
    sendMessage(userMessage);
  };

  const clearChat = () => setMessages([]);

  const suggestions = [
    t("chatbot.suggestion1"),
    t("chatbot.suggestion2"),
    t("chatbot.suggestion3"),
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Panel wrapper — clicks OUTSIDE the inner card close the chat
              (the inner card uses stopPropagation). This makes the dialog
              dismissable from any empty area around it. */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title ?? "AI Assistant"}
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            onClick={onClose}
            className="fixed inset-0 z-[101] flex items-end justify-center p-0 sm:items-center sm:p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative mx-auto flex h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl border border-green-500/20 bg-gradient-to-br from-[#0a1220] via-[#0b1624] to-[#081019] shadow-2xl shadow-green-500/10 sm:h-[640px] sm:rounded-3xl"
            >
              {/* Ambient glow */}
              <div className="pointer-events-none absolute -left-20 -top-20 h-[280px] w-[280px] rounded-full bg-green-500/[0.12] blur-[120px]" />
              <div className="pointer-events-none absolute -right-20 -bottom-20 h-[280px] w-[280px] rounded-full bg-emerald-500/[0.10] blur-[120px]" />

              {/* Header — close button lives INLINE here so it can never
                  be hidden by absolute positioning or z-index issues. */}
              <div className="relative z-10 flex shrink-0 items-center justify-between gap-2 border-b border-white/[0.08] bg-white/[0.03] p-3 backdrop-blur-sm sm:p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-500/15 shadow-[0_0_20px_rgba(74,222,128,0.25)] ring-1 ring-green-500/30">
                    <Sparkles className="h-5 w-5 text-green-400" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-extrabold tracking-tight text-white sm:text-base">
                      {title ?? t("chatbot.title")}
                    </h2>
                    <div className="flex items-center gap-1.5">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-400" />
                      </span>
                      <p className="text-[10px] font-medium uppercase tracking-widest text-green-400/80">
                        {t("chatbot.online")}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  {messages.length > 0 && (
                    <button
                      type="button"
                      onClick={clearChat}
                      className="hidden rounded-lg px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400 transition-colors hover:bg-white/[0.05] hover:text-white sm:inline-flex"
                    >
                      {t("chatbot.clear")}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label={t("chatbot.close")}
                    title={t("chatbot.close")}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.1] bg-white/[0.04] text-slate-300 transition-all hover:border-red-500/50 hover:bg-red-500/20 hover:text-white"
                  >
                    <X className="h-5 w-5" strokeWidth={2.5} />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="relative flex-1 overflow-y-auto p-4 sm:p-5">
                {messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500/25 to-emerald-500/10 shadow-[0_0_40px_rgba(74,222,128,0.25)] ring-1 ring-green-500/30">
                      <Sparkles className="h-7 w-7 text-green-400" />
                    </div>
                    <h3 className="mb-2 text-xl font-extrabold tracking-tight text-white">
                      {t("chatbot.greetingTitle")}
                    </h3>
                    <p className="max-w-xs text-sm leading-relaxed text-slate-400">
                      {description ?? t("chatbot.greetingDesc")}
                    </p>
                    <div className="mt-6 flex w-full max-w-sm flex-col gap-2">
                      {suggestions.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => sendMessage(s)}
                          className="group flex items-center justify-between gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-left text-xs text-slate-300 transition-all hover:border-green-500/30 hover:bg-green-500/[0.06] hover:text-white"
                        >
                          <span className="truncate">{s}</span>
                          <Send className="h-3 w-3 flex-shrink-0 text-slate-500 transition-colors group-hover:text-green-400" />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {messages.map((msg, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        className={`flex ${msg.isUser ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                            msg.isUser
                              ? "rounded-tr-sm bg-gradient-to-br from-green-500 to-emerald-500 font-semibold text-black shadow-green-500/20"
                              : msg.isFallback
                                ? "rounded-tl-sm border border-green-500/25 bg-green-500/[0.06] text-slate-100 backdrop-blur-sm"
                                : "rounded-tl-sm border border-white/[0.08] bg-white/[0.04] text-slate-100 backdrop-blur-sm"
                          }`}
                        >
                          <div className="whitespace-pre-wrap">{msg.text}</div>
                          {msg.isFallback && !msg.isUser && (
                            <a
                              href="mailto:support@betsplug.com"
                              className="mt-3 inline-flex items-center gap-2 rounded-full border border-green-500/40 bg-green-500/[0.12] px-3 py-1.5 text-xs font-bold text-green-300 transition-all hover:border-green-500/60 hover:bg-green-500/20 hover:text-white"
                            >
                              <Mail className="h-3.5 w-3.5" />
                              support@betsplug.com
                            </a>
                          )}
                        </div>
                      </motion.div>
                    ))}
                    {isTyping && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-start"
                      >
                        <div className="rounded-2xl rounded-tl-sm border border-white/[0.08] bg-white/[0.04] px-4 py-3 backdrop-blur-sm">
                          <div className="flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-green-400 [animation-delay:-0.3s]" />
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-green-400 [animation-delay:-0.15s]" />
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-green-400" />
                          </div>
                        </div>
                      </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Input */}
              <form
                onSubmit={handleSubmit}
                className={`relative border-t p-3 transition-colors duration-200 sm:p-4 ${
                  isFocused
                    ? "border-green-500/40 bg-white/[0.04]"
                    : "border-white/[0.08] bg-white/[0.02]"
                }`}
              >
                <div className="relative flex items-center">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder={t("chatbot.placeholder")}
                    className="w-full rounded-full border border-white/[0.1] bg-white/[0.04] py-3 pl-5 pr-14 text-sm text-white placeholder:text-slate-500 focus:border-green-500/50 focus:outline-none focus:ring-2 focus:ring-green-500/30"
                  />
                  <button
                    type="submit"
                    disabled={input.trim() === "" || isTyping}
                    aria-label="Send"
                    className={`absolute right-1.5 flex h-9 w-9 items-center justify-center rounded-full transition-all ${
                      input.trim() === "" || isTyping
                        ? "cursor-not-allowed bg-white/[0.05] text-slate-500"
                        : "btn-gradient text-black shadow-lg shadow-green-500/30 hover:shadow-green-500/50"
                    }`}
                  >
                    {isTyping ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="mt-2 text-center text-[10px] text-slate-500">
                  {t("chatbot.footer")}
                </p>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default AiAssistant;
