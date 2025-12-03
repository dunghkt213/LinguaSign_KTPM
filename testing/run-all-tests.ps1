# LinguaSign Testing Suite Runner
# Usage: .\run-all-tests.ps1

param(
    [switch]$SkipSetup,
    [switch]$SkipLoadTest,
    [switch]$SkipE2E
)

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  LinguaSign Testing Suite" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# Check Docker
if (-not $SkipSetup) {
    Write-Host "[1/4] Checking Docker..." -ForegroundColor Yellow
    
    $dockerPs = docker ps 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "X Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
        Write-Host "After starting Docker, run: docker-compose up -d" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "OK Docker is running" -ForegroundColor Green
    
    # Check services
    Write-Host "`nChecking services..." -ForegroundColor Yellow
    $apiGateway = docker ps --filter "name=api-gateway" --filter "status=running" -q
    
    if (-not $apiGateway) {
        Write-Host "Starting services..." -ForegroundColor Yellow
        Set-Location ..
        docker-compose up -d
        Set-Location testing
        Write-Host "Waiting 60 seconds for services to start..." -ForegroundColor Yellow
        Start-Sleep -Seconds 60
    } else {
        Write-Host "OK Services already running" -ForegroundColor Green
    }
}

# k6 Tests
if (-not $SkipLoadTest) {
    Write-Host "`n[2/4] k6 Load Tests" -ForegroundColor Yellow
    Write-Host "================================================================" -ForegroundColor Cyan
    
    $k6Ver = k6 version 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "X k6 not installed" -ForegroundColor Red
        Write-Host "Install: choco install k6" -ForegroundColor Yellow
        Write-Host "Or download from: https://k6.io/" -ForegroundColor Yellow
    } else {
        Write-Host "OK k6 installed" -ForegroundColor Green
        Set-Location k6
        .\run-tests.ps1 -TestType gateway
        Set-Location ..
    }
}

# E2E Tests  
if (-not $SkipE2E) {
    Write-Host "`n[3/4] E2E Tests" -ForegroundColor Yellow
    Write-Host "================================================================" -ForegroundColor Cyan
    
    Set-Location e2e
    
    if (-not (Test-Path "node_modules")) {
        Write-Host "Installing dependencies..." -ForegroundColor Yellow
        npm install
    }
    
    .\run-e2e.ps1
    Set-Location ..
}

# Summary
Write-Host "`n[4/4] Summary" -ForegroundColor Yellow
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Monitoring Dashboards:" -ForegroundColor Cyan
Write-Host "  Grafana:     http://localhost:3001 (admin/admin)" -ForegroundColor White
Write-Host "  Prometheus:  http://localhost:9090" -ForegroundColor White
Write-Host "  API Gateway: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "Tests completed!" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
