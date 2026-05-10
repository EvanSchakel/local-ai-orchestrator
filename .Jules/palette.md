## 2025-02-23 - Custom Progress Bar Accessibility
**Learning:** Custom DOM-based visual bars (like the memory pressure bar) are opaque to screen readers by default. They require explicit `role="progressbar"`, `aria-label`, and `aria-valuemin`/`aria-valuemax` attributes, along with dynamic `aria-valuenow` updates to accurately communicate state.
**Action:** When implementing custom data visualizations or loading indicators, always pair visual updates (like `width: X%`) with corresponding `aria-valuenow` DOM updates.
## 2024-05-10 - Keyboard accessibility for scrollable and custom regions
**Learning:** Custom UI components like `div`-based progress bars and CSS-scrollable elements (like tables with `overflow-x: auto`) are not keyboard accessible by default, meaning screen-reader and keyboard-only users cannot interact with or navigate past them easily.
**Action:** Always add `tabindex="0"` to custom interactive elements and scrollable containers. Ensure proper roles (e.g. `role="progressbar"`, `role="region"`) and labels (`aria-labelledby`) are provided, and provide a clear `:focus-visible` outline for visual feedback.
