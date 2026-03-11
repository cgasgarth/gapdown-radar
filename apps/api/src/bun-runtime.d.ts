declare global {
  const Bun: {
    serve(options: {
      fetch(request: Request): Response | Promise<Response>;
      port: number;
    }): unknown;
  };
}

export {};
