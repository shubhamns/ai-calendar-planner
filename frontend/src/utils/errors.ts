import axios from "axios"

type ValidationIssue = { msg: string }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isValidationIssue(value: unknown): value is ValidationIssue {
  return isRecord(value) && typeof value.msg === "string"
}

function readDetail(data: unknown): string | ValidationIssue[] | undefined {
  if (!isRecord(data) || !("detail" in data)) return undefined
  const detail: unknown = data.detail
  if (typeof detail === "string") return detail
  if (Array.isArray(detail) && detail.every(isValidationIssue)) return detail
  return undefined
}

export function apiError(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) return fallback
  const body: unknown = error.response?.data
  const detail = readDetail(body)
  if (typeof detail === "string") return detail
  if (Array.isArray(detail)) return detail.map((row) => row.msg).join(", ")
  return fallback
}
