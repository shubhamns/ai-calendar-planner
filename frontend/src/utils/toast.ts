import { toast } from "sonner"
import { apiError } from "@/utils/errors"

export function toastSuccess(message: string) {
  toast.success(message)
}

export function toastError(error: unknown, fallback: string) {
  toast.error(apiError(error, fallback))
}
