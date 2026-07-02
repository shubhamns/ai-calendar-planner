import { Link } from "react-router-dom"
import { CalendarDays, LogOut } from "lucide-react"
import { APP_NAME } from "@/utils/constants"
import { ThemeToggle } from "@/components/common/ThemeToggle"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/store/authStore"

export function MainLayout({ children, minimal = false }: { children: React.ReactNode; minimal?: boolean }) {
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <header className="sticky top-0 z-50 border-b bg-card/90 pt-[env(safe-area-inset-top)] backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to={token ? "/app" : "/"} className="flex items-center gap-2 font-medium">
            <CalendarDays className="h-5 w-5 text-primary" />
            <span className="truncate">{APP_NAME}</span>
          </Link>
          <div className="flex items-center gap-2">
            {!minimal && token && user && (
              <>
                <span className="hidden text-sm text-muted-foreground md:inline">{user.full_name}</span>
                <Button variant="ghost" size="icon" onClick={logout} aria-label="Log out">
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            )}
            {!token && !minimal && (
              <>
                <Button variant="ghost" size="sm" className="hidden sm:inline-flex" asChild><Link to="/login">Sign in</Link></Button>
                <Button size="sm" asChild><Link to="/register">Register</Link></Button>
              </>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 safe-pb sm:px-6">{children}</main>
    </div>
  )
}
