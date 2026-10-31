'use strict';

/**
 * Which products the "Brew a product" card (app.js) offers for a machine
 * profile, as a pure function: no Homey, no I/O. Only the choice of what is
 * shown is made here; brewing a product, active or not, is what lib/profile.js
 * and the client already do (resolveProduct finds a product by name whether it
 * is active or not, and nothing in the brew path looks at `active`).
 *
 * The card offers every active product of the profile. For a few profiles it
 * also offers some products the XML marks inactive, listed by product code in
 * EXTRA_PRODUCT_CODES. The list is explicit and short on purpose: an inactive
 * product is one the machine's own menu does not show, so it is offered per
 * profile, for a reason, and never for a profile or a product that is not in
 * the table.
 */

// Inactive products that are offered anyway, by profile code, as product codes.
// EF1031 (Jura E4): its "2x Espresso" (0x31) and "2x Coffee" (0x36) are marked
// inactive in the XML, but a user of that machine asked for them in the card
// (community.homey.app/t/158080, 2026-09-27). The 2x Espresso recipe is the
// same as the "2 Espressi" of the E8 (EF538), which has it active. Other
// profiles either have their double products active already or keep inactive
// ones hidden on purpose: this list is for the E4 only.
const EXTRA_PRODUCT_CODES = Object.freeze({
  EF1031: Object.freeze([0x31, 0x36]),
});

/**
 * The products the card offers for a profile: its active products, plus the
 * inactive ones EXTRA_PRODUCT_CODES lists for that profile. The order is that
 * of profile.products, and the products are the profile's own objects. Whether
 * a product can be built without overrides is not decided here (app.js does
 * that next).
 * @param {{code: string, products: object[]}} profile
 * @returns {object[]}
 */
function offeredProducts(profile) {
  const extra = Object.prototype.hasOwnProperty.call(EXTRA_PRODUCT_CODES, profile.code)
    ? EXTRA_PRODUCT_CODES[profile.code]
    : [];
  return profile.products.filter((p) => p.active !== false || extra.includes(p.code));
}

module.exports = {
  EXTRA_PRODUCT_CODES,
  offeredProducts,
};
