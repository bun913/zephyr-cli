import { exec } from "node:child_process";
import type { Command } from "commander";
import { getProfile, loadConfig } from "../config/manager";
import type { GlobalOptions } from "../config/types";
import { formatError } from "../utils/error";
import { logger, setLoggerVerbose } from "../utils/logger";

type ResourceType = "testcase" | "testcycle" | "testplan";

function detectResourceType(key: string): ResourceType {
  if (/-T\d+$/.test(key)) return "testcase";
  if (/-R\d+$/.test(key)) return "testcycle";
  if (/-P\d+$/.test(key)) return "testplan";

  throw new Error(
    `Unrecognized key format: "${key}". Expected: XXX-T123 (test case), XXX-R123 (test cycle), XXX-P123 (test plan)`,
  );
}

function buildZephyrUrl(
  jiraBaseUrl: string,
  projectKey: string,
  resourceType: ResourceType,
  key: string,
): string {
  const base = jiraBaseUrl.replace(/\/+$/, "");
  return `${base}/projects/${projectKey}?selectedItem=com.atlassian.plugins.atlassian-connect-plugin:com.kanoah.test-manager__main-project-page#!/${resourceType}/${key}`;
}

function openInBrowser(url: string): void {
  const platform = process.platform;
  let command: string;

  if (platform === "darwin") {
    command = `open "${url}"`;
  } else if (platform === "linux") {
    command = `xdg-open "${url}"`;
  } else if (platform === "win32") {
    command = `start "" "${url}"`;
  } else {
    throw new Error(`Unsupported platform: ${platform}. Please open manually:\n${url}`);
  }

  exec(command, (error) => {
    if (error) {
      logger.error(`Failed to open browser: ${error.message}`);
      console.log(`URL: ${url}`);
    }
  });
}

export function registerOpenCommand(program: Command): void {
  program
    .command("open <key>")
    .description("Open Zephyr resource in browser (e.g., CPG-T1, CPG-R1, CPG-P1)")
    .action(async (key: string, _options: Record<string, unknown>, command) => {
      try {
        const globalOptions = command.parent?.opts() as GlobalOptions;
        setLoggerVerbose(globalOptions.verbose || false);

        const config = loadConfig(globalOptions.config);
        const profile = getProfile(config, globalOptions.profile);

        if (!profile.jiraBaseUrl) {
          logger.error(
            `'jiraBaseUrl' is not set in your profile.\n\nPlease add it to your config:\n\n${JSON.stringify(
              {
                profiles: {
                  default: {
                    apiToken: "...",
                    projectKey: "...",
                    jiraBaseUrl: "https://your-domain.atlassian.net",
                  },
                },
              },
              null,
              2,
            )}`,
          );
          process.exit(1);
        }

        const resourceType = detectResourceType(key);
        const url = buildZephyrUrl(profile.jiraBaseUrl, profile.projectKey, resourceType, key);

        console.log(`Opening ${key} in browser...`);
        openInBrowser(url);
      } catch (error) {
        logger.error(formatError(error as Error));
        process.exit(1);
      }
    });
}
