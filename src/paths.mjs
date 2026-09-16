import { fileURLToPath } from 'node:url';
import path from 'node:path';
export const SRC_DIR = path.dirname(fileURLToPath(import.meta.url));
export const PACKAGE_ROOT = path.resolve(SRC_DIR, '..');
export const SKILLS_DIR = path.join(PACKAGE_ROOT, 'skills');
export const VERSION = '0.1.0';
