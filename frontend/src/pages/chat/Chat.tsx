// pages/chat/Chat.tsx

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Bot, Send, Sparkles, User, Zap, TriangleAlert, Plus, MessageSquare, Trash2 } from "lucide-react";

import { chatService } from "@/api/services/chat.service";
import type { ConversationSummary } from "@/types/chat.types";

interface ChatMessage {
    text: string;
    sender: "user" | "bot";
    isLoading?: boolean;
}

const STORAGE_KEY = "lms_chat_messages";

const SUGGESTIONS = [
    "Give me my attendance summary",
    "What courses am I enrolled in?",
    "How much course progress do I have left?",
];

const CAPABILITIES = [
    "Remembers what you asked earlier in the conversation",
    "Looks up your live courses, sessions, and attendance",
    "Tracks your progress across every enrolled course",
];

const LIMITATIONS = [
    "May occasionally get a detail wrong — double-check anything critical",
    "Only knows about your account, not other students' data",
    "Can't update your attendance or enrollments directly",
];

const getInitialMessages = (): ChatMessage[] => {
    try {
        const stored = sessionStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

const Chat: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>(getInitialMessages);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const [conversationId, setConversationId] = useState<string | null>(null);
    const [conversations, setConversations] = useState<ConversationSummary[]>([]);
    const [conversationsLoading, setConversationsLoading] = useState(false);
    const [historyLoadingId, setHistoryLoadingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const bottomRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    const loadConversations = useCallback(async () => {
        setConversationsLoading(true);
        try {
            const res = await chatService.getConversations();
            setConversations(res.conversations);
        } catch {
            // silent — sidebar list is non-critical, chat still works without it
        } finally {
            setConversationsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadConversations();
    }, [loadConversations]);

    const handleNewChat = () => {
        setConversationId(null);
        setMessages([]);
        setInput("");
        inputRef.current?.focus();
    };

    const handleSelectConversation = async (id: string) => {
        if (id === conversationId || historyLoadingId) return;

        setHistoryLoadingId(id);
        try {
            const detail = await chatService.getConversationDetail(id);
            const mapped: ChatMessage[] = detail.messages.map((m) => ({
                text: m.content,
                sender: m.role === "user" ? "user" : "bot",
            }));

            setConversationId(detail.id);
            setMessages(mapped);
        } catch {
            // leave current view untouched if the fetch fails
        } finally {
            setHistoryLoadingId(null);
            inputRef.current?.focus();
        }
    };

    const handleDeleteConversation = async (
        e: React.MouseEvent,
        id: string
    ) => {
        e.stopPropagation(); // don't trigger handleSelectConversation
        if (deletingId) return;

        const confirmed = window.confirm(
            "Delete this conversation? This can't be undone."
        );
        if (!confirmed) return;

        setDeletingId(id);
        const previousConversations = conversations;

        // optimistic removal from the list
        setConversations((prev) => prev.filter((c) => c.id !== id));

        try {
            await chatService.deleteConversation(id);

            // if the deleted conversation was the one open, reset to a new chat
            if (id === conversationId) {
                handleNewChat();
            }
        } catch {
            // restore the list if the delete failed
            setConversations(previousConversations);
        } finally {
            setDeletingId(null);
        }
    };

    const sendMessage = async (e?: React.FormEvent, overrideText?: string) => {
        e?.preventDefault();

        const text = (overrideText ?? input).trim();
        if (!text || isLoading) return;

        const userMessage: ChatMessage = { text, sender: "user" };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        setMessages((prev) => [
            ...prev,
            { text: "Typing...", sender: "bot", isLoading: true },
        ]);

        try {
            const res = await chatService.sendMessage({
                message: text,
                conversation_id: conversationId,
            });

            const botResponse: ChatMessage = {
                text: res.response || "No reply from server.",
                sender: "bot",
            };

            setMessages((prev) => [
                ...prev.filter((msg) => !msg.isLoading),
                botResponse,
            ]);

            if (res.conversation_id !== conversationId) {
                setConversationId(res.conversation_id);
            }
            loadConversations();
        } catch (error: any) {
            const detail =
                error?.message || "Something went wrong while contacting the assistant.";

            setMessages((prev) => [
                ...prev.filter((msg) => !msg.isLoading),
                { text: String(detail), sender: "bot" },
            ]);
        } finally {
            setIsLoading(false);
            inputRef.current?.focus();
        }
    };

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }, [messages]);

    const isEmpty = messages.length === 0;

    return (
        <div className="flex h-full min-h-0 w-full overflow-hidden bg-[#1E1E1E]">
            {/* Main chat column — unchanged */}
            <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[#1E1E1E]">
                {/* Body — only this area scrolls; bottom padding reserves room for the floating input */}
                <div className="flex-1 min-h-0 overflow-y-auto bg-[#141414] px-5 pb-28 pt-6 no-scrollbar">
                    {isEmpty ? (
                        <div className="mx-auto flex max-w-3xl flex-col items-center pt-6">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#10A37F]/15 text-[#10A37F]">
                                <Bot size={28} />
                            </div>
                            <h2 className="mt-4 text-2xl font-semibold text-[#E1E1E1]">
                                AI Assistant
                            </h2>
                            <p className="mt-1 text-sm text-[#E1E1E1]/50">
                                Your courses, sessions, and attendance — just ask
                            </p>

                            <div className="mt-8 grid w-full grid-cols-1 gap-6 sm:grid-cols-3">
                                {/* Examples */}
                                <div className="flex flex-col items-center gap-3">
                                    <div className="flex items-center gap-1.5 text-[#E1E1E1]/70">
                                        <Sparkles size={15} className="text-[#10A37F]" />
                                        <span className="text-sm font-medium">Examples</span>
                                    </div>
                                    <div className="flex w-full flex-col gap-2.5">
                                        {SUGGESTIONS.map((s) => (
                                            <button
                                                key={s}
                                                onClick={() => sendMessage(undefined, s)}
                                                className="w-full rounded-xl border border-[#343540] bg-[#1E1E1E] px-4 py-3 text-left text-xs text-[#E1E1E1]/80 transition hover:border-[#10A37F]/50 hover:text-[#E1E1E1]"
                                            >
                                                "{s}" →
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Capabilities */}
                                <div className="flex flex-col items-center gap-3">
                                    <div className="flex items-center gap-1.5 text-[#E1E1E1]/70">
                                        <Zap size={15} className="text-[#10A37F]" />
                                        <span className="text-sm font-medium">Capabilities</span>
                                    </div>
                                    <div className="flex w-full flex-col gap-2.5">
                                        {CAPABILITIES.map((c) => (
                                            <div
                                                key={c}
                                                className="w-full rounded-xl border border-[#343540] bg-[#1E1E1E] px-4 py-3 text-center text-xs text-[#E1E1E1]/80"
                                            >
                                                {c}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Limitations */}
                                <div className="flex flex-col items-center gap-3">
                                    <div className="flex items-center gap-1.5 text-[#E1E1E1]/70">
                                        <TriangleAlert size={15} className="text-[#10A37F]" />
                                        <span className="text-sm font-medium">Limitations</span>
                                    </div>
                                    <div className="flex w-full flex-col gap-2.5">
                                        {LIMITATIONS.map((l) => (
                                            <div
                                                key={l}
                                                className="w-full rounded-xl border border-[#343540] bg-[#1E1E1E] px-4 py-3 text-center text-xs text-[#E1E1E1]/80"
                                            >
                                                {l}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="mx-auto flex max-w-2xl flex-col gap-4">
                            {messages.map((msg, i) => (
                                <div
                                    key={i}
                                    className={`flex items-end gap-2 ${msg.sender === "user" ? "flex-row-reverse" : ""
                                        }`}
                                >
                                    <div
                                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${msg.sender === "bot"
                                            ? "bg-[#10A37F]/15 text-[#10A37F]"
                                            : "bg-[#3C3C50] text-[#E1E1E1]"
                                            }`}
                                    >
                                        {msg.sender === "bot" ? <Bot size={14} /> : <User size={14} />}
                                    </div>

                                    <div
                                        className={`${msg.isLoading ? "w-fit" : "max-w-[75%]"
                                            } rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${msg.sender === "user"
                                                ? "rounded-br-md bg-[#10A37F] text-white"
                                                : "rounded-bl-md border border-[#343540] bg-[#1E1E1E] text-[#E1E1E1]"
                                            }`}
                                    >
                                        {msg.isLoading ? (
                                            <span className="flex h-5 items-center justify-center gap-1">
                                                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#E1E1E1]/60 [animation-delay:-0.3s]" />
                                                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#E1E1E1]/60 [animation-delay:-0.15s]" />
                                                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#E1E1E1]/60" />
                                            </span>
                                        ) : (
                                            <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                                        )}
                                    </div>
                                </div>
                            ))}

                            <div ref={bottomRef} />
                        </div>
                    )}
                </div>

                {/* Input — floats over the chat body instead of taking its own row */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0">
                    <div className="h-10 bg-gradient-to-t from-[#141414] to-transparent" />
                    <form
                        onSubmit={sendMessage}
                        className="pointer-events-auto bg-[#141414] px-5 pb-5"
                    >
                        <div className="mx-auto flex max-w-2xl items-center gap-2 rounded-full border border-[#343540] bg-[#1E1E1E] px-2 py-1.5 shadow-lg focus-within:border-[#10A37F]/60">
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Send a message..."
                                disabled={isLoading}
                                className="flex-1 bg-transparent px-3 py-1.5 text-sm text-[#E1E1E1] placeholder-[#E1E1E1]/40 focus:outline-none disabled:opacity-60"
                            />
                            <button
                                type="submit"
                                disabled={isLoading || !input.trim()}
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#10A37F] text-white transition hover:bg-[#0e8f70] disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <Send size={15} />
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Right panel — new chat + conversation history */}
            <div className="flex h-full w-72 shrink-0 flex-col border-l border-[#343540] bg-[#1E1E1E]">
                <div className="p-3">
                    <button
                        onClick={handleNewChat}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#343540] bg-[#141414] px-4 py-2.5 text-sm font-medium text-[#E1E1E1] transition hover:border-[#10A37F]/50 hover:text-[#E1E1E1]"
                    >
                        <Plus size={15} />
                        New Chat
                    </button>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto px-3 pb-3 no-scrollbar">
                    <div className="px-1 pb-2 text-xs font-medium uppercase tracking-wide text-[#E1E1E1]/40">
                        History
                    </div>

                    {conversationsLoading && conversations.length === 0 ? (
                        <div className="px-1 py-2 text-xs text-[#E1E1E1]/40">Loading...</div>
                    ) : conversations.length === 0 ? (
                        <div className="px-1 py-2 text-xs text-[#E1E1E1]/40">
                            No conversations yet
                        </div>
                    ) : (
                        <div className="flex flex-col gap-1.5">
                            {conversations.map((c) => {
                                const isActive = c.id === conversationId;
                                const isLoadingThis = historyLoadingId === c.id;
                                const isDeletingThis = deletingId === c.id;

                                return (
                                    <button
                                        key={c.id}
                                        onClick={() => handleSelectConversation(c.id)}
                                        disabled={isLoadingThis || isDeletingThis}
                                        className={`group flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-xs transition disabled:opacity-60 ${isActive
                                            ? "border-[#10A37F]/50 bg-[#10A37F]/10 text-[#E1E1E1]"
                                            : "border-[#343540] bg-[#141414] text-[#E1E1E1]/70 hover:border-[#10A37F]/40 hover:text-[#E1E1E1]"
                                            }`}
                                    >
                                        <MessageSquare
                                            size={13}
                                            className={`shrink-0 ${isActive ? "text-[#10A37F]" : "text-[#E1E1E1]/40"}`}
                                        />
                                        <span className="flex-1 truncate">
                                            {isLoadingThis
                                                ? "Loading..."
                                                : isDeletingThis
                                                    ? "Deleting..."
                                                    : c.title}
                                        </span>
                                        <span
                                            role="button"
                                            tabIndex={0}
                                            onClick={(e) => handleDeleteConversation(e, c.id)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" || e.key === " ") {
                                                    e.preventDefault();
                                                    handleDeleteConversation(
                                                        e as unknown as React.MouseEvent,
                                                        c.id
                                                    );
                                                }
                                            }}
                                            className="shrink-0 rounded-md p-1 text-[#E1E1E1]/30 opacity-0 transition hover:bg-[#343540] hover:text-red-400 group-hover:opacity-100 focus:opacity-100"
                                            aria-label="Delete conversation"
                                        >
                                            <Trash2 size={13} />
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Chat;