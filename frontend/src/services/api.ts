import axios from "axios"
import { API_URL } from "@/utils/constants"
import { ensureUtcIso } from "@/utils/datetime"
import { useAuthStore } from "@/store/authStore"
import type { AIPlanResponse, CalendarEvent, CalendarStats, EventInput, User } from "@/types/api"

const client = axios.create({ baseURL: API_URL })

const normalizeEvent = (event: CalendarEvent): CalendarEvent => ({
  ...event,
  start_time: ensureUtcIso(event.start_time),
  end_time: ensureUtcIso(event.end_time),
})

client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

client.interceptors.response.use(
  (res) => res,
  (err: unknown) => {
    if (axios.isAxiosError(err) && err.response?.status === 401) useAuthStore.getState().logout()
    if (err instanceof Error) return Promise.reject(err)
    return Promise.reject(new Error("Request failed", { cause: err }))
  }
)

export const authApi = {
  register: (body: { email: string; password: string; full_name: string }) =>
    client.post<User>("/auth/register", body).then((r) => r.data),
  login: (body: { email: string; password: string }) =>
    client.post<{ access_token: string }>("/auth/login", body).then((r) => r.data.access_token),
  me: () => client.get<User>("/auth/me").then((r) => r.data),
}

export const eventsApi = {
  stats: () => client.get<CalendarStats>("/calendar/stats").then((r) => r.data),
  list: (start: string, end: string) =>
    client.get<CalendarEvent[]>("/calendar/events", { params: { start, end } }).then((r) => r.data.map(normalizeEvent)),
  create: (body: EventInput) => client.post<CalendarEvent>("/calendar/events", body).then((r) => normalizeEvent(r.data)),
  update: (id: number, body: Partial<EventInput>) =>
    client.put<CalendarEvent>(`/calendar/events/${String(id)}`, body).then((r) => normalizeEvent(r.data)),
  delete: (id: number) => client.delete(`/calendar/events/${String(id)}`),
}

export const aiApi = {
  plan: (prompt: string) => client.post<AIPlanResponse>("/ai/plan", { prompt }).then((r) => r.data),
}
