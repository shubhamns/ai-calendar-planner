import { Link, Navigate } from "react-router-dom"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MainLayout } from "@/components/layout/MainLayout"
import { APP_NAME } from "@/utils/constants"
import { useAuthStore } from "@/store/authStore"

export function HomePage() {
  const token = useAuthStore((s) => s.token)
  if (token) return <Navigate to="/app" replace />
  return (
    <MainLayout minimal>
      <section className="mx-auto max-w-2xl py-12 text-center sm:py-20">
        <h1 className="text-3xl font-semibold sm:text-4xl">{APP_NAME}</h1>
        <p className="mx-auto mt-4 max-w-md text-muted-foreground">
          Keep events in one place and ask AI for help when your week gets messy.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button size="lg" className="rounded-lg" asChild>
            <Link to="/register">
              Create account
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="rounded-lg" asChild>
            <Link to="/login">Sign in</Link>
          </Button>
        </div>
        <ul className="mt-12 space-y-3 text-left text-sm text-muted-foreground sm:mx-auto sm:max-w-sm">
          <li>Month, week, and day calendar views</li>
          <li>Quick add / edit with drag and resize</li>
          <li>Built-in planner that reads your events</li>
        </ul>
      </section>
    </MainLayout>
  )
}
