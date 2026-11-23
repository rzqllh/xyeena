/**
 * Veyra Debug Engine — veyra-debug
 * Root-cause isolation, failure reproduction, regression protection.
 * Zero external dependencies.
 */

export function parseFailureLog(logText = '') {
  if (typeof logText !== 'string') return { errorType: 'UNKNOWN', message: '', trace: [] };

  const errMatch = logText.match(/(?:([A-Za-z0-9_]+Error):\s*([^\n\r]+))/);
  const errorType = errMatch ? errMatch[1] : 'Error';
  const message = errMatch ? errMatch[2] : logText.slice(0, 100);

  const traceLines = [];
  const traceRegex = /at\s+([^\n\r]+)/g;
  let m;
  while ((m = traceRegex.exec(logText)) !== null) {
    traceLines.push(m[1].trim());
  }

  return {
    errorType,
    message,
    stackDepth: traceLines.length,
    trace: traceLines
  };
}

export function evaluateHypothesisEvidence(hypothesis, observation) {
  if (!hypothesis || !observation) return { supported: false, confidence: 0 };
  const hWords = hypothesis.toLowerCase().match(/\b[a-z0-9]{3,}\b/g) || [];
  const oLower = observation.toLowerCase();

  let matches = 0;
  for (const w of hWords) {
    if (oLower.includes(w)) matches++;
  }

  const confidence = hWords.length > 0 ? Number((matches / hWords.length).toFixed(3)) : 0;
  return {
    hypothesis,
    supported: confidence >= 0.5,
    confidence
  };
}

export function auditAntiShotgun(patchFiles = [], rootCauseLocation = '') {
  if (!rootCauseLocation) return { disciplined: false, reason: 'NO_ROOT_CAUSE_SPECIFIED' };
  const unrelated = patchFiles.filter(f => !f.includes(rootCauseLocation) && !rootCauseLocation.includes(f));
  return {
    disciplined: unrelated.length === 0,
    patchedCount: patchFiles.length,
    unrelatedFiles: unrelated
  };
}

export function rankHypotheses(hypothesesList = [], evidenceText = '') {
  return hypothesesList.map(h => {
    const evalRes = evaluateHypothesisEvidence(h, evidenceText);
    return { hypothesis: h, confidence: evalRes.confidence, supported: evalRes.supported };
  }).sort((a, b) => b.confidence - a.confidence);
}
