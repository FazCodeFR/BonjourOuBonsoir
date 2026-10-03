# Algorithme « Bonjour ou Bonsoir ? »

Ce document décrit la logique de [salutation.js](salutation.js), partagée par la page ([index.js](index.js)) et les Cloudflare Pages Functions ([functions/](functions/)), pour décider, à un instant donné, s'il faut dire **« Bonjour »** ou **« Bonsoir »** en France métropolitaine.

## 1. Règles de savoir-vivre

D'après les précis de savoir-vivre français (notamment *France-Pittoresque*), les usages se répartissent ainsi :

| Période | Salutation usuelle | Remarque |
|---|---|---|
| Lever du soleil → 12 h | Bonjour | Standard |
| 12 h → 17 h 30 | Bonjour | « Bon(ne) après-midi » sert à prendre congé, pas à saluer |
| 17 h 30 → 18 h | **Zone de bascule** | « Bonsoir » se substitue à « Bonjour » |
| 18 h → coucher du soleil | Bonsoir | Salutation et prise de congé |
| Au moment d'aller dormir | Bonne nuit | Uniquement avant de se coucher |

**Variante saisonnière :** la règle « quand la nuit tombe » donne ~17-18 h en hiver et ~19-20 h en été. C'est pourquoi l'algorithme s'appuie sur le coucher du soleil **réel**, et non sur une heure fixe.

## 2. Constantes

```js
SEUIL_MATIN_DEFAUT        = 6     // 6 h 00 — plancher du matin
SEUIL_BONSOIR_SAVOIR_VIVRE = 17.5 // 17 h 30 — début de la zone de bascule
SEUIL_BONSOIR_DEFAUT      = 18    // 18 h 00 — fin de la zone de bascule
```

## 3. Données solaires

Côté serveur ([functions/_lib/soleil.js](functions/_lib/soleil.js)), l'algorithme interroge l'API publique [sunrise-sunset.org](https://sunrise-sunset.org) pour obtenir le lever et le coucher du soleil **du jour à Paris** :

```
GET https://api.sunrise-sunset.org/json?lat=48.8566&lng=2.3522&tzid=Europe/Paris&date=AAAA-MM-JJ
```

La réponse est mise en cache 24 h chez Cloudflare : l'API est appelée environ une fois par jour, pas à chaque visite. Le navigateur, lui, n'appelle jamais cette API.

Réponse (extrait) :

```json
{
  "results": {
    "sunrise": "6:28:05 AM",
    "sunset":  "9:07:18 PM"
  },
  "status": "OK"
}
```

Les heures `AM/PM` sont converties en **heures décimales** (ex. `9:07:18 PM` → `21.122`).

Si l'API échoue (réseau coupé, quota dépassé…), on retombe sur les valeurs par défaut **6 h / 18 h**, et on réessaie 5 minutes plus tard.

L'heure courante est toujours **l'heure de Paris** (`Europe/Paris`), quel que soit le fuseau du visiteur ou du serveur.

## 4. Calcul du seuil du matin

```
seuil_matin = MAX(6h, lever_soleil)
```

**Pourquoi un plancher à 6 h ?** En été, le soleil se lève parfois à 5 h 30. Or saluer quelqu'un par « Bonjour » à 5 h 30 du matin est inhabituel — la plupart des gens dorment encore. On force donc le seuil à 6 h minimum.

## 5. Calcul du seuil du soir (zone de bascule)

C'est le cœur de l'algorithme. On veut :

- En hiver (coucher ~17 h) → basculer à **17 h 30** (plancher savoir-vivre).
- En été (coucher ~21 h) → basculer à **18 h** (plafond savoir-vivre).
- À la mi-saison → basculer **~30 min avant le coucher**.

D'où la formule :

```
seuil_naturel = MAX(17h30, coucher_soleil − 30 min)
seuil_soir    = MIN(18h, seuil_naturel)
```

### Exemples

| Saison | Coucher du soleil | `coucher − 30 min` | `MAX(17h30, ...)` | `MIN(18h, ...)` |
|---|---|---|---|---|
| Hiver (déc.) | 16 h 55 | 16 h 25 | 17 h 30 | **17 h 30** |
| Équinoxe (mars) | 18 h 45 | 18 h 15 | 18 h 15 | **18 h 00** |
| Été (juin) | 21 h 55 | 21 h 25 | 21 h 25 | **18 h 00** |
| Automne (oct.) | 18 h 10 | 17 h 40 | 17 h 40 | **17 h 40** |

Le seuil reste donc **toujours dans l'intervalle `[17 h 30 ; 18 h 00]`**, ce qui respecte la zone de bascule de l'usage français.

## 6. Décision finale

```
si seuil_matin ≤ heure_courante < seuil_soir
    → "Bonjour"
sinon
    → "Bonsoir"
```

## 7. Rendu serveur et rafraîchissement

1. **Serveur** ([functions/_middleware.js](functions/_middleware.js)) : sur `/` et `/en/`, la salutation et l'heure de bascule sont écrites directement dans le HTML, ainsi que le lever et le coucher (`data-lever`, `data-coucher`). La page s'affiche donc avec le bon mot dès le départ, sans clignotement, même pour les robots et les navigateurs sans JavaScript.
2. **Navigateur** ([index.js](index.js)) : reprend ces valeurs et recalcule le texte toutes les **3 minutes**, pour que la bascule de **17 h 30 → 18 h** se fasse quasiment en temps réel. Au changement de jour (ou si la page vient du cache hors ligne), il recharge les données via `/api/bonjour-ou-bonsoir`.

### Visiteur hors du fuseau français

La réponse principale reste toujours celle de la **France**. Si le visiteur n'a pas la même heure que Paris à cet instant (on compare les décalages UTC : Bruxelles ou Madrid ne sont donc pas concernés, Montréal ou La Réunion le sont), une carte **« Chez vous »** s'affiche dessous :

- même règle (seuils 6 h, 17 h 30 – 18 h, coucher − 30 min), appliquée à **l'heure locale** du visiteur ;
- lever/coucher du soleil **de sa position approximative**, déduite de l'IP par Cloudflare (`request.cf` : fuseau, latitude, longitude, ville), arrondie à 0,1° et mise en cache 24 h par lieu ;
- si le fuseau du navigateur diffère de celui de l'IP (VPN…), la position est inconnue : on applique les valeurs par défaut 6 h / 18 h.

Les robots (User-Agent contenant `bot`, `crawl`, `spider`…) ne reçoivent que la réponse France.

## 8. API publique

```
GET https://bonjouroubonsoir.fr/api/bonjour-ou-bonsoir
```

| Paramètre | Rôle |
|---|---|
| `lang=fr\|en` | Format des heures (`17h41` ou `5:41 PM`). Défaut : `fr` |
| `tz` | Fuseau IANA pour la partie `local` (ex. `America/Toronto`). Défaut : celui de l'IP |
| `lat`, `lng` | Position pour le soleil local. Défaut : celle de l'IP (si `tz` correspond) |

```json
{
  "france": {
    "reponse": "Bonsoir",
    "heure": "18h12",
    "bascule": "17h41",
    "lever": "7h48",
    "coucher": "19h11",
    "ville": "Paris",
    "fuseau": "Europe/Paris",
    "date": "2026-10-03",
    "leverDecimal": 7.8031,
    "coucherDecimal": 19.1847
  },
  "local": null,
  "memeHeureQueLaFrance": true,
  "source": "https://bonjouroubonsoir.fr/"
}
```

`local` a la même forme que `france` quand le visiteur (ou `tz`) n'a pas l'heure française, sinon `null`.

Accessible sans authentification, CORS ouvert (`Access-Control-Allow-Origin: *`), cache privé de 60 secondes.

## 9. Pseudo-code complet

```text
FONCTION getSalutation(heure, lever, coucher) :
    seuil_matin = MAX(6h, lever)
    seuil_naturel = MAX(17h30, coucher - 0.5)
    seuil_soir = MIN(18h, seuil_naturel)
    SI seuil_matin ≤ heure < seuil_soir :
        RETOURNER "Bonjour"
    SINON :
        RETOURNER "Bonsoir"
```
