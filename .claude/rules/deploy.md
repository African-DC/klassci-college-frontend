---
paths:
  - "scripts/**"
  - ".github/workflows/**"
  - "next.config.ts"
  - "package.json"
  - "**/*.service"
  - "**/deploy*.sh"
  - "**/deploy*.md"
  - "**/Dockerfile*"
---

# Regle Deploiement · Demo Windows, prod Contabo

## La regle

Deux cibles KLASSCI College :

- **Demo** : Windows Server 2022 `94.72.96.119` (HTTP sur l'IP). Build frontend autorise uniquement via `C:\klassci-deploy\frontend-build.ps1`.
- **Production** : VPS Contabo Linux `169.58.156.206`, jusqu'a 24 Go RAM, Dokploy compose `klassci-college-prod`. Domaine public `https://college.klassci.com`. **Build autorise sur cet hote** (`docker build` puis recreate du service `frontend`). SSH : `ssh -F deploy/ssh_config klassci-prod`.

L'ancienne **EC2 Linux `16.58.132.68` (2 Go RAM) n'existe plus**. L'interdiction de build venait de cette machine, pas du Contabo.

## Pourquoi

Sur 2 Go, un `next build` saturait le login (incident EC2 2026-04-26). Le Contabo a 24 Go : Wourri + College + un `docker build` tiennent ensemble. Ne pas relancer `pnpm build` / `next build` **dans** le conteneur frontend live : builder une image, puis recreate.

## Pattern demo Windows

```bash
cd ~/Downloads/dev/klassci-college
ssh -F deploy/ssh_config klassci
# extraire le tar, puis :
powershell -File C:\klassci-deploy\frontend-build.ps1
nssm restart klassci-frontend
```

Conditions : sauvegarder `.env.local`, un seul deploiement a la fois, verifier `/login` et `/svc/health`, restaurer si echec.

## Pattern production Contabo

Hote : `169.58.156.206` (`ssh -F deploy/ssh_config klassci-prod`).
Stack live : `/etc/dokploy/compose/klassci-college-prod/code/` (compose + Caddyfile + `.env`).
UI Dokploy : `https://dokploy.africandigitconsulting.com` (projet `klassci-college`, env `production`, app `klassci-college-prod`).
MySQL/Redis sont dans le compose, pas dans les cartes Database Dokploy. Volumes : `linux_klassci_mysql`, `linux_klassci_redis`. Jamais `docker compose down -v`.
Wourri tourne sur le meme VPS : ne pas y toucher.

Build **sur Contabo** (prefere si Docker Desktop local est down) :

```bash
ssh -4 -F deploy/ssh_config klassci-prod
docker build -t klassci-college-frontend:prod /chemin/vers/klassci-frontend
docker run --rm \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v /etc/dokploy/compose/klassci-college-prod/code:/etc/dokploy/compose/klassci-college-prod/code \
  -w /etc/dokploy/compose/klassci-college-prod/code \
  docker:27-cli compose -p klassci-college-prod up -d --no-deps --force-recreate frontend
```

Build hors serveur (CI / Docker Desktop + `docker save | ssh ... docker load`) reste valide.

Login ecoles : `https://college.klassci.com/login` + code `ROSTAN` (alias de `rostan-bouake`). `?c=rostan-bouake` reste un raccourci.
Login plateforme (pas pour l'ecole) : tenant `local`, `superadmin@klassci.com`.

## Anti-patterns

| Pattern | Pourquoi NON |
|---|---|
| `pnpm build` / `next build` dans le conteneur frontend live | image + recreate seulement |
| Recreer MySQL/Redis ou `down -v` | perd le tenant Rostan |
| Toucher le stack Wourri | autre produit live sur le meme VPS |
| Commandes vers `16.58.132.68` / `ubuntu@` / `EC2_HOST` | infra morte |
| Build Windows hors `frontend-build.ps1` | script versionne obligatoire |

## Voir aussi

- Rule globale : `~/.claude/rules/never-build-on-prod-server.md`
- Doc : `deploy/README.md`
- Skill E2E : `klassci-e2e-test` (demo Windows par defaut)
