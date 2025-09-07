"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

interface UserRequestsChartProps {
  title: string
  type: "materiel" | "outillage"
  userRequests: any[]
  className?: string
}

export function UserRequestsChart({ title, type, userRequests, className }: UserRequestsChartProps) {
  // Filtrer les demandes par type et par utilisateur
  const filteredRequests = userRequests.filter(request => request.type === type)

  // Générer les données pour les 12 derniers mois
  const generateMonthlyData = () => {
    const months = []
    const now = new Date()
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthName = date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
      
      const monthRequests = filteredRequests.filter(request => {
        const requestDate = new Date(request.dateCreation)
        return requestDate.getMonth() === date.getMonth() && 
               requestDate.getFullYear() === date.getFullYear()
      })

      const total = monthRequests.length
      const completed = monthRequests.filter(r => r.status === 'livree').length
      const pending = monthRequests.filter(r => 
        ['brouillon', 'soumise', 'validee_qhse', 'validee_charge_affaire', 'preparee'].includes(r.status)
      ).length
      const rejected = monthRequests.filter(r => r.status === 'rejetee').length

      months.push({
        month: monthName,
        total,
        completed,
        pending,
        rejected
      })
    }
    
    return months
  }

  const data = generateMonthlyData()

  const getBarColor = () => {
    return type === "materiel" ? "#10b981" : "#3b82f6" // green for material, blue for tools
  }

  const getSecondaryColor = () => {
    return type === "materiel" ? "#059669" : "#2563eb"
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-gray-800">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis 
              dataKey="month" 
              stroke="#6b7280"
              fontSize={12}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              formatter={(value: number, name: string) => {
                const labels: Record<string, string> = {
                  total: 'Total',
                  completed: 'Livrées',
                  pending: 'En cours',
                  rejected: 'Rejetées'
                }
                return [value, labels[name] || name]
              }}
            />
            <Legend 
              formatter={(value: string) => {
                const labels: Record<string, string> = {
                  total: 'Total',
                  completed: 'Livrées',
                  pending: 'En cours',
                  rejected: 'Rejetées'
                }
                return labels[value] || value
              }}
            />
            <Bar dataKey="total" fill={getBarColor()} name="total" />
            <Bar dataKey="completed" fill="#10b981" name="completed" />
            <Bar dataKey="pending" fill="#f59e0b" name="pending" />
            <Bar dataKey="rejected" fill="#ef4444" name="rejected" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
