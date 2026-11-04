/**
 * Xyeena Native Methods - Git Worktree Isolation Suite (Superpowers Parity)
 * Manages isolated development environments, worktree lifecycle planning,
 * dirty state checks, and safe pruning without destructive accidents.
 */

import path from 'path';
import { ERROR_CODES, XyeenaError } from '../core/errors.mjs';

export class WorktreeManager {
  /**
   * Validate that a target worktree path is safe (not inside .git, not escaping workspace unexpectedly).
   * @param {string} repoDir - Base repository directory
   * @param {string} targetDir - Proposed worktree directory
   */
  static validateWorktreePath(repoDir, targetDir) {
    if (!targetDir || typeof targetDir !== 'string') {
      throw new XyeenaError(ERROR_CODES.SCOPE_VIOLATION, 'Worktree path must be a valid non-empty string');
    }

    const resolvedTarget = path.resolve(targetDir);
    const resolvedRepo = path.resolve(repoDir);

    // Forbid nesting directly inside .git
    const gitDir = path.join(resolvedRepo, '.git');
    if (resolvedTarget.startsWith(gitDir)) {
      throw new XyeenaError(
        ERROR_CODES.SCOPE_VIOLATION,
        `Worktree path cannot reside inside internal git directory: ${targetDir}`
      );
    }

    return {
      valid: true,
      resolvedPath: resolvedTarget
    };
  }

  /**
   * Compose a deterministic worktree creation plan.
   * @param {object} params
   * @param {string} params.repoDir
   * @param {string} params.branchName
   * @param {string} params.worktreePath
   * @param {string} [params.baseRef='HEAD']
   */
  static composeCreationPlan({ repoDir, branchName, worktreePath, baseRef = 'HEAD' }) {
    WorktreeManager.validateWorktreePath(repoDir, worktreePath);

    if (!branchName || typeof branchName !== 'string' || !/^[a-zA-Z0-9_\-\./]+$/.test(branchName)) {
      throw new XyeenaError(ERROR_CODES.INVALID_CONTRACT, `Invalid branch name: "${branchName}"`);
    }

    return {
      action: 'WORKTREE_CREATE',
      branch: branchName,
      baseRef,
      path: worktreePath,
      gitCommand: `git worktree add -b ${branchName} "${worktreePath}" ${baseRef}`,
      verificationCheck: `git -C "${worktreePath}" status --porcelain`
    };
  }

  /**
   * Plan safe worktree removal and branch cleanup.
   * @param {object} params
   * @param {string} params.repoDir
   * @param {string} params.worktreePath
   * @param {boolean} [params.hasUncommittedChanges=false]
   * @param {boolean} [params.force=false]
   */
  static planRemoval({ repoDir, worktreePath, hasUncommittedChanges = false, force = false }) {
    WorktreeManager.validateWorktreePath(repoDir, worktreePath);

    if (hasUncommittedChanges && !force) {
      return {
        allowed: false,
        status: 'BLOCKED',
        reason: 'Worktree has uncommitted changes. Stash, commit, or provide explicit force authorization before removal.'
      };
    }

    return {
      allowed: true,
      status: 'READY_TO_PRUNE',
      pruneCommand: `git worktree remove ${force ? '--force' : ''} "${worktreePath}"`.trim(),
      cleanupCommand: 'git worktree prune'
    };
  }
}
