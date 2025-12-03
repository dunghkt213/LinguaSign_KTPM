# Comprehensive System Test Report
# Tests all components and generates report

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  LinguaSign System Test Report" -ForegroundColor Cyan  
Write-Host "  $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

$report = @{
    timestamp = Get-Date -Format "o"
    services = @{}
    monitoring = @{}
    performance = @{}
}

# Test 1: Docker Containers
Write-Host "[1/5] Checking Docker Containers..." -ForegroundColor Yellow
$containers = docker ps --format "{{.Names}},{{.Status}},{{.Ports}}"
$report.services.containers = @()
foreach ($line in $containers) {
    $parts = $line -split ","
    if ($parts.Length -ge 2) {
        $containerInfo = @{
            name = $parts[0]
            status = $parts[1]
            ports = if ($parts.Length -gt 2) { $parts[2] } else { "none" }
        }
        $report.services.containers += $containerInfo
        Write-Host "  OK $($parts[0])" -ForegroundColor Green
    }
}
Write-Host ""

# Test 2: Monitoring Stack
Write-Host "[2/5] Testing Monitoring Stack..." -ForegroundColor Yellow

$monitoringServices = @{
    "Prometheus" = "http://localhost:9090/-/healthy"
    "Grafana" = "http://localhost:3001/api/health"
    "Kafka Exporter" = "http://localhost:9308/metrics"
}

foreach ($service in $monitoringServices.Keys) {
    $url = $monitoringServices[$service]
    try {
        $response = Invoke-RestMethod -Uri $url -TimeoutSec 5 -ErrorAction Stop
        $report.monitoring[$service] = @{
            status = "healthy"
            url = $url
            accessible = $true
        }
        Write-Host "  OK $service - Healthy" -ForegroundColor Green
    } catch {
        $report.monitoring[$service] = @{
            status = "unhealthy"
            url = $url
            accessible = $false
            error = $_.Exception.Message
        }
        Write-Host "  X $service - Failed" -ForegroundColor Red
    }
}
Write-Host ""

# Test 3: Kafka Health
Write-Host "[3/5] Checking Kafka Metrics..." -ForegroundColor Yellow
try {
    $kafkaMetrics = Invoke-WebRequest -Uri "http://localhost:9308/metrics" -UseBasicParsing -TimeoutSec 5
    $metricsText = $kafkaMetrics.Content
    
    # Parse some key metrics
    if ($metricsText -match 'kafka_server_brokertopicmetrics_messagesin_total') {
        Write-Host "  OK Kafka message metrics available" -ForegroundColor Green
        $report.monitoring.kafka = @{
            metrics_available = $true
            has_message_metrics = $true
        }
    }
    
    if ($metricsText -match 'kafka_consumergroup_lag') {
        Write-Host "  OK Consumer lag metrics available" -ForegroundColor Green
        $report.monitoring.kafka.has_lag_metrics = $true
    }
} catch {
    Write-Host "  X Kafka metrics not available" -ForegroundColor Red
    $report.monitoring.kafka = @{
        metrics_available = $false
        error = $_.Exception.Message
    }
}
Write-Host ""

# Test 4: Prometheus Targets
Write-Host "[4/5] Checking Prometheus Targets..." -ForegroundColor Yellow
try {
    $targets = Invoke-RestMethod -Uri "http://localhost:9090/api/v1/targets" -TimeoutSec 5
    $upTargets = 0
    $downTargets = 0
    
    foreach ($target in $targets.data.activeTargets) {
        if ($target.health -eq "up") {
            $upTargets++
            Write-Host "  OK $($target.labels.job) - UP" -ForegroundColor Green
        } else {
            $downTargets++
            Write-Host "  X $($target.labels.job) - DOWN" -ForegroundColor Red
        }
    }
    
    $report.monitoring.prometheus_targets = @{
        total = $targets.data.activeTargets.Count
        up = $upTargets
        down = $downTargets
    }
    
    Write-Host "`n  Summary: $upTargets UP / $downTargets DOWN" -ForegroundColor $(if($downTargets -eq 0){"Green"}else{"Yellow"})
} catch {
    Write-Host "  X Could not fetch Prometheus targets" -ForegroundColor Red
    $report.monitoring.prometheus_targets = @{
        error = $_.Exception.Message
    }
}
Write-Host ""

# Test 5: System Resources
Write-Host "[5/5] Checking System Resources..." -ForegroundColor Yellow
try {
    $dockerStats = docker stats --no-stream --format "{{.Container}},{{.CPUPerc}},{{.MemUsage}}"
    $report.performance.containers = @()
    
    foreach ($line in $dockerStats) {
        $parts = $line -split ","
        if ($parts.Length -eq 3) {
            $containerStats = @{
                name = $parts[0]
                cpu = $parts[1]
                memory = $parts[2]
            }
            $report.performance.containers += $containerStats
            Write-Host "  $($parts[0]): CPU $($parts[1]), RAM $($parts[2])" -ForegroundColor White
        }
    }
} catch {
    Write-Host "  X Could not fetch container stats" -ForegroundColor Red
}
Write-Host ""

# Generate Summary
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  SUMMARY" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

$totalContainers = $report.services.containers.Count
$healthyMonitoring = ($report.monitoring.Values | Where-Object { $_.status -eq "healthy" }).Count
$totalMonitoring = $report.monitoring.Count

Write-Host "Containers Running:       $totalContainers" -ForegroundColor White
Write-Host "Monitoring Services:      $healthyMonitoring / $totalMonitoring healthy" -ForegroundColor $(if($healthyMonitoring -eq $totalMonitoring){"Green"}else{"Yellow"})

if ($report.monitoring.prometheus_targets) {
    $upTargets = $report.monitoring.prometheus_targets.up
    $totalTargets = $report.monitoring.prometheus_targets.total
    Write-Host "Prometheus Targets:       $upTargets / $totalTargets up" -ForegroundColor $(if($upTargets -eq $totalTargets){"Green"}else{"Yellow"})
}

Write-Host ""
Write-Host "Access Points:" -ForegroundColor Cyan
Write-Host "  Grafana:        http://localhost:3001 (admin/admin)" -ForegroundColor White
Write-Host "  Prometheus:     http://localhost:9090" -ForegroundColor White
Write-Host "  API Gateway:    http://localhost:3000" -ForegroundColor White
Write-Host "  Kafka Metrics:  http://localhost:9308/metrics" -ForegroundColor White
Write-Host ""

# Save Report
$reportDir = "results"
if (-not (Test-Path $reportDir)) {
    New-Item -ItemType Directory -Path $reportDir | Out-Null
}

$reportFile = Join-Path $reportDir "system-test-report-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
$report | ConvertTo-Json -Depth 10 | Out-File $reportFile

Write-Host "Report saved to: $reportFile" -ForegroundColor Green
Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# Overall Status
$overallHealth = $true
if ($healthyMonitoring -lt $totalMonitoring) { $overallHealth = $false }
if ($report.monitoring.prometheus_targets -and $report.monitoring.prometheus_targets.down -gt 0) { $overallHealth = $false }

if ($overallHealth) {
    Write-Host "SYSTEM STATUS: HEALTHY" -ForegroundColor Green
    exit 0
} else {
    Write-Host "SYSTEM STATUS: NEEDS ATTENTION" -ForegroundColor Yellow
    exit 1
}
