"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useStore } from "@/stores/useStore"
import { Package, Clock, CheckCircle, XCircle, Plus, FileText, Truck } from 'lucide-react'
import InstrumElecLogo from "@/components/ui/instrumelec-logo"
import CreateDemandeModal from "@/components/demandes/create-demande-modal"
import { UserRequestsChart } from "@/components/charts/user-requests-chart"
import UserDetailsModal from "@/components/modals/user-details-modal"

export default function ResponsableLogistiqueDashboard() {
  const { currentUser, demandes, projets, loadDemandes, loadProjets, isLoading } = useStore()

  const [stats, setStats] = useState({
    total: 0,
    enCours: 0,
    validees: 0,
    rejetees: 0,
    enAttenteValidation: 0,
  })

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showUserModal, setShowUserModal] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null)
  const [filterTitle, setFilterTitle] = useState("")

  useEffect(() => {
    if (currentUser) {
      loadDemandes()
      loadProjets()
    }
  }, [currentUser, loadDemandes, loadProjets])

  useEffect(() => {
    if (demandes.length > 0) {
      const total = demandes.length
      const enCours = demandes.filter(d => 
        d.status === "en_attente_validation_logistique"
      ).length
      const validees = demandes.filter(d => 
        d.status === "validee_logistique" || 
        d.status === "en_attente_confirmation_demandeur" ||
        d.status === "confirmee_demandeur"
      ).length
      const rejetees = demandes.filter(d => d.status === "rejetee").length
      const enAttenteValidation = demandes.filter(d => 
        d.status === "en_attente_validation_logistique"
      ).length

      setStats({
        total,
        enCours,
        validees,
        rejetees,
        enAttenteValidation,
      })
    }
  }, [demandes])

  const handleCardClick = (filter: string, title: string) => {
    setSelectedFilter(filter)
    setFilterTitle(title)
  }

  const getFilteredDemandes = () => {
    if (!selectedFilter) return demandes

    switch (selectedFilter) {
      case "total":
        return demandes
      case "enCours":
        return demandes.filter(d => d.status === "en_attente_validation_logistique")
      case "validees":
        return demandes.filter(d => 
          d.status === "validee_logistique" || 
          d.status === "en_attente_confirmation_demandeur" ||
          d.status === "confirmee_demandeur"
        )
      case "rejetees":
        return demandes.filter(d => d.status === "rejetee")
      case "enAttenteValidation":
        return demandes.filter(d => d.status === "en_attente_validation_logistique")
      default:
        return demandes
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "brouillon":
        return <Badge variant="secondary">Brouillon</Badge>
      case "soumise":
        return <Badge variant="outline">Soumise</Badge>
      case "en_attente_validation_conducteur":
        return <Badge className="bg-yellow-100 text-yellow-800">En attente conducteur</Badge>
      case "en_attente_validation_qhse":
        return <Badge className="bg-yellow-100 text-yellow-800">En attente QHSE</Badge>
      case "en_attente_validation_appro":
        return <Badge className="bg-yellow-100 text-yellow-800">En attente appro</Badge>
      case "en_attente_validation_charge_affaire":
        return <Badge className="bg-yellow-100 text-yellow-800">En attente chargé affaire</Badge>
      case "en_attente_validation_logistique":
        return <Badge className="bg-orange-100 text-orange-800">À valider (Logistique)</Badge>
      case "validee_logistique":
        return <Badge className="bg-blue-100 text-blue-800">Validée logistique</Badge>
      case "en_attente_confirmation_demandeur":
        return <Badge className="bg-purple-100 text-purple-800">En attente confirmation</Badge>
      case "confirmee_demandeur":
        return <Badge className="bg-green-100 text-green-800">Confirmée</Badge>
      case "rejetee":
        return <Badge variant="destructive">Rejetée</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-6 py-6">
          <div className="text-center p-8 text-gray-500">
            Chargement...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec logo */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <InstrumElecLogo className="h-12 w-12" />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Responsable Logistique</h2>
            <p className="text-gray-600">Validation finale et gestion des livraisons</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle demande matériel
          </Button>
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle demande outillage
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowUserModal(true)}
          >
            Mon profil
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card 
          className="bg-blue-50 border-blue-200 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleCardClick("total", "Toutes mes demandes")}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total demandes</p>
                <p className="text-2xl font-bold text-blue-800">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className="bg-orange-50 border-orange-200 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleCardClick("enAttenteValidation", "Demandes à valider")}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">À valider</p>
                <p className="text-2xl font-bold text-orange-800">{stats.enAttenteValidation}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className="bg-yellow-50 border-yellow-200 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleCardClick("enCours", "Demandes en cours")}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">En cours</p>
                <p className="text-2xl font-bold text-yellow-800">{stats.enCours}</p>
              </div>
              <Truck className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className="bg-green-50 border-green-200 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleCardClick("validees", "Demandes validées")}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Validées</p>
                <p className="text-2xl font-bold text-green-800">{stats.validees}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className="bg-red-50 border-red-200 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleCardClick("rejetees", "Demandes rejetées")}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Rejetées</p>
                <p className="text-2xl font-bold text-red-800">{stats.rejetees}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphique et liste des demandes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Évolution des demandes</CardTitle>
            </CardHeader>
            <CardContent>
              <UserRequestsChart />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedFilter ? filterTitle : "Toutes les demandes"}
                {selectedFilter && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSelectedFilter(null)}
                    className="ml-2"
                  >
                    Voir tout
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getFilteredDemandes().length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    Aucune demande trouvée
                  </p>
                ) : (
                  getFilteredDemandes().slice(0, 10).map((demande) => (
                    <div key={demande.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <Package className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="font-medium">{demande.numero}</p>
                            <p className="text-sm text-gray-600">
                              {demande.projet?.nom} • {demande.items?.length || 0} articles
                            </p>
                            <p className="text-xs text-gray-500">
                              Créée le {new Date(demande.dateCreation).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {getStatusBadge(demande.status)}
                        <Badge variant="outline" className="capitalize">
                          {demande.type}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <CreateDemandeModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      <UserDetailsModal 
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
      />
    </div>
  )
}
