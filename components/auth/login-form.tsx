"use client"
import { useState } from "react"
import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useStore } from "@/stores/useStore"
import { Loader2 } from "lucide-react"
import InstrumElecLogo from "@/components/ui/instrumelec-logo"

export default function LoginForm() {
  const { login, isLoading, error } = useStore()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [validationError, setValidationError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError("")

    if (!email || !password) {
      setValidationError("Tous les champs sont requis")
      return
    }

    if (!email.includes("@")) {
      setValidationError("Email invalide")
      return
    }

    await login(email, password)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat relative" 
         style={{
           backgroundImage: "url('/technical-equipment-bg.jpg')",
           backgroundSize: 'cover',
           backgroundPosition: 'center',
           backgroundRepeat: 'no-repeat'
         }}>
      {/* Overlay pour améliorer la lisibilité */}
      <div className="absolute inset-0 bg-black bg-opacity-40"></div>
      <Card className="w-full max-w-md bg-gray-50 border-gray-200 relative z-10 shadow-2xl">
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center mb-4">
            <InstrumElecLogo size="md" />
          </div>
        </CardHeader>
        <CardContent className="bg-white rounded-lg mx-4 mb-4 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                Adresse email
              </label>
              <input
                id="email"
                type="email"
                placeholder="votre.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex h-11 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex h-11 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {(error || validationError) && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
                {error || validationError}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 bg-green-600 hover:bg-green-700 text-white font-medium"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Se connecter
            </Button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-md border border-blue-200">
            <p className="font-medium mb-3 text-blue-800 text-sm">Comptes de test :</p>
            <div className="space-y-2 text-xs text-blue-700">
              <div className="grid grid-cols-2 gap-2">
                <p>
                  <strong>SuperAdmin:</strong>
                </p>
                <p>admin@example.com</p>
                <p>
                  <strong>Technicien:</strong>
                </p>
                <p>jean.dupont@example.com</p>
                <p>
                  <strong>Conducteur:</strong>
                </p>
                <p>pierre.martin@example.com</p>
                <p>
                  <strong>QHSE:</strong>
                </p>
                <p>marie.durand@example.com</p>
                <p>
                  <strong>Appro:</strong>
                </p>
                <p>paul.bernard@example.com</p>
                <p>
                  <strong>Chargé Affaire:</strong>
                </p>
                <p>sophie.moreau@example.com</p>
              </div>
              <p className="text-center pt-2 border-t border-blue-200">
                <strong>Mot de passe:</strong> password
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
