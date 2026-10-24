(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ForgeCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const DEFAULT_ORDER = ['upperA', 'lowerA', 'upperB', 'lowerB'];

  function validHistory(value) {
    return Array.isArray(value) && value.every(record =>
      record && typeof record.dayKey === 'string' &&
      typeof record.dayName === 'string' && Number.isFinite(Number(record.ts)) &&
      Array.isArray(record.exercises) && record.exercises.every(exercise =>
        exercise && typeof exercise.name === 'string' && Array.isArray(exercise.sets) &&
        exercise.sets.every(set => set && Number.isFinite(Number(set.weight)) && Number.isFinite(Number(set.reps)))
      )
    );
  }

  function recordKey(record) {
    return [record.dayKey, Number(record.ts) || 0, Number(record.finishedTs) || 0].join('|');
  }

  function mergeHistory(existing, incoming) {
    const merged = new Map();
    [...(existing || []), ...(incoming || [])].forEach(record => {
      if (!record || typeof record !== 'object') return;
      const key = recordKey(record);
      const current = merged.get(key);
      const setCount = item => (item.exercises || []).reduce((sum, ex) => sum + ((ex && ex.sets) || []).length, 0);
      if (!current || setCount(record) >= setCount(current)) merged.set(key, record);
    });
    return [...merged.values()].sort((a, b) => (Number(b.ts) || 0) - (Number(a.ts) || 0));
  }

  function findPreviousExercise(history, dayKey, exerciseId, exerciseName) {
    const sessions = [...(history || [])]
      .filter(session => session && session.dayKey === dayKey)
      .sort((a, b) => (Number(b.ts) || 0) - (Number(a.ts) || 0));
    for (const session of sessions) {
      const exercise = (session.exercises || []).find(item => {
        if (!item) return false;
        if (exerciseId && item.id) return item.id === exerciseId;
        return item.name === exerciseName;
      });
      if (exercise && Array.isArray(exercise.sets) && exercise.sets.length) {
        return { ts: session.ts, sets: exercise.sets, dayKey: session.dayKey };
      }
    }
    return null;
  }

  function nextDayKey(history, order = DEFAULT_ORDER) {
    const latest = [...(history || [])]
      .filter(record => record && order.includes(record.dayKey))
      .sort((a, b) => (Number(b.ts) || 0) - (Number(a.ts) || 0))[0];
    if (!latest) return order[0];
    return order[(order.indexOf(latest.dayKey) + 1) % order.length];
  }

  function weekCount(history, now = new Date()) {
    const start = new Date(now);
    const day = (start.getDay() + 6) % 7;
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - day);
    return (history || []).filter(record => Number(record.ts) >= start.getTime()).length;
  }

  return { DEFAULT_ORDER, validHistory, mergeHistory, findPreviousExercise, nextDayKey, weekCount };
});
