"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, CheckCircle, AlertTriangle, Clock, RefreshCw, ExternalLink, GitBranch, Loader2 } from "lucide-react"
import type { JiraIssue } from "@/types"

interface JiraSyncPanelProps {
  issue: JiraIssue
  hasChanges: boolean
  appliedSuggestions: string[]
  onSyncToJira: () => Promise<void>
  onRevertChanges: () => void
}

export function JiraSyncPanel({
  issue,
  hasChanges,
  appliedSuggestions,
  onSyncToJira,
  onRevertChanges,
}: JiraSyncPanelProps) {
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null)
  const [syncStatus, setSyncStatus] = useState<"idle" | "success" | "error">("idle")

  const handleSyncToJira = async () => {
    setIsSyncing(true)
    setSyncStatus("idle")

    try {
      await onSyncToJira()
      setLastSyncTime(new Date().toLocaleString())
      setSyncStatus("success")
    } catch (error) {
      setSyncStatus("error")
      console.error("Error syncing to Jira:", error)
    } finally {
      setIsSyncing(false)
    }
  }

  const getSyncStatusIcon = () => {
    switch (syncStatus) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "error":
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />
    }
  }

  const getSyncStatusMessage = () => {
    switch (syncStatus) {
      case "success":
        return "Sincronizado exitosamente"
      case "error":
        return "Error en la sincronización"
      default:
        return hasChanges ? "Cambios pendientes" : "Sincronizado"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <GitBranch className="w-5 h-5" />
          <span>Sincronización con Jira</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estado actual */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center space-x-2">
            {getSyncStatusIcon()}
            <span className="text-sm font-medium">{getSyncStatusMessage()}</span>
          </div>
          <Badge variant={hasChanges ? "secondary" : "default"}>{hasChanges ? "Modificado" : "Actualizado"}</Badge>
        </div>

        {/* Información del issue */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Issue:</span>
            <div className="flex items-center space-x-2">
              <span className="font-mono">{issue.key}</span>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <ExternalLink className="w-3 h-3" />
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Estado:</span>
            <Badge variant="outline">{issue.status}</Badge>
          </div>
          {lastSyncTime && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Última sincronización:</span>
              <span className="text-xs">{lastSyncTime}</span>
            </div>
          )}
        </div>

        <Separator />

        {/* Cambios aplicados */}
        {appliedSuggestions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Sugerencias aplicadas:</h4>
            <div className="space-y-1">
              {appliedSuggestions.map((suggestion, index) => (
                <div key={index} className="flex items-center space-x-2 text-xs">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <span className="text-muted-foreground">{suggestion}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Alertas */}
        {hasChanges && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Tienes cambios sin sincronizar. Los cambios se aplicarán a la descripción y criterios de aceptación del
              issue en Jira.
            </AlertDescription>
          </Alert>
        )}

        {syncStatus === "error" && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Error al sincronizar con Jira. Verifica tu conexión y permisos.
            </AlertDescription>
          </Alert>
        )}

        {syncStatus === "success" && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-sm text-green-800">
              Los cambios se han sincronizado exitosamente con Jira.
            </AlertDescription>
          </Alert>
        )}

        {/* Botones de acción */}
        <div className="flex space-x-2">
          <Button onClick={handleSyncToJira} disabled={!hasChanges || isSyncing} className="flex-1">
            {isSyncing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
            {isSyncing ? "Sincronizando..." : "Enviar a Jira"}
          </Button>

          {hasChanges && (
            <Button variant="outline" onClick={onRevertChanges} disabled={isSyncing}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Revertir
            </Button>
          )}
        </div>

        {/* Información adicional */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Los cambios se aplicarán a la descripción del issue</p>
          <p>• Los criterios de aceptación se actualizarán en formato Gherkin</p>
          <p>• Se mantendrá un historial de cambios en los comentarios</p>
        </div>
      </CardContent>
    </Card>
  )
}
