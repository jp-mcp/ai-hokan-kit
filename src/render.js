'use strict';

const fs = require('fs');
const path = require('path');

const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');

/**
 * テンプレート文字列内の {{key}} プレースホルダーを vars で置換する。
 */
function render(template, vars) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return vars[key] !== undefined ? vars[key] : `{{${key}}}`;
  });
}

/**
 * templates/ 配下のファイルを読み込んで render する。
 * @param {string} relPath  templates/ からの相対パス (e.g. 'common/INDEX.md')
 * @param {object} vars     置換変数
 */
function renderTemplate(relPath, vars) {
  const fullPath = path.join(TEMPLATES_DIR, relPath);
  const raw = fs.readFileSync(fullPath, 'utf8');
  return render(raw, vars);
}

/**
 * 出力先にファイルを書き込む。ディレクトリが存在しなければ作成。
 */
function writeFile(outPath, content) {
  const dir = path.dirname(outPath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(outPath, content, 'utf8');
}

/**
 * templates/common/ または templates/presets/{preset}/ のテンプレートを読み込み、
 * outDir に展開する。
 */
function renderWorkspace(outDir, config) {
  const { lang, preset, projectName, includeFailures, includeRelations } = config;
  const today = new Date().toISOString().slice(0, 10);

  const vars = {
    project_name: projectName,
    lang,
    preset,
    date: today,
    // lang_text はテンプレート内で使う多言語文字列を一括展開
  };

  const { LANG_TEXT } = require('./constants');
  const lt = LANG_TEXT[lang] || LANG_TEXT.ja;
  Object.assign(vars, flattenLangText(lt));

  const files = [];

  // --- common テンプレート ---
  files.push({ src: 'common/INDEX.md', dest: 'INDEX.md' });
  files.push({ src: 'common/AGENTS.md', dest: 'AGENTS.md' });
  files.push({ src: 'common/MEMORY.md', dest: 'MEMORY.md' });
  files.push({ src: 'common/rules/_index.md', dest: 'rules/_index.md' });
  files.push({ src: 'common/rules/shared_rules.md', dest: 'rules/shared_rules.md' });
  files.push({ src: 'common/references/_index.md', dest: 'references/_index.md' });
  files.push({ src: 'common/knowledge/_index.md', dest: 'knowledge/_index.md' });
  files.push({ src: 'common/vocab/read_when.yml', dest: 'vocab/read_when.yml' });

  if (includeFailures) {
    files.push({ src: 'common/failures/_index.md', dest: 'failures/_index.md' });
  }
  if (includeRelations) {
    files.push({ src: 'common/relations/_index.md', dest: 'relations/_index.md' });
  }

  // --- preset SOUL.md ---
  files.push({ src: `presets/${preset}/SOUL.md.template`, dest: 'SOUL.md' });

  for (const { src, dest } of files) {
    const content = renderTemplate(src, vars);
    writeFile(path.join(outDir, dest), content);
  }

  return files.map((f) => f.dest);
}

/**
 * LANG_TEXT オブジェクトのキーをフラット化して vars に混ぜ込む。
 * LANG_TEXT.ja.index_intro → vars.index_intro
 */
function flattenLangText(lt) {
  const result = {};
  for (const [key, val] of Object.entries(lt)) {
    result[key] = val;
  }
  return result;
}

module.exports = { render, renderTemplate, writeFile, renderWorkspace };
