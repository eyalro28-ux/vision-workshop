import { Redis } from '@upstash/redis';

export const redis = Redis.fromEnv();
export const SUBMISSIONS_KEY = 'workshop:submissions';
export const VISION_KEY = 'workshop:vision';
