import type { ServerConfig } from "../config/servers.js";
import { existsSync } from "fs";
import { join } from "path";

export class ServerPathError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ServerPathError";
  }
}

/**
 * Generates and validates the server file path based on the server configuration
 * @param config Server configuration
 * @returns Full path to the server file
 * @throws {ServerPathError} If the path is invalid or file doesn't exist
 */
export function getServerPath(config: ServerConfig): string {
  const { directory, path } = config.server;
  
  // Validate inputs
  if (!directory || !path) {
    throw new ServerPathError(
      `Invalid server configuration for ${config.name}: missing directory or path`
    );
  }

  // Clean up any potential path traversal attempts
  const cleanDirectory = directory.replace(/[^a-zA-Z0-9-]/g, "");
  const cleanPath = path.replace(/[^a-zA-Z0-9-]/g, "");

  if (cleanDirectory !== directory || cleanPath !== path) {
    throw new ServerPathError(
      `Invalid characters in server path for ${config.name}`
    );
  }

  // Construct the full path
  const fullPath = join("dist", "servers", cleanDirectory, `${cleanPath}.js`);

  // Verify the file exists (optional but recommended for early error detection)
  if (!existsSync(fullPath)) {
    throw new ServerPathError(
      `Server file not found for ${config.name}: ${fullPath}`
    );
  }

  return fullPath;
}
