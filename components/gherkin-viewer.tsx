"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Copy, Edit, Plus, CheckCircle, AlertTriangle } from "lucide-react"
import type { GherkinScenario, GherkinAnalysis } from "@/types"

interface GherkinViewerProps {
  scenarios: GherkinScenario[]
  analysis?: GherkinAnalysis
  onEditScenario?: (scenario: GherkinScenario) => void
  onAddScenario?: () => void
  onScenariosChange?: (scenarios: GherkinScenario[]) => void
  hasChanges?: boolean
}

export function GherkinViewer({
  scenarios,
  analysis,
  onEditScenario,
  onAddScenario,
  onScenariosChange,
  hasChanges = false,
}: GherkinViewerProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const formatScenarioAsText = (scenario: GherkinScenario): string => {
    let text = `Escenario: ${scenario.title}\n`

    scenario.given.forEach((step) => {
      text += `  Dado que ${step}\n`
    })

    scenario.when.forEach((step, index) => {
      const prefix = index === 0 ? "  Cuando " : "  Y "
      text += `${prefix}${step}\n`
    })

    scenario.then.forEach((step, index) => {
      const prefix = index === 0 ? "  Entonces " : "  Y "
      text += `${prefix}${step}\n`
    })

    if (scenario.and) {
      scenario.and.forEach((step) => {
        text += `  Y ${step}\n`
      })
    }

    if (scenario.but) {
      scenario.but.forEach((step) => {
        text += `  Pero ${step}\n`
      })
    }

    return text
  }

  return (
    <div className="space-y-4">
      {/* Analysis Summary */}
      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {analysis.isValidGherkin ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
              )}
              <span>Análisis Gherkin</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Escenarios válidos:</span>
                <Badge variant={analysis.isValidGherkin ? "default" : "secondary"}>{analysis.scenarios.length}</Badge>
              </div>
              {analysis.issues.length > 0 && (
                <div>
                  <span className="text-sm font-medium">Problemas encontrados:</span>
                  <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                    {analysis.issues.map((issue, index) => (
                      <li key={index}>• {issue.message}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scenarios */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold">Criterios de Aceptación (Gherkin)</h3>
            {hasChanges && (
              <Badge variant="secondary" className="text-xs">
                Cambios pendientes
              </Badge>
            )}
          </div>
          {onAddScenario && (
            <Button variant="outline" size="sm" onClick={onAddScenario}>
              <Plus className="w-4 h-4 mr-2" />
              Agregar Escenario
            </Button>
          )}
        </div>

        {scenarios.map((scenario) => (
          <Card key={scenario.id} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{scenario.title}</CardTitle>
                <div className="flex items-center space-x-2">
                  {scenario.tags && (
                    <div className="flex space-x-1">
                      {scenario.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(formatScenarioAsText(scenario))}>
                    <Copy className="w-4 h-4" />
                  </Button>
                  {onEditScenario && (
                    <Button variant="ghost" size="sm" onClick={() => onEditScenario(scenario)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 font-mono text-sm">
                {/* Given steps */}
                {scenario.given.map((step, index) => (
                  <div key={`given-${index}`} className="flex">
                    <span className="text-blue-600 font-semibold w-24 flex-shrink-0 text-xs">
                      {index === 0 ? "Dado que" : "Y"}
                    </span>
                    <span className="text-gray-700 text-xs leading-relaxed">{step}</span>
                  </div>
                ))}

                {/* When steps */}
                {scenario.when.map((step, index) => (
                  <div key={`when-${index}`} className="flex">
                    <span className="text-orange-600 font-semibold w-24 flex-shrink-0 text-xs">
                      {index === 0 ? "Cuando" : "Y"}
                    </span>
                    <span className="text-gray-700 text-xs leading-relaxed">{step}</span>
                  </div>
                ))}

                {/* Then steps */}
                {scenario.then.map((step, index) => (
                  <div key={`then-${index}`} className="flex">
                    <span className="text-green-600 font-semibold w-24 flex-shrink-0 text-xs">
                      {index === 0 ? "Entonces" : "Y"}
                    </span>
                    <span className="text-gray-700 text-xs leading-relaxed">{step}</span>
                  </div>
                ))}

                {/* And steps */}
                {scenario.and?.map((step, index) => (
                  <div key={`and-${index}`} className="flex">
                    <span className="text-purple-600 font-semibold w-20 flex-shrink-0">Y</span>
                    <span className="text-gray-700">{step}</span>
                  </div>
                ))}

                {/* But steps */}
                {scenario.but?.map((step, index) => (
                  <div key={`but-${index}`} className="flex">
                    <span className="text-red-600 font-semibold w-20 flex-shrink-0">Pero</span>
                    <span className="text-gray-700">{step}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        {scenarios.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No hay criterios de aceptación definidos</p>
              {onAddScenario && (
                <Button variant="outline" className="mt-4 bg-transparent" onClick={onAddScenario}>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear primer escenario
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
