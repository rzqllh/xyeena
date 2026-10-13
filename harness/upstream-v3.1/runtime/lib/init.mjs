import fs from "node:fs";
import path from "node:path";
import { detectProject } from "./detect.mjs";
import { inferTargetBranch, isGitRepo, trackedFiles, untrackedFiles } from "./git.mjs";
import { loadEmbeddedDefaults } from "./config.mjs";

function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }

function writeIfMissing(p, contents) {
  if (fs.existsSync(p)) return false;
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, contents);
  return true;
}

function updateGitignore(root) {
  const p = path.join(root, ".gitignore");
  const marker = ".harness/evidence/";
  if (!fs.existsSync(p)) {
    fs.writeFileSync(p, `# Xyeena Harness local evidence\n${marker}\n`);
    return "created";
  }
  const current = fs.readFileSync(p, "utf8");
  if (current.split(/\r?\n/).includes(marker)) return "unchanged";
  const prefix = current.endsWith("\n") ? current : current + "\n";
  fs.writeFileSync(p, `${prefix}\n# Xyeena Harness local evidence\n${marker}\n`);
  return "updated";
}

export function initializeProject(root) {
  const git = isGitRepo(root);
  const files = git ? [...new Set([...trackedFiles(root), ...untrackedFiles(root)])] : [];
  const detected = detectProject(root, files);
  const defaults = structuredClone(loadEmbeddedDefaults());
  const targetBranch = git ? inferTargetBranch(root) : "main";

  defaults.targetBranch = targetBranch;
  defaults.protectedBranches = [...new Set([targetBranch, "main", "master"])];
  defaults.adapters = detected.adapters.filter((x) => x !== "generic-git");

  const xdir = path.join(root, ".xyeena");
  ensureDir(xdir);

  const configPath = path.join(xdir, "config.json");
  const profilePath = path.join(xdir, "profile.md");
  const agentsPath = path.join(root, "AGENTS.md");
  const created = [];
  const skipped = [];

  if (writeIfMissing(configPath, JSON.stringify(defaults, null, 2) + "\n")) created.push(".xyeena/config.json");
  else skipped.push(".xyeena/config.json");

  const profile = `# Project Profile

This file stores durable project-specific facts only.

## Identity
- Project:
- Purpose:
- Primary stack:
- Deployment provider:

## Domain invariants
- Add only rules that must remain true across refactors.

## Shared surfaces
- Add impact mappings for shared primitives when useful.

## Critical paths
- Add project-specific paths that should elevate verification risk.

## Public documentation constraints
- Add forbidden internal/sensitive terminology only when the project requires it.

## Deployment notes
- Document whether pushes trigger previews/production and any budget constraints.
`;
  if (writeIfMissing(profilePath, profile)) created.push(".xyeena/profile.md");
  else skipped.push(".xyeena/profile.md");

  const agents = `# Agent Instructions

This project uses Xyeena Harness.

Important:
- Missing project configuration is never a reason to stop a read-only audit.
- Run \`xyeena doctor\` before implementation.
- Run \`xyeena audit\` for read-only inspection.
- Run \`xyeena verify\` before claiming completion.
- Project-specific facts live in \`.xyeena/config.json\` and \`.xyeena/profile.md\`.
- Do not invent project invariants when they are not documented or verified from the repository.
`;
  if (writeIfMissing(agentsPath, agents)) created.push("AGENTS.md");
  else skipped.push("AGENTS.md");

  const gitignore = updateGitignore(root);
  return { root, gitRepository: git, targetBranch, adapters: detected.adapters, signals: detected.signals, created, skipped, gitignore };
}
