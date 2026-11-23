/**
 * Veyra Prototype Engine — veyra-prototype
 * Disposable spikes, experiment isolation, throwaway cleanup guarantees.
 * Zero external dependencies.
 */

export function createSpikeHarness(spikeName, allowedDir = 'scratch/') {
  if (!spikeName) throw new Error('SPIKE_NAME_REQUIRED');
  const safeName = spikeName.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  return {
    spikeName: safeName,
    isolatedDirectory: `${allowedDir}spike-${safeName}/`,
    isDisposable: true,
    createdAt: new Date().toISOString()
  };
}

export function auditSpikeIsolation(spikeFiles = [], productionPaths = ['src/', 'lib/', 'workspace/skills/']) {
  const leaks = [];
  for (const f of spikeFiles) {
    for (const prod of productionPaths) {
      if (f.startsWith(prod)) {
        leaks.push({ file: f, leakedInto: prod });
      }
    }
  }
  return {
    isolated: leaks.length === 0,
    leakCount: leaks.length,
    leaks
  };
}

export function generateCleanupManifest(spikeFiles = []) {
  return {
    removableFiles: spikeFiles,
    cleanupReady: spikeFiles.length > 0,
    totalFilesToRemove: spikeFiles.length
  };
}

export function validateSpikeTimeout(startedAtIso, maxDurationMs = 30000) {
  const elapsed = Date.now() - new Date(startedAtIso).getTime();
  return {
    elapsedMs: elapsed,
    timedOut: elapsed > maxDurationMs,
    remainingMs: Math.max(0, maxDurationMs - elapsed)
  };
}
