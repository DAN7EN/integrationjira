import { type NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/auth-service"

export async function POST(request: NextRequest) {
  try {
    // En producción, aquí manejarías el flujo OAuth con Jira
    const user = await AuthService.login()
    return NextResponse.json({ user })
  } catch (error) {
    return NextResponse.json({ error: "Authentication failed" }, { status: 401 })
  }
}

export async function DELETE() {
  try {
    AuthService.logout()
    return NextResponse.json({ message: "Logged out successfully" })
  } catch (error) {
    return NextResponse.json({ error: "Logout failed" }, { status: 500 })
  }
}
