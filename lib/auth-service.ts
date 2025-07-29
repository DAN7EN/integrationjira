export class AuthService {
  static async login(): Promise<any> {
    // En producción, aquí implementarías OAuth con Jira
    // const response = await fetch('/api/auth/jira', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    // })

    // Simulamos login exitoso
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const mockUser = {
      id: "user123",
      name: "Juan Desarrollador",
      email: "juan@empresa.com",
      avatar: "/placeholder.svg?height=32&width=32",
      jiraInstance: "empresa.atlassian.net",
    }

    localStorage.setItem("jira_user", JSON.stringify(mockUser))
    return mockUser
  }

  static logout(): void {
    localStorage.removeItem("jira_user")
  }

  static getCurrentUser(): any {
    if (typeof window === "undefined") return null

    const userData = localStorage.getItem("jira_user")
    return userData ? JSON.parse(userData) : null
  }

  static async refreshToken(): Promise<string> {
    // Implementar refresh de token OAuth
    return "new_access_token"
  }
}
