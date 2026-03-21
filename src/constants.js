'use strict';

// read_when語彙 — AIが「いつこのファイルを読むか」を宣言するための制御語
const READ_WHEN = [
  'id_lookup',       // ID・コード・番号を検索するとき
  'name_match',      // 名前・名称を照合するとき
  'person_context',  // 特定の人物に関する判断をするとき
  'external_send',   // 外部（メール・チャット等）に送信するとき
  'policy_check',    // ルール・方針を確認するとき
  'decision_review', // 過去の意思決定を参照するとき
  'failure_review',  // 失敗・トラブルを参照するとき
  'table_mapping',   // テーブル・列・フィールドのマッピングをするとき
  'recruiting',      // 採用・応募者対応をするとき
  'schedule_check',  // スケジュール・予定を確認するとき
  'ongoing_task',    // 継続中の案件・タスクを扱うとき
];

// プリセット定義
const PRESETS = {
  'openclaw-multi': {
    label: 'OpenClaw Multi-Agent',
    description: 'Multiple AI agents with shared workspace (OpenClaw architecture)',
  },
  'generic-solo': {
    label: 'Generic Solo Agent',
    description: 'Single AI agent with full knowledge workspace',
  },
  'generic-team': {
    label: 'Generic Team',
    description: 'Small team of AI agents with role separation',
  },
};

// 言語別テキスト
const LANG_TEXT = {
  ja: {
    index_intro: 'このworkspaceの情報は以下の5系統に分かれる。',
    index_rules: '`rules/` : 共通ルール。正本はここ。',
    index_references: '`references/` : 業務参照データ',
    index_knowledge: '`knowledge/` : 判断基準、教訓、過去の意思決定',
    index_failures: '`failures/` : 失敗記録と再発防止',
    index_relations: '`relations/` : 人物対応知識',
    index_order_title: '読む順序:',
    index_order_1: '1. 基本は SOUL / AGENTS / MEMORY',
    index_order_2: '2. 追加情報が必要なら INDEX からドメインを特定',
    index_order_3: '3. 次に各ディレクトリの `_index.md`',
    index_order_4: '4. 必要なleafだけ本文を読む',
    memory_intro: '長期記憶。重要な判断・教訓・パターンを記録する。',
    memory_rule: '- 記録は簡潔に（1〜3行）。詳細はleafファイルへ。',
    agents_intro: '起動時に読むファイルと役割分担を定義する。',
    rules_intro: '共通ルール群。正本はこのディレクトリ。',
    shared_rules_intro: 'チーム全体に適用される共通ルール。',
    references_intro: '業務参照データのインデックス。',
    knowledge_intro: '判断基準・教訓・過去の意思決定のインデックス。',
    failures_intro: '失敗記録と再発防止策のインデックス。',
    relations_intro: '人物・組織の対応知識のインデックス。',
    protocol_title: '## 段階的参照プロトコル',
    protocol_1: '- 基本判断は SOUL.md AGENTS.md MEMORY.md を土台に行う',
    protocol_2: '- 追加情報が必要な場合、まず INDEX.md を読み、該当ドメインを特定する',
    protocol_3: '- 次に該当ディレクトリの _index.md を読み、purpose と read_when が一致するファイルだけ本文を読む',
    protocol_4: '- 共通ルールは rules/shared_rules.md を正本とする',
    protocol_5: '- 人物対応や外部送信時は relations/ と rules/ を優先確認',
    protocol_6: '- 継続案件では knowledge/ と failures/ を確認',
  },
  en: {
    index_intro: 'This workspace information is divided into 5 domains.',
    index_rules: '`rules/` : Common rules. Source of truth.',
    index_references: '`references/` : Business reference data',
    index_knowledge: '`knowledge/` : Decision criteria, lessons learned, past decisions',
    index_failures: '`failures/` : Failure records and prevention',
    index_relations: '`relations/` : Person/organization knowledge',
    index_order_title: 'Reading order:',
    index_order_1: '1. Start with SOUL / AGENTS / MEMORY',
    index_order_2: '2. If more info needed, identify domain from INDEX',
    index_order_3: '3. Then read the `_index.md` of the relevant directory',
    index_order_4: '4. Read only the leaf files that match your need',
    memory_intro: 'Long-term memory. Record important decisions, lessons, and patterns.',
    memory_rule: '- Keep entries concise (1-3 lines). Details go in leaf files.',
    agents_intro: 'Defines files to read on startup and role assignments.',
    rules_intro: 'Common rules. This directory is the source of truth.',
    shared_rules_intro: 'Common rules applied to the entire team.',
    references_intro: 'Index of business reference data.',
    knowledge_intro: 'Index of decision criteria, lessons, and past decisions.',
    failures_intro: 'Index of failure records and prevention measures.',
    relations_intro: 'Index of person/organization knowledge.',
    protocol_title: '## Staged Reference Protocol',
    protocol_1: '- Base judgments on SOUL.md, AGENTS.md, and MEMORY.md',
    protocol_2: '- When more info is needed, first read INDEX.md to identify the domain',
    protocol_3: '- Then read the _index.md of that directory; only read leaf files whose purpose/read_when matches',
    protocol_4: '- rules/shared_rules.md is the source of truth for common rules',
    protocol_5: '- For person-related or external-send tasks, check relations/ and rules/ first',
    protocol_6: '- For ongoing tasks, check knowledge/ and failures/',
  },
};

module.exports = { READ_WHEN, PRESETS, LANG_TEXT };
