# Coding Week 2026: teams and features

The teams of the Secret Santa coding week, and the feature each team builds.
The site is published at <https://onepoint-coding-week.github.io/features/>.

## What is in this repository

| File | What it holds |
|---|---|
| `site/teams.json` | The 20 teams: number, name, members (first name and initial), feature number |
| `site/features.json` | Every feature: number, title, goal. `extra: true` marks the features for teams that finish early |
| `site/index.html`, `style.css`, `app.js` | The page. It reads the two JSON files: no build step |
| `site/assets/` | Visuals and logos from the Coding Week template |
| `.github/workflows/pages.yml` | Publishes `site/` on GitHub Pages at every push on `main` |

This repository is public. Never add an email address, a full surname, or
anything about how the features were given to the teams.

## Change a team or a feature

Edit `site/teams.json` or `site/features.json`, check the page locally, then
push on `main`: the site is updated a minute later (see the Actions tab).

## Preview locally

The page loads the JSON files with `fetch`, so it needs a small web server:

```bash
python3 -m http.server -d site 8000
```

Then open <http://localhost:8000>.

## First setup

In the repository settings, **Pages > Build and deployment > Source** must be
set to **GitHub Actions**.
