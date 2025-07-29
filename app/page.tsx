"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Search, User, Calendar, Flag, CheckCircle, RefreshCw, Database, AlertTriangle } from "lucide-react"
import { AIService } from "@/lib/ai-service"
import { AuthService } from "@/lib/auth-service"
import { config } from "@/lib/config"
import type { JiraIssue, AISuggestion, User as JiraUserType } from "@/types"
import { GherkinViewer } from "@/components/gherkin-viewer"
import { AISuggestionsGherkin } from "@/components/ai-suggestions-gherkin"
import { FileUpload } from "@/components/file-upload"
import { RAGInformation } from "@/components/rag-information"
import { JiraSyncPanel } from "@/components/jira-sync-panel"

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

export default function JiraAIApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [taskId, setTaskId] = useState("")
  const [currentIssue, setCurrentIssue] = useState<JiraIssue | null>(null)
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [user, setUser] = useState<JiraUserType | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeItem[]>([])
  const [activeTab, setActiveTab] = useState("search")
  const [connectionStatus, setConnectionStatus] = useState<"checking" | "connected" | "error" | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [appliedSuggestions, setAppliedSuggestions] = useState<string[]>([])
  const [hasChanges, setHasChanges] = useState(false)
  const [isApplyingSuggestion, setIsApplyingSuggestion] = useState(false)
  const [originalIssue, setOriginalIssue] = useState<JiraIssue | null>(null)

  useEffect(() => {
    checkConfiguration()
  }, [])

  const checkConfiguration = async () => {
    try {
      config.validate()

      const mockUser = AuthService.getCurrentUser()
      if (mockUser) {
        setIsAuthenticated(true)
        setUser(mockUser)
      }

      if (config.jira.isConfigured()) {
        setConnectionStatus("checking")
        const response = await fetch("/api/jira/proxy/myself")
        const data = await response.json()

        if (response.ok && data.success) {
          setConnectionStatus("connected")
          setUser(data.user as JiraUserType)
          setError(null)
        } else {
          setConnectionStatus("error")
          setError(data.error || data.message || "No se pudo conectar con Jira. Verifica tu configuración.")
        }
      } else {
        setError("Jira no está configurado. Revisa tus variables de entorno.")
        setConnectionStatus("error")
      }
    } catch (error: any) {
      console.error("Error en configuración:", error)
      setError(error.message)
      setConnectionStatus("error")
    }
  }

  const handleLogin = async () => {
    try {
      const response = await fetch("/api/jira/proxy/myself")
      const data = await response.json()

      if (response.ok && data.success) {
        setUser(data.user as JiraUserType)
        setIsAuthenticated(true)
        setConnectionStatus("connected")
        setError(null)
      } else {
        setError(data.error || data.message || "Error al iniciar sesión con Jira. Credenciales inválidas.")
        setConnectionStatus("error")
      }
    } catch (error) {
      console.error("Error during login:", error)
      setError("Error al iniciar sesión. Inténtalo de nuevo.")
      setConnectionStatus("error")
    }
  }

  const handleLogout = () => {
    AuthService.logout()
    setIsAuthenticated(false)
    setUser(null)
    setCurrentIssue(null)
    setSuggestions([])
    setUploadedFiles([])
    setKnowledgeBase([])
    setConnectionStatus("error")
    setError("Sesión cerrada. Conecta con Jira para continuar.")
  }

  const handleSearchTask = async () => {
    if (!taskId.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      let issue: JiraIssue

      if (config.jira.isConfigured() && connectionStatus === "connected") {
        console.log("🔄 Obteniendo issue real de Jira a través del proxy:", taskId)
        const response = await fetch(`/api/jira/proxy/${taskId}`)
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to fetch issue from proxy")
        }
        issue = await response.json()
        console.log("✅ Issue obtenido de Jira:", issue)
      } else {
        console.log("⚠️ Usando datos mock - Jira no configurado o sin conexión")
        const { JiraServiceReal } = await import("@/lib/jira-service-real")
        issue = await JiraServiceReal.getIssue(taskId)
      }

      setCurrentIssue(issue)
      setOriginalIssue(JSON.parse(JSON.stringify(issue)))
      setHasChanges(false)
      setAppliedSuggestions([])

      await generateSuggestions(issue)
    } catch (error: any) {
      console.error("Error fetching issue:", error)
      setError(`Error obteniendo issue: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const generateSuggestions = async (issue: JiraIssue) => {
    setIsLoadingSuggestions(true)
    setError(null)

    try {
      const response = await fetch("/api/ai/generate-suggestions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          issue,
          files: uploadedFiles.filter((f) => f.status === "completed"),
          knowledge: knowledgeBase,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate AI suggestions from API")
      }

      setSuggestions(data.suggestions)
      console.log("✅ Sugerencias generadas (vía API Route):", data.suggestions.length)
    } catch (error: any) {
      console.error("Error generating suggestions:", error)
      setError(`Error generando sugerencias: ${error.message}`)

      // Fallback a sugerencias mock en caso de error de la API
      try {
        console.warn("⚠️ Fallback a sugerencias mock debido a error de la API.")
        const aiSuggestions = await AIService.generateSuggestionsWithContext(issue, uploadedFiles, knowledgeBase)
        setSuggestions(aiSuggestions)
      } catch (fallbackError) {
        console.error("Error en fallback:", fallbackError)
      }
    } finally {
      setIsLoadingSuggestions(false)
    }
  }

  const handleFilesProcessed = (files: UploadedFile[]) => {
    setUploadedFiles((prev) => {
      const newFiles = [...prev]
      files.forEach((file) => {
        const existingIndex = newFiles.findIndex((f) => f.id === file.id)
        if (existingIndex >= 0) {
          newFiles[existingIndex] = file
        } else {
          newFiles.push(file)
        }
      })
      return newFiles
    })

    if (currentIssue) {
      generateSuggestions(currentIssue)
    }
  }

  const handleKnowledgeUpdate = (knowledge: KnowledgeItem[]) => {
    setKnowledgeBase(knowledge)

    if (currentIssue) {
      generateSuggestions(currentIssue)
    }
  }

  const handleRegenerateSuggestions = () => {
    if (currentIssue) {
      generateSuggestions(currentIssue)
    }
  }

  const handleApplySuggestion = async (suggestion: AISuggestion) => {
    if (!currentIssue) return

    setIsApplyingSuggestion(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const updatedIssue = { ...currentIssue }

      if (suggestion.suggestedGherkin) {
        const newScenarios = parseGherkinToScenarios(suggestion.suggestedGherkin)
        updatedIssue.acceptanceCriteria = [...(updatedIssue.acceptanceCriteria || []), ...newScenarios]
      }

      if (suggestion.category === "User Story Format") {
        updatedIssue.description = `${updatedIssue.description}\n\nMejora aplicada: ${suggestion.description}`
      }

      setCurrentIssue(updatedIssue)
      setHasChanges(true)
      setAppliedSuggestions((prev) => [...prev, suggestion.title])

      console.log(`✅ Sugerencia aplicada: ${suggestion.title}`)
    } catch (error) {
      console.error("Error applying suggestion:", error)
      setError("Error aplicando sugerencia")
    } finally {
      setIsApplyingSuggestion(false)
    }
  }

  const parseGherkinToScenarios = (gherkinText: string): any[] => {
    const scenarios: any[] = []
    const lines = gherkinText.split("\n").filter((line) => line.trim())

    let currentScenario: any = null

    for (const line of lines) {
      const trimmed = line.trim()

      if (trimmed.startsWith("Escenario:")) {
        if (currentScenario) scenarios.push(currentScenario)
        currentScenario = {
          id: `scenario-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: trimmed.replace("Escenario:", "").trim(),
          given: [],
          when: [],
          then: [],
          tags: [],
        }
      } else if (currentScenario) {
        if (trimmed.startsWith("Dado que") || trimmed.startsWith("Y que")) {
          currentScenario.given.push(trimmed.replace(/^(Dado que|Y que)\s*/, ""))
        } else if (trimmed.startsWith("Cuando") || (trimmed.startsWith("Y ") && currentScenario.when.length > 0)) {
          currentScenario.when.push(trimmed.replace(/^(Cuando|Y)\s*/, ""))
        } else if (trimmed.startsWith("Entonces") || (trimmed.startsWith("Y ") && currentScenario.then.length > 0)) {
          currentScenario.then.push(trimmed.replace(/^(Entonces|Y)\s*/, ""))
        }
      }
    }

    if (currentScenario) scenarios.push(currentScenario)
    return scenarios
  }

  const handleSyncToJira = async () => {
    if (!currentIssue || !originalIssue) return

    try {
      let updatedIssue: JiraIssue

      if (config.jira.isConfigured() && connectionStatus === "connected") {
        console.log("🔄 Sincronizando con Jira real...")
        const syncResponse = await fetch(`/api/jira/proxy/${currentIssue.key}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            description: currentIssue.description,
            acceptanceCriteria: currentIssue.acceptanceCriteria,
            userStory: currentIssue.userStory,
            appliedSuggestions: appliedSuggestions,
          }),
        })
        if (!syncResponse.ok) {
          const errorData = await syncResponse.json()
          throw new Error(errorData.error || "Failed to sync issue via proxy")
        }
        updatedIssue = await syncResponse.json()
        console.log("✅ Issue actualizado en Jira")
      } else {
        console.log("⚠️ Simulando sincronización - Jira no configurado")
        const { JiraServiceReal } = await import("@/lib/jira-service-real")
        updatedIssue = await JiraServiceReal.updateIssueWithSuggestions(
          currentIssue.key,
          {
            description: currentIssue.description,
            acceptanceCriteria: currentIssue.acceptanceCriteria,
            userStory: currentIssue.userStory,
          },
          appliedSuggestions,
        )
      }

      setCurrentIssue(updatedIssue)
      setOriginalIssue(JSON.parse(JSON.stringify(updatedIssue)))
      setHasChanges(false)
      setAppliedSuggestions([])
    } catch (error: any) {
      console.error("Error syncing to Jira:", error)
      setError(`Error sincronizando con Jira: ${error.message}`)
      throw error
    }
  }

  const handleRevertChanges = () => {
    if (originalIssue) {
      setCurrentIssue(JSON.parse(JSON.stringify(originalIssue)))
      setHasChanges(false)
      setAppliedSuggestions([])
    }
  }

  const handleScenariosChange = (scenarios: any[]) => {
    if (currentIssue) {
      setCurrentIssue({
        ...currentIssue,
        acceptanceCriteria: scenarios,
      })
      setHasChanges(true)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Jira AI Assistant</CardTitle>
            <CardDescription>Conecta con Jira y mejora tus historias de usuario con IA</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {connectionStatus && (
              <Alert
                className={
                  connectionStatus === "connected"
                    ? "border-green-200 bg-green-50"
                    : connectionStatus === "error"
                      ? "border-red-200 bg-red-50"
                      : ""
                }
              >
                <div className="flex items-center space-x-2">
                  {connectionStatus === "checking" && <Loader2 className="w-4 h-4 animate-spin" />}
                  {connectionStatus === "connected" && <CheckCircle className="w-4 h-4 text-green-600" />}
                  {connectionStatus === "error" && <AlertTriangle className="w-4 h-4 text-red-600" />}
                  <AlertDescription className="text-sm">
                    {connectionStatus === "checking" && "Verificando conexión con Jira..."}
                    {connectionStatus === "connected" && "✅ Conectado con Jira"}
                    {connectionStatus === "error" && "❌ Error de conexión con Jira"}
                  </AlertDescription>
                </div>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}

            <Button onClick={handleLogin} className="w-full" size="lg">
              <User className="w-4 h-4 mr-2" />
              Iniciar Sesión con Jira
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              {config.jira.isConfigured()
                ? "Conectando con tu instancia de Jira configurada"
                : "Configura las variables de entorno para conectar con Jira"}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold">Jira AI Assistant</h1>
            {connectionStatus && (
              <Badge variant={connectionStatus === "connected" ? "default" : "secondary"}>
                {connectionStatus === "connected"
                  ? "🟢 Jira Conectado"
                  : connectionStatus === "error"
                    ? "🔴 Sin Conexión"
                    : "🟡 Verificando"}
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <Avatar className="w-8 h-8">
              <AvatarImage src={user?.avatar || "/placeholder.svg"} />
              <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{user?.name}</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      {error && (
        <div className="px-6 py-2">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      <div className="flex h-[calc(100vh-73px)]">
        <div className="flex-1 p-6 min-w-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="search">Búsqueda de Issues</TabsTrigger>
              <TabsTrigger value="rag">
                <Database className="w-4 h-4 mr-2" />
                RAG de Información
              </TabsTrigger>
            </TabsList>

            <TabsContent value="search" className="space-y-6">
              <div className="max-w-3xl">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Buscar Historia de Usuario</h2>
                  <p className="text-muted-foreground mb-4">
                    Ingresa el ID de la tarea de Jira para obtener detalles y sugerencias de mejora
                    {!config.jira.isConfigured() && (
                      <span className="text-orange-600"> (Modo demo - configura Jira para datos reales)</span>
                    )}
                  </p>

                  <div className="flex space-x-2">
                    <Input
                      placeholder="Ej: PROJ-123"
                      value={taskId}
                      onChange={(e) => setTaskId(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSearchTask()}
                      className="flex-1"
                    />
                    <Button onClick={handleSearchTask} disabled={isLoading}>
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      Buscar
                    </Button>
                  </div>
                </div>

                <FileUpload
                  onFilesProcessed={handleFilesProcessed}
                  maxFiles={5}
                  acceptedTypes={[".txt", ".md", ".pdf", ".docx", ".csv", ".json"]}
                />

                {knowledgeBase.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Database className="w-5 h-5" />
                        <span>Base de Conocimiento Activa</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {knowledgeBase.slice(0, 5).map((item) => (
                          <Badge key={item.id} variant="outline">
                            {item.title}
                          </Badge>
                        ))}
                        {knowledgeBase.length > 5 && <Badge variant="secondary">+{knowledgeBase.length - 5} más</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        La IA utilizará esta información para generar sugerencias más precisas
                      </p>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Búsquedas Recientes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {["PROJ-123", "PROJ-124", "PROJ-125"].map((id) => (
                        <Button
                          key={id}
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={() => {
                            setTaskId(id)
                            handleSearchTask()
                          }}
                        >
                          {id}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="rag">
              <RAGInformation onKnowledgeUpdate={handleKnowledgeUpdate} />
            </TabsContent>
          </Tabs>
        </div>

        {currentIssue && activeTab === "search" && (
          <div className="w-[500px] border-l bg-gray-50/50">
            <ScrollArea className="h-full">
              <div className="p-6 space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{currentIssue.key}</CardTitle>
                      <div className="flex items-center space-x-2">
                        <Badge variant={currentIssue.status === "Done" ? "default" : "secondary"}>
                          {currentIssue.status}
                        </Badge>
                        {config.jira.isConfigured() && connectionStatus === "connected" && (
                          <Badge variant="outline" className="text-xs">
                            Real
                          </Badge>
                        )}
                        {(!config.jira.isConfigured() || connectionStatus !== "connected") && (
                          <Badge variant="secondary" className="text-xs">
                            Demo
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardDescription>{currentIssue.issueType}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Historia de Usuario</h4>
                      <p className="text-sm text-muted-foreground italic">
                        {currentIssue.userStory || currentIssue.description}
                      </p>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span>{currentIssue.assignee}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Flag className="w-4 h-4 text-muted-foreground" />
                        <span>{currentIssue.priority}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>{currentIssue.created}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-muted-foreground" />
                        <span>{currentIssue.storyPoints} pts</span>
                      </div>
                    </div>

                    {(uploadedFiles.length > 0 || knowledgeBase.length > 0) && (
                      <div className="mt-4 space-y-2">
                        {uploadedFiles.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium mb-2">Archivos de contexto:</h5>
                            <div className="space-y-1">
                              {uploadedFiles
                                .filter((f) => f.status === "completed")
                                .map((file) => (
                                  <Badge key={file.id} variant="outline" className="text-xs">
                                    {file.name}
                                  </Badge>
                                ))}
                            </div>
                          </div>
                        )}

                        {knowledgeBase.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium mb-2">Base de conocimiento:</h5>
                            <div className="space-y-1">
                              {knowledgeBase.slice(0, 3).map((item) => (
                                <Badge key={item.id} variant="secondary" className="text-xs">
                                  {item.title}
                                </Badge>
                              ))}
                              {knowledgeBase.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{knowledgeBase.length - 3} más
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <GherkinViewer
                  scenarios={currentIssue.acceptanceCriteria || []}
                  hasChanges={hasChanges}
                  onEditScenario={(scenario) => console.log("Edit scenario:", scenario)}
                  onAddScenario={() => console.log("Add new scenario")}
                  onScenariosChange={handleScenariosChange}
                />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">
                      Sugerencias de IA
                      {/* CAMBIO AQUÍ: Usar config.cloudflare.isConfigured() para el badge */}
                      {config.cloudflare.isConfigured() ? (
                        <Badge variant="outline" className="ml-2 text-xs">
                          Cloudflare AI
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          Mock
                        </Badge>
                      )}
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRegenerateSuggestions}
                      disabled={isLoadingSuggestions}
                    >
                      {isLoadingSuggestions ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                      Regenerar
                    </Button>
                  </div>

                  <AISuggestionsGherkin
                    suggestions={suggestions}
                    onApplySuggestion={handleApplySuggestion}
                    isApplying={isApplyingSuggestion}
                  />
                </div>
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
      {currentIssue && activeTab === "search" && (
        <JiraSyncPanel
          issue={currentIssue}
          hasChanges={hasChanges}
          appliedSuggestions={appliedSuggestions}
          onSyncToJira={handleSyncToJira}
          onRevertChanges={handleRevertChanges}
        />
      )}
    </div>
  )
}
