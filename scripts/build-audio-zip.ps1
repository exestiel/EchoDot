param(
  [string]$AudioDir = "public/audio",
  [string]$OutputZip = "public/audio/Stockdale Christian School Band Compilation 1997-2011.zip",
  [int]$WarnIfZipExceedsMB = 95
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $AudioDir)) {
  Write-Host "Audio directory not found: $AudioDir"
  exit 0
}

$mp3Files = Get-ChildItem -LiteralPath $AudioDir -File -Filter "*.mp3" | Sort-Object Name
if ($mp3Files.Count -eq 0) {
  Write-Host "No MP3 files found in $AudioDir; skipping zip build."
  exit 0
}

if (Test-Path -LiteralPath $OutputZip) {
  Remove-Item -LiteralPath $OutputZip -Force
}

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$zipStream = [System.IO.File]::Open($OutputZip, [System.IO.FileMode]::CreateNew)
try {
  $zip = [System.IO.Compression.ZipArchive]::new(
    $zipStream,
    [System.IO.Compression.ZipArchiveMode]::Create,
    $false
  )

  try {
    foreach ($file in $mp3Files) {
      $entry = $zip.CreateEntry($file.Name, [System.IO.Compression.CompressionLevel]::Optimal)
      $entryStream = $entry.Open()
      try {
        # Read with shared access so open files do not fail the build.
        $inputStream = [System.IO.File]::Open(
          $file.FullName,
          [System.IO.FileMode]::Open,
          [System.IO.FileAccess]::Read,
          [System.IO.FileShare]::ReadWrite
        )
        try {
          $inputStream.CopyTo($entryStream)
        } finally {
          $inputStream.Dispose()
        }
      } finally {
        $entryStream.Dispose()
      }
    }
  } finally {
    $zip.Dispose()
  }
} finally {
  $zipStream.Dispose()
}

Write-Host "Built audio zip: $OutputZip"

$zipSizeMB = [math]::Round(((Get-Item -LiteralPath $OutputZip).Length / 1MB), 2)
if ($zipSizeMB -gt $WarnIfZipExceedsMB) {
  Write-Warning "Audio zip is ${zipSizeMB} MB (threshold: ${WarnIfZipExceedsMB} MB). Consider external hosting/CDN if this keeps growing."
}
