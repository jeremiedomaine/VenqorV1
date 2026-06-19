-- Modèle email solde J-30 (remplace l'ancien texte acompte / date bloquée)

update public.workspaces
set
  email_paiement_objet = '{domaine} — Règlement de votre solde',
  email_paiement_intro = 'Bonjour {couple},

Votre mariage chez {domaine} approche. Merci de régler votre {libelle} ({montant}) via le lien sécurisé ci-dessous.'
where
  email_paiement_objet = '{domaine} — Règlement de votre échéance'
  or email_paiement_intro like '%date est réservée%';

alter table public.workspaces
  alter column email_paiement_objet set default '{domaine} — Règlement de votre solde';

alter table public.workspaces
  alter column email_paiement_intro set default 'Bonjour {couple},

Votre mariage chez {domaine} approche. Merci de régler votre {libelle} ({montant}) via le lien sécurisé ci-dessous.';
