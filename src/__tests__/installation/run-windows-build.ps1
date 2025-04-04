<#
.SYNOPSIS
    Runner script for Windows installation package build process.
.DESCRIPTION
    This PowerShell script runs the build process for Windows installation packages
    and handles errors and logging.
.NOTES
    Author: SMG_C Development Team
    Version: 1.0
    Date: April 12, 2024
#>

#Requires -Version 5.1

# Parameters
param (
    [Parameter()]
    [switch]$SkipTests = $false,
    
    [Parameter()]
    [string]$LogFile = "windows-build-log.txt"
)

# Script location
$ScriptPath = $PSScriptRoot
$BuildScript = Join-Path -Path $ScriptPath -ChildPath "build-windows-installer.ps1"
$StartTime = Get-Date

# Start transcript logging
$TranscriptPath = Join-Path -Path $ScriptPath -ChildPath $LogFile
Start-Transcript -Path $TranscriptPath -Force

try {
    Write-Host "==============================================" -ForegroundColor Cyan
    Write-Host "  SMG_C Windows Build Process" -ForegroundColor Cyan
    Write-Host "  Started at: $StartTime" -ForegroundColor Cyan
    Write-Host "==============================================" -ForegroundColor Cyan
    Write-Host

    # Verify build script exists
    if (-not (Test-Path -Path $BuildScript)) {
        throw "Build script not found at $BuildScript"
    }

    # Run the build script
    Write-Host "Starting build process..." -ForegroundColor Yellow
    & $BuildScript
    $buildResult = $LASTEXITCODE

    # Check if build was successful
    if ($buildResult -ne 0) {
        Write-Host "❌ Build process failed with exit code $buildResult" -ForegroundColor Red
        exit $buildResult
    }

    # Run tests if not skipped
    if (-not $SkipTests) {
        Write-Host "Tests would be run here, but they require the installer to be run first." -ForegroundColor Yellow
        Write-Host "After installing the application, run the verification scripts from the 'dist' folder." -ForegroundColor Yellow
    } else {
        Write-Host "Tests skipped as requested." -ForegroundColor Yellow
    }

    # Calculate elapsed time
    $EndTime = Get-Date
    $ElapsedTime = $EndTime - $StartTime
    $FormattedTime = "{0:mm}:{0:ss}" -f $ElapsedTime

    # Output summary
    Write-Host
    Write-Host "==============================================" -ForegroundColor Cyan
    Write-Host "  Build Process Complete" -ForegroundColor Cyan
    Write-Host "  Elapsed time: $FormattedTime" -ForegroundColor Cyan
    Write-Host "  Log file: $TranscriptPath" -ForegroundColor Cyan
    Write-Host "==============================================" -ForegroundColor Cyan

    exit 0
} 
catch {
    Write-Host "❌ ERROR: $_" -ForegroundColor Red
    Write-Host "Stack Trace: $($_.ScriptStackTrace)" -ForegroundColor Red
    exit 1
}
finally {
    Stop-Transcript
} 