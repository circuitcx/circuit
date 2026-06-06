#!/usr/bin/env node
// Thin launcher → built ESM entrypoint. Forwards argv (e.g. `auth`).
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
await import(join(here, "..", "dist", "index.js"));
