import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import express, { Router } from "express";
import type { Request, Response } from "express";
import type { RequestHandler } from "express-serve-static-core";
import { serverRegistry } from "../config/servers.js";
import { getServerPath, ServerPathError } from "../utils/paths.js";

interface AddRequestBody {
  a: number;
  b: number;
}

interface ChatRequestBody {
  prompt: string;
}

export class RegistryManager {
  private clients: Map<string, Client> = new Map();
  private router: Router = Router();

  constructor() {
    this.setupRoutes();
  }

  public async initializeClients(): Promise<void> {
    for (const [key, config] of Object.entries(serverRegistry)) {
      try {
        // Use path utility to get validated server path
        const serverPath = getServerPath(config);
        
        const transport = new StdioClientTransport({
          command: "node",
          args: [serverPath]
        });

        const client = new Client(
          {
            name: `${config.name}-client`,
            version: config.version
          },
          {
            capabilities: {
              tools: config.tools.reduce((acc, tool) => ({
                ...acc,
                [tool.name]: {
                  description: tool.description,
                  inputSchema: tool.inputSchema
                }
              }), {})
            }
          }
        );

        await client.connect(transport);
        this.clients.set(key, client);
        console.log(`Connected to ${config.name} at ${serverPath}`);
      } catch (error) {
        if (error instanceof ServerPathError) {
          console.error(`Server path error for ${key}:`, error.message);
        } else {
          console.error(`Failed to initialize ${key}:`, error);
        }
        throw error;
      }
    }
  }

  private setupRoutes(): void {
    // Calculator endpoint
    const handleAdd: RequestHandler = async (
      req: Request<{}, any, AddRequestBody>,
      res: Response
    ): Promise<void> => {
      try {
        const { a, b } = req.body;
        
        if (typeof a !== "number" || typeof b !== "number") {
          res.status(400).json({ 
            error: "Invalid input: 'a' and 'b' must be numbers" 
          });
          return;
        }

        const client = this.clients.get("calcServer");
        if (!client) {
          throw new Error("Calculator service not available");
        }

        const result = await client.callTool({
          name: "add",
          arguments: { a, b }
        });

        res.json({ result });
      } catch (error) {
        console.error("Calculator error:", error);
        res.status(500).json({ 
          error: error instanceof Error ? error.message : "Internal server error" 
        });
      }
    };

    // AI chat endpoint
    const handleChat: RequestHandler = async (
      req: Request<{}, any, ChatRequestBody>,
      res: Response
    ): Promise<void> => {
      try {
        const { prompt } = req.body;
        
        if (typeof prompt !== "string" || !prompt.trim()) {
          res.status(400).json({ 
            error: "Invalid input: 'prompt' must be a non-empty string" 
          });
          return;
        }

        const client = this.clients.get("botServer");
        if (!client) {
          throw new Error("AI service not available");
        }

        const result = await client.callTool({
          name: "chat",
          arguments: { prompt }
        });

        res.json({ result });
      } catch (error) {
        console.error("AI error:", error);
        res.status(500).json({ 
          error: error instanceof Error ? error.message : "Internal server error" 
        });
      }
    };

    // Health check endpoint
    const handleHealth: RequestHandler = (_: Request, res: Response): void => {
      const status = Object.fromEntries(
        Array.from(this.clients.entries()).map(([key, client]) => [
          key,
          {
            status: "connected",
            name: serverRegistry[key].name,
            tools: serverRegistry[key].tools.map(t => t.name)
          }
        ])
      );
      res.json({ status });
    };

    this.router.post("/calc/add", handleAdd);
    this.router.post("/ai/chat", handleChat);
    this.router.get("/health", handleHealth);
  }

  public getRouter(): Router {
    return this.router;
  }
}
