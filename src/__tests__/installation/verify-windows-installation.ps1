<#
.SYNOPSIS
    Verification script for Windows installation of SMG_C application.
.DESCRIPTION
    This PowerShell script verifies that the SMG_C application has been correctly
    installed on a Windows system by checking file existence, registry entries,
    shortcut creation, and other installation artifacts.
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
$DesktopPath = [Environment]::GetFolderPath("Desktop")
$StartMenuPath = Join-Path -Path ([Environment]::GetFolderPath("StartMenu")) -ChildPath "Programs\$ManufacturerName"

# Expected registry paths
$UninstallRegPath = "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall"
$AppRegPath = "$UninstallRegPath\{$AppName}_is1" # Default NSIS registry location

# Results tracking
$TotalChecks = 0
$PassedChecks = 0
$FailedChecks = @()

# Helper function to test a condition and track results
function Test-Condition {
    param (
        [Parameter(Mandatory=$true)]
        [bool]$Condition,
        
        [Parameter(Mandatory=$true)]
        [string]$Description,
        
        [Parameter(Mandatory=$false)]
        [string]$FailMessage
    )
    
    $TotalChecks++
    
    if ($Condition) {
        Write-Host "✅ PASS: $Description" -ForegroundColor Green
        $script:PassedChecks++
    } else {
        Write-Host "❌ FAIL: $Description" -ForegroundColor Red
        if ($FailMessage) {
            Write-Host "   $FailMessage" -ForegroundColor Red
        }
        $script:FailedChecks += $Description
    }
}

# Display header
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "  SMG_C Windows Installation Verification" -ForegroundColor Cyan
Write-Host "  Version: $ExpectedVersion" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host

# 1. Check if application files exist
Write-Host "Checking application files..." -ForegroundColor Yellow
Test-Condition -Condition (Test-Path -Path $AppInstallPath) -Description "Application installation directory exists"
if (Test-Path -Path $AppInstallPath) {
    $ExePath = Join-Path -Path $AppInstallPath -ChildPath "$AppName.exe"
    Test-Condition -Condition (Test-Path -Path $ExePath) -Description "Application executable exists"
}

# 2. Check shortcuts
Write-Host "Checking shortcuts..." -ForegroundColor Yellow
$DesktopShortcut = Join-Path -Path $DesktopPath -ChildPath "$AppName.lnk"
$StartMenuShortcut = Join-Path -Path $StartMenuPath -ChildPath "$AppName.lnk"
Test-Condition -Condition (Test-Path -Path $DesktopShortcut) -Description "Desktop shortcut exists"
Test-Condition -Condition (Test-Path -Path $StartMenuShortcut) -Description "Start Menu shortcut exists"

# 3. Check registry entries
Write-Host "Checking registry entries..." -ForegroundColor Yellow
Test-Condition -Condition (Test-Path -Path $AppRegPath) -Description "Application registry key exists"

if (Test-Path -Path $AppRegPath) {
    $DisplayName = (Get-ItemProperty -Path $AppRegPath -Name "DisplayName" -ErrorAction SilentlyContinue).DisplayName
    $DisplayVersion = (Get-ItemProperty -Path $AppRegPath -Name "DisplayVersion" -ErrorAction SilentlyContinue).DisplayVersion
    $Publisher = (Get-ItemProperty -Path $AppRegPath -Name "Publisher" -ErrorAction SilentlyContinue).Publisher
    $UninstallString = (Get-ItemProperty -Path $AppRegPath -Name "UninstallString" -ErrorAction SilentlyContinue).UninstallString
    
    Test-Condition -Condition ($DisplayName -like "*$AppName*") -Description "Display name is correct" -FailMessage "Found: $DisplayName"
    Test-Condition -Condition ($DisplayVersion -eq $ExpectedVersion) -Description "Version is correct" -FailMessage "Found: $DisplayVersion, Expected: $ExpectedVersion"
    Test-Condition -Condition ($Publisher -like "*$ManufacturerName*") -Description "Publisher is correct" -FailMessage "Found: $Publisher, Expected: $ManufacturerName"
    Test-Condition -Condition ($null -ne $UninstallString) -Description "Uninstall string exists"
}

# 4. Check WebView2 integration
Write-Host "Checking WebView2 integration..." -ForegroundColor Yellow
$WebView2RegPath = "HKLM:\SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}"
$WebView2Installed = (Test-Path -Path $WebView2RegPath) -or ((Get-ItemProperty HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\* | Where-Object { $_.DisplayName -like "*WebView2*" }) -ne $null)
Test-Condition -Condition $WebView2Installed -Description "WebView2 Runtime is installed"

# 5. Check application launch
Write-Host "Checking application launch..." -ForegroundColor Yellow
try {
    if (Test-Path $ExePath) {
        $ProcessName = [System.IO.Path]::GetFileNameWithoutExtension($ExePath)
        $AppProcess = Start-Process -FilePath $ExePath -PassThru
        Start-Sleep -Seconds 5
        $ProcessRunning = Get-Process -Name $ProcessName -ErrorAction SilentlyContinue
        Test-Condition -Condition ($null -ne $ProcessRunning) -Description "Application launches successfully"
        
        if ($null -ne $ProcessRunning) {
            Stop-Process -Name $ProcessName -Force
            Write-Host "   Application process stopped." -ForegroundColor Gray
        }
    } else {
        Test-Condition -Condition $false -Description "Application launches successfully" -FailMessage "Application executable not found"
    }
}
catch {
    Test-Condition -Condition $false -Description "Application launches successfully" -FailMessage "Error: $_"
}

# Summary
Write-Host
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "  Test Summary" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "Total checks: $TotalChecks" -ForegroundColor White
Write-Host "Passed: $PassedChecks" -ForegroundColor Green
Write-Host "Failed: $($FailedChecks.Count)" -ForegroundColor $(if ($FailedChecks.Count -gt 0) { "Red" } else { "Green" })

if ($FailedChecks.Count -gt 0) {
    Write-Host
    Write-Host "Failed checks:" -ForegroundColor Red
    foreach ($failure in $FailedChecks) {
        Write-Host "  - $failure" -ForegroundColor Red
    }
    exit $FAILURE
} else {
    Write-Host
    Write-Host "All installation verification checks passed!" -ForegroundColor Green
    exit $SUCCESS
} 