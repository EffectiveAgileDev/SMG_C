<#
.SYNOPSIS
    Build script for SMG_C Windows installation packages.
.DESCRIPTION
    This PowerShell script builds Windows MSI and EXE installer packages
    for the SMG_C application using Tauri's build system.
.NOTES
    Author: SMG_C Development Team
    Version: 1.0
    Date: April 12, 2024
#>

#Requires -Version 5.1

# Configuration
$AppName = "smg_c"
$AppVersion = "0.1.0"
$BuildMode = "release" # Options: debug, release
$BuildMSI = $true
$BuildEXE = $true
$SignBuild = $false # Set to true when code signing certificate is available

# Paths
$ProjectRoot = Resolve-Path (Join-Path -Path $PSScriptRoot -ChildPath "..\..\..") # Root of the project
$DistPath = Join-Path -Path $ProjectRoot -ChildPath "src-tauri\target\$BuildMode\bundle\msi"
$OutputPath = Join-Path -Path $ProjectRoot -ChildPath "dist"

# Make sure output directory exists
if (-not (Test-Path -Path $OutputPath)) {
    New-Item -Path $OutputPath -ItemType Directory -Force | Out-Null
}

# Error tracking
$ErrorCount = 0

# Display header
Clear-Host
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "  SMG_C Windows Installer Build Script" -ForegroundColor Cyan
Write-Host "  Version: $AppVersion" -ForegroundColor Cyan
Write-Host "  Build Mode: $BuildMode" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host

# Function to run a command and handle errors
function Invoke-BuildStep {
    param (
        [Parameter(Mandatory=$true)]
        [string]$Name,
        
        [Parameter(Mandatory=$true)]
        [scriptblock]$Command
    )
    
    Write-Host "Step: $Name" -ForegroundColor Yellow
    Write-Host "-------------------------------------------" -ForegroundColor Yellow
    
    try {
        & $Command
        $exitCode = $LASTEXITCODE
        
        if ($exitCode -ne 0) {
            Write-Host "❌ ERROR: $Name failed with exit code $exitCode" -ForegroundColor Red
            $script:ErrorCount++
            return $false
        } else {
            Write-Host "✅ SUCCESS: $Name completed successfully" -ForegroundColor Green
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

# Step 1: Verify and install prerequisites
Invoke-BuildStep -Name "Checking prerequisites" -Command {
    # Check for Rust and Cargo
    $rustVersion = rustc --version
    if ($LASTEXITCODE -ne 0) {
        throw "Rust is not installed or not in PATH. Please install Rust: https://www.rust-lang.org/tools/install"
    }
    Write-Host "Found Rust: $rustVersion" -ForegroundColor Green
    
    # Check for Node.js
    $nodeVersion = node --version
    if ($LASTEXITCODE -ne 0) {
        throw "Node.js is not installed or not in PATH. Please install Node.js: https://nodejs.org/"
    }
    Write-Host "Found Node.js: $nodeVersion" -ForegroundColor Green
    
    # Check for npm
    $npmVersion = npm --version
    if ($LASTEXITCODE -ne 0) {
        throw "npm is not installed or not in PATH. It should be included with Node.js."
    }
    Write-Host "Found npm: $npmVersion" -ForegroundColor Green
    
    # Check for Tauri CLI
    $tauriInstalled = cargo install-update -l | Select-String -Pattern "tauri-cli"
    if (-not $tauriInstalled) {
        Write-Host "Installing Tauri CLI..." -ForegroundColor Yellow
        cargo install tauri-cli
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to install Tauri CLI"
        }
    }
    Write-Host "Tauri CLI is available" -ForegroundColor Green
    
    return $true
}

# Step 2: Clean previous builds
Invoke-BuildStep -Name "Cleaning previous builds" -Command {
    # Remove previous build artifacts
    if (Test-Path -Path $DistPath) {
        Remove-Item -Path $DistPath -Recurse -Force
    }
    
    # Clean Cargo build
    Set-Location -Path $ProjectRoot
    cargo clean --release
    
    # Clean npm build
    npm run clean
    
    return $true
}

# Step 3: Update version information
Invoke-BuildStep -Name "Updating version information" -Command {
    $tauriConfigPath = Join-Path -Path $ProjectRoot -ChildPath "src-tauri\tauri.conf.json"
    $tauriConfig = Get-Content -Path $tauriConfigPath -Raw | ConvertFrom-Json
    
    # Update version in Tauri config
    $tauriConfig.version = $AppVersion
    
    # Write updated config
    $tauriConfig | ConvertTo-Json -Depth 10 | Set-Content -Path $tauriConfigPath
    
    Write-Host "Updated version to $AppVersion in Tauri config" -ForegroundColor Green
    
    return $true
}

# Step 4: Build front-end
Invoke-BuildStep -Name "Building front-end" -Command {
    Set-Location -Path $ProjectRoot
    npm ci
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to install npm dependencies"
    }
    
    npm run build
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to build front-end"
    }
    
    return $true
}

# Step 5: Build Tauri application
Invoke-BuildStep -Name "Building Tauri application" -Command {
    Set-Location -Path $ProjectRoot
    
    # Build command
    $buildParams = "--$BuildMode"
    
    # Build for Windows
    cargo tauri build $buildParams
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to build Tauri application"
    }
    
    return $true
}

# Step 6: Sign MSI installer (if enabled)
if ($SignBuild -and $BuildMSI) {
    Invoke-BuildStep -Name "Signing MSI installer" -Command {
        # This step requires a code signing certificate
        # In production, you would add the code signing steps here
        
        Write-Host "⚠️ WARNING: Code signing is enabled but not implemented in this script." -ForegroundColor Yellow
        Write-Host "            Add your code signing logic here when certificate is available." -ForegroundColor Yellow
        
        return $true
    }
}

# Step 7: Copy installers to output directory
Invoke-BuildStep -Name "Copying installers to output directory" -Command {
    # Create output directory if it doesn't exist
    if (-not (Test-Path -Path $OutputPath)) {
        New-Item -Path $OutputPath -ItemType Directory -Force | Out-Null
    }
    
    # Find the MSI installer
    $msiFile = Get-ChildItem -Path $DistPath -Filter "*.msi" -Recurse | Select-Object -First 1
    
    if ($null -eq $msiFile) {
        throw "MSI installer not found in $DistPath"
    }
    
    # Copy MSI installer
    $msiDestPath = Join-Path -Path $OutputPath -ChildPath "$AppName-$AppVersion-setup.msi"
    Copy-Item -Path $msiFile.FullName -Destination $msiDestPath -Force
    
    Write-Host "Copied MSI installer to $msiDestPath" -ForegroundColor Green
    
    return $true
}

# Step 8: Generate installation verification script
Invoke-BuildStep -Name "Generating verification scripts" -Command {
    $verifyScriptPath = Join-Path -Path $OutputPath -ChildPath "verify-installation.ps1"
    $uninstallScriptPath = Join-Path -Path $OutputPath -ChildPath "verify-uninstall.ps1"
    $smokeTestPath = Join-Path -Path $OutputPath -ChildPath "smoke-test.ps1"
    
    # Copy verification scripts
    Copy-Item -Path (Join-Path -Path $PSScriptRoot -ChildPath "verify-windows-installation.ps1") -Destination $verifyScriptPath -Force
    Copy-Item -Path (Join-Path -Path $PSScriptRoot -ChildPath "verify-uninstall.ps1") -Destination $uninstallScriptPath -Force
    Copy-Item -Path (Join-Path -Path $PSScriptRoot -ChildPath "smoke-test.ps1") -Destination $smokeTestPath -Force
    
    Write-Host "Copied verification scripts to output directory" -ForegroundColor Green
    
    return $true
}

# Summary
Write-Host
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "  Build Summary" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan

if ($ErrorCount -gt 0) {
    Write-Host "❌ Build completed with $ErrorCount errors" -ForegroundColor Red
    exit 1
} else {
    Write-Host "✅ Build completed successfully" -ForegroundColor Green
    
    # Show output files
    Write-Host
    Write-Host "Output files:" -ForegroundColor Yellow
    Get-ChildItem -Path $OutputPath | ForEach-Object {
        Write-Host "  - $($_.Name)" -ForegroundColor White
    }
    
    exit 0
} 