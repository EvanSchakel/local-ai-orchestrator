## 2024-05-24 - Avoid string `.split()` for simple counting in large strings
**Learning:** Using `string.split(/\s+/).length` is extremely memory-inefficient and slow for very large strings (e.g., prompt context injection/RAG), as it allocates a new array of words in memory just to count them.
**Action:** When you only need to check if a word count crosses a small threshold or just need a raw count without keeping the words, use an iterative regex match loop (`/\S+/g.exec(string)`) with an early break to completely avoid allocating unnecessary arrays.
