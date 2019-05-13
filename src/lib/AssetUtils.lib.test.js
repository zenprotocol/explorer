'use strict';

import test from 'tape';
import AssetUtils from './AssetUtils';

test('AssetUtils.removeLeadingAndTrailingZeros()', function(t) {
  wrapTest('Given no leading or trailing zeros', given => {
    const asset = 'dfdsf';
    const actual = AssetUtils.removeLeadingAndTrailingZeros(asset);
    t.equal(actual, asset, `${given}: should return the same string`);
  }, t);

  wrapTest('Given a string with length < 6', given => {
    const asset = '00d00';
    const actual = AssetUtils.removeLeadingAndTrailingZeros(asset);
    t.equal(actual, asset, `${given}: should return the same string`);
  }, t);

  wrapTest('Given a long string with leading zeros', given => {
    const asset = '000ddddddddddddddddddddddd';
    const actual = AssetUtils.removeLeadingAndTrailingZeros(asset);
    const expected = 'ddddddddddddddddddddddd';
    t.equal(actual, expected, `${given}: should remove the leading zeros`);
  }, t);

  wrapTest('Given a long string with trailing zeros', given => {
    const asset = 'ddddddddddddddddddddddd000';
    const actual = AssetUtils.removeLeadingAndTrailingZeros(asset);
    const expected = 'ddddddddddddddddddddddd';
    t.equal(actual, expected, `${given}: should remove the trailing zeros`);
  }, t);

  wrapTest('Given a long string with leading and trailing zeros', given => {
    const asset = '000ddddddddddddddddddddddd000';
    const actual = AssetUtils.removeLeadingAndTrailingZeros(asset);
    const expected = 'ddddddddddddddddddddddd';
    t.equal(actual, expected, `${given}: should remove the leading and trailing zeros`);
  }, t);

  t.end();
});

// HELPERS ---
function wrapTest(given, test) {
  test(given);
}