import { JiraServiceReal } from "./jira-service-real"
import { config } from "./config"
import type { User, JiraIssue } from "@/types" // Importar User

// CAMBIO AQUÍ: Ahora devuelve los datos del usuario o null
export async function testJiraConnection(): Promise<User | null> {
  console.log("🔍 Probando conexión con Jira a través del proxy...")

  try {
    // Verificar configuración localmente
    console.log("📋 Verificando configuración local...")
    console.log("- Base URL:", config.jira.baseUrl)
    console.log("- Email:", config.jira.userEmail)
    console.log("- Token configurado:", !!config.jira.apiToken)

    if (!config.jira.isConfigured()) {
      throw new Error("❌ Configuración de Jira incompleta. Revisa tus variables de entorno.")
    }

    // Realizar llamada a /api/jira/proxy/myself
    console.log("🔗 Realizando llamada a /api/jira/proxy/myself...")
    const response = await fetch("/api/jira/proxy/myself")
    const data = await response.json()

    if (response.ok && data.success) {
      console.log("✅ ¡Conexión exitosa con Jira a través del proxy!")
      return data.user as User // Devuelve los datos del usuario
    } else {
      console.log("❌ Error de conexión con Jira a través del proxy:", data.error || data.message)
      throw new Error(data.error || data.message || "Error desconocido al probar conexión.")
    }
  } catch (error: any) {
    console.error("❌ Error probando conexión:", error.message)
    return null // Devuelve null en caso de error
  }
}

export async function testJiraIssue(issueKey: string): Promise<JiraIssue> {
  console.log(`🔍 Probando obtener issue: ${issueKey}`)

  try {
    const issue = await JiraServiceReal.getIssue(issueKey)
    console.log("✅ Issue obtenido exitosamente:")
    console.log("- Key:", issue.key)
    console.log("- Summary:", issue.summary)
    console.log("- Status:", issue.status)
    console.log("- Assignee:", issue.assignee)

    return issue
  } catch (error: any) {
    console.error("❌ Error obteniendo issue:", error.message)
    throw error
  }
}
