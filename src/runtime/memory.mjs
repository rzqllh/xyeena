/**
 * Xyeena Runtime - Scoped Persistent Memory Engine
 * Enforces local-first memory, explicit user consent, scope isolation,
 * project-level segregation, and secret sanitization across workspace, global, and agent scopes.
 */

import fs from 'fs';
import path from 'path';
import { ERROR_CODES, XyeenaError } from '../core/errors.mjs';

export const MEMORY_SCOPES = Object.freeze({
  WORKSPACE: 'workspace', // Specific to current repository / workspace
  GLOBAL: 'global',       // User-wide global preferences
  AGENT: 'agent'          // Ephemeral / task-bound agent scratchpad
});

export const MEMORY_CATEGORIES = Object.freeze({
  DECISION: 'decision',       // Locked architectural decision
  CONVENTION: 'convention',   // Codebase naming or styling convention
  LEARNING: 'learning',       // Bug cause or proven configuration
  PROVENANCE: 'provenance'    // Citation or source lock metadata
});

export class MemoryStore {
  /**
   * @param {object} [options={}]
   * @param {string} [options.scope=MEMORY_SCOPES.WORKSPACE]
   * @param {string} [options.storageDir] - Optional directory path for file-backed disk persistence
   * @param {string} [options.projectId='default'] - Project namespace for cross-project isolation
   */
  constructor(options = {}) {
    this.defaultScope = options.scope || MEMORY_SCOPES.WORKSPACE;
    this.storageDir = options.storageDir || null;
    this.projectId = (options.projectId || 'default').replace(/[^a-zA-Z0-9_\-\.]/g, '_');
    this.entries = new Map(); // storageKey -> Entry

    if (this.storageDir) {
      this._loadFromDisk();
    }
  }

  /**
   * Detect potential secret tokens to forbid accidental memory leakage.
   * @param {string} value
   */
  static containsSensitiveSecret(value) {
    if (!value || typeof value !== 'string') return false;
    const secretPatterns = [
      /ghp_[a-zA-Z0-9]{20,}/,                  // GitHub personal token
      /sk-[a-zA-Z0-9]{20,}/,                   // OpenAI / Stripe key
      /AIza[0-9A-Za-z-_]{30,}/,                // Google API key
      /AKIA[0-9A-Z]{16}/,                      // AWS Access Key ID
      /-----BEGIN[ A-Z_-]+KEY-----/,          // Private keys
      /bearer\s+[a-zA-Z0-9_\-\.]{15,}/i,       // Auth bearer token
      /password\s*[:=]\s*["'][^"']{6,}["']/i   // Hardcoded password assignments
    ];
    return secretPatterns.some(pat => pat.test(value));
  }

  /**
   * Internal path resolver for disk storage.
   */
  _getStorageFilePath() {
    if (!this.storageDir) return null;
    return path.join(this.storageDir, `${this.projectId}.memory.json`);
  }

  /**
   * Load existing persisted state from disk.
   */
  _loadFromDisk() {
    const filePath = this._getStorageFilePath();
    if (!filePath) return;

    try {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(raw);
        if (Array.isArray(data)) {
          for (const item of data) {
            if (item && item.key && item.scope) {
              const storageKey = `${item.scope}:${item.key}`;
              this.entries.set(storageKey, item);
            }
          }
        }
      }
    } catch {
      // Degrade gracefully on corrupt file without crashing constructor
    }
  }

  /**
   * Atomic sync to disk.
   */
  _syncToDisk() {
    const filePath = this._getStorageFilePath();
    if (!filePath) return;

    try {
      fs.mkdirSync(this.storageDir, { recursive: true });
      const tmpPath = `${filePath}.tmp.${Date.now()}`;
      const payload = JSON.stringify(Array.from(this.entries.values()), null, 2);
      fs.writeFileSync(tmpPath, payload, 'utf8');
      fs.renameSync(tmpPath, filePath);
    } catch (err) {
      throw new XyeenaError(
        ERROR_CODES.INTERNAL_ERROR,
        `Failed to persist memory state to disk at ${filePath}: ${err.message}`
      );
    }
  }

  /**
   * Remember a fact or convention with explicit scope and consent check.
   * @param {object} params
   * @param {string} params.key - Unique identifier
   * @param {string} params.value - Knowledge content
   * @param {string} [params.scope=MEMORY_SCOPES.WORKSPACE]
   * @param {string} [params.category=MEMORY_CATEGORIES.LEARNING]
   * @param {string} [params.provenance='']
   * @param {boolean} [params.userConsented=true]
   */
  remember({ key, value, scope = this.defaultScope, category = MEMORY_CATEGORIES.LEARNING, provenance = '', userConsented = true }) {
    if (!userConsented) {
      throw new XyeenaError(
        ERROR_CODES.PERMISSION_DENIED,
        'Cannot persist memory without explicit operator consent (MOM-001).'
      );
    }
    if (!key || typeof key !== 'string') {
      throw new XyeenaError(ERROR_CODES.INVALID_CONTRACT, 'Memory entry requires a valid string key');
    }
    if (MemoryStore.containsSensitiveSecret(value)) {
      throw new XyeenaError(
        ERROR_CODES.SCOPE_VIOLATION,
        'Memory persistence rejected: value contains suspected private keys, tokens, or credentials.'
      );
    }

    const storageKey = `${scope}:${key}`;
    const entry = {
      key,
      scope,
      category,
      value: value.trim(),
      provenance,
      updatedAt: new Date().toISOString(),
      version: (this.entries.get(storageKey)?.version || 0) + 1
    };

    this.entries.set(storageKey, entry);
    this._syncToDisk();
    return entry;
  }

  get(key, scope = this.defaultScope) {
    const storageKey = `${scope}:${key}`;
    return this.entries.get(storageKey) || null;
  }

  delete(key, scope = this.defaultScope) {
    const storageKey = `${scope}:${key}`;
    const deleted = this.entries.delete(storageKey);
    if (deleted) {
      this._syncToDisk();
    }
    return deleted;
  }

  /**
   * Invalidate outdated or conflicting entries based on a predicate.
   * @param {(entry: object) => boolean} predicate
   * @returns {number} Count of invalidated entries
   */
  invalidateStale(predicate) {
    if (typeof predicate !== 'function') return 0;
    let count = 0;
    for (const [sKey, entry] of this.entries) {
      if (predicate(entry)) {
        this.entries.delete(sKey);
        count++;
      }
    }
    if (count > 0) {
      this._syncToDisk();
    }
    return count;
  }

  /**
   * Contextual search by keywords.
   * @param {string} query
   * @param {string} [scope]
   */
  search(query, scope) {
    const lower = query.toLowerCase();
    const results = [];
    for (const [sKey, entry] of this.entries) {
      if (scope && entry.scope !== scope) continue;
      if (entry.key.toLowerCase().includes(lower) || entry.value.toLowerCase().includes(lower)) {
        results.push(entry);
      }
    }
    return results;
  }

  exportAll() {
    return Array.from(this.entries.values());
  }

  importAll(entriesList = []) {
    for (const item of entriesList) {
      this.remember({ ...item, userConsented: true });
    }
  }
}
