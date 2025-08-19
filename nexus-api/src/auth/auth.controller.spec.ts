import { AuthController } from './auth.controller';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

describe('AuthController', () => {
  let controller: AuthController;

  const authServiceMock = {
    login: jest.fn(),
    refreshTokens: jest.fn(),
  };

  beforeEach(() => {
    controller = new AuthController(authServiceMock as any);
  });

  test('should be defined', () => {
    expect(controller).toBeDefined();
  });

  test('login', async () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password',
    };
    const expected = { accessToken: 'token', refreshToken: 'refreshToken' };

    jest.spyOn(authServiceMock, 'login').mockResolvedValue(expected);

    const result = await controller.login(loginDto);

    expect(authServiceMock.login).toHaveBeenCalledWith(loginDto);
    expect(result).toEqual(expected);
  });

  test('refreshTokens', async () => {
    const refreshToken: RefreshTokenDto = { refreshToken: 'refreshToken' };
    const expected = {
      accessToken: 'newToken',
      refreshToken: 'newRefreshToken',
    };

    jest.spyOn(authServiceMock, 'refreshTokens').mockResolvedValue(expected);

    const result = await controller.refreshTokens(refreshToken);

    expect(authServiceMock.refreshTokens).toHaveBeenCalledWith(refreshToken);
    expect(result).toEqual(expected);
  });
});
