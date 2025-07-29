echo "🚨 Realizando una limpieza y reinstalación completa..."

# 1. Detener cualquier proceso de Next.js
echo "🛑 Deteniendo procesos de Next.js..."
pkill -f "next dev" 2>/dev/null || true
echo "✅ Procesos detenidos."

# 2. Eliminar directorios de caché y módulos
echo "🧹 Eliminando node_modules, .next y package-lock.json..."
rm -rf node_modules
rm -rf .next
rm -f package-lock.json
echo "✅ Archivos de caché y módulos eliminados."

# 3. Reinstalar todas las dependencias
echo "📦 Reinstalando todas las dependencias (esto puede tardar unos minutos)..."
npm install
echo "✅ Dependencias reinstaladas."

# 4. Verificar y recrear archivos esenciales si faltan
echo "📁 Verificando archivos esenciales..."
mkdir -p app
if [ ! -f "app/page.tsx" ]; then
    echo "⚠️ app/page.tsx no encontrado. Asegúrate de que el contenido de app/page.tsx esté correcto."
fi
if [ ! -f "app/layout.tsx" ]; then
    echo "⚠️ app/layout.tsx no encontrado. Asegúrate de que el contenido de app/layout.tsx esté correcto."
fi
if [ ! -f "app/globals.css" ]; then
    echo "⚠️ app/globals.css no encontrado. Asegúrate de que el contenido de app/globals.css esté correcto."
fi
echo "✅ Verificación de archivos completada."

echo ""
echo "🎉 ¡Limpieza y reinstalación completada!"
echo "🚀 Ahora, por favor, inicia el servidor de desarrollo nuevamente:"
echo "npm run dev"
echo ""
echo "Después de iniciar, verifica tu navegador en http://localhost:3000"
echo "Deberías ver la pantalla de login de Jira AI Assistant."
