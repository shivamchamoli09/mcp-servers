export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface ServerConfig {
  name: string;
  version: string;
  port: number;
  transport: 'stdio';
  server: {
    path: string;      // Base name of the server file
    directory: string; // Server directory name
  };
  tools: ToolDefinition[];
}

export const serverRegistry: Record<string, ServerConfig> = {
  calcServer: {
    name: "calculation-server",
    version: "1.0.0",
    port: 3001,
    transport: "stdio",
    server: {
      path: "calculation",
      directory: "calc-server"
    },
    tools: [{
      name: "add",
      description: "Adds two numbers together",
      inputSchema: {
        type: "object",
        properties: {
          a: { type: "number" },
          b: { type: "number" }
        },
        required: ["a", "b"]
      }
    }]
  },
  botServer: {
    name: "bot-server",
    version: "1.0.0",
    port: 3002,
    transport: "stdio",
    server: {
      path: "bot",
      directory: "bot-server"
    },
    tools: [{
      name: "chat",
      description: "Chat with Llama 3.2",
      inputSchema: {
        type: "object",
        properties: {
          prompt: { type: "string" }
        },
        required: ["prompt"]
      }
    }]
  }
};
