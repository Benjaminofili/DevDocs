// src/__tests__/mocks/redis.ts

export const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
};

export const mockRateLimiter = {
  limit: jest.fn(),
};

jest.mock('@upstash/redis', () => ({
  Redis: {
    fromEnv: jest.fn(() => mockRedis),
  },
}));

jest.mock('@upstash/ratelimit', () => ({
  Ratelimit: jest.fn(() => mockRateLimiter),
}));