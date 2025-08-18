import { validate } from 'class-validator';
import { LoginDto } from './login.dto';

describe('LoginDto', () => {
  test('valid DTO', async () => {
    const dto = new LoginDto();
    dto.email = 'gustavo@gmail.com';
    dto.password = 'password';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  test('invalid DTO - invalid email', async () => {
    const dto = new LoginDto();
    dto.email = 'invalid-email';
    dto.password = 'password';

    const errors = await validate(dto);

    expect(errors.length).toBe(1);
    expect(errors[0].property).toBe('email');
  });

  test('invalid DTO - empty password', async () => {
    const dto = new LoginDto();
    dto.email = 'gustavo@gmail.com';
    dto.password = '';

    const errors = await validate(dto);

    expect(errors.length).toBe(1);
    expect(errors[0].property).toBe('password');
  });
});
