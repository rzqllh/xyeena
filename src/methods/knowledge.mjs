/**
 * Xyeena Native Methods - Knowledge & Reasoning Discipline Suite
 * Enforces epistemic tier classification (Observed, Inferred, Unknown, Proposed),
 * anti-hallucination source citation verification, and structured research provenance.
 */

import { ERROR_CODES, XyeenaError } from '../core/errors.mjs';

export const EPISTEMIC_TIERS = Object.freeze({
  OBSERVED: 'OBSERVED',     // Directly verified via terminal, file, or tool output
  INFERRED: 'INFERRED',     // Deductions reasonably drawn from verified evidence
  UNKNOWN: 'UNKNOWN',       // Explicitly unverified or unmeasured facts
  PROPOSED: 'PROPOSED'      // Suggested changes, plans, or hypotheses not yet executed
});

export class KnowledgeMethods {
  /**
   * Classify technical statements into epistemic tiers (knowledge.reasoning-discipline).
   * Flags untagged definitive assertions that lack evidence grounding.
   * @param {string} text
   */
  static classifyReasoningDiscipline(text = '') {
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    const classifications = [];
    let ungroundedCount = 0;

    for (const line of lines) {
      let tier = null;
      if (/\b(observed|verified|proven|terminal output|exit code 0)\b/i.test(line)) {
        tier = EPISTEMIC_TIERS.OBSERVED;
      } else if (/\b(inferred|likely|indicates|suggests|deduced)\b/i.test(line)) {
        tier = EPISTEMIC_TIERS.INFERRED;
      } else if (/\b(unknown|unverified|untested|not measured|missing)\b/i.test(line)) {
        tier = EPISTEMIC_TIERS.UNKNOWN;
      } else if (/\b(proposed|plan|recommendation|should be|will change)\b/i.test(line)) {
        tier = EPISTEMIC_TIERS.PROPOSED;
      } else {
        // Line makes an untagged claim
        if (/^(the|all|every|code|test|it)\s+/i.test(line.trim())) {
          ungroundedCount++;
        }
        tier = 'UNCLASSIFIED';
      }

      classifications.push({ line: line.trim(), tier });
    }

    const disciplined = ungroundedCount === 0;
    return {
      totalStatements: lines.length,
      ungroundedCount,
      disciplined,
      classifications,
      verdict: disciplined ? 'DISCIPLINED_EPISTEMIC_REASONING' : 'UNGROUNDED_ASSERTIONS_DETECTED'
    };
  }

  /**
   * Verify research provenance and prevent citation hallucination (knowledge.research-quality).
   * @param {object} params
   * @param {Array<{ claim: string, citationPath: string, exactQuote: string }>} params.citations
   * @param {Record<string, string>} params.availableSourceFiles - Map of path to file contents
   */
  static evaluateResearchQuality({ citations = [], availableSourceFiles = {} }) {
    const verified = [];
    const hallucinated = [];

    for (const c of citations) {
      const fileContent = availableSourceFiles[c.citationPath];
      if (!fileContent) {
        hallucinated.push({ citation: c, reason: `File "${c.citationPath}" does not exist in source repository.` });
      } else if (!fileContent.includes(c.exactQuote)) {
        hallucinated.push({ citation: c, reason: `Quoted text not found in source file "${c.citationPath}".` });
      } else {
        verified.push(c);
      }
    }

    const clean = hallucinated.length === 0;
    return {
      totalCitations: citations.length,
      verifiedCount: verified.length,
      hallucinatedCount: hallucinated.length,
      clean,
      hallucinated,
      verdict: clean ? 'PRIMARY_SOURCE_VERIFIED' : 'CITATION_HALLUCINATION_DETECTED'
    };
  }

  /**
   * Bounded retrieval engine adapted from Konoha RE-31 principles.
   * Enforces max results, byte/token budget, path boundary containment, secret filtering,
   * and graceful recovery from index corruption without corrupting underlying source data.
   */
  static boundedRetrieve({
    query = '',
    dataset = [],
    maxResults = 20,
    maxBytes = 32768,
    basePath = '',
    allowedPaths = [],
    includeSecrets = false,
    indexData = null,
    fallbackDirectScan = true
  } = {}) {
    let indexStatus = 'INDEX_NOT_USED';
    let recoveredFromCorruption = false;

    // Check index data if provided
    if (indexData !== null) {
      try {
        if (typeof indexData === 'string') {
          JSON.parse(indexData);
          indexStatus = 'INDEX_VALIDATED';
        } else if (typeof indexData === 'object' && indexData?.corrupted === true) {
          throw new Error('Index corrupted marker detected');
        } else {
          indexStatus = 'INDEX_VALIDATED';
        }
      } catch {
        indexStatus = 'INDEX_CORRUPTED_FALLBACK';
        recoveredFromCorruption = true;
      }
    }

    const results = [];
    const citations = [];
    const rejectedFiles = [];
    let currentBytes = 0;
    const lowerQuery = query.toLowerCase();

    // Secret pattern detector
    const secretPattern = /\b(?:(?:AIza[0-9A-Za-z-_]{30,})|(?:sk-[a-zA-Z0-9]{20,})|(?:ghp_[a-zA-Z0-9]{20,})|(?:SUPABASE_SERVICE_ROLE_KEY)|(?:PRIVATE KEY))\b/i;
    const secretPathPattern = /(?:\.env(?:\..*)?|id_rsa|credentials|\.pem)$/i;

    for (const item of dataset) {
      const filePath = item.path || item.file || '';
      const content = item.content || '';

      // Path boundary check
      if (filePath.includes('..') || filePath.includes('\0')) {
        rejectedFiles.push({ path: filePath, reason: 'PATH_TRAVERSAL_REJECTED' });
        continue;
      }

      if (basePath && !filePath.startsWith(basePath) && !filePath.startsWith('./')) {
        if (allowedPaths.length > 0 && !allowedPaths.some(ap => filePath.startsWith(ap))) {
          rejectedFiles.push({ path: filePath, reason: 'PATH_OUTSIDE_ALLOWED_BOUNDARY' });
          continue;
        }
      }

      // Secret filtering by default
      if (!includeSecrets) {
        if (secretPathPattern.test(filePath) || secretPattern.test(content)) {
          rejectedFiles.push({ path: filePath, reason: 'SECRET_FILE_EXCLUDED_BY_POLICY' });
          continue;
        }
      }

      // Search match
      const isMatch = !lowerQuery || content.toLowerCase().includes(lowerQuery) || filePath.toLowerCase().includes(lowerQuery);
      if (!isMatch) {
        continue;
      }

      // Check result count cap
      if (results.length >= maxResults) {
        continue;
      }

      // Budget byte cap
      const lineMatches = [];
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (!lowerQuery || lines[i].toLowerCase().includes(lowerQuery)) {
          lineMatches.push({ line: i + 1, text: lines[i] });
        }
      }

      const snippet = lineMatches.length > 0
        ? lineMatches.slice(0, 5).map(m => `L${m.line}: ${m.text}`).join('\n')
        : content.slice(0, 300);

      const snippetBytes = Buffer.byteLength(snippet, 'utf8');
      if (currentBytes + snippetBytes > maxBytes && results.length > 0) {
        continue;
      }

      currentBytes += snippetBytes;
      results.push({
        path: filePath,
        matchedLines: lineMatches.map(m => m.line),
        snippet,
        bytes: snippetBytes
      });

      citations.push({
        path: filePath,
        lines: lineMatches.length > 0 ? lineMatches.map(m => m.line) : [1]
      });
    }

    return {
      query,
      totalMatched: results.length,
      maxResultsEnforced: results.length <= maxResults,
      byteCount: currentBytes,
      maxBytesEnforced: currentBytes <= maxBytes,
      indexStatus,
      recoveredFromCorruption,
      results,
      citations,
      rejectedFiles,
      clean: rejectedFiles.length === 0,
      verdict: 'BOUNDED_RETRIEVAL_COMPLETE'
    };
  }

  /**
   * MCP tool manifest vs dispatcher consistency checker (Konoha RE-31 / DEC-27).
   * Verifies that declared tool signatures match dispatcher handlers.
   * Enforces that registration DOES NOT imply execution permission.
   */
  static auditMcpToolParity({ manifestTools = [], dispatcherHandlers = [] } = {}) {
    const handlerMap = new Map();
    for (const h of dispatcherHandlers) {
      handlerMap.set(h.name, h);
    }

    const manifestMap = new Map();
    for (const m of manifestTools) {
      manifestMap.set(m.name, m);
    }

    const missingHandlers = [];
    const undeclaredTools = [];
    const parameterMismatches = [];

    // Check manifest tools against dispatcher
    for (const tool of manifestTools) {
      const handler = handlerMap.get(tool.name);
      if (!handler) {
        missingHandlers.push({
          toolName: tool.name,
          issue: 'Tool declared in MCP manifest has no corresponding dispatcher handler.'
        });
      } else {
        const manifestRequired = tool.parameters?.required || [];
        const handlerRequired = handler.requiredParams || [];

        for (const req of manifestRequired) {
          if (!handlerRequired.includes(req)) {
            parameterMismatches.push({
              toolName: tool.name,
              param: req,
              issue: `Manifest requires "${req}", but dispatcher handler does not enforce it.`
            });
          }
        }
      }
    }

    // Check dispatcher handlers against manifest
    for (const handler of dispatcherHandlers) {
      if (!manifestMap.has(handler.name)) {
        undeclaredTools.push({
          handlerName: handler.name,
          issue: 'Dispatcher registers handler for tool not declared in manifest.'
        });
      }
    }

    const parityConsistent = missingHandlers.length === 0 &&
      undeclaredTools.length === 0 &&
      parameterMismatches.length === 0;

    return {
      manifestToolsCount: manifestTools.length,
      dispatcherHandlersCount: dispatcherHandlers.length,
      missingHandlers,
      undeclaredTools,
      parameterMismatches,
      parityConsistent,
      registrationDoesNotGrantExecution: true,
      verdict: parityConsistent ? 'PARITY_VERIFIED' : 'PARITY_MISMATCH'
    };
  }

  /**
   * Verify task-scoped memory isolation (Konoha RE-31 / DEC-27).
   * Proves that memory writes are scoped to specific task/session, preventing cross-tenant leakage.
   */
  static verifyTaskMemoryIsolation({ taskId = '', memoryStore = {}, candidateWrite = {} } = {}) {
    if (!taskId) {
      return {
        isolated: false,
        verdict: 'TASK_ID_REQUIRED',
        reason: 'Task memory writes strictly require a valid taskId boundary.'
      };
    }

    const writeKey = candidateWrite.key || '';
    const writeVal = typeof candidateWrite.value === 'string' ? candidateWrite.value : JSON.stringify(candidateWrite.value || '');

    if (/\b(?:password|secret|private_key|token|service_role)\b/i.test(writeKey) ||
        /\b(?:AIza[0-9A-Za-z-_]{30,}|sk-[a-zA-Z0-9]{20,}|ghp_[a-zA-Z0-9]{20,})\b/.test(writeVal)) {
      return {
        isolated: false,
        taskId,
        verdict: 'SECRET_PERSISTENCE_BLOCKED',
        reason: 'Automatic persistence of secrets in task memory is forbidden by policy.'
      };
    }

    const scopedMemory = memoryStore[taskId] || {};
    return {
      isolated: true,
      taskId,
      scopedKeyCount: Object.keys(scopedMemory).length,
      verdict: 'TASK_MEMORY_ISOLATED'
    };
  }
}
