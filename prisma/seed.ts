import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Début du seeding...')

  // Hash du mot de passe par défaut
  const hashedPassword = await bcrypt.hash('password', 12)

  // Créer les utilisateurs
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        nom: 'Admin',
        prenom: 'Super',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'superadmin',
      },
    }),
    prisma.user.upsert({
      where: { email: 'jean.dupont@example.com' },
      update: {},
      create: {
        nom: 'Dupont',
        prenom: 'Jean',
        email: 'jean.dupont@example.com',
        password: hashedPassword,
        role: 'technicien',
      },
    }),
    prisma.user.upsert({
      where: { email: 'pierre.martin@example.com' },
      update: {},
      create: {
        nom: 'Martin',
        prenom: 'Pierre',
        email: 'pierre.martin@example.com',
        password: hashedPassword,
        role: 'conducteur_travaux',
      },
    }),
    prisma.user.upsert({
      where: { email: 'marie.durand@example.com' },
      update: {},
      create: {
        nom: 'Durand',
        prenom: 'Marie',
        email: 'marie.durand@example.com',
        password: hashedPassword,
        role: 'responsable_qhse',
      },
    }),
    prisma.user.upsert({
      where: { email: 'paul.bernard@example.com' },
      update: {},
      create: {
        nom: 'Bernard',
        prenom: 'Paul',
        email: 'paul.bernard@example.com',
        password: hashedPassword,
        role: 'responsable_appro',
      },
    }),
    prisma.user.upsert({
      where: { email: 'sophie.moreau@example.com' },
      update: {},
      create: {
        nom: 'Moreau',
        prenom: 'Sophie',
        email: 'sophie.moreau@example.com',
        password: hashedPassword,
        role: 'charge_affaire',
      },
    }),
  ])

  console.log('✅ Utilisateurs créés')

  // Créer un projet de test
  const projet = await prisma.projet.upsert({
    where: { id: 'projet-test-1' },
    update: {},
    create: {
      id: 'projet-test-1',
      nom: 'Projet de Construction Alpha',
      description: 'Projet de construction d\'un bâtiment industriel',
      dateDebut: new Date('2024-01-01'),
      dateFin: new Date('2024-12-31'),
      createdBy: users[0].id, // Super Admin
      actif: true,
    },
  })

  console.log('✅ Projet créé')

  // Assigner les utilisateurs au projet
  await Promise.all(
    users.slice(1).map((user) =>
      prisma.userProjet.upsert({
        where: {
          userId_projetId: {
            userId: user.id,
            projetId: projet.id,
          },
        },
        update: {},
        create: {
          userId: user.id,
          projetId: projet.id,
        },
      })
    )
  )

  console.log('✅ Utilisateurs assignés au projet')

  // Créer des articles de test
  const articles = await Promise.all([
    prisma.article.upsert({
      where: { reference: 'MAT-001' },
      update: {},
      create: {
        nom: 'Casque de sécurité',
        description: 'Casque de sécurité conforme aux normes EN 397',
        reference: 'MAT-001',
        unite: 'pièce',
        type: 'materiel',
        stock: 100,
        prixUnitaire: 12.50,
      },
    }),
    prisma.article.upsert({
      where: { reference: 'OUT-001' },
      update: {},
      create: {
        nom: 'Perceuse électrique',
        description: 'Perceuse électrique 18V avec batterie',
        reference: 'OUT-001',
        unite: 'pièce',
        type: 'outillage',
        stock: 10,
        prixUnitaire: 150.00,
      },
    }),
    prisma.article.upsert({
      where: { reference: 'MAT-002' },
      update: {},
      create: {
        nom: 'Gants de protection',
        description: 'Gants de protection en cuir renforcé',
        reference: 'MAT-002',
        unite: 'paire',
        type: 'materiel',
        stock: 100,
        prixUnitaire: 12.50,
      },
    }),
  ])

  console.log('✅ Articles créés')

  console.log('🎉 Seeding terminé avec succès!')
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
