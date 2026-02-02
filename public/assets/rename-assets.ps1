# TAE Asset Renaming Script
# Run this from: C:\dev\theAE\tae-full-devsite\public\assets\

# Rename Labels
Set-Location -Path "labels"
Get-ChildItem -Filter "LABEL_*.svg" | ForEach-Object {
    $num = [int]($_.Name -replace 'LABEL_(\d+)\.svg', '$1')
    Rename-Item $_.Name "tae_label_$num.svg"
}
Get-ChildItem -Filter "LABEL_*.png" | ForEach-Object {
    $num = [int]($_.Name -replace 'LABEL_(\d+)\.png', '$1')
    Rename-Item $_.Name "tae_label_$num.png"
}
Set-Location ..

# Rename Accents
Set-Location -Path "accents"
Get-ChildItem -Filter "ACCENT_*.svg" | ForEach-Object {
    $num = [int]($_.Name -replace 'ACCENT_(\d+)\.svg', '$1')
    Rename-Item $_.Name "tae_accent_$num.svg"
}
Get-ChildItem -Filter "ACCENT_*.png" | ForEach-Object {
    $num = [int]($_.Name -replace 'ACCENT_(\d+)\.png', '$1')
    Rename-Item $_.Name "tae_accent_$num.png"
}
Set-Location ..

# Rename Borders
Set-Location -Path "borders"
Get-ChildItem -Filter "BORDER_*.svg" | ForEach-Object {
    $num = [int]($_.Name -replace 'BORDER_(\d+)\.svg', '$1')
    Rename-Item $_.Name "tae_border_$num.svg"
}
Get-ChildItem -Filter "BORDER_*.png" | ForEach-Object {
    $num = [int]($_.Name -replace 'BORDER_(\d+)\.png', '$1')
    Rename-Item $_.Name "tae_border_$num.png"
}
Set-Location ..

Write-Host "✅ All files renamed!" -ForegroundColor Green
Write-Host ""
Write-Host "New naming convention:"
Write-Host "  - tae_label_1.svg through tae_label_16.svg"
Write-Host "  - tae_accent_1.svg through tae_accent_28.svg"
Write-Host "  - tae_border_1.svg through tae_border_12.svg"
