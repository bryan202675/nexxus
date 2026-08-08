import { ChatMessage, ChatUser, Conversation, CreateConversationInput, SendMessageInput } from '../entities/InternalChat';

export interface IInternalChatRepository {
  subscribeConversations(
    empresaId: string,
    userId: string,
    limitCount: number,
    callback: (conversations: Conversation[]) => void,
    onError: (error: Error) => void
  ): () => void;

  subscribeAdminConversations(
    empresaId: string,
    superAdmin: boolean,
    limitCount: number,
    callback: (conversations: Conversation[]) => void,
    onError: (error: Error) => void
  ): () => void;

  subscribeMessages(
    empresaId: string,
    conversationId: string,
    limitCount: number,
    callback: (messages: ChatMessage[]) => void,
    onError: (error: Error) => void
  ): () => void;

  subscribeCompanyUsers(
    empresaId: string,
    limitCount: number,
    callback: (users: ChatUser[]) => void,
    onError: (error: Error) => void
  ): () => void;

  createConversation(input: CreateConversationInput): Promise<Conversation>;
  sendMessage(input: SendMessageInput): Promise<void>;
  updateConversation(conversationId: string, data: Partial<Conversation>): Promise<void>;
  deleteConversation(conversationId: string, empresaId: string, userId?: string): Promise<void>;
  markMessagesAsRead(conversacionId: string, userId: string): Promise<void>;
}
