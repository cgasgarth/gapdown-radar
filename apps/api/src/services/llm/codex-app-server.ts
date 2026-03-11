import { spawn } from "node:child_process";
import * as readline from "node:readline";

import { z } from "zod";

const WriterResponseSchema = z.object({
  headline: z.string().min(1),
  executiveSummary: z.string().min(1),
  thesis: z.string().min(1),
});

type WriterResponse = z.infer<typeof WriterResponseSchema>;

type CodexOptions = {
  readonly model: string;
  readonly prompt: string;
};

type JsonRpcMessage = {
  readonly id?: number;
  readonly method?: string;
  readonly params?: Record<string, unknown>;
  readonly result?: Record<string, unknown>;
};

const sendJsonLine = (writer: NodeJS.WritableStream, payload: Record<string, unknown>): void => {
  writer.write(`${JSON.stringify(payload)}\n`);
};

const parseJsonRpcMessage = (value: string): JsonRpcMessage => {
  return JSON.parse(value) as JsonRpcMessage;
};

export const requestCodexNarrative = async (options: CodexOptions): Promise<WriterResponse> => {
  const processHandle = spawn("codex", ["app-server"], {
    stdio: ["pipe", "pipe", "inherit"],
  });
  const reader = readline.createInterface({ input: processHandle.stdout });

  return await new Promise<WriterResponse>((resolve, reject) => {
    let threadId = "";
    let collectedText = "";

    const fail = (error: Error): void => {
      reader.close();
      processHandle.kill();
      reject(error);
    };

    reader.on("line", (line) => {
      const message = parseJsonRpcMessage(line);

      if (message.id === 1 && typeof message.result?.["thread"] === "object") {
        const maybeThreadId = (message.result["thread"] as { id?: unknown }).id;

        if (typeof maybeThreadId !== "string") {
          fail(new Error("Codex app-server did not return a thread id."));
          return;
        }

        threadId = maybeThreadId;
        sendJsonLine(processHandle.stdin, {
          method: "turn/start",
          id: 2,
          params: {
            threadId,
            input: [
              {
                type: "text",
                text: `${options.prompt}\nReturn a JSON object with headline, executiveSummary, and thesis.`,
              },
            ],
            model: options.model,
          },
        });
      }

      if (message.method === "item/agentMessage/delta") {
        const delta = message.params?.["delta"];

        if (typeof delta === "string") {
          collectedText += delta;
        }
      }

      if (message.method === "turn/completed") {
        try {
          const parsed = WriterResponseSchema.parse(JSON.parse(collectedText));

          reader.close();
          processHandle.kill();
          resolve(parsed);
        } catch (error) {
          fail(error instanceof Error ? error : new Error("Unable to parse Codex output."));
        }
      }
    });

    processHandle.once("error", (error) => {
      fail(error);
    });
    processHandle.once("exit", (code) => {
      if (code !== null && code !== 0 && collectedText.length === 0) {
        fail(new Error(`Codex app-server exited with code ${code}.`));
      }
    });

    sendJsonLine(processHandle.stdin, {
      method: "initialize",
      id: 0,
      params: {
        clientInfo: {
          name: "gapdown_radar",
          title: "GapDown Radar",
          version: "0.1.0",
        },
      },
    });
    sendJsonLine(processHandle.stdin, { method: "initialized", params: {} });
    sendJsonLine(processHandle.stdin, {
      method: "thread/start",
      id: 1,
      params: {
        model: options.model,
      },
    });
  });
};
