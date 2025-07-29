import axios, { type AxiosInstance } from "axios"
import type { JiraIssue, GherkinScenario, User } from "@/types" // Importar User

export class JiraServiceReal {
  private static instance: AxiosInstance
  private static baseUrl = process.env.NEXT_PUBLIC_JIRA_BASE_URL
  private static apiToken = process.env.NEXT_PUBLIC_JIRA_API_TOKEN
  private static userEmail = process.env.NEXT_PUBLIC_JIRA_USER_EMAIL

  static {
    // Configurar axios con autenticación básica
    this.instance = axios.create({
      baseURL: `${this.baseUrl}/rest/api/3`,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      auth: {
        username: this.userEmail || "",
        password: this.apiToken || "",
      },
      timeout: 10000, // 10 segundos
    })

    // Interceptor para logging
    this.instance.interceptors.request.use(
      (config) => {
        console.log(`🔄 Jira API Request: ${config.method?.toUpperCase()} ${config.url}`)
        return config
      },
      (error) => {
        console.error("❌ Jira API Request Error:", error)
        return Promise.reject(error)
      },
    )

    this.instance.interceptors.response.use(
      (response) => {
        console.log(`✅ Jira API Response: ${response.status} ${response.config.url}`)
        return response
      },
      (error) => {
        console.error("❌ Jira API Response Error:", error.response?.status, error.response?.data)
        return Promise.reject(error)
      },
    )
  }

  // CAMBIO AQUÍ: Ahora devuelve los datos del usuario o null
  static async testConnection(): Promise<User | null> {
    try {
      const response = await this.instance.get("/myself")
      console.log("✅ Conexión con Jira exitosa:", response.data.displayName)
      return {
        id: response.data.accountId,
        name: response.data.displayName,
        email: response.data.emailAddress,
        avatar: response.data.avatarUrls["32x32"],
        jiraInstance: new URL(this.baseUrl || "").hostname,
      }
    } catch (error) {
      console.error("❌ Error conectando con Jira:", error)
      return null
    }
  }

  static async getIssue(issueKey: string): Promise<JiraIssue> {
    try {
      const response = await this.instance.get(`/issue/${issueKey}`, {
        params: {
          expand: "names,schema,operations,editmeta,changelog,renderedFields",
        },
      })

      const issue = response.data
      // Extraer la descripción como texto plano de forma robusta
      const plainTextDescription = this.extractTextFromJiraDescription(issue.fields.description)

      // Mapear respuesta de Jira a nuestro formato
      return {
        key: issue.key,
        summary: issue.fields.summary,
        description: plainTextDescription, // Usar la descripción en texto plano
        issueType: issue.fields.issuetype.name,
        status: issue.fields.status.name,
        priority: issue.fields.priority?.name || "Medium",
        assignee: issue.fields.assignee?.displayName || "Sin asignar",
        reporter: issue.fields.reporter?.displayName || "Desconocido",
        created: new Date(issue.fields.created).toISOString().split("T")[0],
        updated: new Date(issue.fields.updated).toISOString().split("T")[0],
        storyPoints: issue.fields.customfield_10016 || 0, // Story Points (puede variar)
        labels: issue.fields.labels || [],
        components: issue.fields.components?.map((c: any) => c.name) || [],
        userStory: this.extractUserStory(plainTextDescription), // Pasar la descripción en texto plano
        acceptanceCriteria: this.extractAcceptanceCriteria(plainTextDescription), // Pasar la descripción en texto plano
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error(`Issue ${issueKey} no encontrado`)
      } else if (error.response?.status === 401) {
        throw new Error("No autorizado. Verifica tus credenciales de Jira")
      } else if (error.response?.status === 403) {
        throw new Error("Sin permisos para acceder a este issue")
      }
      throw new Error(`Error obteniendo issue: ${error.message}`)
    }
  }

  static async updateIssueWithSuggestions(
    issueKey: string,
    updatedIssue: Partial<JiraIssue>,
    appliedSuggestions: string[],
  ): Promise<JiraIssue> {
    try {
      // Formatear descripción con Gherkin
      const formattedDescription = this.formatDescriptionWithGherkin(
        updatedIssue.description || "",
        updatedIssue.acceptanceCriteria || [],
      )

      // Actualizar el issue
      await this.instance.put(`/issue/${issueKey}`, {
        fields: {
          description: {
            type: "doc",
            version: 1,
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: formattedDescription,
                  },
                ],
              },
            ],
          },
        },
      })

      // Agregar comentario con las sugerencias aplicadas
      if (appliedSuggestions.length > 0) {
        await this.addComment(
          issueKey,
          `🤖 Sugerencias de IA aplicadas:\n${appliedSuggestions.map((s) => `• ${s}`).join("\n")}\n\nGenerado por Jira AI Assistant`,
        )
      }

      // Retornar el issue actualizado
      return await this.getIssue(issueKey)
    } catch (error: any) {
      console.error("Error actualizando issue:", error)
      throw new Error(`Error actualizando issue: ${error.message}`)
    }
  }

  static async addComment(issueKey: string, comment: string): Promise<void> {
    try {
      await this.instance.post(`/issue/${issueKey}/comment`, {
        body: {
          type: "doc",
          version: 1,
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: comment,
                },
              ],
            },
          ],
        },
      })
    } catch (error: any) {
      console.error("Error agregando comentario:", error)
      throw new Error(`Error agregando comentario: ${error.message}`)
    }
  }

  static async searchIssues(jql: string): Promise<JiraIssue[]> {
    try {
      const response = await this.instance.post("/search", {
        jql,
        maxResults: 50,
        fields: ["summary", "status", "assignee", "issuetype", "priority", "created", "updated"],
      })

      return response.data.issues.map((issue: any) => ({
        key: issue.key,
        summary: issue.fields.summary,
        description: "",
        issueType: issue.fields.issuetype.name,
        status: issue.fields.status.name,
        priority: issue.fields.priority?.name || "Medium",
        assignee: issue.fields.assignee?.displayName || "Sin asignar",
        reporter: "",
        created: new Date(issue.fields.created).toISOString().split("T")[0],
        updated: new Date(issue.fields.updated).toISOString().split("T")[0],
        storyPoints: 0,
        labels: [],
        components: [],
        acceptanceCriteria: [],
      }))
    } catch (error: any) {
      throw new Error(`Error buscando issues: ${error.message}`)
    }
  }

  // Nuevo método auxiliar para extraer texto de la descripción de Jira
  private static extractTextFromJiraDescription(description: any): string {
    if (typeof description === "string") {
      return description
    }

    if (
      description &&
      typeof description === "object" &&
      description.type === "doc" &&
      Array.isArray(description.content)
    ) {
      let text = ""
      for (const node of description.content) {
        if (node.type === "paragraph" && Array.isArray(node.content)) {
          for (const paragraphContent of node.content) {
            if (paragraphContent.type === "text" && typeof paragraphContent.text === "string") {
              text += paragraphContent.text
            }
          }
          text += "\n" // Añadir un salto de línea entre párrafos
        }
        // Puedes añadir más lógica aquí para otros tipos de nodos (listas, tablas, etc.)
      }
      return text.trim()
    }

    return "" // Si no es string ni un objeto de documento válido, devuelve cadena vacía
  }

  // Métodos auxiliares existentes
  private static extractUserStory(description: string): string {
    // Buscar patrones como "Como... quiero... para..."
    const userStoryPattern = /Como\s+.*?\s+quiero\s+.*?\s+para\s+.*?\./gi
    const match = description?.match(userStoryPattern)
    return match ? match[0] : ""
  }

  private static extractAcceptanceCriteria(description: string): GherkinScenario[] {
    // Extraer escenarios Gherkin existentes
    const scenarios: GherkinScenario[] = []

    if (!description) return scenarios

    const scenarioPattern = /Escenario:\s*(.*?)\n((?:\s*(?:Dado|Cuando|Entonces|Y|Pero)\s+.*?\n)*)/gi // Añadido 'Pero'
    let match

    while ((match = scenarioPattern.exec(description)) !== null) {
      const title = match[1].trim()
      const steps = match[2].trim()

      const scenario: GherkinScenario = {
        id: `scenario-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title,
        given: [],
        when: [],
        then: [],
        and: [], // Asegurarse de que 'and' y 'but' existan
        but: [],
        tags: [],
      }

      // Parsear pasos
      const stepLines = steps.split("\n").filter((line) => line.trim())
      for (const line of stepLines) {
        const trimmed = line.trim()
        if (trimmed.startsWith("Dado")) {
          scenario.given.push(trimmed.replace(/^Dado\s+(que\s+)?/, ""))
        } else if (trimmed.startsWith("Cuando")) {
          scenario.when.push(trimmed.replace(/^Cuando\s+/, ""))
        } else if (trimmed.startsWith("Entonces")) {
          scenario.then.push(trimmed.replace(/^Entonces\s+/, ""))
        } else if (trimmed.startsWith("Y")) {
          // Determinar a qué sección 'Y' pertenece
          if (scenario.then.length > 0) {
            scenario.then.push(trimmed.replace(/^Y\s+/, ""))
          } else if (scenario.when.length > 0) {
            scenario.when.push(trimmed.replace(/^Y\s+/, ""))
          } else if (scenario.given.length > 0) {
            scenario.given.push(trimmed.replace(/^Y\s+/, ""))
          } else {
            // Si no hay Given/When/Then previos, añadir a 'and' general o Given por defecto
            scenario.and?.push(trimmed.replace(/^Y\s+/, ""))
          }
        } else if (trimmed.startsWith("Pero")) {
          scenario.but?.push(trimmed.replace(/^Pero\s+/, ""))
        }
      }

      scenarios.push(scenario)
    }

    return scenarios
  }

  private static formatDescriptionWithGherkin(description: string, scenarios: GherkinScenario[]): string {
    let formatted = description

    if (scenarios.length > 0) {
      formatted += "\n\n## Criterios de Aceptación\n\n"

      scenarios.forEach((scenario) => {
        formatted += `**Escenario:** ${scenario.title}\n`

        scenario.given.forEach((step, index) => {
          const prefix = index === 0 ? "Dado que" : "Y"
          formatted += `${prefix} ${step}\n`
        })

        scenario.when.forEach((step, index) => {
          const prefix = index === 0 ? "Cuando" : "Y"
          formatted += `${prefix} ${step}\n`
        })

        scenario.then.forEach((step, index) => {
          const prefix = index === 0 ? "Entonces" : "Y"
          formatted += `${prefix} ${step}\n`
        })

        scenario.and?.forEach((step) => {
          formatted += `Y ${step}\n`
        })

        scenario.but?.forEach((step) => {
          formatted += `Pero ${step}\n`
        })

        formatted += "\n"
      })
    }

    return formatted
  }
}
