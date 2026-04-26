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

# Règle Déploiement — Jamais de build sur EC2 prod

## La règle

**Aucun `pnpm build` / `next build` ne doit s'exécuter sur EC2 16.58.132.68** tant que c'est l'unique serveur de prod KLASSCI College (t3.small, 2 vCPU, 2 GB RAM).

Build = ailleurs (CI GitHub Actions, dev local Linux/WSL).
Artefact = `.next/standalone/` + `.next/static/` + `public/` + `.env.local`.
Ship via rsync/scp/CI.
Sur EC2 = uniquement `sudo systemctl restart klassci-frontend`.

## Pourquoi

Sur t3.small, `next build` sature les 2 vCPU à 99 %. Pendant ces 6-10 min :

- nginx ne sert plus les requêtes en temps acceptable
- SSH banner timeout
- Real users (ex: `102.209.220.136`, observé 2026-04-26) prennent 30 s+ de timeout sur `https://college.klassci.com`
- Récupération nécessite souvent `aws ec2 stop-instances --force` → 2-3 min de downtime supplémentaires

`nice -n 19 ionice -c 3 + max-old-space-size=1536` ne suffit pas. La preuve : 2 force-stop AWS CLI nécessaires dans la session 2026-04-26 malgré ces palliatifs.

## Pattern acceptable — GitHub Actions (objectif S2)

```yaml
# .github/workflows/deploy-fe.yml
name: Deploy FE
on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v6
      - uses: pnpm/action-setup@v4
        with: { version: 10 }
      - uses: actions/setup-node@v6
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile

      - name: Build standalone
        env:
          NEXT_PUBLIC_API_URL: https://college.klassci.com
        run: pnpm build

      - name: Pack artifact
        run: |
          cp -r public .next/standalone/
          cp -r .next/static .next/standalone/.next/
          tar czf standalone.tgz -C .next/standalone .

      - name: Ship + restart
        env:
          SSH_KEY: ${{ secrets.EC2_SSH_KEY }}
          HOST:    ${{ secrets.EC2_HOST }}
        run: |
          echo "$SSH_KEY" > /tmp/k && chmod 600 /tmp/k
          scp -i /tmp/k -o StrictHostKeyChecking=no standalone.tgz ubuntu@$HOST:/tmp/
          ssh -i /tmp/k -o StrictHostKeyChecking=no ubuntu@$HOST '
            set -e
            STAGE=/tmp/standalone-new-$(date +%s)
            mkdir -p $STAGE && tar xzf /tmp/standalone.tgz -C $STAGE
            cp /home/ubuntu/klassci/klassci-frontend/.next/standalone/.env.local $STAGE/
            sudo mv /home/ubuntu/klassci/klassci-frontend/.next/standalone /home/ubuntu/klassci/klassci-frontend/.next/standalone.old
            sudo mv $STAGE /home/ubuntu/klassci/klassci-frontend/.next/standalone
            sudo systemctl restart klassci-frontend
            sleep 3
            curl -fsS http://localhost:3000/login > /dev/null || (sudo mv /home/ubuntu/klassci/klassci-frontend/.next/standalone /home/ubuntu/klassci/klassci-frontend/.next/standalone.broken && sudo mv /home/ubuntu/klassci/klassci-frontend/.next/standalone.old /home/ubuntu/klassci/klassci-frontend/.next/standalone && sudo systemctl restart klassci-frontend && exit 1)
            sudo rm -rf /home/ubuntu/klassci/klassci-frontend/.next/standalone.old'
```

Downtime perçu : <1 s.
Auto-rollback si `/login` ne répond pas après restart.

## Pattern de secours — Build local Linux/WSL

Pas Windows shell direct (la syntaxe inline `NODE_OPTIONS='--max-old-space-size=1536'` du `build` script casse sur Windows).

```bash
# Sur sa machine dev (WSL ou Mac/Linux)
pnpm install --frozen-lockfile
pnpm build
cp -r public .next/standalone/
cp -r .next/static .next/standalone/.next/
tar czf /tmp/fe-build.tgz -C .next/standalone .

# Ship + restart
rsync -avz /tmp/fe-build.tgz ubuntu@16.58.132.68:/tmp/
ssh ubuntu@16.58.132.68 '
  cd /home/ubuntu/klassci/klassci-frontend &&
  cp .next/standalone/.env.local /tmp/env.local &&
  rm -rf .next/standalone &&
  mkdir .next/standalone &&
  tar xzf /tmp/fe-build.tgz -C .next/standalone &&
  cp /tmp/env.local .next/standalone/.env.local &&
  sudo systemctl restart klassci-frontend'
```

## Anti-patterns à bloquer

| Pattern | Pourquoi NON |
|---|---|
| `ssh ubuntu@16.58.132.68 "pnpm build"` | sature CPU prod |
| `screen -dmS fe-build pnpm build` côté EC2 | screen retarde juste le constat de panne |
| `nice -n 19 ionice -c 3 pnpm build` côté EC2 | palliatif insuffisant — 2 force-stop le 2026-04-26 le prouvent |
| README de deploy qui documente le build sur EC2 comme commande standard | dette technique à supprimer une fois le pipeline CI/CD live |
| « Rapide rebuild juste pour cette feature » | × 5 = 30 min de downtime cumulé/jour |

## Smell qui doit me sauter aux yeux

Si je vois dans une mémoire ou doc :
- un workaround (`nice`, `ionice`, swap)
- ET un dernier recours après échec (`force-stop`, `kill -9`, reboot)

→ ne pas appliquer le workaround. **Fix l'architecture**. Build off-prod, point.

## Voir aussi

- Mémoire incident fondateur : `feedback_never_build_on_prod.md`
- Rule globale : `~/.claude/rules/never-build-on-prod-server.md`
- Rule sœur : `ssh-remote-commands.md` (commandes courtes, pas de sleep dans SSH)
