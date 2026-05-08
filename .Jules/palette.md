## 2024-05-08 - Dashboard Accessibility Enhancements
**Learning:** Custom visual elements (like progress bars built with `div`s) and CSS-scrollable areas (like tables with `overflow-x: auto`) require explicit ARIA attributes (`role="progressbar"`, `aria-valuenow`) and keyboard navigation support (`tabindex="0"`, focus indicators) to be accessible to screen readers and keyboard users.
**Action:** When creating custom visual components or scrollable areas, always ensure they have appropriate ARIA semantics and focus states.
