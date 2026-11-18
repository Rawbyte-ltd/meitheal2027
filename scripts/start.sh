#!/bin/sh
# Railway retires the old deployment with SIGTERM; exit 0 on that so a normal
# redeploy isn't reported as a crash. A real crash still exits non-zero.
node scripts/check-env.mjs || exit $?
node scripts/migrate.mjs || exit $?
node node_modules/next/dist/bin/next start -p "${PORT:-3000}" &
pid=$!
trap 'kill -TERM "$pid" 2>/dev/null; wait "$pid"; exit 0' TERM INT
wait "$pid"
exit $?
