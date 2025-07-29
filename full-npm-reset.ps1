# Este script realiza una limpieza y reinstalación completa con npm en PowerShell.

Write-Host "🚨 Realizando una limpieza y reinstalación completa con npm..."

# 1. Detener cualquier proceso de Next.js que pueda estar corriendo
Write-Host "🛑 Deteniendo procesos de Next.js..."
# Intenta encontrar y detener procesos de Node.js que contengan 'next dev'
Get-Process | Where-Object { $_.ProcessName -like "*node*" -and $_.CommandLine -like "*next dev*" } | Stop-Process -Force -ErrorAction SilentlyContinue
Write-Host "✅ Procesos detenidos (si los había)."

# 2. Limpiar la caché de npm
Write-Host "🧹 Limpiando la caché de npm..."
npm cache clean --force
Write-Host "✅ Caché de npm limpiada."

# 3. Eliminar directorios de módulos y archivos de bloqueo
Write-Host "🧹 Eliminando node_modules, .next y package-lock.json..."
Remove-Item -Path node_modules -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path .next -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path package-lock.json -ErrorAction SilentlyContinue
Write-Host "✅ Archivos de caché y módulos eliminados."

# 4. Reinstalar todas las dependencias con npm
Write-Host "📦 Reinstalando todas las dependencias con npm (esto puede tardar unos minutos)..."
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error: npm install falló. Por favor, revisa los mensajes de error anteriores."
    exit 1
}
Write-Host "✅ Dependencias reinstaladas."

# 5. Verificar la existencia del ejecutable de Next.js
$nextExecutablePath = Join-Path (Get-Location) "node_modules\.bin\next.cmd"
if (Test-Path $nextExecutablePath) {
    Write-Host "✅ Ejecutable de Next.js encontrado en: $nextExecutablePath"
} else {
    Write-Host "❌ Advertencia: El ejecutable de Next.js NO se encontró en: $nextExecutablePath"
    Write-Host "Esto podría indicar un problema con la instalación de npm."
}

# 6. Verificar y recrear archivos esenciales si faltan (solo como precaución)
Write-Host "📁 Verificando estructura de archivos esenciales..."
mkdir -p app
if (-not (Test-Path -Path "app/page.tsx")) {
  Write-Host "⚠️ app/page.tsx no encontrado. Asegúrate de que el contenido de app/page.tsx esté correcto."
}
if (-not (Test-Path -Path "app/layout.tsx")) {
  Write-Host "⚠️ app/layout.tsx no encontrado. Asegúrate de que el contenido de app/layout.tsx esté correcto."
}
if (-not (Test-Path -Path "app/globals.css")) {
  Write-Host "⚠️ app/globals.css no encontrado. Asegúrate de que el contenido de app/globals.css esté correcto."
}
Write-Host "✅ Verificación de archivos completada."

Write-Host ""
Write-Host "🎉 ¡Limpieza y reinstalación completa con npm finalizada!"
Write-Host "🚀 Ahora, por favor, intenta iniciar el servidor de desarrollo:"
Write-Host "npm run dev"
Write-Host ""
Write-Host "Si 'npm run dev' sigue fallando con el error 'next no se reconoce', intenta:"
Write-Host "npx next dev"
Write-Host ""
Write-Host "Después de iniciar, verifica tu navegador en http://localhost:3000"
