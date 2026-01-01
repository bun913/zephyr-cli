/**
 * Configuration types for Zephyr CLI
 */

/**
 * Profile configuration
 * Contains credentials and default settings for a specific environment
 */
export interface Profile {
  /** Zephyr Scale API token */
  apiToken: string;
  /** Default Jira project key */
  projectKey: string;
}

/**
 * Main configuration structure
 */
export interface Config {
  /** Name of the profile to use by default */
  currentProfile: string;
  /** Available profiles */
  profiles: Record<string, Profile>;
}

/**
 * Global CLI options available to all commands
 */
export interface GlobalOptions {
  /** Profile name to use (overrides currentProfile in config) */
  profile?: string;
  /** Custom configuration file path */
  config?: string;
  /** Output in JSON format (default is text/table) */
  json?: boolean;
}
