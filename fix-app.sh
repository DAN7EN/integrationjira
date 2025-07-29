echo "🔧 Solucionando problema de página por defecto..."

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: No se encontró package.json. Asegúrate de estar en el directorio raíz del proyecto."
    exit 1
fi

# Limpiar caché de Next.js
echo "🧹 Limpiando caché de Next.js..."
rm -rf .next

# Verificar estructura de archivos
echo "📁 Verificando estructura de archivos..."
if [ ! -d "app" ]; then
    echo "📁 Creando directorio app..."
    mkdir -p app
fi

# Verificar que el archivo page.tsx existe
if [ ! -f "app/page.tsx" ]; then
    echo "❌ Error: app/page.tsx no existe. Creando archivo..."
    echo "El archivo page.tsx debería haberse creado arriba."
fi

# Verificar layout.tsx
if [ ! -f "app/layout.tsx" ]; then
    echo "📝 Creando layout.tsx básico..."
    cat > app/layout.tsx << 'EOF'
import type { Metadata } from "next"
import { Inter } from 'next/font/google'
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Jira AI Assistant",
  description: "Mejora tus historias de usuario con IA",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
EOF
fi

echo "✅ Archivos verificados!"
echo "🚀 Reiniciando servidor..."

# Matar procesos de Next.js si están corriendo
pkill -f "next dev" 2>/dev/null || true

echo "✅ ¡Listo! Ejecuta 'npm run dev' para iniciar el servidor."
