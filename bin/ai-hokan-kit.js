#!/usr/bin/env node
// ai-hokan-kit CLI
// Commands: init, upgrade, validate, reindex
'use strict';

/**
 * ai-hokan-kit CLI エントリポイント
 *
 * Usage:
 *   ai-hokan-kit init [options]
 *
 * Options:
 *   --preset <name>     openclaw-multi | generic-solo | generic-team
 *   --lang <code>       ja | en  (default: ja)
 *   --project <name>    Project name (default: my-workspace)
 *   --output <dir>      Output directory (default: ./<project-name>)
 *   --no-failures       Exclude failures/ system
 *   --no-relations      Exclude relations/ system
 *   --yes, -y           Use defaults (skip prompts)
 *   --help, -h          Show help
 *   --version, -v       Show version
 */

const { runInit } = require('../src/init');

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  printHelp();
  process.exit(0);
}

if (args.includes('--version') || args.includes('-v')) {
  const pkg = require('../package.json');
  console.log(pkg.version);
  process.exit(0);
}

const command = args[0];

if (!command || command === 'init') {
  const options = parseArgs(args.slice(command === 'init' ? 1 : 0));
  runInit(options).catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
} else {
  console.error(`Unknown command: "${command}"`);
  printHelp();
  process.exit(1);
}

// --- helpers ---

function parseArgs(argv) {
  const opts = {
    yes: false,
    includeFailures: true,
    includeRelations: true,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === '--yes' || arg === '-y') {
      opts.yes = true;
    } else if (arg === '--preset' && argv[i + 1]) {
      opts.preset = argv[++i];
    } else if (arg === '--lang' && argv[i + 1]) {
      opts.lang = argv[++i];
    } else if (arg === '--project' && argv[i + 1]) {
      opts.projectName = argv[++i];
    } else if (arg === '--output' && argv[i + 1]) {
      opts.output = argv[++i];
    } else if (arg === '--no-failures') {
      opts.includeFailures = false;
    } else if (arg === '--no-relations') {
      opts.includeRelations = false;
    }
    // preset/lang shorthand: --preset=xxx
    else if (arg.startsWith('--preset=')) {
      opts.preset = arg.split('=')[1];
    } else if (arg.startsWith('--lang=')) {
      opts.lang = arg.split('=')[1];
    } else if (arg.startsWith('--project=')) {
      opts.projectName = arg.split('=')[1];
    } else if (arg.startsWith('--output=')) {
      opts.output = arg.split('=')[1];
    }
  }

  return opts;
}

function printHelp() {
  console.log(`
ai-hokan-kit — Staged-reference knowledge workspace generator

Usage:
  ai-hokan-kit init [options]

Options:
  --preset <name>     Preset: openclaw-multi | generic-solo | generic-team
  --lang <code>       Language: ja | en  (default: ja)
  --project <name>    Project name  (default: my-workspace)
  --output <dir>      Output directory  (default: ./<project>)
  --no-failures       Exclude failures/ directory
  --no-relations      Exclude relations/ directory
  --yes, -y           Skip prompts, use defaults
  --version, -v       Show version
  --help, -h          Show this help

Examples:
  ai-hokan-kit init
  ai-hokan-kit init --preset generic-solo --lang ja --yes
  ai-hokan-kit init --preset openclaw-multi --lang en --project my-team
  npx ai-hokan-kit init
`);
}
