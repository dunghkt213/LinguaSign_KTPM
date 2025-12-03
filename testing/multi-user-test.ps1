#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Run performance tests with multiple user loads
.DESCRIPTION
    Automatically tests the system with 50, 100, 500, and 1000 concurrent users
.EXAMPLE
    .\multi-user-test.ps1
#>

param(
    [int[]]$UserCounts = @(50, 100, 500, 1000)
)

Write-Host "`n╔════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  COMPREHENSIVE PERFORMANCE TEST SUITE     ║" -ForegroundColor Cyan
Write-Host "║  Testing: $($UserCounts -join ', ') Users" -PadRight 45 -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$results = @()

foreach ($users in $UserCounts) {
    Write-Host "`n▶ Testing with $users users..." -ForegroundColor Yellow
    Write-Host "═══════════════════════════════════════════`n" -ForegroundColor Yellow
    
    $startTime = Get-Date
    .\quick-performance-test.ps1 -Users $users
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalSeconds
    
    $results += [PSCustomObject]@{
        Users = $users
        Duration = [math]::Round($duration, 2)
        Timestamp = $endTime.ToString("HH:mm:ss")
    }
    
    if ($users -ne $UserCounts[-1]) {
        Write-Host "`n⏳ Cooling down for 5 seconds..." -ForegroundColor Gray
        Start-Sleep -Seconds 5
    }
}

Write-Host "`n╔════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  ALL TESTS COMPLETED!                     ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════╝`n" -ForegroundColor Green

Write-Host "Test Summary:" -ForegroundColor Cyan
$results | Format-Table -AutoSize

$totalTime = ($results | Measure-Object -Property Duration -Sum).Sum
Write-Host "Total test time: $([math]::Round($totalTime / 60, 2)) minutes" -ForegroundColor Yellow
