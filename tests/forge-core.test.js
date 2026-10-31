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

const startedAt = Date.parse('2026-10-31T18:17:00-04:00');
const finishedAt = Date.parse('2026-10-31T19:30:00-04:00');
assert.equal(core.workoutDurationMs({ ts: startedAt, elapsedMs: 24 * 60000 }, finishedAt), 73 * 60000);

const targetSession = { exercises: [
  { id: 'flat-db-bench', name: 'Flat DB Bench Press', metric: 'reps', sets: [
    { weight: 40, reps: 8 }, { weight: 45, reps: 7 }
  ] },
  { id: 'pull-up', name: 'Pull-Up Progression', metric: 'reps', bodyweight: true, sets: [
    { weight: 0, reps: 5 }, { weight: 0, reps: 4 }
  ] }
] };
assert.deepEqual(core.nextSetTarget(targetSession, 0, 0), {
  exerciseIndex: 0, setIndex: 1, exerciseId: 'flat-db-bench', exerciseName: 'Flat DB Bench Press',
  metric: 'reps', bodyweight: false, weight: 45, reps: 7
});
assert.deepEqual(core.nextSetTarget(targetSession, 0, 1), {
  exerciseIndex: 1, setIndex: 0, exerciseId: 'pull-up', exerciseName: 'Pull-Up Progression',
  metric: 'reps', bodyweight: true, weight: 0, reps: 5
});
assert.equal(core.nextSetTarget(targetSession, 1, 1), null);

const substitutionBase = [
  { key: 'upperA', name: 'Upper A', exercises: [
    { id: 'flat-db-bench', n: 'Flat DB Bench Press', sets: 3, rep: '6–10', rest: 150, sw: 40, sr: 8 },
    { id: 'one-arm-row', n: 'One-Arm DB Row', sets: 3, rep: '8–12', rest: 120, sw: 45, sr: 10 }
  ] },
  { key: 'upperB', name: 'Upper B', exercises: [
    { id: 'incline-db-press', n: 'Incline DB Press', sets: 2, rep: '10–15', rest: 90, sw: 35, sr: 10 },
    { id: 'chest-supported-row', n: 'Chest-Supported DB Row', sets: 3, rep: '8–12', rest: 120, sw: 40, sr: 10 },
    { id: 'pull-up', n: 'Pull-Up Progression', sets: 2, rep: '3–8', rest: 180, sw: 0, sr: 3, bodyweight: true }
  ] }
];
const substituted = core.applyMovementSubstitutions(substitutionBase, {
  'upperA:0': 'incline-db-press',
  'upperA:1': 'pull-up'
});
assert.equal(substituted[0].exercises[0].id, 'incline-db-press');
assert.equal(substituted[0].exercises[0].sets, 3);
assert.equal(substituted[0].exercises[0].rep, '6–10');
assert.equal(substituted[0].exercises[1].id, 'one-arm-row');
assert.equal(substitutionBase[0].exercises[0].id, 'flat-db-bench');

const coachHistory = [
  { dayKey: 'upperA', dayName: 'Upper A', ts: Date.parse('2026-10-20T12:00:00Z'), finishedTs: Date.parse('2026-10-20T13:00:00Z'), durationMs: 3000000, exercises: [
    { id: 'flat-db-bench', name: 'Flat DB Bench Press', metric: 'reps', sets: [
      { weight: 40, reps: 8 }, { weight: 40, reps: 8 }
    ] }
  ]},
  { dayKey: 'upperA', dayName: 'Upper A', ts: Date.parse('2026-10-25T12:00:00Z'), finishedTs: Date.parse('2026-10-25T13:00:00Z'), durationMs: 3300000, notes: 'Good energy; right shoulder felt stable.', exercises: [
    { id: 'flat-db-bench', name: 'Flat DB Bench Press', metric: 'reps', sets: [
      { weight: 45, reps: 8, rir: 2 }, { weight: 45, reps: 7 }
    ] }
  ]}
];
const coachProgram = [{ key: 'upperA', name: 'Upper A', exercises: [
  { id: 'flat-db-bench', n: 'Flat DB Bench Press', sets: 3, rep: '6–10', rest: 150 }
] }];
const weeklyReport = core.buildCoachReport(coachHistory, {
  mode: 'weekly', now: new Date('2026-10-31T12:00:00Z'), program: coachProgram
});
assert.equal(weeklyReport.schemaVersion, '1.0');
assert.equal(weeklyReport.reportType, 'weekly_coach_report');
assert.equal(weeklyReport.report.includedSessionCount, 1);
assert.equal(weeklyReport.report.localHistorySessionCount, 2);
assert.equal(weeklyReport.report.historyComplete, false);
assert.equal(weeklyReport.workoutSessions[0].summary.workingSets, 2);
assert.equal(weeklyReport.workoutSessions[0].summary.externalLoadVolumeLb, 675);
assert.equal(weeklyReport.workoutSessions[0].durationSeconds, 3600);
assert.equal(weeklyReport.workoutSessions[0].durationBasis, 'wall_clock_start_to_finish');
assert.equal(weeklyReport.workoutSessions[0].sessionNotes, 'Good energy; right shoulder felt stable.');
assert.equal(weeklyReport.workoutSessions[0].exercises[0].performedSets[0].rir, 2);
assert.equal(weeklyReport.workoutSessions[0].exercises[0].currentProgramReference.prescribedRestSeconds, 150);
assert.equal(weeklyReport.workoutSessions[0].exercises[0].performedSets[0].actualRestSeconds, null);
assert.equal(weeklyReport.exerciseProgression[0].currentPeriod.bestSet.weight, 45);
assert.equal(weeklyReport.exerciseProgression[0].comparisonPeriod.bestSet.weight, 40);
assert.equal(weeklyReport.weeklyMuscleGroupVolume.some(row => row.muscleGroup === 'Chest' && row.directSets === 4), true);
assert.equal(weeklyReport.weeklyMuscleGroupVolume.some(row => row.muscleGroup === 'Triceps' && row.secondarySets === 4 && row.estimatedSetEquivalents === 2), true);
assert.equal(weeklyReport.dataQuality.missingFields.some(item => item.field === 'performedSets.rir' && item.affectedRecords === 1), true);
assert.match(core.coachReportMarkdown(weeklyReport), /2026-10-25 — Upper A/);
assert.match(core.coachReportMarkdown(weeklyReport), /right shoulder felt stable/);
assert.match(core.coachReportMarkdown(weeklyReport), /RIR 2/);

const fullReport = core.buildCoachReport(coachHistory, {
  mode: 'full', now: new Date('2026-10-31T12:00:00Z'), program: coachProgram
});
assert.equal(fullReport.report.includedSessionCount, 2);
assert.equal(fullReport.report.historyComplete, true);
console.log('forge-core tests passed');
