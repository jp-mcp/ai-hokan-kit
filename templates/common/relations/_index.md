---
kind: relation
purpose: "relations/ ディレクトリのインデックス。人物・組織の対応知識の一覧。"
primary_for: []
read_when: [person_context, external_send, recruiting]
owner: ""
updated: {{date}}
source_of_truth: false
cost: low
status: active
---

# relations/ — Index

{{relations_intro}}

## Files

| File | Purpose | read_when |
|------|---------|-----------|
| (add files here) | | |

## Usage

- Add relation files when a person or organization has context that affects how you respond.
- Always check here before sending external communications.
- Anonymize or pseudonymize where possible.

## Frontmatter Template

```yaml
---
kind: relation
purpose: "Who/what this file describes and why it matters"
primary_for: []
read_when: [person_context, external_send]
owner: ""
updated: YYYY-MM-DD
source_of_truth: false
cost: low
status: active
---
```
