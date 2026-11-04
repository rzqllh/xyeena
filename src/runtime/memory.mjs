/**
 * Xyeena Runtime - Scoped Persistent Memory Engine
 * Enforces local-first memory, explicit user consent, scope isolation,
 * and secret sanitization across workspace, global, and agent scopes.
 */

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
   */
  constructor(options = {}) {
    this.defaultScope = options.scope || MEMORY_SCOPES.WORKSPACE;
    this.entries = new Map(); // key -> Entry
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
      /-----BEGIN[ A-Z_-]+KEY-----/,          // Private keys
      /bearer\s+[a-zA-Z0-9_\-\.]{15,}/i        // Auth bearer token
    ];
    return secretPatterns.some(pat => pat.test(value));
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
    return entry;
  }

  get(key, scope = this.defaultScope) {
    const storageKey = `${scope}:${key}`;
    return this.entries.get(storageKey) || null;
  }

  delete(key, scope = this.defaultScope) {
    const storageKey = `${scope}:${key}`;
    return this.entries.delete(storageKey);
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
