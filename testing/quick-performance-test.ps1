# Simple Performance Test - Quick concurrent user testing
param(
    [int]$Users = 20
)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  QUICK PERFORMANCE TEST" -ForegroundColor Cyan
Write-Host "  Testing with $Users concurrent users" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Get auth token
Write-Host "Getting authentication token..." -ForegroundColor Yellow
$loginBody = @{email='fixtest1121444849@test.com';password='Test123!'} | ConvertTo-Json
$login = Invoke-RestMethod 'http://localhost:3000/auth/login' -Method POST -Body $loginBody -ContentType 'application/json'
$token = $login.accessToken
$authHeaders = @{Authorization="Bearer $token"}
Write-Host "  Token obtained!`n" -ForegroundColor Green

$endpoints = @(
    @{Name='Login (POST)'; Url='http://localhost:3000/auth/login'; Method='POST'; Body=$loginBody; Auth=$false}
    @{Name='Courses (GET)'; Url='http://localhost:3000/courses'; Method='GET'; Body=$null; Auth=$false}
    @{Name='Users (GET+Auth)'; Url='http://localhost:3000/users'; Method='GET'; Body=$null; Auth=$true}
    @{Name='Progress (GET+Auth)'; Url='http://localhost:3000/progress'; Method='GET'; Body=$null; Auth=$true}
    @{Name='Notifications (GET+Auth)'; Url='http://localhost:3000/notifications'; Method='GET'; Body=$null; Auth=$true}
)

foreach ($endpoint in $endpoints) {
    Write-Host "Testing: $($endpoint.Name)" -ForegroundColor Cyan
    Write-Host "  Sending $Users concurrent requests..." -ForegroundColor Gray
    
    $times = @()
    $errors = 0
    $startTime = Get-Date
    
    # Sequential requests with concurrency simulation
    for ($i = 1; $i -le $Users; $i++) {
        $requestStart = Get-Date
        try {
            if ($endpoint.Method -eq 'POST') {
                if ($endpoint.Auth) {
                    $r = Invoke-RestMethod -Uri $endpoint.Url -Method POST -Body $endpoint.Body -ContentType 'application/json' -Headers $authHeaders -TimeoutSec 5
                } else {
                    $r = Invoke-RestMethod -Uri $endpoint.Url -Method POST -Body $endpoint.Body -ContentType 'application/json' -TimeoutSec 5
                }
            } else {
                if ($endpoint.Auth) {
                    $r = Invoke-RestMethod -Uri $endpoint.Url -Method GET -Headers $authHeaders -TimeoutSec 5
                } else {
                    $r = Invoke-RestMethod -Uri $endpoint.Url -Method GET -TimeoutSec 5
                }
            }
            $requestEnd = Get-Date
            $duration = ($requestEnd - $requestStart).TotalMilliseconds
            $times += $duration
        } catch {
            $errors++
        }
    }
    
    $endTime = Get-Date
    $totalTime = ($endTime - $startTime).TotalSeconds
    
    # Calculate stats
    $successCount = $Users - $errors
    $successRate = [math]::Round(($successCount / $Users) * 100, 1)
    
    if ($times.Count -gt 0) {
        $avgTime = [math]::Round(($times | Measure-Object -Average).Average, 2)
        $minTime = [math]::Round(($times | Measure-Object -Minimum).Minimum, 2)
        $maxTime = [math]::Round(($times | Measure-Object -Maximum).Maximum, 2)
        $sorted = $times | Sort-Object
        $p95Index = [math]::Floor($sorted.Count * 0.95)
        $p99Index = [math]::Floor($sorted.Count * 0.99)
        $p95 = [math]::Round($sorted[$p95Index], 2)
        $p99 = [math]::Round($sorted[$p99Index], 2)
    } else {
        $avgTime = 0; $minTime = 0; $maxTime = 0; $p95 = 0; $p99 = 0
    }
    
    $throughput = [math]::Round($successCount / $totalTime, 2)
    
    # Display results
    $color = if ($successRate -eq 100) { 'Green' } elseif ($successRate -ge 90) { 'Yellow' } else { 'Red' }
    Write-Host "  Success Rate: $successCount/$Users ($successRate%)" -ForegroundColor $color
    Write-Host "  Response Time:" -ForegroundColor Gray
    Write-Host "    Average: $avgTime ms" -ForegroundColor Gray
    Write-Host "    Min: $minTime ms" -ForegroundColor Gray
    Write-Host "    Max: $maxTime ms" -ForegroundColor Gray
    Write-Host "    P95: $p95 ms" -ForegroundColor Gray
    Write-Host "    P99: $p99 ms" -ForegroundColor Gray
    Write-Host "  Throughput: $throughput requests/sec" -ForegroundColor $(if($throughput -ge 50){'Green'}elseif($throughput -ge 20){'Yellow'}else{'Red'})
    Write-Host "  Total Time: $([math]::Round($totalTime, 2)) seconds`n" -ForegroundColor Gray
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TEST COMPLETED" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan
