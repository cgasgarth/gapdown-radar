declare module "bun:sqlite" {
  export class Database {
    constructor(path: string, options?: { create?: boolean; strict?: boolean });
    run(query: string, params?: ReadonlyArray<unknown>): unknown;
    query<T>(query: string): {
      all(...params: ReadonlyArray<unknown>): Array<T>;
      get(...params: ReadonlyArray<unknown>): T | null;
    };
    close(): void;
  }
}
