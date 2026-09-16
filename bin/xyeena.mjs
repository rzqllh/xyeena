#!/usr/bin/env node
import { main } from '../src/cli.mjs';
main(process.argv.slice(2)).catch((error) => {
  console.error(`xyeena: ${error.message}`);
  if (process.env.XYEENA_DEBUG) console.error(error.stack);
  process.exitCode = 1;
});
