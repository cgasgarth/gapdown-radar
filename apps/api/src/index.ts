import { createApp } from "./app";
import { loadEnvironment } from "./services/env";

const environment = loadEnvironment();
const app = createApp(environment);

Bun.serve({
  fetch: app.fetch,
  port: environment.API_PORT,
});

console.log(`GapDown Radar API running on http://localhost:${environment.API_PORT}`);
