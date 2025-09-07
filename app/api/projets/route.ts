import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth, withPermission } from "@/lib/middleware"
import { createProjetSchema } from "@/lib/validations"

/**
 * GET /api/projets - Récupère les projets
 */
export const GET = withAuth(async (request: NextRequest, currentUser: any) => {
  try {
    let whereClause: any = {}

    // Filtrer selon le rôle
    if (currentUser.role !== "superadmin") {
      // Les utilisateurs voient les projets auxquels ils sont assignés ou qu'ils ont créés
      const userProjets = await prisma.userProjet.findMany({
        where: { userId: currentUser.id },
        select: { projetId: true }
      })
      const projetIds = userProjets.map((up: any) => up.projetId)
      
      whereClause = {
        OR: [
          { createdBy: currentUser.id },
          { id: { in: projetIds } }
        ]
      }
    }

    const projets = await prisma.projet.findMany({
      where: whereClause,
      include: {
        createur: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true
          }
        },
        utilisateurs: {
          include: {
            user: {
              select: {
                id: true,
                nom: true,
                prenom: true,
                email: true,
                role: true
              }
            }
          }
        },
        _count: {
          select: {
            demandes: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: projets,
    })
  } catch (error) {
    console.error("Erreur lors de la récupération des projets:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
})

/**
 * POST /api/projets - Crée un nouveau projet
 */
export const POST = withPermission(["superadmin"], async (request: NextRequest, currentUser: any) => {
  try {
    const body = await request.json()
    
    // Validation des données
    const validatedData = createProjetSchema.parse(body)
    
    // Validation supplémentaire des dates
    if (validatedData.dateFin && validatedData.dateFin !== "" && new Date(validatedData.dateFin) <= new Date(validatedData.dateDebut)) {
      return NextResponse.json({ success: false, error: "La date de fin doit être postérieure à la date de début" }, { status: 400 })
    }

    // Créer le projet
    const newProjet = await prisma.projet.create({
      data: {
        nom: validatedData.nom,
        description: validatedData.description,
        dateDebut: new Date(validatedData.dateDebut),
        dateFin: validatedData.dateFin ? new Date(validatedData.dateFin) : null,
        createdBy: currentUser.id,
        actif: true,
      },
      include: {
        createur: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true
          }
        },
        utilisateurs: {
          include: {
            user: {
              select: {
                id: true,
                nom: true,
                prenom: true,
                email: true,
                role: true
              }
            }
          }
        }
      }
    })

    // Assigner les utilisateurs au projet si spécifiés
    if (validatedData.utilisateurs && validatedData.utilisateurs.length > 0) {
      await Promise.all(
        validatedData.utilisateurs.map((userId: string) =>
          prisma.userProjet.create({
            data: {
              userId,
              projetId: newProjet.id,
            }
          })
        )
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: newProjet,
      },
      { status: 201 },
    )
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ success: false, error: "Données invalides", details: error }, { status: 400 })
    }
    
    console.error("Erreur lors de la création du projet:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
})
