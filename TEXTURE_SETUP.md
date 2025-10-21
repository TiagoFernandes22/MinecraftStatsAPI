# Minecraft Item Textures Setup Guide

## Overview
This guide explains how to add Minecraft item textures to your API project so item images are served locally instead of relying on external services.

## Directory Structure
```
MinecraftStatsAPI/
├── textures/
│   └── item/
│       ├── diamond_sword.png
│       ├── iron_pickaxe.png
│       ├── stone.png
│       └── ... (all other item textures)
```

## How to Get Minecraft Textures

### Option 1: Extract from Minecraft JAR (Recommended)

1. **Locate your Minecraft installation:**
   ```
   C:\Users\<YourUsername>\AppData\Roaming\.minecraft\versions\
   ```

2. **Find the version folder** (e.g., `1.20.4`, `1.21.1`, etc.)

3. **Copy the `.jar` file** (e.g., `1.20.4.jar`) to a temporary location

4. **Extract the JAR file** (it's just a ZIP file):
   - Rename `1.20.4.jar` to `1.20.4.zip`
   - Extract using Windows Explorer or 7-Zip
   - Or use PowerShell:
     ```powershell
     Expand-Archive -Path "1.20.4.jar" -DestinationPath "minecraft_extracted"
     ```

5. **Navigate to the textures folder:**
   ```
   minecraft_extracted/assets/minecraft/textures/item/
   ```

6. **Copy all PNG files** from that folder to your project:
   ```powershell
   # PowerShell command to copy all item textures
   Copy-Item "minecraft_extracted\assets\minecraft\textures\item\*.png" -Destination "C:\Users\ASUS\Desktop\MinecraftStatsAPI\textures\item\"
   ```

### Option 2: Download from GitHub

You can download textures from community repositories:

1. Visit: https://github.com/InventivetalentDev/minecraft-assets
2. Navigate to: `assets/minecraft/textures/item/`
3. Download the PNG files you need
4. Place them in `textures/item/` folder

### Option 3: Use Minecraft Resource Pack

1. Download the default Minecraft resource pack or any custom pack
2. Extract it (resource packs are ZIP files)
3. Navigate to `assets/minecraft/textures/item/`
4. Copy PNG files to your `textures/item/` folder

## PowerShell Script to Extract Textures

Save this as `extract-textures.ps1` and run it:

```powershell
# Configuration
$minecraftVersion = "1.20.4"  # Change to your version
$minecraftPath = "$env:APPDATA\.minecraft\versions\$minecraftVersion"
$jarFile = "$minecraftPath\$minecraftVersion.jar"
$tempExtractPath = ".\temp_minecraft_extract"
$targetPath = ".\textures\item"

# Check if JAR exists
if (-not (Test-Path $jarFile)) {
    Write-Error "Minecraft JAR not found at: $jarFile"
    Write-Host "Available versions:"
    Get-ChildItem "$env:APPDATA\.minecraft\versions" -Directory | Select-Object Name
    exit
}

# Create temp directory
New-Item -ItemType Directory -Force -Path $tempExtractPath | Out-Null

# Extract JAR (it's a ZIP file)
Write-Host "Extracting Minecraft JAR..."
Expand-Archive -Path $jarFile -DestinationPath $tempExtractPath -Force

# Copy item textures
$itemTexturesPath = "$tempExtractPath\assets\minecraft\textures\item"
if (Test-Path $itemTexturesPath) {
    Write-Host "Copying item textures..."
    New-Item -ItemType Directory -Force -Path $targetPath | Out-Null
    Copy-Item "$itemTexturesPath\*.png" -Destination $targetPath -Force
    
    $count = (Get-ChildItem $targetPath -Filter "*.png").Count
    Write-Host "Successfully copied $count item textures!"
} else {
    Write-Error "Item textures not found in extracted JAR"
}

# Cleanup
Write-Host "Cleaning up temporary files..."
Remove-Item -Recurse -Force $tempExtractPath

Write-Host "Done! Textures are now in: $targetPath"
```

Run it with:
```powershell
.\extract-textures.ps1
```

## Verify Installation

After copying the textures, verify they're accessible:

1. **Start your server:**
   ```powershell
   npm start
   ```

2. **Test a texture URL in browser:**
   ```
   http://localhost:3000/textures/item/diamond_sword.png
   ```

3. **Test the API:**
   ```powershell
   Invoke-RestMethod http://localhost:3000/api/local/inventory/YOUR-UUID-HERE
   ```

   Each item should now have an `image` field like:
   ```json
   "image": "/textures/item/diamond_sword.png"
   ```

## Frontend Usage

In your Vue/React frontend, use the image URLs like this:

```javascript
// If API is on localhost:3000
const baseUrl = 'http://localhost:3000';

// Display item image
<img :src="`${baseUrl}${item.image}`" :alt="item.name" />

// Or with full URL
<img :src="`http://localhost:3000${item.image}`" :alt="item.name" />
```

## Common Item Names

Here are some common items you'll find:
- `diamond_sword.png`
- `iron_pickaxe.png`
- `golden_apple.png`
- `enchanted_book.png`
- `bow.png`
- `arrow.png`
- `stone.png`
- `cobblestone.png`
- `oak_log.png`
- etc.

## Fallback Image

You can add a placeholder image for missing items:

1. Create `textures/item/missing.png` (a question mark or generic icon)
2. Update the server to use it as fallback

## File Size Notes

- Full item texture set is approximately **2-5 MB** (depends on version)
- Each PNG is typically **16x16 pixels** (~1-5 KB each)
- Total files: **~1000-1500 items** depending on Minecraft version

## Troubleshooting

**Problem:** Images not loading
- Check that `textures/item/` folder exists
- Verify PNG files are directly in `textures/item/` (not in subfolders)
- Check browser console for 404 errors
- Ensure server is running

**Problem:** Some items show as broken images
- The item ID might use a different name in the texture pack
- Check the actual PNG filename in `textures/item/`
- Some items might not have textures (use fallback)

## License Note

Minecraft textures are property of Mojang/Microsoft. This setup is for personal/educational use. For commercial use, review Minecraft's [Commercial Use Guidelines](https://www.minecraft.net/en-us/terms).
