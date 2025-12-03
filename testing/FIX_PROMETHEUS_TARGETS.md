# Fix Prometheus Targets - Add Metrics to Microservices

## Vấn đề hiện tại:

Các microservices đang chạy nhưng chưa expose metrics endpoint, nên Prometheus không scrape được.

## ✅ Services đang HEALTHY:
- Prometheus
- Grafana  
- Kafka Exporter
- MongoDB Exporter
- Node Exporter

## ⚠️ Services cần thêm metrics:
- API Gateway
- Auth Service
- Course Service
- User Service
- Learning Progress Service
- Notification Service

## 🔧 Cách fix:

### Bước 1: Cài đặt Prometheus client cho NestJS

Chạy lệnh này trong mỗi service folder:

```bash
npm install @willsoto/nestjs-prometheus prom-client
```

### Bước 2: Thêm PrometheusModule vào AppModule

Ví dụ cho `api-gateway/src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

@Module({
  imports: [
    PrometheusModule.register({
      defaultMetrics: {
        enabled: true,
      },
      path: '/metrics',
    }),
    // ... other imports
  ],
  // ...
})
export class AppModule {}
```

### Bước 3: Áp dụng cho tất cả services

Thêm tương tự vào:
- `auth-service/src/app.module.ts`
- `course-service/src/app.module.ts`
- `user-service/src/app.module.ts`
- `learning-progress-service/src/app.module.ts`
- `noti-service/src/app.module.ts`

### Bước 4: Rebuild và restart

```bash
docker-compose down
docker-compose up -d --build
```

## 🎯 Alternative: Update Prometheus config để không scrape services chưa có metrics

Nếu không muốn thêm metrics ngay, bạn có thể comment out các job trong `testing/monitoring/prometheus.yml`:

```yaml
# Comment out these jobs temporarily:
# - job_name: 'api-gateway'
#   static_configs:
#     - targets: ['api-gateway:3000']
```

## 📊 Hiện tại hệ thống vẫn hoạt động tốt:

- ✅ Kafka metrics đang được collect
- ✅ MongoDB metrics đang được collect  
- ✅ System metrics (CPU, RAM) đang được collect
- ✅ Grafana dashboard sẵn sàng
- ✅ Load testing scripts sẵn sàng
- ✅ E2E testing scripts sẵn sàng

**Kết luận:** Các services "DOWN" không phải lỗi nghiêm trọng. Chúng chỉ chưa expose metrics. Infrastructure và monitoring core đang hoạt động hoàn hảo! 🎉
