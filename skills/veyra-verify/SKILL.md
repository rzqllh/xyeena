---
name: veyra-verify
description: Use when making test-pass, build-pass, fixed, or release claims that require actual command execution.
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
1. Receipt Before Assertion: Success statements require a fresh local process receipt in the signed journal.
2. Rejection of Conjecture: Synthetic JSON, manual pass labels, and unrelated commands never prove completion.
3. Freshness Boundary: Command receipts expire after 300 seconds; future-dated entries fail closed.

## Operational Instructions
1. Native Host Integration: From the project root run `node .agents/skills/veyra-verify/engine.mjs run --task tests -- npm test`, then `node .agents/skills/veyra-verify/engine.mjs gate --task tests`. The CLI creates `.veyra/receipts.jsonl`.
2. Engine entry: `import { executeAndVerify, generateVerificationReceipt, validateCompletionClaims } from './engine.mjs'`
3. Evidence boundary: A LOCAL_PROCESS_VERIFIED receipt proves a command invocation exited zero within five minutes; it does not prove the agent used its skills, authorize a release, or attest semantic correctness.

## Trust boundary
- Each workspace has an append-only JSONL journal and a signing key stored under the local user's home directory, separate from the repository.
- This detects JSON tampering by callers without access to the key. It is NOT a defense against a malicious process running as the same OS user, which can access the key.
- The journal contains task metadata and a hash of output, not raw stdout or arguments. Do not commit .veyra/ or user keys.
- A process receipt is not a native Gemini/Codex/Claude agent transcript. Real host tests require actual host tool-use events.

## Red flags
- Claiming tests passed by reading source or importing an engine without running tests.
- Accepting a receipt passed between processes without checking the signed ledger and expiry.
- Assuming a zero exit code from an unrelated command proves a bug was fixed.
- Calling a local process receipt tamper-proof or cryptographically unforgeable to the same user.

## Pressure tests
1. A caller fabricates a LIVE_HOST_VERIFIED JSON receipt: reject.
2. A command exited successfully six minutes ago: reject as stale.
3. Same receipt is loaded in a second Node process within five minutes: accept after journal validation.
4. Runner returns exit code 0, but the claim is unrelated to that command: classify the semantic claim UNKNOWN.
