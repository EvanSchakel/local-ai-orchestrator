## 2025-02-23 - Custom Progress Bar Accessibility
**Learning:** Custom DOM-based visual bars (like the memory pressure bar) are opaque to screen readers by default. They require explicit `role="progressbar"`, `aria-label`, and `aria-valuemin`/`aria-valuemax` attributes, along with dynamic `aria-valuenow` updates to accurately communicate state.
**Action:** When implementing custom data visualizations or loading indicators, always pair visual updates (like `width: X%`) with corresponding `aria-valuenow` DOM updates.

## 2025-05-09 - CSS-Scrollable Area Accessibility
**Learning:** Areas that are scrollable via CSS (like `overflow-x: auto` on tables) are not automatically keyboard accessible or announced by screen readers as distinct regions.
**Action:** Always add `tabindex="0"`, `role="region"`, and a descriptive `aria-labelledby` or `aria-label` to custom scrollable containers, and ensure a clear `:focus-visible` indicator is present.