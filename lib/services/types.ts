export type ActivityType = {
  id: string
  name: string
  colorTheme: string
}

export type Task = {
  id: string
  title: string
  description: string
  start: Date
  end: Date
  color: string
  priority: "Alta" | "Média" | "Baixa"
  type: string

  // Optional / Specific fields derived from event_type differences
  status?: string
  location?: string
  eventType?: string
  steps?: { id: string | number; text: string; done: boolean }[]
  projectId?: string | null
  hasTime?: boolean
  activityTypeId?: string | null
}
