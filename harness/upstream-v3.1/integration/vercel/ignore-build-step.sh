#!/bin/bash
# Vercel Ignored Build Step helper.
#
# Vercel semantics:
#   exit 0 -> skip build
#   exit 1 -> continue build
#
# Intended for BUDGET mode, primarily to avoid building documentation-only commits.
# This is NOT guaranteed to avoid every deployment-count quota.

set -eu

# First commit / shallow-history safety: build rather than accidentally skip.
if ! git rev-parse HEAD^ >/dev/null 2>&1; then
  echo "[harness] No parent commit available; proceeding with Vercel build."
  exit 1
fi

# If there is no non-doc diff, skip.
if git diff --quiet HEAD^ HEAD -- \
  ':(exclude)**/*.md' \
  ':(exclude)**/*.mdx' \
  ':(exclude)docs/**' \
  ':(exclude)CHANGELOG*' \
  ':(exclude)LICENSE*'; then
  echo "[harness] Documentation-only change; skipping Vercel build."
  exit 0
fi

echo "[harness] Runtime-relevant change detected; proceeding with Vercel build."
exit 1
