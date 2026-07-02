import { createBrowserRouter } from "react-router-dom"
import { ProtectedRoute } from "@/components/common/ProtectedRoute"
import { HomePage } from "@/pages/HomePage"
import { AppPage } from "@/pages/AppPage"
import { NotFoundPage } from "@/pages/NotFoundPage"
import { LoginPage } from "@/pages/auth/LoginPage"
import { RegisterPage } from "@/pages/auth/RegisterPage"

export const router = createBrowserRouter([
  { path: "/", element: <HomePage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/app", element: <ProtectedRoute><AppPage /></ProtectedRoute> },
  { path: "*", element: <NotFoundPage /> },
])
