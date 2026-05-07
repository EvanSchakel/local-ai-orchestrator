/**
 * Task Classifier
 * Determines the task type of a prompt using keyword rules.
 * Types: code | math | science | writing | quick | rag
 */

const CODE_PATTERNS = [
  /\b(function|class|def |const |let |var |import |require|async|await|return|for loop|debug|error|exception|compile|runtime|java|python|javascript|typescript|bash|shell|git|npm|node)\b/i,
  /```[\w]*/,
  /\.(js|ts|py|java|cpp|sh|json|yaml|yml)\b/i
];

const MATH_PATTERNS = [
  /\b(integral|derivative|calculus|equation|matrix|vector|eigenvalue|limit|proof|theorem|algebra|trigonometry|differentiate|integrate|solve for|dx|dy|\bsin\b|\bcos\b|\btan\b|logarithm|polynomial)\b/i,
  /[=+\-*/^].*[=+\-*/^]/  // expression-like
];

const SCIENCE_PATTERNS = [
  /\b(physics|chemistry|biology|kinematics|force|acceleration|velocity|momentum|energy|quantum|orbital|molecule|reaction|entropy|thermodynamics|electromagnetism|optics|newton|coulomb|faraday)\b/i
];

const WRITING_PATTERNS = [
  /\b(write|draft|essay|email|summarize|explain|describe|paragraph|letter|report|outline|blog|story|narrative|creative|professional|formal)\b/i
];

/**
 * @param {Array<{role: string, content: string}>} messages
 * @returns {'code'|'math'|'science'|'writing'|'quick'|'rag'}
 */
function classifyTask(messages) {
  const userContent = messages
    .filter(m => m.role === 'user')
    .map(m => m.content)
    .join(' ');

  // Very short prompts → quick
  // Optimized word count avoiding Array allocation overhead
  let wordCount = 0;
  const wordRegex = /\S+/g;
  while (wordRegex.exec(userContent) !== null) {
    if (++wordCount >= 12) break;
  }
  if (wordCount < 12) return 'quick';

  // Check for RAG context injection (AnythingLLM adds large system prompts)
  const systemContent = messages.find(m => m.role === 'system')?.content || '';
  if (systemContent.length > 800) return 'rag';

  // Pattern matching in priority order
  if (CODE_PATTERNS.some(p => p.test(userContent))) return 'code';
  if (MATH_PATTERNS.some(p => p.test(userContent))) return 'math';
  if (SCIENCE_PATTERNS.some(p => p.test(userContent))) return 'science';
  if (WRITING_PATTERNS.some(p => p.test(userContent))) return 'writing';

  return 'quick';
}

module.exports = { classifyTask };
