from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]
manifest = root / 'android/app/src/main/AndroidManifest.xml'
if not manifest.exists():
    raise SystemExit('Primeiro execute flutter create --platforms android,web')
original = manifest.read_text(encoding='utf-8')
permissions = (
    'android.permission.INTERNET',
    'android.permission.ACCESS_FINE_LOCATION',
    'android.permission.ACCESS_COARSE_LOCATION',
    'android.permission.FOREGROUND_SERVICE',
    'android.permission.FOREGROUND_SERVICE_LOCATION',
    'android.permission.POST_NOTIFICATIONS',
    'android.permission.CAMERA',
)
# Somente permissões do rastreamento opt-in (Android FGS).
for item in permissions:
    if f'android:name="{item}"' not in original:
        original = original.replace('<application', f'<uses-permission android:name="{item}" />\n    <application', 1)
# Serviço de localização acionado apenas após usuário tocar Iniciar rota/Ativar GPS.
# O plugin geolocator_android insere seu Service pelo manifest merger.
manifest.write_text(original, encoding='utf-8')

gradle = root / 'android/app/build.gradle.kts'
if gradle.exists():
    data = gradle.read_text(encoding='utf-8')
    if 'minSdk = flutter.minSdkVersion' in data:
        data = data.replace('minSdk = flutter.minSdkVersion', 'minSdk = 23')
    gradle.write_text(data, encoding='utf-8')

main = root / 'android/app/src/main/kotlin'
print('Permissões configuradas:', manifest)
print('Android ID: br.com.toaki.toaki_entregador. Registre este ID no Firebase antes de gerar o APK real.')
