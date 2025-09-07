"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { Demande } from "@/types"

interface RequestsFlowChartProps {
  demandes: Demande[]
  type: "materiel" | "outillage"
  title: string
}

export default function RequestsFlowChart({ demandes, type, title }: RequestsFlowChartProps) {
  // Generate data for the last 12 months
  const generateMonthlyData = () => {
    const months = []
    const now = new Date()
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthName = date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
      
      // Filter requests for this month and type
      const monthRequests = demandes.filter(demande => {
        const demandeDate = new Date(demande.dateCreation)
        return demandeDate.getMonth() === date.getMonth() && 
               demandeDate.getFullYear() === date.getFullYear() &&
               demande.type === type
      })
      
      months.push({
        month: monthName,
        requests: monthRequests.length,
        completed: monthRequests.filter(d => ["validee_finale", "archivee"].includes(d.status)).length,
        pending: monthRequests.filter(d => !["validee_finale", "archivee", "rejetee"].includes(d.status)).length,
        rejected: monthRequests.filter(d => d.status === "rejetee").length
      })
    }
    
    return months
  }

  const data = generateMonthlyData()
  const maxValue = Math.max(...data.map(d => d.requests))
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-800">{`${label}`}</p>
          <p className="text-blue-600">{`Total: ${payload[0]?.value || 0}`}</p>
          <p className="text-green-600">{`Terminées: ${payload[1]?.value || 0}`}</p>
          <p className="text-orange-600">{`En cours: ${payload[2]?.value || 0}`}</p>
          <p className="text-red-600">{`Rejetées: ${payload[3]?.value || 0}`}</p>
        </div>
      )
    }
    return null
  }

  return (
    <Card className="bg-gray-50 border-gray-200">
      <CardHeader>
        <CardTitle className="text-gray-800">{title}</CardTitle>
        <p className="text-sm text-gray-600">Évolution sur les 12 derniers mois</p>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="month" 
                stroke="#6b7280"
                fontSize={12}
              />
              <YAxis 
                stroke="#6b7280"
                fontSize={12}
                domain={[0, maxValue + 2]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="requests" 
                fill={type === "materiel" ? "#059669" : "#0ea5e9"} 
                radius={[2, 2, 0, 0]}
                name="Total"
              />
              <Bar 
                dataKey="completed" 
                fill="#10b981" 
                radius={[2, 2, 0, 0]}
                name="Terminées"
              />
              <Bar 
                dataKey="pending" 
                fill="#f59e0b" 
                radius={[2, 2, 0, 0]}
                name="En cours"
              />
              <Bar 
                dataKey="rejected" 
                fill="#ef4444" 
                radius={[2, 2, 0, 0]}
                name="Rejetées"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend */}
        <div className="flex justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded ${type === "materiel" ? "bg-emerald-600" : "bg-blue-500"}`}></div>
            <span className="text-gray-600">Total</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500"></div>
            <span className="text-gray-600">Terminées</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-yellow-500"></div>
            <span className="text-gray-600">En cours</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-500"></div>
            <span className="text-gray-600">Rejetées</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
