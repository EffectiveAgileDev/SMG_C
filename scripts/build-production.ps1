<#
.SYNOPSIS
    Production build script for Promptly Social Windows installation packages.
.DESCRIPTION
    This PowerShell script runs a production build with optimized assets and 
    creates Windows MSI and EXE installer packages for Promptly Social.
.NOTES
    Author: Promptly Social Development Team
    Version: 1.0
    Date: April 12, 2024
#>

#Requires -Version 5.1

# Start transcript logging
$TranscriptPath = Join-Path -Path $PSScriptRoot -ChildPath "..\logs\build-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
$LogsDir = Join-Path -Path $PSScriptRoot -ChildPath "..\logs"
if (-not (Test-Path -Path $LogsDir)) {
    New-Item -Path $LogsDir -ItemType Directory -Force | Out-Null
}
Start-Transcript -Path $TranscriptPath -Append

# Parameters
param(
    [switch]$SkipTests,
    [switch]$SkipClean,
    [switch]$SignBuild,
    [string]$BuildMode = "release"
)

# Configuration
$AppName = "PromptlySocial"
$AppDisplayName = "Promptly Social"
$ErrorCount = 0
$StartTime = Get-Date

# Paths
$ProjectRoot = Resolve-Path (Join-Path -Path $PSScriptRoot -ChildPath "..")
$DistPath = Join-Path -Path $ProjectRoot -ChildPath "dist"
$BuildScriptPath = Join-Path -Path $ProjectRoot -ChildPath "src\__tests__\installation\build-windows-installer.ps1"

# Display header
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "  $AppDisplayName Production Build Script" -ForegroundColor Cyan
Write-Host "  Started: $StartTime" -ForegroundColor Cyan
Write-Host "  Build Mode: $BuildMode" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host

# Verify build script exists
if (-not (Test-Path -Path $BuildScriptPath)) {
    Write-Host "❌ ERROR: Build script not found at $BuildScriptPath" -ForegroundColor Red
    exit 1
}

# Function to run a command and handle errors
function Invoke-BuildStep {
    param (
        [Parameter(Mandatory=$true)]
        [string]$Name,
        
        [Parameter(Mandatory=$true)]
        [scriptblock]$Command
    )
    
    $stepStartTime = Get-Date
    Write-Host "Step: $Name" -ForegroundColor Yellow
    Write-Host "Started: $stepStartTime" -ForegroundColor Yellow
    Write-Host "-------------------------------------------" -ForegroundColor Yellow
    
    try {
        & $Command
        $exitCode = $LASTEXITCODE
        
        if ($exitCode -ne 0) {
            Write-Host "❌ ERROR: $Name failed with exit code $exitCode" -ForegroundColor Red
            $script:ErrorCount++
            return $false
        } else {
            $stepEndTime = Get-Date
            $duration = $stepEndTime - $stepStartTime
            Write-Host "✅ SUCCESS: $Name completed successfully in $($duration.TotalSeconds.ToString("0.00")) seconds" -ForegroundColor Green
            return $true
        }
    }
    catch {
        Write-Host "❌ ERROR: $Name failed with exception: $_" -ForegroundColor Red
        $script:ErrorCount++
        return $false
    }
    finally {
        Write-Host
    }
}

# Step 1: Clean existing build artifacts
if (-not $SkipClean) {
    Invoke-BuildStep -Name "Cleaning previous build artifacts" -Command {
        # Clean dist directory
        if (Test-Path -Path $DistPath) {
            Remove-Item -Path $DistPath -Recurse -Force
        }
        
        # Clean Tauri build artifacts
        $tauriTargetPath = Join-Path -Path $ProjectRoot -ChildPath "src-tauri\target"
        if (Test-Path -Path $tauriTargetPath) {
            Remove-Item -Path $tauriTargetPath -Recurse -Force
        }
        
        # Clean node_modules (optional)
        # if (Test-Path -Path (Join-Path -Path $ProjectRoot -ChildPath "node_modules")) {
        #     Remove-Item -Path (Join-Path -Path $ProjectRoot -ChildPath "node_modules") -Recurse -Force
        # }
        
        return 0
    }
}

# Step 2: Install dependencies
Invoke-BuildStep -Name "Installing dependencies" -Command {
    Set-Location -Path $ProjectRoot
    
    # Install npm dependencies
    Write-Host "Installing npm dependencies..." -ForegroundColor Yellow
    npm ci --no-audit --no-fund
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to install npm dependencies"
    }
    
    # Check for Rust and Tauri CLI
    Write-Host "Checking Rust toolchain..." -ForegroundColor Yellow
    $rustVersion = rustc --version
    if ($LASTEXITCODE -ne 0) {
        throw "Rust is not installed"
    }
    Write-Host "Rust version: $rustVersion" -ForegroundColor Green
    
    # Ensure Tauri CLI is installed
    cargo install tauri-cli --version "^2.0.0" 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to install/verify Tauri CLI"
    }
    
    return 0
}

# Step 3: Update version information
Invoke-BuildStep -Name "Updating version information" -Command {
    Set-Location -Path $ProjectRoot
    
    # Get version from package.json
    $PackageJsonPath = Join-Path -Path $ProjectRoot -ChildPath "package.json"
    $PackageJson = Get-Content -Path $PackageJsonPath -Raw | ConvertFrom-Json
    $Version = $PackageJson.version
    
    # Update Tauri configuration
    $TauriConfigPath = Join-Path -Path $ProjectRoot -ChildPath "src-tauri\tauri.conf.json"
    $TauriConfig = Get-Content -Path $TauriConfigPath -Raw | ConvertFrom-Json
    
    # Update version
    $TauriConfig.version = $Version
    
    # Write updated config
    $TauriConfig | ConvertTo-Json -Depth 10 | Set-Content -Path $TauriConfigPath
    
    Write-Host "Updated version to $Version in Tauri config" -ForegroundColor Green
    
    return 0
}

# Step 4: Run tests (if not skipped)
if (-not $SkipTests) {
    Invoke-BuildStep -Name "Running tests" -Command {
        Set-Location -Path $ProjectRoot
        
        # Run Vitest tests
        Write-Host "Running Vitest tests..." -ForegroundColor Yellow
        npm test -- --run
        if ($LASTEXITCODE -ne 0) {
            throw "Tests failed"
        }
        
        return 0
    }
}

# Step 5: Build frontend with production optimizations
Invoke-BuildStep -Name "Building frontend with production optimizations" -Command {
    Set-Location -Path $ProjectRoot
    
    # Set production environment
    $env:NODE_ENV = "production"
    
    # Build frontend
    Write-Host "Building frontend with production optimizations..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to build frontend"
    }
    
    return 0
}

# Step 6: Build Tauri application
Invoke-BuildStep -Name "Building Tauri application" -Command {
    Set-Location -Path $ProjectRoot
    
    # Build Tauri for release
    Write-Host "Building Tauri application for $BuildMode..." -ForegroundColor Yellow
    cargo tauri build --target x86_64-pc-windows-msvc --$BuildMode
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to build Tauri application"
    }
    
    return 0
}

# Step 7: Run the Windows installer build script
Invoke-BuildStep -Name "Building Windows installers" -Command {
    # Run the Windows build script
    $BuildScriptParams = @{
        AppVersion = $Version
        BuildMode = $BuildMode
        BuildMSI = $true
        BuildEXE = $true
        SignBuild = $SignBuild
    }
    
    Write-Host "Running Windows installer build script..." -ForegroundColor Yellow
    & $BuildScriptPath @BuildScriptParams
    if ($LASTEXITCODE -ne 0) {
        throw "Windows installer build script failed"
    }
    
    return 0
}

# Step 8: Copy verification scripts to the output directory
Invoke-BuildStep -Name "Preparing verification scripts" -Command {
    $OutputPath = Join-Path -Path $ProjectRoot -ChildPath "dist"
    if (-not (Test-Path -Path $OutputPath)) {
        New-Item -Path $OutputPath -ItemType Directory -Force | Out-Null
    }
    
    $Scripts = @(
        "verify-windows-installation.ps1",
        "verify-uninstall.ps1",
        "smoke-test.ps1"
    )
    
    foreach ($Script in $Scripts) {
        $SourcePath = Join-Path -Path $ProjectRoot -ChildPath "src\__tests__\installation\$Script"
        $DestPath = Join-Path -Path $OutputPath -ChildPath $Script
        
        if (Test-Path -Path $SourcePath) {
            Copy-Item -Path $SourcePath -Destination $DestPath -Force
            Write-Host "Copied $Script to output directory" -ForegroundColor Green
        } else {
            Write-Host "⚠️ WARNING: Script $Script not found at $SourcePath" -ForegroundColor Yellow
        }
    }
    
    return 0
}

# End timing
$EndTime = Get-Date
$Duration = $EndTime - $StartTime

# Summary
Write-Host
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "  $AppDisplayName Production Build Summary" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "Started:  $StartTime" -ForegroundColor Cyan
Write-Host "Finished: $EndTime" -ForegroundColor Cyan
Write-Host "Duration: $($Duration.TotalMinutes.ToString("0.00")) minutes" -ForegroundColor Cyan
Write-Host

if ($ErrorCount -gt 0) {
    Write-Host "❌ Build completed with $ErrorCount errors" -ForegroundColor Red
    Write-Host "   See transcript at $TranscriptPath for details" -ForegroundColor Red
    Stop-Transcript
    exit 1
} else {
    Write-Host "✅ Production build completed successfully!" -ForegroundColor Green
    
    # Show output files
    $OutputFiles = Get-ChildItem -Path $DistPath | Where-Object { -not $_.PSIsContainer }
    if ($OutputFiles.Count -gt 0) {
        Write-Host
        Write-Host "Output files:" -ForegroundColor Yellow
        $OutputFiles | ForEach-Object {
            Write-Host "  - $($_.Name) ($([Math]::Round($_.Length / 1MB, 2)) MB)" -ForegroundColor White
        }
    }
    
    Write-Host
    Write-Host "Transcript saved to $TranscriptPath" -ForegroundColor Cyan
    Stop-Transcript
    exit 0
} 