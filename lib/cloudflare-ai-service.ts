import { createAiGateway } from "ai-gateway-provider"
import { createMistral } from "@ai-sdk/mistral"
import type { JiraIssue, AISuggestion } from "@/types"
import { config } from "@/lib/config"
import { generateText, type LanguageModel } from "ai"

export class CloudflareAIService {
  private static proxiedModelInstance: LanguageModel | null = null

  static {
    if (config.cloudflare.accountId && config.cloudflare.gatewayName) {
      const gatewayProvider = createAiGateway({
        accountId: config.cloudflare.accountId,
        gateway: config.cloudflare.gatewayName,
      })

      const mistralModel = createMistral({
        apiKey: config.cloudflare.apiKey || "",
      })("mistral-large-latest")

      this.proxiedModelInstance = gatewayProvider(mistralModel)
    }
  }

  static isConfigured(): boolean {
    return !!this.proxiedModelInstance
  }

  static async generateSuggestions(
    issue: JiraIssue,
    context: {
      files?: any[]
      knowledge?: any[]
    } = {},
  ): Promise<AISuggestion[]> {
    if (!this.isConfigured() || !this.proxiedModelInstance) {
      throw new Error("Cloudflare AI Gateway no está configurado. Verifica tus variables de entorno.")
    }

    try {
      const prompt = this.buildPrompt(issue, context)

      const { text } = await generateText({
        model: this.proxiedModelInstance,
        prompt: prompt,
        system: `Eres un experto en análisis de historias de usuario y formato Gherkin. 
                 Tu tarea es analizar historias de usuario y sugerir mejoras específicas en formato Gherkin.
                 Responde siempre en español y proporciona sugerencias prácticas y aplicables.`,
        temperature: 0.7,
        maxTokens: 2000,
      })

      if (!text) {
        throw new Error("No se recibió respuesta de Cloudflare AI Gateway")
      }

      return this.parseAISuggestions(text)
    } catch (error: any) {
      console.error("Error generando sugerencias con Cloudflare AI Gateway:", error)
      throw new Error(`Error con Cloudflare AI Gateway: ${error.message}`)
    }
  }

  private static buildPrompt(issue: JiraIssue, context: any): string {
    let prompt = `
Analiza la siguiente historia de usuario y proporciona sugerencias de mejora:

**Historia de Usuario:**
${issue.summary}

**Descripción:**
${issue.description}

**Criterios de Aceptación Actuales:**
${issue.acceptanceCriteria
        ?.map(
          (scenario) => `
Escenario: ${scenario.title}
${scenario.given.map((step) => `Dado que ${step}`).join("\n")}
${scenario.when.map((step) => `Cuando ${step}`).join("\n")}
${scenario.then.map((step) => `Entonces ${step}`).join("\n")}
`,
        )
        .join("\n") || "No hay criterios definidos"
      }

**Información del Issue:**
- Tipo: ${issue.issueType}
- Prioridad: ${issue.priority}
- Estado: ${issue.status}
- Story Points: ${issue.storyPoints}
`

    if (context.files?.length > 0) {
      prompt += `\n**Archivos de Contexto:**\n`
      context.files.forEach((file: { name: string; content: string }) => {
        prompt += `- ${file.name}: ${file.content.substring(0, 500)}...\n`
      })
    }

    if (context.knowledge?.length > 0) {
      prompt += `\n**Base de Conocimiento:**\n`
      context.knowledge.forEach((item: { title: string; category: string; content: string }) => {
        prompt += `- ${item.title} (${item.category}): ${item.content.substring(0, 300)}...\n`
      })
    }

    prompt += `
Por favor, proporciona 3-5 sugerencias específicas para mejorar esta historia de usuario.
Para cada sugerencia, incluye:
1. Un título claro
2. Una descripción de la mejora
3. La categoría (Gherkin Structure, Acceptance Criteria, Edge Cases, Security, Usability)
4. La prioridad (High, Medium, Low)
5. Un ejemplo de Gherkin mejorado si aplica

Formato de respuesta en JSON:
{
  "suggestions": [
    {
      "title": "Título de la sugerencia",
      "description": "Descripción detallada",
      "category": "Categoría",
      "priority": "Prioridad",
      "gherkin": "Ejemplo de Gherkin mejorado (opcional)"
    }
  ]
}
`

    return prompt
  }

  private static parseAISuggestions(response: string): AISuggestion[] {
    try {
      // Limpia los bloques ```json ... ```
      const cleaned = response
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```$/, "") // por si hay otro al final

      const parsed = JSON.parse(cleaned)

      return (
        parsed.suggestions?.map((suggestion: any, index: number) => ({
          id: `ai-${Date.now()}-${index}`,
          title: suggestion.title || "Sugerencia sin título",
          description: suggestion.description || "Sin descripción",
          category: suggestion.category || "Acceptance Criteria",
          priority: suggestion.priority || "Medium",
          confidence: 0.85,
          suggestedGherkin: suggestion.gherkin || undefined,
        })) || []
      )
    } catch (error) {
      console.warn("Respuesta no es JSON válido, parseando como texto plano:", response)
      return [
        {
          id: `ai-${Date.now()}`,
          title: "Sugerencia de IA (formato inesperado)",
          description: response.substring(0, 500),
          category: "Acceptance Criteria",
          priority: "Medium",
          confidence: 0.7,
          suggestedGherkin: undefined,
        },
      ]
    }
  }
}
