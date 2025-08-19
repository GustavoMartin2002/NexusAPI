import { validate } from 'class-validator';
import { RefreshTokenDto } from './refresh-token.dto';

describe('RefreshTokenDto', () => {
  test('valid DTO', async () => {
    const dto = new RefreshTokenDto();
    dto.refreshToken = 'valid-refresh-token';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  test('invalid DTO - empty refreshToken', async () => {
    const dto = new RefreshTokenDto();
    dto.refreshToken = '';

    const errors = await validate(dto);

    expect(errors.length).toBe(1);
    expect(errors[0].property).toBe('refreshToken');
  });
});
