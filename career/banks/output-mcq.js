'use strict';
/**
 * Multiple-choice versions of the code-tracing and calculation questions.
 *
 * Assessments are MCQ-only: typed answers and staff-reviewed submissions do
 * not scale to a large audience. Each former typed ("output") question keeps
 * its prompt, code, difficulty and explanation, and gets four options: the
 * correct answer plus three distractors, each a specific mistake a learner
 * makes (off-by-one, wrong operator precedence, copying instead of aliasing,
 * integer vs float division, and so on). Every correct answer below was
 * checked by running the code or doing the arithmetic.
 *
 *   id: [correct, wrong1, wrong2, wrong3]
 */
module.exports = {
  // ---------------- common ----------------
  'cs-pf-01': ['3', '3.5', '4', '1'],
  'cs-pf-02': ['6', '5', '7', 'Lahore'],
  'cs-pf-04': ['8', '16', '3', '5'],
  'cs-pf-05': ['30', '13', '3', 'An error: b has no value'],
  'cs-pf-08': ['24', '10', '6', '4'],
  'cs-pf-09': ['4', '3', 'An error: x was not changed', '[1, 2, 3, 4]'],
  'cs-lg-02': ['42', '40', '36', '44'],
  'cs-lg-04': ['3', '4', '10', '9'],
  'cs-lg-06': ['4', '5', '3', '10'],
  'cs-lg-07': ['1850', '1800', '1855', '1950'],
  'cs-cf-03': ['256', '255', '128', '8'],
  'cs-cf-04': ['11', '13', '1011', '7'],
  'cs-ds-04': ['2', '1', '3', 'The queue is empty'],
  'cs-ds-05': ['7', '3', '6', '5'],
  'cs-cf-p1': ['1101', '1011', '1110', '1001'],
  'cs-gt-p1': ['git checkout -b feature', 'git branch feature', 'git checkout feature', 'git merge feature'],
  'cs-lg-p2': ['9', '8', '10', '6'],
  'cs-cf-p2': ['240', '30', '1920', '75'],
  // ---------------- frontend ----------------
  'fe-js-01': ['number', 'integer', '42', 'string'],
  'fe-js-02': ['12', '3', 'NaN', 'A TypeError'],
  'fe-js-04': ['20,40', '10,30', '10,20,30,40', '2,4'],
  'fe-js-05': ['3', '1', '0', '2'],
  'fe-js-p2': ['Multan 21', 'Multan undefined', 'undefined 21', 'Hina 21'],
  // ---------------- backend ----------------
  'be-pg-01': ['10', '7', '5', 'An error: h is missing'],
  'be-pg-03': ['Ali', 'Ali,Sara', 'Sara', '20'],
  'be-pg-05': ['70', '100', '30', 'ValueError: insufficient'],
  'be-er-02': ['11', '12', '-1', 'ValueError'],
  'be-pg-p2': ['700', '1000', '500', '300'],
  // ---------------- aiml ----------------
  'ml-py-01': ['[0, 1, 4, 9]', '[1, 4, 9, 16]', '[0, 1, 2, 3]', '[0, 2, 4, 6]'],
  'ml-py-02': ['sara', '92', 'omar', 'ali'],
  'ml-py-04': ['2', 'b', "('b', 2)", '1'],
  'ml-ms-01': ['5', '4', '20', '6'],
  'ml-ms-02': ['5', '7', '1', '3'],
  'ml-ms-04': ['32', '[4, 10, 18]', '21', '15'],
  'ml-np-01': ['(3, 4)', '(4, 3)', '12', '[3, 4]'],
  'ml-np-02': ['[2 4 6]', '[1, 2, 3, 1, 2, 3]', '[1 2 3 1 2 3]', '12'],
  'ml-np-05': ['20.0', '40', '10.0', '30.0'],
  'ml-ev-03': ['0.8', '0.67', '0.2', '0.57'],
  'ml-ms-p1': ['4', '4.57', '2', '5'],
  'ml-ev-p1': ['0.62', '0.65', '0.40', '0.50'],
  'ml-py-p2': ['3 95', '4 95', '3 88', '2 95'],
  'ml-ms-p2': ['0.4', '0.6', '0.67', '0.5'],
  // ---------------- mobile ----------------
  'mo-fw-01': ['Hello, Ali!', 'Hello, $name!', 'Hello, name!', 'Hello, "Ali"!'],
  // ---------------- genai ----------------
  'ga-em-p1': ['0.71', '1.00', '0.50', '1.41'],
  // ---------------- analyst ----------------
  'da-st-01': ['4', '7', '4.8', '3'],
  'da-st-p1': ['25', '20', '125', '80'],
  'da-bz-p1': ['100', '200', '50', '2'],
  'da-st-p2': ['15', '20', '40', '16'],
  'da-bz-p2': ['2.5', '25', '0.25', '40'],
  // ---------------- dataeng ----------------
  'de-sq-p2': ['300', '150', '100', '200'],
  // ---------------- cyber ----------------
  'sc-lx-p1': ['chmod 600 secret.txt', 'chmod 644 secret.txt', 'chmod 700 secret.txt', 'chmod 006 secret.txt'],
  'sc-lg-p1': ['3', '4', '2', '5'],
  'sc-nw-p2': ['SSH', 'HTTP', 'FTP', 'DNS'],
  'sc-lx-p2': ['tail -n 20 /var/log/auth.log', 'head -n 20 /var/log/auth.log', 'cat -20 /var/log/auth.log', 'tail -f /var/log/auth.log'],
  'sc-lg-p2': ['10.0.0.9', '10.0.0.4', '10.0.0.7', 'None of them'],
  // ---------------- devops ----------------
  'op-lx-p1': ['df -h', 'du -h', 'free -h', 'ls -lh /'],
  'op-lx-p2': ['journalctl -u nginx -f', 'systemctl status nginx', 'tail -f /etc/nginx/nginx.conf', 'journalctl --list-boots'],
  'op-nw-p2': ['14', '16', '28', '30'],
  // ---------------- se ----------------
  'se-oo-02': ['Woof', '...', 'None', 'An error: sound is defined twice'],
  'se-ar-01': ['40', '10', '30', 'An IndexError'],
  'se-ar-02': ['gram', 'gramm', 'ogra', 'ramm'],
  'se-al-p1': ['8', '5', '13', '120'],
  'se-oo-p2': ['9', '0', '3', '12'],
  'se-ar-p2': ['True 2', 'False 2', 'True 3', 'True 1'],
  'se-sq-p2': ['[1, 2, 4]', '[1, 2, 3, 4]', '[2, 3, 4]', '[4, 1, 2]'],
  'se-tg-p2': ['20 30 40 50 70', '50 30 20 40 70', '20 40 30 70 50', '50 30 70 20 40'],
};
