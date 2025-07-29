"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, AlertTriangle, ArrowLeft } from "lucide-react"
import { testJiraConnection, testJiraIssue } from "@/lib/test-connection"
import { config } from "@/lib/config"
import Link from "next/link"
import type { User } from "@/types" // Importar el tipo User

export default function TestConnectionPage() {
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [isTestingIssue, setIsTestingIssue] = useState(false)
  // CAMBIO AQUÍ: connectionResult ahora puede ser User | null
  const [connectionResult, setConnectionResult] = useState<User | null>(null)
  const [issueResult, setIssueResult] = useState<any>(null)
  const [testIssueKey, setTestIssueKey] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleTestConnection = async () => {
    setIsTestingConnection(true)
    setError(null)
    setConnectionResult(null)

    try {
      // CAMBIO AQUÍ: testJiraConnection ahora devuelve User | null
      const result = await testJiraConnection()
      setConnectionResult(result) // Almacena el objeto de usuario o null
      if (!result) {
        setError("No se pudo conectar con Jira. Verifica tus credenciales y configuración.")
      }
    } catch (error: any) {
      setError(error.message)
      setConnectionResult(null) // Asegúrate de que sea null en caso de error
    } finally {
      setIsTestingConnection(false)
    }
  }

  const handleTestIssue = async () => {
    if (!testIssueKey.trim()) return

    setIsTestingIssue(true)
    setError(null)
    setIssueResult(null)

    try {
      const issue = await testJiraIssue(testIssueKey)
      setIssueResult(issue)
    } catch (error: any) {
      setError(error.message)
      setIssueResult(null)
    } finally {
      setIsTestingIssue(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Prueba de Conexión con Jira</h1>
            <p className="text-muted-foreground">Verifica que tu configuración de Jira funcione correctamente</p>
          </div>
        </div>

        {/* Configuración actual */}
        <Card>
          <CardHeader>
            <CardTitle>Configuración Actual</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Base URL:</label>
                <p className="text-sm text-muted-foreground font-mono">{config.jira.baseUrl || "❌ No configurado"}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Email:</label>
                <p className="text-sm text-muted-foreground font-mono">
                  {config.jira.userEmail || "❌ No configurado"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">API Token:</label>
                <p className="text-sm text-muted-foreground">
                  {config.jira.apiToken ? "✅ Configurado" : "❌ No configurado"}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Estado:</span>
              <Badge variant={config.jira.isConfigured() ? "default" : "destructive"}>
                {config.jira.isConfigured() ? "✅ Configurado" : "❌ Incompleto"}
              </Badge>
            </div>

            {!config.jira.isConfigured() && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Configuración incompleta. Revisa tu archivo .env.local y asegúrate de tener todas las variables
                  necesarias.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Test de conexión */}
        <Card>
          <CardHeader>
            <CardTitle>1. Probar Conexión Básica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Verifica que puedas conectarte a Jira con tus credenciales.</p>

            <Button
              onClick={handleTestConnection}
              disabled={isTestingConnection || !config.jira.isConfigured()}
              className="w-full"
            >
              {isTestingConnection ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              {isTestingConnection ? "Probando conexión..." : "Probar Conexión"}
            </Button>

            {/* CAMBIO AQUÍ: Mostrar detalles del usuario si la conexión es exitosa */}
            {connectionResult && (
              <Alert className="border-green-200 bg-green-50">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <AlertDescription className="text-sm">
                    ✅ Conexión exitosa con Jira.
                    <div className="mt-2 space-y-1">
                      <p>
                        <span className="font-medium">Usuario:</span> {connectionResult.name}
                      </p>
                      <p>
                        <span className="font-medium">Email:</span> {connectionResult.email}
                      </p>
                      <p>
                        <span className="font-medium">Instancia:</span> {connectionResult.jiraInstance}
                      </p>
                    </div>
                  </AlertDescription>
                </div>
              </Alert>
            )}

            {/* CAMBIO AQUÍ: Mostrar error si connectionResult es null y no está cargando */}
            {connectionResult === null && !isTestingConnection && error && (
              <Alert className="border-red-200 bg-red-50">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <AlertDescription className="text-sm">
                    ❌ Error de conexión. Verifica tus credenciales y configuración.
                  </AlertDescription>
                </div>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Test de issue */}
        <Card>
          <CardHeader>
            <CardTitle>2. Probar Obtener Issue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Prueba obtener un issue específico de tu Jira. Ingresa un ID de issue que sepas que existe.
            </p>

            <div className="flex space-x-2">
              <Input
                placeholder="Ej: PROJ-123, DEV-456"
                value={testIssueKey}
                onChange={(e) => setTestIssueKey(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleTestIssue()}
                className="flex-1"
              />
              <Button
                onClick={handleTestIssue}
                // CAMBIO AQUÍ: Habilitar solo si connectionResult no es null (es decir, hay un usuario)
                disabled={isTestingIssue || !testIssueKey.trim() || connectionResult === null}
              >
                {isTestingIssue ? <Loader2 className="w-4 h-4 animate-spin" /> : "Probar"}
              </Button>
            </div>

            {issueResult && (
              <Card className="bg-green-50 border-green-200">
                <CardHeader>
                  <CardTitle className="text-green-800 text-base">✅ Issue obtenido exitosamente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Key:</span> {issueResult.key}
                    </div>
                    <div>
                      <span className="font-medium">Status:</span> {issueResult.status}
                    </div>
                    <div>
                      <span className="font-medium">Type:</span> {issueResult.issueType}
                    </div>
                    <div>
                      <span className="font-medium">Assignee:</span> {issueResult.assignee}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Summary:</span>
                    <p className="text-muted-foreground mt-1">{issueResult.summary}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* Errores */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Error:</strong> {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Instrucciones */}
        <Card>
          <CardHeader>
            <CardTitle>💡 Solución de Problemas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <strong>❌ Error 401 - No autorizado:</strong>
              <ul className="list-disc list-inside ml-4 text-muted-foreground">
                <li>Verifica que el API token sea correcto</li>
                <li>Confirma que el email sea el correcto</li>
                <li>Asegúrate de que el token no haya expirado</li>
              </ul>
            </div>
            <div>
              <strong>❌ Error 403 - Sin permisos:</strong>
              <ul className="list-disc list-inside ml-4 text-muted-foreground">
                <li>Verifica que tengas permisos para ver issues</li>
                <li>Contacta a tu administrador de Jira</li>
              </ul>
            </div>
            <div>
              <strong>❌ Error 404 - Issue no encontrado:</strong>
              <ul className="list-disc list-inside ml-4 text-muted-foreground">
                <li>Confirma que el issue exista</li>
                <li>Verifica que tengas acceso al proyecto</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
