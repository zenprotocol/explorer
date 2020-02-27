'use strict';

import test from 'tape';
import TextUtils from './TextUtils';
import { getTimezoneDisplay } from './TextUtils';

test('TextUtils.formatNumber()', function(t) {
  wrapTest(
    'Given a normal number',
    given => {
      let number = 1000000.123456;
      let expected = '1,000,000.123456';
      let actual = TextUtils.formatNumber(number);
      t.equals(actual, expected, `${given}: should format the number`);
    },
    t
  );

  wrapTest(
    'Given a number without a fractional part',
    given => {
      let number = 1000000;
      let expected = '1,000,000';
      let actual = TextUtils.formatNumber(number);
      t.equals(actual, expected, `${given}: should format the number`);
    },
    t
  );

  wrapTest(
    'Given a small number',
    given => {
      let number = 100;
      let expected = '100';
      let actual = TextUtils.formatNumber(number);
      t.equals(actual, expected, `${given}: should not format the number`);
    },
    t
  );

  wrapTest(
    'Given a string',
    given => {
      let number = '1000000.123456';
      let expected = '1,000,000.123456';
      let actual = TextUtils.formatNumber(number);
      t.equals(actual, expected, `${given}: should format the string`);
    },
    t
  );

  wrapTest(
    'Given no arguments',
    given => {
      let expected = '0';
      let actual = TextUtils.formatNumber();
      t.equals(actual, expected, `${given}: should return 0`);
    },
    t
  );

  wrapTest(
    'Given a non number string',
    given => {
      let number = 'abcdefg.123abc';
      let expected = 'abcdefg.123abc';
      let actual = TextUtils.formatNumber(number);
      t.equals(actual, expected, `${given}: should return the string as it is`);
    },
    t
  );

  wrapTest(
    'Given a very long fractional part',
    given => {
      let number = '10.123456789123456789';
      let expected = '10.12345678';
      let actual = TextUtils.formatNumber(number);
      t.equals(actual, expected, `${given}: should trim the end of the fractional number`);
    },
    t
  );

  t.end();
});

test('TextUtils.getOrdinal()', function(t) {
  const getTest = ({ number, expected } = {}) =>
    wrapTest(
      `Given ${number}`,
      given => {
        let actual = TextUtils.getOrdinal(number);
        t.equals(actual, expected, `${given}: should return ${expected}`);
      },
      t
    );

  getTest({ number: 1, expected: '1st' });
  getTest({ number: 2, expected: '2nd' });
  getTest({ number: 3, expected: '3rd' });
  getTest({ number: 4, expected: '4th' });
  getTest({ number: 5, expected: '5th' });
  getTest({ number: 6, expected: '6th' });
  getTest({ number: 7, expected: '7th' });
  getTest({ number: 8, expected: '8th' });
  getTest({ number: 9, expected: '9th' });
  getTest({ number: 10, expected: '10th' });
  getTest({ number: 11, expected: '11th' });
  getTest({ number: 22, expected: '22nd' });
  getTest({ number: 1122, expected: '1,122nd' });

  t.end();
});

test('TextUtils.getTimezoneDisplay()', function(t) {
  wrapTest(
    'Given offset = 0',
    given => {
      let expected = '(UTC)';
      let actual = getTimezoneDisplay(0);
      t.equals(actual, expected, `${given}: should return UTC without time`);
    },
    t
  );

  wrapTest(
    'Given positive round offset',
    given => {
      let expected = '(UTC-2)';
      let actual = getTimezoneDisplay(120);
      t.equals(actual, expected, `${given}: should return a negative timezone`);
    },
    t
  );

  wrapTest(
    'Given positive offset with minutes',
    given => {
      let expected = '(UTC-2:30)';
      let actual = getTimezoneDisplay(150);
      t.equals(
        actual,
        expected,
        `${given}: should return a negative timezone with the minutes leftover`
      );
    },
    t
  );

  wrapTest(
    'Given negative round offset',
    given => {
      let expected = '(UTC+2)';
      let actual = getTimezoneDisplay(-120);
      t.equals(actual, expected, `${given}: should return a positive timezone`);
    },
    t
  );

  wrapTest(
    'Given negative offset with minutes',
    given => {
      let expected = '(UTC+5:45)';
      let actual = getTimezoneDisplay(-345);
      t.equals(
        actual,
        expected,
        `${given}: should return a positive timezone with the minutes leftover`
      );
    },
    t
  );

  t.end();
});

// HELPERS ---
function wrapTest(given, test) {
  test(given);
}
