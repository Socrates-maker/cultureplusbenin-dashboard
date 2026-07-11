# CulturePlus Bénin — Dashboard d'administration

Back-office **React + Vite + TypeScript + Tailwind + shadcn/ui** pour les
**éditeurs** et **administrateurs** du site CulturePlus Bénin. Les requêtes
réseau utilisent **TanStack Query** ; l'API cible est le backend NestJS situé
dans `../cultureplusbenin-backend`.

## Fonctionnalités

| Section | Rôle | Détails |
| --- | --- | --- |
| Tableau de bord | éditeur / admin | Compteurs + file de modération |
| Villes, Sites touristiques, Figures historiques, Galeries, Témoignages | éditeur / admin | CRUD complet (create / edit / delete) |
| Modération | admin | Approuver / rejeter les sites & témoignages en attente |
| Médias | éditeur / admin | Upload Cloudinary + rattachement polymorphe |
| Quiz | admin | Questions (options + bonne réponse) & catégories |
| Memory | admin | Cartes (image + nom) |
| Utilisateurs | admin | Gestion des comptes & rôles |

L'accès est réservé aux comptes `admin` et `editor` ; les comptes `user` sont
refusés à la connexion. Le menu s'adapte au rôle (les jeux et la gestion des
utilisateurs sont réservés aux admins).

## Démarrage

```bash
# 1) Backend (dans ../cultureplusbenin-backend)
pnpm install
pnpm start:dev        # http://localhost:3000

# 2) Dashboard
pnpm install
cp .env.example .env  # ajustez VITE_API_URL si besoin
pnpm dev              # http://localhost:5173
```

Connectez-vous avec un compte `admin` ou `editor` existant. Pour créer un
premier admin, enregistrez un compte via l'API puis passez son `role` à `admin`
en base (ou depuis la page Utilisateurs avec un admin existant).

## Configuration

- `VITE_API_URL` — URL de base du backend (défaut `http://localhost:3000`).
- Le token JWT est stocké dans `localStorage` et injecté dans l'en-tête
  `Authorization`. Une réponse `401` déconnecte automatiquement.

## Notes d'intégration backend

- **CORS** a été activé dans `../cultureplusbenin-backend/src/main.ts`
  (`app.enableCors`), avec les origines `http://localhost:5173` et `:4173` par
  défaut. Surchargez avec la variable d'env `CORS_ORIGIN` (séparée par des
  virgules).
- Le champ `isPublished` des cartes Memory est désormais géré à la création et à
  la mise à jour (DTO + service backend), donc le bouton « Publiée » est bien
  persisté.

## Architecture

```
src/
  auth/            Contexte d'authentification (JWT)
  components/
    form/          Formulaire générique piloté par config (ResourceForm)
    ui/            Composants shadcn/ui
    ResourcePage   Page CRUD générique (table + dialogues + modération)
  config/
    resources.tsx  Définition déclarative des ressources de contenu
    nav.ts         Navigation par rôle
  lib/
    api.ts         Client axios + intercepteurs
    crud.ts        Hooks TanStack Query (collection / mutations / modération)
    types.ts       Types partagés avec le backend
  pages/           Login, Dashboard, Media, Users, Quiz, Memory
```

Les ressources de contenu (villes, sites, figures, galeries, témoignages) sont
décrites dans `config/resources.tsx` : ajouter une ressource = ajouter un objet
de config, sans écrire de nouvelle page.
```
