import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => {
  return {
    secret: 'test-secret',
    audience: 'test-audience',
    issuer: 'test-issuer',
    jwtTtl: '1',
    jwtRefreshTtl: '2',
  };
});
