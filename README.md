# AI補完計画 / AI Hokan Kit

**AIエージェントの記憶を構造化する段階的参照アーキテクチャ**

> 毎回リセットされるAIに、「何を覚えて、何を読んで、何を学ぶか」の構造を与える。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## これは何？

AIエージェントのワークスペースに**段階的参照構造**を追加するツールキット。

```
INDEX.md（入口）
  ↓ 何のドメインか特定
_index.md（一覧）
  ↓ frontmatterのread_whenで必要なファイルだけ選ぶ
本文ファイル（必要な時だけ読む）
```

**効果：** AIが全ファイルを毎回読まなくても、必要な情報だけ引っ張れる。トークン節約 + 精度向上。

---

## クイックスタート

### 新規ワークスペース作成
```bash
git clone https://github.com/jp-mcp/ai-hokan-kit.git
cd ai-hokan-kit
node bin/ai-hokan-kit.js init --preset generic-solo --lang ja --yes
```

### 既存OpenClawワークスペースにアップグレード
```bash
git clone https://github.com/jp-mcp/ai-hokan-kit.git
node ai-hokan-kit/src/upgrade.js /path/to/your/.openclaw/workspace
```

**これだけで以下が自動作成されます：**
- `INDEX.md` — 全体の入口
- `rules/` `references/` `knowledge/` `failures/` `relations/` — 5つのドメイン
- 各ディレクトリの `_index.md` — 1ファイル1行の一覧
- `rules/shared_rules.md` — 共通ルールの正本
- `SOUL.md` に段階的参照プロトコル追記
- パンドラスクリプト（思考ログの差分アーカイブ + 重複掃除）

---

## 構造

```
workspace/
├── INDEX.md           ← 全体の入口
├── SOUL.md            ← AIの人格・行動ルール
├── AGENTS.md          ← 運用ルール
├── MEMORY.md          ← 長期記憶
├── rules/
│   ├── _index.md      ← ルール一覧
│   └── shared_rules.md ← 共通ルール正本
├── references/
│   ├── _index.md      ← 参照データ一覧
│   └── *.md           ← ID対応表、列定義等
├── knowledge/
│   ├── _index.md      ← 判断・教訓一覧
│   └── *.md           ← 方針、取引先ルール等
├── failures/
│   ├── _index.md      ← 失敗記録一覧
│   └── *.md           ← 各失敗の詳細
├── relations/
│   ├── _index.md      ← 人物対応一覧
│   └── *.md           ← 各人物のメモ
└── scripts/
    ├── pandora_archive_v2.js  ← 思考ログ差分保存
    └── cleanup_pandora_dupes.js ← 重複掃除
```

---

## frontmatter標準

全ファイルの先頭にYAML frontmatterを付ける：

```yaml
---
kind: reference | knowledge | rule | failure | relation
purpose: "1行で用途を説明"
primary_for: [agent1, agent2]
read_when: [id_lookup, person_context]
owner: your_name
updated: 2026-03-21
source_of_truth: true
cost: low | medium | high
status: active | draft | archived
---
```

### read_when語彙（固定）
| 語彙 | いつ読むか |
|---|---|
| `id_lookup` | ID・UIDを調べる時 |
| `name_match` | 名前で検索する時 |
| `person_context` | 人物への対応を考える時 |
| `external_send` | 外部に送信する前 |
| `policy_check` | ルール・方針を確認する時 |
| `decision_review` | 過去の判断を振り返る時 |
| `failure_review` | 失敗事例を確認する時 |
| `table_mapping` | データ構造を確認する時 |
| `recruiting` | 採用関連 |
| `schedule_check` | スケジュール確認 |
| `ongoing_task` | 継続中のタスクに関わる時 |

---

## SOUL.mdに追記されるプロトコル

```markdown
## 段階的参照プロトコル
- 基本判断は SOUL.md AGENTS.md MEMORY.md を土台に行う
- 追加情報が必要な場合、まず INDEX.md を読み、該当ドメインを特定する
- 次に該当ディレクトリの _index.md を読み、read_when が一致するファイルだけ本文を読む
- 共通ルールは rules/shared_rules.md を正本とする
- 人物対応や外部送信時は relations/ と rules/ を優先確認
- 継続案件では knowledge/ と failures/ を確認
```

---

## プリセット

| プリセット | 用途 |
|---|---|
| `generic-solo` | 1体のAIアシスタント |
| `generic-team` | 複数AIのチーム |
| `openclaw-multi` | OpenClawマルチエージェント |

---

## パンドラスクリプト

AIの思考ログを差分保存するスクリプト（タスクスケジューラで10分ごと実行推奨）：

```bash
# 思考ログの差分アーカイブ
node scripts/pandora_archive_v2.js

# 重複ファイルの掃除（dry-runで確認してから実行）
node scripts/cleanup_pandora_dupes.js --dry-run
node scripts/cleanup_pandora_dupes.js
```

---

## 背景

このプロジェクトは、実際に8体のAIエージェントを24日間運用した経験から生まれました。

**問題：** 5層の記憶構造を設計したが、実際に機能していたのは1.5層だけだった
**原因：** 「記憶は保存量より読取率」— 貯めるだけではゴミの山
**解決：** 段階的参照構造 — 必要な時に必要なものだけ読む

---

## ライセンス

MIT License
