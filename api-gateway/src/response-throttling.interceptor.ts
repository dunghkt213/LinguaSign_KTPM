import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { delay } from 'rxjs/operators';

/**
 * Response Throttling Interceptor
 * Adds configurable delay to responses to control processing speed
 */
@Injectable()
export class ResponseThrottlingInterceptor implements NestInterceptor {
  private readonly baseDelay = 30; // Base delay in milliseconds
  private requestCount = 0;
  private lastResetTime = Date.now();
  private readonly resetInterval = 1000; // Reset counter every second

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Track requests per second
    this.updateRequestCount();
    
    // Calculate dynamic delay based on load
    const delayMs = this.calculateDelay();

    return next.handle().pipe(
      delay(delayMs)
    );
  }

  private updateRequestCount(): void {
    const now = Date.now();
    
    if (now - this.lastResetTime >= this.resetInterval) {
      this.requestCount = 0;
      this.lastResetTime = now;
    }
    
    this.requestCount++;
  }

  private calculateDelay(): number {
    // Adaptive delay based on current load
    // Low load (0-20 req/s): 30ms
    // Medium load (21-50 req/s): 50ms
    // High load (51-100 req/s): 100ms
    // Critical load (100+ req/s): 200ms
    
    if (this.requestCount <= 20) {
      return this.baseDelay;
    } else if (this.requestCount <= 50) {
      return 50;
    } else if (this.requestCount <= 100) {
      return 100;
    } else {
      return 200;
    }
  }
}
