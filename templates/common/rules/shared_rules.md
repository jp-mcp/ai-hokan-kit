---
kind: rule
purpose: "チーム全体に適用される共通ルール。正本。"
primary_for: []
read_when: [policy_check, external_send, decision_review]
owner: ""
updated: {{date}}
source_of_truth: true
cost: low
status: active
---

# Shared Rules — {{project_name}}

{{shared_rules_intro}}

---

## Core Rules

1. **Source of truth**: When rules conflict, this file wins. Update here first.
2. **External communication**: Always check this file before sending to external parties.
3. **Destructive actions**: Require explicit confirmation. Never auto-execute.
4. **Secrets**: Never hardcode credentials, API keys, or personal data in files.
5. **Memory hygiene**: Keep MEMORY.md under 100 lines. Archive to `knowledge/` when needed.

---

## Communication Rules

- Be concise. Long explanations go in leaf files, not in direct responses.
- When uncertain, ask rather than assume.

---

## Add Your Rules Below

<!-- Team-specific rules go here -->
