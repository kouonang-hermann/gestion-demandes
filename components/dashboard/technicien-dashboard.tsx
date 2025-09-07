"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useStore } from "@/stores/useStore"
import { Package, Clock, CheckCircle, XCircle, Plus, FileText } from 'lucide-react'
import InstrumElecLogo from "@/components/ui/instrumelec-logo"
import CreateDemandeModal from "@/components/demandes/create-demande-modal"
import { UserRequestsChart } from "@/components/charts/user-requests-chart"
import UserDetailsModal from "@/components/modals/user-details-modal"

export default function TechnicienDashboard() {
  const { currentUser, demandes, projets, loadDemandes, loadProjets, isLoading } = useStore()

  const [stats, setStats] = useState({
    total: 0,
    enCours: 0,
    validees: 0,
    brouillons: 0,
  })

  const [createDemandeModalOpen, setCreateDemandeModalOpen] = useState(false)
  const [demandeType, setDemandeType] = useState<"materiel" | "outillage">("materiel")
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [detailsModalType, setDetailsModalType] = useState<"total" | "enCours" | "validees" | "brouillons">("total")
  const [detailsModalTitle, setDetailsModalTitle] = useState("")
  const [dataLoaded, setDataLoaded] = useState(false)

  // Chargement initial des données
  useEffect(() => {
    if (currentUser && !dataLoaded) {
      const loadInitialData = async () => {
        try {
          console.log("Chargement des données pour le technicien...")
          await Promise.all([
            loadProjets(),
            loadDemandes()
          ])
          setDataLoaded(true)
          console.log("Données chargées avec succès")
        } catch (error) {
          console.error("Erreur lors du chargement initial:", error)
        }
      }
      loadInitialData()
    }
  }, [currentUser?.id, dataLoaded])

  // Calcul des statistiques
  useEffect(() => {
    if (currentUser && demandes) {
      const mesDemandes = demandes.filter((d) => d.technicienId === currentUser.id)

      setStats({
        total: mesDemandes.length,
        enCours: mesDemandes.filter((d) => !["brouillon", "validee_finale", "archivee", "rejetee"].includes(d.status))
          .length,
        validees: mesDemandes.filter((d) => ["validee_finale", "archivee"].includes(d.status)).length,
        brouillons: mesDemandes.filter((d) => d.status === "brouillon").length,
      })
    }
  }, [currentUser?.id, demandes])

  const getStatusColor = (status: string) => {
    const colors = {
      brouillon: "bg-gray-500",
      soumise: "bg-blue-500",
      validee_conducteur: "bg-green-500",
      validee_qhse: "bg-green-500",
      rejetee: "bg-red-500",
      sortie_preparee: "bg-purple-500",
      validee_charge_affaire: "bg-emerald-500",
      validee_finale: "bg-green-600",
      archivee: "bg-gray-600",
    }
    return colors[status as keyof typeof colors] || "bg-gray-500"
  }

  const getStatusLabel = (status: string) => {
    const labels = {
      brouillon: "Brouillon",
      soumise: "Soumise",
      validee_conducteur: "Validée conducteur",
      validee_qhse: "Validée QHSE",
      rejetee: "Rejetée",
      sortie_preparee: "Sortie préparée",
      validee_charge_affaire: "Validée chargé affaire",
      validee_finale: "Validée finale",
      archivee: "Archivée",
    }
    return labels[status as keyof typeof labels] || status
  }

  if (!currentUser) {
    return (
      <div className="text-center p-8 text-red-500">
        Erreur : Utilisateur non connecté
      </div>
    )
  }

  if (isLoading || !dataLoaded) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2">Chargement du tableau de bord...</span>
      </div>
    )
  }

  const mesProjetIds = currentUser.projets || []
  const mesProjets = projets.filter((p) => mesProjetIds.includes(p.id)) || []
  const mesDemandes = demandes.filter((d) => d.technicienId === currentUser.id) || []
  const demandesValidationFinale = mesDemandes.filter(d => d.status === "validee_charge_affaire")

  const handleCardClick = (type: "total" | "enCours" | "validees" | "brouillons", title: string) => {
    setDetailsModalType(type)
    setDetailsModalTitle(title)
    setDetailsModalOpen(true)
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
          onClick={() => handleCardClick("enCours", "Mes demandes en cours")}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">En cours</p>
                <p className="text-2xl font-bold text-orange-800">{stats.enCours}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className="bg-green-50 border-green-200 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleCardClick("validees", "Mes demandes validées")}
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
          className="bg-gray-50 border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleCardClick("brouillons", "Mes brouillons")}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Brouillons</p>
                <p className="text-2xl font-bold text-gray-600">{stats.brouillons}</p>
              </div>
              <Package className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mes projets */}
      {mesProjets.length > 0 && (
        <Card className="bg-gray-50 border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-800">Mes projets ({mesProjets.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mesProjets.map((projet) => (
                <div key={projet.id} className="bg-white p-4 rounded-lg border border-gray-200">
                  <h3 className="font-medium text-gray-800">{projet.nom}</h3>
                  <p className="text-sm text-gray-600 mt-1">{projet.description}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-gray-500">
                      Début: {new Date(projet.dateDebut).toLocaleDateString()}
                    </span>
                    <Badge className={projet.actif ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                      {projet.actif ? "Actif" : "Inactif"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
