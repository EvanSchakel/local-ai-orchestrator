/**
 * Tests for the task classifier
 * Run: node --test tests/classifier.test.js
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { classifyTask } = require('../src/classifier');

const msg = (content) => [{ role: 'user', content }];

test('classifies code prompts', () => {
  assert.equal(classifyTask(msg('Write a Java class that implements a binary search tree data structure entirely from scratch')), 'code');
  assert.equal(classifyTask(msg('Please help me debug this Python function because it throws an exception: def foo(): return None')), 'code');
});

test('classifies math prompts', () => {
  assert.equal(classifyTask(msg('Can you please integrate x^3 from 0 to 1 and then carefully simplify the result')), 'math');
  assert.equal(classifyTask(msg('Please carefully solve for x in the polynomial equation x^2 + 5x + 6 = 0')), 'math');
});

test('classifies science prompts', () => {
  assert.equal(classifyTask(msg('Could you please thoughtfully explain the thermodynamics of an ideal gas and the related entropy changes')), 'science');
  assert.equal(classifyTask(msg('What exactly is quantum entanglement and how does it relate to theoretical Coulomb forces in physics?')), 'science');
});

test('classifies writing prompts', () => {
  assert.equal(classifyTask(msg('Please write a highly professional email to my professor about missing the important lecture meeting tomorrow')), 'writing');
});

test('classifies quick prompts', () => {
  assert.equal(classifyTask(msg('What is 2+2?')), 'quick');
});

test('classifies RAG prompts via large system message', () => {
  const messages = [
    { role: 'system', content: 'x'.repeat(900) },
    { role: 'user', content: 'Can you please summarize this document using the provided context because it is very important' }
  ];
  assert.equal(classifyTask(messages), 'rag');
});

test('handles edge cases without crashing', () => {
  assert.equal(classifyTask([]), 'quick', 'Empty messages array should default to quick');
  assert.equal(classifyTask([{ role: 'system', content: 'hello' }]), 'quick', 'No user message should default to quick');
  assert.equal(classifyTask([{ role: 'user' }]), 'quick', 'Missing content should default to quick');
  assert.equal(classifyTask([{ role: 'user', content: '' }]), 'quick', 'Empty content should default to quick');
  assert.equal(classifyTask([{ role: 'user', content: '   ' }]), 'quick', 'Whitespace content should default to quick');
});
