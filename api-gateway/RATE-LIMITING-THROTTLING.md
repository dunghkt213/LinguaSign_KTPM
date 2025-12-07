# Rate Limiting & Response Throttling

## Tổng quan

API Gateway đã được tích hợp 2 cơ chế bảo vệ và tối ưu hiệu năng:

1. **Rate Limiting** - Giới hạn số lượng request từ mỗi IP
2. **Response Throttling** - Điều chỉnh tốc độ xử lý response dựa trên tải hệ thống

## 1. Rate Limiting

### Mục đích
- Ngăn chặn spam và brute-force attacks
- Bảo vệ backend services khỏi quá tải
- Đảm bảo fair usage cho tất cả users

### Cấu hình

**Global Rate Limit:**
- **100 requests / 60 seconds** cho mọi endpoint
- Áp dụng theo IP address

**Endpoint-specific Limits:**

| Endpoint | Limit | Thời gian | Lý do |
|----------|-------|-----------|-------|
| `POST /auth/login` | 10 req | 60s | Chống brute-force đăng nhập |
| `POST /auth/register` | 5 req | 60s | Chống spam tạo tài khoản |
| `GET /health` | Unlimited | - | Health check cần luôn available |

### Implementation

**File:** `api-gateway/src/app.module.ts`

```typescript
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

ThrottlerModule.forRoot([{
  ttl: 60000, // 60 seconds
  limit: 100, // 100 requests
}])

providers: [
  {
    provide: APP_GUARD,
    useClass: ThrottlerGuard,
  }
]
```

**File:** `api-gateway/src/app.controller.ts`

```typescript
import { Throttle, SkipThrottle } from '@nestjs/throttler';

// Giới hạn 10 requests/60s cho login
@Throttle({ default: { limit: 10, ttl: 60000 } })
@Post('auth/login')

// Giới hạn 5 requests/60s cho register  
@Throttle({ default: { limit: 5, ttl: 60000 } })
@Post('auth/register')

// Không giới hạn cho health check
@SkipThrottle()
@Get('health')
```

### Response Headers

Khi rate limit được áp dụng, API trả về các headers:

```
X-RateLimit-Limit: 10          # Giới hạn tối đa
X-RateLimit-Remaining: 7       # Số request còn lại
X-RateLimit-Reset: 1638360000  # Timestamp reset counter
```

### HTTP Status Codes

- **200/201** - Request thành công, còn quota
- **429 Too Many Requests** - Đã vượt giới hạn

**Response khi bị block:**
```json
{
  "statusCode": 429,
  "message": "ThrottlerException: Too Many Requests"
}
```

## 2. Response Throttling

### Mục đích
- Điều chỉnh tốc độ xử lý để tránh quá tải backend
- Adaptive delay dựa trên số lượng request đang xử lý
- Smooth out traffic spikes

### Cơ chế hoạt động

**Adaptive Delay System:**

| Request Rate | Delay | Mô tả |
|--------------|-------|-------|
| 0-20 req/s | 30ms | Low load - xử lý nhanh |
| 21-50 req/s | 50ms | Medium load - tăng delay nhẹ |
| 51-100 req/s | 100ms | High load - giảm tốc rõ rệt |
| 100+ req/s | 200ms | Critical load - bảo vệ hệ thống |

### Implementation

**File:** `api-gateway/src/response-throttling.interceptor.ts`

```typescript
@Injectable()
export class ResponseThrottlingInterceptor implements NestInterceptor {
  private readonly baseDelay = 30;
  private requestCount = 0;
  private lastResetTime = Date.now();
  private readonly resetInterval = 1000; // Reset mỗi giây

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    this.updateRequestCount();
    const delayMs = this.calculateDelay();
    
    return next.handle().pipe(
      delay(delayMs)
    );
  }

  private updateRequestCount() {
    const now = Date.now();
    if (now - this.lastResetTime >= this.resetInterval) {
      this.requestCount = 1;
      this.lastResetTime = now;
    } else {
      this.requestCount++;
    }
  }

  private calculateDelay(): number {
    const requestsPerSecond = this.requestCount;
    
    if (requestsPerSecond <= 20) {
      return this.baseDelay; // 30ms
    } else if (requestsPerSecond <= 50) {
      return 50;
    } else if (requestsPerSecond <= 100) {
      return 100;
    } else {
      return 200;
    }
  }
}
```

**Đăng ký Global Interceptor:**

```typescript
// app.module.ts
providers: [
  {
    provide: APP_INTERCEPTOR,
    useClass: ResponseThrottlingInterceptor,
  }
]
```

## Kết quả Test

### Test Rate Limiting

**Login Endpoint (10 req/60s):**
```
✅ Request 1-10: 201 Created
❌ Request 11-12: 429 Too Many Requests
```

**Register Endpoint (5 req/60s):**
```
✅ Request 1-5: 201 Created
❌ Request 6-10: 429 Too Many Requests
```

**Health Endpoint (Unlimited):**
```
✅ All 25 requests: 200 OK
```

### Test Response Throttling

**Sequential Requests (Low Load):**
```
15 requests with 50ms interval
Average response time: ~43ms
```

**50 Concurrent Requests (Medium Load):**
```
Successful: 50/50
Average: 263ms
Min: 64ms | Max: 497ms
```

**100 Concurrent Requests (High Load):**
```
Successful: 100/100
Average: 86ms  
Min: 69ms | Max: 154ms
```

### Test Kết hợp Rate Limiting + Throttling

**Login với 12 requests:**
```
Request 1: 3741ms (Status: 201) - Kafka warm-up
Request 2-10: 62-80ms (Status: 201) - Throttled responses
Request 11-12: 3-49ms (Status: 429) - Rate limited
```

✅ **Cả 2 cơ chế hoạt động độc lập và không conflict**

## Dependency

```json
{
  "@nestjs/throttler": "^6.2.1",
  "rxjs": "^7.8.1"
}
```

## Cài đặt

```bash
# Install dependencies
npm install @nestjs/throttler

# Rebuild Docker image
docker-compose build api-gateway

# Start services
docker-compose up -d
```

## Monitoring

### Kiểm tra Rate Limit
```bash
# Test login endpoint
for ($i = 1; $i -le 15; $i++) {
  Invoke-WebRequest -Uri "http://localhost:3000/auth/login" `
    -Method POST -Body (@{username="test";password="123"} | ConvertTo-Json) `
    -ContentType "application/json"
}
```

### Kiểm tra Response Throttling
```bash
# Test với concurrent requests
$jobs = @()
1..50 | ForEach-Object {
  $jobs += Start-Job -ScriptBlock {
    Invoke-WebRequest -Uri "http://localhost:3000/health"
  }
}
$jobs | Wait-Job | Receive-Job
```

## Best Practices

### Rate Limiting
1. **Đặt giới hạn phù hợp** - Không quá thấp (UX tệ), không quá cao (không bảo vệ được)
2. **Thông báo rõ ràng** - Return headers để client biết quota
3. **Whitelist IPs** - Cho phép internal services bypass rate limit
4. **Log monitoring** - Track số lần bị rate limit để điều chỉnh

### Response Throttling
1. **Tune delays cẩn thận** - Test với real traffic patterns
2. **Monitor response times** - Đảm bảo không làm chậm quá mức
3. **Exempt critical endpoints** - Health checks, monitoring không nên throttle
4. **Scale horizontally** - Khi load cao, tăng instances thay vì chỉ throttle

## Troubleshooting

### Rate Limiting không hoạt động
```bash
# Check ThrottlerGuard được đăng ký
docker logs api-gateway | grep "ThrottlerModule"

# Verify decorators trong controller
grep -r "@Throttle" src/
```

### Response quá chậm
```typescript
// Giảm base delay trong interceptor
private readonly baseDelay = 20; // Giảm từ 30ms xuống 20ms
```

### Health check bị throttle
```typescript
// Thêm @SkipThrottle vào health endpoint
@SkipThrottle()
@Get('health')
```

## Configuration Options

### Tùy chỉnh Rate Limit
```typescript
// Thay đổi global limit
ThrottlerModule.forRoot([{
  ttl: 60000,
  limit: 200, // Tăng lên 200 req/60s
}])

// Thay đổi endpoint-specific
@Throttle({ default: { limit: 20, ttl: 60000 } })
```

### Tùy chỉnh Throttling Delays
```typescript
// response-throttling.interceptor.ts
private calculateDelay(): number {
  const rps = this.requestCount;
  
  if (rps <= 30) return 20;      // Giảm delay cho low load
  else if (rps <= 60) return 40;  // Custom thresholds
  else if (rps <= 120) return 80;
  else return 150;
}
```

## Future Improvements

- [ ] Redis-based rate limiting cho distributed systems
- [ ] Per-user rate limiting (không chỉ per-IP)
- [ ] Dynamic throttling dựa trên CPU/Memory usage
- [ ] Dashboard monitoring real-time
- [ ] Custom rate limit per API key/tier
- [ ] Exponential backoff cho repeated violations

---

**Tác giả:** LinguaSign Development Team  
**Ngày cập nhật:** December 8, 2025  
**Version:** 1.0.0
