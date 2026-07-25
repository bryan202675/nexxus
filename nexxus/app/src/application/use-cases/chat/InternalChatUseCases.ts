import { ChatMessage, ChatUser, Conversation, CreateConversationInput, SendMessageInput } from '@/domain/entities/InternalChat';
import { IInternalChatRepository } from '@/domain/repositories/IInternalChatRepository';

export class InternalChatUseCases {
  constructor(private repository: IInternalChatRepository) {}

  subscribeConversations(
    empresaId: string,
    userId: string,
    limitCount: number,
    callback: (conversations: Conversation[]) => void,
    onError: (error: Error) => void
  ): () => void {
    return this.repository.subscribeConversations(empresaId, userId, limitCount, callback, onError);
  }

  subscribeAdminConversations(
    empresaId: string,
    superAdmin: boolean,
    limitCount: number,
    callback: (conversations: Conversation[]) => void,
    onError: (error: Error) => void
  ): () => void {
    return this.repository.subscribeAdminConversations(empresaId, superAdmin, limitCount, callback, onError);
  }

  subscribeMessages(
    empresaId: string,
    conversationId: string,
    limitCount: number,
    callback: (messages: ChatMessage[]) => void,
    onError: (error: Error) => void
  ): () => void {
    return this.repository.subscribeMessages(empresaId, conversationId, limitCount, callback, onError);
  }

  subscribeCompanyUsers(
    empresaId: string,
    limitCount: number,
    callback: (users: ChatUser[]) => void,
    onError: (error: Error) => void
  ): () => void {
    return this.repository.subscribeCompanyUsers(empresaId, limitCount, callback, onError);
  }

  createConversation(input: CreateConversationInput): Promise<Conversation> {
    return this.repository.createConversation(input);
  }

  sendMessage(input: SendMessageInput): Promise<void> {
    return this.repository.sendMessage(input);
  }

  updateConversation(conversationId: string, data: Partial<Conversation>): Promise<void> {
    return this.repository.updateConversation(conversationId, data);
  }

  deleteConversation(conversationId: string, empresaId: string, userId?: string): Promise<void> {
    return this.repository.deleteConversation(conversationId, empresaId, userId);
  }

  markMessagesAsRead(conversacionId: string, userId: string): Promise<void> {
    return this.repository.markMessagesAsRead(conversacionId, userId);
  }
}
