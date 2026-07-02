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
import { registerSchema, type RegisterFormValues } from "@/utils/authSchemas"
import { apiError } from "@/utils/errors"

export function RegisterPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { full_name: "", email: "", password: "" },
  })
  const signup = useMutation({
    mutationFn: async (data: RegisterFormValues) => {
      await authApi.register(data)
      const token = await authApi.login({ email: data.email, password: data.password })
      useAuthStore.setState({ token })
      return { token, user: await authApi.me() }
    },
    onSuccess: ({ token, user }) => {
      setAuth(token, user)
      void navigate("/app")
    },
  })
  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-4 safe-pb">
      <Card className="panel w-full max-w-sm">
        <CardHeader>
          <CardTitle>Register</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              void form.handleSubmit((data) => { signup.mutate(data) })(e)
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" autoComplete="name" {...form.register("full_name")} />
              {form.formState.errors.full_name && <p className="text-sm text-destructive">{form.formState.errors.full_name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
              {form.formState.errors.email && <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" autoComplete="new-password" {...form.register("password")} />
              {form.formState.errors.password && <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>}
            </div>
            {signup.isError && <p className="text-sm text-destructive">{apiError(signup.error, "Could not create account")}</p>}
            <Button type="submit" className="w-full" disabled={signup.isPending}>
              {signup.isPending ? "Creating..." : "Create account"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already registered? <Link to="/login" className="text-primary hover:underline">Sign in</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
