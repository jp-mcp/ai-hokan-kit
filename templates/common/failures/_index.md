---
kind: failure
purpose: "failures/ ディレクトリのインデックス。失敗記録と再発防止策の一覧。"
primary_for: []
read_when: [failure_review, ongoing_task, decision_review]
owner: ""
updated: {{date}}
source_of_truth: false
cost: low
status: active
---

# failures/ — Index

{{failures_intro}}

## Files

| File | Purpose | read_when |
|------|---------|-----------|
| (add files here) | | |

## Usage

- Record failures here to prevent repetition. Include root cause and prevention.
- Each file = one failure category or one notable incident.

## Frontmatter Template

```yaml
---
kind: failure
purpose: "What failure pattern this documents"
primary_for: []
read_when: [failure_review]
owner: ""
updated: YYYY-MM-DD
source_of_truth: false
cost: medium
status: active
---
```

## Failure Entry Format

```markdown
## [FAIL-001] Title

- **Date**: YYYY-MM-DD
- **Root cause**: ...
- **Impact**: ...
- **Fix**: ...
- **Prevention**: ...
```
