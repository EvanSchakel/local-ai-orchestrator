## 2025-02-23 - Custom Progress Bar Accessibility
**Learning:** Custom DOM-based visual bars (like the memory pressure bar) are opaque to screen readers by default. They require explicit `role="progressbar"`, `aria-label`, and `aria-valuemin`/`aria-valuemax` attributes, along with dynamic `aria-valuenow` updates to accurately communicate state.
**Action:** When implementing custom data visualizations or loading indicators, always pair visual updates (like `width: X%`) with corresponding `aria-valuenow` DOM updates.
## 2025-02-23 - Scrollable Tables Accessibility
**Learning:** CSS-scrollable areas (`overflow-x: auto`), such as tables that might overflow horizontally on smaller screens, are completely inaccessible to keyboard users unless they are explicitly made focusable. Screen readers also need context for what the region contains.
**Action:** When creating a scrollable container (`overflow: auto` or `overflow: scroll`), always add `tabindex="0"`, `role="region"`, and a descriptive `aria-label` to ensure the content can be reached and scrolled via keyboard. Additionally, provide a clear visual indicator via `:focus-visible`.
