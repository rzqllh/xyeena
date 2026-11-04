/**
 * Xyeena Runtime - Checkpoint & Idempotent Recovery Engine
 * Saves execution state checkpoints and safely reconstructs session progress.
 */

export class CheckpointManager {
  /**
   * @param {object} [storageAdapter] - Optional custom persistent adapter
   */
  constructor(storageAdapter = null) {
    this.storage = storageAdapter;
    this.latestSnapshot = null;
  }

  /**
   * Create an immutable state snapshot.
   * @param {object} params
   * @param {string} params.checkpointId
   * @param {string} params.phase
   * @param {Array<object>} params.tasks
   * @param {Array<object>} params.evidence
   * @param {string[]} params.modifiedFiles
   */
  createSnapshot({ checkpointId, phase, tasks = [], evidence = [], modifiedFiles = [] }) {
    const snapshot = {
      checkpointId,
      phase,
      createdAt: new Date().toISOString(),
      tasks: tasks.map(t => ({ id: t.id, status: t.status })),
      evidenceCount: evidence.length,
      modifiedFiles: [...modifiedFiles]
    };

    this.latestSnapshot = snapshot;
    return snapshot;
  }

  /**
   * Reconstruct state from a snapshot to resume execution.
   * @param {object} snapshot
   * @param {TaskGraph} taskGraph
   */
  resumeFromSnapshot(snapshot, taskGraph) {
    if (!snapshot || !Array.isArray(snapshot.tasks)) {
      return { restored: false, reason: 'Invalid or missing snapshot' };
    }

    let restoredCount = 0;
    for (const snapTask of snapshot.tasks) {
      const liveNode = taskGraph.get(snapTask.id);
      if (liveNode && liveNode.status !== snapTask.status) {
        liveNode.status = snapTask.status;
        restoredCount += 1;
      }
    }

    return {
      restored: true,
      checkpointId: snapshot.checkpointId,
      phase: snapshot.phase,
      restoredTasksCount: restoredCount
    };
  }
}
