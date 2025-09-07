"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useStore } from "@/stores/useStore"
import { Eye, Search, Edit, Plus } from 'lucide-react'
import type { DemandeStatus } from "@/types"
import DemandeDetailModal from "./demande-detail-modal"
import DemandeFormModal from "./demande-form-modal"

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

export default function DemandesList() {
  const { demandes, currentUser, loadDemandes, isLoading } = useStore()
  const [filteredDemandes, setFilteredDemandes] = useState(demandes)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // Modal states
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [selectedDemandeId, setSelectedDemandeId] = useState<string | null>(null)
  const [selectedDemande, setSelectedDemande] = useState(null)
  const [modalMode, setModalMode] = useState<"view" | "edit" | "create">("view")

  useEffect(() => {
    if (currentUser) {
      loadDemandes()
    }
  }, [currentUser, loadDemandes])

  useEffect(() => {
    filterDemandes()
  }, [demandes, searchTerm, statusFilter])

  const filterDemandes = () => {
    let filtered = demandes

    if (searchTerm) {
      filtered = filtered.filter(
        (d) =>
          d.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
          d.projet?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          d.technicien?.nom?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((d) => d.status === statusFilter)
    }

    setFilteredDemandes(filtered)
  }

  const openDetailModal = (demandeId: string) => {
    setSelectedDemandeId(demandeId)
    setModalMode("view")
    setDetailModalOpen(true)
  }

  const openEditModal = (demande: any) => {
    setSelectedDemande(demande)
    setModalMode("edit")
    setFormModalOpen(true)
  }

  const openCreateModal = () => {
    setSelectedDemande(null)
    setModalMode("create")
    setFormModalOpen(true)
  }

  const canEdit = (demande: any) => {
    return currentUser?.role === "technicien" && 
           demande.status === "brouillon" && 
           demande.technicienId === currentUser.id
  }

  const canCreate = () => {
    return currentUser?.role === "technicien"
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Rechercher par numéro, projet ou technicien..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              {Object.entries(statusLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {canCreate() && (
          <Button onClick={openCreateModal} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle demande
          </Button>
        )}
      </div>

      <div className="grid gap-4">
        {filteredDemandes.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              {demandes.length === 0 ? "Aucune demande trouvée" : "Aucune demande ne correspond aux filtres"}
            </CardContent>
          </Card>
        ) : (
          filteredDemandes.map((demande) => (
            <Card key={demande.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{demande.numero}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className={`${statusColors[demande.status]} text-white`}>
                      {statusLabels[demande.status]}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {demande.type === "materiel" ? "Matériel" : "Outillage"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Projet</p>
                    <p className="font-medium">{demande.projet?.nom || "Projet non défini"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Technicien</p>
                    <p className="font-medium">
                      {demande.technicien?.prenom} {demande.technicien?.nom}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Nombre d'articles</p>
                    <p className="font-medium">{demande.items.length}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    Créée le {new Date(demande.dateCreation).toLocaleDateString()} • 
                    Modifiée le {new Date(demande.dateModification).toLocaleDateString()}
                  </div>
                  <div className="flex gap-2">
                    {canEdit(demande) && (
                      <Button variant="outline" size="sm" onClick={() => openEditModal(demande)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Modifier
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => openDetailModal(demande.id)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Voir détails
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modals */}
      <DemandeDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        demandeId={selectedDemandeId}
        mode={modalMode as "view" | "edit"}
      />

      <DemandeFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        demande={selectedDemande}
        mode={modalMode as "create" | "edit"}
      />
    </div>
  )
}
