import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPassword } from "@/lib/auth"
import { withPermission } from "@/lib/middleware"
import { registerSchema } from "@/lib/validations"

/**
 * GET /api/users - Récupère les utilisateurs
 */
export const GET = withPermission(["superadmin"], async (request: NextRequest, currentUser: any) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        role: true,
        createdAt: true,
        projets: {
          include: {
            projet: {
              select: {
                id: true,
                nom: true,
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: users,
    })
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
})

/**
 * POST /api/users - Crée un nouvel utilisateur
 */
export const POST = withPermission(["superadmin"], async (request: NextRequest, currentUser: any) => {
  try {
    const body = await request.json()
    
    // Validation des données
    const validatedData = registerSchema.parse(body)

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return NextResponse.json({ success: false, error: "Cet email est déjà utilisé" }, { status: 400 })
    }

    // Hash du mot de passe
    const hashedPassword = await hashPassword(validatedData.password)

    // Créer l'utilisateur
    const newUser = await prisma.user.create({
      data: {
        nom: validatedData.nom,
        prenom: validatedData.prenom,
        email: validatedData.email,
        password: hashedPassword,
        role: validatedData.role,
      },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        role: true,
        createdAt: true,
      }
    })

    // Assigner aux projets si spécifiés
    if (validatedData.projets && validatedData.projets.length > 0) {
      await prisma.userProjet.createMany({
        data: validatedData.projets.map(projetId => ({
          userId: newUser.id,
          projetId,
        })),
        skipDuplicates: true,
      })
    }

    return NextResponse.json(
      {
        success: true,
        data: newUser,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ success: false, error: "Données invalides", details: error }, { status: 400 })
    }
    
    console.error("Erreur lors de la création de l'utilisateur:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
})
