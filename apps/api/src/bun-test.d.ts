declare module "bun:test" {
  export const describe: (label: string, run: () => void) => void;
  export const test: (label: string, run: () => void | Promise<void>) => void;
  export const expect: (value: unknown) => {
    toBe: (expected: unknown) => void;
    toBeDefined: () => void;
    toBeGreaterThan: (expected: number) => void;
    toBeGreaterThanOrEqual: (expected: number) => void;
  };
}
