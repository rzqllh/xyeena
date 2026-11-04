/**
 * Xyeena Core - Policy & Authority Fencing Engine
 * Enforces execution gates, scope boundaries, and human action boundaries.
 */

import path from 'path';
import { ERROR_CODES, XyeenaError } from './errors.mjs';

export const PERMISSION_TYPES = Object.freeze({
  READ_ONLY: 'read_only',
  WORKSPACE_WRITE: 'workspace_write',
  ISOLATED_EXEC_ONLY: 'isolated_exec_only',
  GIT_TAGS: 'git_tags',
  AGENT_DISPATCH: 'agent_dispatch',
  NETWORK_READ_OPT_IN: 'network_read_opt_in'
});

export const EXECUTION_MODES = Object.freeze({
  DISCUSSION: 'DISCUSSION',
  DIAGNOSE: 'DIAGNOSE',
  EXECUTION: 'EXECUTION',
  EXPLICIT_RISK_GATE: 'EXPLICIT_RISK_GATE'
});

export class PolicyGovernor {
  /**
   * @param {object} [options={}]
   * @param {string} [options.workspaceRoot] - Absolute workspace root
   * @param {string[]} [options.allowedPermissions] - Granted permissions
   * @param {string} [options.mode=EXECUTION_MODES.DISCUSSION]
   */
  constructor(options = {}) {
    this.workspaceRoot = options.workspaceRoot ? path.resolve(options.workspaceRoot) : process.cwd();
    this.allowedPermissions = new Set(options.allowedPermissions || [PERMISSION_TYPES.READ_ONLY]);
    this.currentMode = options.mode || EXECUTION_MODES.DISCUSSION;
    this.manualBoundariesEncountered = [];
  }

  setMode(mode) {
    if (!EXECUTION_MODES[mode]) {
      throw new XyeenaError(ERROR_CODES.INVALID_CONTRACT, `Invalid execution mode: ${mode}`);
    }
    this.currentMode = mode;
  }

  grant(permission) {
    this.allowedPermissions.add(permission);
  }

  revoke(permission) {
    this.allowedPermissions.delete(permission);
  }

  hasPermission(permission) {
    return this.allowedPermissions.has(permission);
  }

  /**
   * Enforce write gate: writes are strictly forbidden in DISCUSSION mode.
   * @param {string} actionDescription
   */
  assertWriteAllowed(actionDescription) {
    if (this.currentMode === EXECUTION_MODES.DISCUSSION) {
      throw new XyeenaError(
        ERROR_CODES.SCOPE_VIOLATION,
        `Cannot perform write action "${actionDescription}" while in DISCUSSION mode (Rule 4). Explicit implementation instruction required.`
      );
    }
    if (!this.hasPermission(PERMISSION_TYPES.WORKSPACE_WRITE)) {
      throw new XyeenaError(
        ERROR_CODES.PERMISSION_DENIED,
        `Action "${actionDescription}" requires WORKSPACE_WRITE permission.`
      );
    }
  }

  /**
   * Validate that a target path resides safely within the approved workspace.
   * @param {string} targetPath
   */
  assertPathInScope(targetPath) {
    const resolved = path.resolve(this.workspaceRoot, targetPath);
    if (!resolved.startsWith(this.workspaceRoot)) {
      throw new XyeenaError(
        ERROR_CODES.SCOPE_VIOLATION,
        `Path "${targetPath}" resolves outside workspace root "${this.workspaceRoot}". Path traversal rejected.`,
        { targetPath, workspaceRoot: this.workspaceRoot }
      );
    }
    return resolved;
  }

  /**
   * Detect and block operations requiring manual user approval / human ownership.
   * @param {string} operation
   */
  checkManualActionBoundary(operation) {
    const forbiddenAutomatic = [
      'git_push',
      'npm_publish',
      'production_deploy',
      'modify_host_global_config',
      'access_secrets',
      'delete_repository'
    ];

    if (forbiddenAutomatic.includes(operation)) {
      const record = { operation, timestamp: new Date().toISOString() };
      this.manualBoundariesEncountered.push(record);
      throw new XyeenaError(
        ERROR_CODES.BLOCKED_MANUAL_ACTION,
        `Operation "${operation}" crosses human action boundary. Requires explicit human owner action/approval.`,
        record
      );
    }
  }
}
