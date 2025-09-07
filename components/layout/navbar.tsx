"use client"

import { Bell, LogOut, Settings, FolderOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useStore } from "@/stores/useStore"
import Link from "next/link"

const roleLabels = {
  superadmin: "Super Administrateur",
  technicien: "Technicien",
  conducteur_travaux: "Conducteur de Travaux",
  responsable_qhse: "Responsable QHSE",
  responsable_appro: "Responsable Approvisionnements",
  charge_affaire: "Chargé d'Affaire",
}

export default function Navbar() {
  const { currentUser, logout, notifications } = useStore()

  const unreadCount = notifications.filter((n) => !n.lu).length

  return (
    <nav className="border-b bg-white border-gray-200 shadow-sm">
      <div className="flex h-16 items-center px-6 justify-between">
        <div className="flex items-center space-x-6">
          <Link href="/" className="flex items-center space-x-2">
            <FolderOpen className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold text-gray-800">Gestion Demandes</span>
          </Link>

          {currentUser && (
            <div className="hidden md:flex items-center space-x-1 text-sm text-gray-600">
              <span>Connecté en tant que</span>
              <span className="font-medium text-blue-600">{roleLabels[currentUser.role]}</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {currentUser?.role === "superadmin" && (
            <Button asChild variant="outline" size="sm" className="border-gray-300 hover:bg-gray-50 bg-transparent">
              <Link href="/admin">
                <Settings className="h-4 w-4 mr-2" />
                Administration
              </Link>
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative hover:bg-gray-100">
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 bg-white border-gray-200">
              <DropdownMenuLabel className="text-gray-800">Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-200" />
              {notifications.length === 0 ? (
                <div className="p-4 text-sm text-gray-500 text-center">Aucune notification</div>
              ) : (
                notifications.slice(0, 5).map((notification) => (
                  <DropdownMenuItem key={notification.id} className="flex flex-col items-start p-4 hover:bg-gray-50">
                    <div className="font-medium text-gray-800">{notification.titre}</div>
                    <div className="text-sm text-gray-600">{notification.message}</div>
                    <div className="text-xs text-gray-400 mt-1">{notification.createdAt.toLocaleString()}</div>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">
                      {currentUser?.prenom?.[0]}
                      {currentUser?.nom?.[0]}
                    </span>
                  </div>
                  <span className="hidden md:block text-gray-700">
                    {currentUser?.prenom} {currentUser?.nom}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white border-gray-200">
              <DropdownMenuLabel className="text-gray-800">
                <div>
                  <div className="font-medium">
                    {currentUser?.prenom} {currentUser?.nom}
                  </div>
                  <div className="text-sm font-normal text-gray-600">{currentUser && roleLabels[currentUser.role]}</div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-200" />
              <DropdownMenuItem onClick={logout} className="text-red-600 hover:bg-red-50">
                <LogOut className="mr-2 h-4 w-4" />
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  )
}
