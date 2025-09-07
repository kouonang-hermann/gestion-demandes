import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "./auth"

/**
 * Middleware d'authentification pour les API routes
 */
export function withAuth(
  handler: (request: NextRequest, user: any) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    try {
      const user = await getCurrentUser(request)
      
      if (!user) {
        return NextResponse.json(
          { success: false, error: "Non authentifié" },
          { status: 401 }
        )
      }

      return await handler(request, user)
    } catch (error) {
      console.error("Erreur middleware auth:", error)
      return NextResponse.json(
        { success: false, error: "Erreur d'authentification" },
        { status: 500 }
      )
    }
  }
}

/**
 * Middleware pour vérifier les permissions
 */
export function withPermission(
  requiredRoles: string[],
  handler: (request: NextRequest, user: any) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    try {
      const user = await getCurrentUser(request)
      
      if (!user) {
        return NextResponse.json(
          { success: false, error: "Non authentifié" },
          { status: 401 }
        )
      }

      if (!requiredRoles.includes(user.role)) {
        return NextResponse.json(
          { success: false, error: "Permissions insuffisantes" },
          { status: 403 }
        )
      }

      return await handler(request, user)
    } catch (error) {
      console.error("Erreur middleware permission:", error)
      return NextResponse.json(
        { success: false, error: "Erreur d'authentification" },
        { status: 500 }
      )
    }
  }
}
