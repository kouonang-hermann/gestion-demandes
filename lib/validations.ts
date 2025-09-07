import { z } from "zod"

// Schémas de validation pour l'authentification
export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
})

export const registerSchema = z.object({
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  prenom: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  role: z.enum([
    "superadmin",
    "technicien", 
    "conducteur_travaux",
    "responsable_qhse",
    "responsable_appro",
    "charge_affaire",
    "responsable_logistique"
  ]),
  projets: z.array(z.string()).optional(),
})

// Schémas pour les projets
export const createProjetSchema = z.object({
  nom: z.string().min(2, "Le nom du projet doit contenir au moins 2 caractères"),
  description: z.string().min(10, "La description doit contenir au moins 10 caractères"),
  dateDebut: z.string().min(1, "Date de début requise"),
  dateFin: z.string().optional(),
  utilisateurs: z.array(z.string()).optional(),
})

// Schémas pour les articles
export const createArticleSchema = z.object({
  nom: z.string().min(2, "Le nom de l'article doit contenir au moins 2 caractères"),
  description: z.string().min(5, "La description doit contenir au moins 5 caractères"),
  reference: z.string().min(3, "La référence doit contenir au moins 3 caractères"),
  unite: z.string().min(1, "L'unité est requise"),
  type: z.enum(["materiel", "outillage"]),
  stock: z.number().int().min(0).optional(),
  prixUnitaire: z.number().min(0).optional(),
})

// Schémas pour les demandes
export const createDemandeSchema = z.object({
  projetId: z.string().min(1, "Projet requis"),
  type: z.enum(["materiel", "outillage"]),
  items: z.array(z.object({
    articleId: z.string().min(1, "Article requis"),
    quantiteDemandee: z.number().int().min(1, "Quantité doit être supérieure à 0"),
    commentaire: z.string().optional(),
  })).min(1, "Au moins un article est requis"),
  commentaires: z.string().optional(),
  dateLivraisonSouhaitee: z.string().optional(),
})

export const updateDemandeStatusSchema = z.object({
  status: z.enum([
    "brouillon",
    "soumise",
    "en_attente_validation_conducteur",
    "en_attente_validation_qhse",
    "validee_conducteur",
    "validee_qhse",
    "en_attente_validation_appro",
    "validee_appro",
    "en_attente_validation_charge_affaire",
    "validee_charge_affaire",
    "en_attente_validation_logistique",
    "validee_logistique",
    "en_attente_confirmation_demandeur",
    "confirmee_demandeur",
    "rejetee",
    "archivee"
  ]),
  commentaire: z.string().optional(),
  rejetMotif: z.string().optional(),
})

// Types dérivés des schémas
export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type CreateProjetInput = z.infer<typeof createProjetSchema>
export type CreateArticleInput = z.infer<typeof createArticleSchema>
export type CreateDemandeInput = z.infer<typeof createDemandeSchema>
export type UpdateDemandeStatusInput = z.infer<typeof updateDemandeStatusSchema>
