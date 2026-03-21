'use strict';

const { PRESETS } = require('./constants');

// --yes フラグ時のデフォルト値
const DEFAULTS = {
  projectName: 'my-workspace',
  preset: 'generic-solo',
  lang: 'ja',
  includeRelations: true,
  includeFailures: true,
};

/**
 * CLIオプションからコンフィグを解決する。
 * --yes フラグまたはすべてのオプション指定時はプロンプトをスキップ。
 */
async function collectConfig(cliOptions) {
  const yes = cliOptions.yes || false;

  if (yes || isFullySpecified(cliOptions)) {
    return {
      projectName: cliOptions.projectName || DEFAULTS.projectName,
      preset: cliOptions.preset || DEFAULTS.preset,
      lang: cliOptions.lang || DEFAULTS.lang,
      includeRelations: cliOptions.includeRelations !== undefined
        ? cliOptions.includeRelations
        : DEFAULTS.includeRelations,
      includeFailures: cliOptions.includeFailures !== undefined
        ? cliOptions.includeFailures
        : DEFAULTS.includeFailures,
    };
  }

  // 対話プロンプト（--yes なし）
  const prompts = require('prompts');

  const presetChoices = Object.entries(PRESETS).map(([value, info]) => ({
    title: `${info.label}  — ${info.description}`,
    value,
  }));

  const answers = await prompts([
    {
      type: 'text',
      name: 'projectName',
      message: 'Project name?',
      initial: DEFAULTS.projectName,
      validate: (v) => v.trim().length > 0 || 'Required',
    },
    {
      type: 'select',
      name: 'preset',
      message: 'Select preset:',
      choices: presetChoices,
      initial: 1, // generic-solo
    },
    {
      type: 'select',
      name: 'lang',
      message: 'Language:',
      choices: [
        { title: '日本語 (ja)', value: 'ja' },
        { title: 'English (en)', value: 'en' },
      ],
      initial: 0,
    },
    {
      type: 'confirm',
      name: 'includeFailures',
      message: 'Include failures/ system?',
      initial: true,
    },
    {
      type: 'confirm',
      name: 'includeRelations',
      message: 'Include relations/ system?',
      initial: true,
    },
  ], {
    onCancel: () => {
      console.log('\nCancelled.');
      process.exit(0);
    },
  });

  return {
    projectName: answers.projectName || DEFAULTS.projectName,
    preset: answers.preset || DEFAULTS.preset,
    lang: answers.lang || DEFAULTS.lang,
    includeRelations: answers.includeRelations !== undefined ? answers.includeRelations : DEFAULTS.includeRelations,
    includeFailures: answers.includeFailures !== undefined ? answers.includeFailures : DEFAULTS.includeFailures,
  };
}

function isFullySpecified(opts) {
  return opts.preset && opts.lang;
}

module.exports = { collectConfig, DEFAULTS };
