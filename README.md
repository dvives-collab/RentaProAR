# RentaPro AR — Sistema Multiplataforma de Alquileres (Google Drive + Google Sheets + Android APK)

## 1. Configuración del Backend en Google Sheets y Google Drive (5 minutos)
1. Ingresá a [Google Sheets](https://sheets.new) y creá una planilla nueva llamada `DB_RentaPro_AR`.
2. En el menú superior, abrí **Extensiones > Apps Script**.
3. Borrá el código por defecto y pegá el contenido completo de `backend/Code.gs`.
4. Guardá el proyecto y hacé clic en **Implementar > Nueva implementación**:
   - Tipo: **Aplicación web**.
   - Ejecutar como: **Yo (tu cuenta de Google)**.
   - Quién tiene acceso: **Cualquier usuario** (necesario para que la APK Android y la Web puedan conectarse sin bloqueo CORS).
5. Copiá la URL generada (`https://script.google.com/macros/s/.../exec`), pegala en la pestaña **Google Drive / APK** dentro de la app y presioná **Inicializar Hojas y Carpeta Drive**.

## 2. Generación del archivo `.APK` para Android
Tenés dos alternativas:

### Opción A: Compilación Automática en la Nube (Sin instalar Android Studio)
1. Subí esta carpeta a un repositorio privado o público en GitHub.
2. Abrí la pestaña **Actions** en GitHub y ejecutá **Compilar RentaPro AR APK**.
3. Descargá el archivo `RentaPro-AR-Android-APK` (`app-debug.apk`) listo para instalar en cualquier celular o tablet Android.

### Opción B: Compilación Local en tu PC
- Requisitos: Node.js 18+, JDK 17 y Android SDK.
- En Windows ejecutá `scripts\build-apk.bat`.
- En Linux/Mac ejecutá `bash scripts/build-apk.sh`.
