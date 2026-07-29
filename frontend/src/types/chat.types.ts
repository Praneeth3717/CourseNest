export interface ChatRequest {
    message: string;
    conversation_id?: string | null;
}

export interface ChatResponse {
    conversation_id: string;
    response: string;
}

export type ChatRole = "user" | "assistant";

export interface ConversationSummary {
    id: string;
    title: string;
    created_at: string;
    updated_at: string;
}

export interface ConversationListResponse {
    conversations: ConversationSummary[];
}

export interface ChatMessageOut {
    id: string;
    role: ChatRole;
    content: string;
    created_at: string;
}

export interface ConversationDetailResponse {
    id: string;
    title: string;
    created_at: string;
    updated_at: string;
    messages: ChatMessageOut[];
}