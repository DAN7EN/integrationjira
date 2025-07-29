echo "🎨 Solucionando problema de Tailwind CSS..."

# Instalar tailwindcss-animate
echo "📦 Instalando tailwindcss-animate..."
npm install -D tailwindcss-animate

# Limpiar caché
echo "🧹 Limpiando caché..."
rm -rf .next

echo "✅ Tailwind CSS configurado correctamente!"
echo "🚀 Iniciando servidor..."
npm run dev
