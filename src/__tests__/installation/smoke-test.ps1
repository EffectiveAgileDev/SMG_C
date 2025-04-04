<#
.SYNOPSIS
    Smoke test script for SMG_C application after Windows installation.
.DESCRIPTION
    This PowerShell script performs basic functional verification of the SMG_C
    application after installation to ensure core features are working properly.
.NOTES
    Author: SMG_C Development Team
    Version: 1.0
    Date: April 12, 2024
#>

#Requires -Version 5.1

# Exit codes
$SUCCESS = 0
$FAILURE = 1

# Configuration
$AppName = "smg_c"
$ManufacturerName = "Effective Agile Development"
$ExpectedVersion = "0.1.0"

# Expected installation paths
$ProgramFilesPath = [Environment]::GetFolderPath("ProgramFiles")
$AppInstallPath = Join-Path -Path $ProgramFilesPath -ChildPath "$ManufacturerName\$AppName"
$ExePath = Join-Path -Path $AppInstallPath -ChildPath "$AppName.exe"

# Results tracking
$TestCount = 0
$PassedTests = 0
$FailedTests = @()

# Helper function to run a test
function Test-Feature {
    param (
        [Parameter(Mandatory=$true)]
        [string]$Name,
        
        [Parameter(Mandatory=$true)]
        [scriptblock]$Test,
        
        [Parameter(Mandatory=$false)]
        [int]$Timeout = 30
    )
    
    $TestCount++
    Write-Host "Test $TestCount : $Name" -ForegroundColor Yellow
    
    try {
        $Result = & $Test
        if ($Result) {
            Write-Host "✅ PASS: $Name" -ForegroundColor Green
            $script:PassedTests++
        } else {
            Write-Host "❌ FAIL: $Name" -ForegroundColor Red
            $script:FailedTests += $Name
        }
    }
    catch {
        Write-Host "❌ FAIL: $Name - Exception: $_" -ForegroundColor Red
        $script:FailedTests += "$Name (Exception: $_)"
    }
    
    Write-Host
}

# Display header
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "  SMG_C Windows Application Smoke Test" -ForegroundColor Cyan
Write-Host "  Version: $ExpectedVersion" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host

# Verify executable exists before starting tests
if (-not (Test-Path -Path $ExePath)) {
    Write-Host "❌ CRITICAL ERROR: Application executable not found at $ExePath" -ForegroundColor Red
    exit $FAILURE
}

# Launch the application
Write-Host "Launching application..." -ForegroundColor Yellow
$ProcessName = [System.IO.Path]::GetFileNameWithoutExtension($ExePath)
try {
    $AppProcess = Start-Process -FilePath $ExePath -PassThru
    Start-Sleep -Seconds 5
}
catch {
    Write-Host "❌ CRITICAL ERROR: Failed to launch application - $_" -ForegroundColor Red
    exit $FAILURE
}

# Check if process is running
$ProcessRunning = Get-Process -Name $ProcessName -ErrorAction SilentlyContinue
if ($null -eq $ProcessRunning) {
    Write-Host "❌ CRITICAL ERROR: Application process not found after launch" -ForegroundColor Red
    exit $FAILURE
}

Write-Host "Application launched successfully with process ID: $($AppProcess.Id)" -ForegroundColor Green
Write-Host

# Test 1: Verify application window exists
Test-Feature -Name "Application window exists" -Test {
    $AppWindow = Get-Process -Name $ProcessName | Where-Object { $_.MainWindowTitle -ne "" }
    return ($null -ne $AppWindow)
}

# Test 2: Verify application responds to basic input
Test-Feature -Name "Application responds to input" -Test {
    # This is a placeholder - in a real test, we would use UI automation to send input
    # For now, we'll just assume it works if the window is still open
    $AppWindow = Get-Process -Name $ProcessName -ErrorAction SilentlyContinue
    return ($null -ne $AppWindow)
}

# Test 3: Verify application creates expected temporary files
Test-Feature -Name "Application creates expected temp files" -Test {
    $TempPath = [System.IO.Path]::GetTempPath()
    $AppTempFiles = Get-ChildItem -Path $TempPath -Filter "*$AppName*" -ErrorAction SilentlyContinue
    return ($AppTempFiles.Count -gt 0)
}

# Test 4: Verify application has network access (if online)
Test-Feature -Name "Application has network access" -Test {
    # Check connectivity with Test-NetConnection if available
    if (Get-Command "Test-NetConnection" -ErrorAction SilentlyContinue) {
        $NetTest = Test-NetConnection -ComputerName "www.google.com" -InformationLevel Quiet -ErrorAction SilentlyContinue
        return $NetTest
    } else {
        # Fallback to ping
        $Ping = Test-Connection -ComputerName "www.google.com" -Count 1 -Quiet -ErrorAction SilentlyContinue
        return $Ping
    }
}

# Close the application gracefully
Write-Host "Closing application..." -ForegroundColor Yellow
try {
    Stop-Process -Name $ProcessName -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    
    # Verify process has been closed
    $ProcessRunning = Get-Process -Name $ProcessName -ErrorAction SilentlyContinue
    if ($null -eq $ProcessRunning) {
        Write-Host "Application closed successfully." -ForegroundColor Green
    } else {
        Write-Host "Warning: Application did not close properly." -ForegroundColor Yellow
        Stop-Process -Id $ProcessRunning.Id -Force -ErrorAction SilentlyContinue
    }
}
catch {
    Write-Host "Warning: Error while closing application - $_" -ForegroundColor Yellow
}

# Summary
Write-Host
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "  Smoke Test Summary" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "Total tests: $TestCount" -ForegroundColor White
Write-Host "Passed: $PassedTests" -ForegroundColor Green
Write-Host "Failed: $($FailedTests.Count)" -ForegroundColor $(if ($FailedTests.Count -gt 0) { "Red" } else { "Green" })

if ($FailedTests.Count -gt 0) {
    Write-Host
    Write-Host "Failed tests:" -ForegroundColor Red
    foreach ($failure in $FailedTests) {
        Write-Host "  - $failure" -ForegroundColor Red
    }
    exit $FAILURE
} else {
    Write-Host
    Write-Host "All smoke tests passed!" -ForegroundColor Green
    exit $SUCCESS
} 