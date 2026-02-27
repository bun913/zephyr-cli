---
name: zephyr
description: Zephyr Scale CLI - manage test resources, run test cycles interactively, and automate test operations
targets: ["claudecode"]
claudecode:
  allowed-tools:
    - "Bash"
    - "Read"
    - "Write"
---

# Zephyr Scale CLI Operations

The `zephyr` CLI wraps the entire Zephyr Scale REST API. Both users and AI agents can perform the same operations.

## Global Options

Every command accepts:

```
-p, --profile <name>   Profile name (default: "default")
-c, --config <path>    Custom config file path
--text                 Human-readable text output (default: JSON)
--verbose              Detailed logging
```

---

## 1. Snapshot Workflow (Recommended for Test Execution)

The snapshot workflow is the primary way to manage test execution. It syncs a test cycle into a local JSON file, which can be sorted, edited, and played back interactively.

### play init - Interactive Setup

Select a test cycle interactively and create a snapshot:

```bash
zephyr play init
# 1) PRJ-R1: Sprint 1 Regression
# 2) PRJ-R2: Sprint 2 Smoke Test
# Select cycle number: 1
# => Snapshot saved to PRJ-R1.json (42 test cases)
# => Run: zephyr play PRJ-R1.json
```

### snapshot sync - Sync from Zephyr

**Initial sync** (test cycle key to new file):
```bash
zephyr snapshot sync PRJ-R1 -o PRJ-R1.json
```

**Re-sync** (update existing file from Zephyr):
```bash
zephyr snapshot sync PRJ-R1.json
```

**Reload a single test case** (partial update):
```bash
zephyr snapshot sync PRJ-R1.json -t PRJ-T123
```

### snapshot sort - Sort Test Cases

```bash
zephyr snapshot sort PRJ-R1.json --by folder    # by folder path
zephyr snapshot sort PRJ-R1.json --by key       # by test case key
zephyr snapshot sort PRJ-R1.json --by name      # by test case name
zephyr snapshot sort PRJ-R1.json --by status    # by execution status
zephyr snapshot sort PRJ-R1.json --by created   # by creation date
zephyr snapshot sort PRJ-R1.json --by original  # by Zephyr execution order
```

### play - Interactive TUI

Launch the interactive test execution interface:

```bash
zephyr play PRJ-R1.json
zephyr play PRJ-R1.json --filter unexecuted
zephyr play PRJ-R1.json --filter "folder=/Authentication"
zephyr play PRJ-R1.json --filter "status=Fail"
```

The TUI allows step-by-step test execution with keyboard navigation. Both human users and AI agents can drive test cycles through this workflow.

### snapshot record - Record Results (CLI)

Record test results without the TUI:

```bash
# Set overall execution status
zephyr snapshot record PRJ-R1.json PRJ-T123 --status Pass

# Set status with comment
zephyr snapshot record PRJ-R1.json PRJ-T123 --status Fail --comment "Button not visible"

# Update a specific step result
zephyr snapshot record PRJ-R1.json PRJ-T123 --step 0 --status Pass --actual-result "Page loaded"
```

---

## 2. Test Case Management

### Create

```bash
zephyr testcase create \
  --name "Login succeeds with valid credentials" \
  --objective "Verify login flow" \
  --precondition "Login page is displayed" \
  --folder-id 123456 \
  --step "Enter username|Username is entered" \
  --step "Enter password|Password is entered" \
  --step "Click login|Dashboard is displayed"
```

`--step` format: `"description|expected result"` or `"description|test data|expected result"`

### Get / List

```bash
zephyr testcase get PRJ-T123
zephyr testcase list --folder-id 123456
```

### Update (metadata only, does NOT update steps)

```bash
zephyr testcase update PRJ-T123 \
  --name "Updated title" \
  --objective "Updated objective" \
  --folder-id 654321
```

---

## 3. Test Step Management

Use when you need to modify steps after test case creation.

### Create / Replace Steps

```bash
# Overwrite all steps
zephyr teststep create PRJ-T123 \
  --mode OVERWRITE \
  --inline "Step description" \
  --expected-result "Expected result" \
  --test-data "Test data"

# Append new steps
zephyr teststep create PRJ-T123 \
  --mode APPEND \
  --inline "New step" \
  --expected-result "Expected result"
```

### List Steps

```bash
zephyr teststep list PRJ-T123
```

---

## 4. Test Cycle Management

### Create / Get / List / Update

```bash
zephyr testcycle create --name "Sprint 1 Regression" --description "Full regression"
zephyr testcycle get PRJ-R1
zephyr testcycle list
zephyr testcycle update PRJ-R1 --name "Updated name"
```

### Folder Tree (shows test cases grouped by folder)

```bash
zephyr testcycle tree PRJ-R1
```

---

## 5. Test Execution Management

### Create (add a test case to a cycle)

```bash
zephyr testexecution create \
  --test-case-key PRJ-T123 \
  --test-cycle-key PRJ-R1 \
  --status-name "Not Executed"
```

### Update

```bash
# Update single execution
zephyr testexecution update PRJ-E1 --status-name "Pass"

# Bulk update: all executions in a cycle
zephyr testexecution update --test-cycle PRJ-R1 --status-name "Pass"
```

### Get / List

```bash
zephyr testexecution get PRJ-E1
zephyr testexecution list --test-cycle PRJ-R1
```

---

## 6. Test Plan Management

```bash
zephyr testplan create --name "Release v2.0" --objective "Full coverage"
zephyr testplan get PRJ-P1
zephyr testplan list
```

---

## 7. Folder Management

### Create

```bash
zephyr folder create \
  --name "Authentication" \
  --folder-type TEST_CASE \
  --parent-id 12345   # omit for root folder
```

### Get / List / Tree

```bash
zephyr folder get 12345
zephyr folder list --folder-type TEST_CASE
zephyr folder tree
```

---

## 8. Other Resources

### Environments

```bash
zephyr environment list
zephyr environment get 1
zephyr environment create --name "Production"
zephyr environment update 1 --name "Staging"
```

### Statuses

```bash
zephyr status list
zephyr status list --status-type TEST_EXECUTION
zephyr status get 1
zephyr status create --name "In Review" --type TEST_CASE
```

### Priorities

```bash
zephyr priority list
zephyr priority get 1
zephyr priority create --name "Critical"
```

### Projects

```bash
zephyr project list
zephyr project get PRJ
```

### Issue Links (Jira integration)

```bash
zephyr issuelink testcases JIRA-123
zephyr issuelink testcycles JIRA-123
zephyr issuelink testplans JIRA-123
zephyr issuelink executions JIRA-123
```

### Open in Browser

```bash
zephyr open PRJ-T123   # test case
zephyr open PRJ-R1     # test cycle
zephyr open PRJ-P1     # test plan
```

---

## Typical AI Agent Workflow

1. **Setup**: `zephyr play init` or `zephyr snapshot sync PRJ-R1 -o PRJ-R1.json`
2. **Sort**: `zephyr snapshot sort PRJ-R1.json --by folder`
3. **Review**: Read `PRJ-R1.json` to understand test cases and steps
4. **Execute**: `zephyr snapshot record PRJ-R1.json PRJ-T123 --status Pass`
5. **Re-sync**: `zephyr snapshot sync PRJ-R1.json` to pull latest from Zephyr

## Notes

- All commands output JSON by default. Add `--text` for human-readable output.
- Use `jq` for filtering: `zephyr testcase list | jq '.[].key'`
- Project key is read from the profile config; no need to pass `--project-key` for most commands.
- The snapshot JSON file is the source of truth during a test execution session. Always re-sync before starting.
