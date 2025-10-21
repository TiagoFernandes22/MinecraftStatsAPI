# Minecraft Texture Extractor Script
# This script extracts item textures from your Minecraft installation

# Configuration - CHANGE THIS to match your Minecraft version
$minecraftVersion = "1.20.4"  # Change to your version (e.g., "1.21.1", "1.19.4")

# Paths
$minecraftPath = "$env:APPDATA\.minecraft\versions\$minecraftVersion"
$jarFile = "$minecraftPath\$minecraftVersion.jar"
$tempExtractPath = ".\temp_minecraft_extract"
$targetPath = ".\textures\item"

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Minecraft Texture Extractor" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check if JAR exists
if (-not (Test-Path $jarFile)) {
    Write-Host "ERROR: Minecraft JAR not found at: $jarFile" -ForegroundColor Red
    Write-Host ""
    Write-Host "Available Minecraft versions on your system:" -ForegroundColor Yellow
    $versions = Get-ChildItem "$env:APPDATA\.minecraft\versions" -Directory -ErrorAction SilentlyContinue
    if ($versions) {
        $versions | ForEach-Object { Write-Host "  - $($_.Name)" -ForegroundColor Green }
        Write-Host ""
        Write-Host "Edit this script and change the `$minecraftVersion variable to one of the above." -ForegroundColor Yellow
    } else {
        Write-Host "No Minecraft versions found. Make sure Minecraft is installed." -ForegroundColor Red
    }
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Found Minecraft $minecraftVersion" -ForegroundColor Green
Write-Host "JAR Location: $jarFile" -ForegroundColor Gray
Write-Host ""

# Create temp directory
Write-Host "Creating temporary directory..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path $tempExtractPath | Out-Null

# Extract JAR (it's a ZIP file)
Write-Host "Extracting Minecraft JAR (this may take a minute)..." -ForegroundColor Yellow
try {
    Expand-Archive -Path $jarFile -DestinationPath $tempExtractPath -Force
    Write-Host "Extraction complete!" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to extract JAR file" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Remove-Item -Recurse -Force $tempExtractPath -ErrorAction SilentlyContinue
    Read-Host "Press Enter to exit"
    exit 1
}

# Copy item textures
$itemTexturesPath = "$tempExtractPath\assets\minecraft\textures\item"
Write-Host ""
Write-Host "Looking for item textures..." -ForegroundColor Yellow

if (Test-Path $itemTexturesPath) {
    Write-Host "Found item textures folder!" -ForegroundColor Green
    Write-Host "Copying PNG files to $targetPath..." -ForegroundColor Yellow
    
    # Create target directory
    New-Item -ItemType Directory -Force -Path $targetPath | Out-Null
    
    # Copy all PNG files
    Copy-Item "$itemTexturesPath\*.png" -Destination $targetPath -Force
    
    $count = (Get-ChildItem $targetPath -Filter "*.png").Count
    Write-Host ""
    Write-Host "SUCCESS! Copied $count item textures!" -ForegroundColor Green
    
    # Show some examples
    Write-Host ""
    Write-Host "Sample textures copied:" -ForegroundColor Cyan
    Get-ChildItem $targetPath -Filter "*.png" | Select-Object -First 10 | ForEach-Object {
        Write-Host "  - $($_.Name)" -ForegroundColor Gray
    }
    if ($count -gt 10) {
        Write-Host "  ... and $($count - 10) more" -ForegroundColor Gray
    }
} else {
    Write-Host "ERROR: Item textures not found in extracted JAR" -ForegroundColor Red
    Write-Host "Expected path: $itemTexturesPath" -ForegroundColor Red
}

# Cleanup
Write-Host ""
Write-Host "Cleaning up temporary files..." -ForegroundColor Yellow
Remove-Item -Recurse -Force $tempExtractPath -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Done!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Textures are now in: $targetPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Start your server: npm start" -ForegroundColor White
Write-Host "2. Test texture URL: http://localhost:3000/textures/item/diamond_sword.png" -ForegroundColor White
Write-Host "3. Test API endpoint with inventory data" -ForegroundColor White
Write-Host ""

Read-Host "Press Enter to exit"
