const assert = require('node:assert/strict');
const core = require('../forge-core.js');

const history = [
  { dayKey: 'upperA', dayName: 'Upper A', ts: 100, finishedTs: 110, exercises: [
    { id: 'incline-db-press', name: 'Incline DB Press', sets: [{ weight: 25, reps: 10 }] }
  ]},
  { dayKey: 'upperB', dayName: 'Upper B', ts: 200, finishedTs: 210, exercises: [
    { id: 'incline-db-press', name: 'Incline DB Press', sets: [{ weight: 35, reps: 8 }] }
  ]}
];

assert.equal(core.findPreviousExercise(history, 'upperA', 'incline-db-press', 'Incline DB Press').sets[0].weight, 25);
assert.equal(core.findPreviousExercise(history, 'upperB', 'incline-db-press', 'Incline DB Press').sets[0].weight, 35);
assert.equal(core.nextDayKey(history), 'lowerB');
assert.equal(core.mergeHistory(history, [history[0]]).length, 2);
assert.equal(core.validHistory(history), true);
assert.equal(core.validHistory([{ dayKey: 'x', dayName: 'X', ts: 1, exercises: [{ name: 'Bad' }] }]), false);
console.log('forge-core tests passed');
