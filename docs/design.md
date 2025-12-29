# Zephyr CLI - Design Document

## Directory Structure

```
zephyr-cli/
├── src/
│   ├── index.ts                     # CLI entry point
│   ├── config/
│   │   ├── manager.ts               # ConfigManager (load, validate, get profile)
│   │   └── types.ts                 # Config-related types
│   ├── commands/
│   │   ├── healthcheck.ts           # healthcheck command
│   │   ├── testcase.ts              # testcase command (list, get, create, update)
│   │   ├── testcycle.ts             # testcycle command
│   │   ├── testexecution.ts         # testexecution command
│   │   ├── testplan.ts              # testplan command
│   │   ├── project.ts               # project command
│   │   ├── folder.ts                # folder command
│   │   ├── environment.ts           # environment command
│   │   ├── priority.ts              # priority command
│   │   ├── status.ts                # status command
│   │   ├── link.ts                  # link command
│   │   ├── issuelink.ts             # issuelink command
│   │   └── automation.ts            # automation command
│   ├── utils/
│   │   ├── logger.ts                # Logger setup (pino)
│   │   ├── client.ts                # API Client factory (create ZephyrV2Client from config)
│   │   └── error.ts                 # Error handling utilities
│   └── types/
│       └── index.ts                 # Shared types (if needed)
│
├── test/
│   └── unit/                        # Unit tests
│       ├── config/
│       │   └── manager.test.ts
│       ├── commands/
│       │   ├── healthcheck.test.ts
│       │   ├── testcase.test.ts
│       │   ├── testcycle.test.ts
│       │   └── ...
│       └── utils/
│           ├── logger.test.ts
│           └── client.test.ts
│
├── docs/
│   ├── requirements.md              # Requirements specification
│   └── design.md                    # This file
│
├── .github/workflows/
│   ├── ci.yml                       # Run unit tests
│   └── release.yml                  # Run unit tests + build + release
│
├── package.json
├── tsconfig.json
├── biome.json
└── vitest.config.ts
```

## Module Design

### 1. Entry Point (`src/index.ts`)

**Responsibility**:
- Initialize Commander.js
- Register all commands
- Handle global options (`--profile`, `--config`)
- Setup logger
- Error handling at the top level

**Key Features**:
- Parse global options before passing to commands
- Set up logger based on verbosity level
- Catch and format errors for user-friendly output

---

### 2. Configuration Management (`src/config/`)

#### `manager.ts`
**Responsibility**:
- Load configuration from file
- Validate configuration structure
- Get profile by name
- Resolve configuration file path (default or custom)

**Key Functions**:
```typescript
// Load and parse configuration file
function loadConfig(configPath?: string): Config

// Get a specific profile
function getProfile(config: Config, profileName: string): Profile

// Validate configuration structure
function validateConfig(config: unknown): Config
```

#### `types.ts`
**Responsibility**:
- Define configuration-related TypeScript types

**Key Types**:
```typescript
interface Config {
  currentProfile: string;
  profiles: Record<string, Profile>;
}

interface Profile {
  apiToken: string;
  projectKey: string;
}
```

---

### 3. Commands (`src/commands/`)

Each command file implements operations for a specific resource.

#### Command Structure
Each command file exports a function that registers the command with Commander.js:

```typescript
// src/commands/testcase.ts
import { Command } from "commander";

export function registerTestcaseCommand(program: Command): void {
  const testcase = program.command("testcase");

  testcase
    .command("list")
    .description("List test cases")
    .action(async (options, command) => {
      // Get profile from global options
      // Load config
      // Create API client
      // Call API
      // Format and output results
    });

  testcase
    .command("get")
    .requiredOption("--id <id>", "Test case ID")
    .action(async (options, command) => {
      // Implementation
    });

  testcase
    .command("create")
    .requiredOption("--name <name>", "Test case name")
    .option("--objective <objective>", "Test objective")
    // ... other options
    .action(async (options, command) => {
      // Implementation
    });

  testcase
    .command("update")
    .requiredOption("--id <id>", "Test case ID")
    // ... options
    .action(async (options, command) => {
      // Implementation
    });
}
```

#### Available Commands
- `healthcheck.ts`: Health check (no subcommands)
- `testcase.ts`: Test case operations (list, get, create, update)
- `testcycle.ts`: Test cycle operations
- `testexecution.ts`: Test execution operations
- `testplan.ts`: Test plan operations
- `project.ts`: Project operations
- `folder.ts`: Folder operations
- `environment.ts`: Environment operations
- `priority.ts`: Priority operations
- `status.ts`: Status operations
- `link.ts`: Link operations
- `issuelink.ts`: Issue link operations
- `automation.ts`: Automation operations

---

### 4. Utilities (`src/utils/`)

#### `logger.ts`
**Responsibility**:
- Configure pino logger
- Export logger instance
- Provide different log levels

**Example**:
```typescript
import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
    },
  },
});
```

#### `client.ts`
**Responsibility**:
- Create ZephyrV2Client instance from profile configuration
- Factory function for API client creation

**Example**:
```typescript
import { ZephyrV2Client } from "zephyr-api-client";
import type { Profile } from "../config/types";

export function createClient(profile: Profile): ZephyrV2Client {
  return new ZephyrV2Client({
    apiToken: profile.apiToken,
  });
}
```

#### `error.ts`
**Responsibility**:
- Custom error classes
- Error formatting for CLI output
- Error code mapping

**Example**:
```typescript
export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

export class ApiError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = "ApiError";
  }
}

export function formatError(error: Error): string {
  // Format error for user-friendly output
}
```

---

## Test Strategy

### Unit Tests (`test/unit/`)

**Objective**: Verify that CLI correctly parses commands and options, and calls the API Client with expected parameters.

**Approach**:
- Mock the API Client
- Test command parsing with Commander.js
- Validate ConfigManager behavior
- Verify error handling

**Test Structure**:
```
test/unit/
├── config/
│   └── manager.test.ts           # Test config loading, validation, profile retrieval
├── commands/
│   ├── healthcheck.test.ts       # Test healthcheck command
│   ├── testcase.test.ts          # Test testcase commands (list, get, create, update)
│   ├── testcycle.test.ts         # Test testcycle commands
│   └── ...                       # Other command tests
└── utils/
    ├── logger.test.ts            # Test logger configuration
    └── client.test.ts            # Test API client factory
```

**Example Unit Test**:
```typescript
// test/unit/commands/testcase.test.ts
import { describe, expect, it, vi, beforeEach } from "vitest";
import { ZephyrV2Client } from "zephyr-api-client";

// Mock API Client
vi.mock("zephyr-api-client");

describe("testcase command", () => {
  let mockClient: any;

  beforeEach(() => {
    mockClient = {
      testcases: {
        listTestCases: vi.fn().mockResolvedValue({
          data: { values: [] }
        }),
        getTestCase: vi.fn(),
        createTestCase: vi.fn(),
        updateTestCase: vi.fn(),
      },
    };

    vi.mocked(ZephyrV2Client).mockImplementation(() => mockClient);
  });

  describe("list", () => {
    it("should call API client with projectKey from profile", async () => {
      // Arrange: Setup config with profile
      const mockProfile = {
        apiToken: "test-token",
        projectKey: "KAN",
      };

      // Act: Simulate CLI execution
      await runCommand(["testcase", "list"], mockProfile);

      // Assert: Verify API was called correctly
      expect(mockClient.testcases.listTestCases).toHaveBeenCalledWith({
        projectKey: "KAN",
      });
    });

    it("should handle API errors gracefully", async () => {
      // Arrange
      mockClient.testcases.listTestCases.mockRejectedValue(
        new Error("API Error")
      );

      // Act & Assert
      await expect(runCommand(["testcase", "list"])).rejects.toThrow();
    });
  });

  describe("get", () => {
    it("should call API client with correct test case ID", async () => {
      await runCommand(["testcase", "get", "--id", "123"]);

      expect(mockClient.testcases.getTestCase).toHaveBeenCalledWith({
        testCaseKey: "123",
      });
    });
  });

  describe("create", () => {
    it("should call API client with all provided options", async () => {
      await runCommand([
        "testcase",
        "create",
        "--name", "Test Case",
        "--objective", "Test objective",
      ]);

      expect(mockClient.testcases.createTestCase).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Test Case",
          objective: "Test objective",
          projectKey: "KAN",
        })
      );
    });
  });
});
```

### Integration Tests (Future)

**Objective**: Test the actual built binary with real command execution.

**Approach**:
- Build the CLI binary
- Execute commands using child_process
- Verify output and exit codes
- Use a test Zephyr instance or mock server

**Note**: Integration tests will be implemented later due to environment setup complexity. Focus on unit tests first.

---

## CI/CD Integration

### CI (`ci.yml`)
- Install dependencies
- Run linter (biome)
- Run unit tests with coverage
- Build the project

### CD (`release.yml`)
- Run all CI checks
- Build binaries for all platforms
- Publish to npm
- Upload binaries to GitHub Releases
- Create version bump PR

---

## Error Handling Strategy

### Error Types
1. **Configuration Errors**: Missing or invalid config file, missing profile
2. **API Errors**: Network issues, authentication failures, API errors
3. **Validation Errors**: Invalid command options, missing required fields
4. **Runtime Errors**: Unexpected errors during execution

### Error Output Format
```
Error: [ErrorType] Message

Details:
- Specific information about what went wrong
- Suggestion for how to fix it

Example:
  zephyr testcase list --profile production
```

### Exit Codes
- `0`: Success
- `1`: General error
- `2`: Configuration error
- `3`: API error
- `4`: Validation error

---

## Logging Strategy

### Log Levels
- `error`: Errors that prevent command execution
- `warn`: Warnings that don't prevent execution
- `info`: General information (default)
- `debug`: Detailed debugging information

### Environment Variables
- `LOG_LEVEL`: Set log level (error, warn, info, debug)

### Example Logs
```
INFO  Loading configuration from ~/.zephyr/config.json
INFO  Using profile: default
INFO  Fetching test cases for project: KAN
INFO  Found 42 test cases
```

---

## Future Enhancements

### Phase 1 (Current)
- Basic CLI structure
- Configuration management
- Core commands (healthcheck, testcase)
- Unit tests

### Phase 2
- Complete all resource commands
- Enhanced error messages
- Progress indicators for long operations
- Output formatting options (JSON, table, CSV)

### Phase 3
- Integration tests
- Performance optimization
- Caching layer for frequently accessed data
- Batch operations support
- Interactive mode for create/update commands
