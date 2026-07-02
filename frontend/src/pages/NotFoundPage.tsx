import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-4 safe-pb">
      <Card className="panel w-full max-w-sm text-center">
        <CardHeader>
          <CardTitle className="text-4xl">404</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">That page does not exist.</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button variant="outline" onClick={() => { void navigate(-1) }}>Back</Button>
            <Button asChild><Link to="/">Home</Link></Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
