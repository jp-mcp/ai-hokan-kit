---
kind: rule
purpose: "rules/ ディレクトリのインデックス。どのルールファイルをいつ読むかを示す。"
primary_for: []
read_when: [policy_check, external_send, person_context]
owner: ""
updated: {{date}}
source_of_truth: true
cost: low
status: active
---

# rules/ — Index

{{rules_intro}}

## Files

| File | Purpose | read_when |
|------|---------|-----------|
| `shared_rules.md` | Common rules for all agents | policy_check, external_send |

## Usage

- Always read `shared_rules.md` before external sends or policy-sensitive actions.
- Add new rule files here when a domain-specific rule set grows beyond 5 items.
