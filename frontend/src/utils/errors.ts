import axios from "axios"

type ValidationIssue = { msg: string }
type ApiErrorBody = { detail?: string | ValidationIssue[] }

function readDetail(data: unknown): string | ValidationIssue[] | undefined {
  if (typeof data !== "object" || data === null || !("detail" in data)) return undefined
  const detail = (data as ApiErrorBody).detail
  if (typeof detail === "string" || Array.isArray(detail)) return detail
  return undefined
}

export function apiError(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) return fallback
  const detail = readDetail(error.response?.data)
  if (typeof detail === "string") return detail
  if (Array.isArray(detail)) {
    return detail.map((row) => row.msg).join(", ")
  }
  return fallback
}
