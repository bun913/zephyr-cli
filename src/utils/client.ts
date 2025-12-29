import { ZephyrV2Client } from "zephyr-api-client";
import type { Profile } from "../config/types";

/**
 * Create a Zephyr API client instance from profile configuration
 */
export function createClient(profile: Profile): ZephyrV2Client {
  return new ZephyrV2Client({
    apiToken: profile.apiToken,
  });
}
