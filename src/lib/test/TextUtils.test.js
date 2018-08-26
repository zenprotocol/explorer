'use strict';

import test from 'tape';
import TextUtils from '../TextUtils';

test('formatNumber - normal number', function(t) {
  let number = 1000000.123456;
  let expected = '1,000,000.123456';
  let actual = TextUtils.formatNumber(number);
  t.equals(actual, expected);
  t.end();
});

test('formatNumber - number without a fractional part', function(t) {
  let number = 1000000;
  let expected = '1,000,000';
  let actual = TextUtils.formatNumber(number);
  t.equals(actual, expected);
  t.end();
});

test('formatNumber - small number', function(t) {
  let number = 100;
  let expected = '100';
  let actual = TextUtils.formatNumber(number);
  t.equals(actual, expected);
  t.end();
});

test('formatNumber - send a string', function(t) {
  let number = '1000000.123456';
  let expected = '1,000,000.123456';
  let actual = TextUtils.formatNumber(number);
  t.equals(actual, expected);
  t.end();
});

test('formatNumber - no arguments', function(t) {
  let expected = '0';
  let actual = TextUtils.formatNumber();
  t.equals(actual, expected);
  t.end();
});

test('formatNumber - non number string', function(t) {
  let number = 'abcdefg.123abc';
  let expected = 'abcdefg.123abc';
  let actual = TextUtils.formatNumber(number);
  t.equals(actual, expected, 'non numbers are not processed and returned as they are.');
  t.end();
});