import { type NextRequest, NextResponse } from "next/server"
import type { Article, User } from "@/types"

// Base de données simulée pour les utilisateurs
const USERS_DB: User[] = [
  {
    id: "1",
    nom: "Admin",
    prenom: "Super",
    email: "admin@example.com",
    role: "superadmin",
    projets: [],
    createdAt: new Date(),
  },
  {
    id: "2",
    nom: "Dupont",
    prenom: "Jean",
    email: "jean.dupont@example.com",
    role: "technicien",
    projets: ["1"],
    createdAt: new Date(),
  },
]

// Base de données simulée des articles
const ARTICLES_DB: Article[] = [
  {
    id: "1",
    nom: "Casque de sécurité",
    description: "Casque de protection individuelle",
    reference: "CAS-001",
    type: "outillage",
    unite: "pièce",
    stock: 50,
    prixUnitaire: 25.99,
    createdAt: new Date(),
  },
  {
    id: "2",
    nom: "Gants de protection",
    description: "Gants anti-coupure niveau 5",
    reference: "GAN-001",
    type: "outillage",
    unite: "paire",
    stock: 100,
    prixUnitaire: 12.50,
    createdAt: new Date(),
  },
  {
    id: "3",
    nom: "Ciment Portland",
    description: "Sac de ciment 25kg",
    reference: "CIM-001",
    type: "materiel",
    unite: "sac",
    stock: 200,
    prixUnitaire: 8.75,
    createdAt: new Date(),
  },
  {
    id: "4",
    nom: "Fer à béton",
    description: "Barre de fer 12mm - 6m",
    reference: "FER-001",
    type: "materiel",
    unite: "barre",
    stock: 150,
    prixUnitaire: 15.30,
    createdAt: new Date(),
  },
  {
    id: "5",
    nom: "Perceuse électrique",
    description: "Perceuse 18V avec batterie",
    reference: "PER-001",
    type: "outillage",
    unite: "pièce",
    stock: 10,
    prixUnitaire: 89.99,
    createdAt: new Date(),
  },
]

/**
 * GET /api/articles - Récupère les articles
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 })
    }

    const currentUser = USERS_DB.find((u) => u.id === userId)
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Utilisateur non trouvé" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")
    const search = searchParams.get("search")

    let filteredArticles = ARTICLES_DB

    // Filtrer par type si spécifié
    if (type) {
      filteredArticles = filteredArticles.filter((a) => a.type === type)
    }

    // Filtrer par recherche si spécifiée
    if (search) {
      const searchLower = search.toLowerCase()
      filteredArticles = filteredArticles.filter(
        (a) =>
          a.nom.toLowerCase().includes(searchLower) ||
          a.description.toLowerCase().includes(searchLower) ||
          a.reference.toLowerCase().includes(searchLower)
      )
    }

    return NextResponse.json({
      success: true,
      data: filteredArticles,
    })
  } catch (error) {
    console.error("Erreur lors de la récupération des articles:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}

/**
 * POST /api/articles - Crée un nouvel article
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 })
    }

    const currentUser = USERS_DB.find((u) => u.id === userId)
    if (!currentUser || currentUser.role !== "superadmin") {
      return NextResponse.json({ success: false, error: "Accès non autorisé" }, { status: 403 })
    }

    const { nom, description, reference, type, unite, stock, prixUnitaire } = await request.json()

    if (!nom || !description || !reference || !type || !unite) {
      return NextResponse.json({ success: false, error: "Données manquantes" }, { status: 400 })
    }

    const newArticle: Article = {
      id: Date.now().toString(),
      nom,
      description,
      reference,
      type,
      unite,
      stock: stock || 0,
      prixUnitaire: prixUnitaire || 0,
      createdAt: new Date(),
    }

    ARTICLES_DB.push(newArticle)

    return NextResponse.json(
      {
        success: true,
        data: newArticle,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Erreur lors de la création de l'article:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}
