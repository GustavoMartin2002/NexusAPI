import { validate } from 'class-validator';
import { CreateMessageDto } from './create-message.dto';

describe('CreateMessageDto', () => {
  test('valid DTO', async () => {
    const dto = new CreateMessageDto();
    dto.text = 'Hello, world!';
    dto.toId = 1;

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  test('invalid DTO - empty text', async () => {
    const dto = new CreateMessageDto();
    dto.text = '';
    dto.toId = 1;

    const errors = await validate(dto);

    expect(errors.length).toBe(1);
    expect(errors[0].property).toBe('text');
  });

  test('invalid DTO - small text', async () => {
    const dto = new CreateMessageDto();
    dto.text = 'he';
    dto.toId = 1;

    const errors = await validate(dto);

    expect(errors.length).toBe(1);
    expect(errors[0].property).toBe('text');
  });

  test('invalid DTO - big text', async () => {
    const dto = new CreateMessageDto();
    dto.text = '';
    for (let i = 0; i <= 256; i++) {
      dto.text += 'g';
    }
    dto.toId = 1;

    const errors = await validate(dto);

    expect(errors.length).toBe(1);
    expect(errors[0].property).toBe('text');
  });
});
