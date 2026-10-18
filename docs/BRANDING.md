# Xyeena product naming

Xyeena is the umbrella brand. Each product has a distinct name and scope.

| Name | Role | Code/distribution |
| --- | --- | --- |
| **Xyeena Rig** | Developer toolkit: selectable Agent Skills and opt-in project Harness | `rzqllh/xyeena`, npm `xyeena-agent` |
| **Xyeena Notch** | Desktop companion with its Island interface | Separate repo `rzqllh/xyeena-notch`; not bundled in Rig |
| **Xyn: The Lion Guardian** | Original Xyeena mascot identity | Mascot assets/components are managed separately from Rig |

**Rig positioning:** Equip your agent. Guard your project.

## Stable technical identifiers

The rebrand changes product presentation, **not APIs or installation paths**:

- npm name: `xyeena-agent` (do not rename to `xyeena-rig` or publish a duplicate package).
- CLI commands: `xyeena` and `xyeena-agent`.
- Existing Skill IDs: `xyeena-*` (e.g. `xyeena-core`), not `rig-*`.
- Plugin IDs: `xyeena`; marketplace display names may say **Xyeena Rig**.
- Installed project state: `.xyeena/`, `.agents/skills/`, and `.claude/skills/`.
- Harness runtime, filenames and config keys stay unchanged.

Refer to the product as **Xyeena Rig** in marketing, README and human-facing UI. Use `xyeena-agent` in exact npm commands, package links, migration instructions and release evidence. Use **Xyeena** alone for the parent brand only when speaking about the full product family.

## Published npm versus current source

[`xyeena-agent@0.2.0`](https://www.npmjs.com/package/xyeena-agent/v/0.2.0) was published before [the Rig branding PR #4](https://github.com/rzqllh/xyeena/pull/4). GitHub source carries the updated product identity. Version `0.2.1` is the first release line intended to ship Rig branding in npm metadata, npm README and CLI help; it must be published and verified separately. The existing `0.2.0` tarball stays immutable, and the package identifier remains `xyeena-agent`.

## Release policy

`xyeena-agent@0.2.0` and GitHub tag `v0.2.0` are published, immutable historical release artifacts. This naming change in the repository does **not** alter the published npm version. Publish the separate `0.2.1` patch only after verification; do not rewrite an existing release/tag. Pure documentation changes alone do not warrant further npm version bumps.

Do not import Notch, Island, or Xyn binaries/assets into the Rig package. They have separate delivery and licensing concerns.
