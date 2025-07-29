# Script de instalación para Jira AI Assistant

echo "🚀 Instalando Jira AI Assistant..."

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor instala Node.js 18+ desde https://nodejs.org/"
    exit 1
fi

# Verificar versión de Node.js
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Se requiere Node.js 18 o superior. Versión actual: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detectado"

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

# Crear archivo .env.local si no existe
if [ ! -f .env.local ]; then
    echo "📝 Creando archivo de configuración..."
    cp .env.example .env.local
    echo "⚠️  IMPORTANTE: Configura las variables de entorno en .env.local"
fi

echo "✅ Instalación completada!"
echo ""
echo "📋 Próximos pasos:"
echo "1. Configura las variables de entorno en .env.local"
echo "2. Ejecuta 'npm run dev' para iniciar el servidor de desarrollo"
echo "3. Visita http://localhost:3000"
echo ""
echo "📖 Consulta README.md para instrucciones detalladas de configuración"
