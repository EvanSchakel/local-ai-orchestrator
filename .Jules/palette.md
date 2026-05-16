## 2025-02-23 - Custom Progress Bar Accessibility
**Learning:** Custom DOM-based visual bars (like the memory pressure bar) are opaque to screen readers by default. They require explicit `role="progressbar"`, `aria-label`, and `aria-valuemin`/`aria-valuemax` attributes, along with dynamic `aria-valuenow` updates to accurately communicate state.
**Action:** When implementing custom data visualizations or loading indicators, always pair visual updates (like `width: X%`) with corresponding `aria-valuenow` DOM updates.
## 2025-05-16 - Scrollable Container Accessibility
**Learning:** CSS-scrollable containers (like `overflow-x: auto` tables) are not accessible to keyboard users unless explicitly made focusable. Without `tabindex="0"`, users cannot scroll the table horizontally.
**Action:** When creating CSS-scrollable areas, always add `tabindex="0"` for keyboard focusability, `role="region"` for screen reader context, an accessible name (e.g. `aria-label` or `aria-labelledby`), and visible focus styling (e.g. `:focus-visible`).
