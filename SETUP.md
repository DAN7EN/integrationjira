# 🚀 Configuración de Jira AI Assistant

Esta guía te ayudará a configurar el proyecto para conectarse con tu instancia de Jira y Cloudflare AI Gateway.

## 📋 Prerrequisitos

- Node.js 18 o superior
- Cuenta de Jira (Cloud o Server)
- Cuenta de Cloudflare (opcional pero recomendado para IA)

## 🔧 Instalación

### 1. Clonar y configurar el proyecto

\`\`\`bash
# Clonar el repositorio
git clone <repository-url>
cd jira-ai-assistant

# Ejecutar script de instalación
npm run setup
\`\`\`

### 2. Configurar variables de entorno

Copia `.env.example` a `.env.local` y configura las siguientes variables:

#### Configuración de Jira (OBLIGATORIO)

\`\`\`env
# URL de tu instancia de Jira
NEXT_PUBLIC_JIRA_BASE_URL=https://tu-empresa.atlassian.net

# Token de API de Jira
JIRA_API_TOKEN=tu_token_aqui

# Tu email de Jira
JIRA_USER_EMAIL=tu-email@empresa.com
\`\`\`

#### Configuración de Cloudflare AI Gateway (RECOMENDADO)

\`\`\`env
# Tu ID de cuenta de Cloudflare (lo encuentras en el panel de Cloudflare)
CLOUDFLARE_ACCOUNT_ID=tu_cloudflare_account_id

# El nombre de tu AI Gateway en Cloudflare (ej: 'my-ai-gateway')
CLOUDFLARE_AI_GATEWAY_NAME=tu_cloudflare_gateway_name

# Tu API Key de Cloudflare (opcional, si tu gateway requiere autenticación)
# CLOUDFLARE_API_KEY=tu_cloudflare_api_key
\`\`\`

## 🔑 Obtener credenciales

### Token de API de Jira

1. Ve a tu perfil de Jira: `https://id.atlassian.com/manage-profile/security/api-tokens`
2. Haz clic en "Create API token"
3. Dale un nombre descriptivo (ej: "Jira AI Assistant")
4. Copia el token generado

### Credenciales de Cloudflare AI Gateway

1.  **ID de Cuenta:** Lo encuentras en el panel de control de Cloudflare, en la página de inicio o en la configuración de tu cuenta.
2.  **Nombre del AI Gateway:** Si ya creaste uno, usa ese nombre. Si no, puedes crear uno en la sección "AI Gateway" de tu panel de Cloudflare.
3.  **API Key de Cloudflare (Opcional):** Si tu AI Gateway requiere autenticación, necesitarás una API Key global o un token de API específico de Cloudflare. Puedes generarlos en tu perfil de Cloudflare, bajo "API Tokens".

## 🧪 Probar la conexión

\`\`\`bash
# Iniciar el servidor de desarrollo
npm run dev

# Visitar http://localhost:3000
\`\`\`

### Verificar conexión con Jira

1. Inicia sesión en la aplicación
2. Busca un issue existente (ej: "PROJ-123")
3. Si se carga correctamente, ¡la conexión funciona!

## 🔧 Configuración avanzada

### Campos personalizados de Jira

Si tu Jira usa campos personalizados para Story Points u otros datos, actualiza `lib/jira-service-real.ts`:

\`\`\`typescript
// Buscar esta línea y cambiar el ID del campo
storyPoints: issue.fields.customfield_10016 || 0,

// Por el ID correcto de tu instancia
storyPoints: issue.fields.customfield_XXXXX || 0,
\`\`\`

### Modo de desarrollo

Para usar datos mock durante desarrollo:

\`\`\`env
DEVELOPMENT_MODE=true
\`\`\`

## 🚨 Solución de problemas

### Error 401 - No autorizado
- Verifica que el token de API sea correcto
- Confirma que el email sea el correcto
- Asegúrate de que el token no haya expirado

### Error 403 - Sin permisos
- Verifica que tengas permisos para ver los issues
- Contacta a tu administrador de Jira

### Error 404 - Issue no encontrado
- Confirma que el issue exista
- Verifica que tengas acceso al proyecto

### Error de Cloudflare AI Gateway
- Verifica que `CLOUDFLARE_ACCOUNT_ID` y `CLOUDFLARE_AI_GATEWAY_NAME` sean correctos.
- Si usas `CLOUDFLARE_API_KEY`, verifica que sea válida y tenga los permisos necesarios.
- Revisa los logs del gateway en Cloudflare para más detalles.

## 📊 Monitoreo

La aplicación incluye logging detallado. Revisa la consola del navegador y del servidor para diagnosticar problemas.

## 🔒 Seguridad

- Nunca commits archivos `.env.local`
- Usa tokens con permisos mínimos necesarios
- Rota las API keys regularmente
- Considera usar variables de entorno del sistema en producción

## 🚀 Despliegue

Para desplegar en producción:

1. Configura las variables de entorno en tu plataforma
2. Ejecuta `npm run build`
3. Inicia con `npm start`

### Plataformas recomendadas:
- Vercel (recomendado para Next.js)
- Netlify
- Railway
- Heroku
