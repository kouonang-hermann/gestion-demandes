"use client"

import { useStore } from "@/stores/useStore"
import LoginForm from "@/components/auth/login-form"
import Navbar from "@/components/layout/navbar"
import Dashboard from "@/components/dashboard/dashboard"

export default function HomePage() {
  const { isAuthenticated } = useStore()

  if (!isAuthenticated) {
    return <LoginForm />
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Dashboard />
    </div>
  )
}
