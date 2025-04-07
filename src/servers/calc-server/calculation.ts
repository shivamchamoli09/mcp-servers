import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { createMcpServer } from "../../utils/serverFactory.js";
import { serverRegistry } from "../../config/servers.js";

const config = serverRegistry.calcServer;
const server = createMcpServer(config);

// Register the add tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== "add") {
    throw new Error(`Unknown tool: ${request.params.name}`);
  }

  const args = request.params.arguments as { a: number; b: number };
  console.log(`Adding ${args.a} + ${args.b}`);
  
  const sum = args.a + args.b;
  return {
    content: [
      {
        type: "text",
        text: String(sum),
      },
    ],
  };
});

// Set up error handling
server.onerror = (error) => {
  console.error("[Calc Server Error]", error);
};

// Handle graceful shutdown
process.on("SIGINT", async () => {
  await server.close();
  process.exit(0);
});

// Connect via stdio transport
const transport = new StdioServerTransport();
await server.connect(transport);
console.log(`Calculation MCP Server running with stdio transport on port ${config.port}`);
