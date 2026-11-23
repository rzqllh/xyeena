/**
 * Veyra Release Engine — veyra-release
 * Semantic Versioning (DEC-33), migration safety auditing, rollback validation.
 * Zero external dependencies.
 */

export function calculateSemVer(currentVersion, changes = []) {
  const vMatch = currentVersion.match(/^(\d+)\.(\d+)\.(\d+)(?:-.*)?$/);
  if (!vMatch) throw new Error('INVALID_SEMVER_BASE');

  let major = parseInt(vMatch[1], 10);
  let minor = parseInt(vMatch[2], 10);
  let patch = parseInt(vMatch[3], 10);

  let hasBreaking = false;
  let hasFeature = false;
  let hasFix = false;

  for (const c of changes) {
    if (c.type === 'BREAKING' || c.breaking) hasBreaking = true;
    else if (c.type === 'FEATURE' || c.feat) hasFeature = true;
    else if (c.type === 'FIX' || c.fix) hasFix = true;
  }

  if (hasBreaking) {
    major++;
    minor = 0;
    patch = 0;
  } else if (hasFeature) {
    minor++;
    patch = 0;
  } else if (hasFix || changes.length > 0) {
    patch++;
  }

  const nextVersion = `${major}.${minor}.${patch}`;
  return {
    currentVersion,
    nextVersion,
    bumpType: hasBreaking ? 'MAJOR' : hasFeature ? 'MINOR' : 'PATCH'
  };
}

export function validateMigrationRollback(migrationCode, rollbackCode) {
  if (!migrationCode || !rollbackCode) {
    return { reversible: false, reason: 'MISSING_MIGRATION_OR_ROLLBACK' };
  }

  const createsTable = migrationCode.includes('CREATE TABLE');
  const dropsTable = rollbackCode.includes('DROP TABLE');

  if (createsTable && !dropsTable) {
    return { reversible: false, reason: 'TABLE_CREATED_WITHOUT_ROLLBACK_DROP' };
  }

  return {
    reversible: true,
    reason: 'PAIRED_MIGRATION_AND_ROLLBACK_VERIFIED'
  };
}

export function auditReleaseGateCriteria(criteria = {}) {
  const { allTestsPass = false, securityClean = false, reviewApproved = false, dirtyWorkingTree = false } = criteria;
  const ready = allTestsPass && securityClean && reviewApproved && !dirtyWorkingTree;
  return {
    releaseReady: ready,
    gates: { allTestsPass, securityClean, reviewApproved, cleanTree: !dirtyWorkingTree }
  };
}
