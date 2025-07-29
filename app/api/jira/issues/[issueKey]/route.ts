import { type NextRequest, NextResponse } from "next/server"
import { JiraService } from "@/lib/jira-service"

export async function GET(request: NextRequest, { params }: { params: { issueKey: string } }) {
  try {
    const issue = await JiraService.getIssue(params.issueKey)
    return NextResponse.json(issue)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch issue" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { issueKey: string } }) {
  try {
    const updates = await request.json()
    const updatedIssue = await JiraService.updateIssue(params.issueKey, updates)
    return NextResponse.json(updatedIssue)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update issue" }, { status: 500 })
  }
}
