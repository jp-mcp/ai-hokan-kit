/**
 * cleanup_pandora_dupes.js
 * pandoraアーカイブの重複ファイルを削除するスクリプト
 *
 * 動作:
 *   - {UUID}_{date}_{time}.jsonl → UUID単位でグローバルにグループ化し、最新1つを残して削除
 *   - sessions_{date}_{time}.json → ディレクトリ単位でグループ化し、最新1つを残して削除
 *
 * 使い方:
 *   node scripts/cleanup_pandora_dupes.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');

const PANDORA_DIR = 'C:\\Users\\bejir\\Desktop\\クロー\\アーカイブ\\pandora';
const DRY_RUN = process.argv.includes('--dry-run');

// ファイルサイズを人間が読みやすい形式に変換
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// ディレクトリを再帰的に走査して全ファイルを収集
function walkDir(dir, fileList = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    console.warn(`⚠️ 読み取りスキップ: ${dir} (${e.message})`);
    return fileList;
  }
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath, fileList);
    } else if (entry.isFile()) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

// ファイル名から日付時刻タグを抽出 (例: _20260308_1711 → "20260308_1711")
function extractTimestamp(filename) {
  const m = filename.match(/_(\d{8}_\d{4})\.(?:jsonl|json)$/);
  return m ? m[1] : null;
}

// UUIDパターン
const UUID_RE = /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})_\d{8}_\d{4}\.jsonl$/i;
// sessions_*.jsonパターン
const SESSIONS_RE = /^sessions_\d{8}_\d{4}\.json$/;

function main() {
  console.log(`📂 対象ディレクトリ: ${PANDORA_DIR}`);
  console.log(DRY_RUN ? '🔍 モード: DRY-RUN（実際の削除は行いません）\n' : '🗑️  モード: 実削除\n');

  if (!fs.existsSync(PANDORA_DIR)) {
    console.error(`❌ ディレクトリが見つかりません: ${PANDORA_DIR}`);
    process.exit(1);
  }

  const allFiles = walkDir(PANDORA_DIR);

  // ── 1. .jsonl ファイルの重複処理（UUID単位でグローバル） ──────────────────
  // Map: uuid → [{ fullPath, timestamp, size }]
  const jsonlGroups = new Map();

  for (const fullPath of allFiles) {
    const filename = path.basename(fullPath);
    const m = filename.match(UUID_RE);
    if (!m) continue;

    const uuid = m[1].toLowerCase();
    const timestamp = extractTimestamp(filename);
    if (!timestamp) continue;

    let stat;
    try {
      stat = fs.statSync(fullPath);
    } catch {
      continue;
    }

    if (!jsonlGroups.has(uuid)) jsonlGroups.set(uuid, []);
    jsonlGroups.get(uuid).push({ fullPath, timestamp, size: stat.size });
  }

  let jsonlDeleteList = [];
  for (const [uuid, files] of jsonlGroups) {
    if (files.length <= 1) continue;
    // タイムスタンプ降順でソート（最新が先頭）
    files.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    const keep = files[0];
    const dupes = files.slice(1);
    jsonlDeleteList.push(...dupes);
  }

  // ── 2. sessions_*.json の重複処理（ディレクトリ単位） ────────────────────
  // Map: dirPath → [{ fullPath, timestamp, size }]
  const sessionsGroups = new Map();

  for (const fullPath of allFiles) {
    const filename = path.basename(fullPath);
    if (!SESSIONS_RE.test(filename)) continue;

    const dirPath = path.dirname(fullPath);
    const timestamp = extractTimestamp(filename);
    if (!timestamp) continue;

    let stat;
    try {
      stat = fs.statSync(fullPath);
    } catch {
      continue;
    }

    if (!sessionsGroups.has(dirPath)) sessionsGroups.set(dirPath, []);
    sessionsGroups.get(dirPath).push({ fullPath, timestamp, size: stat.size });
  }

  let sessionsDeleteList = [];
  for (const [dirPath, files] of sessionsGroups) {
    if (files.length <= 1) continue;
    files.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    const keep = files[0];
    const dupes = files.slice(1);
    sessionsDeleteList.push(...dupes);
  }

  // ── 3. 合計サイズ・件数を表示 ─────────────────────────────────────────────
  const allDeleteList = [...jsonlDeleteList, ...sessionsDeleteList];
  const totalSize = allDeleteList.reduce((sum, f) => sum + f.size, 0);

  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📊 スキャン結果`);
  console.log(`  .jsonl重複グループ数: ${[...jsonlGroups.values()].filter(g => g.length > 1).length}`);
  console.log(`  .jsonl削除予定:        ${jsonlDeleteList.length} ファイル`);
  console.log(`  sessions削除予定:      ${sessionsDeleteList.length} ファイル`);
  console.log(`  削除予定合計:          ${allDeleteList.length} ファイル`);
  console.log(`  削除予定サイズ:        ${formatBytes(totalSize)}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  if (allDeleteList.length === 0) {
    console.log('✅ 重複ファイルはありません。');
    return;
  }

  // 削除予定ファイル一覧を表示（最大20件）
  const PREVIEW_LIMIT = 20;
  console.log(`🗂️  削除予定ファイル（先頭${Math.min(PREVIEW_LIMIT, allDeleteList.length)}件）:`);
  for (const f of allDeleteList.slice(0, PREVIEW_LIMIT)) {
    console.log(`  - ${f.fullPath.replace(PANDORA_DIR, '...')} (${formatBytes(f.size)})`);
  }
  if (allDeleteList.length > PREVIEW_LIMIT) {
    console.log(`  ... 他 ${allDeleteList.length - PREVIEW_LIMIT} ファイル`);
  }
  console.log();

  // ── 4. 実削除 ─────────────────────────────────────────────────────────────
  if (DRY_RUN) {
    console.log('ℹ️  DRY-RUNモードのため削除をスキップしました。');
    console.log('   実際に削除するには --dry-run を外して実行してください。');
    return;
  }

  console.log('🗑️  削除中...');
  let deletedCount = 0;
  let deletedSize = 0;
  let errorCount = 0;

  for (const f of allDeleteList) {
    try {
      fs.unlinkSync(f.fullPath);
      deletedCount++;
      deletedSize += f.size;
    } catch (e) {
      console.error(`  ❌ 削除失敗: ${f.fullPath} — ${e.message}`);
      errorCount++;
    }
  }

  console.log(`\n✅ 削除完了`);
  console.log(`  削除済み: ${deletedCount} ファイル (${formatBytes(deletedSize)})`);
  if (errorCount > 0) {
    console.log(`  失敗:     ${errorCount} ファイル`);
  }
}

main();
