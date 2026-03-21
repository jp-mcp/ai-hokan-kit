'use strict';

const path = require('path');
const { collectConfig } = require('./prompts');
const { renderWorkspace } = require('./render');
const { PRESETS } = require('./constants');

/**
 * `ai-hokan-kit init` のメインロジック。
 *
 * @param {object} cliOptions  コマンドライン引数から解析されたオプション
 *   - projectName?: string
 *   - preset?: 'openclaw-multi' | 'generic-solo' | 'generic-team'
 *   - lang?: 'ja' | 'en'
 *   - includeFailures?: boolean
 *   - includeRelations?: boolean
 *   - yes?: boolean      — 全デフォルト選択
 *   - output?: string    — 出力先ディレクトリ（デフォルト: ./project_name）
 */
async function runInit(cliOptions = {}) {
  console.log('\nai-hokan-kit — knowledge workspace generator\n');

  // 1. オプション収集（対話 or --yes）
  const config = await collectConfig(cliOptions);

  // バリデーション
  if (!PRESETS[config.preset]) {
    const valid = Object.keys(PRESETS).join(', ');
    console.error(`Error: unknown preset "${config.preset}". Valid presets: ${valid}`);
    process.exit(1);
  }
  if (!['ja', 'en'].includes(config.lang)) {
    console.error(`Error: unknown lang "${config.lang}". Use "ja" or "en".`);
    process.exit(1);
  }

  // 2. 出力先ディレクトリを決定
  const safeProjectName = config.projectName.replace(/[^a-zA-Z0-9_\-\.ぁ-んァ-ン一-龯]/g, '_');
  const outDir = cliOptions.output
    ? path.resolve(cliOptions.output)
    : path.join(process.cwd(), safeProjectName);

  console.log(`Project   : ${config.projectName}`);
  console.log(`Preset    : ${config.preset} (${PRESETS[config.preset].label})`);
  console.log(`Language  : ${config.lang}`);
  console.log(`Failures  : ${config.includeFailures ? 'yes' : 'no'}`);
  console.log(`Relations : ${config.includeRelations ? 'yes' : 'no'}`);
  console.log(`Output    : ${outDir}`);
  console.log('');

  // 3. テンプレート展開
  let generatedFiles;
  try {
    generatedFiles = renderWorkspace(outDir, config);
  } catch (err) {
    console.error('Error generating workspace:', err.message);
    process.exit(1);
  }

  // 4. 完了報告
  console.log('Generated files:');
  for (const f of generatedFiles) {
    console.log(`  ${outDir}/${f}`);
  }
  console.log('');
  console.log('Done! Next steps:');
  console.log(`  1. Open ${outDir}/SOUL.md and fill in your AI's identity`);
  console.log(`  2. Edit AGENTS.md to define startup reading order`);
  console.log(`  3. Start writing daily memory in MEMORY.md`);
  console.log('');
}

module.exports = { runInit };
