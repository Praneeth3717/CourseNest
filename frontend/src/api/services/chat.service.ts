import requestInstance from "@/api/requestInstance";
import { API_ENDPOINTS } from "@/api/apiEndpoints";

import type {
    ChatRequest,
    ChatResponse,
    ConversationListResponse,
    ConversationDetailResponse,
} from "@/types/chat.types"

class ChatService {
    /* SEND MESSAGE */
    sendMessage(
        payload: ChatRequest,
    ): Promise<ChatResponse> {
        return requestInstance.post<ChatResponse>(
            API_ENDPOINTS.Chat.send,
            payload,
        );
    }

    /* LIST ALL CONVERSATIONS FOR CURRENT STUDENT */
    getConversations(): Promise<ConversationListResponse> {
        return requestInstance.get<ConversationListResponse>(
            API_ENDPOINTS.Chat.conversations,
        );
    }

    /* GET A SINGLE CONVERSATION WITH ITS FULL MESSAGE HISTORY */
    getConversationDetail(
        conversationId: string,
    ): Promise<ConversationDetailResponse> {
        return requestInstance.get<ConversationDetailResponse>(
            API_ENDPOINTS.Chat.conversationDetail(conversationId),
        );
    }

    /* DELETE A CONVERSATION */
    deleteConversation(
        conversationId: string,
    ): Promise<void> {
        return requestInstance.del<void>(
            API_ENDPOINTS.Chat.conversationDetail(conversationId),
        );
    }
}

export const chatService = new ChatService();