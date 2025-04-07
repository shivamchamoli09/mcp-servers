import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import type { ServerConfig } from "../config/servers.js";

export function createMcpServer(config: ServerConfig): Server {
  const server = new Server(
    {
      name: config.name,
      version: config.version,
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
  
  return server;
}
