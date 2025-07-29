echo "🔧 Solucionando dependencias faltantes..."

# Limpiar instalación anterior
echo "🧹 Limpiando caché..."
rm -rf node_modules
rm -rf .next
rm package-lock.json

# Instalar todas las dependencias de Radix UI necesarias
echo "📦 Instalando dependencias de Radix UI..."
npm install @radix-ui/react-collapsible@^1.0.3
npm install @radix-ui/react-avatar@^1.0.4
npm install @radix-ui/react-separator@^1.0.3
npm install @radix-ui/react-scroll-area@^1.0.5
npm install @radix-ui/react-tabs@^1.0.4
npm install @radix-ui/react-dialog@^1.0.5
npm install @radix-ui/react-select@^2.0.0
npm install @radix-ui/react-progress@^1.0.3

# Instalar otras dependencias
echo "📦 Instalando otras dependencias..."
npm install class-variance-authority@^0.7.0
npm install clsx@^2.0.0
npm install tailwind-merge@^2.0.0
npm install lucide-react@^0.294.0
npm install openai@^4.20.1
npm install axios@^1.6.0

echo "✅ Dependencias instaladas correctamente!"
echo "🚀 Iniciando servidor de desarrollo..."
npm run dev
