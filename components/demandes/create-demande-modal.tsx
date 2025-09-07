"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useStore } from "@/stores/useStore"
import { Plus, Trash2, Save, Loader2 } from 'lucide-react'
import type { DemandeType, ItemDemande } from "@/types"

interface CreateDemandeModalProps {
  isOpen: boolean
  onClose: () => void
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

export default function CreateDemandeModal({ isOpen, onClose, type = "materiel" }: CreateDemandeModalProps) {
  const { currentUser, projets, createDemande, loadProjets, isLoading } = useStore()
  
  const [formData, setFormData] = useState({
    projetId: "",
    type: type as DemandeType,
    items: [] as ManualItem[],
    commentaires: "",
    dateLivraisonSouhaitee: "",
  })
  
  const [error, setError] = useState("")

  useEffect(() => {
    if (isOpen) {
      loadProjets()
      setFormData({
        projetId: "",
        type: type,
        items: [],
        commentaires: "",
        dateLivraisonSouhaitee: "",
      })
      setError("")
    }
  }, [isOpen, type, loadProjets])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.projetId || formData.items.length === 0 || !formData.dateLivraisonSouhaitee) {
      setError("Veuillez sélectionner un projet, ajouter au moins un article et spécifier une date de livraison")
      return
    }

    // Validation de la date de livraison
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Reset time to start of day for comparison
    const deliveryDate = new Date(formData.dateLivraisonSouhaitee)
    if (deliveryDate < today) {
      setError("La date de livraison ne peut pas être dans le passé")
      return
    }

    // Validation des articles
    for (const item of formData.items) {
      if (!item.nom.trim() || !item.reference.trim() || !item.unite.trim()) {
        setError("Tous les articles doivent avoir un nom, une référence et une unité")
        return
      }
      if (item.quantiteDemandee <= 0) {
        setError("La quantité doit être supérieure à 0")
        return
      }
    }

    // Convertir les items manuels en ItemDemande
    const items: Partial<ItemDemande>[] = formData.items.map(item => ({
      id: item.id,
      articleId: `manual-${item.id}`,
      quantiteDemandee: item.quantiteDemandee,
      commentaire: item.commentaire,
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

    const success = await createDemande({
      projetId: formData.projetId,
      type: formData.type,
      items,
      commentaires: formData.commentaires,
      dateLivraisonSouhaitee: formData.dateLivraisonSouhaitee,
    })

    if (success) {
      onClose()
    }
  }

  // Tous les projets actifs sont disponibles pour créer une demande
  const mesProjets = projets.filter(p => p.actif)

  const unites = ["pièce", "kg", "m", "m²", "m³", "L", "sac", "barre", "rouleau", "boîte", "paquet"]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouvelle demande de {type === "materiel" ? "matériel" : "outillage"}</DialogTitle>
          <DialogDescription>Créez une nouvelle demande en saisissant manuellement les articles</DialogDescription>
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
                <label htmlFor="dateLivraisonSouhaitee" className="block text-sm font-medium mb-2">
                  Date de livraison souhaitée *
                </label>
                <input
                  type="date"
                  id="dateLivraisonSouhaitee"
                  value={formData.dateLivraisonSouhaitee}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateLivraisonSouhaitee: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
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
              <CardTitle>Articles demandés ({formData.items.length})</CardTitle>
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
          <div className="flex justify-between items-center">
            <Button type="button" onClick={addNewItem} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un article
            </Button>
            <div className="flex space-x-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading || formData.items.length === 0}
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="h-4 w-4 mr-2" />
                Créer la demande
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
