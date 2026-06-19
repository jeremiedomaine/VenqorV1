# Venqor — Spécification V1 finalisée (Étape 0)

Document de référence avant développement : **encaissements** (Stripe + virement), **page couple**, **relances configurables**.

**Hors scope :** factures légales PDF, livret mariés riche, rapprochement bancaire automatique.

**Date :** juin 2025  
**Statut :** validé Étape 0 — prêt pour dev Phases 1–3

---

## 1. Principes produit

1. **Le domaine choisit** comment ses couples paient (Stripe et/ou virement IBAN).
2. **Stripe** → paiement confirmé **automatiquement** (webhook).
3. **Virement** → le couple **déclare** avoir payé sur la page couple ; le domaine **confirme** ou **rejette** (la déclaration met déjà Venqor à jour — la validation domaine est un contrôle, pas un blocage).
4. **Les relances** sont un **pilier** du produit : flexibles, configurées par le domaine, **pas limitées aux paiements**.
5. **Venqor ne émet pas** de factures légales : le domaine facture dans son outil compta habituel.

---

## 2. Vocabulaire UI

| Terme | Signification |
|-------|----------------|
| **Page couple** | URL privée `/portail/[token]` — sans login |
| **Date bloquée** | Statut DB `option` |
| **Confirmé** | Statut DB `confirme` |
| **Échéance** | Ligne de l’échéancier (`payments`) |
| **Déclaration de paiement** | Couple clique « J’ai effectué le virement » |

---

## 3. Modes d’encaissement

### 3.1 Niveau workspace (domaine)

Champs prévus (Phase 1) :

| Champ | Description |
|-------|-------------|
| `mode_paiement_defaut` | `virement` \| `stripe` |
| `stripe_active` | boolean — Stripe disponible pour ce domaine |
| `iban`, `bic`, `titulaire_compte` | Coordonnées affichées sur la page couple (virement) |
| `instructions_virement` | Texte libre optionnel (ex. « Merci d’indiquer vos noms ») |

**Règle :** à la création d’un échéancier, chaque `payment` hérite de `mode_paiement_defaut` sauf override manuel futur (V1.1).

### 3.2 Par échéance (`payments`)

| Champ | Description |
|-------|-------------|
| `mode_paiement` | `virement` \| `stripe` |
| `reference_virement` | Optionnel — libellé conseillé pour la banque (auto-généré, ex. `VENQOR-{payment_id_court}`) |

### 3.3 Comportement selon le mode

| Mode | Page couple | Email automatique | Confirmation Venqor |
|------|-------------|-------------------|---------------------|
| **stripe** | Bouton **Payer** (Checkout) | Lien **Payer** direct | Webhook → `paye` |
| **virement** | IBAN + montant + **J’ai payé** | Lien vers page couple (IBAN) | Couple → `declare_paye` ; domaine → `paye` ou retour `en_attente` |

---

## 4. Statuts de paiement

### 4.1 Enum / valeurs

Évolution par rapport à aujourd’hui (`en_attente` | `paye`) :

| Statut | Code | Visible couple | Visible domaine |
|--------|------|----------------|-----------------|
| En attente | `en_attente` | À régler | À encaisser |
| Déclaré payé (couple) | `declare_paye` | « Paiement déclaré — en vérification » | **À confirmer** |
| Payé | `paye` | Payé | Payé |
| Contesté / rejeté | `en_attente` (retour) | À régler (avec message optionnel) | En attente |

**Migration :** ajouter valeur `declare_paye` à l’enum `payment_status` (ou colonne dédiée `declared_at` + statut — voir 4.3).

### 4.2 Transitions

```
                    ┌─────────────────┐
                    │   en_attente    │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │ (couple: J'ai payé)│ (stripe webhook)  │
         ▼                   │                   ▼
┌─────────────────┐           │          ┌─────────────────┐
│  declare_paye   │           │          │      paye       │
└────────┬────────┘           │          └─────────────────┘
         │                   │
    (domaine: confirmer)      │
         │                   │
         ▼                   │
┌─────────────────┐           │
│      paye       │◄──────────┘
└─────────────────┘

(domaine: erreur / pas reçu)
         │
         ▼
┌─────────────────┐
│   en_attente    │
└─────────────────┘
```

### 4.3 Champs d’audit recommandés (`payments`)

| Champ | Usage |
|-------|--------|
| `declared_at` | Horodatage clic « J’ai payé » |
| `declared_by` | `couple` (constant V1) |
| `confirmed_at` | Validation domaine |
| `confirmed_by` | `profile.id` du gérant |
| `rejected_at` | Si domaine signale erreur |
| `stripe_checkout_session_id` | Stripe |
| `paid_at` | Date effective payé (webhook ou confirmation) |

---

## 5. Page couple (`/portail/[token]`)

### 5.1 Accès

- Token opaque par événement (`events.portal_token`) — **existant**.
- Pas de mot de passe couple en V1.
- Lien copiable depuis la **fiche dossier** (domaine) et injecté dans les **emails**.

### 5.2 Contenu minimal V1

**Toujours affiché (si dossier non archivé, statut option ou confirme) :**

- Nom du couple / événement, date
- Nom du domaine + contact (email / tél depuis workspace)
- **Échéancier** : libellé, montant, date d’échéance, statut

**Par échéance en attente :**

- **Mode virement :** IBAN, BIC, titulaire, montant, référence conseillée (copier), instructions optionnelles, bouton **« J’ai effectué le virement »**
- **Mode stripe :** bouton **« Payer en ligne »**

**Après clic « J’ai payé » :**

- Message de confirmation couple
- Statut ligne → `declare_paye`
- Email immédiat au domaine (voir §6)

**Exclu V1 :** éditeur guides/livret, logo upload admin (données workspace existantes affichées si présentes).

---

## 6. Emails automatiques (transactionnels)

### 6.1 Infrastructure

- Fournisseur : **Resend** ou **Postmark** (Phase 5+)
- Expéditeur : `notifications@venqor.fr` (ou domaine custom V1.1)
- Reply-to : email contact du workspace

### 6.2 Emails système (hors moteur relances)

| ID | Déclencheur | Destinataire | Contenu clé |
|----|-------------|--------------|-------------|
| `E1` | Couple clique « J’ai payé » | Domaine (contact_email) | Nom couple, montant, libellé échéance, lien fiche dossier, boutons **Confirmer** / **Non reçu** (liens signés) |
| `E2` | Domaine confirme paiement | Couple (email dossier) | « Votre paiement a été confirmé » |
| `E3` | Domaine rejette déclaration | Couple | « Le domaine n’a pas encore reçu le virement — vérifiez ou recontactez » |
| `E4` | Stripe webhook `paye` | Couple + domaine (optionnel) | Confirmation montant (reçu Stripe + email Venqor) |

**Note :** l’email `E1` doit donner au domaine l’impression d’avoir « reçu l’info » même avant vérification sur le compte bancaire.

### 6.3 Emails incluant le mode de paiement

Tout email de relance ou d’échéance généré par le **moteur de relances** (§7) doit inclure :

- **Stripe :** bouton / lien Checkout direct
- **Virement :** lien **page couple** (IBAN sur la page, pas tout le RIB dans l’email — sécurité / lisibilité)

---

## 7. Moteur de relances (flexible — Phase 5)

### 7.1 Objectif produit

Le domaine configure **des règles**, pas des dates figées Venqor.

Relances **couple** et **domaine**, déclencheurs variés — **pas uniquement paiements**.

### 7.2 Modèle de règle (concept)

```typescript
type RelanceCible = "couple" | "domaine";

type RelanceDeclencheur =
  | "echeance_jours_avant"      // X j avant date_echeance, statut en_attente
  | "echeance_jours_apres"      // X j après date_echeance, statut en_attente | declare_paye
  | "declaration_paiement"      // immédiat quand couple → declare_paye (domaine only)
  | "dossier_statut"            // ex. prospect sans date depuis X j
  | "dossier_sans_action";      // date bloquée sans acompte depuis X j

interface RelanceRegle {
  id: string;
  workspace_id: string;
  active: boolean;
  cible: RelanceCible;
  declencheur: RelanceDeclencheur;
  delai_jours: number | null;   // selon declencheur
  parametres: Record<string, unknown>; // ex. statut dossier, type échéance
  canal: "email";               // V1 : email only
  template_id: string;
  max_envois_par_dossier?: number;
}
```

### 7.3 Templates

- Bibliothèque de **templates de base** Venqor (modifiables V1.1)
- Variables : `{couple_nom}`, `{montant}`, `{date_echeance}`, `{lien_page_couple}`, `{lien_payer_stripe}`, `{nom_domaine}`, `{contact_domaine}`

### 7.4 Règles par défaut à l’inscription (suggestion)

**Couple :**

| Nom | Déclencheur | Délai | Canal |
|-----|-------------|-------|-------|
| Rappel avant échéance | `echeance_jours_avant` | 7 | email |
| Relance impayé | `echeance_jours_apres` | 3 | email |

**Domaine :**

| Nom | Déclencheur | Délai | Canal |
|-----|-------------|-------|-------|
| Couple a déclaré un virement | `declaration_paiement` | 0 | email |
| Paiement en retard | `echeance_jours_apres` | 7 | email |

Le domaine peut **désactiver**, **dupliquer**, **changer les délais** (ex. 14 j au lieu de 7).

### 7.5 Relances « métier » (non paiement) — exemples V1

| Déclencheur | Cible | Exemple |
|-------------|-------|---------|
| Prospect sans `date_debut` depuis 14 j | Domaine | « Relancer {couple} pour fixer une date » |
| Statut `option` depuis 21 j, acompte non `paye` | Couple | « Finalisez votre réservation » |
| Statut `confirme`, solde `en_attente`, J-30 mariage | Couple | Rappel solde |

### 7.6 Exécution

- **Cron daily** (06:00 Europe/Paris) : évalue toutes les règles actives
- Table `relance_envois` : log anti-doublon (règle + dossier + échéance + date)
- Paramètre workspace : `relances_actives` (master switch)

---

## 8. Côté domaine (back-office)

### 8.1 Fiche dossier — échéancier

- Badge mode : **Virement** / **Stripe**
- Statuts : En attente · **Déclaré par le couple** · Payé
- Actions :
  - **Confirmer le paiement** (si `declare_paye`)
  - **Paiement non reçu** (retour `en_attente` + email couple E3)
  - **Marquer payé** manuellement (virement reçu sans déclaration couple — cas courant)
  - Marquer impayé / annuler payé (V1.1)

### 8.2 Liste « À valider »

- Widget pipeline ou pilotage : **N déclarations de virement à confirmer**
- Filtre sur `payments.statut = declare_paye`

### 8.3 Paramètres

- Section **Encaissements** : IBAN, mode défaut, Stripe ON/OFF
- Section **Relances** : liste règles, toggles, délais, aperçu template

---

## 9. Stripe (Phase 4)

- **Checkout Session** par échéance `mode_paiement = stripe`
- Webhook → `paye` + `paid_at` (pas de `declare_paye`)
- Pas de passage par confirmation domaine
- Frais Stripe à la charge du domaine (selon modèle Connect — décision réglementation)

---

## 10. Abonnement Venqor (Phase 7)

- **Stripe Billing** séparé du flux couple
- Plans : ex. 99–129 € HT/mois
- Accès app bloqué si abonnement impayé (grace period 7 j suggérée)

---

## 11. Données & migrations (aperçu Phase 1)

```sql
-- payment_status : ajouter 'declare_paye'

alter table workspaces add column if not exists
  mode_paiement_defaut text not null default 'virement'
    check (mode_paiement_defaut in ('virement', 'stripe')),
  iban text,
  bic text,
  titulaire_compte text,
  instructions_virement text default '',
  stripe_active boolean not null default false;

alter table payments add column if not exists
  mode_paiement text not null default 'virement'
    check (mode_paiement in ('virement', 'stripe')),
  reference_virement text,
  declared_at timestamptz,
  confirmed_at timestamptz,
  rejected_at timestamptz,
  paid_at timestamptz,
  stripe_checkout_session_id text;

-- Phase 5
-- create table relance_regles (...);
-- create table relance_envois (...);
```

---

## 12. Phases de développement (rappel)

| Phase | Contenu | Livrable test |
|-------|---------|---------------|
| **0** | Ce document | Spec validée ✓ |
| **1** | DB + paramètres encaissements | IBAN enregistré, mode défaut |
| **2** | Page couple | IBAN + « J’ai payé » |
| **3** | Confirmation domaine | Email E1 + Confirmer / Rejeter |
| **4** | Stripe + webhooks | Paiement auto |
| **5** | Moteur relances flexible | Règles configurables |
| **6** | Prod + emails prod | URL réelle |
| **7** | Abonnement Venqor | Paiement SaaS |

---

## 13. Definition of Done — V1 finalisée

- [ ] Domaine configure IBAN + mode (virement / stripe)
- [ ] Page couple : virement (déclaration) + stripe (paiement)
- [ ] Flux `declare_paye` → email domaine → confirmer / rejeter
- [ ] Marquer payé manuel reste possible
- [ ] Relances configurables (≥ 4 templates, règles editables)
- [ ] Stripe webhook opérationnel
- [ ] Prod + emails
- [ ] Abonnement Venqor
- [ ] CGV : pas logiciel de facturation ; virement = relation directe domaine ↔ couple

---

## 14. Questions ouvertes (réglementation / tech)

1. **Stripe Connect** vs compte Venqor unique — à trancher avant Phase 4.
2. **IBAN dans email** : éviter ; lien page couple uniquement (retenu).
3. **RGPD** : base légale emails relances couples (intérêt legitime / exécution contrat — avis juriste).
4. **Liens signés** Confirmer/Rejeter dans email E1 : token TTL 7 j.

---

## 15. Résumé exécutif (pitch interne)

**Venqor V1 finalisée** = CRM domaine + **page couple** (Stripe **ou** IBAN + « j’ai payé ») + **relances flexibles** configurées par le domaine. Le domaine **confirme** les virements déclarés ; Stripe reste **automatique**. Pas de factures légales — le domaine facture ailleurs.

**Prochain go dev :** Phases **1 + 2 + 3**.
