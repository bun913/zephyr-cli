import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { ConfigError } from "../utils/error";
import { logger } from "../utils/logger";
import type { Config, Profile } from "./types";

/**
 * Default configuration file path
 */
const DEFAULT_CONFIG_PATH = join(homedir(), ".zephyr", "config.json");

/**
 * Resolve configuration file path
 * Priority: custom path > ZEPHYR_CONFIG_PATH env > default path
 */
export function resolveConfigPath(customPath?: string): string {
  if (customPath) {
    return customPath;
  }

  if (process.env.ZEPHYR_CONFIG_PATH) {
    return process.env.ZEPHYR_CONFIG_PATH;
  }

  return DEFAULT_CONFIG_PATH;
}

/**
 * Load configuration from file
 */
export function loadConfig(customPath?: string): Config {
  const configPath = resolveConfigPath(customPath);

  logger.debug(`Loading configuration from ${configPath}`);

  if (!existsSync(configPath)) {
    throw new ConfigError(
      `Configuration file not found at ${configPath}\n\nPlease create a configuration file with the following structure:\n\n${JSON.stringify(
        {
          currentProfile: "default",
          profiles: {
            default: {
              apiToken: "your-api-token",
              projectKey: "YOUR-PROJECT-KEY",
            },
          },
        },
        null,
        2,
      )}`,
    );
  }

  try {
    const content = readFileSync(configPath, "utf-8");
    const config = JSON.parse(content) as Config;
    validateConfig(config);
    logger.debug(`Configuration loaded successfully`);
    return config;
  } catch (error) {
    if (error instanceof ConfigError) {
      throw error;
    }
    throw new ConfigError(
      `Failed to parse configuration file: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Validate configuration structure
 */
function validateConfig(config: unknown): asserts config is Config {
  if (!config || typeof config !== "object") {
    throw new ConfigError("Configuration must be an object");
  }

  const cfg = config as Record<string, unknown>;

  if (!cfg.currentProfile || typeof cfg.currentProfile !== "string") {
    throw new ConfigError("Configuration must have a 'currentProfile' field");
  }

  if (!cfg.profiles || typeof cfg.profiles !== "object") {
    throw new ConfigError("Configuration must have a 'profiles' field");
  }

  const profiles = cfg.profiles as Record<string, unknown>;

  // Validate at least one profile exists
  if (Object.keys(profiles).length === 0) {
    throw new ConfigError("Configuration must have at least one profile");
  }

  // Validate each profile
  for (const [name, profile] of Object.entries(profiles)) {
    if (!profile || typeof profile !== "object") {
      throw new ConfigError(`Profile '${name}' must be an object`);
    }

    const prof = profile as Record<string, unknown>;

    if (!prof.apiToken || typeof prof.apiToken !== "string") {
      throw new ConfigError(`Profile '${name}' must have an 'apiToken' field`);
    }

    if (!prof.projectKey || typeof prof.projectKey !== "string") {
      throw new ConfigError(`Profile '${name}' must have a 'projectKey' field`);
    }
  }
}

/**
 * Get a specific profile from configuration
 */
export function getProfile(config: Config, profileName?: string): Profile {
  const name = profileName || config.currentProfile;

  logger.debug(`Using profile: ${name}`);

  const profile = config.profiles[name];

  if (!profile) {
    throw new ConfigError(
      `Profile '${name}' not found in configuration\n\nAvailable profiles: ${Object.keys(config.profiles).join(", ")}`,
    );
  }

  return profile;
}
