# Run k6 Load Tests for LinguaSign Microservices
# Usage: .\run-tests.ps1 [-TestType <gateway|kafka|all>] [-OutputFormat <json|html|influx>]

param(
    [Parameter()]
    [ValidateSet('gateway', 'kafka', 'all')]
    [string]$TestType = 'all',
    
    [Parameter()]
    [string]$ApiGatewayUrl = 'http://localhost:3000',
    
    [Parameter()]
    [string]$KafkaMetricsUrl = 'http://localhost:9308/metrics',
    
    [Parameter()]
    [switch]$UseInfluxDB,
    
    [Parameter()]
    [string]$OutputDir = '.\results'
)

Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  LinguaSign Load Testing Suite" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Create output directory
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir | Out-Null
    Write-Host "✓ Created output directory: $OutputDir" -ForegroundColor Green
}

# Check if k6 is installed
try {
    $k6Version = k6 version
    Write-Host "✓ k6 version: $k6Version" -ForegroundColor Green
}
catch {
    Write-Host "✗ k6 is not installed. Please install from: https://k6.io/docs/getting-started/installation/" -ForegroundColor Red
    exit 1
}

# Prepare k6 options
$env:API_GATEWAY_URL = $ApiGatewayUrl
$env:KAFKA_METRICS_URL = $KafkaMetricsUrl

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

function Run-GatewayTest {
    Write-Host ""
    Write-Host "═══ Running API Gateway Load Test ═══" -ForegroundColor Yellow
    Write-Host "Target: $ApiGatewayUrl" -ForegroundColor Gray
    Write-Host ""
    
    $outputFile = Join-Path $OutputDir "gateway-test-$timestamp.json"
    
    if ($UseInfluxDB) {
        k6 run --out influxdb=http://localhost:8086/k6 `
            --summary-export=$outputFile `
            .\gateway-load-test.js
    }
    else {
        k6 run --summary-export=$outputFile `
            .\gateway-load-test.js
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✓ Gateway Load Test completed successfully" -ForegroundColor Green
        Write-Host "  Results saved to: $outputFile" -ForegroundColor Gray
    }
    else {
        Write-Host ""
        Write-Host "✗ Gateway Load Test failed" -ForegroundColor Red
    }
}

function Run-KafkaTest {
    Write-Host ""
    Write-Host "═══ Running Kafka Throughput Test ═══" -ForegroundColor Yellow
    Write-Host "Target: $ApiGatewayUrl" -ForegroundColor Gray
    Write-Host "Metrics: $KafkaMetricsUrl" -ForegroundColor Gray
    Write-Host ""
    
    $outputFile = Join-Path $OutputDir "kafka-test-$timestamp.json"
    
    if ($UseInfluxDB) {
        k6 run --out influxdb=http://localhost:8086/k6 `
            --summary-export=$outputFile `
            .\kafka-throughput-test.js
    }
    else {
        k6 run --summary-export=$outputFile `
            .\kafka-throughput-test.js
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✓ Kafka Throughput Test completed successfully" -ForegroundColor Green
        Write-Host "  Results saved to: $outputFile" -ForegroundColor Gray
    }
    else {
        Write-Host ""
        Write-Host "✗ Kafka Throughput Test failed" -ForegroundColor Red
    }
}

# Run tests based on type
switch ($TestType) {
    'gateway' {
        Run-GatewayTest
    }
    'kafka' {
        Run-KafkaTest
    }
    'all' {
        Run-GatewayTest
        Write-Host ""
        Write-Host "Waiting 30 seconds before next test..." -ForegroundColor Gray
        Start-Sleep -Seconds 30
        Run-KafkaTest
    }
}

Write-Host ""
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  All tests completed!" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Results directory: $OutputDir" -ForegroundColor Green
Write-Host ""
