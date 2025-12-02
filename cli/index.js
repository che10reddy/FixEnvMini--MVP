#!/usr/bin/env node

const chalk = require("chalk");
const ora = require("ora");

const API_URL = 'https://ncafkcmxumkklboonfhs.supabase.co/functions/v1/analyze-repo';

async function main() {
  const args = process.argv.slice(2);
  
  // Help command
  if (args.includes('--help') || args.includes('-h') || args.length === 0) {
    printHelp();
    process.exit(0);
  }

  // Version command
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pkg = require('./package.json');

if (args.includes('--version') || args.includes('-v')) {
    console.log(`fixenv-cli v${pkg.version}`);
    process.exit(0);
}

  // Parse command
  const command = args[0];
  
  if (command === 'scan') {
    const repoUrl = args[1];
    const jsonOutput = args.includes('--json');
    
    if (!repoUrl) {
      console.error(chalk.red('Error: Please provide a GitHub repository URL'));
      console.log(chalk.gray('Usage: fixenv scan <github-repo-url>'));
      process.exit(1);
    }

    // Validate GitHub URL
    if (!repoUrl.includes('github.com/')) {
      console.error(chalk.red('Error: Please provide a valid GitHub repository URL'));
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
${chalk.cyan.bold('🔧 FixEnv CLI')} - Python Environment Analyzer

${chalk.bold('Usage:')}
  fixenv scan <github-repo-url> [options]

${chalk.bold('Commands:')}
  scan <url>    Analyze a GitHub repository for dependency issues

${chalk.bold('Options:')}
  --json        Output results as JSON
  --help, -h    Show this help message
  --version, -v Show version number

${chalk.bold('Examples:')}
  ${chalk.gray('# Scan a Python repository')}
  fixenv scan https://github.com/pallets/flask

  ${chalk.gray('# Get JSON output for CI integration')}
  fixenv scan https://github.com/pallets/flask --json

${chalk.bold('Features:')}
  ${chalk.green('✓')} Dependency analysis (missing pins, conflicts)
  ${chalk.green('✓')} Security vulnerability detection (CVEs via OSV.dev)
  ${chalk.green('✓')} Python version compatibility checks
  ${chalk.green('✓')} Reproducibility scoring
  ${chalk.green('✓')} Support for requirements.txt, pyproject.toml, Pipfile

${chalk.gray('Learn more: https://fixenv.lovable.app')}
  `);
}

async function scanRepository(repoUrl, jsonOutput) {
  const spinner = ora({
    text: 'Connecting to FixEnv API...',
    color: 'cyan'
  }).start();

  try {
    spinner.text = 'Fetching repository data...';
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ repoUrl })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `API returned ${response.status}`);
    }

    spinner.text = 'Analyzing dependencies...';
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Analysis failed');
    }

    spinner.stop();

    // JSON output mode
    if (jsonOutput) {
      console.log(JSON.stringify(result, null, 2));
      process.exit(0);
    }

    // Pretty print results
    printResults(repoUrl, result);

  } catch (error) {
    spinner.fail(chalk.red('Analysis failed'));
    console.error(chalk.red(`\nError: ${error.message}`));
    
    if (error.message.includes('No Python dependency files')) {
      console.log(chalk.yellow('\nThis repository does not appear to be a Python project.'));
      console.log(chalk.gray('FixEnv requires: requirements.txt, pyproject.toml, Pipfile, or setup.py'));
    }
    
    process.exit(1);
  }
}

function printResults(repoUrl, result) {
  const { data, pythonVersion, detectedFormats } = result;
  const { issues, suggestions, dependencyDiff, vulnerabilities, reproducibilityScore } = data;

  // Header
  console.log('\n' + chalk.cyan.bold('🔧 FixEnv - Python Environment Analysis'));
  console.log(chalk.gray('─'.repeat(50)));
  
  // Repository info
  const repoName = repoUrl.replace('https://github.com/', '');
  console.log(chalk.white(`Repository: ${chalk.cyan(repoName)}`));
  
  if (pythonVersion && pythonVersion !== 'unknown') {
    console.log(chalk.white(`Python: ${chalk.yellow(pythonVersion)}`));
  }
  
  if (detectedFormats && detectedFormats.length > 0) {
    console.log(chalk.white(`Formats: ${chalk.gray(detectedFormats.join(', '))}`));
  }
  
  console.log('');

  // Score
  const scoreColor = reproducibilityScore >= 80 ? chalk.green : 
                     reproducibilityScore >= 50 ? chalk.yellow : chalk.red;
  console.log(chalk.white(`📊 Reproducibility Score: ${scoreColor.bold(reproducibilityScore + '%')}`));
  
  // Issues count
  console.log(chalk.white(`⚠️  Issues Found: ${issues.length > 0 ? chalk.yellow(issues.length) : chalk.green('0')}`));
  
  // Vulnerabilities count
  if (vulnerabilities && vulnerabilities.length > 0) {
    const criticalCount = vulnerabilities.filter(v => v.severity === 'CRITICAL').length;
    const highCount = vulnerabilities.filter(v => v.severity === 'HIGH').length;
    
    let vulnText = `🔒 Vulnerabilities: ${chalk.red(vulnerabilities.length)}`;
    if (criticalCount > 0) vulnText += ` (${chalk.red.bold(criticalCount + ' Critical')})`;
    else if (highCount > 0) vulnText += ` (${chalk.red(highCount + ' High')})`;
    
    console.log(vulnText);
  } else {
    console.log(chalk.white(`🔒 Vulnerabilities: ${chalk.green('0')}`));
  }

  console.log('');

  // Issues details
  if (issues.length > 0) {
    console.log(chalk.bold('Issues:'));
    issues.slice(0, 10).forEach(issue => {
      const severityIcon = issue.severity === 'high' ? chalk.red('●') : 
                          issue.severity === 'medium' ? chalk.yellow('●') : chalk.blue('●');
      console.log(`  ${severityIcon} ${issue.title}: ${chalk.cyan(issue.package)} ${chalk.gray(`(${issue.severity})`)}`);
    });
    if (issues.length > 10) {
      console.log(chalk.gray(`  ... and ${issues.length - 10} more issues`));
    }
    console.log('');
  }

  // Vulnerabilities details
  if (vulnerabilities && vulnerabilities.length > 0) {
    console.log(chalk.bold('Security Vulnerabilities:'));
    vulnerabilities.slice(0, 5).forEach(vuln => {
      const severityColor = vuln.severity === 'CRITICAL' ? chalk.red.bold : 
                           vuln.severity === 'HIGH' ? chalk.red :
                           vuln.severity === 'MEDIUM' ? chalk.yellow : chalk.blue;
      console.log(`  ${chalk.red('🔴')} ${chalk.cyan(vuln.id)}: ${vuln.package}@${vuln.version} ${severityColor(`(${vuln.severity})`)}`);
      if (vuln.fixed_versions) {
        console.log(chalk.gray(`     Fix: upgrade to ${vuln.fixed_versions}`));
      }
    });
    if (vulnerabilities.length > 5) {
      console.log(chalk.gray(`  ... and ${vulnerabilities.length - 5} more vulnerabilities`));
    }
    console.log('');
  }

  // Footer
  console.log(chalk.gray('─'.repeat(50)));
  console.log(chalk.gray('💡 Run with --json for full output'));
  console.log(chalk.gray(`🌐 View detailed results: ${chalk.cyan('https://fixenv.lovable.app')}`));
  console.log('');
}

main().catch(error => {
  console.error(chalk.red('Unexpected error:'), error.message);
  process.exit(1);
});
