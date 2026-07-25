import { IAiAssistantRepository } from '@/domain/repositories/IAiAssistantRepository';

export class AskAiAssistant {
  constructor(private readonly repository: IAiAssistantRepository) {}

  execute(prompt: string, history?: { rol: 'ia' | 'usuario'; texto: string }[]) {
    return this.repository.ask(prompt, history);
  }
}

export class AiAssistantUseCases {
  ask: AskAiAssistant;

  constructor(repository: IAiAssistantRepository) {
    this.ask = new AskAiAssistant(repository);
  }
}
