import { AuthenticationUseCaseDecorator } from './AuthenticationUseCaseDecorator';
import { NotAuthenticatedError } from '../errors';
import type { UseCase } from '../ports/UseCase';
import type { ISessionSource } from '../ports/ISessionSource';

const sessionWith = (token: string | null): ISessionSource => ({
  getToken: jest.fn().mockResolvedValue(token),
});

describe('AuthenticationUseCaseDecorator', () => {
  it('should_execute_the_inner_use_case_when_a_session_is_active', async () => {
    // Arrange
    const inner: UseCase<string, string> = { execute: jest.fn().mockResolvedValue('ok') };
    const decorator = new AuthenticationUseCaseDecorator(inner, 'Op', sessionWith('jwt-token'));

    // Act
    const result = await decorator.execute('input');

    // Assert
    expect(result).toBe('ok');
    expect(inner.execute).toHaveBeenCalledWith('input');
  });

  it('should_throw_NotAuthenticatedError_and_skip_the_inner_use_case_when_no_session', async () => {
    // Arrange
    const inner: UseCase<string, string> = { execute: jest.fn() };
    const decorator = new AuthenticationUseCaseDecorator(inner, 'Op', sessionWith(null));

    // Act / Assert
    await expect(decorator.execute('input')).rejects.toThrow(NotAuthenticatedError);
    expect(inner.execute).not.toHaveBeenCalled();
  });
});
