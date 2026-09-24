# AGENTS.md

## Airlock landing page

Moved to `~/code/oe/landing-page/` — it now ships as its own image with its
own CI, like frisk's and db-risk-factor's landing pages. This repo only owns
the routing for it (`k8s/ingress.yaml`, namespace `oe`), same as those.
