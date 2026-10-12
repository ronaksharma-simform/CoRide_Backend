// The root package is "type": "module" (tsx, tests) but tsc emits CommonJS.
// This marker makes node load dist/ as CommonJS.
import { writeFileSync } from "node:fs";

writeFileSync("dist/package.json", '{ "type": "commonjs" }\n');
