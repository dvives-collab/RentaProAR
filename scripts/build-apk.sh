#!/usr/bin/env bash
set -e
echo "=== [1/4] Instalando dependencias de RentaPro AR ==="
npm install

echo "=== [2/4] Compilando aplicacion web optimizada ==="
npm run build

echo "=== [3/4] Inicializando y sincronizando Capacitor Android ==="
if [ ! -d "android" ]; then
  npx cap add android
fi
npx cap sync android

echo "=== [4/4] Compilando binario .APK con Gradle ==="
cd android
chmod +x gradlew
./gradlew assembleDebug

echo "============================================================"
echo "APK GENERADO EXITOSAMENTE EN:"
echo "android/app/build/outputs/apk/debug/app-debug.apk"
echo "============================================================"
