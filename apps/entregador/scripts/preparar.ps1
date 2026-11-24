$ErrorActionPreference = "Stop"
$project = Split-Path -Parent $PSScriptRoot
Push-Location $project
try {
    flutter create --platforms=android,web --org br.com.toaki --project-name toaki_entregador .
    if ($LASTEXITCODE -ne 0) { throw "Falha na configuração Flutter." }
    python scripts/ajustar_android.py
    if ($LASTEXITCODE -ne 0) { throw "Falha ao preparar o Android." }
    Remove-Item -Path "test/widget_test.dart" -ErrorAction SilentlyContinue
    flutter pub get
    if ($LASTEXITCODE -ne 0) { throw "Falha ao instalar dependências Dart." }
    Write-Host "toAki Flutter pronto. Execute: flutter run -d chrome --dart-define=TOAKI_DEMO=true"
} finally {
    Pop-Location
}
