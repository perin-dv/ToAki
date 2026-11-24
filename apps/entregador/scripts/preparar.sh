#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
flutter create --platforms=android,web --org br.com.toaki --project-name toaki_entregador .
python3 scripts/ajustar_android.py
flutter pub get
echo 'Flutter preparado. Modo preview: flutter run -d chrome --dart-define=TOAKI_DEMO=true'
