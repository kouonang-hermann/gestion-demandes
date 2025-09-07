"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useStore } from "@/stores/useStore"
import { Package, CheckCircle, Eye } from 'lucide-react'
import type { Demande } from "@/types"

export default function SortiePreparationList() {
  const { currentUser, demandes, loadDemandes, executeAction, isLoading, error } = useStore()
  const [demandesAPreparer, setDemandesAPreparer] = useState<Demande[]>([])
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    if (currentUser) {
      loadDemandes()
    }
  }, [currentUser, loadDemandes])

  useEffect(() => {
    if (currentUser) {
      const filtered = demandes.filter(
        (d) =>
          (d.status === "validee_conducteur" || d.status === "validee_qhse") &&
          currentUser.projets.includes(d.projetId)
      )
      setDemandesAPreparer(filtered)
    }
  }, [currentUser, demandes])

  const handlePreparerSortie = async (demandeId: string) => {
    setActionLoading(demandeId)

    try {
      const commentaire = prompt("Commentaire pour la préparation (optionnel):")

      const success = await executeAction(demandeId, "preparer_sortie", { commentaire })
      if (success) {
        await loadDemandes()
      } else {
        alert(error || "Erreur lors de la préparation")
      }
    } catch (err) {
      console.error("Erreur lors de la préparation:", err)
      alert("Erreur lors de la préparation")
    } finally {
      setActionLoading(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <Card className="bg-gray-50 border-gray-200">
      <CardHeader>
        <CardTitle className="text-gray-800">Demandes à préparer pour sortie</CardTitle>
      </CardHeader>
      <CardContent>
        {demandesAPreparer.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Aucune demande à préparer</p>
          </div>
        ) : (
          <div className="space-y-4">
            {demandesAPreparer.map((demande) => (
              <div
                key={demande.id}
                className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-gray-800">{demande.numero}</h3>
                      <Badge className="bg-green-500 text-white text-xs">{demande.status}</Badge>
                      <Badge variant="outline" className="text-xs">
                        {demande.type === "materiel" ? "Matériel" : "Outillage"}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {demande.items.length} article{demande.items.length > 1 ? "s" : ""} • Validée le{" "}
                      {demande.validationConducteur
                        ? new Date(demande.validationConducteur.date).toLocaleDateString()
                        : demande.validationQHSE
                          ? new Date(demande.validationQHSE.date).toLocaleDateString()
                          : "N/A"}
                    </p>
                    {demande.commentaires && (
                      <p className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                        <strong>Commentaire:</strong> {demande.commentaires}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreparerSortie(demande.id)}
                      disabled={actionLoading === demande.id}
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                      {actionLoading === demande.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      Préparer sortie
                    </Button>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
