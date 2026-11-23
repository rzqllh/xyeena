# Veyra v1.0 — Wave 1 Skill Contracts Specification

> **Domain:** Governance & Foundation (Wave 1)
> **Skills:** `veyra-core`, `veyra-context`, `veyra-handoff`
> **Authority:** Canonical Owner Decisions DEC-01 through DEC-35 (LOCKED)
> **Runtime Target:** Pure Native ES Module (Node.js v20+ / Node.js v24), Zero Foreign Dependencies

---

## 1. Architectural Architecture & Dependency Graph

```
+-------------------------------------------------------------+
|                        VEYRA HARNESS                        |
+-------------------------------------------------------------+
         |                                           |
         v                                           v
+------------------+                       +-------------------+
|    veyra-core    | <-------------------> |   veyra-context   |
| Scope & Quality  |                       | Token Compression |
+------------------+                       +-------------------+
         |                                           |
         +-------------------+   +-------------------+
                             |   |
                             v   v
                   +-------------------+
                   |   veyra-handoff   |
                   | State & Checkpoint|
                   +-------------------+
```

### Dependency Rules (DEC-09, DEC-28):
- All three Wave 1 skills use **100% native Node.js APIs** (`node:fs`, `node:path`, `node:crypto`).
- Zero external npm runtime dependencies required.
- The dependency graph between the three skills is strictly acyclic:
  - `veyra-core` has 0 dependencies on context or handoff.
  - `veyra-context` has 0 dependencies on core or handoff.
  - `veyra-handoff` consumes state validated by `veyra-core` and can leverage `veyra-context` for checkpoint compact summaries.

---

## 2. Skill Contract: `veyra-core`

### 2.1 Mission & Scope
Enforce core pragmatic judgment, approved scope locking (DEC-03, DEC-08), AntiSlop invariants, smallest-correct-change validation, and epistemic evidence standards (DEC-07).

### 2.2 Input Schema
```typescript
interface ScopeEvaluationRequest {
  targetFiles: string[];           // Files proposed to be created, modified, or deleted
  allowedPatterns: string[];       // Explicitly approved glob patterns or path prefixes
  actionType: 'READ' | 'WRITE' | 'DELETE' | 'EXECUTE';
  isDestructive?: boolean;         // Git history, branch drop, force push, publishing
}
```

### 2.3 Output Schema
```typescript
interface ScopeEvaluationResult {
  verdict: 'PROCEED' | 'BLOCKED_SCOPE' | 'NEEDS_OWNER_APPROVAL';
  allowed: boolean;
  violations: string[];            // List of file paths or actions violating scope
  reason: string;
}
```

### 2.4 Invariants
- `PROCEED`: Allowed only if 100% of `targetFiles` match `allowedPatterns` and operation is non-destructive.
- `BLOCKED_SCOPE`: Returned if files outside approved scope are targeted without authorization.
- `NEEDS_OWNER_APPROVAL`: Returned for destructive operations, external publishing, or global configuration changes.
- Anti-Slop: Detects banned generic phrases, empty praises, em dashes, ungrounded completion assertions.

---

## 3. Skill Contract: `veyra-context`

### 3.1 Mission & Scope
Provide context economy, token payload compression, and memory boundary preservation without losing critical technical facts (DEC-24, RE-06 Caveman, RE-33 Cindy).

### 3.2 Input Schema
```typescript
interface ContextCompressionRequest {
  text: string;
  mode?: 'CONCISE' | 'ULTRA' | 'TECHNICAL_PRESERVE';
  preserveKeys?: string[];         // Explicit keys/identifiers to protect (SHAs, paths, line numbers)
}
```

### 3.3 Output Schema
```typescript
interface ContextCompressionResult {
  compressedText: string;
  originalBytes: number;
  compressedBytes: number;
  compressionRatio: number;        // compressedBytes / originalBytes
  preservedFacts: {
    paths: string[];
    hashes: string[];
    decisions: string[];
  };
}
```

### 3.4 Invariants
- 100% retention of technical facts: commit SHAs, file paths, line numbers, error codes, and DEC IDs must never be dropped or hallucinated.
- Eliminates conversational fluff, redundant polite preambles, and repetitive status announcements.

---

## 4. Skill Contract: `veyra-handoff`

### 4.1 Mission & Scope
Enable seamless cross-session continuation, portable checkpoint serialization (`CHECKPOINT.md`), and multi-host state recovery without circular questioning (DEC-04, DEC-24, RE-33 Cindy, RE-34 Orca).

### 4.2 Input Schema
```typescript
interface HandoffCheckpointRequest {
  status: 'IN_PROGRESS' | 'WAVE_0_COMPLETE' | 'WAVE_1_COMPLETE' | 'BLOCKED';
  activePhase: string;
  timestamp: string;
  authority: string;
  completedGates: string[];
  pendingGates: string[];
  nextActionGuidance: string[];
}
```

### 4.3 Output Schema
```typescript
interface HandoffCheckpointResult {
  markdown: string;               // Rendered CHECKPOINT.md content
  json: object;                   // Structured checkpoint payload
  isValid: boolean;
  validationErrors: string[];
}
```

### 4.4 Invariants
- Checkpoint output is valid Markdown compatible with Gemini CLI, Antigravity IDE, OpenAI Codex, and Claude Code.
- Parsing a checkpoint must unambiguously determine the active phase, completed gates, and the single exact next action.
