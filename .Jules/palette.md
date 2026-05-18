## 2025-02-23 - Custom Progress Bar Accessibility
**Learning:** Custom DOM-based visual bars (like the memory pressure bar) are opaque to screen readers by default. They require explicit `role="progressbar"`, `aria-label`, and `aria-valuemin`/`aria-valuemax` attributes, along with dynamic `aria-valuenow` updates to accurately communicate state.
**Action:** When implementing custom data visualizations or loading indicators, always pair visual updates (like `width: X%`) with corresponding `aria-valuenow` DOM updates.
## 2026-05-18 - Accessible Scrollable Areas
**Learning:** Horizontally scrolling areas like data tables with `overflow-x: auto` are inaccessible to keyboard and screen reader users unless explicitly made focusable.
**Action:** Always add `tabindex="0"`, a descriptive `role="region"`, and an `aria-labelledby` linking to the section's heading for scrollable containers. Ensure visual focus rings are provided via `:focus-visible`.
