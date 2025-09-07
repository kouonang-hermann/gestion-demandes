"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Edit, Trash2 } from "lucide-react"

interface UserDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  data: any[]
  type: "total" | "enCours" | "validees" | "rejetees" | "brouillons" | "enAttente" | "aPreparer" | "preparees" | "livrees" | "aValider"
}

export default function UserDetailsModal({ isOpen, onClose, title, data, type }: UserDetailsModalProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "brouillon":
        return "bg-gray-500"
      case "soumise":
        return "bg-blue-500"
      case "validee_conducteur":
      case "validee_qhse":
      case "validee_charge_affaire":
        return "bg-green-500"
      case "rejetee":
        return "bg-red-500"
      case "sortie_preparee":
        return "bg-purple-500"
      case "livree":
      case "validee_finale":
        return "bg-emerald-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "brouillon":
        return "Brouillon"
      case "soumise":
        return "Soumise"
      case "validee_conducteur":
        return "Validée conducteur"
      case "validee_qhse":
        return "Validée QHSE"
      case "validee_charge_affaire":
        return "Validée chargé d'affaire"
      case "rejetee":
        return "Rejetée"
      case "sortie_preparee":
        return "Préparée"
      case "livree":
        return "Livrée"
      case "validee_finale":
        return "Validée finale"
      default:
        return status
    }
  }

  const filteredData = data.filter(item => {
    switch (type) {
      case "total":
        return true
      case "enCours":
        return ["soumise", "validee_conducteur", "validee_qhse", "sortie_preparee"].includes(item.status)
      case "validees":
        return ["validee_conducteur", "validee_qhse", "validee_charge_affaire", "livree", "validee_finale"].includes(item.status)
      case "rejetees":
        return item.status === "rejetee"
      case "brouillons":
        return item.status === "brouillon"
      case "enAttente":
        return item.status === "soumise"
      case "aPreparer":
        return ["validee_conducteur", "validee_qhse"].includes(item.status)
      case "preparees":
        return item.status === "sortie_preparee"
      case "livrees":
        return ["livree", "validee_finale", "archivee"].includes(item.status)
      case "aValider":
        return item.status === "sortie_preparee"
      default:
        return true
    }
  })

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title} ({filteredData.length})</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {filteredData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Aucun élément trouvé</p>
            </div>
          ) : (
            filteredData.map((item) => (
              <div
                key={item.id}
                className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-gray-800">{item.numero}</h3>
                      <Badge className={`${getStatusColor(item.status)} text-white text-xs`}>
                        {getStatusLabel(item.status)}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {item.type === "materiel" ? "Matériel" : "Outillage"}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {item.items?.length || 0} article{(item.items?.length || 0) > 1 ? "s" : ""} • Créée le{" "}
                      {new Date(item.dateCreation).toLocaleDateString()}
                    </p>
                    {item.commentaires && (
                      <p className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                        <strong>Commentaire:</strong> {item.commentaires}
                      </p>
                    )}
                    {item.dateLivraisonSouhaitee && (
                      <p className="text-sm text-green-600">
                        <strong>Livraison souhaitée:</strong> {new Date(item.dateLivraisonSouhaitee).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="text-blue-600 hover:text-blue-700">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-green-600 hover:text-green-700">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
