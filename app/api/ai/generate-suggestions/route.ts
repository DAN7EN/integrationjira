import { type NextRequest, NextResponse } from "next/server"
import { CloudflareAIService } from "@/lib/cloudflare-ai-service"
import { AIService } from "@/lib/ai-service" // Para el fallback mock
import { config } from "@/lib/config" // Para verificar si Cloudflare está configurado

export async function POST(request: NextRequest) {
  console.log("✅ [API Route] /api/ai/generate-suggestions - Petición recibida.")
  try {
    const { issue, files, knowledge } = await request.json()

    let suggestions

    if (config.cloudflare.isConfigured()) {
      console.log("🤖 [API Route] Generando sugerencias con Cloudflare AI Gateway...")
      suggestions = await CloudflareAIService.generateSuggestions(issue, { files, knowledge })
    } else {
      console.warn("⚠️ [API Route] Cloudflare AI Gateway no configurado. Usando sugerencias mock.")
      // Usar el servicio mock como fallback si Cloudflare AI Gateway no está configurado
      AIService.setContextFiles(files || [])
      AIService.setKnowledgeBase(knowledge || [])
      suggestions = await AIService.generateSuggestions(issue)
    }

    return NextResponse.json({ suggestions })
  } catch (error: any) {
    console.error("❌ [API Route] Error generando sugerencias de IA:", error)
    return NextResponse.json({ error: error.message || "Failed to generate AI suggestions" }, { status: 500 })
  }
}
