// jest.setup.js

import '@testing-library/jest-dom'
import 'whatwg-fetch'

// Mock environment variables
process.env.GOOGLE_AI_API_KEY = 'test-gemini-key'
process.env.UPSTASH_REDIS_REST_URL = 'https://test-redis.upstash.io'
process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token'
process.env.GITHUB_TOKEN = 'test-github-token'

// Mock console methods to reduce test output noise
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
}