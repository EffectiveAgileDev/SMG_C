<#
.SYNOPSIS
    Verification script for uninstallation of Promptly Social application.
.DESCRIPTION
    This PowerShell script verifies that the Promptly Social application has been correctly
    uninstalled by checking that files, registry entries, and shortcuts have been removed.
.NOTES
    Author: Promptly Social Development Team
    Version: 1.0
    Date: April 12, 2024
#>

#Requires -Version 5.1

# Exit codes
$SUCCESS = 0
$FAILURE = 1

# Configuration
$AppName = "PromptlySocial"
$AppDisplayName = "Promptly Social"
$ManufacturerName = "Effective Agile Development"

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
Write-Host "  $AppDisplayName Windows Uninstallation Verification" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host

# 1. Check if application files have been removed
Write-Host "Checking application files removal..." -ForegroundColor Yellow
Test-Condition -Condition (-not (Test-Path -Path $AppInstallPath)) -Description "Application installation directory has been removed"

# 2. Check if shortcuts have been removed
Write-Host "Checking shortcuts removal..." -ForegroundColor Yellow
$DesktopShortcut = Join-Path -Path $DesktopPath -ChildPath "$AppDisplayName.lnk"
$StartMenuShortcut = Join-Path -Path $StartMenuPath -ChildPath "$AppDisplayName.lnk"
Test-Condition -Condition (-not (Test-Path -Path $DesktopShortcut)) -Description "Desktop shortcut has been removed"
Test-Condition -Condition (-not (Test-Path -Path $StartMenuPath)) -Description "Start Menu folder has been removed"

# 3. Check if registry entries have been removed
Write-Host "Checking registry entries removal..." -ForegroundColor Yellow
Test-Condition -Condition (-not (Test-Path -Path $AppRegPath)) -Description "Application registry key has been removed"

# 4. Check for leftover files in temp directories
Write-Host "Checking for leftover files..." -ForegroundColor Yellow
$TempPath = [System.IO.Path]::GetTempPath()
$AppTempFiles = Get-ChildItem -Path $TempPath -Filter "*$AppName*" -ErrorAction SilentlyContinue
Test-Condition -Condition ($AppTempFiles.Count -eq 0) -Description "No leftover temp files exist" -FailMessage "Found $($AppTempFiles.Count) temporary files"

# 5. Check application process is not running
Write-Host "Checking application process..." -ForegroundColor Yellow
$ProcessRunning = Get-Process -Name $AppName -ErrorAction SilentlyContinue
Test-Condition -Condition ($null -eq $ProcessRunning) -Description "Application process is not running"

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
    Write-Host
    Write-Host "Uninstallation was not complete. Leftover files or registry entries remain." -ForegroundColor Red
    exit $FAILURE
} else {
    Write-Host
    Write-Host "Uninstallation was successful. All application components have been removed." -ForegroundColor Green
    exit $SUCCESS
} 