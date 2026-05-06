## 2025-03-05 - Missing Loading/Empty States in Dynamic Tables
**Learning:** Tables that fetch their content asynchronously can appear completely blank to the user for brief (or long) periods, creating a confusing experience where the system looks broken or incomplete. Leaving empty states unhandled (blank tables) fails to communicate system status.
**Action:** Always provide an explicit HTML skeleton with a loading state (e.g., `<td colspan="X">Loading...</td>`) and handle empty arrays from APIs by rendering a clear empty state message (e.g., "No data available yet").
