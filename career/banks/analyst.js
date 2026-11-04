'use strict';
/** Data Analyst & Business Intelligence track. */
const { mc, out, written, submission } = require('../q');

module.exports = [
  // ---- Spreadsheets ----
  mc('da-sp-01', 'da.spreadsheets', 1, 'In Excel or Google Sheets, what does =SUM(B2:B10) do?', ['Adds the values in cells B2 to B10', 'Counts the cells B2 to B10', 'Multiplies B2 by B10', 'Finds the largest value'], 0,
    'SUM adds every number in the range.'),
  mc('da-sp-02', 'da.spreadsheets', 2, 'Why write $B$1 instead of B1 in a formula you will copy down a column?', ['The $ signs make an absolute reference, so the formula keeps pointing at B1 when copied', 'It formats the cell as currency', 'It makes the formula run faster', 'It hides the cell'], 0,
    'Relative references shift when copied; absolute references stay fixed.'),
  mc('da-sp-p1', 'da.spreadsheets', 2, 'Sheet A has student IDs in column A. Sheet "Fees" has IDs in column A and fee status in column C. Which formula in B2 brings the fee status for the ID in A2?',
    ['=XLOOKUP(A2, Fees!A:A, Fees!C:C, "Not found")', '=SUM(Fees!C:C)', '=A2+Fees!C2', '=COUNT(Fees!A:A)'], 0,
    'XLOOKUP (or VLOOKUP with exact match) finds the matching ID and returns the value from the chosen column, with a fallback when missing.', { practical: true }),
  mc('da-sp-s1', 'da.spreadsheets', 2, 'A manager wants total sales by city and by month from 20,000 rows, updated every week. What is the best spreadsheet tool?',
    ['A pivot table built on the data range (or table), refreshed when new rows are added', 'Typing totals by hand each week', 'A chart without totals', 'Sorting the rows alphabetically'], 0,
    'Pivot tables summarise large data by any combination of fields and refresh when the source changes.', { type: 'scenario' }),

  // ---- SQL for analysis ----
  mc('da-sq-01', 'da.sql', 1, 'Which clause filters rows BEFORE grouping?', ['WHERE', 'HAVING', 'ORDER BY', 'LIMIT'], 0,
    'WHERE filters individual rows; HAVING filters groups after GROUP BY.'),
  mc('da-sq-02', 'da.sql', 2, 'Which query lists cities with more than 100 students?', ['SELECT city, COUNT(*) FROM students GROUP BY city HAVING COUNT(*) > 100;', 'SELECT city FROM students WHERE COUNT(*) > 100;', 'SELECT city, COUNT(*) FROM students HAVING city > 100;', 'SELECT * FROM students LIMIT 100;'], 0,
    'Aggregates cannot appear in WHERE; conditions on group counts go in HAVING.'),
  mc('da-sq-p1', 'da.sql', 2, 'This query should return total revenue per month for 2026, but it fails. What is the fix?',
    ['Add GROUP BY month', 'Replace SUM with COUNT', 'Remove the WHERE clause', 'Add ORDER BY amount'], 0,
    'When a query mixes a plain column (month) with an aggregate (SUM), the plain column must be in GROUP BY.',
    { type: 'debug', code: "SELECT EXTRACT(MONTH FROM paid_at) AS month, SUM(amount)\nFROM payments\nWHERE paid_at >= '2026-01-01' AND paid_at < '2027-01-01';" }),
  mc('da-sq-s1', 'da.sql', 3, 'Revenue in your report is double the finance team\'s figure. The query joins payments to enrollments. What is the most likely cause?',
    ['The join multiplies rows (a payment matches several enrollments), so amounts are summed more than once', 'SQL adds numbers incorrectly', 'Finance used a calculator', 'The database is slow'], 0,
    'Joining to a table with several matching rows duplicates each payment. Aggregate before joining or join on the correct, unique key.', { type: 'scenario' }),

  // ---- Data cleaning ----
  mc('da-cl-01', 'da.cleaning', 1, 'A "city" column contains "Lahore", "lahore " and "LAHORE". What cleaning step is needed?', ['Standardise the text: trim spaces and use consistent case', 'Delete the column', 'Convert it to numbers', 'Sort it'], 0,
    'Inconsistent spelling splits one category into many; trimming and normalising case merges them.'),
  mc('da-cl-02', 'da.cleaning', 2, 'Why should you not simply delete every row that has any missing value?', ['You may throw away a large, non-random share of the data and bias the results', 'Deleting rows is impossible', 'Missing values are always zero', 'It makes files larger'], 0,
    'Dropping rows can remove whole groups of customers. Understand why data is missing, then impute, flag or drop deliberately.'),
  mc('da-cl-p1', 'da.cleaning', 2, 'A sales file has some orders recorded twice with the same order_id. Which pandas line removes the duplicates while keeping one row per order?',
    ['df = df.drop_duplicates(subset="order_id")', 'df = df.dropna()', 'df = df.sort_values("order_id")', 'df = df[df.order_id > 0]'], 0,
    'drop_duplicates with subset keeps the first row for each order_id.', { practical: true }),
  mc('da-cl-s1', 'da.cleaning', 3, 'A dataset shows a student age of 230. What should you do?',
    ['Investigate the source; treat it as an error (likely a typo), correct it if possible or set it missing, and document the decision', 'Keep it - data is data', 'Change every age to the average', 'Delete the whole dataset'], 0,
    'Impossible values are errors; fix or exclude them transparently rather than silently.', { type: 'scenario' }),

  // ---- Descriptive statistics ----
  out('da-st-01', 'da.stats', 1, 'What is the median of 4, 1, 7, 3, 9?', null, ['4'], 'Sorted: 1, 3, 4, 7, 9. The middle value is 4.'),
  mc('da-st-02', 'da.stats', 2, 'House prices in a district include a few mansions. Which value best describes a typical house?', ['The median price', 'The mean price', 'The maximum price', 'The sum of prices'], 0,
    'The median is not pulled up by a few extreme values, so it better represents a typical house.'),
  out('da-st-p1', 'da.stats', 2, 'Monthly sales were Rs 80,000 last month and Rs 100,000 this month. What is the percentage increase? (Number only.)', null, ['25', '25%', '25.0'],
    '(100,000 - 80,000) / 80,000 = 0.25, a 25% increase. Percentage change is always relative to the starting value.', { category: 'practical' }),
  mc('da-st-s1', 'da.stats', 3, 'Cities with more ice-cream sales also have more drowning incidents. A colleague concludes ice cream causes drowning. What do you say?',
    ['Correlation is not causation; hot weather likely drives both', 'Ban ice cream', 'The data must be wrong', 'Drowning causes ice-cream sales'], 0,
    'A third factor (temperature) can make two things move together without one causing the other.', { type: 'scenario' }),

  // ---- Visualization and dashboards ----
  mc('da-vz-01', 'da.visualization', 1, 'Which chart best shows how monthly enrolments changed over a year?', ['A line chart', 'A pie chart', 'A scatter plot of random points', 'A table of IDs'], 0,
    'Line charts show trends over time; pie charts show parts of a whole at one moment.'),
  mc('da-vz-02', 'da.visualization', 2, 'Why is a bar chart whose y-axis starts at 95 instead of 0 misleading?', ['It exaggerates small differences between bars', 'Bar charts cannot have axes', 'It hides the title', 'It changes the data'], 0,
    'Bar length is read as size; a truncated axis makes a 2% difference look huge.'),
  mc('da-vz-p1', 'da.visualization', 2, 'A dashboard shows sales for 30 product categories as a pie chart, and nobody can read it. What is the better fix?',
    ['A sorted horizontal bar chart, optionally showing the top 10 and grouping the rest as "Other"', 'A 3D pie chart', 'More colours', 'Remove the labels'], 0,
    'Sorted bars make comparison easy; many tiny pie slices cannot be compared by eye.', { practical: true }),
  mc('da-vz-s1', 'da.visualization', 3, 'The dashboard says revenue fell 40% this week. Before alerting management, what should you check?',
    ['Whether the data is complete and current (for example a delayed data load or a partial week)', 'Whether the chart colours are right', 'Nothing - report it immediately', 'Whether the dashboard is popular'], 0,
    'Sudden drops are often data problems - missing loads or a partial period. Confirm the data before raising an alarm.', { type: 'scenario' }),

  // ---- Business analysis ----
  mc('da-bz-01', 'da.business', 1, 'What is a KPI?', ['A key performance indicator: a measurable value showing progress towards a business goal', 'A type of chart', 'A database key', 'A programming language'], 0,
    'KPIs such as conversion rate or monthly active learners track whether goals are being met.'),
  mc('da-bz-02', 'da.business', 2, 'An online academy wants more paying students. Which is the most useful KPI to track first?', ['Conversion rate from free sign-up to paid enrolment', 'Number of pages on the website', 'Office electricity usage', 'Number of staff meetings'], 0,
    'The KPI should measure the outcome the business wants and be something the team can act on.'),
  out('da-bz-p1', 'da.business', 2, 'A campaign cost Rs 50,000 and brought 20 paying students at Rs 5,000 each. What is the return on investment as a percentage? ((revenue - cost) / cost)', null, ['100', '100%', '100.0'],
    'Revenue is 20 x 5,000 = 100,000. (100,000 - 50,000) / 50,000 = 1.0, which is 100%.', { category: 'practical' }),
  mc('da-bz-s1', 'da.business', 3, 'Sign-ups rose 30% but paid enrolments did not change. What do you investigate first?',
    ['Where sign-ups drop out of the funnel to payment (for example a payment step, pricing, or low-quality traffic)', 'Hire more teachers', 'Stop all marketing', 'Redesign the logo'], 0,
    'A funnel analysis shows where extra users are lost between sign-up and payment.', { type: 'scenario' }),

  // ---- Reviewed ----
  written('da-wr-01', 'da.stats', 2, 'theory', 'Explain the difference between the mean and the median, and describe a business dataset where you would report the median instead of the mean.',
    [['Correct definitions of mean and median', 2], ['Explains sensitivity of the mean to outliers / skew', 2], ['Gives an appropriate example (incomes, house prices, order values)', 2]],
    'The mean is the sum divided by the count; the median is the middle value when sorted. The mean is pulled by extreme values, so for skewed data such as salaries or order values, where a few very large values exist, the median describes the typical case better.'),
  submission('da-sb-01', ['da.sql', 'da.business'], 2, 'Given orders(order_id, customer_id, city, amount, ordered_at), write ONE SQL query that returns, for each city in 2026, the number of orders, total revenue and average order value, sorted by total revenue (highest first). Then write two sentences interpreting what a manager should look at.',
    [['Correct filter for 2026', 1], ['Groups by city with COUNT, SUM and AVG', 3], ['Sorted by revenue descending with clear aliases', 1], ['Sensible two-sentence interpretation', 2]],
    "SELECT city, COUNT(*) AS orders, SUM(amount) AS revenue, ROUND(AVG(amount), 0) AS avg_order\nFROM orders\nWHERE ordered_at >= '2026-01-01' AND ordered_at < '2027-01-01'\nGROUP BY city\nORDER BY revenue DESC;\n-- Look at cities with many orders but a low average order value (upsell opportunity) and cities with high value but few orders (growth potential)."),
  written('da-wr-02', 'da.visualization', 3, 'scenario', 'A school principal asks for a one-page dashboard to track student performance each term. What would you include, which charts would you use, and how would you keep it trustworthy?',
    [['Relevant KPIs (pass rate, average marks, attendance, trend by term)', 2], ['Appropriate chart choices with reasons', 2], ['Data quality / freshness checks and clear definitions', 1], ['Designed for the audience (simple, filters by class/subject)', 1]],
    'Show a few KPIs at the top - pass rate, average marks and attendance - with term-over-term change. Use line charts for trends, sorted bars to compare classes or subjects, and filters by class. Show the data refresh date, define each metric clearly, and validate totals against the school records.'),
];
