# Portfolio Elhadji Ndour — mise en ligne

Site statique (HTML / CSS / JS, sans dépendance) prêt pour GitHub Pages et le domaine elhadjindour.fr.

## Mettre en ligne (GitHub Pages)

1. Ouvrez votre dépôt **elhadjindour.github.io** sur github.com.
2. Supprimez les anciens fichiers : `assets/imgs/`, `assets/css/style2.css`, `assets/js/script.js`, le dossier `ajax/` et l'ancien `index.html`.
   (Bouton « … » sur chaque dossier → *Delete directory*, puis *Commit changes*.)
3. Cliquez sur **Add file → Upload files** et glissez **tout le contenu** de ce dossier (index.html, CNAME, robots.txt, sitemap.xml, le dossier assets).
4. Cliquez sur **Commit changes**. Le site est à jour en 1 à 2 minutes.

Adresse actuelle du site : https://fadiloundour.github.io/elhadjindour.github.io/

Le domaine elhadjindour.fr n'est pas encore enregistré. Une fois acheté, ajoutez un fichier `CNAME` contenant `elhadjindour.fr` (ou renseignez le domaine dans Settings → Pages).

## Modifier un contenu

| Je veux changer… | Fichier | Où |
|---|---|---|
| Un texte | `index.html` | cherchez le texte avec Ctrl+F |
| Mon CV | `assets/docs/CV-Elhadji-Ndour.pdf` | remplacez le fichier en gardant le même nom |
| Mon book | `assets/docs/Book-Elhadji-Ndour.pdf` | idem |
| Les couleurs | `assets/css/main.css` | tout en haut, bloc `:root` (`--accent` = orange) |
| Une vidéo SenFly | `assets/video/` | même nom de fichier, format MP4 H.264 |

## Structure

```
index.html
CNAME · robots.txt · sitemap.xml
assets/
  css/main.css      styles
  js/main.js        défilement horizontal, filtres, visionneuse, formulaire
  img/              images WebP optimisées (projets, book, SenFly)
  video/            vidéos SenFly compressées (720p) + affiches
  docs/             CV et book en PDF
```

## Relier le domaine elhadjindour.fr (chez votre registrar : OVH, Gandi, IONOS…)

Supprimez les anciens enregistrements A / AAAA / CNAME de `elhadjindour.fr` et `www`, puis créez :

| Type | Nom / Sous-domaine | Valeur |
|---|---|---|
| A | (vide ou @) | 185.199.108.153 |
| A | (vide ou @) | 185.199.109.153 |
| A | (vide ou @) | 185.199.110.153 |
| A | (vide ou @) | 185.199.111.153 |
| AAAA | (vide ou @) | 2606:50c0:8000::153 |
| AAAA | (vide ou @) | 2606:50c0:8001::153 |
| AAAA | (vide ou @) | 2606:50c0:8002::153 |
| AAAA | (vide ou @) | 2606:50c0:8003::153 |
| CNAME | www | elhadjindour.github.io. |

Ensuite sur GitHub : Settings → Pages → Custom domain = `elhadjindour.fr` → Save, puis cochez **Enforce HTTPS** (disponible après quelques minutes à 24 h).
