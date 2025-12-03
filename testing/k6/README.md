# K6 Load Testing Suite

## 📋 Mô tả

Bộ test hiệu năng cho hệ thống LinguaSign sử dụng Grafana k6.

## 🎯 Test Scenarios

### 1. Gateway Load Test (`gateway-load-test.js`)

Test hiệu năng API Gateway và khả năng publish vào Kafka.

**Scenarios:**
- **Load Test**: Tăng dần từ 0 → 50 → 100 → 200 users
- **Stress Test**: Đẩy lên 300-500 users
- **Spike Test**: Tăng đột ngột lên 500 users

**Metrics:**
- Request/second API Gateway xử lý được
- Response time (avg, p95, p99)
- Error rate
- Kafka publish success/fail rate

### 2. Kafka Throughput Test (`kafka-throughput-test.js`)

Test throughput của Kafka producer/consumer.

**Scenarios:**
- **Producer Throughput**: 100 msg/s trong 5 phút
- **High Throughput**: 500 msg/s trong 3 phút  
- **Burst Throughput**: 1000 msg/s trong 1 phút

**Metrics:**
- Messages produced per second
- Producer latency
- Consumer lag
- Partition balancing

## 🚀 Cách chạy

### Prerequisites

1. Cài đặt k6:
```powershell
# Windows (Chocolatey)
choco install k6

# Windows (Manual)
# Download từ https://k6.io/docs/getting-started/installation/
```

2. Đảm bảo services đang chạy:
```powershell
docker-compose up -d
```

### Chạy tests

```powershell
cd testing/k6

# Chạy tất cả tests
.\run-tests.ps1

# Chỉ test Gateway
.\run-tests.ps1 -TestType gateway

# Chỉ test Kafka
.\run-tests.ps1 -TestType kafka

# Với custom URL
.\run-tests.ps1 -ApiGatewayUrl http://localhost:3000 -KafkaMetricsUrl http://localhost:9308/metrics

# Output tới InfluxDB
.\run-tests.ps1 -UseInfluxDB
```

### Chạy trực tiếp với k6

```powershell
# Gateway Load Test
k6 run gateway-load-test.js

# Kafka Throughput Test  
k6 run kafka-throughput-test.js

# Với options
k6 run --vus 10 --duration 30s gateway-load-test.js
```

## 📊 Kết quả

Kết quả được lưu trong thư mục `results/`:
- `gateway-test-{timestamp}.json` - Gateway test results
- `kafka-throughput-report.json` - Kafka throughput results
- `summary.json` - Overall summary

## 🎯 Success Criteria

### Gateway Load Test
- ✅ P95 response time < 500ms
- ✅ P99 response time < 1000ms
- ✅ Error rate < 1%
- ✅ Kafka publish success > 1000 messages

### Kafka Throughput Test
- ✅ P95 producer latency < 200ms
- ✅ P99 producer latency < 500ms
- ✅ Consumer lag < 1000 messages
- ✅ Total messages > 10000

## 📈 Monitoring

Xem realtime metrics tại:
- Grafana: http://localhost:3001
- Prometheus: http://localhost:9090
- Kafka Exporter: http://localhost:9308/metrics

## 🔧 Configuration

Chỉnh sửa các biến trong script:
- `BASE_URL`: API Gateway URL
- `KAFKA_METRICS_URL`: Kafka metrics endpoint
- `options.scenarios`: Thay đổi load patterns
- `options.thresholds`: Điều chỉnh success criteria
