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

### Snapshot (Local Cache)

Export a test cycle's full data (test cases, steps, execution results, folder paths) to a local JSON file. Record results, sort, and re-sync as needed.

```bash
# Initial sync — export test cycle to a local JSON file
zephyr snapshot sync CPG-R1 -o snapshot.json

# Re-sync — update the local file with latest data from Zephyr
zephyr snapshot sync snapshot.json

# Record test results (pushes to Zephyr API + updates local JSON)
zephyr snapshot record snapshot.json CPG-T1 --status Pass
zephyr snapshot record snapshot.json CPG-T2 --status Fail --comment "Bug found"
zephyr snapshot record snapshot.json CPG-T3 --step 0 --status Pass
zephyr snapshot record snapshot.json CPG-T3 --step 1 --status Fail --actual-result "Wrong error message"

# Sort by folder path, then by key within each folder
zephyr snapshot sort snapshot.json --by folder

# Sort by original Zephyr order
zephyr snapshot sort snapshot.json --by original
```

#### `snapshot sync`

```
zephyr snapshot sync <target> [-o <path>]
```

- If `<target>` matches a test cycle key (e.g. `CPG-R1`), performs an **initial sync**. The `-o` option is required to specify the output file path.
- If `<target>` is a file path, performs a **re-sync** — reads the existing snapshot, fetches the latest data from Zephyr, and merges changes (additions, removals, updates) back into the file.

Re-sync preserves local-only fields (`originalIndex`, `excluded`) for existing test cases.

#### `snapshot sort`

```
zephyr snapshot sort <file> --by <key>
```

Available sort keys:

| Key | Description |
|-----|-------------|
| `original` | Original Zephyr test cycle order |
| `folder` | Folder path, then key within each folder |
| `key` | Natural sort by test case key (e.g. CPG-T1 < CPG-T2 < CPG-T10) |
| `name` | Test case name (alphabetical) |
| `status` | Execution status priority: Not Executed, Fail, Blocked, Pass |
| `created` | Test case creation date |

#### `snapshot record`

```
zephyr snapshot record <file> <testCaseKey> --status <name> [options]
```

Record test results to Zephyr API and update the local snapshot file. The API is updated first — the local file is only written on success.

**Test case level** — update the overall execution status:

```bash
zephyr snapshot record snapshot.json CPG-T1 --status Pass
zephyr snapshot record snapshot.json CPG-T1 --status Fail --comment "Login button unresponsive"
```

**Step level** — update a specific test step result (0-based index):

```bash
zephyr snapshot record snapshot.json CPG-T1 --step 0 --status Pass
zephyr snapshot record snapshot.json CPG-T1 --step 1 --status Fail --actual-result "Got 500 error"
```

| Option | Description |
|--------|-------------|
| `--status <name>` | Required. `Pass`, `Fail`, `Blocked`, or `Not Executed` |
| `--comment <text>` | Execution comment (test case level only) |
| `--step <index>` | Step index (0-based) to update instead of the whole execution |
| `--actual-result <text>` | Actual result text (step level only) |

### Play (Interactive TUI)

Interactively record test results in a terminal UI. Requires a snapshot file created by `snapshot sync`.

```bash
zephyr play snapshot.json
zephyr play snapshot.json --filter "unexecuted"
zephyr play snapshot.json --filter "folder=login"
zephyr play snapshot.json --filter "status=Fail"
```

#### Key Bindings

| Key | Context | Action |
|-----|---------|--------|
| `j`/`k` | Both panels | Move cursor up/down |
| `Tab` | Both panels | Switch between left/right panels |
| `l`/`Enter` | Left panel | Open test case detail |
| `h` | Right panel | Back to left panel |
| `.` | Left panel | Toggle all folders open/close |
| `p`/`f`/`b` | Left panel | Set **all steps** to Pass/Fail/Blocked |
| `p`/`f`/`b` | Right panel | Set **current step** to Pass/Fail/Blocked |
| `P`/`F`/`B` | Right panel | Set **execution status** to Pass/Fail/Blocked |
| `Enter` | Right panel | Edit step actual result (text input) |
| `/` | Both panels | Search by key/name/folder (jump to match) |
| `n`/`N` | Both panels | Jump to next/previous search match |
| `gg` | Both panels | Jump to top |
| `G` | Both panels | Jump to bottom |
| `zz` | Both panels | Scroll current line to center |
| `zt` | Both panels | Scroll current line to top |
| `o` | Both panels | Copy test case key to clipboard & open Test Player (requires `jiraBaseUrl`) |
| `S` | Both panels | Sync snapshot from Zephyr API |
| `q` | Both panels | Quit |

Step status is automatically derived to the execution level:
- Any step **Blocked** → execution = Blocked
- Any step **Fail** → execution = Fail
- All steps **Pass** → execution = Pass

### Open

Open a Zephyr resource in your browser. Requires `jiraBaseUrl` in your profile.

```bash
zephyr open CPG-T1    # Open test case
zephyr open CPG-R1    # Open test cycle
zephyr open CPG-P1    # Open test plan
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
| `snapshot` | sync, sort, record | Export, manage, and record results for local test cycle snapshots |
| `play` | — | Interactive TUI for recording test results |
| `open` | — | Open Zephyr resource in browser |

## Setup

### 1. Create configuration file

Create `~/.zephyr/config.json`:

```json
{
  "currentProfile": "default",
  "profiles": {
    "default": {
      "apiToken": "YOUR_ZEPHYR_API_TOKEN",
      "projectKey": "YOUR_PROJECT_KEY",
      "jiraBaseUrl": "https://your-domain.atlassian.net"
    }
  }
}
```

`jiraBaseUrl` is optional but required for `open` command and `o` key in `play` TUI.

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
