$ErrorActionPreference = "Stop"

param(
  [string]$BaseUrl = $(if ($env:PRICE_SYNC_TARGET_URL) { $env:PRICE_SYNC_TARGET_URL } else { "http://127.0.0.1:3000" }),
  [string]$CronSecret = $(if ($env:CRON_SECRET) { $env:CRON_SECRET } else { "" })
)

$base = $BaseUrl.TrimEnd("/")
$url = "$base/api/cron/printful-price-sync"
$statusPath = Join-Path $PSScriptRoot "price-sync-last-result.json"

$headers = @{}
if ($CronSecret -ne "") {
  $headers["Authorization"] = "Bearer $CronSecret"
}

function Write-StatusFile {
  param(
    [bool]$Success,
    [string]$Message,
    $Payload = $null
  )
  $status = @{
    ranAt = (Get-Date).ToString("o")
    success = $Success
    message = $Message
    payload = $Payload
  }
  $status | ConvertTo-Json -Depth 10 | Set-Content -Path $statusPath -Encoding UTF8
}

try {
  Write-Host "[price-sync] Calling $url"
  $response = Invoke-RestMethod -Uri $url -Method GET -Headers $headers

  if (-not $response.success) {
    Write-StatusFile -Success $false -Message "Request failed: $($response.error)" -Payload $response
    throw "[price-sync] Request failed: $($response.error)"
  }

  Write-StatusFile -Success $true -Message "Sync completed" -Payload $response
  Write-Host "[price-sync] Success checked=$($response.checked) updated=$($response.updated) failed=$($response.failed)"
}
catch {
  if (-not (Test-Path $statusPath)) {
    Write-StatusFile -Success $false -Message $_.Exception.Message -Payload $null
  }
  throw
}

