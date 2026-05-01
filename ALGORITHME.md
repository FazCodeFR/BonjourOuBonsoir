# Algorithme « Bonjour ou Bonsoir ? »

Ce document décrit la logique utilisée par [index.js](index.js) pour décider, à un instant donné, s'il faut dire **« Bonjour »** ou **« Bonsoir »** en France métropolitaine.

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

L'algorithme interroge l'API publique [sunrise-sunset.org](https://sunrise-sunset.org) pour obtenir le lever et le coucher du soleil **du jour à Paris** :

```
GET https://api.sunrise-sunset.org/json?lat=48.8566&lng=2.3522&date=today&tzid=Europe/Paris
```

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

Si l'API échoue (réseau coupé, quota dépassé…), on retombe sur les valeurs par défaut **6 h / 18 h**.

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

## 7. Boucle de rafraîchissement

| Action | Fréquence |
|---|---|
| Mise à jour du texte affiché | toutes les **3 minutes** |
| Rechargement lever/coucher du soleil | toutes les **6 heures** |

Le rafraîchissement court (3 min) garantit que la transition de **17 h 30 → 18 h** se fait quasiment en temps réel. Le rechargement long (6 h) suffit largement pour suivre l'évolution journalière du soleil sans saturer l'API.

## 8. Pseudo-code complet

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
