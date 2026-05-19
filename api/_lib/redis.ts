import { Redis } from '@upstash/redis';

const url =
  process.env.UPSTASH_REDIS_REST_URL ||
  process.env.KV_REST_API_URL ||
  process.env.REDIS_URL;

const token =
  process.env.UPSTASH_REDIS_REST_TOKEN ||
  process.env.KV_REST_API_TOKEN ||
  process.env.REDIS_TOKEN;

if (!url || !token) {
  console.error('Upstash env vars missing. Available:', Object.keys(process.env).filter(k => /UPSTASH|KV_|REDIS/i.test(k)));
}

export const redis = new Redis({ url: url!, token: token! });
export const SUBMISSIONS_KEY = 'workshop:submissions';
export const VISION_KEY = 'workshop:vision';
