# Bonjour ou Bonsoir Readme

This is a simple HTML website that tells you whether to say "Bonjour" or "Bonsoir" based on the time of day.

# Technology Stack

- HTML, CSS, JavaScript (ES modules, no build step)
- [Cloudflare Pages](https://pages.cloudflare.com/) + Pages Functions: the answer is computed server-side and written into the HTML (no flicker, readable by bots and without JavaScript)
- Sunrise/sunset data from [sunrise-sunset.org](https://sunrise-sunset.org), cached 24 h at the edge

See [ALGORITHME.md](ALGORITHME.md) for the full decision logic.

# Features

A dynamic message that updates based on the time of day, displaying either "Bonjour" or "Bonsoir".
When the visitor is not on French time, a second answer for their own time zone is shown below.
Share links for Twitter and Facebook to share the page with friends and family.
A responsive design that adjusts to the screen size of the user's device.
Meta Information
The website contains several meta tags for SEO optimization and social media sharing.

# API

A free, public JSON endpoint (no authentication, CORS enabled):

```
GET https://bonjouroubonsoir.fr/api/bonjour-ou-bonsoir
```

```json
{
  "france": { "reponse": "Bonsoir", "heure": "18h12", "bascule": "17h41", "lever": "7h48", "coucher": "19h11", "ville": "Paris", "fuseau": "Europe/Paris", "date": "2026-10-03" },
  "local": null,
  "memeHeureQueLaFrance": true,
  "source": "https://bonjouroubonsoir.fr/"
}
```

- `france.reponse`: what to say right now in France (`Bonjour` or `Bonsoir`).
- `local`: same object for the caller's time zone (from the IP, or `?tz=America/Toronto&lat=43.65&lng=-79.38`), `null` when it matches French time.
- `?lang=en`: times formatted as `5:41 PM`.

# Local development

```
npx wrangler pages dev .
```

# Accessibility

The website has a semantic HTML structure and uses descriptive alt text for images. The site is designed to be accessible for users with disabilities.

# How to Use

Simply visit the website and see the current greeting displayed. Share the page using the links provided for Twitter and Facebook.

# License

This project is open source under the [MIT License](LICENSE).

## Authors

- [@FazCodeFR](https://www.github.com/FazCodeFR)
- [@DiamoonWolf](https://github.com/DiamoonWolf)
