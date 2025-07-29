import { NextResponse } from "next/server"
import { JiraServiceReal } from "@/lib/jira-service-real"

export async function GET() {
  try {
    const userData = await JiraServiceReal.testConnection() // Ahora devuelve User | null
    if (userData) {
      return NextResponse.json({ success: true, user: userData }) // Devuelve los datos del usuario
    } else {
      return NextResponse.json(
        { success: false, message: "Error de conexión con Jira o credenciales inválidas." },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("Error en API Route /api/jira/proxy/myself:", error)
    return NextResponse.json({ error: error.message || "Failed to test connection via proxy" }, { status: 500 })
  }
}
