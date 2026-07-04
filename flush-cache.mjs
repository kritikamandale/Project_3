
import Redis from 'ioredis';

const redis = new Redis("redis://localhost:6379");

async function run() {
  await redis.flushdb();
  console.log("Redis cache flushed!");
  process.exit(0);
}
run();
