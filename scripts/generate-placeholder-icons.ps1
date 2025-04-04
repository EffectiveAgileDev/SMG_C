<#
.SYNOPSIS
    Generates placeholder icon files for Promptly Social.
.DESCRIPTION
    This PowerShell script creates placeholder icon files in various sizes
    for the Promptly Social application. These files will be used by
    Tauri during the build process for Windows installers.
.NOTES
    Author: Promptly Social Development Team
    Version: 1.0
    Date: April 12, 2024
#>

# Configuration
$AppName = "PromptlySocial"
$IconsDir = Join-Path -Path $PSScriptRoot -ChildPath "..\src-tauri\icons"

# Create icons directory if it doesn't exist
if (-not (Test-Path -Path $IconsDir)) {
    New-Item -Path $IconsDir -ItemType Directory -Force | Out-Null
    Write-Host "Created icons directory: $IconsDir" -ForegroundColor Green
} else {
    Write-Host "Icons directory already exists: $IconsDir" -ForegroundColor Yellow
}

# Required icon sizes for Windows
$IconSizes = @(
    @{Width = 16; Height = 16},
    @{Width = 32; Height = 32},
    @{Width = 48; Height = 48},
    @{Width = 64; Height = 64},
    @{Width = 128; Height = 128},
    @{Width = 256; Height = 256}
)

# Function to create placeholder PNG using .NET System.Drawing
function New-PlaceholderPNG {
    param (
        [Parameter(Mandatory=$true)]
        [string]$FilePath,
        
        [Parameter(Mandatory=$true)]
        [int]$Width,
        
        [Parameter(Mandatory=$true)]
        [int]$Height,
        
        [Parameter(Mandatory=$false)]
        [string]$Text = "PS",
        
        [Parameter(Mandatory=$false)]
        [string]$BackgroundColor = "#5F4B8B", # Purple color for Promptly Social
        
        [Parameter(Mandatory=$false)]
        [string]$TextColor = "#FFFFFF" # White
    )
    
    try {
        # Load System.Drawing assembly for creating images
        Add-Type -AssemblyName System.Drawing
        
        # Convert hex color to System.Drawing.Color
        $bgColor = [System.Drawing.ColorTranslator]::FromHtml($BackgroundColor)
        $txtColor = [System.Drawing.ColorTranslator]::FromHtml($TextColor)
        
        # Create bitmap with specified dimensions
        $bitmap = New-Object System.Drawing.Bitmap($Width, $Height)
        $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
        
        # Set background color
        $graphics.Clear($bgColor)
        
        # Calculate font size (roughly 40% of the smallest dimension)
        $fontSize = [Math]::Min($Width, $Height) * 0.4
        
        # Create font and brushes
        $font = New-Object System.Drawing.Font("Arial", $fontSize, [System.Drawing.FontStyle]::Bold)
        $brush = New-Object System.Drawing.SolidBrush($txtColor)
        
        # Calculate text position to center it
        $textSize = $graphics.MeasureString($Text, $font)
        $x = ($Width - $textSize.Width) / 2
        $y = ($Height - $textSize.Height) / 2
        
        # Draw text
        $graphics.DrawString($Text, $font, $brush, $x, $y)
        
        # Save image
        $bitmap.Save($FilePath, [System.Drawing.Imaging.ImageFormat]::Png)
        
        # Clean up
        $graphics.Dispose()
        $bitmap.Dispose()
        
        Write-Host "Created placeholder PNG: $FilePath" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "Error creating PNG: $_" -ForegroundColor Red
        return $false
    }
}

# Function to convert PNG to ICO using System.Drawing
function Convert-PngToIco {
    param (
        [Parameter(Mandatory=$true)]
        [string]$PngFilePath,
        
        [Parameter(Mandatory=$true)]
        [string]$IcoFilePath
    )
    
    try {
        # This approach requires using a command-line tool or DLLs for proper ICO creation
        # For a placeholder, we'll copy the PNG and rename it to .ico
        # In a production environment, you should use a proper icon creation tool
        
        Copy-Item -Path $PngFilePath -Destination $IcoFilePath -Force
        Write-Host "Created placeholder ICO (renamed PNG): $IcoFilePath" -ForegroundColor Yellow
        Write-Host "Note: For production, replace with a proper ICO file" -ForegroundColor Yellow
        
        return $true
    }
    catch {
        Write-Host "Error creating ICO: $_" -ForegroundColor Red
        return $false
    }
}

# Create placeholder PNGs in various sizes
foreach ($size in $IconSizes) {
    $width = $size.Width
    $height = $size.Height
    
    # Standard size
    $pngPath = Join-Path -Path $IconsDir -ChildPath "${width}x${height}.png"
    New-PlaceholderPNG -FilePath $pngPath -Width $width -Height $height -Text "PS"
    
    # Retina/High-DPI version for selected sizes
    if ($width -eq 128) {
        $retinaPath = Join-Path -Path $IconsDir -ChildPath "${width}x${height}@2x.png"
        New-PlaceholderPNG -FilePath $retinaPath -Width ($width * 2) -Height ($height * 2) -Text "PS"
    }
}

# Create placeholder icon.ico (Windows)
$icoPath = Join-Path -Path $IconsDir -ChildPath "icon.ico"
$pngPath = Join-Path -Path $IconsDir -ChildPath "256x256.png"  # Use largest size as source
Convert-PngToIco -PngFilePath $pngPath -IcoFilePath $icoPath

# Create placeholder icon.icns (macOS)
$icnsPath = Join-Path -Path $IconsDir -ChildPath "icon.icns"
$pngPath = Join-Path -Path $IconsDir -ChildPath "256x256.png"  # Use largest size as source
Copy-Item -Path $pngPath -Destination $icnsPath -Force
Write-Host "Created placeholder ICNS (renamed PNG): $icnsPath" -ForegroundColor Yellow
Write-Host "Note: For production, replace with a proper ICNS file" -ForegroundColor Yellow

# Summary
Write-Host "`nIcon Generation Summary:" -ForegroundColor Cyan
Write-Host "------------------------" -ForegroundColor Cyan
Write-Host "Created placeholder icons in $IconsDir" -ForegroundColor Cyan
Write-Host "These icons should be replaced with proper design assets before production release." -ForegroundColor Yellow
Write-Host "Required Tauri icon files:" -ForegroundColor Cyan
Write-Host "- 32x32.png" -ForegroundColor Cyan
Write-Host "- 128x128.png" -ForegroundColor Cyan
Write-Host "- 128x128@2x.png" -ForegroundColor Cyan
Write-Host "- icon.icns (macOS)" -ForegroundColor Cyan
Write-Host "- icon.ico (Windows)" -ForegroundColor Cyan
Write-Host "`nNext steps:" -ForegroundColor Green
Write-Host "1. Replace placeholder icons with proper design assets" -ForegroundColor Green
Write-Host "2. Verify icon paths in src-tauri/tauri.conf.json" -ForegroundColor Green
Write-Host "3. Run the Windows build process" -ForegroundColor Green 