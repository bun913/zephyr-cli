# @bun913/zephyr-cli

CLI tool for Zephyr Scale API

## Installation

### Homebrew (macOS / Linux)

```bash
brew install bun913/zephyr-cli/zephyr
```

### Manual Download

```bash
# macOS (Apple Silicon)
curl -L https://github.com/bun913/zephyr-cli/releases/latest/download/zephyr-macos-arm64 -o /usr/local/bin/zephyr
chmod +x /usr/local/bin/zephyr

# macOS (Intel)
curl -L https://github.com/bun913/zephyr-cli/releases/latest/download/zephyr-macos-x64 -o /usr/local/bin/zephyr
chmod +x /usr/local/bin/zephyr

# Linux
curl -L https://github.com/bun913/zephyr-cli/releases/latest/download/zephyr-linux-x64 -o /usr/local/bin/zephyr
chmod +x /usr/local/bin/zephyr
```

## Highlights

### Folder Tree View

Get a tree view of all folders in your project. This is useful for understanding the folder structure.

```bash
# JSON output
zephyr folder tree

# Tree view (human-readable)
zephyr --text folder tree
```

Output:
```
app1/ (30158975)
├── general_user/ (30158978)
│   ├── login/ (30158980)
│   │   ├── validation/ (30158985)
│   │   └── office_select/ (30158984)
│   └── user_profile/ (30158982)
└── admin_user/ (30158979)
```

### Test Cycle Tree View

Get a tree view of test cases in a specific test cycle, organized by folder structure.

> Note: This operation fetches data recursively and may take a long time for large test cycles.

```bash
# JSON output
zephyr testcycle tree CPG-R1

# Tree view (human-readable)
zephyr --text testcycle tree CPG-R1
```

Output:
```
app1/ (30158975)
├── CPG-T13: Test with steps
└── general_user/ (30158978)
    ├── login/ (30158980)
    │   └── validation/ (30158985)
    │       └── CPG-T1: length
    └── user_profile/ (30158982)
        └── CPG-T5: change_icon
(No Folder)/ (0)
└── CPG-T23: Test
```

## Commands

| Command | Subcommands | Description |
|---------|-------------|-------------|
| `testcase` | list, get, create, update | Manage test cases |
| `testcycle` | list, get, create, update, tree | Manage test cycles |
| `testexecution` | list, get, create, update | Manage test executions |
| `testplan` | list, get, create | Manage test plans |
| `teststep` | list, create | Manage test steps |
| `folder` | list, get, create, tree | Manage folders |
| `environment` | list, get, create, update | Manage test environments |
| `status` | list, get, create | Manage statuses |
| `priority` | list, get, create | Manage priorities |
| `project` | list, get | Get projects |
| `issuelink` | testcases, testcycles, testplans, executions | Get resources linked to Jira issues |

## Setup

### 1. Create configuration file

Create `~/.zephyr/config.json`:

```json
{
  "currentProfile": "default",
  "profiles": {
    "default": {
      "apiToken": "YOUR_ZEPHYR_API_TOKEN",
      "projectKey": "YOUR_PROJECT_KEY"
    }
  }
}
```

### 2. Get API Token

Get your API token from Zephyr Scale Settings > API Keys.

## Usage

```bash
# List test cases
zephyr testcase list

# Get test case details
zephyr testcase get CPG-T1

# Create test case
zephyr testcase create --name "New Test Case"

# Create with inline steps (use | to separate description, test data, and expected result)
zephyr testcase create --name "Test" \
  --step "Open the login page||Login page is displayed" \
  --step "Enter credentials|user@example.com|Credentials are accepted" \
  --step "Click submit button||User is logged in"

# For test steps with custom fields, use the teststep command instead
zephyr teststep create CPG-T1 \
  --inline "Verify the result" \
  --expected-result "Result is correct" \
  --custom-field "test-field=value"

# Create with custom fields
zephyr testcase create --name "Test" \
  --custom-field "priority=high" \
  --custom-field "component=auth"

# Record test execution
zephyr testexecution create \
  --test-case-key CPG-T1 \
  --test-cycle-key CPG-R1 \
  --status-name "Pass"

# Update a single test execution
zephyr testexecution update CPG-E1 --status-name "Pass"

# Update all test executions in a test cycle
zephyr testexecution update --test-cycle CPG-R1 --status-name "Pass"

# Switch profile
zephyr -p other-profile testcase list

# Text output instead of JSON
zephyr --text testcase get CPG-T1

# Verbose logging
zephyr --verbose testcase list
```

## Global Options

| Option | Description |
|--------|-------------|
| `-p, --profile <name>` | Profile name to use (default: "default") |
| `-c, --config <path>` | Custom configuration file path |
| `--text` | Output in human-readable text format |
| `--verbose` | Show detailed logging output |
