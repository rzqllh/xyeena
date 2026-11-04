/**
 * Xyeena Runtime - Task DAG & State Machine
 * Deterministic acyclic execution graph, immutable task records,
 * and dependency-gated ready queues.
 */

import { ERROR_CODES, XyeenaError } from '../core/errors.mjs';

export const TASK_STATUS = Object.freeze({
  READY: 'READY',
  RUNNING: 'RUNNING',
  BLOCKED: 'BLOCKED',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  SUPERSEDED: 'SUPERSEDED'
});

export class TaskNode {
  /**
   * @param {object} params
   * @param {string} params.id
   * @param {string} params.title
   * @param {string[]} [params.dependencies=[]]
   * @param {boolean} [params.isReadOnly=true]
   * @param {Record<string, unknown>} [params.metadata={}]
   */
  constructor({ id, title, dependencies = [], isReadOnly = true, metadata = {} }) {
    this.id = id;
    this.title = title;
    this.dependencies = [...dependencies];
    this.isReadOnly = Boolean(isReadOnly);
    this.metadata = metadata;
    this.status = TASK_STATUS.READY;
    this.result = null;
    this.error = null;
  }
}

export class TaskGraph {
  constructor() {
    this.nodes = new Map();
  }

  addTask(task) {
    if (!(task instanceof TaskNode)) {
      throw new XyeenaError(ERROR_CODES.INVALID_CONTRACT, 'Task must be an instance of TaskNode');
    }
    if (this.nodes.has(task.id)) {
      throw new XyeenaError(ERROR_CODES.INVALID_CONTRACT, `Task with ID "${task.id}" already exists`);
    }
    this.nodes.set(task.id, task);
    return task;
  }

  get(id) {
    return this.nodes.get(id) || null;
  }

  getAll() {
    return Array.from(this.nodes.values());
  }

  /**
   * Validate that graph is an acyclic directed graph with no broken references.
   */
  validate() {
    const allIds = new Set(this.nodes.keys());

    for (const [id, node] of this.nodes) {
      for (const dep of node.dependencies) {
        if (!allIds.has(dep)) {
          throw new XyeenaError(
            ERROR_CODES.INVALID_CONTRACT,
            `Task "${id}" references missing dependency "${dep}"`
          );
        }
      }
    }

    // Cycle detection
    const visited = new Set();
    const recStack = new Set();

    const dfs = (curr, path) => {
      visited.add(curr);
      recStack.add(curr);

      const node = this.nodes.get(curr);
      for (const dep of node.dependencies) {
        if (!visited.has(dep)) {
          const cyc = dfs(dep, [...path, dep]);
          if (cyc) return cyc;
        } else if (recStack.has(dep)) {
          return [...path, dep];
        }
      }

      recStack.delete(curr);
      return null;
    };

    for (const id of allIds) {
      if (!visited.has(id)) {
        const cycle = dfs(id, [id]);
        if (cycle) {
          throw new XyeenaError(
            ERROR_CODES.CIRCULAR_DEPENDENCY,
            `Task dependency cycle: ${cycle.join(' -> ')}`
          );
        }
      }
    }

    return true;
  }

  /**
   * Return tasks currently ready for execution.
   * A task is ready if its status is READY and all dependencies are COMPLETED.
   * @returns {TaskNode[]}
   */
  getReadyTasks() {
    this.validate();
    const ready = [];

    for (const [, node] of this.nodes) {
      if (node.status !== TASK_STATUS.READY) continue;

      const allDepsMet = node.dependencies.every(depId => {
        const dep = this.nodes.get(depId);
        return dep && dep.status === TASK_STATUS.COMPLETED;
      });

      if (allDepsMet) {
        ready.push(node);
      }
    }

    return ready;
  }

  /**
   * Transition a task to a new state with strict validity check.
   * @param {string} taskId
   * @param {string} newStatus - Member of TASK_STATUS
   * @param {object} [resultOrError={}]
   */
  transition(taskId, newStatus, resultOrError = {}) {
    const node = this.get(taskId);
    if (!node) {
      throw new XyeenaError(ERROR_CODES.INVALID_CONTRACT, `Task "${taskId}" not found`);
    }

    const current = node.status;
    const validTransitions = {
      [TASK_STATUS.READY]: [TASK_STATUS.RUNNING, TASK_STATUS.BLOCKED, TASK_STATUS.SUPERSEDED],
      [TASK_STATUS.RUNNING]: [TASK_STATUS.COMPLETED, TASK_STATUS.FAILED, TASK_STATUS.BLOCKED],
      [TASK_STATUS.FAILED]: [TASK_STATUS.READY, TASK_STATUS.BLOCKED, TASK_STATUS.SUPERSEDED],
      [TASK_STATUS.BLOCKED]: [TASK_STATUS.READY, TASK_STATUS.SUPERSEDED],
      [TASK_STATUS.COMPLETED]: [TASK_STATUS.SUPERSEDED],
      [TASK_STATUS.SUPERSEDED]: []
    };

    if (!validTransitions[current]?.includes(newStatus)) {
      throw new XyeenaError(
        ERROR_CODES.INVALID_CONTRACT,
        `Invalid task transition from ${current} to ${newStatus} for task "${taskId}"`
      );
    }

    node.status = newStatus;
    if (newStatus === TASK_STATUS.COMPLETED) {
      node.result = resultOrError;
    } else if (newStatus === TASK_STATUS.FAILED) {
      node.error = resultOrError;
    }

    return node;
  }
}
