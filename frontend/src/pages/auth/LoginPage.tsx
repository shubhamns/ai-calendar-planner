import { Link, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authApi } from "@/services/api"
import { useAuthStore } from "@/store/authStore"
import { loginSchema, type LoginFormValues } from "@/utils/authSchemas"
import { apiError } from "@/utils/errors"

export function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })
  const login = useMutation({
    mutationFn: authApi.login,
    onSuccess: (token) => {
      useAuthStore.setState({ token })
      void authApi.me().then((user) => {
        setAuth(token, user)
        void navigate("/app")
      })
    },
  })
  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-4 safe-pb">
      <Card className="panel w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              void form.handleSubmit((data) => { login.mutate(data) })(e)
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
              {form.formState.errors.email && <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" autoComplete="current-password" {...form.register("password")} />
              {form.formState.errors.password && <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>}
            </div>
            {login.isError && <p className="text-sm text-destructive">{apiError(login.error, "Wrong email or password")}</p>}
            <Button type="submit" className="w-full" disabled={login.isPending}>
              {login.isPending ? "Signing in..." : "Sign in"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Need an account? <Link to="/register" className="text-primary hover:underline">Register</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
