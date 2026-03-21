/**
 * pandora_archive_v2.js — AI補完計画 ログ収集システム v2.3
 *
 * v2.3からの変更点 (2026-03-21):
 * - ★修正: sessions_*.json（ワイルドカード）も1日1回制御に対応
 *
 * v2.2からの変更点 (2026-03-21):
 * - ★修正: セッション.jsonlは差分保存（追記型のためlastOffsetから後ろだけ）
 * - ★修正: sessions.jsonは1日1回だけ保存
 * - ★修正: gatewayログも差分保存（lastOffsetから後ろだけ）
 *
 * v2.1からの変更点 (2026-03-19):
 * - ★修正: workspace/サブフォルダを再帰的にスキャン（memory/, knowledge/, references/等）
 * - ★修正: gateway-logを当日だけでなくTemp内の全日分をチェック（日跨ぎ欠損防止）
 * - ★修正: RECENT_LINESは1日1回だけ保存（10分毎の無駄コピー防止）
 * - 除外: node_modules/, .git/, .openclaw/ のサブフォルダはスキップ
 *
 * Usage: node pandora_archive_v2.js [--archive-dir "D:\path"]
 * 推奨: タスクスケジューラで10分毎に実行
 */
const fs = require('fs');
const path = require('path');

// === 設定 ===
const archiveRoot = (() => {
  const idx = process.argv.indexOf('--archive-dir');
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
  return 'C:\\Users\\bejir\\Desktop\\クロー\\アーカイブ\\pandora';
})();

const OPENCLAW_ROOT = 'C:\\Users\\bejir\\.openclaw';
const AGENTS_DIR = path.join(OPENCLAW_ROOT, 'agents');
const WORKSPACE_DIR = path.join(OPENCLAW_ROOT, 'workspace');
const STATE_FILE = path.join(archiveRoot, '_pandora_state_v2.json');
const STATS_FILE = path.join(archiveRoot, '_pandora_stats.json');

// エージェントID → 表示名マッピング
const AGENT_NAMES = {
  main: 'kuro',
  shiro: 'shiro',
  taiou: 'shinkou',
  tsuki: 'tsuki',
  meme: 'meme',
  near: 'near',
  shiki: 'shiki',
  oboro: 'oboro',
  kaikei: 'kaikei',
  keiri: 'keiri'
};

// === 再帰スキャン除外リスト ===
const SKIP_DIRS = new Set([
  'node_modules', '.git', '.openclaw', '__pycache__', '.venv',
  'dist', 'build', '.next', '.cache'
]);

// === アーカイブ対象ファイル拡張子 ===
const ARCHIVE_EXTS = new Set(['.jsonl', '.json', '.md', '.txt', '.js', '.ps1', '.py', '.yaml', '.yml', '.toml', '.csv']);

// === RECENT_LINES 1日1回制御 ===
const RECENT_LINES_DAILY_KEY_PREFIX = 'recent_lines_daily:';

// === sessions*.json 1日1回制御（sessions.json および sessions_*.json を対象）===
const SESSIONS_JSON_DAILY_KEY_PREFIX = 'sessions_json_daily:';

function shouldArchive(filename) {
  return ARCHIVE_EXTS.has(path.extname(filename).toLowerCase());
}

// === ユーティリティ ===
function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function timestamp() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}_${String(d.getHours()).padStart(2,'0')}${String(d.getMinutes()).padStart(2,'0')}`;
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
}

function loadJSON(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { return {}; }
}

function saveJSON(file, data) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// === 再帰的ファイル列挙 ===
function walkDir(dir, maxDepth = 5) {
  const results = [];
  function walk(currentDir, depth) {
    if (depth > maxDepth) return;
    let entries;
    try { entries = fs.readdirSync(currentDir, { withFileTypes: true }); }
    catch { return; }

    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) continue;
        walk(path.join(currentDir, entry.name), depth + 1);
      } else if (entry.isFile() && shouldArchive(entry.name)) {
        results.push(path.join(currentDir, entry.name));
      }
    }
  }
  walk(dir, 0);
  return results;
}

// === 動的エージェント検出 ===
function discoverWatchTargets() {
  const targets = [];

  if (fs.existsSync(AGENTS_DIR)) {
    const agentIds = fs.readdirSync(AGENTS_DIR).filter(d => {
      const full = path.join(AGENTS_DIR, d);
      return fs.existsSync(full) && fs.statSync(full).isDirectory();
    });

    for (const agentId of agentIds) {
      const displayName = AGENT_NAMES[agentId] || agentId;
      const agentDir = path.join(AGENTS_DIR, agentId);

      // sessions/ （1階層のみ — .jsonlファイル群）
      const sessDir = path.join(agentDir, 'sessions');
      if (fs.existsSync(sessDir)) {
        targets.push({ name: `${displayName}/sessions`, dir: sessDir, pii: 'pii-high', recursive: false });
      }

      // workspace/ （再帰的にスキャン）
      const wsDir = path.join(agentDir, 'workspace');
      if (fs.existsSync(wsDir)) {
        targets.push({ name: `${displayName}/workspace`, dir: wsDir, pii: 'general', recursive: true });
      }

      // memory/ （再帰的にスキャン）
      const memDir = path.join(agentDir, 'memory');
      if (fs.existsSync(memDir)) {
        targets.push({ name: `${displayName}/memory`, dir: memDir, pii: 'confidential', recursive: true });
      }
    }
  }

  // 共有workspace（再帰的にスキャン）
  if (fs.existsSync(WORKSPACE_DIR)) {
    targets.push({ name: 'shared/workspace', dir: WORKSPACE_DIR, pii: 'general', recursive: true });
  }

  return targets;
}

// === RECENT_LINES制御: 1日1回だけ保存 ===
function isRecentLinesThrottle(filename, state) {
  if (!filename.startsWith('RECENT_LINES')) return false;
  const today = todayStr();
  const dailyKey = RECENT_LINES_DAILY_KEY_PREFIX + today;
  if (state[dailyKey]) return true; // 今日はもう保存した
  return false;
}

function markRecentLinesSaved(state) {
  const today = todayStr();
  const dailyKey = RECENT_LINES_DAILY_KEY_PREFIX + today;
  state[dailyKey] = true;

  // 古い日付キーを掃除（3日以上前）
  for (const key of Object.keys(state)) {
    if (key.startsWith(RECENT_LINES_DAILY_KEY_PREFIX) && key !== dailyKey) {
      delete state[key];
    }
  }
}

// === sessions*.json制御: 1日1回だけ保存 ===
// sessions.json, sessions_YYYYMMDD.json など sessions で始まる .json を対象
function isSessionsJsonFile(filename) {
  return filename.startsWith('sessions') && filename.endsWith('.json');
}

function isSessionsJsonThrottle(filename, state) {
  if (!isSessionsJsonFile(filename)) return false;
  const today = todayStr();
  const dailyKey = SESSIONS_JSON_DAILY_KEY_PREFIX + today;
  if (state[dailyKey]) return true; // 今日はもう保存した
  return false;
}

function markSessionsJsonSaved(state) {
  const today = todayStr();
  const dailyKey = SESSIONS_JSON_DAILY_KEY_PREFIX + today;
  state[dailyKey] = true;

  // 古い日付キーを掃除
  for (const key of Object.keys(state)) {
    if (key.startsWith(SESSIONS_JSON_DAILY_KEY_PREFIX) && key !== dailyKey) {
      delete state[key];
    }
  }
}

// === メイン処理 ===
const ts = timestamp();
const state = loadJSON(STATE_FILE);
const stats = loadJSON(STATS_FILE);
let copied = 0;
let skipped = 0;
let totalBytes = 0;
const piiCounts = { 'pii-high': 0, 'confidential': 0, 'general': 0 };
let recentLinesSavedThisRun = false;
let sessionJsonSavedThisRun = false;

ensureDir(archiveRoot);

const targets = discoverWatchTargets();

for (const target of targets) {
  if (!fs.existsSync(target.dir)) continue;

  // ファイル列挙: 再帰 or 1階層
  let filePaths;
  if (target.recursive) {
    filePaths = walkDir(target.dir);
  } else {
    try {
      filePaths = fs.readdirSync(target.dir)
        .filter(shouldArchive)
        .map(f => path.join(target.dir, f))
        .filter(fp => { try { return fs.statSync(fp).isFile(); } catch { return false; } });
    } catch { continue; }
  }

  for (const srcPath of filePaths) {
    let stat;
    try { stat = fs.statSync(srcPath); } catch { continue; }
    if (!stat.isFile()) continue;

    // 相対パスをキーにする（target.dirからの相対）
    const relPath = path.relative(target.dir, srcPath).replace(/\\/g, '/');
    const filename = path.basename(srcPath);
    const ext = path.extname(filename).toLowerCase();
    const key = `${target.name}/${relPath}`;
    const prev = state[key];

    // .jsonl差分保存対象かどうか（pii-highのsessionsディレクトリのみ）
    const isJsonlDiff = ext === '.jsonl' && target.pii === 'pii-high' && !target.recursive;

    // 変更チェック
    if (prev && prev.size === stat.size && prev.mtime === stat.mtimeMs) {
      skipped++;
      continue;
    }

    // .jsonl差分: サイズが増えていなければスキップ（mtime変化のみは無視）
    if (isJsonlDiff && prev && stat.size <= (prev.lastOffset || prev.size || 0)) {
      skipped++;
      continue;
    }

    // RECENT_LINES制御: 1日1回
    if (isRecentLinesThrottle(filename, state)) {
      skipped++;
      continue;
    }

    // sessions.json制御: 1日1回
    if (isSessionsJsonThrottle(filename, state)) {
      skipped++;
      continue;
    }

    // PII区分別フォルダに保存
    const piiDir = target.pii || 'general';
    // アーカイブ先はサブフォルダ構造を維持
    const relDir = path.dirname(relPath);
    const destDir = relDir === '.'
      ? path.join(archiveRoot, piiDir, target.name)
      : path.join(archiveRoot, piiDir, target.name, relDir);
    ensureDir(destDir);

    const baseName = path.basename(filename, ext);
    const destFile = `${baseName}_${ts}${ext}`;
    const destPath = path.join(destDir, destFile);

    let bytesWritten = 0;

    if (isJsonlDiff) {
      // .jsonlは差分保存（lastOffsetから後ろだけ読んで追記ファイルとして保存）
      const lastOffset = prev?.lastOffset || 0;
      try {
        if (lastOffset > stat.size) {
          // ファイルが作り直された（新セッション開始）→ 全文コピー
          fs.copyFileSync(srcPath, destPath);
          bytesWritten = stat.size;
        } else {
          const diffSize = stat.size - lastOffset;
          if (diffSize > 0) {
            const fd = fs.openSync(srcPath, 'r');
            const buffer = Buffer.allocUnsafe(diffSize);
            fs.readSync(fd, buffer, 0, diffSize, lastOffset);
            fs.closeSync(fd);
            const diffDest = path.join(destDir, `${baseName}_diff_${ts}${ext}`);
            fs.writeFileSync(diffDest, buffer);
            bytesWritten = diffSize;
          }
        }
      } catch (e) {
        console.error(`差分コピー失敗: ${srcPath}: ${e.message}`);
        continue;
      }
    } else {
      // 通常ファイルは全文コピー
      try {
        fs.copyFileSync(srcPath, destPath);
      } catch (e) {
        console.error(`コピー失敗: ${srcPath} → ${destPath}: ${e.message}`);
        continue;
      }
      bytesWritten = stat.size;
    }

    totalBytes += bytesWritten;
    copied++;
    piiCounts[piiDir] = (piiCounts[piiDir] || 0) + 1;

    state[key] = {
      size: stat.size,
      mtime: stat.mtimeMs,
      lastArchive: ts,
      pii: piiDir,
      ...(isJsonlDiff ? { lastOffset: stat.size } : {})
    };

    // RECENT_LINESを保存したらマーク
    if (filename.startsWith('RECENT_LINES')) {
      recentLinesSavedThisRun = true;
    }

    // sessions*.jsonを保存したらマーク
    if (isSessionsJsonFile(filename)) {
      sessionJsonSavedThisRun = true;
    }
  }
}

// RECENT_LINES保存マーク
if (recentLinesSavedThisRun) {
  markRecentLinesSaved(state);
}

// sessions.json保存マーク
if (sessionJsonSavedThisRun) {
  markSessionsJsonSaved(state);
}

// === OpenClawログ（全日分チェック、差分保存） ===
const logDir = `${process.env.LOCALAPPDATA || 'C:\\Users\\bejir\\AppData\\Local'}\\Temp\\openclaw`;
if (fs.existsSync(logDir)) {
  let logFiles;
  try {
    logFiles = fs.readdirSync(logDir).filter(f => f.startsWith('openclaw-') && f.endsWith('.log'));
  } catch { logFiles = []; }

  for (const logFile of logFiles) {
    const logPath = path.join(logDir, logFile);
    let logStat;
    try { logStat = fs.statSync(logPath); } catch { continue; }

    const logKey = `openclaw-log:${logFile}`;
    const prevLog = state[logKey];

    if (!prevLog || prevLog.size !== logStat.size) {
      const logDest = path.join(archiveRoot, 'general', 'gateway-logs');
      ensureDir(logDest);
      const logBaseName = logFile.replace('.log', '');
      const logLastOffset = prevLog?.lastOffset || 0;

      if (logLastOffset > logStat.size) {
        // ログローテーション → 全文コピー
        fs.copyFileSync(logPath, path.join(logDest, `${logBaseName}_${ts}.log`));
        state[logKey] = { size: logStat.size, mtime: logStat.mtimeMs, lastArchive: ts, lastOffset: logStat.size };
        copied++;
        totalBytes += logStat.size;
      } else {
        const diffSize = logStat.size - logLastOffset;
        if (diffSize > 0) {
          try {
            const fd = fs.openSync(logPath, 'r');
            const buffer = Buffer.allocUnsafe(diffSize);
            fs.readSync(fd, buffer, 0, diffSize, logLastOffset);
            fs.closeSync(fd);
            fs.writeFileSync(path.join(logDest, `${logBaseName}_diff_${ts}.log`), buffer);
            state[logKey] = { size: logStat.size, mtime: logStat.mtimeMs, lastArchive: ts, lastOffset: logStat.size };
            copied++;
            totalBytes += diffSize;
          } catch (e) {
            console.error(`ログ差分コピー失敗: ${logPath}: ${e.message}`);
          }
        }
      }
    }
  }
}

// 統計更新
if (!stats.history) stats.history = [];
stats.history.push({
  ts,
  copied,
  skipped,
  totalBytes,
  piiCounts,
  agents: targets.length
});
// 直近100件のみ保持
if (stats.history.length > 100) stats.history = stats.history.slice(-100);
stats.lastRun = ts;
stats.totalAgents = [...new Set(targets.map(w => w.name.split('/')[0]))].length;

saveJSON(STATE_FILE, state);
saveJSON(STATS_FILE, stats);

// レポート
const totalMB = (totalBytes / (1024 * 1024)).toFixed(2);
if (copied > 0) {
  console.log(`🗑️✨ パンドラv2.3 [${ts}]: ${copied}件保存 (${totalMB}MB) / ${skipped}件スキップ`);
  console.log(`   PII区分: pii-high=${piiCounts['pii-high']||0} / confidential=${piiCounts['confidential']||0} / general=${piiCounts['general']||0}`);
  console.log(`   監視ターゲット: ${targets.length}件 (${stats.totalAgents}体)`);
}

console.log(JSON.stringify({ ok: true, ts, copied, skipped, totalMB, piiCounts, agents: stats.totalAgents }));
