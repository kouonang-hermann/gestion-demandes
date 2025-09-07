"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useStore } from "@/stores/useStore"
import { Plus, Trash2, Save } from 'lucide-react'
import type { Demande, ItemDemande, DemandeType } from "@/types"

interface DemandeFormModalProps {
  isOpen: boolean
  onClose: () => void
  demande?: Demande | null
  mode: "create" | "edit"
  type?: DemandeType
}

interface ManualItem {
  id: string
  nom: string
  description: string
  reference: string
  unite: string
  quantiteDemandee: number
  commentaire: string
}

interface FormData {
  projetId: string
  type: DemandeType
  items: ManualItem[]
  commentaires: string
}

export default function DemandeFormModal({ isOpen, onClose, demande, mode, type = "materiel" }: DemandeFormModalProps) {
  const { currentUser, projets, loadProjets, createDemande, updateDemande, isLoading } = useStore()
  
  const [formData, setFormData] = useState<FormData>({
    projetId: "",
    type: type,
    items: [],
    commentaires: "",
  })
  
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (isOpen) {
      loadProjets()
      
      if (mode === "edit" && demande) {
        // Convertir les items de la demande en items manuels
        const manualItems: ManualItem[] = demande.items.map(item => ({
          id: item.id,
          nom: item.article?.nom || "",
          description: item.article?.description || "",
          reference: item.article?.reference || "",
          unite: item.article?.unite || "pièce",
          quantiteDemandee: item.quantiteDemandee,
          commentaire: item.commentaire || "",
        }))

        setFormData({
          projetId: demande.projetId,
          type: demande.type,
          items: manualItems,
          commentaires: demande.commentaires || "",
        })
      } else {
        // Mode création
        setFormData({
          projetId: currentUser?.projets?.[0] || "",
          type: type,
          items: [],
          commentaires: "",
        })
      }
    }
  }, [isOpen, demande, mode, type, currentUser, loadProjets])

  const addNewItem = () => {
    const newItem: ManualItem = {
      id: Date.now().toString(),
      nom: "",
      description: "",
      reference: "",
      unite: "pièce",
      quantiteDemandee: 1,
      commentaire: "",
    }

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem],
    }))
  }

  const updateItem = (itemId: string, field: keyof ManualItem, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === itemId ? { ...item, [field]: value } : item
      ),
    }))
  }

  const removeItem = (itemId: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId),
    }))
  }

  const validateForm = (): boolean => {
    setError("")

    if (!formData.projetId) {
      setError("Veuillez sélectionner un projet")
      return false
    }

    if (formData.items.length === 0) {
      setError("Veuillez ajouter au moins un article")
      return false
    }

    for (const item of formData.items) {
      if (!item.nom.trim()) {
        setError("Tous les articles doivent avoir un nom")
        return false
      }
      if (!item.reference.trim()) {
        setError("Tous les articles doivent avoir une référence")
        return false
      }
      if (!item.unite.trim()) {
        setError("Tous les articles doivent avoir une unité")
        return false
      }
      if (item.quantiteDemandee <= 0) {
        setError("La quantité doit être supérieure à 0")
        return false
      }
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setSaving(true)
    try {
      // Convertir les items manuels en ItemDemande
      const items: Partial<ItemDemande>[] = formData.items.map(item => ({
        id: item.id,
        articleId: `manual-${item.id}`, // ID temporaire pour les articles manuels
        quantiteDemandee: item.quantiteDemandee,
        commentaire: item.commentaire,
        // Créer un article temporaire avec les données saisies
        article: {
          id: `manual-${item.id}`,
          nom: item.nom,
          description: item.description,
          reference: item.reference,
          unite: item.unite,
          type: formData.type,
          createdAt: new Date(),
        }
      }))

      const demandeData = {
        projetId: formData.projetId,
        type: formData.type,
        items,
        commentaires: formData.commentaires,
      }

      let success = false
      if (mode === "create") {
        success = await createDemande(demandeData)
      } else if (mode === "edit" && demande) {
        success = await updateDemande(demande.id, { ...demande, ...demandeData })
      }

      if (success) {
        onClose()
        // Réinitialiser le formulaire
        setFormData({
          projetId: "",
          type: type,
          items: [],
          commentaires: "",
        })
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error)
      setError("Erreur lors de la sauvegarde de la demande")
    } finally {
      setSaving(false)
    }
  }

  const mesProjetIds = currentUser?.projets || []
  const mesProjets = projets.filter(p => mesProjetIds.includes(p.id) && p.actif)

  const unites = ["pièce", "kg", "m", "m²", "m³", "L", "sac", "barre", "rouleau", "boîte", "paquet"]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Nouvelle demande" : "Modifier la demande"} de {formData.type === "materiel" ? "matériel" : "outillage"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create" ? "Créez une nouvelle demande en saisissant manuellement les articles" : "Modifiez les détails de la demande"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations générales */}
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="projet" className="block text-sm font-medium mb-2">
                  Projet *
                </label>
                <select
                  id="projet"
                  value={formData.projetId}
                  onChange={(e) => setFormData(prev => ({ ...prev, projetId: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  required
                >
                  <option value="">Sélectionnez un projet</option>
                  {mesProjets.map(projet => (
                    <option key={projet.id} value={projet.id}>
                      {projet.nom}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="type" className="block text-sm font-medium mb-2">
                  Type de demande *
                </label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as DemandeType }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  required
                >
                  <option value="materiel">Matériel</option>
                  <option value="outillage">Outillage</option>
                </select>
              </div>

              <div>
                <label htmlFor="commentaires" className="block text-sm font-medium mb-2">
                  Commentaires généraux (optionnel)
                </label>
                <textarea
                  id="commentaires"
                  value={formData.commentaires}
                  onChange={(e) => setFormData(prev => ({ ...prev, commentaires: e.target.value }))}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Commentaires sur la demande..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Articles */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Articles demandés ({formData.items.length})</CardTitle>
                <Button type="button" onClick={addNewItem} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un article
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {formData.items.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Aucun article ajouté</p>
                  <p className="text-sm">Cliquez sur "Ajouter un article" pour commencer</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.items.map((item, index) => (
                    <div key={item.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-gray-800">Article {index + 1}</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Nom de l'article *
                          </label>
                          <input
                            type="text"
                            value={item.nom}
                            onChange={(e) => updateItem(item.id, "nom", e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            placeholder="Ex: Casque de sécurité"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Référence *
                          </label>
                          <input
                            type="text"
                            value={item.reference}
                            onChange={(e) => updateItem(item.id, "reference", e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            placeholder="Ex: CAS-001"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Unité *
                          </label>
                          <select
                            value={item.unite}
                            onChange={(e) => updateItem(item.id, "unite", e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            required
                          >
                            {unites.map(unite => (
                              <option key={unite} value={unite}>
                                {unite}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Quantité *
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantiteDemandee}
                            onChange={(e) => updateItem(item.id, "quantiteDemandee", parseInt(e.target.value) || 1)}
                            className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            required
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium mb-1">
                            Description
                          </label>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => updateItem(item.id, "description", e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            placeholder="Description détaillée de l'article"
                          />
                        </div>

                        <div className="lg:col-span-3">
                          <label className="block text-sm font-medium mb-1">
                            Commentaire
                          </label>
                          <input
                            type="text"
                            value={item.commentaire}
                            onChange={(e) => updateItem(item.id, "commentaire", e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            placeholder="Commentaire spécifique pour cet article"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={saving || formData.items.length === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {mode === "create" ? "Créer la demande" : "Sauvegarder"}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
