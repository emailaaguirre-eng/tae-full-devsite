$ErrorActionPreference = "Stop"

$statusPath = Join-Path $PSScriptRoot "price-sync-last-result.json"
$runScript = Join-Path $PSScriptRoot "run-price-sync.ps1"

if (-not (Test-Path $statusPath)) {
  Write-Host "[price-sync:retry] No status file found. Skipping retry."
  exit 0
}

$raw = Get-Content -Path $statusPath -Raw
if (-not $raw) {
  Write-Host "[price-sync:retry] Empty status file. Skipping retry."
  exit 0
}

$status = $raw | ConvertFrom-Json
if ($status.success -eq $true) {
  Write-Host "[price-sync:retry] Last sync succeeded at $($status.ranAt). No retry needed."
  exit 0
}

Write-Host "[price-sync:retry] Last sync failed at $($status.ranAt). Retrying now."
& powershell -NoProfile -ExecutionPolicy Bypass -File $runScript

