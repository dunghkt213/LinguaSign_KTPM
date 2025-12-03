# LinguaSign Testing Suite

Comprehensive testing infrastructure for LinguaSign microservices system.

## Quick Start

```powershell
# System validation
.\system-test.ps1

# Performance test (50 concurrent users)
.\quick-performance-test.ps1 -Users 50

# Run all tests (requires k6)
.\run-all-tests.ps1
```

## Test Structure

### Core Tests
- **`quick-performance-test.ps1`** - Performance testing with concurrent users
  - Tests all 6 microservices endpoints
  - Measures response time, throughput, success rate
  - Usage: `.\quick-performance-test.ps1 -Users 100`

- **`system-test.ps1`** - System health validation
  - Checks Docker containers status
  - Validates Prometheus targets
  - Verifies monitoring stack
  - Generates JSON report

- **`run-all-tests.ps1`** - Master test runner
  - Runs k6 load tests
  - Executes E2E test suite
  - Validates system health

### Test Suites
- **`k6/`** - Grafana k6 load testing
  - `gateway-load-test.js` - API Gateway scenarios
  - `kafka-throughput-test.js` - Kafka throughput tests
  
- **`e2e/`** - End-to-end integration tests
  - Auth flow, Course creation, Progress tracking
  
- **`monitoring/`** - Monitoring configuration
  - Prometheus, Grafana, Alert rules

## Performance Test Results

Last test with 50 concurrent users:

| Endpoint | Avg Response | Throughput | Success Rate |
|----------|--------------|------------|--------------|
| Login | 214ms | 4.67 req/s | 100% |
| Courses | 75ms | 13.32 req/s | 100% |
| Users | 150ms | 6.66 req/s | 100% |
| Progress | 73ms | 13.70 req/s | 100% |
| Notifications | 74ms | 13.49 req/s | 100% |

## Requirements

- Docker & Docker Compose
- PowerShell 5.1+
- Grafana k6 (optional, for load tests): `choco install k6`
- Node.js (optional, for E2E tests)

## Services Tested

1. **Auth Service** - Register, Login, JWT tokens
2. **Course Service** - Course CRUD operations
3. **User Service** - User management (protected)
4. **Learning Progress Service** - Progress tracking (protected)
5. **Notification Service** - User notifications (protected)
6. **API Gateway** - Request routing & authentication

## Monitoring

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (admin/admin)
- **Dashboard**: Import `monitoring/grafana-dashboard.json`
