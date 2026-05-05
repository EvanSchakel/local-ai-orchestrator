/**
 * Tests for the task classifier
 * Run: node --test tests/classifier.test.js
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { classifyTask } = require('../src/classifier');

const msg = (content) => [{ role: 'user', content }];

test('classifies code prompts', () => {
  assert.equal(classifyTask(msg('Write a Java class that implements a binary search tree')), 'code');
  assert.equal(classifyTask(msg('Debug this Python function: def foo(): return None')), 'code');
});

test('classifies math prompts', () => {
  assert.equal(classifyTask(msg('Integrate x^3 from 0 to 1 and simplify the result')), 'math');
  assert.equal(classifyTask(msg('Solve for x in the polynomial equation x^2 + 5x + 6 = 0')), 'math');
});

test('classifies science prompts', () => {
  assert.equal(classifyTask(msg('Explain the thermodynamics of an ideal gas and entropy changes')), 'science');
  assert.equal(classifyTask(msg('What is quantum entanglement and how does it relate to Coulomb forces?')), 'science');
});

test('classifies writing prompts', () => {
  assert.equal(classifyTask(msg('Write a professional email to my professor about missing class tomorrow')), 'writing');
});

test('classifies quick prompts', () => {
  assert.equal(classifyTask(msg('What is 2+2?')), 'quick');
});

test('classifies RAG prompts via large system message', () => {
  const messages = [
    { role: 'system', content: 'x'.repeat(900) },
    { role: 'user', content: 'Summarize this document' }
  ];
  assert.equal(classifyTask(messages), 'rag');
});
