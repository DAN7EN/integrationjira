import { type NextRequest, NextResponse } from "next/server"
import { AIService } from "@/lib/ai-service"

export async function POST(request: NextRequest) {
  try {
    const { issue } = await request.json()
    const suggestions = await AIService.generateSuggestions(issue)
    return NextResponse.json({ suggestions })
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate suggestions" }, { status: 500 })
  }
}
