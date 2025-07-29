import { type NextRequest, NextResponse } from "next/server"
import { JiraServiceReal } from "@/lib/jira-service-real"

export async function GET(request: NextRequest, { params }: { params: { issueKey: string } }) {
  try {
    const issue = await JiraServiceReal.getIssue(params.issueKey)
    return NextResponse.json(issue)
  } catch (error: any) {
    console.error("Error en API Route /api/jira/proxy/[issueKey]:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch issue via proxy" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { issueKey: string } }) {
  try {
    const updates = await request.json()
    // Aquí necesitarías una forma de pasar las appliedSuggestions si las usas en el PUT
    // Por simplicidad, solo pasamos las actualizaciones directas por ahora
    const updatedIssue = await JiraServiceReal.updateIssueWithSuggestions(params.issueKey, updates, []) // Asume [] para suggestions
    return NextResponse.json(updatedIssue)
  } catch (error: any) {
    console.error("Error en API Route /api/jira/proxy/[issueKey] PUT:", error)
    return NextResponse.json({ error: error.message || "Failed to update issue via proxy" }, { status: 500 })
  }
}
