#!/usr/bin/env node

const chalk = require("chalk");
const ora = require("ora");
const fetch = require("node-fetch");
const pkg = require("./package.json");

const API_URL = "https://ncafkcmxumkklboonfhs.supabase.co/functions/v1/analyze-repo";

async function main() {
  const args = process.argv.slice(2);

  // Help command
  if (args.includes("--help") || args.includes("-h") || args.length === 0) {
    printHelp();
    process.exit(0);
  }

  // Version command
  if (args.includes("--version") || args.includes("-v")) {
    console.log(`fixenv-cli v${pkg.version}`);
    process.exit(0);
  }

  // Parse command
  const command = args[0];

  if (command === "scan") {
    const repoUrl = args[1];
    const jsonOutput = args.includes("--json");

    if (!repoUrl) {
      console.error(chalk.red("Error: Please provide a GitHub repository URL"));
      console.log(chalk.gray("Usage: fixenv scan <github-repo-url>"));
      process.exit(1);
    }

    // Validate GitHub URL
    if (!repoUrl.includes("github.com/")) {
      console.error(chalk.red("Error: Please provide a valid GitHub repository URL"));
      process.exit(1);
    }

    await scanRepository(repoUrl, jsonOutput);
  } else {
    console.error(chalk.red(`Unknown command: ${command}`));
    printHelp();
    process.exit(1);
  }
}

function printHelp() {
  console.log(`
${chalk.cyan.bold("🔧 FixEnv CLI")} - Python Environment Analyzer

${chalk.bold("Usage:")}
  fixenv scan <github-repo-url> [options]

${chalk.bold("Commands:")}
  scan <url>    Analyze a GitHub repository for dependency issues

${chalk.bold("Options:")}
  --json        Output results as JSON
  --help, -h    Show this help message
  --version, -v Show version number

${chalk.bold("Examples:")}
  ${chalk.gray("# Scan a Python repository")}
  fixenv scan https://github.com/pallets/flask

  ${chalk.gray("# Get JSON output for CI integration")}
  fixenv scan https://github.com/pallets/flask --json

${chalk.bold("Features:")}
  ${chalk.green("✓")} Dependency analysis (missing pins, conflicts)
  ${chalk.green("✓")} Security vulnerability detection (CVEs via OSV.dev)
  ${chalk.green("✓")} Python version compatibility checks
  ${chalk.green("✓")} Reproducibility scoring
  ${chalk.green("✓")} Supports requirements.txt, pyproject.toml, Pipfile

${chalk.gray("Learn more: https://fixenv.lovable.app")}
  `);
}

async function scanRepository(repoUrl, jsonOutput) {
  const spinner = ora({
    text: "Connecting to FixEnv API...",
    color: "cyan",
  }).start();

  try {
    spinner.text = "Fetching repository data...";

    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repoUrl }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `API returned ${response.status}`);
    }

    spinner.text = "Analyzing dependencies...";
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Analysis failed");
    }

    spinner.stop();

    if (jsonOutput) {
      console.log(JSON.stringify(result, null, 2));
      process.exit(0);
    }

    printResults(repoUrl, result);
  } catch (error) {
    spinner.fail(chalk.red("Analysis failed"));
    console.error(chalk.red(`\nError: ${error.message}`));

    if (error.message.includes("No Python dependency files")) {
      console.log(chalk.yellow("\nThis repository does not appear to be a Python project."));
      console.log(chalk.gray("FixEnv requires: requirements.txt, pyproject.toml, Pipfile, or setup.py"));
    }

    process.exit(1);
  }
}

function printResults(repoUrl, result) {
  const { data, pythonVersion, detectedFormats } = result;
  const { issues, vulnerabilities, reproducibilityScore } = data;

  console.log("\n" + chalk.cyan.bold("🔧 FixEnv - Python Environment Analysis"));
  console.log(chalk.gray("─".repeat(50)));

  const repoName = repoUrl.replace("https://github.com/", "");
  console.log(chalk.white(`Repository: ${chalk.cyan(repoName)}`));

  if (pythonVersion && pythonVersion !== "unknown") {
    console.log(chalk.white(`Python: ${chalk.yellow(pythonVersion)}`));
  }

  if (detectedFormats?.length > 0) {
    console.log(chalk.white(`Formats: ${chalk.gray(detectedFormats.join(", "))}`));
  }

  console.log("");

  const scoreColor =
    reproducibilityScore >= 80 ? chalk.green :
    reproducibilityScore >= 50 ? chalk.yellow :
    chalk.red;

  console.log(chalk.white(`📊 Reproducibility Score: ${scoreColor.bold(reproducibilityScore + "%")}`));
  console.log(chalk.white(`⚠️  Issues Found: ${issues.length > 0 ? chalk.yellow(issues.length) : chalk.green("0")}`));

  if (vulnerabilities?.length > 0) {
    console.log(`🔒 Vulnerabilities: ${chalk.red(vulnerabilities.length)}`);
  } else {
    console.log(`🔒 Vulnerabilities: ${chalk.green("0")}`);
  }

  console.log("");
  console.log(chalk.gray("─".repeat(50)));
  console.log(chalk.gray("💡 Run with --json for full output"));
  console.log(chalk.gray(`🌐 View detailed results: ${chalk.cyan("https://fixenv.lovable.app")}`));
  console.log("");
}

main().catch((error) => {
  console.error(chalk.red("Unexpected error:"), error.message);
  process.exit(1);
});
