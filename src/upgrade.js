/**
 * upgrade.js - 既存OpenClawワークスペースにAI補完計画の段階的参照構造を追加
 * 
 * やること:
 * 1. INDEX.md を作成（なければ）
 * 2. rules/, references/, knowledge/, failures/, relations/ ディレクトリ作成
 * 3. 各_index.md を作成
 * 4. rules/shared_rules.md を作成（既存shared_rules.mdがあれば取り込み）
 * 5. 既存の.mdファイルにfrontmatter候補を提案
 * 6. SOUL.mdに段階的参照プロトコルを追記
 * 7. パンドラスクリプトをscripts/にコピー
 */
const fs = require('fs');
const path = require('path');

const PROTOCOL_TEXT = `
## 段階的参照プロトコル
- 基本判断は \`SOUL.md\` \`AGENTS.md\` \`MEMORY.md\` を土台に行う
- 追加情報が必要な場合、まず \`INDEX.md\` を読み、該当ドメインを特定する
- 次に該当ディレクトリの \`_index.md\` を読み、\`purpose\` と \`read_when\` が一致するファイルだけ本文を読む
- 共通ルールは \`rules/shared_rules.md\` を正本とし、他ファイルに複製された内容より優先する
- 人物対応や外部送信が関わる場合は \`relations/\` と \`rules/\` を優先確認する
- 継続案件では \`knowledge/\` と \`failures/\` を確認し、過去判断や再発防止を踏まえる
`;

const INDEX_CONTENT = `# INDEX

このworkspaceの情報は以下の5系統に分かれる。

- \`rules/\` : 共通ルール。正本はここ。
- \`references/\` : 業務参照データ（ID対応、列定義、マスタ等）
- \`knowledge/\` : 判断基準、教訓、過去の意思決定
- \`failures/\` : 失敗記録と再発防止
- \`relations/\` : 人物対応知識、注意点、温度感

読む順序:
1. 基本は SOUL / AGENTS / MEMORY
2. 追加情報が必要なら INDEX からドメインを特定
3. 次に各ディレクトリの \`_index.md\`
4. 必要なleafだけ本文を読む
`;

const DIRS = ['rules', 'references', 'knowledge', 'failures', 'relations'];

const INDEX_TEMPLATES = {
  rules: '# rules/_index\n\n- `shared_rules.md` | 共通ルールの正本 | read_when: policy_check, external_send | owner: (you) | cost: low\n',
  references: '# references/_index\n\n(参照データファイルをここに追加していく)\n',
  knowledge: '# knowledge/_index\n\n(判断・教訓ファイルをここに追加していく)\n',
  failures: '# failures/_index\n\n(失敗記録ファイルをここに追加していく)\n',
  relations: '# relations/_index\n\n(人物対応ファイルをここに追加していく)\n',
};

const SHARED_RULES_TEMPLATE = `---
kind: rule
purpose: "共通ルール"
primary_for: [all]
read_when: [policy_check, external_send]
owner: (you)
updated: ${new Date().toISOString().slice(0,10)}
source_of_truth: true
cost: low
status: active
---

# 共通ルール

## 最優先原則
- 利益優先
- 機密保持
- 事実確認優先（嘘・推測禁止）

## 報告ルール
- 実施済み / 失敗・保留 / 確認待ち / 次にやること を分けて書く

## 外部送信前チェック
- 人物確認
- 宛先確認
- ルール確認
`;

function upgrade(workspaceDir) {
  console.log(`\n🔄 AI補完計画 アップグレード`);
  console.log(`   対象: ${workspaceDir}\n`);
  
  let created = 0;
  let skipped = 0;
  
  // 1. INDEX.md
  const indexPath = path.join(workspaceDir, 'INDEX.md');
  if (!fs.existsSync(indexPath)) {
    fs.writeFileSync(indexPath, INDEX_CONTENT, 'utf8');
    console.log('  ✅ INDEX.md 作成');
    created++;
  } else {
    console.log('  ⏭️  INDEX.md 既にあり');
    skipped++;
  }
  
  // 2. ディレクトリ + _index.md
  for (const dir of DIRS) {
    const dirPath = path.join(workspaceDir, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`  ✅ ${dir}/ 作成`);
      created++;
    }
    
    const indexFile = path.join(dirPath, '_index.md');
    if (!fs.existsSync(indexFile)) {
      fs.writeFileSync(indexFile, INDEX_TEMPLATES[dir], 'utf8');
      console.log(`  ✅ ${dir}/_index.md 作成`);
      created++;
    } else {
      console.log(`  ⏭️  ${dir}/_index.md 既にあり`);
      skipped++;
    }
  }
  
  // 3. shared_rules.md
  const rulesPath = path.join(workspaceDir, 'rules', 'shared_rules.md');
  if (!fs.existsSync(rulesPath)) {
    // 既存のshared_rules.mdを探す
    const candidates = [
      path.join(workspaceDir, '..', 'agents', 'shared_rules.md'),
      path.join(workspaceDir, 'shared_rules.md'),
    ];
    let existingContent = null;
    for (const c of candidates) {
      if (fs.existsSync(c)) {
        existingContent = fs.readFileSync(c, 'utf8');
        console.log(`  📋 既存shared_rules.md発見: ${c}`);
        break;
      }
    }
    
    if (existingContent) {
      const frontmatter = `---\nkind: rule\npurpose: "共通ルール"\nprimary_for: [all]\nread_when: [policy_check, external_send]\nowner: (you)\nupdated: ${new Date().toISOString().slice(0,10)}\nsource_of_truth: true\ncost: low\nstatus: active\n---\n\n`;
      const content = existingContent.startsWith('---') ? existingContent : frontmatter + existingContent;
      fs.writeFileSync(rulesPath, content, 'utf8');
      console.log('  ✅ rules/shared_rules.md 作成（既存内容を取り込み）');
    } else {
      fs.writeFileSync(rulesPath, SHARED_RULES_TEMPLATE, 'utf8');
      console.log('  ✅ rules/shared_rules.md 作成（テンプレート）');
    }
    created++;
  } else {
    console.log('  ⏭️  rules/shared_rules.md 既にあり');
    skipped++;
  }
  
  // 4. SOUL.mdに段階的参照プロトコル追記
  const soulPath = path.join(workspaceDir, 'SOUL.md');
  if (fs.existsSync(soulPath)) {
    const content = fs.readFileSync(soulPath, 'utf8');
    if (!content.includes('段階的参照プロトコル')) {
      fs.appendFileSync(soulPath, PROTOCOL_TEXT, 'utf8');
      console.log('  ✅ SOUL.md に段階的参照プロトコル追記');
      created++;
    } else {
      console.log('  ⏭️  SOUL.md 既にプロトコルあり');
      skipped++;
    }
  } else {
    console.log('  ⚠️  SOUL.md が見つかりません');
  }
  
  // 5. パンドラスクリプトコピー
  const scriptsDir = path.join(workspaceDir, 'scripts');
  if (!fs.existsSync(scriptsDir)) fs.mkdirSync(scriptsDir, { recursive: true });
  
  const pandoraScripts = ['pandora_archive_v2.js', 'cleanup_pandora_dupes.js'];
  const kitScriptsDir = path.join(__dirname, '..', 'scripts');
  for (const script of pandoraScripts) {
    const src = path.join(kitScriptsDir, script);
    const dst = path.join(scriptsDir, script);
    if (fs.existsSync(src) && !fs.existsSync(dst)) {
      fs.copyFileSync(src, dst);
      console.log(`  ✅ scripts/${script} コピー`);
      created++;
    } else if (fs.existsSync(dst)) {
      console.log(`  ⏭️  scripts/${script} 既にあり`);
      skipped++;
    }
  }
  
  console.log(`\n📊 結果: ${created}件作成 / ${skipped}件スキップ`);
  console.log('\n次のステップ:');
  console.log('  1. rules/shared_rules.md を自分のルールに編集');
  console.log('  2. 既存の.mdファイルにfrontmatterを追加');
  console.log('  3. _index.md にファイル一覧を追記');
  console.log('  4. パンドラスクリプトをタスクスケジューラに登録');
}

// CLI
const targetDir = process.argv[2] || process.cwd();
if (!fs.existsSync(targetDir)) {
  console.error(`ディレクトリが見つかりません: ${targetDir}`);
  process.exit(1);
}
upgrade(targetDir);
