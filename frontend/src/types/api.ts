export interface User {
  id: number
  email: string
  full_name: string
}

export interface CalendarEvent {
  id: number
  title: string
  description: string | null
  location: string | null
  start_time: string
  end_time: string
}

export interface CalendarStats {
  events_today: number
  events_upcoming: number
}

export interface EventInput {
  title: string
  description?: string | null
  location?: string | null
  start_time: string
  end_time: string
}

export interface AIPlanResponse {
  response: string
  prompts_remaining: number
}
