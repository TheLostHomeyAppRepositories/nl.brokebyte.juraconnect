'use strict';

/**
 * The rules of "Brew a product several times", as pure functions: no Homey, no
 * timers, no I/O. The device (drivers/jura-machine/device.js) runs the series
 * (sends cup 1, waits for the machine to be ready again, sends the next cup)
 * and asks this module two things: is the number of cups valid (cupCount), and
 * must the series stop now because of what the machine shows (seriesStop). The
 * texts that end up in the `reason` token and in the timeline live here too, so
 * the tests can pin them in one place.
 *
 * The stop rule is the series' own. It uses readiness.js for what counts as an
 * alarm (isReadinessAlarm: severity `error` and not busy or ignored, or
 * no_beans), because a series that waits for "ready" would otherwise sit on its
 * timeout when the water is empty. It does not depend on the brew guard setting.
 * Busy alerts (please_wait, heating_up, coffee_rinsing, press_rinse, ...) and
 * ignored alerts (locked_keys, program_mode_status) never stop a series.
 * The announcement that the machine is switching off does not stop a series
 * either: some machines announce and do not switch off. A switch-off stops it
 * only when the device lost the machine after the announcement (switchedOff).
 * The announcement holds the next cup through the device's ready state.
 */

const { isReadinessAlarm } = require('./readiness');

// Most cups in one series.
const MAX_CUPS = 5;

// From the accept of a cup to the next send: the slowest measured cup to ready
// is 92.5 s (E8, "2 Coffee"), so 4 minutes leaves room.
const SERIES_CUP_WAIT_MS = 240000;

// How often the device looks at the series while it waits.
const SERIES_TICK_MS = 1000;

const COUNT_TEXT = 'Choose a number of cups from 1 to 5.';
const ALREADY_TEXT =
  'A brew series is already running on this machine. Stop it first or wait until it is done.';
const STOPPING_TEXT =
  'The brew series on this machine is stopping after the cup on its way. Try again in a moment.';
const STOPPED_TEXT = 'Stopped by a flow.';
const SETTINGS_TEXT = 'The connection settings of the device changed.';
const INTERNAL_TEXT = 'The brew series stopped because of an internal error.';

/**
 * Validates the number of cups. A number that comes in as a flow token is a
 * number too; a string such as '3' is not accepted.
 * @param {*} value
 * @returns {number|null} the integer 1..MAX_CUPS, or null for anything else
 */
function cupCount(value) {
  if (typeof value !== 'number' || !Number.isInteger(value)) return null;
  return value >= 1 && value <= MAX_CUPS ? value : null;
}

/**
 * Whether a status has the two lists this module reads, both of strings.
 * @param {*} status
 * @returns {boolean}
 */
function isUsableStatus(status) {
  if (typeof status !== 'object' || status === null) return false;
  const isNames = (list) => Array.isArray(list) && list.every((name) => typeof name === 'string');
  return isNames(status.activeAlerts) && isNames(status.errors);
}

/**
 * Whether the series must stop now because of what the machine shows.
 * A switched-off machine wins over attention. The announcement that the
 * machine is switching off is not a stop.
 * @param {object} input
 * @param {boolean} input.fresh the status is fresh (the device decides what that is)
 * @param {object} input.status MachineStatus-like: { activeAlerts, errors }
 * @param {boolean} input.switchedOff the device lost the machine after it announced
 *   that it is switching off
 * @returns {null|{kind: 'switchedOff'}|{kind: 'attention', names: string[]}}
 *   null when the series may go on
 */
function seriesStop({ fresh, status, switchedOff } = {}) {
  const usable = isUsableStatus(status);
  if (switchedOff === true) return { kind: 'switchedOff' };
  if (fresh !== true || !usable) return null;
  const names = [];
  for (const name of status.activeAlerts) {
    if (!names.includes(name) && isReadinessAlarm(name, status.errors)) names.push(name);
  }
  return names.length > 0 ? { kind: 'attention', names } : null;
}

/**
 * The reason text for a stop from seriesStop.
 * @param {null|{kind: string, names?: string[]}} stop
 * @returns {string|null} null when there is no stop
 */
function stopText(stop) {
  if (!stop) return null;
  if (stop.kind === 'switchedOff') return 'The machine is switched off.';
  if (stop.kind === 'attention') {
    const names = (stop.names || []).map((name) => String(name).replace(/_/g, ' '));
    // The names stand in the parentheses, e.g. "(fill water, empty grounds)".
    return 'The machine needs attention (' + names.join(', ') + ').';
  }
  return null;
}

/**
 * @param {number} n cups in the series
 * @returns {string} the reason of a completed series
 */
function completedText(n) {
  return 'All ' + n + ' cups were accepted.';
}

/**
 * @param {number} k the cup the machine accepted
 * @returns {string} the reason when the cup never showed up in the status
 */
function notSeenText(k) {
  return 'The machine accepted cup ' + k + ', but the cup was never seen.';
}

/**
 * @param {number} k the cup after which the machine did not get ready
 * @param {string} obstacle what was last seen, already cleaned by the caller
 * @returns {string}
 */
function notReadyText(k, obstacle) {
  const seen = typeof obstacle === 'string' && obstacle !== '' ? obstacle : 'unknown';
  return (
    'The machine did not get ready again within 4 minutes after cup ' +
    k +
    ' (last seen: ' +
    seen +
    ').'
  );
}

module.exports = {
  MAX_CUPS,
  SERIES_CUP_WAIT_MS,
  SERIES_TICK_MS,
  COUNT_TEXT,
  ALREADY_TEXT,
  STOPPING_TEXT,
  STOPPED_TEXT,
  SETTINGS_TEXT,
  INTERNAL_TEXT,
  cupCount,
  seriesStop,
  stopText,
  completedText,
  notSeenText,
  notReadyText,
};
