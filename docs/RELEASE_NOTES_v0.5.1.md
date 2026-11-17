# Xyeena Rig v0.5.1 — Release Notes

Xyeena Rig v0.5.1 is a targeted patch release that resolves a manifest schema detection regression in the diagnostic health checker (`xyeena setup check`).

## Patch Highlights

- **Polymorphic Manifest Detection:** Updates `setupHealthCheck` in `src/setup-health.mjs` to recognize Schema v2 installation manifests storing `"runtime": "<host>"` as a singular string.
- **Backward Compatibility:** Preserves 100% backward compatibility with legacy Schema v1 manifests storing `"runtimes": ["<host>", ...]`, as well as hybrid arrays.
- **Canonical Schema Writer Isolation:** Keeps the installer write path (`src/installer/transaction.mjs`) clean and unpolluted without duplicating array fields.
- **Automated Regression Coverage:** Adds automated unit tests in `test/setup-health.test.mjs` asserting positive and negative matches across Schema v1 and Schema v2 manifests, with all 727 repository tests passing across 75 suites.

## Upgrading & Verification

Users upgrading from v0.5.0 or v0.4.1 can run:

```sh
# Health check diagnostic (read-only)
npx --yes xyeena-agent@0.5.1 setup check --runtime antigravity

# Or using local source checkout
node bin/xyeena.mjs setup check --runtime antigravity
```

The output now accurately reports `"hostListedInManifest": true` on valid v0.5.0+ workspace installations.

## Epistemic Verification & Boundaries

This patch addresses diagnostic tooling metadata parsing. In accordance with DEC-07 and DEC-14:
- Filesystem discovery and manifest validity are distinct from live host tool enforcement.
- Antigravity IDE 2.5.5 native hook enforcement remains classified as `LIVE_BLOCKED` on record.
- Live host hooks remain classified as `HOST CONFIGURED / LIVE ACTIVATION UNVERIFIED`.

## Release Authorization

Publishing to the npm registry requires owner authorization and passes through GitHub Actions OIDC Trusted Publishing. Tag `v0.5.0` remains immutable.
