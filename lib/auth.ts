import type { NextRequest } from "next/server"
import type { User } from "@prisma/client"
import bcrypt from "bcryptjs"
import { prisma } from "./prisma"
import { verifyToken, extractTokenFromHeader, type JWTPayload } from "./jwt"

/**
 * Authentifie un utilisateur avec email/password
 */
export async function authenticateUser(email: string, password: string): Promise<User | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) return null

    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) return null

    return user
  } catch (error) {
    console.error("Erreur lors de l'authentification:", error)
    return null
  }
}

/**
 * Récupère un utilisateur par son ID
 */
export async function getUserById(id: string): Promise<User | null> {
  try {
    return await prisma.user.findUnique({
      where: { id }
    })
  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur:", error)
    return null
  }
}

/**
 * Récupère tous les utilisateurs
 */
export async function getAllUsers(): Promise<User[]> {
  try {
    return await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    })
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs:", error)
    return []
  }
}

/**
 * Extrait l'utilisateur depuis le token JWT dans les headers
 */
export async function getCurrentUser(request: NextRequest): Promise<User | null> {
  try {
    const authHeader = request.headers.get("authorization")
    const token = extractTokenFromHeader(authHeader)
    
    if (!token) return null

    const payload = verifyToken(token)
    if (!payload) return null

    return await getUserById(payload.userId)
  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur courant:", error)
    return null
  }
}

/**
 * Hash un mot de passe
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12)
}

/**
 * Vérifie si l'utilisateur a les permissions pour une action
 */
export function hasPermission(user: any, action: string, resource?: any): boolean {
  switch (action) {
    case "create_project":
      return user.role === "superadmin"

    case "create_demande":
      // Tous les utilisateurs peuvent créer des demandes selon la mémoire
      return ["superadmin", "technicien", "conducteur_travaux", "responsable_qhse", "responsable_appro", "charge_affaire"].includes(user.role)

    case "validate_materiel":
      return user.role === "conducteur_travaux" || user.role === "superadmin"

    case "validate_outillage":
      return user.role === "responsable_qhse" || user.role === "superadmin"

    case "manage_sortie":
      return user.role === "responsable_appro" || user.role === "superadmin"

    case "validate_preparation":
      return user.role === "charge_affaire" || user.role === "superadmin"

    case "final_validation":
      return user.role === "technicien" || user.role === "superadmin"

    default:
      return false
  }
}
