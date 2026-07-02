import { useEffect, useState } from "react"
import { Toaster as Sonner } from "sonner"
import { useThemeStore } from "@/store/themeStore"

export function Toaster() {
  const theme = useThemeStore((s) => s.theme)
  const [resolved, setResolved] = useState<"light" | "dark">("light")
  useEffect(() => {
    const apply = () => {
      if (theme === "system") {
        setResolved(window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
        return
      }
      setResolved(theme)
    }
    apply()
    if (theme !== "system") return
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const onChange = () => { apply() }
    mq.addEventListener("change", onChange)
    return () => { mq.removeEventListener("change", onChange) }
  }, [theme])
  return <Sonner theme={resolved} position="top-right" richColors closeButton />
}
