#!/usr/bin/env bash
# Build + publikacja na Firebase Hosting (projekt z .firebaserc).
#
# Uwierzytelnienie – wystarczy jedno z poniższych:
#   FIREBASE_SERVICE_ACCOUNT – zawartość JSON konta serwisowego (rola Firebase Hosting Admin)
#   FIREBASE_TOKEN           – token z `firebase login:ci`
#   wcześniejsze `firebase login` na tej maszynie
set -euo pipefail

SERVICE_ACCOUNT_FILE=""

cleanup() {
    if [ -n "$SERVICE_ACCOUNT_FILE" ]; then
        rm -f "$SERVICE_ACCOUNT_FILE"
    fi
}
trap cleanup EXIT

if [ -n "${FIREBASE_SERVICE_ACCOUNT:-}" ]; then
    SERVICE_ACCOUNT_FILE="$(mktemp)"
    printf '%s' "$FIREBASE_SERVICE_ACCOUNT" > "$SERVICE_ACCOUNT_FILE"
    export GOOGLE_APPLICATION_CREDENTIALS="$SERVICE_ACCOUNT_FILE"
fi

npm run build
npx --yes firebase-tools@14 deploy --only hosting --non-interactive
