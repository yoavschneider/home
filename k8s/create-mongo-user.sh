#!/bin/bash
# Creates (or updates the password of) a per-project user on the shared replica
# set. The init-users.sh in mongo.yaml only runs when a mongo pod starts with an
# empty data dir, so it covers a fresh cluster and nothing else — any project
# added after the replica set was initialized needs this once.
#
# Usage: ./k8s/create-mongo-user.sh <db> <user> <password>
#   e.g. ./k8s/create-mongo-user.sh frisk frisk "$MONGO_FRISK_PASSWORD"
set -euo pipefail
cd "$(dirname "$0")/.."
[ $# -eq 3 ] || { echo "usage: $0 <db> <user> <password>" >&2; exit 1; }
DB=$1 USER=$2 PASS=$3

set -a
source .env.prod
set +a

kubectl exec -n db mongo-0 -- mongosh \
  -u "$MONGO_ROOT_USERNAME" -p "$MONGO_ROOT_PASSWORD" \
  --authenticationDatabase admin --quiet --eval "
    db = db.getSiblingDB('$DB');
    const spec = { user: '$USER', pwd: '$PASS', roles: [{ role: 'readWrite', db: '$DB' }] };
    // idempotent: createUser throws once the user exists, so fall back to updateUser
    try { db.createUser(spec); print('created $USER on $DB'); }
    catch (e) {
      if (!/already exists/i.test(e.message)) throw e;
      db.updateUser('$USER', { pwd: '$PASS', roles: spec.roles });
      print('updated $USER on $DB');
    }
  "
