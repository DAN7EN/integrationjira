export const config = {
  // Jira Configuration
  jira: {
    baseUrl: process.env.NEXT_PUBLIC_JIRA_BASE_URL,
    apiToken: process.env.NEXT_PUBLIC_JIRA_API_TOKEN,
    userEmail: process.env.NEXT_PUBLIC_JIRA_USER_EMAIL,
    isConfigured: () => !!(config.jira.baseUrl && config.jira.apiToken && config.jira.userEmail),
  },

  // OpenAI Configuration (eliminado)
  // openai: {
  //   apiKey: process.env.OPENAI_API_KEY,
  //   model: process.env.OPENAI_MODEL || "gpt-4",
  //   isConfigured: () => !!config.openai.apiKey,
  // },

  // Cloudflare AI Gateway Configuration
  cloudflare: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
    gatewayName: process.env.CLOUDFLARE_AI_GATEWAY_NAME,
    apiKey: process.env.CLOUDFLARE_API_KEY, // Opcional, si tu gateway lo requiere
    isConfigured: () => !!(config.cloudflare.accountId && config.cloudflare.gatewayName),
  },

  // App Configuration
  app: {
    developmentMode: process.env.DEVELOPMENT_MODE === "true",
    logLevel: process.env.LOG_LEVEL || "info",
  },

  // Validation
  validate() {
    console.log("DEBUG: Validando configuración de Jira...")
    console.log("DEBUG: NEXT_PUBLIC_JIRA_BASE_URL:", process.env.NEXT_PUBLIC_JIRA_BASE_URL)
    console.log(
      "DEBUG: NEXT_PUBLIC_JIRA_API_TOKEN:",
      process.env.NEXT_PUBLIC_JIRA_API_TOKEN ? "****** (token presente)" : "NO PRESENTE",
    )
    console.log("DEBUG: NEXT_PUBLIC_JIRA_USER_EMAIL:", process.env.NEXT_PUBLIC_JIRA_USER_EMAIL)

    console.log("DEBUG: Validando configuración de Cloudflare AI Gateway...")
    console.log("DEBUG: CLOUDFLARE_ACCOUNT_ID:", process.env.CLOUDFLARE_ACCOUNT_ID)
    console.log("DEBUG: CLOUDFLARE_AI_GATEWAY_NAME:", process.env.CLOUDFLARE_AI_GATEWAY_NAME)
    console.log(
      "DEBUG: CLOUDFLARE_API_KEY:",
      process.env.CLOUDFLARE_API_KEY ? "****** (token presente)" : "NO PRESENTE",
    )

    const errors: string[] = []

    if (!this.jira.isConfigured()) {
      errors.push("Jira configuration is incomplete. Check JIRA_* environment variables.")
    }

    // Solo advertir si Cloudflare AI Gateway no está configurado
    if (!this.cloudflare.isConfigured()) {
      console.warn("⚠️ Cloudflare AI Gateway no está configurado. Las sugerencias de IA usarán datos mock.")
    }

    if (errors.length > 0) {
      throw new Error(`Configuration errors:\n${errors.join("\n")}`)
    }

    return true
  },
}
