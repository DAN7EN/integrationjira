"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Sparkles, ChevronDown, Copy, CheckCircle, Loader2 } from "lucide-react"
import type { AISuggestion } from "@/types"

interface AISuggestionsGherkinProps {
  suggestions: AISuggestion[]
  onApplySuggestion?: (suggestion: AISuggestion) => void
  isApplying?: boolean
}

export function AISuggestionsGherkin({
  suggestions,
  onApplySuggestion,
  isApplying = false,
}: AISuggestionsGherkinProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Gherkin Structure":
        return "bg-blue-100 text-blue-800"
      case "Acceptance Criteria":
        return "bg-green-100 text-green-800"
      case "Edge Cases":
        return "bg-yellow-100 text-yellow-800"
      case "Security":
        return "bg-red-100 text-red-800"
      case "Usability":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <Sparkles className="w-5 h-5 text-purple-500" />
        <h3 className="text-lg font-semibold">Sugerencias de IA para Gherkin</h3>
      </div>

      {suggestions.map((suggestion) => (
        <Card key={suggestion.id} className="relative">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Badge className={getCategoryColor(suggestion.category)}>{suggestion.category}</Badge>
                <Badge variant={suggestion.priority === "High" ? "destructive" : "secondary"} className="text-xs">
                  {suggestion.priority}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {Math.round(suggestion.confidence * 100)}% confianza
                </span>
              </div>
              {onApplySuggestion && (
                <Button variant="outline" size="sm" onClick={() => onApplySuggestion(suggestion)} disabled={isApplying}>
                  {isApplying ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  {isApplying ? "Aplicando..." : "Aplicar"}
                </Button>
              )}
            </div>
            <CardTitle className="text-base">{suggestion.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">{suggestion.description}</p>

            {(suggestion.gherkin || suggestion.suggestedGherkin) && (
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                    <span className="text-sm font-medium">Ver Gherkin sugerido</span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3">
                  <div className="relative">
                    {(() => {
                      const gherkin = suggestion.gherkin ?? suggestion.suggestedGherkin;
                      const content = Array.isArray(gherkin) ? gherkin.join("\n") : gherkin ?? "";
                      return (
                        <pre className="bg-gray-50 p-4 rounded-lg text-xs font-mono overflow-x-auto border max-h-96 overflow-y-auto">
                          <code className="whitespace-pre-wrap break-words">{content}</code>
                        </pre>
                      );
                    })()}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        const gherkin = suggestion.gherkin ?? suggestion.suggestedGherkin;
                        const text = Array.isArray(gherkin) ? gherkin.join("\n") : gherkin ?? "";
                        copyToClipboard(text);
                      }}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            {suggestion.gherkinAnalysis && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <h5 className="text-sm font-medium mb-2">Análisis detallado:</h5>
                <div className="space-y-1 text-xs">
                  <div>Escenarios analizados: {suggestion.gherkinAnalysis.scenarios.length}</div>
                  <div>Problemas encontrados: {suggestion.gherkinAnalysis.issues.length}</div>
                  <div>Estado: {suggestion.gherkinAnalysis.isValidGherkin ? "✅ Válido" : "⚠️ Necesita mejoras"}</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {suggestions.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No hay sugerencias disponibles</p>
            <p className="text-sm text-muted-foreground mt-2">
              Selecciona una historia de usuario para obtener sugerencias de mejora
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
