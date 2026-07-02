const pad = (n: number) => String(n).padStart(2, "0")
const FORM_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/

export function ensureUtcIso(value: string) {
  if (!value) return value
  if (value.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(value)) return value
  return `${value}Z`
}

export function toFormDatetime(value: string) {
  if (!value) return ""
  if (FORM_RE.test(value)) return value
  const d = new Date(ensureUtcIso(value))
  if (Number.isNaN(d.getTime())) return ""
  return `${String(d.getFullYear())}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function parseDatetimeLocal(value: string) {
  const local = toFormDatetime(value)
  const [datePart, timePart = "00:00"] = local.split("T")
  const [y, mo, d] = datePart.split("-").map(Number)
  const [h, mi] = timePart.split(":").map(Number)
  return new Date(y, mo - 1, d, h, mi, 0, 0).toISOString()
}

export function datetimeLocalToMs(value: string) {
  const local = toFormDatetime(value)
  const [datePart, timePart = "00:00"] = local.split("T")
  const [y, mo, d] = datePart.split("-").map(Number)
  const [h, mi] = timePart.split(":").map(Number)
  return new Date(y, mo - 1, d, h, mi, 0, 0).getTime()
}

export function pickerValueToIso(local: string) {
  return parseDatetimeLocal(local)
}

export function splitDatetimeLocal(value: string) {
  const local = toFormDatetime(value)
  if (!local) return { date: undefined as Date | undefined, time: "09:00" }
  const [datePart, timePart = "09:00"] = local.split("T")
  const [y, mo, d] = datePart.split("-").map(Number)
  const [h, mi] = timePart.split(":").map(Number)
  if ([y, mo, d].some(Number.isNaN)) return { date: undefined, time: "09:00" }
  const time = Number.isNaN(h) || Number.isNaN(mi) ? "09:00" : `${pad(h)}:${pad(mi)}`
  return { date: new Date(y, mo - 1, d), time }
}

export function applyDateToDatetimeLocal(value: string, date: Date) {
  const { time } = splitDatetimeLocal(value)
  return `${String(date.getFullYear())}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${time}`
}

export function applyTimeToDatetimeLocal(value: string, time: string) {
  const { date } = splitDatetimeLocal(value)
  const base = date ?? new Date()
  return `${String(base.getFullYear())}-${pad(base.getMonth() + 1)}-${pad(base.getDate())}T${time}`
}

export function addHoursToDatetimeLocal(value: string, hours: number) {
  return toFormDatetime(new Date(datetimeLocalToMs(value) + hours * 3600000).toISOString())
}
