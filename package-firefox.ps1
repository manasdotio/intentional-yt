param([string]$OutputPath = (Join-Path $PSScriptRoot 'intentional-yt-firefox.zip'))
& node (Join-Path $PSScriptRoot 'scripts/package.cjs') --firefox-output $OutputPath
if ($LASTEXITCODE -ne 0) { throw 'Extension packaging failed' }
