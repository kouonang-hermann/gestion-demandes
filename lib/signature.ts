import crypto from "crypto"
import type { User } from "@/types"

/**
 * Génère une signature numérique pour une action
 */
export function generateSignature(userId: string, action: string, timestamp: Date, data?: any): string {
  const payload = {
    userId,
    action,
    timestamp: timestamp.toISOString(),
    data: data ? JSON.stringify(data) : null,
  }

  const content = JSON.stringify(payload)
  return crypto.createHash("sha256").update(content).digest("hex")
}

/**
 * Vérifie une signature numérique
 */
export function verifySignature(
  signature: string,
  userId: string,
  action: string,
  timestamp: Date,
  data?: any,
): boolean {
  const expectedSignature = generateSignature(userId, action, timestamp, data)
  return signature === expectedSignature
}

/**
 * Crée une signature de validation
 */
export function createValidationSignature(user: User, action: string, commentaire?: string) {
  const timestamp = new Date()
  const signature = generateSignature(user.id, action, timestamp, { commentaire })

  return {
    userId: user.id,
    date: timestamp,
    commentaire,
    signature,
  }
}

/**
 * Vérifie si une modification est encore possible (45 minutes pour appro)
 */
export function canModifySortie(dateSortie: Date): boolean {
  const now = new Date()
  const diffMinutes = (now.getTime() - dateSortie.getTime()) / (1000 * 60)
  return diffMinutes <= 45
}
