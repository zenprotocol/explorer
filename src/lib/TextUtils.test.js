'use strict';

import test from 'tape';
import TextUtils from './TextUtils';

test('TextUtils.formatNumber()', function(t) {
  wrapTest('Given a normal number', given => {
    let number = 1000000.123456;
    let expected = '1,000,000.123456';
    let actual = TextUtils.formatNumber(number);
    t.equals(actual, expected, `${given}: should format the number`);
  }, t);

  wrapTest('Given a number without a fractional part', given => {
    let number = 1000000;
    let expected = '1,000,000';
    let actual = TextUtils.formatNumber(number);
    t.equals(actual, expected, `${given}: should format the number`);
  }, t);

  wrapTest('Given a small number', given => {
    let number = 100;
    let expected = '100';
    let actual = TextUtils.formatNumber(number);
    t.equals(actual, expected, `${given}: should not format the number`);
  }, t);

  wrapTest('Given a string', given => {
    let number = '1000000.123456';
    let expected = '1,000,000.123456';
    let actual = TextUtils.formatNumber(number);
    t.equals(actual, expected, `${given}: should format the string`);
  }, t);

  wrapTest('Given no arguments', given => {
    let expected = '0';
    let actual = TextUtils.formatNumber();
    t.equals(actual, expected, `${given}: should return 0`);
  }, t);

  wrapTest('Given a non number string', given => {
    let number = 'abcdefg.123abc';
    let expected = 'abcdefg.123abc';
    let actual = TextUtils.formatNumber(number);
    t.equals(actual, expected, `${given}: should return the string as it is`);
  }, t);

  t.end();
});

// HELPERS ---
function wrapTest(given, test) {
  test(given);
}