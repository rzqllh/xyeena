# Xyeena Product Branding & Identity

[Current source and host acceptance (2026-10-26)](STATUS.md). Live Antigravity CLI 1.4.7 approvals and scoped automatic denial passed; IDE 2.5.5 interception, broader security boundaries, and remaining runtimes are not live-accepted.

---

## 1. Brand Hierarchy

| Layer | Name | Description |
| :--- | :--- | :--- |
| **Parent Brand** | **Xyeena** | The overarching umbrella brand for all related developer intelligence tooling |
| **Product** | **Xyeena Rig** | The All-in-One Skills & Harness toolkit in this repository |
| **Engine** | **Cortex** | The native default orchestration intelligence layer (DEC-27) powering intent routing, capability execution, and adaptive governance |
| **Distribution Package** | `xyeena-agent` | Published on npm registry as `xyeena-agent` |
| **Internal Codename** | Axioven | Historical/internal reference used during the P00–P08 rebuild; **not** the active product identity |

Xyeena Notch and mascot components are separate independent projects and are not bundled in Xyeena Rig.

---

## 2. Stable Identifiers

- **npm package name:** `xyeena-agent`
- **CLI binary aliases:** `xyeena`, `xyeena-agent`
- **Skill namespaces:** `xyeena-*` (19 packaged Agent Skills)
- **Host plugin identifier:** `xyeena`
- **Project state paths:** `.xyeena/` (runtime locks, backups, configs) and host-specific skill roots (`.gemini/`, `.agents/`, `.claude/`, `.hermes/`)

---

## 3. Version Truth & Distribution Policy

Brand descriptions must strictly distinguish between the published npm package baseline and unreleased local source:
- Published npm baseline: `0.4.1`
- Current local rebuild source: `0.4.1` (with unreleased P00–P10.2 rebuild additions, frozen on feature branch)
- Planned future release: `0.5.0` (pending owner approval, exact checks, and release tag)

Historical npm releases and Git tags are immutable. For product scope, see the [README](../README.md). For operational release policies, see [STATUS.md](STATUS.md).
