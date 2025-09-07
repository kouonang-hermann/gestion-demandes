"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useStore } from "@/stores/useStore"
import { Loader2, X } from "lucide-react"

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function CreateProjectModal({ isOpen, onClose }: CreateProjectModalProps) {
  const { createProjet, users, loadUsers, isLoading } = useStore()
  const [formData, setFormData] = useState({
    nom: "",
    description: "",
    dateDebut: "",
    dateFin: "",
    utilisateurs: [] as string[],
  })
  const [error, setError] = useState("")

  useEffect(() => {
    if (isOpen) {
      loadUsers()
    }
  }, [isOpen, loadUsers])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.nom || !formData.description || !formData.dateDebut) {
      setError("Nom, description et date de début sont requis")
      return
    }

    if (formData.dateFin && new Date(formData.dateFin) <= new Date(formData.dateDebut)) {
      setError("La date de fin doit être postérieure à la date de début")
      return
    }

    const success = await createProjet(formData)
    if (success) {
      onClose()
      setFormData({
        nom: "",
        description: "",
        dateDebut: "",
        dateFin: "",
        utilisateurs: [],
      })
    }
  }

  const toggleUser = (userId: string) => {
    setFormData((prev) => ({
      ...prev,
      utilisateurs: prev.utilisateurs.includes(userId)
        ? prev.utilisateurs.filter((id) => id !== userId)
        : [...prev.utilisateurs, userId],
    }))
  }

  const removeUser = (userId: string) => {
    setFormData((prev) => ({
      ...prev,
      utilisateurs: prev.utilisateurs.filter((id) => id !== userId),
    }))
  }

  const getSelectedUsers = () => {
    return users.filter((user) => formData.utilisateurs.includes(user.id))
  }

  const getAvailableUsers = () => {
    return users.filter((user) => !formData.utilisateurs.includes(user.id) && user.role !== "superadmin")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Créer un nouveau projet</DialogTitle>
          <DialogDescription>Ajoutez un nouveau projet et assignez des utilisateurs</DialogDescription>
        </DialogHeader>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="nom" className="block text-sm font-medium mb-2">
                  Nom du projet *
                </label>
                <input
                  id="nom"
                  type="text"
                  value={formData.nom}
                  onChange={(e) => setFormData((prev) => ({ ...prev, nom: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Nom du projet"
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-2">
                  Description *
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Description du projet"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="dateDebut" className="block text-sm font-medium mb-2">
                    Date de début *
                  </label>
                  <input
                    id="dateDebut"
                    type="date"
                    value={formData.dateDebut}
                    onChange={(e) => setFormData((prev) => ({ ...prev, dateDebut: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="dateFin" className="block text-sm font-medium mb-2">
                    Date de fin (optionnelle)
                  </label>
                  <input
                    id="dateFin"
                    type="date"
                    value={formData.dateFin}
                    onChange={(e) => setFormData((prev) => ({ ...prev, dateFin: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>
              </div>

              {/* Utilisateurs sélectionnés */}
              {getSelectedUsers().length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-2">Utilisateurs assignés</label>
                  <div className="flex flex-wrap gap-2">
                    {getSelectedUsers().map((user) => (
                      <Badge key={user.id} variant="secondary" className="flex items-center gap-1">
                        {user.prenom} {user.nom}
                        <button
                          type="button"
                          onClick={() => removeUser(user.id)}
                          className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Utilisateurs disponibles */}
              <div>
                <label className="block text-sm font-medium mb-2">Ajouter des utilisateurs</label>
                <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-2">
                  {getAvailableUsers().length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">Tous les utilisateurs sont assignés</p>
                  ) : (
                    getAvailableUsers().map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                        onClick={() => toggleUser(user.id)}
                      >
                        <div>
                          <p className="font-medium">
                            {user.prenom} {user.nom}
                          </p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                        <Badge variant="outline">{user.role}</Badge>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">{error}</div>
              )}

              <div className="flex justify-end space-x-4 pt-4">
                <Button type="button" variant="outline" onClick={onClose}>
                  Annuler
                </Button>
                <Button type="submit" disabled={isLoading} className="bg-green-600 hover:bg-green-700">
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Créer le projet
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
}
