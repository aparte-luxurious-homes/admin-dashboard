/**
 * Runs this folder's unit tests:
 *
 *     node src/components/team/__tests__/run.mjs
 *
 * No test runner is installed in this repo and none can be added without an
 * npm install, so the tests use Node's built-in runner: the project's own tsc
 * compiles them (and the modules they import) to CommonJS in a temp folder,
 * then `node --test` executes the output. The temp folder is removed after.
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../../../..");
const out = mkdtempSync(path.join(tmpdir(), "aparte-admin-tests-"));

// Through node, not the .cmd shim: no shell, so paths with spaces survive.
// NODE_PATH points the compiled output — which sits in a temp folder, outside
// the repo — back at the repo's node_modules for react/jsx-runtime and the
// icon packages nav_links.tsx imports.
const run = (args) => spawnSync(process.execPath, args, {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, NODE_PATH: path.join(root, "node_modules") },
});

let status = 1;
try {
    const tsc = run([
        path.join(root, "node_modules", "typescript", "bin", "tsc"),
        "-p", path.join(here, "tsconfig.json"),
        "--outDir", out,
    ]);
    if (tsc.status === 0) {
        const compiled = path.join(out, "src", "components", "team", "__tests__");
        const files = readdirSync(compiled)
            .filter((f) => f.endsWith(".test.js"))
            .map((f) => path.join(compiled, f));
        status = run(["--test", ...files]).status ?? 1;
    } else {
        status = tsc.status ?? 1;
    }
} finally {
    rmSync(out, { recursive: true, force: true });
}
process.exit(status);
