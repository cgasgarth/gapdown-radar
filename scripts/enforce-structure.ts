import * as path from "node:path";
import { readdir, readFile } from "node:fs/promises";

const ROOT_DIRECTORY = process.cwd();
const MAX_LINES = 400;
const MAX_FILES_PER_DIRECTORY = 6;
const LINE_CHECK_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".mjs", ".cjs", ".css"]);
const IGNORED_DIRECTORIES = new Set(["node_modules", "dist", ".git", "data"]);

const warnings: string[] = [];
const violations: string[] = [];

const inspectDirectory = async (directoryPath: string): Promise<void> => {
  const entries = await readdir(directoryPath, { withFileTypes: true });
  const files = entries.filter((entry) => entry.isFile());

  if (files.length > MAX_FILES_PER_DIRECTORY) {
    warnings.push(
      `${path.relative(ROOT_DIRECTORY, directoryPath)} contains ${files.length} files. Prefer splitting folders after ${MAX_FILES_PER_DIRECTORY}.`,
    );
  }

  for (const fileEntry of files) {
    const absolutePath = path.join(directoryPath, fileEntry.name);
    const extension = path.extname(absolutePath);

    if (LINE_CHECK_EXTENSIONS.has(extension)) {
      const lineCount = (await readFile(absolutePath, "utf8")).split("\n").length;

      if (lineCount > MAX_LINES) {
        violations.push(
          `${path.relative(ROOT_DIRECTORY, absolutePath)} has ${lineCount} lines. Maximum allowed is ${MAX_LINES}.`,
        );
      }
    }
  }

  const subdirectories = entries.filter((entry) => entry.isDirectory());

  for (const subdirectory of subdirectories) {
    const name = subdirectory.name;

    if (IGNORED_DIRECTORIES.has(name) === true) {
      continue;
    }

    await inspectDirectory(path.join(directoryPath, subdirectory.name));
  }
};

await inspectDirectory(ROOT_DIRECTORY);

for (const warning of warnings) {
  console.warn(`warning: ${warning}`);
}

if (violations.length > 0) {
  for (const violation of violations) {
    console.error(`error: ${violation}`);
  }

  process.exit(1);
}

console.log("Structure checks passed.");
