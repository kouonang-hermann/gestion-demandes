"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useStore } from "@/stores/useStore"
import { CheckCircle, XCircle, Package, Truck, User } from 'lucide-react'
import type { Demande, DemandeStatus } from "@/types"

interface DemandeDetailModalProps {
  isOpen: boolean
  onClose: () => void
  demandeId: string | null
  mode: "view" | "edit"
}

const statusColors: Record<DemandeStatus, string> = {
  brouillon: "bg-gray-500",
  soumise: "bg-blue-500",
  en_attente_validation_conducteur: "bg-yellow-500",
  en_attente_validation_qhse: "bg-yellow-600",
  validee_conducteur: "bg-green-500",
  validee_qhse: "bg-green-600",
  rejetee: "bg-red-500",
  en_attente_sortie: "bg-orange-500",
  sortie_preparee: "bg-purple-500",
  en_attente_validation_charge_affaire: "bg-blue-600",
  validee_charge_affaire: "bg-emerald-500",
  en_attente_validation_finale: "bg-indigo-500",
  validee_finale: "bg-green-600",
  archivee: "bg-gray-600",
}

const statusLabels: Record<DemandeStatus, string> = {
  brouillon: "Brouillon",
  soumise: "Soumise",
  en_attente_validation_conducteur: "En attente conducteur",
  en_attente_validation_qhse: "En attente QHSE",
  validee_conducteur: "Validée conducteur",
  validee_qhse: "Validée QHSE",
  rejetee: "Rejetée",
  en_attente_sortie: "En attente sortie",
  sortie_preparee: "Sortie préparée",
  en_attente_validation_charge_affaire: "En attente chargé affaire",
  validee_charge_affaire: "Validée chargé affaire",
  en_attente_validation_finale: "En attente validation finale",
  validee_finale: "Validée finale",
  archivee: "Archivée",
}

export default function DemandeDetailModal({ isOpen, onClose, demandeId, mode }: DemandeDetailModalProps) {
  const { currentUser, articles, executeAction } = useStore()
  const [demande, setDemande] = useState<Demande | null>(null)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (isOpen && demandeId) {
      loadDemande()
    }
  }, [isOpen, demandeId])

  const loadDemande = async () => {
    if (!demandeId) return

    setLoading(true)
    try {
      const response = await fetch(`/api/demandes/${demandeId}`, {
        headers: {
          "x-user-id": currentUser?.id || "",
        },
      })
      const result = await response.json()

      if (result.success) {
        setDemande(result.data)
      }
    } catch (error) {
      console.error("Erreur lors du chargement de la demande:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (action: string, requiresComment = false, isReject = false) => {
    if (!demande || !currentUser) return

    setActionLoading(true)
    try {
      let commentaire
      
      if (isReject) {
        commentaire = prompt("Motif du rejet (obligatoire):")
        if (!commentaire) {
          setActionLoading(false)
          return
        }
      } else if (requiresComment) {
        commentaire = prompt("Commentaire:")
      }

      const success = await executeAction(demande.id, action, commentaire ? { commentaire } : {})
      
      if (success) {
        await loadDemande() // Recharger la demande
        // Optionnel: fermer le modal après certaines actions
        if (action === "soumettre") {
          onClose()
        }
      } else {
        alert("Erreur lors de l'exécution de l'action")
      }
    } catch (error) {
      console.error("Erreur lors de l'exécution de l'action:", error)
      alert("Erreur lors de l'exécution de l'action")
    } finally {
      setActionLoading(false)
    }
  }

  const canPerformAction = (action: string): boolean => {
    if (!demande || !currentUser) return false

    const role = currentUser.role
    const status = demande.status

    // SuperAdmin peut tout faire
    if (role === "superadmin") return true

    switch (action) {
      case "soumettre":
        return role === "technicien" && status === "brouillon" && demande.technicienId === currentUser.id

      case "valider_materiel":
        return (
          role === "conducteur_travaux" &&
          status === "soumise" &&
          demande.type === "materiel" &&
          currentUser.projets.includes(demande.projetId)
        )

      case "valider_outillage":
        return (
          role === "responsable_qhse" &&
          status === "soumise" &&
          demande.type === "outillage" &&
          currentUser.projets.includes(demande.projetId)
        )

      case "rejeter":
        return (
          status === "soumise" &&
          ((demande.type === "materiel" && role === "conducteur_travaux") ||
            (demande.type === "outillage" && role === "responsable_qhse")) &&
          currentUser.projets.includes(demande.projetId)
        )

      case "preparer_sortie":
        return (
          role === "responsable_appro" &&
          (status === "validee_conducteur" || status === "validee_qhse") &&
          currentUser.projets.includes(demande.projetId)
        )

      case "valider_preparation":
        return (
          role === "charge_affaire" &&
          status === "sortie_preparee" &&
          currentUser.projets.includes(demande.projetId)
        )

      case "validation_finale":
        return (
          role === "technicien" &&
          status === "validee_charge_affaire" &&
          demande.technicienId === currentUser.id
        )

      case "archiver":
        return role === "superadmin" && status === "validee_finale"

      default:
        return false
    }
  }

  const getArticleById = (articleId: string) => {
    return articles.find((a) => a.id === articleId)
  }

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!demande) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <div className="text-center p-8">Demande non trouvée</div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">{demande.numero}</DialogTitle>
              <DialogDescription>Détails de la demande de {demande.type}</DialogDescription>
            </div>
            <Badge className={`${statusColors[demande.status]} text-white`}>{statusLabels[demande.status]}</Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations générales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informations générales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Technicien</p>
                  <p className="font-medium">{demande.technicien?.prenom} {demande.technicien?.nom}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Projet</p>
                  <p className="font-medium">{demande.projet?.nom}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date de création</p>
                  <p className="font-medium">{new Date(demande.dateCreation).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Dernière modification</p>
                  <p className="font-medium">{new Date(demande.dateModification).toLocaleString()}</p>
                </div>
                {demande.dateSortie && (
                  <div>
                    <p className="text-sm text-gray-600">Date de sortie</p>
                    <p className="font-medium">{new Date(demande.dateSortie).toLocaleString()}</p>
                  </div>
                )}
                {demande.dateValidationFinale && (
                  <div>
                    <p className="text-sm text-gray-600">Date validation finale</p>
                    <p className="font-medium">{new Date(demande.dateValidationFinale).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Articles demandés */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Articles demandés ({demande.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {demande.items.map((item) => {
                  const article = getArticleById(item.articleId)
                  return (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-2">
                          <h4 className="font-medium">{article?.nom || "Article inconnu"}</h4>
                          <p className="text-sm text-gray-600">{article?.description}</p>
                          <p className="text-sm text-blue-600">{article?.reference}</p>
                          {item.commentaire && (
                            <p className="text-sm text-blue-600 mt-1">
                              <strong>Commentaire:</strong> {item.commentaire}
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Quantité demandée</p>
                          <p className="font-medium">
                            {item.quantiteDemandee} {article?.unite}
                          </p>
                        </div>
                        <div>
                          {item.quantiteValidee !== undefined && (
                            <div className="mb-2">
                              <p className="text-sm text-gray-600">Quantité validée</p>
                              <p className="font-medium text-green-600">
                                {item.quantiteValidee} {article?.unite}
                              </p>
                            </div>
                          )}
                          {item.quantiteSortie !== undefined && (
                            <div className="mb-2">
                              <p className="text-sm text-gray-600">Quantité sortie</p>
                              <p className="font-medium text-orange-600">
                                {item.quantiteSortie} {article?.unite}
                              </p>
                            </div>
                          )}
                          {item.quantiteRecue !== undefined && (
                            <div>
                              <p className="text-sm text-gray-600">Quantité reçue</p>
                              <p className="font-medium text-purple-600">
                                {item.quantiteRecue} {article?.unite}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Commentaires et signatures */}
          {(demande.commentaires || 
            demande.validationConducteur || 
            demande.validationQHSE || 
            demande.sortieAppro || 
            demande.validationChargeAffaire || 
            demande.validationFinale ||
            demande.rejetMotif) && (
            <Card>
              <CardHeader>
                <CardTitle>Commentaires et validations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {demande.commentaires && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Commentaire initial:</p>
                    <p className="text-sm bg-gray-50 p-3 rounded-md">{demande.commentaires}</p>
                  </div>
                )}
                
                {demande.validationConducteur && (
                  <div>
                    <p className="text-sm font-medium text-green-700">Validation conducteur:</p>
                    <p className="text-sm bg-green-50 p-3 rounded-md">
                      {demande.validationConducteur.commentaire || "Validée sans commentaire"} 
                      <br />
                      <span className="text-xs text-gray-500">
                        {new Date(demande.validationConducteur.date).toLocaleString()}
                      </span>
                    </p>
                  </div>
                )}

                {demande.validationQHSE && (
                  <div>
                    <p className="text-sm font-medium text-green-700">Validation QHSE:</p>
                    <p className="text-sm bg-green-50 p-3 rounded-md">
                      {demande.validationQHSE.commentaire || "Validée sans commentaire"}
                      <br />
                      <span className="text-xs text-gray-500">
                        {new Date(demande.validationQHSE.date).toLocaleString()}
                      </span>
                    </p>
                  </div>
                )}

                {demande.sortieAppro && (
                  <div>
                    <p className="text-sm font-medium text-purple-700">Préparation sortie:</p>
                    <p className="text-sm bg-purple-50 p-3 rounded-md">
                      {demande.sortieAppro.commentaire || "Préparée sans commentaire"}
                      <br />
                      <span className="text-xs text-gray-500">
                        {new Date(demande.sortieAppro.date).toLocaleString()}
                        {demande.sortieAppro.modifiable && (
                          <span className="ml-2 text-orange-600">(Modifiable)</span>
                        )}
                      </span>
                    </p>
                  </div>
                )}

                {demande.validationChargeAffaire && (
                  <div>
                    <p className="text-sm font-medium text-emerald-700">Validation chargé d'affaire:</p>
                    <p className="text-sm bg-emerald-50 p-3 rounded-md">
                      {demande.validationChargeAffaire.commentaire || "Validée sans commentaire"}
                      <br />
                      <span className="text-xs text-gray-500">
                        {new Date(demande.validationChargeAffaire.date).toLocaleString()}
                      </span>
                    </p>
                  </div>
                )}

                {demande.validationFinale && (
                  <div>
                    <p className="text-sm font-medium text-green-700">Validation finale (réception):</p>
                    <p className="text-sm bg-green-50 p-3 rounded-md">
                      {demande.validationFinale.commentaire || "Réception confirmée sans commentaire"}
                      <br />
                      <span className="text-xs text-gray-500">
                        {new Date(demande.validationFinale.date).toLocaleString()}
                      </span>
                    </p>
                  </div>
                )}

                {demande.rejetMotif && (
                  <div>
                    <p className="text-sm font-medium text-red-700">Motif du rejet:</p>
                    <p className="text-sm bg-red-50 p-3 rounded-md text-red-800">{demande.rejetMotif}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Actions selon le rôle */}
          <Card>
            <CardHeader>
              <CardTitle>Actions disponibles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {canPerformAction("soumettre") && (
                  <Button
                    onClick={() => handleAction("soumettre")}
                    disabled={actionLoading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Soumettre la demande
                  </Button>
                )}

                {canPerformAction("valider_materiel") && (
                  <Button
                    onClick={() => handleAction("valider_materiel", true)}
                    disabled={actionLoading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Valider (Matériel)
                  </Button>
                )}

                {canPerformAction("valider_outillage") && (
                  <Button
                    onClick={() => handleAction("valider_outillage", true)}
                    disabled={actionLoading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Valider (Outillage)
                  </Button>
                )}

                {canPerformAction("rejeter") && (
                  <Button
                    onClick={() => handleAction("rejeter", false, true)}
                    disabled={actionLoading}
                    variant="destructive"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Rejeter
                  </Button>
                )}

                {canPerformAction("preparer_sortie") && (
                  <Button
                    onClick={() => handleAction("preparer_sortie", true)}
                    disabled={actionLoading}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    Préparer sortie
                  </Button>
                )}

                {canPerformAction("valider_preparation") && (
                  <Button
                    onClick={() => handleAction("valider_preparation", true)}
                    disabled={actionLoading}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Valider préparation
                  </Button>
                )}

                {canPerformAction("validation_finale") && (
                  <Button
                    onClick={() => handleAction("validation_finale", true)}
                    disabled={actionLoading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Confirmer réception
                  </Button>
                )}

                {canPerformAction("archiver") && (
                  <Button
                    onClick={() => handleAction("archiver")}
                    disabled={actionLoading}
                    variant="outline"
                  >
                    Archiver
                  </Button>
                )}

                {actionLoading && (
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                    Action en cours...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
