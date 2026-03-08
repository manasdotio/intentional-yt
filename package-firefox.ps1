param(
  [string]$OutputPath = $(Join-Path $PSScriptRoot 'intentional-yt-firefox.zip')
)

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$packageItems = @(
  'manifest.json',
  'background',
  'content',
  'icons',
  'styles',
  'ui',
  'utils'
)

$resolvedItems = @()

foreach ($item in $packageItems) {
  $itemPath = Join-Path $PSScriptRoot $item
  if (-not (Test-Path $itemPath)) {
    throw "Missing package item: $item"
  }

  $resolvedItems += $itemPath
}

if (Test-Path $OutputPath) {
  Remove-Item $OutputPath -Force
}

$zipArchive = [System.IO.Compression.ZipFile]::Open($OutputPath, [System.IO.Compression.ZipArchiveMode]::Create)

try {
  foreach ($itemPath in $resolvedItems) {
    $item = Get-Item $itemPath

    if ($item.PSIsContainer) {
      $files = Get-ChildItem -Path $item.FullName -Recurse -File
      foreach ($file in $files) {
        $relativePath = $file.FullName.Substring($PSScriptRoot.Length).TrimStart([char[]]@('\', '/')) -replace '\\', '/'
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
          $zipArchive,
          $file.FullName,
          $relativePath,
          [System.IO.Compression.CompressionLevel]::Optimal
        ) | Out-Null
      }
      continue
    }

    $entryName = $item.Name -replace '\\', '/'
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
      $zipArchive,
      $item.FullName,
      $entryName,
      [System.IO.Compression.CompressionLevel]::Optimal
    ) | Out-Null
  }
}
finally {
  $zipArchive.Dispose()
}

Write-Host "Created Firefox package: $OutputPath"