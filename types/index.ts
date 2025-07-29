export interface JiraIssue {
  key: string
  summary: string
  description: string
  issueType: string
  status: string
  priority: string
  assignee: string
  reporter: string
  created: string
  updated: string
  storyPoints: number
  labels: string[]
  components: string[]
  // Campos específicos para Gherkin
  userStory?: string
  acceptanceCriteria: GherkinScenario[]
  background?: string
}

export interface GherkinScenario {
  id: string
  title: string
  given: string[]
  when: string[]
  then: string[]
  and?: string[]
  but?: string[]
  tags?: string[]
}

export interface GherkinAnalysis {
  isValidGherkin: boolean
  scenarios: GherkinScenario[]
  issues: GherkinIssue[]
  suggestions: GherkinSuggestion[]
}

export interface GherkinIssue {
  type: "missing_given" | "missing_when" | "missing_then" | "unclear_step" | "duplicate_scenario"
  message: string
  scenarioId?: string
  stepIndex?: number
}

export interface GherkinSuggestion {
  type: "improve_step" | "add_scenario" | "split_scenario" | "add_examples"
  message: string
  originalStep?: string
  suggestedStep?: string
  scenarioId?: string
}

export interface AISuggestion {
  id: string
  title: string
  description: string
  category:
    | "Gherkin Structure"
    | "Acceptance Criteria"
    | "User Story Format"
    | "Edge Cases"
    | "Performance"
    | "Security"
    | "Usability"
  priority: "Low" | "Medium" | "High"
  confidence: number
  gherkin?: string | string[];
  gherkinAnalysis?: GherkinAnalysis
  suggestedGherkin?: string
}

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  jiraInstance: string
}

export interface AuthConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  scope: string[]
}
