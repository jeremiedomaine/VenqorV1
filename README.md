# Venqor V1

SaaS B2B pour gérants de lieux de réception — CRM, acomptes et portail mariés.

## Prérequis

1. Projet Supabase **Venqor V1** (vierge)
2. Fichier `.env.local` (voir `.env.example`)
3. Migrations appliquées

## Installation

```bash
npm install
cp .env.example .env.local
# Remplir les clés Supabase dans .env.local
npm run db:migrate
npm run dev:clean
```

## Développement stable

Le site peut planter (écran blanc, erreur `Cannot find module './948.js'`) si le cache Next.js est corrompu. **Cause principale :** lancer `npm run build` pendant que `npm run dev` tourne.

| Commande | Quand l'utiliser |
|----------|------------------|
| `npm run dev` | Usage quotidien — webpack, un seul processus sur le port 3000 |
| `npm run dev:clean` | Après une erreur 500 / page sans style / module introuvable |
| `npm run build` | Vérif prod — **refuse** si le dev tourne (protection anti-corruption) |
| `npm run typecheck` | Vérifier TypeScript sans toucher à `.next` |

**Règle simple :** un terminal = le dev. Un autre terminal = build ou migrations, jamais les deux en même temps.

Si ça casse : `Ctrl+C` puis `npm run dev:clean`, puis rafraîchir avec `Cmd+Shift+R`.

### Supabase Auth

Dans **Authentication → Providers → Email** :
- Désactiver « Confirm email » pour la V1 (connexion immédiate après inscription)

Dans **Authentication → URL Configuration** :
```
http://localhost:3000/**
http://localhost:3000/auth/callback
```

## Structure

| Route | Description |
|-------|-------------|
| `/login`, `/signup` | Auth + création auto du workspace |
| `/` | Pipeline CRM (Kanban) |
| `/evenements` | Événements contrat / confirmé |
| `/evenements/[id]` | Fiche + échéancier |
| `/parametres` | Paramètres (facturation, objectifs, types) |
| `/portail/[token]` | Portail mariés (V2 — route conservée, non exposée dans l’app) |

## Stack

Next.js 14 · Supabase · Tailwind · Server Actions
