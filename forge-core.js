(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ForgeCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const DEFAULT_ORDER = ['upperA', 'lowerA', 'upperB', 'lowerB'];
  const COACH_SCHEMA_VERSION = '1.0';
  const SECONDARY_SET_FACTOR = 0.5;
  const EXERCISE_MUSCLES = {
    'pull-up': { primary: ['Back'], secondary: ['Biceps'] },
    'flat-db-bench': { primary: ['Chest'], secondary: ['Shoulders', 'Triceps'] },
    'one-arm-row': { primary: ['Back'], secondary: ['Biceps'] },
    'shoulder-press': { primary: ['Shoulders'], secondary: ['Triceps'] },
    'incline-db-press': { primary: ['Chest'], secondary: ['Shoulders', 'Triceps'] },
    'lateral-raise': { primary: ['Shoulders'], secondary: [] },
    'bicep-curl': { primary: ['Biceps'], secondary: [] },
    'overhead-triceps': { primary: ['Triceps'], secondary: [] },
    'goblet-squat': { primary: ['Quadriceps'], secondary: ['Glutes', 'Core'] },
    'romanian-deadlift': { primary: ['Hamstrings', 'Glutes'], secondary: ['Back'] },
    'bulgarian-split-squat': { primary: ['Quadriceps', 'Glutes'], secondary: ['Hamstrings'] },
    'calf-raise': { primary: ['Calves'], secondary: [] },
    'hanging-leg-raise': { primary: ['Core'], secondary: [] },
    'chest-supported-row': { primary: ['Back'], secondary: ['Biceps'] },
    'arnold-press': { primary: ['Shoulders'], secondary: ['Triceps'] },
    'pullover': { primary: ['Back'], secondary: ['Chest'] },
    'hammer-curl': { primary: ['Biceps'], secondary: ['Forearms'] },
    'skull-crusher': { primary: ['Triceps'], secondary: [] },
    'hip-thrust': { primary: ['Glutes'], secondary: ['Hamstrings'] },
    'reverse-lunge': { primary: ['Quadriceps', 'Glutes'], secondary: ['Hamstrings'] },
    'single-leg-rdl': { primary: ['Hamstrings', 'Glutes'], secondary: ['Back'] },
    'plank': { primary: ['Core'], secondary: [] }
  };
  const EXERCISE_PATTERNS = {
    'pull-up': 'vertical-pull',
    'flat-db-bench': 'horizontal-push',
    'incline-db-press': 'horizontal-push',
    'one-arm-row': 'horizontal-pull',
    'chest-supported-row': 'horizontal-pull',
    'shoulder-press': 'vertical-push',
    'arnold-press': 'vertical-push',
    'lateral-raise': 'shoulder-isolation',
    'bicep-curl': 'elbow-flexion',
    'hammer-curl': 'elbow-flexion',
    'overhead-triceps': 'elbow-extension',
    'skull-crusher': 'elbow-extension',
    'goblet-squat': 'knee-dominant',
    'bulgarian-split-squat': 'knee-dominant',
    'reverse-lunge': 'knee-dominant',
    'romanian-deadlift': 'hinge',
    'single-leg-rdl': 'hinge',
    'calf-raise': 'calves',
    'hanging-leg-raise': 'core-flexion',
    'plank': 'core-stability',
    'hip-thrust': 'hip-extension',
    'pullover': 'shoulder-extension'
  };

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

  function localDateKey(value) {
    const date = value instanceof Date ? value : new Date(value);
    if (!Number.isFinite(date.getTime())) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function startOfLocalDay(value) {
    const date = value instanceof Date ? new Date(value) : new Date(value);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  function startOfWeek(value) {
    const date = startOfLocalDay(value);
    date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
    return date;
  }

  function isoOrNull(value) {
    const date = new Date(Number(value));
    return Number.isFinite(date.getTime()) ? date.toISOString() : null;
  }

  function safeId(value) {
    return String(value || 'unknown')
      .toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'unknown';
  }

  function numberOrNull(value) {
    if (value === null || value === undefined || value === '') return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function workoutDurationMs(session, finishedAt) {
    const started = numberOrNull(session && session.ts);
    const finished = numberOrNull(finishedAt);
    if (started !== null && finished !== null && finished >= started) return finished - started;
    let elapsed = numberOrNull(session && session.elapsedMs) || 0;
    const resumedAt = numberOrNull(session && session.resumedAt);
    if (resumedAt !== null && finished !== null && finished >= resumedAt) elapsed += finished - resumedAt;
    return Math.max(0, elapsed);
  }

  function nextSetTarget(session, exerciseIndex, completedSetIndex) {
    if (!session || !Array.isArray(session.exercises)) return null;
    const current = session.exercises[exerciseIndex];
    if (!current || !Array.isArray(current.sets)) return null;
    let targetExercise = current;
    let targetExerciseIndex = exerciseIndex;
    let targetSetIndex = completedSetIndex + 1;
    if (!current.sets[targetSetIndex]) {
      targetExerciseIndex += 1;
      targetExercise = session.exercises[targetExerciseIndex];
      targetSetIndex = 0;
    }
    if (!targetExercise || !Array.isArray(targetExercise.sets) || !targetExercise.sets[targetSetIndex]) return null;
    const set = targetExercise.sets[targetSetIndex];
    return {
      exerciseIndex: targetExerciseIndex,
      setIndex: targetSetIndex,
      exerciseId: targetExercise.id || null,
      exerciseName: targetExercise.name || null,
      metric: targetExercise.metric || 'reps',
      bodyweight: Boolean(targetExercise.bodyweight),
      weight: numberOrNull(set.weight),
      reps: numberOrNull(set.reps)
    };
  }

  function applyMovementSubstitutions(basePlan, overrides = {}) {
    const catalog = new Map();
    (basePlan || []).forEach(day => (day.exercises || []).forEach(exercise => {
      if (!catalog.has(exercise.id)) catalog.set(exercise.id, exercise);
    }));
    return (basePlan || []).map(day => {
      const used = new Set();
      const exercises = (day.exercises || []).map((slot, index) => {
        const replacement = catalog.get(overrides[`${day.key}:${index}`]);
        const compatible = replacement && EXERCISE_PATTERNS[replacement.id] &&
          EXERCISE_PATTERNS[replacement.id] === EXERCISE_PATTERNS[slot.id] && !used.has(replacement.id);
        const movement = compatible ? replacement : slot;
        used.add(movement.id);
        return {
          ...slot,
          id: movement.id,
          n: movement.n,
          sw: movement.sw,
          sr: movement.sr,
          bodyweight: Boolean(movement.bodyweight),
          metric: movement.metric || 'reps',
          note: movement.note || ''
        };
      });
      return { ...day, exercises };
    });
  }

  function programLookup(program) {
    const byContext = new Map();
    const byName = new Map();
    (program || []).forEach(day => (day.exercises || []).forEach(exercise => {
      const normalized = {
        exerciseId: exercise.id,
        name: exercise.n || exercise.name,
        targetSets: Number(exercise.sets) || null,
        targetRepRange: exercise.rep || null,
        prescribedRestSeconds: Number.isFinite(Number(exercise.rest)) ? Number(exercise.rest) : null,
        metric: exercise.metric || 'reps',
        bodyweight: Boolean(exercise.bodyweight),
        coachingNote: exercise.note || null,
        muscles: EXERCISE_MUSCLES[exercise.id] || { primary: [], secondary: [] }
      };
      byContext.set(`${day.key}|${exercise.id}`, normalized);
      if (normalized.name) byName.set(normalized.name, exercise.id);
    }));
    return { byContext, byName };
  }

  function exerciseIdFor(exercise, lookup, legacyIds) {
    if (exercise && typeof exercise.id === 'string' && exercise.id) return exercise.id;
    const name = exercise && exercise.name;
    return lookup.byName.get(name) || (legacyIds && legacyIds[name]) || `legacy-${safeId(name)}`;
  }

  function normalizeSet(set, index, metric) {
    const weight = numberOrNull(set && set.weight);
    const reps = numberOrNull(set && set.reps);
    return {
      setNumber: index + 1,
      setType: set && set.setType ? set.setType : 'working',
      weight,
      reps,
      metric: metric || 'reps',
      rir: numberOrNull(set && set.rir),
      actualRestSeconds: numberOrNull(set && set.restSeconds),
      notes: (set && set.notes) || null,
      discomfort: (set && set.discomfort) || null
    };
  }

  function normalizeSession(record, lookup, legacyIds) {
    const exercises = (record.exercises || []).map(exercise => {
      const exerciseId = exerciseIdFor(exercise, lookup, legacyIds);
      const programReference = lookup.byContext.get(`${record.dayKey}|${exerciseId}`) || null;
      const metric = exercise.metric || (programReference && programReference.metric) || 'reps';
      return {
        exerciseId,
        name: exercise.name,
        metric,
        bodyweight: exercise.bodyweight === undefined
          ? Boolean(programReference && programReference.bodyweight) : Boolean(exercise.bodyweight),
        performedSets: (exercise.sets || []).map((set, index) => normalizeSet(set, index, metric)),
        exerciseNotes: exercise.notes || null,
        painOrDiscomfort: exercise.discomfort || null,
        currentProgramReference: programReference
      };
    });
    const durationMs = workoutDurationMs(record, record.finishedTs);
    const foregroundDurationMs = numberOrNull(record.foregroundDurationMs);
    return {
      sessionId: record.sessionId || `${safeId(record.dayKey)}-${Number(record.ts) || 0}`,
      date: localDateKey(Number(record.ts)),
      startedAt: isoOrNull(record.ts),
      completedAt: isoOrNull(record.finishedTs),
      routineId: record.dayKey,
      routineName: record.dayName,
      durationSeconds: Math.round(durationMs / 1000),
      durationBasis: 'wall_clock_start_to_finish',
      foregroundActiveDurationSeconds: foregroundDurationMs === null ? null : Math.round(foregroundDurationMs / 1000),
      sessionNotes: record.notes || null,
      painOrDiscomfort: record.discomfort || null,
      exercises
    };
  }

  function sessionSummary(session) {
    let workingSets = 0;
    let reps = 0;
    let externalLoadVolume = 0;
    session.exercises.forEach(exercise => exercise.performedSets.forEach(set => {
      if (set.setType !== 'working') return;
      workingSets += 1;
      if (exercise.metric === 'reps' && Number.isFinite(set.reps)) reps += set.reps;
      if (exercise.metric === 'reps' && Number.isFinite(set.reps) && Number.isFinite(set.weight) && set.weight > 0) {
        externalLoadVolume += set.weight * set.reps;
      }
    }));
    return { workingSets, repetitions: reps, externalLoadVolumeLb: Math.round(externalLoadVolume * 100) / 100 };
  }

  function periodMetrics(items, startMs, endMs) {
    const inPeriod = items.filter(item => item.ts >= startMs && item.ts < endMs);
    let totalSets = 0;
    let totalReps = 0;
    let externalLoadVolumeLb = 0;
    let best = null;
    inPeriod.forEach(item => item.sets.forEach(set => {
      totalSets += 1;
      if (item.metric === 'reps') totalReps += Number(set.reps) || 0;
      const volume = item.metric === 'reps' ? (Number(set.weight) || 0) * (Number(set.reps) || 0) : 0;
      externalLoadVolumeLb += volume;
      const estimatedOneRepMaxLb = item.metric === 'reps' && Number(set.weight) > 0
        ? Number(set.weight) * (1 + (Number(set.reps) || 0) / 30) : null;
      const score = estimatedOneRepMaxLb === null ? (Number(set.reps) || 0) : estimatedOneRepMaxLb;
      if (!best || score > best.score) {
        best = { score, date: localDateKey(item.ts), weight: Number(set.weight) || 0,
          reps: Number(set.reps) || 0, estimatedOneRepMaxLb: estimatedOneRepMaxLb === null ? null : Math.round(estimatedOneRepMaxLb * 10) / 10 };
      }
    }));
    return {
      periodStart: localDateKey(startMs),
      periodEnd: localDateKey(endMs - 1),
      sessions: new Set(inPeriod.map(item => item.sessionId)).size,
      workingSets: totalSets,
      repetitions: totalReps,
      externalLoadVolumeLb: Math.round(externalLoadVolumeLb * 100) / 100,
      bestSet: best ? { date: best.date, weight: best.weight, reps: best.reps, estimatedOneRepMaxLb: best.estimatedOneRepMaxLb } : null
    };
  }

  function exerciseProgression(history, lookup, legacyIds, currentStart, currentEnd, mode) {
    const grouped = new Map();
    history.forEach(record => (record.exercises || []).forEach(exercise => {
      const exerciseId = exerciseIdFor(exercise, lookup, legacyIds);
      const key = `${record.dayKey}|${exerciseId}`;
      if (!grouped.has(key)) grouped.set(key, { exerciseId, exerciseName: exercise.name, dayKey: record.dayKey, items: [] });
      const programReference = lookup.byContext.get(`${record.dayKey}|${exerciseId}`);
      grouped.get(key).items.push({
        sessionId: record.sessionId || `${safeId(record.dayKey)}-${Number(record.ts) || 0}`,
        ts: Number(record.ts) || 0,
        metric: exercise.metric || (programReference && programReference.metric) || 'reps',
        sets: exercise.sets || []
      });
    }));
    const span = currentEnd - currentStart;
    return [...grouped.values()].map(group => {
      const sorted = group.items.sort((a, b) => a.ts - b.ts);
      const historyItems = mode === 'full' ? sorted : sorted.slice(-8);
      return {
        exerciseId: group.exerciseId,
        exerciseName: group.exerciseName,
        routineId: group.dayKey,
        currentPeriod: periodMetrics(sorted, currentStart, currentEnd),
        comparisonPeriod: periodMetrics(sorted, currentStart - span, currentStart),
        performanceHistory: historyItems.map(item => ({
          date: localDateKey(item.ts),
          sets: item.sets.map((set, index) => normalizeSet(set, index, item.metric))
        }))
      };
    }).sort((a, b) => `${a.routineId}|${a.exerciseId}`.localeCompare(`${b.routineId}|${b.exerciseId}`));
  }

  function muscleGroupVolume(history, lookup, legacyIds, earliestWeek) {
    const buckets = new Map();
    history.forEach(record => {
      const week = startOfWeek(Number(record.ts));
      if (week < earliestWeek) return;
      (record.exercises || []).forEach(exercise => {
        const exerciseId = exerciseIdFor(exercise, lookup, legacyIds);
        const muscles = EXERCISE_MUSCLES[exerciseId];
        if (!muscles) return;
        const workingSets = (exercise.sets || []).filter(set => !set.setType || set.setType === 'working').length;
        const add = (muscleGroup, type, amount) => {
          const key = `${week.getTime()}|${muscleGroup}`;
          if (!buckets.has(key)) buckets.set(key, { weekStart: localDateKey(week), muscleGroup, directSets: 0, secondarySets: 0 });
          buckets.get(key)[type] += amount;
        };
        muscles.primary.forEach(group => add(group, 'directSets', workingSets));
        muscles.secondary.forEach(group => add(group, 'secondarySets', workingSets));
      });
    });
    return [...buckets.values()].map(row => ({ ...row,
      estimatedSetEquivalents: row.directSets + row.secondarySets * SECONDARY_SET_FACTOR
    })).sort((a, b) => a.weekStart.localeCompare(b.weekStart) || a.muscleGroup.localeCompare(b.muscleGroup));
  }

  function currentProgramSnapshot(program) {
    return (program || []).map(day => ({
      routineId: day.key,
      routineName: day.name,
      exercises: (day.exercises || []).map(exercise => ({
        exerciseId: exercise.id,
        name: exercise.n || exercise.name,
        targetWorkingSets: Number(exercise.sets) || null,
        targetRepRange: exercise.rep || null,
        prescribedRestSeconds: Number.isFinite(Number(exercise.rest)) ? Number(exercise.rest) : null,
        metric: exercise.metric || 'reps',
        bodyweight: Boolean(exercise.bodyweight),
        coachingNote: exercise.note || null,
        muscles: EXERCISE_MUSCLES[exercise.id] || { primary: [], secondary: [] }
      }))
    }));
  }

  function missingDataQuality(sessions, bodyWeightHistory, recoveryObservations, unresolvedIds) {
    const sets = sessions.flatMap(session => session.exercises.flatMap(exercise => exercise.performedSets));
    const exercises = sessions.flatMap(session => session.exercises);
    const countMissing = (items, field) => items.filter(item => item[field] === null || item[field] === undefined).length;
    const missingFields = [];
    const add = (field, affectedRecords, reason) => {
      if (affectedRecords > 0) missingFields.push({ field, affectedRecords, reason });
    };
    add('bodyWeightHistory', bodyWeightHistory.length ? 0 : 1, 'Body-weight tracking is not yet available in FORGE.');
    add('performedSets.rir', countMissing(sets, 'rir'), 'RIR was not recorded for these sets.');
    add('performedSets.actualRestSeconds', countMissing(sets, 'actualRestSeconds'), 'Actual rest duration was not recorded; prescribed rest is only in the current-program snapshot.');
    add('performedSets.notes', countMissing(sets, 'notes'), 'Set notes were not recorded.');
    add('performedSets.discomfort', countMissing(sets, 'discomfort'), 'Pain or discomfort was not recorded at set level.');
    add('workoutSessions.sessionNotes', countMissing(sessions, 'sessionNotes'), 'Session notes were not recorded.');
    add('workoutSessions.durationSeconds', countMissing(sessions, 'durationSeconds'), 'Active workout duration was not available for these sessions.');
    add('workoutSessions.painOrDiscomfort', countMissing(sessions, 'painOrDiscomfort'), 'Pain or discomfort was not recorded at session level.');
    add('workoutSessions.exercises.exerciseNotes', countMissing(exercises, 'exerciseNotes'), 'Exercise notes were not recorded with the completed session.');
    add('exerciseId', unresolvedIds, 'A legacy exercise name could not be matched to a stable FORGE exercise identifier.');
    add('recoveryObservations', recoveryObservations.length ? 0 : 1, 'Recovery, sleep, soreness, and non-FORGE athletic activity are not currently logged in FORGE.');
    return {
      missingFields,
      warnings: [
        'External-load volume excludes bodyweight resistance and timed sets.',
        'Secondary muscle work is reported separately and weighted as 0.5 set equivalent; it is not counted as a full direct set.',
        'Current-program targets are a present-day reference and must not be interpreted as historical performance.',
        'Only workouts logged in FORGE are included; a date without a record does not prove that training or activity was missed.',
        'External-load volume uses the number entered in FORGE and does not infer whether a dumbbell load was per hand.'
      ]
    };
  }

  function buildCoachReport(history, options = {}) {
    const mode = options.mode === 'full' ? 'full' : 'weekly';
    const now = options.now instanceof Date ? new Date(options.now) : new Date(options.now || Date.now());
    const periodEndExclusive = startOfLocalDay(now); periodEndExclusive.setDate(periodEndExclusive.getDate() + 1);
    const periodStart = mode === 'full' && history && history.length
      ? startOfLocalDay(Math.min(...history.map(record => Number(record.ts)).filter(Number.isFinite)))
      : new Date(periodEndExclusive);
    if (mode !== 'full' || !(history && history.length)) periodStart.setDate(periodStart.getDate() - 7);
    const lookup = programLookup(options.program || []);
    const legacyIds = options.legacyIds || {};
    const sortedHistory = [...(history || [])].filter(record => record && Number.isFinite(Number(record.ts)))
      .sort((a, b) => Number(a.ts) - Number(b.ts));
    const selected = sortedHistory.filter(record => Number(record.ts) >= periodStart.getTime() && Number(record.ts) < periodEndExclusive.getTime());
    const sessions = selected.map(record => normalizeSession(record, lookup, legacyIds));
    sessions.forEach(session => { session.summary = sessionSummary(session); });
    const bodyWeightHistory = Array.isArray(options.bodyWeightHistory) ? options.bodyWeightHistory : [];
    const recoveryObservations = Array.isArray(options.recoveryObservations) ? options.recoveryObservations : [];
    const unresolvedIds = sortedHistory.reduce((count, record) => count + (record.exercises || []).filter(exercise => {
      const id = exerciseIdFor(exercise, lookup, legacyIds);
      return id.startsWith('legacy-');
    }).length, 0);
    const weeklyVolumeStart = mode === 'full' ? startOfWeek(periodStart) : startOfWeek(new Date(periodEndExclusive.getTime() - 7 * 7 * 86400000));
    const currentStart = new Date(periodEndExclusive); currentStart.setDate(currentStart.getDate() - 7);
    const athlete = options.athlete || {};
    return {
      schemaVersion: COACH_SCHEMA_VERSION,
      reportType: mode === 'full' ? 'full_history' : 'weekly_coach_report',
      generatedAt: now.toISOString(),
      source: { application: 'FORGE', storage: 'browser_localStorage' },
      units: { weight: options.weightUnit || 'lb', duration: 'seconds' },
      athlete: {
        currentBodyWeight: athlete.currentBodyWeight ?? (bodyWeightHistory.length ? bodyWeightHistory[bodyWeightHistory.length - 1].weight : null),
        goal: athlete.goal || null
      },
      report: {
        periodStart: localDateKey(periodStart),
        periodEnd: localDateKey(periodEndExclusive.getTime() - 1),
        periodKind: mode === 'full' ? 'all_local_history' : 'rolling_7_days',
        historyComplete: mode === 'full',
        historyCompleteMeaning: mode === 'full'
          ? 'All valid sessions currently stored in this browser are included; this does not establish that all real-world activity was logged.'
          : 'Only sessions in the report period are included; older local history is used for aggregates and progression context.',
        localHistorySessionCount: sortedHistory.length,
        includedSessionCount: sessions.length
      },
      currentProgram: {
        relationshipToHistory: 'Current plan snapshot only; completed sessions are listed separately in workoutSessions.',
        routines: currentProgramSnapshot(options.program || [])
      },
      bodyWeightHistory,
      workoutSessions: sessions,
      exerciseProgression: exerciseProgression(sortedHistory, lookup, legacyIds, currentStart.getTime(), periodEndExclusive.getTime(), mode),
      weeklyMuscleGroupVolume: muscleGroupVolume(sortedHistory, lookup, legacyIds, weeklyVolumeStart),
      recoveryObservations,
      dataQuality: missingDataQuality(sessions, bodyWeightHistory, recoveryObservations, unresolvedIds)
    };
  }

  function coachReportMarkdown(report) {
    const lines = [
      '# FORGE Coach Report', '',
      `- Report type: ${report.reportType}`,
      `- Period: ${report.report.periodStart} to ${report.report.periodEnd}`,
      `- Sessions included: ${report.report.includedSessionCount}`,
      `- Generated: ${report.generatedAt}`, '',
      '## Completed sessions', ''
    ];
    if (!report.workoutSessions.length) lines.push('No completed workouts were logged in this report period.', '');
    report.workoutSessions.forEach(session => {
      lines.push(`### ${session.date} — ${session.routineName}`, '',
        `${session.summary.workingSets} working sets · ${session.summary.externalLoadVolumeLb} lb external-load volume`);
      if (session.sessionNotes) lines.push('', `Session note: ${session.sessionNotes}`);
      session.exercises.forEach(exercise => {
        const sets = exercise.performedSets.map(set => {
          const performance = set.weight > 0 ? `${set.weight} lb × ${set.reps}` : `BW × ${set.reps}`;
          return set.rir === null ? performance : `${performance} (RIR ${set.rir})`;
        }).join(', ');
        lines.push(`- ${exercise.name}: ${sets}`);
      });
      lines.push('');
    });
    lines.push('## Data quality', '');
    report.dataQuality.missingFields.forEach(item => lines.push(`- Missing ${item.field}: ${item.reason}`));
    report.dataQuality.warnings.forEach(item => lines.push(`- ${item}`));
    return lines.join('\n');
  }

  return {
    DEFAULT_ORDER, COACH_SCHEMA_VERSION, EXERCISE_MUSCLES, EXERCISE_PATTERNS,
    validHistory, mergeHistory, findPreviousExercise, nextDayKey, weekCount,
    workoutDurationMs, nextSetTarget, applyMovementSubstitutions,
    buildCoachReport, coachReportMarkdown
  };
});
