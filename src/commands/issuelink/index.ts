/**
 * Issuelink command registration
 */

import type { Command } from "commander";
import { getProfile, loadConfig } from "../../config/manager";
import type { GlobalOptions } from "../../config/types";
import { createClient } from "../../utils/client";
import { formatError } from "../../utils/error";
import { logger, setLoggerVerbose } from "../../utils/logger";

/**
 * Register issuelink command and subcommands
 */
export function registerIssueLinkCommand(program: Command): void {
  const issuelink = program
    .command("issuelink")
    .description("Get Zephyr resources linked to Jira issues");

  // Get test cases linked to issue
  issuelink
    .command("testcases <issueKey>")
    .description("Get test cases linked to a Jira issue")
    .action(async (issueKey: string, _options, command) => {
      try {
        const globalOptions = command.parent?.parent?.opts() as GlobalOptions;
        setLoggerVerbose(globalOptions.verbose || false);

        const config = loadConfig(globalOptions.config);
        const profile = getProfile(config, globalOptions.profile);

        logger.info(`Fetching test cases linked to: ${issueKey}`);

        const client = createClient(profile);
        const response = await client.issuelinks.getIssueLinkTestCases(issueKey);

        console.log(JSON.stringify(response.data, null, 2));
      } catch (error) {
        logger.error(formatError(error as Error));
        process.exit(1);
      }
    });

  // Get test cycles linked to issue
  issuelink
    .command("testcycles <issueKey>")
    .description("Get test cycles linked to a Jira issue")
    .action(async (issueKey: string, _options, command) => {
      try {
        const globalOptions = command.parent?.parent?.opts() as GlobalOptions;
        setLoggerVerbose(globalOptions.verbose || false);

        const config = loadConfig(globalOptions.config);
        const profile = getProfile(config, globalOptions.profile);

        logger.info(`Fetching test cycles linked to: ${issueKey}`);

        const client = createClient(profile);
        const response = await client.issuelinks.getIssueLinkTestCycles(issueKey);

        console.log(JSON.stringify(response.data, null, 2));
      } catch (error) {
        logger.error(formatError(error as Error));
        process.exit(1);
      }
    });

  // Get test plans linked to issue
  issuelink
    .command("testplans <issueKey>")
    .description("Get test plans linked to a Jira issue")
    .action(async (issueKey: string, _options, command) => {
      try {
        const globalOptions = command.parent?.parent?.opts() as GlobalOptions;
        setLoggerVerbose(globalOptions.verbose || false);

        const config = loadConfig(globalOptions.config);
        const profile = getProfile(config, globalOptions.profile);

        logger.info(`Fetching test plans linked to: ${issueKey}`);

        const client = createClient(profile);
        const response = await client.issuelinks.getIssueLinkTestPlans(issueKey);

        console.log(JSON.stringify(response.data, null, 2));
      } catch (error) {
        logger.error(formatError(error as Error));
        process.exit(1);
      }
    });

  // Get test executions linked to issue
  issuelink
    .command("executions <issueKey>")
    .description("Get test executions linked to a Jira issue")
    .action(async (issueKey: string, _options, command) => {
      try {
        const globalOptions = command.parent?.parent?.opts() as GlobalOptions;
        setLoggerVerbose(globalOptions.verbose || false);

        const config = loadConfig(globalOptions.config);
        const profile = getProfile(config, globalOptions.profile);

        logger.info(`Fetching test executions linked to: ${issueKey}`);

        const client = createClient(profile);
        const response = await client.issuelinks.getIssueLinkTestExecutions(issueKey);

        console.log(JSON.stringify(response.data, null, 2));
      } catch (error) {
        logger.error(formatError(error as Error));
        process.exit(1);
      }
    });
}
