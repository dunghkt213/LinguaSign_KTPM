import { SetMetadata } from '@nestjs/common';

// Custom decorator to skip rate limiting for specific routes
export const SkipThrottle = () => SetMetadata('skipThrottle', true);

// Custom decorator to set different rate limits for specific routes
export const Throttle = (limit: number, ttl: number) => 
  SetMetadata('throttle', { limit, ttl });
