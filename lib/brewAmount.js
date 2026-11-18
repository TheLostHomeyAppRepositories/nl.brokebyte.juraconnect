'use strict';

/**
 * The optional "ml" argument of the brew cards, as pure functions: no Homey, no
 * timers, no I/O. app.js asks waterAmount() what to put in the overrides of a
 * brew. The amount is checked against the water_amount param of the product
 * that is selected now, with profileLib.encodeParam (the same rules as the brew
 * and the settings check), and it is never rounded: an off-step value is
 * refused. The texts live here so the tests can pin them in one place.
 */

const profileLib = require('./profile');

/**
 * The name shown in a sentence for a product.
 * @param {object} product
 * @returns {string}
 */
function productLabel(product) {
  const raw = typeof product.rawName === 'string' ? product.rawName.trim() : '';
  return raw || product.name;
}

/**
 * The sentence for an amount outside the range or step of a water_amount param.
 * Same wording as the settings check in drivers/jura-machine/device.js.
 * @param {string} name product name as shown to the person
 * @param {object} param the water_amount param
 * @returns {string}
 */
function rangeText(name, param) {
  const min = param.min == null ? 0 : param.min;
  const max = param.max == null ? 0xff : param.max;
  const steps = param.step && param.step > 1 ? `, in steps of ${param.step}` : '';
  return `The amount for ${name} must be between ${min} and ${max} ml${steps}, for this machine.`;
}

/**
 * The sentence for a product whose amount cannot be set in a flow.
 * @param {string} name product name as shown to the person
 * @returns {string}
 */
function bypassText(name) {
  return `The amount of ${name} cannot be set in a flow yet. Leave the amount empty.`;
}

/**
 * Validates the ml argument of a brew card for the product selected now.
 * @param {object} profile machine profile
 * @param {string} productName product.name in the profile
 * @param {*} value the ml argument
 * @returns {number|null} the amount to send as water_amount, or null when there
 *   is nothing to add (not given, unknown product, or a product without a
 *   water_amount param, where the value is ignored)
 * @throws {Error} with the BYPASS or RANGE sentence
 */
function waterAmount(profile, productName, value) {
  if (value === undefined || value === null || value === '' || value === 0) return null;
  const product = profile.products.find((p) => p.name === productName);
  if (!product) return null;
  const param = product.params.find((p) => p.kind === 'water_amount');
  if (!param) return null;
  const name = productLabel(product);
  const bypass = product.params.find((p) => p.kind === 'bypass');
  if (bypass && bypass.default !== 0) throw new Error(bypassText(name));
  if (!Number.isInteger(value)) throw new Error(rangeText(name, param));
  try {
    profileLib.encodeParam(param, value);
  } catch {
    throw new Error(rangeText(name, param));
  }
  return value;
}

module.exports = { waterAmount, rangeText, bypassText };
