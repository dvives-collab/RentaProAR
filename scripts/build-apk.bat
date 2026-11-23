@echo off
echo === [1/4] Instalando dependencias de RentaPro AR ===
call npm install

echo === [2/4] Compilando aplicacion web optimizada ===
call npm run build

echo === [3/4] Inicializando y sincronizando Capacitor Android ===
if not exist "android" (
  call npx cap add android
)
call npx cap sync android

echo === [4/4] Compilando binario .APK con Gradle ===
cd android
call gradlew.bat assembleDebug

echo ============================================================
echo APK GENERADO EXITOSAMENTE EN:
echo androidppuild\outputspk\debugpp-debug.apk
echo ============================================================
pause
