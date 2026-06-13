import '@testing-library/jest-dom';

// Provide minimum required env vars for all tests
process.env.JWT_SECRET          = 'test-jwt-secret-minimum-64-chars-long-xxxxxxxxxxxxxxxxxxxxxxxxxxx';
process.env.JWT_REFRESH_SECRET  = 'test-jwt-refresh-secret-64-chars-long-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
process.env.JWT_ACCESS_EXPIRY   = '15m';
process.env.JWT_REFRESH_EXPIRY  = '7d';
process.env.ENCRYPTION_KEY      = 'a'.repeat(64); // 32-byte hex key for tests
process.env.DATABASE_URL        = process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/eventnest_test';
process.env.REDIS_URL           = process.env.REDIS_URL ?? 'redis://localhost:6379';
process.env.NODE_ENV            = 'test';
