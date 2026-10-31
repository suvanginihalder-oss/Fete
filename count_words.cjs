const fs = require('fs');
const text = fs.readFileSync('DEPLOYMENT_AND_GENAI_SUBMISSION.txt', 'utf8');

const q1Start = text.indexOf('QUESTION 1:');
const q2Start = text.indexOf('QUESTION 2:');
const q1Text = text.slice(q1Start, q2Start);
const q2Text = text.slice(q2Start);

function countWords(t) {
  return t.trim().split(/\s+/).length;
}

console.log('Q1 words:', countWords(q1Text));
console.log('Q2 words:', countWords(q2Text));
console.log('Total words:', countWords(text));

