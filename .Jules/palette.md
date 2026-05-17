## 2025-02-23 - Custom Progress Bar Accessibility
**Learning:** Custom DOM-based visual bars (like the memory pressure bar) are opaque to screen readers by default. They require explicit `role="progressbar"`, `aria-label`, and `aria-valuemin`/`aria-valuemax` attributes, along with dynamic `aria-valuenow` updates to accurately communicate state.
**Action:** When implementing custom data visualizations or loading indicators, always pair visual updates (like `width: X%`) with corresponding `aria-valuenow` DOM updates.
## 2025-05-17 - Scrollable Container Accessibility
**Learning:** CSS-scrollable containers (like `overflow-x: auto` tables) are inaccessible to keyboard-only users because they cannot be focused, meaning users cannot scroll them to see hidden content.
**Action:** When implementing scrollable areas, especially tables on smaller screens, always ensure they are keyboard focusable (`tabindex="0"`) and identifiable to screen readers (`role="region"` with a descriptive `aria-label`). Adding a clear `:focus-visible` state helps users know the container has focus.
