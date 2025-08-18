import { validate } from 'class-validator';
import { CreatePersonDto } from './create-person.dto';

describe('CreatePersonDto', () => {
  test('valid DTO', async () => {
    const dto = new CreatePersonDto();
    dto.email = 'gustavo@gmail.com';
    dto.password = 'password';
    dto.name = 'Gustavo L. Martin';

    const errors = await validate(dto);

    expect(errors.length).toBe(0);
  });

  test('invalid DTO - incorrect email', async () => {
    const dto = new CreatePersonDto();
    dto.email = 'invalid-email';
    dto.password = 'password';
    dto.name = 'Gustavo L. Martin';

    const errors = await validate(dto);

    expect(errors.length).toBe(1);
    expect(errors[0].property).toBe('email');
  });

  test('invalid DTO - small password', async () => {
    const dto = new CreatePersonDto();
    dto.email = 'gustavo@gmail.com';
    dto.password = 'pass';
    dto.name = 'Gustavo L. Martin';

    const errors = await validate(dto);

    expect(errors.length).toBe(1);
    expect(errors[0].property).toBe('password');
  });

  test('invalid DTO - small name', async () => {
    const dto = new CreatePersonDto();
    dto.email = 'gustavo@gmail.com';
    dto.password = 'password';
    dto.name = 'Gu';

    const errors = await validate(dto);

    expect(errors.length).toBe(1);
    expect(errors[0].property).toBe('name');
  });

  test('invalid DTO - big name', async () => {
    const dto = new CreatePersonDto();
    dto.email = 'gustavo@gmail.com';
    dto.password = 'password';
    dto.name = '';
    for (let i = 0; i <= 101; i++) {
      dto.name += 'g';
    }

    const errors = await validate(dto);

    expect(errors.length).toBe(1);
    expect(errors[0].property).toBe('name');
  });
});
