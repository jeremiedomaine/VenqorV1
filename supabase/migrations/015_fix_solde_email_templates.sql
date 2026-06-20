-- Corriger les modèles solde qui contiennent encore du texte acompte

update public.workspaces
set
  email_paiement_objet = '{domaine} — Règlement de votre solde',
  email_paiement_intro = 'Bonjour {couple},

Votre mariage chez {domaine} approche. Merci de régler votre {libelle} ({montant}) via le lien sécurisé ci-dessous.'
where
  email_paiement_objet ilike '%acompte%'
  or email_paiement_intro ilike '%acompte%'
  or email_paiement_intro ilike '%confirmer votre réservation%';
