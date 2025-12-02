#!/usr/bin/env node

const chalk = require("chalk");
const ora = require("ora");
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");
const pkg = require("./package.json");

const API_URL = "https://ncafkcmxumkklboonfhs.supabase.co/functions/v1/analyze-repo";
const SNAPSHOT_URL = "https://ncafkcmxumkklboonfhs.supabase.co/functions/v1/generate-snapshot";

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
    const target = args[1];
    const jsonOutput = args.includes("--json");

    if (!target) {
      console.error(chalk.red("Error: Please provide a GitHub repository URL or local path"));
      console.log(chalk.gray("Usage: fixenv scan <github-repo-url|local-path>"));
      process.exit(1);
    }

    // Check if it's a local path
    if (isLocalPath(target)) {
      await scanLocalDirectory(target, jsonOutput);
    } else {
      // Validate GitHub URL
      if (!target.includes("github.com/")) {
        console.error(chalk.red("Error: Please provide a valid GitHub repository URL or local path"));
        process.exit(1);
      }
      await scanRepository(target, jsonOutput);
    }
  } else if (command === "snapshot") {
    const repoUrl = args[1];
    const outputPath = args.find(a => a.startsWith("--output="))?.split("=")[1];

    if (!repoUrl) {
      console.error(chalk.red("Error: Please provide a GitHub repository URL"));
      console.log(chalk.gray("Usage: fixenv snapshot <github-repo-url> [--output=filename.zfix]"));
      process.exit(1);
    }

    if (!repoUrl.includes("github.com/")) {
      console.error(chalk.red("Error: Please provide a valid GitHub repository URL"));
      process.exit(1);
    }

    await generateSnapshot(repoUrl, outputPath);
  } else {
    console.error(chalk.red(`Unknown command: ${command}`));
    printHelp();
    process.exit(1);
  }
}

function isLocalPath(target) {
  // Check if it's a local path (starts with . or / or is a Windows path)
  return target.startsWith(".") || 
         target.startsWith("/") || 
         target.startsWith("~") ||
         /^[a-zA-Z]:/.test(target) || // Windows drive letter
         (!target.includes("://") && !target.includes("github.com"));
}

function printHelp() {
  console.log(`
${chalk.cyan.bold("🔧 FixEnv CLI")} - Python Environment Analyzer

${chalk.bold("Usage:")}
  fixenv scan <github-repo-url|local-path> [options]
  fixenv snapshot <github-repo-url> [options]

${chalk.bold("Commands:")}
  scan <target>       Analyze a GitHub repository or local directory
  snapshot <url>      Generate and download a .zfix snapshot file

${chalk.bold("Options:")}
  --json              Output results as JSON (scan only)
  --output=<file>     Specify output filename (snapshot only)
  --help, -h          Show this help message
  --version, -v       Show version number

${chalk.bold("Examples:")}
  ${chalk.gray("# Scan a GitHub repository")}
  fixenv scan https://github.com/pallets/flask

  ${chalk.gray("# Scan local directory")}
  fixenv scan .
  fixenv scan ./my-project
  fixenv scan /home/user/project

  ${chalk.gray("# Get JSON output for CI integration")}
  fixenv scan https://github.com/pallets/flask --json

  ${chalk.gray("# Generate and download .zfix snapshot")}
  fixenv snapshot https://github.com/pallets/flask
  fixenv snapshot https://github.com/pallets/flask --output=my-snapshot.zfix

${chalk.bold("Features:")}
  ${chalk.green("✓")} Dependency analysis (missing pins, conflicts)
  ${chalk.green("✓")} Security vulnerability detection (CVEs via OSV.dev)
  ${chalk.green("✓")} Python version compatibility checks
  ${chalk.green("✓")} Reproducibility scoring
  ${chalk.green("✓")} Local directory scanning
  ${chalk.green("✓")} Portable .zfix snapshot generation
  ${chalk.green("✓")} Supports requirements.txt, pyproject.toml, Pipfile

${chalk.gray("Learn more: https://fixenv.lovable.app")}
  `);
}

async function scanLocalDirectory(dirPath, jsonOutput) {
  const spinner = ora({
    text: "Reading local project files...",
    color: "cyan",
  }).start();

  try {
    const resolvedPath = path.resolve(dirPath);
    
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`Directory not found: ${resolvedPath}`);
    }

    // Read dependency files
    const depFiles = {};
    const supportedFiles = [
      "requirements.txt",
      "pyproject.toml",
      "Pipfile",
      "Pipfile.lock",
      "setup.py",
      "setup.cfg"
    ];

    for (const filename of supportedFiles) {
      const filePath = path.join(resolvedPath, filename);
      if (fs.existsSync(filePath)) {
        depFiles[filename] = fs.readFileSync(filePath, "utf-8");
        spinner.text = `Found ${filename}...`;
      }
    }

    // Check for Python version files
    const versionFiles = [".python-version", "runtime.txt"];
    let pythonVersion = null;
    
    for (const vf of versionFiles) {
      const vfPath = path.join(resolvedPath, vf);
      if (fs.existsSync(vfPath)) {
        const content = fs.readFileSync(vfPath, "utf-8").trim();
        pythonVersion = content.replace(/^python-?/i, "");
        break;
      }
    }

    if (Object.keys(depFiles).length === 0) {
      throw new Error("No Python dependency files found in directory");
    }

    spinner.text = "Analyzing dependencies...";

    // Send to API for analysis
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        localFiles: depFiles,
        pythonVersion,
        isLocal: true,
        localPath: resolvedPath
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `API returned ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Analysis failed");
    }

    spinner.stop();

    if (jsonOutput) {
      console.log(JSON.stringify(result, null, 2));
      process.exit(0);
    }

    printLocalResults(resolvedPath, result);
  } catch (error) {
    spinner.fail(chalk.red("Analysis failed"));
    console.error(chalk.red(`\nError: ${error.message}`));

    if (error.message.includes("No Python dependency files")) {
      console.log(chalk.yellow("\nNo Python dependency files found in this directory."));
      console.log(chalk.gray("FixEnv requires: requirements.txt, pyproject.toml, Pipfile, or setup.py"));
    }

    process.exit(1);
  }
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

async function generateSnapshot(repoUrl, outputPath) {
  const spinner = ora({
    text: "Connecting to FixEnv API...",
    color: "cyan",
  }).start();

  try {
    // First, analyze the repository
    spinner.text = "Analyzing repository...";
    
    const analyzeResponse = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repoUrl }),
    });

    if (!analyzeResponse.ok) {
      const error = await analyzeResponse.json().catch(() => ({}));
      throw new Error(error.error || `Analysis API returned ${analyzeResponse.status}`);
    }

    const analysisResult = await analyzeResponse.json();

    if (!analysisResult.success) {
      throw new Error(analysisResult.error || "Analysis failed");
    }

    // Generate snapshot
    spinner.text = "Generating .zfix snapshot...";

    const snapshotResponse = await fetch(SNAPSHOT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        repositoryUrl: repoUrl,
        pythonVersion: analysisResult.pythonVersion,
        detectedFormats: analysisResult.detectedFormats,
        issues: analysisResult.data.issues,
        suggestions: analysisResult.data.suggestions,
        vulnerabilities: analysisResult.data.vulnerabilities,
        reproducibilityScore: analysisResult.data.reproducibilityScore,
        dependencyDiff: analysisResult.data.dependencyDiff,
        rawContent: analysisResult.rawContent
      }),
    });

    if (!snapshotResponse.ok) {
      const error = await snapshotResponse.json().catch(() => ({}));
      throw new Error(error.error || `Snapshot API returned ${snapshotResponse.status}`);
    }

    const snapshotResult = await snapshotResponse.json();

    if (!snapshotResult.success) {
      throw new Error(snapshotResult.error || "Snapshot generation failed");
    }

    spinner.text = "Saving snapshot file...";

    // Determine output filename
    const repoName = repoUrl.replace("https://github.com/", "").replace(/\//g, "_");
    const filename = outputPath || `${repoName}_environment.zfix`;
    
    // Write the .zfix file
    const zfixContent = JSON.stringify(snapshotResult.zfixData, null, 2);
    fs.writeFileSync(filename, zfixContent);

    spinner.succeed(chalk.green(`Snapshot saved to ${filename}`));

    // Print summary
    console.log("\n" + chalk.cyan.bold("🔧 FixEnv Snapshot Generated"));
    console.log(chalk.gray("─".repeat(50)));
    
    const { zfixData } = snapshotResult;
    console.log(chalk.white(`Repository: ${chalk.cyan(repoUrl.replace("https://github.com/", ""))}`));
    
    if (zfixData.metadata?.python_version) {
      console.log(chalk.white(`Python: ${chalk.yellow(zfixData.metadata.python_version)}`));
    }

    const score = zfixData.analysis?.reproducibility_score || 0;
    const scoreColor = score >= 80 ? chalk.green : score >= 50 ? chalk.yellow : chalk.red;
    console.log(chalk.white(`📊 Reproducibility Score: ${scoreColor.bold(score + "%")}`));
    console.log(chalk.white(`⚠️  Issues: ${zfixData.analysis?.total_issues || 0}`));
    
    if (zfixData.analysis?.vulnerabilities?.length > 0) {
      console.log(chalk.white(`🔒 Vulnerabilities: ${chalk.red(zfixData.analysis.vulnerabilities.length)}`));
    }

    console.log("");
    console.log(chalk.gray("─".repeat(50)));
    console.log(chalk.gray(`📁 Snapshot file: ${chalk.cyan(filename)}`));
    console.log(chalk.gray(`💡 View detailed results: ${chalk.cyan("https://fixenv.lovable.app")}`));
    console.log("");

  } catch (error) {
    spinner.fail(chalk.red("Snapshot generation failed"));
    console.error(chalk.red(`\nError: ${error.message}`));

    if (error.message.includes("No Python dependency files")) {
      console.log(chalk.yellow("\nThis repository does not appear to be a Python project."));
      console.log(chalk.gray("FixEnv requires: requirements.txt, pyproject.toml, Pipfile, or setup.py"));
    }

    process.exit(1);
  }
}

function printLocalResults(dirPath, result) {
  const { data, pythonVersion, detectedFormats } = result;
  const { issues, vulnerabilities, reproducibilityScore } = data;

  console.log("\n" + chalk.cyan.bold("🔧 FixEnv - Local Project Analysis"));
  console.log(chalk.gray("─".repeat(50)));

  console.log(chalk.white(`Directory: ${chalk.cyan(dirPath)}`));

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
  console.log(chalk.gray("💡 Generate snapshot: fixenv snapshot <github-url>"));
  console.log(chalk.gray(`🌐 View detailed results: ${chalk.cyan("https://fixenv.lovable.app")}`));
  console.log("");
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
  console.log(chalk.gray("💡 Generate snapshot: fixenv snapshot " + repoUrl));
  console.log(chalk.gray(`🌐 View detailed results: ${chalk.cyan("https://fixenv.lovable.app")}`));
  console.log("");
}

main().catch((error) => {
  console.error(chalk.red("Unexpected error:"), error.message);
  process.exit(1);
});
