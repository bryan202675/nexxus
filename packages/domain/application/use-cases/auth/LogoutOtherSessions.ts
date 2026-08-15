import { IAuthRepository } from '../../../repositories/IAuthRepository';

export class LogoutOtherSessions {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(): Promise<void> {
    await this.authRepository.logoutOtherSessions();
  }
}
