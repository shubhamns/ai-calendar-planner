import type { CalendarEvent } from "@/types/api"
import { datetimeLocalToMs, pickerValueToIso, toFormDatetime } from "@/utils/datetime"

export type EventFormState = {
  title: string
  description: string
  location: string
  start_time: string
  end_time: string
}

export function blankEventForm(start = new Date(), end = new Date(start.getTime() + 3600000)): EventFormState {
  return {
    title: "",
    description: "",
    location: "",
    start_time: toFormDatetime(start.toISOString()),
    end_time: toFormDatetime(end.toISOString()),
  }
}

export function eventToForm(event: CalendarEvent): EventFormState {
  return {
    title: event.title,
    description: event.description ?? "",
    location: event.location ?? "",
    start_time: toFormDatetime(event.start_time),
    end_time: toFormDatetime(event.end_time),
  }
}

export function formToPayload(form: EventFormState) {
  return {
    title: form.title.trim(),
    description: form.description.trim() || null,
    location: form.location.trim() || null,
    start_time: pickerValueToIso(form.start_time),
    end_time: pickerValueToIso(form.end_time),
  }
}

export function eventTimeError(start_time: string, end_time: string): string | null {
  const start = datetimeLocalToMs(start_time)
  const end = datetimeLocalToMs(end_time)
  if (Number.isNaN(start) || Number.isNaN(end)) return "Enter a valid date and time"
  if (end <= start) return "End must be after start"
  return null
}
