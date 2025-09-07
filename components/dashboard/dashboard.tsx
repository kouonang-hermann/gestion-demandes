"use client"

import { useStore } from "@/stores/useStore"
import SuperAdminDashboard from "./super-admin-dashboard"
import TechnicienDashboard from "./technicien-dashboard"
import ConducteurDashboard from "./conducteur-dashboard"
import QHSEDashboard from "./qhse-dashboard"
import ApproDashboard from "./appro-dashboard"
import ChargeAffaireDashboard from "./charge-affaire-dashboard"
import ResponsableLogistiqueDashboard from "./responsable-logistique-dashboard"

export default function Dashboard() {
  const { currentUser } = useStore()

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-6 py-6">
          <div className="text-center p-8 text-gray-500">
            Erreur : Utilisateur non connecté
          </div>
        </div>
      </div>
    )
  }

  const renderDashboard = () => {
    try {
      switch (currentUser.role) {
        case "superadmin":
          return <SuperAdminDashboard />
        case "technicien":
          return <TechnicienDashboard />
        case "conducteur_travaux":
          return <ConducteurDashboard />
        case "responsable_qhse":
          return <QHSEDashboard />
        case "responsable_appro":
          return <ApproDashboard />
        case "charge_affaire":
          return <ChargeAffaireDashboard />
        case "responsable_logistique":
          return <ResponsableLogistiqueDashboard />
        default:
          return (
            <div className="p-6 text-center text-gray-500">
              Rôle non reconnu: {currentUser.role}
              <br />
              <small className="text-gray-400">Rôles disponibles: superadmin, technicien, conducteur_travaux, responsable_qhse, responsable_appro, charge_affaire, responsable_logistique</small>
            </div>
          )
      }
    } catch (error) {
      console.error("Erreur lors du rendu du dashboard:", error)
      return (
        <div className="p-6 text-center text-red-500">
          Erreur lors du chargement du tableau de bord
        </div>
      )
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-800">
            Tableau de bord - {currentUser.prenom} {currentUser.nom}
          </h1>
          <p className="text-gray-600 text-sm mt-1">Gérez vos demandes d'achat et suivez leur progression</p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">{renderDashboard()}</div>
    </div>
  )
}
