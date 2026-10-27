import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { PACKAGE_ROOT } from '../src/paths.mjs';

test('npm publishing requires explicit reviewed GitHub Release only',()=>{
  const file=fs.readFileSync(path.join(PACKAGE_ROOT,'.github/workflows/publish.yml'),'utf8');
  const header=file.split('permissions:')[0];
  assert.match(header,/^on:\s*\n\s+release:\s*\n\s+types:\s*\[published\]/m);
  assert.doesNotMatch(header,/^\s+(?:push|workflow_dispatch|pull_request):/m);
  assert.match(file,/github\.event\.release\.draft == false/);
  assert.match(file,/github\.event\.release\.prerelease == false/);
  assert.match(file,/environment: npm-publish/);
  assert.match(file,/test "\$GITHUB_REF_NAME" = "v\$VERSION"/);
  assert.match(file,/test "\$ACTUAL" = "\$GITHUB_SHA"/);
  assert.match(file,/test "\$ACTUAL" = "\$EXPECTED"/);
  assert.match(file,/refs\/heads\/main:refs\/remotes\/origin\/main/);
  assert.match(file,/npm view xyeena-agent versions --json/);
  assert.match(file,/Cannot verify npm registry versions; publication blocked/);
  assert.match(file,/versions\\.includes\\(process\\.argv\\[2\\]\\)/);
  assert.doesNotMatch(file,/if npm view "xyeena-agent@/);
});

test('npm publishing is OIDC-only without long-lived secrets or raw token logging',()=>{
  const file=fs.readFileSync(path.join(PACKAGE_ROOT,'.github/workflows/publish.yml'),'utf8');
  assert.match(file,/id-token: write/);
  assert.match(file,/npm publish --provenance --access public/);
  assert.match(file,/persist-credentials: false/);
  assert.match(file,/registry-url: https:\/\/registry\.npmjs\.org/);
  assert.doesNotMatch(file,/\$\{\{\s*secrets\./);
  assert.doesNotMatch(file,/NPM_TOKEN|NPM_SESSION_TOKEN|ACTIONS_ID_TOKEN_REQUEST_TOKEN|oidc\/token\/exchange/);
  assert.doesNotMatch(file,/gh release create/);
});
