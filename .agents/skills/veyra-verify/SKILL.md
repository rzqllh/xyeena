---
name: veyra-verify
description: Mandatory empirical execution receipts and completion claim gatekeeper.
version: 1.0.0
aliases:
  - verify
---

# veyra-verify

Enforce empirical verification receipts before accepting any completion or fixed claim.

## When to Use
- Whenever an agent is about to claim a bug is fixed, a feature is ready, or tests pass.
- To prevent plausible but unverified assertions.

## Invariants
1. Receipt Before Assertion: Success statements require fresh, real terminal execution output.
2. Rejection of Conjecture: Without execution receipts, claims are strictly REJECTED.
3. Freshness Boundary: Stale receipts older than 5 minutes must be re-run before release.

## Operational Instructions
1. Discovery & Activation: Mandatory gatekeeper activated before making any completion claim, marking tasks fixed, or releasing code.
2. Engine Invocation:
   - Programmatic: `import { executeAndVerify, generateVerificationReceipt, validateCompletionClaims } from './engine.mjs'`
   - Command: `node -e "import('./skills/veyra-verify/engine.mjs').then(m => console.log(m.executeAndVerify('check', 'node -v')))"`
3. Native Host Integration:
   - Antigravity / Gemini CLI: Run actual commands via `executeAndVerify`, capture real exit codes and stdout hashes, and record `LIVE_HOST_VERIFIED` receipts.
   - Claude Code / Codex: Strictly reject synthetic or mock receipts for production completion claims.
4. Output & Verification: Deliver tamper-proof verification receipt with command output hash, duration, and timestamp.
