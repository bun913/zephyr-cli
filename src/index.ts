#!/usr/bin/env bun

/**
 * Zephyr CLI - Command-line interface for Zephyr Scale API
 */

console.log("Zephyr CLI v0.1.0");
console.log("Welcome to Zephyr Scale CLI!");

// Temporary test to ensure the environment is working
const args = process.argv.slice(2);
if (args.length > 0) {
  console.log("Arguments:", args);
} else {
  console.log("No arguments provided. Try 'zephyr --help'");
}
