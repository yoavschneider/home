# home

The platform my side projects run on, plus the landing page at [yoavschneider.dev](https://yoavschneider.dev).

Everything runs on a single self-managed VPS with a **k3s** Kubernetes cluster and is deployed with **GitOps**: Flux watches this repo and applies `k8s/` on every push to `main`.

## What's in here

| Path | What it does |
|---|---|
| `k8s/flux.yaml` | Flux `GitRepository` + `Kustomization` that syncs this repo into the cluster every 5 minutes (with pruning) |
| `k8s/cloudflared-deployment.yaml` | Cloudflare Tunnel (2 replicas), so the cluster is reachable without opening any inbound ports |
| `k8s/ingress.yaml` | Routing per project (one namespace and ingress route each), with middlewares for path prefixes and redirects |
| `k8s/mongo.yaml` | Shared MongoDB replica set (StatefulSet, 3 members), with a separate database and user for each project |
| `k8s/mongo-backup.yaml` | Nightly and weekly backup CronJobs |
| `k8s/landing.yaml` | The yoavschneider.dev landing page |
| `landing/` | Landing page and project write-ups |
| `uptime-monitor/` | Cloudflare Worker: checks all project sites every 5 minutes and emails an alert on state changes (state kept in KV) |
| `traffic-report/` | Cloudflare Worker: emails a weekly traffic report built from the Cloudflare Analytics API |

Each project (RepoGuide, FlowGeo, the DB delay extension's backend, …) ships its own images and manifests from its own repo. This repo owns the shared pieces: tunnel, routing, database and backups.

## Secrets

No secrets live in git. Real values go in `.env.prod` (gitignored) and are applied with `k8s/apply-secrets.sh`; see `.env.prod.example`. Per-project database users are created with `k8s/create-mongo-user.sh`.
