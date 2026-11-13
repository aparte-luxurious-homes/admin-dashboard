// Runs reportsMgt.test.ts with no test runner installed.
//
// The dashboard has no jest/vitest, and adding one is a dependency decision
// this fix should not smuggle in. Node 20 ships a runner, and the repo ships
// TypeScript, so: transpile the handler, its enum import and the test to
// CommonJS in a temp dir, stub the two modules the handler only needs at
// runtime (the axios instance and the endpoint table), and `node --test` it.
//
//   node src/lib/request-handlers/__tests__/run-reportsMgt.mjs
//
// Type errors are the job of `npx tsc --noEmit -p tsconfig.json`, which covers
// the test file like any other source; this only checks behaviour.
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..", "..", "..", "..");
const libDir = join(root, "src", "lib");
const ts = (await import(pathToFileURL(join(root, "node_modules", "typescript", "lib", "typescript.js")).href)).default;

const out = mkdtempSync(join(tmpdir(), "aparte-reportsMgt-test-"));

function transpile(relFromLib) {
    const source = readFileSync(join(libDir, relFromLib), "utf8");
    const { outputText } = ts.transpileModule(source, {
        fileName: relFromLib,
        compilerOptions: {
            module: ts.ModuleKind.CommonJS,
            target: ts.ScriptTarget.ES2020,
            esModuleInterop: true,
        },
    });
    const dest = join(out, relFromLib.replace(/\.ts$/, ".js"));
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, outputText);
    return dest;
}

transpile("enums.ts");
transpile("request-handlers/reportsMgt.ts");
const testFile = transpile("request-handlers/__tests__/reportsMgt.test.ts");

// Stubs for what the handler imports but the tests must not touch: the real
// axios instance would try to read cookies and reach the network, and the
// endpoint table is only read by the React Query hook, which is not under test.
writeFileSync(
    join(out, "api.js"),
    `"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = { get: async () => { throw new Error("test did not stub axiosRequest.get"); } };
`,
);
mkdirSync(join(out, "routes"), { recursive: true });
writeFileSync(
    join(out, "routes", "endpoints.js"),
    `"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.API_ROUTES = {};
exports.BASE_API_URL = "";
`,
);

const result = spawnSync(process.execPath, ["--test", testFile], {
    stdio: "inherit",
    env: { ...process.env, NODE_PATH: join(root, "node_modules") },
});

if (!process.env.KEEP_TEST_OUT) rmSync(out, { recursive: true, force: true });
else console.log(`kept compiled tests in ${out}`);

process.exit(result.status ?? 1);
