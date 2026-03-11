---
name: check-use-state
description: Check that no frontend component uses more than 2 useState hooks. Reports violations with file paths, counts, and line numbers.
---

Check that no frontend component uses more than 2 `useState` hooks. A component with too many local state variables is a sign it should be refactored (custom hook, context, or state manager).

## Steps

1. Use the Grep tool to find all `useState(` occurrences across `apps/web/src/**/*.tsx` files, with output mode `content` and line numbers enabled, so you can see each match with its file path and line number.

2. Group the results by file. For each file, count the number of lines that contain `useState(` — ignore import lines (lines containing `import`).

3. Report the results in two sections:

### Violations (> 2 useState)
List every file that has **more than 2** `useState` calls. For each file show:
- The relative file path (from repo root)
- The count
- The line numbers of each `useState` call

### Summary
"X files checked, Y violations found." If there are no violations, congratulate the user.
