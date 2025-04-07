import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { createMcpServer } from "../../utils/serverFactory.js";
import { serverRegistry } from "../../config/servers.js";

interface LlamaResponse {
  response: string;
  error?: string;
}

const config = serverRegistry.botServer;
const server = createMcpServer(config);

// Register the chat tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== "chat") {
    throw new Error(`Unknown tool: ${request.params.name}`);
  }

  const args = request.params.arguments as { prompt: string };
  console.log(`Processing prompt: ${args.prompt}`);
  
  try {
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3.2",
        prompt: `${args.prompt}.`,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Llama API error: ${response.statusText}`);
    }
    console.log("Response received from Llama API:", response);
    const data = await response.json() as LlamaResponse;
    
    if (data.error) {
      throw new Error(`Llama API error: ${data.error}`);
    }

    return {
      content: [
        {
          type: "text",
          text: data.response,
        }
      ]
    };
  } catch (error) {
    console.error("Llama API Error:", error);
    throw error;
  }
});

// Set up error handling
server.onerror = (error) => {
  console.error("[AI Server Error]", error);
};

// Handle graceful shutdown
process.on("SIGINT", async () => {
  await server.close();
  process.exit(0);
});

// Connect via stdio transport
const transport = new StdioServerTransport();
await server.connect(transport);
console.log(`AI MCP Server running with stdio transport on port ${config.port}`);
