"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useStore } from "@/stores/useStore"
import { Users, FolderOpen, FileText, Settings, Plus, Eye, Edit, Trash2, Activity } from "lucide-react"
import CreateUserModal from "@/components/admin/create-user-modal"
import CreateProjectModal from "@/components/admin/create-project-modal"
import CreateDemandeModal from "@/components/demandes/create-demande-modal"
import RequestsFlowChart from "@/components/charts/requests-flow-chart"
import DetailsModal from "@/components/modals/details-modal"

export default function SuperAdminDashboard() {
  const { currentUser, users, projets, demandes, loadUsers, loadProjets, loadDemandes, isLoading } = useStore()

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProjets: 0,
    totalDemandes: 0,
    demandesEnCours: 0,
  })

  const [createUserModalOpen, setCreateUserModalOpen] = useState(false)
  const [createProjectModalOpen, setCreateProjectModalOpen] = useState(false)
  const [createDemandeModalOpen, setCreateDemandeModalOpen] = useState(false)
  const [demandeType, setDemandeType] = useState<"materiel" | "outillage">("materiel")
  
  // Details modal states
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [detailsModalType, setDetailsModalType] = useState<"users" | "projects" | "totalRequests" | "activeRequests">("users")
  const [detailsModalTitle, setDetailsModalTitle] = useState("")
  const [detailsModalData, setDetailsModalData] = useState<any[]>([])

  useEffect(() => {
    if (currentUser) {
      loadUsers()
      loadProjets()
      loadDemandes()
    }
  }, [currentUser, loadUsers, loadProjets, loadDemandes])

  useEffect(() => {
    setStats({
      totalUsers: users.length,
      totalProjets: projets.length,
      totalDemandes: demandes.length,
      demandesEnCours: demandes.filter(
        (d) => !["brouillon", "validee_finale", "archivee", "rejetee"].includes(d.status),
      ).length,
    })
  }, [users, projets, demandes])

  const getRoleLabel = (role: string) => {
    const labels = {
      superadmin: "Super Administrateur",
      technicien: "Technicien",
      conducteur_travaux: "Conducteur de Travaux",
      responsable_qhse: "Responsable QHSE",
      responsable_appro: "Responsable Approvisionnements",
      charge_affaire: "Chargé d'Affaire",
    }
    return labels[role as keyof typeof labels] || role
  }

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

  // Click handlers for statistics cards
  const handleUsersClick = () => {
    setDetailsModalType("users")
    setDetailsModalTitle("Tous les utilisateurs")
    setDetailsModalData(users)
    setDetailsModalOpen(true)
  }

  const handleProjectsClick = () => {
    setDetailsModalType("projects")
    setDetailsModalTitle("Tous les projets")
    setDetailsModalData(projets)
    setDetailsModalOpen(true)
  }

  const handleTotalRequestsClick = () => {
    setDetailsModalType("totalRequests")
    setDetailsModalTitle("Toutes les demandes")
    setDetailsModalData(demandes)
    setDetailsModalOpen(true)
  }

  const handleActiveRequestsClick = () => {
    const activeRequests = demandes.filter(
      (d) => !["brouillon", "validee_finale", "archivee", "rejetee"].includes(d.status)
    )
    setDetailsModalType("activeRequests")
    setDetailsModalTitle("Demandes en cours")
    setDetailsModalData(activeRequests)
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
      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-200 cursor-pointer hover:shadow-md transition-shadow" onClick={handleUsersClick}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Utilisateurs</p>
                <p className="text-2xl font-bold text-blue-800">{stats.totalUsers}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200 cursor-pointer hover:shadow-md transition-shadow" onClick={handleProjectsClick}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Projets</p>
                <p className="text-2xl font-bold text-green-800">{stats.totalProjets}</p>
              </div>
              <FolderOpen className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200 cursor-pointer hover:shadow-md transition-shadow" onClick={handleTotalRequestsClick}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Total demandes</p>
                <p className="text-2xl font-bold text-purple-800">{stats.totalDemandes}</p>
              </div>
              <FileText className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-200 cursor-pointer hover:shadow-md transition-shadow" onClick={handleActiveRequestsClick}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">En cours</p>
                <p className="text-2xl font-bold text-orange-800">{stats.demandesEnCours}</p>
              </div>
              <Activity className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions rapides */}
      <Card className="bg-gray-50 border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-800">Actions d'administration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setCreateUserModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Nouvel utilisateur
            </Button>
            <Button
              onClick={() => setCreateProjectModalOpen(true)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouveau projet
            </Button>
            <Button
              onClick={() => {
                setDemandeType("materiel")
                setCreateDemandeModalOpen(true)
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle demande de matériel
            </Button>
            <Button
              onClick={() => {
                setDemandeType("outillage")
                setCreateDemandeModalOpen(true)
              }}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle demande d'outillage
            </Button>
            <Button variant="outline" className="border-gray-300 hover:bg-white bg-transparent">
              <Settings className="h-4 w-4 mr-2" />
              Configuration système
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Graphiques des flux de demandes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique des demandes de matériel */}
        <RequestsFlowChart
          demandes={demandes}
          type="materiel"
          title="Flux des demandes de matériel"
        />

        {/* Graphique des demandes d'outillage */}
        <RequestsFlowChart
          demandes={demandes}
          type="outillage"
          title="Flux des demandes d'outillage"
        />
      </div>

      {/* Modals */}
      <CreateUserModal isOpen={createUserModalOpen} onClose={() => setCreateUserModalOpen(false)} />
      <CreateProjectModal isOpen={createProjectModalOpen} onClose={() => setCreateProjectModalOpen(false)} />
      <CreateDemandeModal
        isOpen={createDemandeModalOpen}
        onClose={() => setCreateDemandeModalOpen(false)}
        type={demandeType}
      />
      <DetailsModal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        type={detailsModalType}
        title={detailsModalTitle}
        data={detailsModalData}
      />
    </div>
  )
}
