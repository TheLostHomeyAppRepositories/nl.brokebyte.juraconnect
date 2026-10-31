'use strict';

/**
 * The decision behind "Machine ready to brew", as a pure function: no Homey, no
 * timers, no I/O. The device (drivers/jura-machine/device.js) gathers the
 * facts, asks assessReadiness() at every status and poll, and decides what to
 * do with the answer; the 4 s the answer has to stay true before the trigger
 * fires is the device's, not this module's.
 *
 * `candidate` is true only when all of K1 to K6 hold at this moment:
 *
 *   K1  a client is connected
 *   K2  no brew phase is running, and no brew() is in flight (brewsRunning 0)
 *   K3  the status is fresh. The device decides what that is: the newest @TF:
 *       came after the last @TB, @TS or progress @TV:, and is younger than 10 s
 *   K4  the status shows coffee_ready. A model without that bit is never ready
 *   K5  no alarm that blocks (severity `error`, or no_beans) and no busy state
 *   K6  the machine is not switched off, and the tile is not unavailable. The
 *       device passes `this._available === false`: `_available` is null until
 *       the first poll, and that "unknown" must not block
 *
 * Any input that is missing or of the wrong type counts as not ready, with an
 * obstacle that says which field: the answer must never be "ready" by accident.
 *
 * Alert severities are not looked up here: the status comes from
 * MachineStatus.parse, which has already sorted the active alerts by the
 * severity the machine's own profile gives them (`errors`). So this module needs
 * no profile and works for every bundled model, also on the fallback table.
 */

const READY_ALERT = 'coffee_ready';

// A machine without beans cannot make a coffee, but 66 of the 72 bundled
// profiles give no_beans severity `info`, so `errors` alone would not catch it.
const NO_BEANS_ALERT = 'no_beans';

// The machine is doing something or is not usable yet: it is not ready,
// whatever severity a profile gives the alert (please_wait and
// switch_off_delay_active are `error` in all 72 profiles, heating_up in six).
// These are reported as `busy:` and never as `alarm:`. Not every name is in
// every profile: heating_up is not in EF561, system_emptying, goodbye and
// press_rinse are not in EF555, EF1012 and EF561. An absent name is simply
// never active.
const BUSY_ALERTS = Object.freeze([
  'heating_up',
  'coffee_rinsing',
  'system_filling',
  'system_emptying',
  'enjoy_product',
  'welcome',
  'goodbye',
  'press_rinse',
  'locked_keys',
  'please_wait',
  'switch_off_delay_active',
]);
const BUSY_SET = new Set(BUSY_ALERTS);

/**
 * @param {string} name an alert name
 * @returns {boolean} true for a busy state (see BUSY_ALERTS)
 */
function isBusyAlert(name) {
  return BUSY_SET.has(name);
}

/**
 * Whether an active alert is a readiness alarm, one that blocks the ready state
 * as an alarm: it has severity `error` in the profile, or it is no_beans. A busy
 * state is never an alarm here, it has its own obstacle. This is the rule for
 * the "ready to brew" trigger only; the brew guard that comes later
 * (brewBlockers) has its own rule for what stops a brew.
 * @param {string} name an alert name
 * @param {string[]} errors the names MachineStatus.parse gave severity `error`;
 *   a missing or non-array value counts as empty
 * @returns {boolean}
 */
function isReadinessAlarm(name, errors) {
  if (BUSY_SET.has(name)) return false;
  return name === NO_BEANS_ALERT || (Array.isArray(errors) && errors.includes(name));
}

/** Whether a status has the two lists this module reads, both of strings. */
function hasAlertLists(status) {
  const isNames = (list) => Array.isArray(list) && list.every((name) => typeof name === 'string');
  return typeof status === 'object' && isNames(status.activeAlerts) && isNames(status.errors);
}

/**
 * Pushes `obstacle` when input[field] is the failing boolean `bad`, and
 * `invalid input: <field>` when it is no boolean at all.
 */
function checkFlag(obstacles, input, field, bad, obstacle) {
  const value = input[field];
  if (typeof value !== 'boolean') obstacles.push(`invalid input: ${field}`);
  else if (value === bad) obstacles.push(obstacle);
}

/**
 * Whether the machine is a candidate for "ready to brew" right now.
 * @param {{
 *   connected: boolean,
 *   inBrewPhase: boolean,
 *   brewsRunning: number,
 *   statusIsFresh: boolean,
 *   status: {activeAlerts: string[], errors: string[]},
 *   switchedOff: boolean,
 *   tileUnavailable: boolean
 * }} input every field is required, `status` is a MachineStatus.parse result
 * @returns {{candidate: boolean, reason: string, obstacles: string[]}}
 *   obstacles: every failing condition once, in the order K1 to K6: `not
 *   connected`, `brew phase`, `brew running`, `stale status`, `no status`,
 *   `no coffee_ready`, then `alarm: <name>` and `busy: <name>` mixed, in the
 *   order of the status (K4 and K5 together), then `switched off` and `tile
 *   unavailable`. `invalid input: <field>` stands at the place of the field
 *   that is missing or of the wrong type.
 *   reason: the obstacles joined by ", ", one line for the log. The caller adds
 *   "Machine not ready: " in front. It is only meaningful when `candidate` is
 *   false; for true it is 'all conditions met'.
 * @example
 * assessReadiness({ connected: true, inBrewPhase: false, brewsRunning: 0,
 *   statusIsFresh: true, status, switchedOff: false, tileUnavailable: false });
 * // status shows coffee_ready and fill_water:
 * // { candidate: false, reason: 'alarm: fill_water', obstacles: ['alarm: fill_water'] }
 */
function assessReadiness(input) {
  const i = input !== null && typeof input === 'object' ? input : {};
  const obstacles = [];

  // K1
  checkFlag(obstacles, i, 'connected', false, 'not connected');
  // K2
  checkFlag(obstacles, i, 'inBrewPhase', true, 'brew phase');
  if (!Number.isInteger(i.brewsRunning) || i.brewsRunning < 0) obstacles.push('invalid input: brewsRunning');
  else if (i.brewsRunning > 0) obstacles.push('brew running');
  // K3
  checkFlag(obstacles, i, 'statusIsFresh', false, 'stale status');
  // K4 and K5
  const status = i.status;
  if (status === null || status === undefined) {
    obstacles.push('no status');
  } else if (!hasAlertLists(status)) {
    obstacles.push('invalid input: status');
  } else {
    if (!status.activeAlerts.includes(READY_ALERT)) obstacles.push(`no ${READY_ALERT}`);
    for (const name of status.activeAlerts) {
      if (isBusyAlert(name)) obstacles.push(`busy: ${name}`);
      else if (isReadinessAlarm(name, status.errors)) obstacles.push(`alarm: ${name}`);
    }
  }
  // K6
  checkFlag(obstacles, i, 'switchedOff', true, 'switched off');
  checkFlag(obstacles, i, 'tileUnavailable', true, 'tile unavailable');

  const unique = [...new Set(obstacles)];
  return {
    candidate: unique.length === 0,
    reason: unique.length === 0 ? 'all conditions met' : unique.join(', '),
    obstacles: unique,
  };
}

module.exports = { READY_ALERT, NO_BEANS_ALERT, BUSY_ALERTS, isBusyAlert, isReadinessAlarm, assessReadiness };
