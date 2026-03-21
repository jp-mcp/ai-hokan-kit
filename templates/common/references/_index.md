---
kind: reference
purpose: "references/ ディレクトリのインデックス。業務参照データの一覧。"
primary_for: []
read_when: [id_lookup, name_match, table_mapping]
owner: ""
updated: {{date}}
source_of_truth: false
cost: low
status: active
---

# references/ — Index

{{references_intro}}

## Files

| File | Purpose | read_when |
|------|---------|-----------|
| (add files here) | | |

## Usage

- Add reference files here when you need fast lookup of IDs, codes, or names.
- Each file should contain one domain of reference data (e.g., `users.md`, `products.md`).

## Frontmatter Template

```yaml
---
kind: reference
purpose: "What this data is for"
primary_for: [agent_name]
read_when: [id_lookup, name_match]
owner: ""
updated: YYYY-MM-DD
source_of_truth: true
cost: low
status: active
---
```
