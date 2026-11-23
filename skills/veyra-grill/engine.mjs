/**
 * Veyra Grill Engine — veyra-grill
 * Question-frontier interview, architectural stress-testing, contradiction discovery.
 * Zero external dependencies.
 */

export function generateQuestionFrontier(proposal = {}) {
  const { title = '', goals = [], assumptions = [], risks = [] } = proposal;
  const questions = [];

  if (goals.length === 0) {
    questions.push({
      category: 'GOAL_CLARITY',
      severity: 'CRITICAL',
      prompt: 'What is the exact observable acceptance criteria for completion?'
    });
  }

  for (const a of assumptions) {
    questions.push({
      category: 'ASSUMPTION_VALIDATION',
      severity: 'HIGH',
      prompt: `What evidence proves assumption: "${a}"? What happens if it is invalid?`
    });
  }

  for (const r of risks) {
    questions.push({
      category: 'RISK_MITIGATION',
      severity: 'HIGH',
      prompt: `For risk "${r}", what is the deterministic fallback or rollback mechanism?`
    });
  }

  if (questions.length === 0) {
    questions.push({
      category: 'EDGE_CASE',
      severity: 'MEDIUM',
      prompt: 'What are the boundary conditions, failure thresholds, and resource bounds?'
    });
  }

  return {
    proposalTitle: title,
    frontierSize: questions.length,
    questions
  };
}

export function detectAmbiguities(text = '') {
  if (typeof text !== 'string') return [];
  const VAGUE_TERMS = [
    /\b(?:various|multiple|several|somehow|etc|and so on|reasonable|scalable|clean|robust)\b/gi,
    /\b(?:as appropriate|if needed|when necessary|soon|later)\b/gi
  ];
  const findings = [];
  for (const pat of VAGUE_TERMS) {
    let m;
    while ((m = pat.exec(text)) !== null) {
      findings.push({ term: m[0], index: m.index });
    }
  }
  return findings;
}

export function evaluateInterviewProgress(questions = [], answers = {}) {
  const total = questions.length;
  if (total === 0) return { complete: true, answeredCount: 0, pendingCount: 0, score: 1.0 };

  let answered = 0;
  for (const q of questions) {
    const ans = answers[q.prompt] || answers[q.category];
    if (ans && typeof ans === 'string' && ans.trim().length > 10) {
      answered++;
    }
  }

  return {
    complete: answered === total,
    totalQuestions: total,
    answeredCount: answered,
    pendingCount: total - answered,
    score: Number((answered / total).toFixed(3))
  };
}

export function detectContradictions(statements = []) {
  const contradictions = [];
  for (let i = 0; i < statements.length; i++) {
    for (let j = i + 1; j < statements.length; j++) {
      const s1 = statements[i].toLowerCase();
      const s2 = statements[j].toLowerCase();
      if ((s1.includes('always') && s2.includes('never')) ||
          (s1.includes('mandatory') && s2.includes('optional')) ||
          (s1.includes('zero') && s2.includes('multiple'))) {
        contradictions.push({ first: statements[i], second: statements[j] });
      }
    }
  }
  return { hasContradiction: contradictions.length > 0, contradictions };
}
