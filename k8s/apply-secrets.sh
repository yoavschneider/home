#!/bin/bash
# Reads ../.env.prod and (re)applies the db-namespace k8s Secrets from it.
set -euo pipefail
cd "$(dirname "$0")/.."
set -a
source .env.prod
set +a

kubectl create secret generic mongo-root-credentials -n db \
  --from-literal=username="$MONGO_ROOT_USERNAME" \
  --from-literal=password="$MONGO_ROOT_PASSWORD" \
  --dry-run=client -o yaml | kubectl apply -f -

kubectl create secret generic mongo-service-credentials -n db \
  --from-literal=db-risk-factor-username="$MONGO_DB_RISK_FACTOR_USERNAME" \
  --from-literal=db-risk-factor-password="$MONGO_DB_RISK_FACTOR_PASSWORD" \
  --from-literal=db-risk-factor-backup-uri="$MONGO_DB_RISK_FACTOR_BACKUP_URI" \
  --from-literal=repoguide-username="$MONGO_REPOGUIDE_USERNAME" \
  --from-literal=repoguide-password="$MONGO_REPOGUIDE_PASSWORD" \
  --from-literal=repoguide-backup-uri="$MONGO_REPOGUIDE_BACKUP_URI" \
  --dry-run=client -o yaml | kubectl apply -f -

kubectl create secret generic mongo-keyfile -n db \
  --from-literal=keyfile="$MONGO_KEYFILE" \
  --dry-run=client -o yaml | kubectl apply -f -

kubectl create secret generic r2-credentials -n db \
  --from-literal=AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" \
  --from-literal=AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY" \
  --from-literal=R2_ENDPOINT="$R2_ENDPOINT" \
  --from-literal=R2_BUCKET="$R2_BUCKET" \
  --dry-run=client -o yaml | kubectl apply -f -
