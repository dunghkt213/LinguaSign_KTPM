# Run E2E tests
# Usage: .\run-e2e.ps1

param(
    [Parameter()]
    [string]$ApiGatewayUrl = 'http://localhost:3000',
    
    [Parameter()]
    [string]$KafkaMetricsUrl = 'http://localhost:9308/metrics'
)

Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  LinguaSign E2E Test Suite" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Set environment variables
$env:API_GATEWAY_URL = $ApiGatewayUrl
$env:KAFKA_METRICS_URL = $KafkaMetricsUrl

# Check if node_modules exists
if (-not (Test-Path ".\node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    Write-Host ""
}

# Run tests
Write-Host "Starting E2E tests..." -ForegroundColor Green
Write-Host "API Gateway: $ApiGatewayUrl" -ForegroundColor Gray
Write-Host "Kafka Metrics: $KafkaMetricsUrl" -ForegroundColor Gray
Write-Host ""

node e2e-test-suite.js

$exitCode = $LASTEXITCODE

Write-Host ""
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan

if ($exitCode -eq 0) {
    Write-Host "  All E2E tests passed!" -ForegroundColor Green
} else {
    Write-Host "  Some E2E tests failed!" -ForegroundColor Red
}

Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

exit $exitCode
