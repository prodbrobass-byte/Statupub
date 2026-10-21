# StatuPub

Régie publicitaire sur les statuts WhatsApp (Sénégal).
Les annonceurs paient au clic, les diffuseurs gagnent de l'argent avec leur statut.

## Architecture
- `index.html` : l'application web complète (accueil, espaces Annonceur, Diffuseur, Admin), hébergée sur GitHub Pages.
- `supabase/` : base de données, sécurité et logique métier (projet Supabase « statupub »).
- `supabase/functions/go` : traqueur de clics anti-fraude (`/functions/v1/go/<CODE>`).
- `tests/` : tests de bout en bout (API et interface).

## Anti-fraude
Un clic n'est payé qu'une fois par personne et par campagne (cookie + empreinte), les robots et aperçus WhatsApp sont ignorés,
limites par appareil, par connexion et par jour, gains bloqués 24 h avant retrait. Tous les seuils se règlent dans Admin › Réglages.
