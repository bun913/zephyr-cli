# Zephyr CLI - Requirements

## Project Overview

A CLI tool for interacting with the Zephyr Scale API. Built on top of the existing `zephyr-api-client` library, this tool serves as an alternative to MCP (Model Context Protocol) to reduce token usage and support Agent Skills.

## Technology Stack

### Runtime & Language
- **Bun**: TypeScript runtime and build tool
- **TypeScript**: Development language
- **Node.js**: >=22.0.0 (recommended: 24.x)

### Dependencies
- **zephyr-api-client**: Zephyr Scale API Client (local dependency)
- **commander**: CLI framework
- **pino** + **pino-pretty**: Logger

### Development Tools
- **vitest**: Test framework
- **biome**: Linter/Formatter
- **GitHub Actions**: CI/CD

## Distribution Methods

### 1. npm/npx (for developers)
```bash
npm install -g zephyr-cli
npx zephyr-cli
```

### 2. Single Binary (for end users)
- Generate standalone binaries using Bun's `--compile` feature
- Cross-compilation support: macOS (arm64/x64), Linux (x64), Windows (x64)
- Automatically uploaded to GitHub Releases

### 3. Homebrew (for macOS users)
- Create formula that downloads binaries from GitHub Releases

## CLI Structure

### Command Format
```bash
zephyr <resource> <action> [options]
```

### Available Resources
- `testcase`: Test case management
- `testcycle`: Test cycle management
- `testexecution`: Test execution management
- `testplan`: Test plan management
- `project`: Project management
- `folder`: Folder management
- `environment`: Environment management
- `priority`: Priority management
- `status`: Status management
- `link`: Link management
- `issuelink`: Issue link management
- `automation`: Automation management
- `healthcheck`: Health check

### Available Actions
- `list`: List resources
- `get`: Get a specific resource
- `create`: Create a resource
- `update`: Update a resource

### Usage Examples
```bash
# Health check
zephyr healthcheck

# List test cases (using default profile)
zephyr testcase list

# List test cases (using staging profile)
zephyr testcase list --profile staging
zephyr testcase list -p production

# Get a test case
zephyr testcase get --id 123

# Create a test case
zephyr testcase create --name "Test name" --objective "Test objective"
```

## Configuration Management

### Configuration File Path

**Default**: `~/.zephyr/config.json`

**Override options**:
1. `--config <path>` command-line option
2. `ZEPHYR_CONFIG_PATH` environment variable

### Configuration File Structure (JSON)

Users manually edit this file. The CLI provides only basic commands to initialize and view configuration.

```json
{
  "currentProfile": "default",
  "profiles": {
    "default": {
      "apiToken": "eyJ0eXAiOiJKV1QiLCJhbGc...",
      "projectKey": "KAN"
    },
    "production": {
      "apiToken": "prod_token_here",
      "projectKey": "PROD"
    },
    "staging": {
      "apiToken": "staging_token_here",
      "projectKey": "STG"
    }
  }
}
```

### Profile Configuration Values

Each profile contains the following required values:

| Key | Required | Description |
|-----|----------|-------------|
| `apiToken` | ✅ Yes | Zephyr Scale API token |
| `projectKey` | ✅ Yes | Jira project key |

**Note**: `baseUrl` is fixed to `https://api.zephyrscale.smartbear.com/v2` and cannot be configured.

### Global Options

All commands support the following global option:

- `--profile <name>` or `-p <name>`: Specify which profile to use (default: `default`)
- `--config <path>`: Specify custom configuration file path

**Note**: Individual configuration values (`--api-token`, `--project-key`, etc.) are NOT supported. All settings must be configured via profiles.

### How to Configure Profiles

Manually create and edit the configuration file at `~/.zephyr/config.json`:

```bash
# Create the directory
mkdir -p ~/.zephyr

# Edit the configuration file with your preferred editor
vim ~/.zephyr/config.json
code ~/.zephyr/config.json
```

The configuration file format and examples will be provided in the README and `--help` output.

### Configuration Value Priority

Configuration values are loaded with the following priority (high to low):

1. **Profile specified by `--profile` option**: The profile specified in the command
2. **Current profile in config file**: The profile specified by `currentProfile` field

**Note**: Environment variables (like `ZEPHYR_API_TOKEN`) are NOT supported for simplicity. All configuration must be managed through profiles.

## Build & Release Flow

### Development
```bash
bun run dev          # Development mode
bun run test         # Test (watch mode)
bun run lint         # Linter
bun run format       # Formatter
```

### Build
```bash
bun run build                # Build for npm
bun run build:binary         # Build binary for local environment
bun run build:binary:all     # Build binaries for all platforms (cross-compile)
```

### Release (automated)
1. Push tag: `git tag v0.1.0 && git push origin v0.1.0`
2. GitHub Actions automatically:
   - Run tests & lint
   - Publish npm package
   - Build binaries for all platforms
   - Upload artifacts to GitHub Releases
   - Create PR for version bump

## Directory Structure

```
zephyr-cli/
├── src/
│   ├── index.ts              # Entry point
│   ├── config/               # Configuration management
│   │   ├── manager.ts        # ConfigManager (load & validate only)
│   │   └── types.ts          # Configuration types
│   ├── commands/             # Command implementations
│   │   ├── healthcheck.ts    # healthcheck command
│   │   ├── testcase.ts       # testcase command
│   │   ├── testcycle.ts      # testcycle command
│   │   └── ...
│   └── utils/                # Utilities
│       └── logger.ts         # Logger setup
├── test/                     # Tests
├── docs/                     # Documentation
├── .github/workflows/        # CI/CD
├── package.json
├── tsconfig.json
├── biome.json
└── vitest.config.ts
```

## Implementation Phases

### Phase 1: Foundation
- [x] TypeScript + Bun environment setup
- [x] Test environment (vitest)
- [x] Linter/Formatter (biome)
- [x] CI/CD (GitHub Actions)
- [x] Dependency installation (commander, pino)
- [ ] Configuration management (ConfigManager)
- [ ] Logger setup
- [ ] Basic CLI structure with Commander.js

### Phase 2: Command Implementation
- [ ] `healthcheck` command (for verification)
- [ ] `testcase` command group (list, get, create, update)
- [ ] `testcycle` command group
- [ ] `testexecution` command group
- [ ] `testplan` command group
- [ ] Other resource commands (project, folder, environment, etc.)

### Phase 3: Distribution & Optimization
- [ ] Binary build verification
- [ ] Homebrew formula creation
- [ ] README documentation
- [ ] Performance optimization
