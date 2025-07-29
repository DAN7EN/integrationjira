import type { JiraIssue, AISuggestion } from "@/types"

interface GherkinScenario {
  id: string
  title: string
  given: string[]
  when: string[]
  then: string[]
  tags: string[]
}

interface GherkinIssue {
  type: string
  message: string
  scenarioId: string
}

interface GherkinSuggestion {
  type: string
  message: string
  scenarioId: string
}

interface GherkinAnalysis {
  isValidGherkin: boolean
  scenarios: GherkinScenario[]
  issues: GherkinIssue[]
  suggestions: GherkinSuggestion[]
}

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  content: string
  status: "uploading" | "processing" | "completed" | "error"
  progress: number
}

interface KnowledgeItem {
  id: string
  title: string
  content: string
  category: "business-rules" | "technical-specs" | "user-personas" | "templates" | "examples" | "glossary"
  tags: string[]
  createdAt: string
  updatedAt: string
  usage: number
}

export class AIService {
  private static apiKey = process.env.OPENAI_API_KEY
  private static contextFiles: UploadedFile[] = []
  private static knowledgeBase: KnowledgeItem[] = []

  static setContextFiles(files: UploadedFile[]) {
    this.contextFiles = files.filter((f) => f.status === "completed")
  }

  static setKnowledgeBase(knowledge: KnowledgeItem[]) {
    this.knowledgeBase = knowledge
  }

  static async generateSuggestions(issue: JiraIssue): Promise<AISuggestion[]> {
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Analizar la estructura Gherkin
    const gherkinAnalysis = this.analyzeGherkin(issue.acceptanceCriteria || [])

    // Generar contexto adicional basado en archivos subidos y base de conocimiento
    const fileContext = this.generateFileContext()
    const knowledgeContext = this.generateKnowledgeContext(issue)

    const baseSuggestions: AISuggestion[] = [
      {
        id: "1",
        title: "Mejorar estructura de escenarios Gherkin",
        description:
          "Los escenarios actuales siguen la estructura Given-When-Then, pero podrían ser más específicos. Considera agregar más contexto en los pasos 'Given' y ser más preciso en las acciones 'When'.",
        category: "Gherkin Structure",
        priority: "High",
        confidence: 0.9,
        gherkinAnalysis,
        suggestedGherkin: `
Escenario: Login exitoso con credenciales válidas
  Dado que soy un usuario registrado con email "usuario@ejemplo.com"
  Y que mi cuenta está activa
  Y que estoy en la página de login
  Cuando ingreso "usuario@ejemplo.com" en el campo email
  Y ingreso mi contraseña correcta
  Y hago clic en el botón "Iniciar Sesión"
  Entonces debo ser autenticado exitosamente
  Y debo ser redirigido al dashboard en menos de 3 segundos
  Y debo ver "Bienvenido, Usuario" en la barra superior
      `.trim(),
      },
      {
        id: "2",
        title: "Agregar escenarios de casos límite",
        description:
          "Faltan escenarios importantes como cuenta bloqueada, sesión expirada, y problemas de conectividad. Estos casos son cruciales para una autenticación robusta.",
        category: "Edge Cases",
        priority: "High",
        confidence: 0.95,
        suggestedGherkin: `
Escenario: Intento de login con cuenta bloqueada
  Dado que soy un usuario registrado
  Y que mi cuenta ha sido bloqueada por múltiples intentos fallidos
  Cuando intento iniciar sesión con credenciales correctas
  Entonces debo ver el mensaje "Tu cuenta está temporalmente bloqueada"
  Y debo ver un enlace para "Desbloquear cuenta"
  Y no debo ser autenticado

Escenario: Timeout de sesión durante el login
  Dado que estoy en la página de login
  Y que hay problemas de conectividad
  Cuando intento iniciar sesión
  Y la respuesta del servidor tarda más de 30 segundos
  Entonces debo ver un mensaje "Tiempo de espera agotado"
  Y debo poder reintentar el login
      `.trim(),
      },
    ]

    // Agregar sugerencias basadas en archivos si hay contexto disponible
    if (fileContext) {
      baseSuggestions.push({
        id: "file-context-1",
        title: "Escenarios basados en documentación adjunta",
        description: `Basándome en los archivos proporcionados, he identificado casos de uso adicionales que deberían incluirse en los criterios de aceptación.`,
        category: "Acceptance Criteria",
        priority: "High",
        confidence: 0.88,
        suggestedGherkin: fileContext,
      })
    }

    // Agregar sugerencias basadas en la base de conocimiento
    if (knowledgeContext.length > 0) {
      knowledgeContext.forEach((suggestion, index) => {
        baseSuggestions.push({
          id: `knowledge-${index}`,
          title: suggestion.title,
          description: suggestion.description,
          category: suggestion.category,
          priority: suggestion.priority,
          confidence: suggestion.confidence,
          suggestedGherkin: suggestion.gherkin,
        })
      })
    }

    return baseSuggestions
  }

  private static generateFileContext(): string | null {
    if (this.contextFiles.length === 0) return null

    const fileNames = this.contextFiles.map((f) => f.name).join(", ")

    return `
# Escenarios generados basados en archivos: ${fileNames}

Escenario: Validación según especificaciones del documento
  Dado que tengo los requisitos definidos en la documentación
  Y que el sistema debe cumplir con las especificaciones técnicas
  Cuando ejecuto las validaciones correspondientes
  Entonces todos los criterios documentados deben ser verificados
  Y el sistema debe comportarse según lo especificado

Escenario: Integración con sistemas externos mencionados en documentación
  Dado que existen dependencias externas documentadas
  Y que el sistema debe integrarse con servicios de terceros
  Cuando se ejecuta la integración
  Entonces la comunicación debe ser exitosa
  Y los datos deben transferirse correctamente
  Y debe manejarse cualquier error de conectividad
    `.trim()
  }

  private static generateKnowledgeContext(issue: JiraIssue): Array<{
    title: string
    description: string
    category: AISuggestion["category"]
    priority: AISuggestion["priority"]
    confidence: number
    gherkin: string
  }> {
    if (this.knowledgeBase.length === 0) return []

    const suggestions: Array<{
      title: string
      description: string
      category: AISuggestion["category"]
      priority: AISuggestion["priority"]
      confidence: number
      gherkin: string
    }> = []

    // Buscar reglas de negocio relevantes
    const businessRules = this.knowledgeBase.filter((item) => item.category === "business-rules")
    if (businessRules.length > 0) {
      const relevantRule = businessRules.find((rule) =>
        rule.tags.some((tag) => issue.summary.toLowerCase().includes(tag.toLowerCase())),
      )

      if (relevantRule) {
        suggestions.push({
          title: `Aplicar regla de negocio: ${relevantRule.title}`,
          description: `Basándome en la regla "${relevantRule.title}" de la base de conocimiento, sugiero incluir validaciones específicas en los escenarios.`,
          category: "Acceptance Criteria",
          priority: "High",
          confidence: 0.92,
          gherkin: `
Escenario: Validación de regla de negocio - ${relevantRule.title}
  Dado que el sistema debe cumplir con "${relevantRule.title}"
  Y que se han definido las siguientes reglas:
    ${relevantRule.content
      .split("\n")
      .slice(0, 3)
      .map((line) => `    ${line}`)
      .join("\n")}
  Cuando se ejecuta la funcionalidad
  Entonces debe validarse el cumplimiento de estas reglas
  Y debe mostrarse un mensaje apropiado en caso de incumplimiento
          `.trim(),
        })
      }
    }

    // Buscar plantillas relevantes
    const templates = this.knowledgeBase.filter((item) => item.category === "templates")
    if (templates.length > 0) {
      const errorTemplate = templates.find((template) => template.title.toLowerCase().includes("error"))

      if (errorTemplate) {
        suggestions.push({
          title: "Aplicar plantilla de manejo de errores",
          description: `Usando la plantilla "${errorTemplate.title}" de la base de conocimiento para mejorar el manejo de errores.`,
          category: "Gherkin Structure",
          priority: "Medium",
          confidence: 0.85,
          gherkin: errorTemplate.content,
        })
      }
    }

    // Buscar personas de usuario relevantes
    const personas = this.knowledgeBase.filter((item) => item.category === "user-personas")
    if (personas.length > 0) {
      const relevantPersona = personas[0] // Tomar la primera persona como ejemplo

      suggestions.push({
        title: `Escenarios específicos para ${relevantPersona.title}`,
        description: `Basándome en el perfil de "${relevantPersona.title}", sugiero escenarios que consideren sus necesidades específicas.`,
        category: "User Story Format",
        priority: "Medium",
        confidence: 0.78,
        gherkin: `
Escenario: Funcionalidad optimizada para ${relevantPersona.title}
  Dado que soy un ${relevantPersona.title.toLowerCase()}
  Y que tengo las características definidas en el perfil de usuario
  Cuando utilizo la funcionalidad
  Entonces la experiencia debe estar optimizada para mis necesidades
  Y debe considerar mis preferencias y limitaciones conocidas
        `.trim(),
      })
    }

    return suggestions
  }

  static async generateSuggestionsWithFiles(issue: JiraIssue, files: UploadedFile[]): Promise<AISuggestion[]> {
    this.setContextFiles(files)
    return this.generateSuggestions(issue)
  }

  static async generateSuggestionsWithContext(
    issue: JiraIssue,
    files: UploadedFile[],
    knowledge: KnowledgeItem[],
  ): Promise<AISuggestion[]> {
    this.setContextFiles(files)
    this.setKnowledgeBase(knowledge)
    return this.generateSuggestions(issue)
  }

  private static analyzeGherkin(scenarios: GherkinScenario[]): GherkinAnalysis {
    const issues: GherkinIssue[] = []
    const suggestions: GherkinSuggestion[] = []

    scenarios.forEach((scenario) => {
      // Verificar estructura básica
      if (!scenario.given || scenario.given.length === 0) {
        issues.push({
          type: "missing_given",
          message: `El escenario "${scenario.title}" no tiene pasos 'Given'`,
          scenarioId: scenario.id,
        })
      }

      if (!scenario.when || scenario.when.length === 0) {
        issues.push({
          type: "missing_when",
          message: `El escenario "${scenario.title}" no tiene pasos 'When'`,
          scenarioId: scenario.id,
        })
      }

      if (!scenario.then || scenario.then.length === 0) {
        issues.push({
          type: "missing_then",
          message: `El escenario "${scenario.title}" no tiene pasos 'Then'`,
          scenarioId: scenario.id,
        })
      }

      // Sugerir mejoras
      if (scenario.given.some((step) => step.includes("usuario"))) {
        suggestions.push({
          type: "improve_step",
          message: "Considera ser más específico sobre el tipo de usuario",
          scenarioId: scenario.id,
        })
      }
    })

    return {
      isValidGherkin: issues.length === 0,
      scenarios,
      issues,
      suggestions,
    }
  }

  static async improveSummary(summary: string): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 1500))

    return `Como usuario registrado, quiero poder autenticarme de forma segura en la aplicación utilizando mi email y contraseña, para acceder a mis funcionalidades personalizadas y mantener la seguridad de mis datos.`
  }

  static async generateAcceptanceCriteria(issue: JiraIssue): Promise<string[]> {
    await new Promise((resolve) => setTimeout(resolve, 1800))

    return [
      "Dado que soy un usuario registrado con credenciales válidas, cuando ingreso mi email y contraseña y hago clic en 'Iniciar Sesión', entonces debo ser autenticado y redirigido al dashboard principal.",
      "Dado que ingreso credenciales incorrectas, cuando intento iniciar sesión, entonces debo ver un mensaje de error claro y no ser autenticado.",
      "Dado que mi cuenta está bloqueada por múltiples intentos fallidos, cuando trato de iniciar sesión, entonces debo ver un mensaje específico sobre el bloqueo temporal.",
      "Dado que estoy autenticado, cuando hago clic en 'Cerrar Sesión', entonces mi sesión debe terminar y debo ser redirigido a la página de login.",
    ]
  }

  static async generateGherkinScenario(userStory: string, context: string): Promise<GherkinScenario> {
    await new Promise((resolve) => setTimeout(resolve, 1500))

    return {
      id: `scenario-${Date.now()}`,
      title: "Nuevo escenario generado por IA",
      given: ["que soy un usuario autenticado", "que estoy en la página principal"],
      when: ["realizo una acción específica"],
      then: ["debo ver el resultado esperado", "el sistema debe responder correctamente"],
      tags: ["@generated", "@review-needed"],
    }
  }

  static async analyzeFileContent(files: UploadedFile[]): Promise<{
    summary: string
    suggestedScenarios: string[]
    keyInsights: string[]
  }> {
    await new Promise((resolve) => setTimeout(resolve, 2000))

    return {
      summary: `Análisis completado de ${files.length} archivo(s). Se identificaron patrones relevantes para mejorar los criterios de aceptación.`,
      suggestedScenarios: [
        "Escenario basado en especificaciones técnicas encontradas",
        "Validación de casos de uso documentados",
        "Integración con sistemas mencionados en la documentación",
      ],
      keyInsights: [
        "Se encontraron referencias a validaciones de seguridad específicas",
        "Documentación indica integración con servicios externos",
        "Existen casos de uso no cubiertos en los escenarios actuales",
      ],
    }
  }
}
