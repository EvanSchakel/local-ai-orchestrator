## 2024-05-14 - Keyboard Access for Scrollable Areas
**Learning:** CSS-scrollable areas (like `.table-container` with `overflow-x: auto`) require explicit role (`role="region"`) and keyboard navigation support (`tabindex="0"`, `:focus-visible`) to be properly accessed and navigated by keyboard and screen reader users in this application.
**Action:** Always verify scrollable containers have explicit ARIA labels, roles, and focus indicators.
