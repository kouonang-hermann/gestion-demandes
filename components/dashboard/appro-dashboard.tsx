"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useStore } from "@/stores/useStore"
import { Package, Clock, CheckCircle, Truck, Plus } from 'lucide-react'
import InstrumElecLogo from "@/components/ui/instrumelec-logo"
import SortiePreparationList from "@/components/appro/sortie-preparation-list"
import CreateDemandeModal from "@/components/demandes/create-demande-modal"
import { UserRequestsChart } from "@/components/charts/user-requests-chart"
import UserDetailsModal from "@/components/modals/user-details-modal"

export default function ApproDashboard() {
  const { currentUser, demandes, loadDemandes, isLoading } = useStore()

  const [stats, setStats] = useState({
    total: 0,
    aPreparer: 0,
    preparees: 0,
    livrees: 0,
  })

  const [createDemandeModalOpen, setCreateDemandeModalOpen] = useState(false)
  const [demandeType, setDemandeType] = useState<"materiel" | "outillage">("materiel")
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [detailsModalType, setDetailsModalType] = useState<"total" | "aPreparer" | "preparees" | "livrees">("total")
  const [detailsModalTitle, setDetailsModalTitle] = useState("")

  useEffect(() => {
    if (currentUser) {
      loadDemandes()
    }
  }, [currentUser, loadDemandes])

  useEffect(() => {
    if (currentUser) {
      const mesDemandesAppro = demandes.filter((d) => currentUser.projets.includes(d.projetId))

      setStats({
        total: mesDemandesAppro.length,
        aPreparer: mesDemandesAppro.filter((d) =>
          ["validee_conducteur", "validee_qhse"].includes(d.status)
        ).length,
        preparees: mesDemandesAppro.filter((d) => d.status === "sortie_preparee").length,
        livrees: mesDemandesAppro.filter((d) => ["validee_finale", "archivee"].includes(d.status)).length,
      })
    }
  }, [currentUser, demandes])

  const mesDemandes = currentUser ? demandes.filter((d) => d.technicienId === currentUser.id) : []

  const handleCardClick = (type: "total" | "aPreparer" | "preparees" | "livrees", title: string) => {
    setDetailsModalType(type)
    setDetailsModalTitle(title)
    setDetailsModalOpen(true)
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
      {/* En-tête avec logo InstrumElec */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <InstrumElecLogo size="sm" />
          <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={() => {
              setDemandeType("materiel")
              setCreateDemandeModalOpen(true)
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle demande matériel
          </Button>
          <Button
            onClick={() => {
              setDemandeType("outillage")
              setCreateDemandeModalOpen(true)
            }}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle demande outillage
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card 
          className="bg-blue-50 border-blue-200 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleCardClick("total", "Toutes les demandes")}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total demandes</p>
                <p className="text-2xl font-bold text-blue-800">{stats.total}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className="bg-orange-50 border-orange-200 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleCardClick("aPreparer", "Demandes à préparer")}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">À préparer</p>
                <p className="text-2xl font-bold text-orange-800">{stats.aPreparer}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className="bg-purple-50 border-purple-200 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleCardClick("preparees", "Demandes préparées")}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Préparées</p>
                <p className="text-2xl font-bold text-purple-800">{stats.preparees}</p>
              </div>
              <Truck className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className="bg-green-50 border-green-200 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleCardClick("livrees", "Demandes livrées")}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Livrées</p>
                <p className="text-2xl font-bold text-green-800">{stats.livrees}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions rapides */}
      <Card className="bg-gray-50 border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-800">Actions rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => {
                setDemandeType("materiel")
                setCreateDemandeModalOpen(true)
              }}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle demande de matériel
            </Button>
            <Button
              onClick={() => {
                setDemandeType("outillage")
                setCreateDemandeModalOpen(true)
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle demande d'outillage
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des demandes à préparer */}
      <SortiePreparationList />

      {/* Graphiques des demandes utilisateur */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UserRequestsChart
          title="Mes demandes de matériel"
          type="materiel"
          userRequests={mesDemandes}
          className="bg-green-50 border-green-200"
        />
        <UserRequestsChart
          title="Mes demandes d'outillage"
          type="outillage"
          userRequests={mesDemandes}
          className="bg-blue-50 border-blue-200"
        />
      </div>

      {/* Modal de création de demande */}
      <CreateDemandeModal
        isOpen={createDemandeModalOpen}
        onClose={() => setCreateDemandeModalOpen(false)}
        type={demandeType}
      />

      {/* Modal des détails */}
      <UserDetailsModal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        title={detailsModalTitle}
        data={mesDemandes}
        type={detailsModalType}
      />
    </div>
  )
}
