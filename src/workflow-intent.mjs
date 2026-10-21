/**
 * Low-cost, deterministic workflow state inference.
 * No model call, no content import, no automatic execution permission.
 * Ambiguous or unrecognised goals fall back to TRIAGE.
 */
const PHASES = Object.freeze([
  ['REVIEW', [
    /\b(review|audit|assess|inspect|critique|evaluat(?:e|ion)|code review|pull request)\b/i,
    /\b(reviu|tinjau|evaluasi|cek ulang|periksa|verifikasi|pemeriksaan)\b/i,
  ]],
  ['DEBUG', [
    /\b(debug|bug|crash|broken|failing|failure|error|regression|troubleshoot|fix)\b/i,
    /\b(perbaiki|perbaikan|rusak|gagal|error|bocor|bermasalah|kendala)\b/i,
  ]],
  ['RESEARCH', [
    /\b(research|investigate|find sources|look up|documentation|study|explore options)\b/i,
    /\b(riset|teliti|penelitian|cari referensi|pelajari|bandingkan)\b/i,
  ]],
  ['PLAN', [
    /\b(plan|roadmap|design architecture|specification|break down|draft proposal)\b/i,
    /\b(rencana|perencanaan|roadmap|arsitektur|rancang|desain sistem)\b/i,
  ]],
  ['EXECUTE', [
    /\b(implement|build|create|code|develop|execute|run tests|deliver)\b/i,
    /\b(kerjakan|implementasikan|buatkan|bangun|jalankan|eksekusi|kembangkan)\b/i,
  ]],
]);
export function inferWorkflowState(goal = '') {
  const text = String(goal).slice(0, 12000);
  const matched = PHASES.filter(([, patterns]) => patterns.some(pattern => pattern.test(text)));
  // Prefer safe investigation/review if several phases are mentioned in one request.
  const state = matched.length ? matched[0][0] : 'TRIAGE';
  return { state, source: matched.length ? 'heuristic' : 'fallback',
    competingStates: matched.slice(1).map(([name]) => name), automatic: true };
}
