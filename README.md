# Gestion des Demandes de Matériel

Application de gestion des demandes de matériel et outillage pour projets de construction.

## Technologies utilisées

- **Frontend**: Next.js 15, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Base de données**: PostgreSQL
- **Authentification**: JWT avec bcryptjs
- **Validation**: Zod
- **UI**: Radix UI, Lucide React

## Installation et Configuration

### 1. Cloner le projet et installer les dépendances

```bash
npm install
```

### 2. Configuration de la base de données

1. Créer une base de données PostgreSQL
2. Copier le fichier `.env.example` vers `.env`
3. Configurer la variable `DATABASE_URL` dans le fichier `.env`:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/gestion_demandes_materiel?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
```

### 3. Initialiser la base de données

```bash
# Générer le client Prisma
npm run db:generate

# Créer et appliquer les migrations
npm run db:push

# Peupler la base avec des données de test
npm run db:seed
```

### 4. Démarrer l'application

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:3000`

## Comptes de test

Après avoir exécuté le seed, vous pouvez vous connecter avec :

- **Super Admin**: admin@example.com / password
- **Technicien**: jean.dupont@example.com / password
- **Conducteur**: pierre.martin@example.com / password
- **QHSE**: marie.durand@example.com / password
- **Appro**: paul.bernard@example.com / password
- **Chargé d'affaire**: sophie.moreau@example.com / password

## Scripts disponibles

- `npm run dev` - Démarrer en mode développement
- `npm run build` - Construire l'application
- `npm run start` - Démarrer en production
- `npm run db:generate` - Générer le client Prisma
- `npm run db:push` - Pousser le schéma vers la DB
- `npm run db:migrate` - Créer une migration
- `npm run db:seed` - Peupler la base de données
- `npm run db:reset` - Réinitialiser la base de données
- `npm run db:studio` - Ouvrir Prisma Studio

## Architecture

### Rôles et Permissions

- **SUPERADMIN**: Accès complet, gestion des utilisateurs et projets
- **TECHNICIEN**: Création de demandes, validation finale
- **CONDUCTEUR_TRAVAUX**: Validation des demandes de matériel
- **RESPONSABLE_QHSE**: Validation des demandes d'outillage
- **RESPONSABLE_APPRO**: Gestion des sorties de stock
- **CHARGE_AFFAIRE**: Validation des préparations

### Workflow des demandes

1. **Création** (tous les rôles)
2. **Validation métier** (Conducteur/QHSE selon le type)
3. **Préparation sortie** (Appro)
4. **Validation préparation** (Chargé d'affaire)
5. **Validation finale** (Technicien créateur)

### API Endpoints

- `POST /api/auth/login` - Authentification
- `GET /api/users` - Liste des utilisateurs (Admin uniquement)
- `POST /api/users` - Créer un utilisateur (Admin uniquement)
- `GET /api/demandes` - Liste des demandes (selon rôle)
- `POST /api/demandes` - Créer une demande (tous les rôles)
- `GET /api/projets` - Liste des projets
- `POST /api/projets` - Créer un projet (Admin uniquement)

## Sécurité

- Authentification JWT avec tokens sécurisés
- Mots de passe hashés avec bcryptjs
- Validation des données avec Zod
- Permissions basées sur les rôles
- Protection CSRF intégrée à Next.js
