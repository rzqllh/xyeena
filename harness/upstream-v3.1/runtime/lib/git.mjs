import { spawnSync } from "node:child_process";

export function runGit(args, { allowFailure = false, cwd } = {}) {
  const r = spawnSync("git", args, { encoding: "utf8", cwd });
  if (r.status !== 0 && !allowFailure) {
    throw new Error((r.stderr || r.stdout || `git ${args.join(" ")} failed`).trim());
  }
  return { status: r.status ?? 1, stdout: (r.stdout || "").trim(), stderr: (r.stderr || "").trim() };
}

export function isGitRepo(cwd = process.cwd()) {
  return runGit(["rev-parse", "--is-inside-work-tree"], { allowFailure: true, cwd }).status === 0;
}

export function repoRoot(cwd = process.cwd()) {
  return runGit(["rev-parse", "--show-toplevel"], { cwd }).stdout;
}

export function currentBranch(cwd) {
  return runGit(["branch", "--show-current"], { cwd }).stdout;
}

export function headSha(cwd) {
  const r = runGit(["rev-parse", "HEAD"], { allowFailure: true, cwd });
  return r.status === 0 ? r.stdout : null;
}

export function inferTargetBranch(cwd) {
  const remoteHead = runGit(["symbolic-ref", "--quiet", "--short", "refs/remotes/origin/HEAD"], { allowFailure: true, cwd });
  if (remoteHead.status === 0 && remoteHead.stdout.includes("/")) {
    return remoteHead.stdout.split("/").slice(1).join("/");
  }
  for (const name of ["main", "master"]) {
    if (runGit(["show-ref", "--verify", "--quiet", `refs/heads/${name}`], { allowFailure: true, cwd }).status === 0) {
      return name;
    }
  }
  const branch = currentBranch(cwd);
  return branch || "main";
}

export function trackedFiles(cwd) {
  const out = runGit(["ls-files", "-z"], { cwd }).stdout;
  return out ? out.split("\0").filter(Boolean) : [];
}

export function untrackedFiles(cwd) {
  const out = runGit(["ls-files", "--others", "--exclude-standard", "-z"], { cwd }).stdout;
  return out ? out.split("\0").filter(Boolean) : [];
}

export function changedFiles(base = "HEAD", cwd) {
  const candidates = new Set();

  const committed = runGit(["diff", "--name-only", `${base}...HEAD`], { allowFailure: true, cwd });
  if (committed.status === 0 && committed.stdout) {
    for (const f of committed.stdout.split("\n")) if (f.trim()) candidates.add(f.trim());
  }

  const worktree = runGit(["diff", "--name-only", "HEAD"], { allowFailure: true, cwd });
  if (worktree.status === 0 && worktree.stdout) {
    for (const f of worktree.stdout.split("\n")) if (f.trim()) candidates.add(f.trim());
  }

  const staged = runGit(["diff", "--cached", "--name-only"], { allowFailure: true, cwd });
  if (staged.status === 0 && staged.stdout) {
    for (const f of staged.stdout.split("\n")) if (f.trim()) candidates.add(f.trim());
  }

  for (const f of untrackedFiles(cwd)) candidates.add(f);
  return [...candidates].sort();
}

export function indexDirty(cwd) {
  const r = runGit(["diff", "--cached", "--quiet"], { allowFailure: true, cwd });
  return r.status !== 0;
}

export function worktreeDirty(cwd) {
  const r = runGit(["status", "--porcelain"], { allowFailure: true, cwd });
  return Boolean(r.stdout);
}
