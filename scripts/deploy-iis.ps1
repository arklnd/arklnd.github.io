#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Builds the Astro site with dev flags and deploys as a virtual app under Default Web Site.
.DESCRIPTION
    Sets PUBLIC_LOCAL_DEV=true and ASTRO_BASE=/arijitk so the build output works
    as a sub-application at http://localhost/arijitk. Does not create a new IIS site;
    adds a virtual application under Default Web Site instead.
#>

$ErrorActionPreference = "Stop"

$appName = "arijitk"
$parentSite = "Default Web Site"
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$distPath = Join-Path $projectRoot "dist"

# ── Build with dev flags + base path ──
Write-Host "Building with PUBLIC_LOCAL_DEV=true, ASTRO_BASE=/$appName/ ..." -ForegroundColor Yellow
$env:PUBLIC_LOCAL_DEV = "true"
$env:ASTRO_BASE = "/$appName/"
Push-Location $projectRoot
try {
    bun run build
} finally {
    Pop-Location
    Remove-Item Env:\PUBLIC_LOCAL_DEV -ErrorAction SilentlyContinue
    Remove-Item Env:\ASTRO_BASE -ErrorAction SilentlyContinue
}

if (-not (Test-Path $distPath)) {
    Write-Error "Build failed - dist/ not found."
    return
}

# ── Deploy as virtual app under Default Web Site ──
Import-Module WebAdministration -ErrorAction Stop

$appPath = "IIS:\Sites\$parentSite\$appName"

if (Test-Path $appPath) {
    Set-ItemProperty $appPath -Name physicalPath -Value $distPath
    Write-Host "Updated virtual app '/$appName' -> $distPath" -ForegroundColor Green
} else {
    New-WebApplication -Site $parentSite -Name $appName -PhysicalPath $distPath -ApplicationPool "DefaultAppPool" | Out-Null
    Write-Host "Created virtual app '/$appName' under '$parentSite' -> $distPath" -ForegroundColor Green
}

Write-Host ""
Write-Host "Site available at: http://localhost/$appName" -ForegroundColor Cyan
