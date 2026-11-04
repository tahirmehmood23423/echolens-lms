'use strict';
/**
 * Plain punctuation for student-facing question text: no " - " or dash
 * asides. id: [[from, to], ...], applied to the prompt, explanation and
 * option texts. Maths minus signs (revenue - cost, target - x) are kept.
 */
module.exports = {
  'cs-ds-06': [['O(n) - proportional to n', 'O(n), proportional to n'], ['O(1) - the same time for any n', 'O(1), the same time for any n'], ['O(log n) - halves the work each step', 'O(log n), halves the work each step'], ['O(n^2) - grows with the square of n', 'O(n^2), grows with the square of n']],
  'be-er-05': [['Always - whether the try block succeeds, raises, or returns', 'Always, whether the try block succeeds, raises or returns']],
  'sc-pr-s2': [['No - never log secrets or passwords; log request IDs and redacted fields instead', 'No. Never log secrets or passwords; log request IDs and redacted fields']],
  'qa-br-p1': [['"Bug in checkout - see attached screenshot for details"', '"Bug in checkout, see the attached screenshot for details"']],
  'qa-rg-p1': [['A step that runs the tests, for example - run: npm test', 'A step that runs the tests, such as run: npm test']],
  'cs-pf-03': [['0, 1, 2, 3, 4 - five values.', '0, 1, 2, 3, 4, which is five values.']],
  'cs-pf-09': [['does not copy the list - both names refer', 'does not copy the list: both names refer']],
  'cs-lg-06': [['while the condition holds - four iterations - and then becomes 0.', 'while the condition holds (four iterations) and then becomes 0.']],
  'cs-gt-01': [['the whole repository - files and history - into a new local folder.', 'the whole repository, files and history, into a new local folder.']],
  'cs-gt-06': [['match .gitignore patterns - useful for build output', 'match .gitignore patterns, which is useful for build output']],
  'cs-lg-p2': [['2, 1 - nine steps to reach 1.', '2, 1: nine steps to reach 1.']],
  'fe-ts-p1': [['do not overlap - a cast never converts a value anyway.', 'do not overlap. A cast never converts a value anyway.']],
  'fe-ap-s1': [['at each step - loading, failed or empty - instead of staring', 'at each step (loading, failed or empty) instead of staring']],
  'be-pg-03': [['aged 18 or over - only Ali - and join produces', 'aged 18 or over (only Ali), and join produces']],
  'be-ts-04': [['work together - here the API', 'work together: here the API']],
  'ml-np-p1': [['the value given - here the column\'s median - and the result', 'the value given (here the column\'s median), and the result']],
  'mo-ui-01': [['Everything on screen in Flutter - text, padding, layouts, buttons - is a widget', 'Everything on screen in Flutter (text, padding, layouts, buttons) is a widget']],
  'ga-rg-02': [['Chunks that are focused - often with some overlap - retrieve', 'Focused chunks, often with some overlap, retrieve']],
  'da-vz-s1': [['often data problems - missing loads or a partial period.', 'often data problems, such as missing loads or a partial period.']],
  'de-md-s1': [['Choosing the grain first - the level one row represents - decides', 'Choosing the grain first (the level one row represents) decides']],
  'de-cl-p1': [['limits the data read - and in many warehouses, the cost - to the matching partitions.', 'limits the data read, and in many warehouses the cost, to the matching partitions.']],
  'sc-lg-p1': [['come from 10.0.0.9 - and the last line', 'come from 10.0.0.9, and the last line']],
  'op-lx-s1': [['scheduled work - backups, cron jobs, log rotation - so correlate', 'scheduled work (backups, cron jobs, log rotation), so correlate']],
  'qa-td-s1': [['and the extra feature - not repeats of one case.', 'and the extra feature, not repeats of one case.']],
  'qa-br-s1': [['cannot reproduce it reliably - it happens about one time in ten.', 'cannot reproduce it reliably: it happens about one time in ten.']],
  'se-cx-p1': [['inside a loop - quadratic.', 'inside a loop, which is quadratic.']],
  'se-sq-p2': [['push 4 - leaving [1, 2, 4].', 'push 4, leaving [1, 2, 4].']],
};
