'use strict';

/**
 * EchoLens prebuilt track: Python for Programming (6 weeks, 12 sessions)
 * One quest level per session. Students climb level by level: the next level
 * unlocks only after the instructor grades every problem in the current one
 * at a passing average. Track titles are earned by cumulative track gems.
 */

module.exports = {
  key: 'python-6w', course_code: 'SC-01',
  title: 'Python for Data Science',
  description: '6-week quest from your first print() to a working regression model. Pass each level to unlock the next.',
  pass_mark: 60, // average % across a level's graded problems to unlock the next
  titles: [
    { min: 0,    name: 'Code Cadet' },
    { min: 300,  name: 'Loop Ranger' },
    { min: 700,  name: 'Data Wrangler' },
    { min: 1200, name: 'Chart Crafter' },
    { min: 1700, name: 'Model Maker' },
    { min: 2300, name: 'ML Pathfinder' },
  ],
  levels: [
    {
      no: 1, week: 1, session: 1, title: 'First Contact', topic: 'Python foundations: variables, types, input/output',
      problems: [
        { title: 'Hello, Data', points: 40, difficulty: 'Basic', description: 'Write a program that asks for your name and city, then prints: "<name> from <city> has joined EchoLens!" using an f-string. Submit your .py file.',
          criteria: ['Prompts for both name and city', 'Uses an f-string for the output', 'Output matches the exact required format'],
          hint: 'Remember an f-string needs the f prefix right before the opening quote, and the variable names go inside curly braces - watch out for extra spaces around the placeholders.' },
        { title: 'Bill Splitter', points: 60, difficulty: 'Core', description: 'Ask for a restaurant bill amount and the number of friends. Print each person\'s share rounded to 2 decimal places, and add a 5% tip option. Handle the input as numbers, not text.',
          criteria: ['Converts input to numbers before doing math', 'Correctly rounds each share to 2 decimal places', 'Applies the 5% tip option correctly'],
          hint: 'Convert your inputs with float()/int() right away so the division works correctly, and decide whether the tip is added before or after splitting - just be consistent about it.' },
        { title: 'Type Detective', points: 80, difficulty: 'Boss', description: 'Take any input from the user and report whether it is an integer, a float, or text - without crashing on any input. Show the converted value when conversion is possible. Hint: try/except.',
          criteria: ['Correctly identifies integers, floats, and text', 'Never crashes regardless of input', 'Displays the converted value when conversion succeeds'],
          hint: 'Try converting to int first, then float, catching ValueError each time before falling back to treating the input as plain text.' },
      ],
    },
    {
      no: 2, week: 1, session: 2, title: 'Flow Control', topic: 'Conditionals and loops',
      problems: [
        { title: 'Grade Gatekeeper', points: 50, difficulty: 'Basic', description: 'Read a score 0-100 and print the EchoLens stage it maps to: 0-49 Spark, 50-69 Glow, 70-84 Beam, 85-94 Prism, 95+ Nova. Use if/elif/else.',
          criteria: ['Correct mapping for all score ranges', 'Proper use of if/elif/else', 'Clean and readable code'],
          hint: 'Check the boundaries from the top down: is the score 95 or more first, then 85 or more, and so on - that way each elif only needs one comparison, and you never need to check a range twice.',
          reference: { title: 'Score Reference', rows: [
            { range: '0 - 49', label: 'Spark' },
            { range: '50 - 69', label: 'Glow' },
            { range: '70 - 84', label: 'Beam' },
            { range: '85 - 94', label: 'Prism' },
            { range: '95+', label: 'Nova' },
          ] } },
        { title: 'FizzBuzz, Pakistan Edition', points: 70, difficulty: 'Core', description: 'Print 1 to 50. Multiples of 3 print "Chai", multiples of 5 print "Samosa", multiples of both print "ChaiSamosa". Then print how many of each appeared.',
          criteria: ['Correct output for numbers 1 through 50', 'Multiples of both 3 and 5 print ChaiSamosa', 'Accurate counts printed at the end'],
          hint: 'Check the "multiple of both 3 and 5" condition before the individual checks, otherwise a number like 15 will print Chai instead of ChaiSamosa.' },
        { title: 'Prime Hunter', points: 90, difficulty: 'Boss', description: 'Ask for a number N and print all prime numbers up to N, plus the count. Your loop must skip even numbers greater than 2 for efficiency. Add a comment explaining why.',
          criteria: ['Correctly identifies all primes up to N', 'Skips even numbers greater than 2 in the loop', 'Comment explains the efficiency reasoning'],
          hint: 'Since 2 is the only even prime, test it separately and then step through odd numbers only - just make sure your prime test itself still checks for factors correctly.' },
      ],
    },
    {
      no: 3, week: 2, session: 3, title: 'The Collection', topic: 'Lists, dictionaries, tuples, sets',
      problems: [
        { title: 'Tuck Shop Inventory', points: 50, difficulty: 'Basic', description: 'Build a dictionary of 6 tuck-shop items with prices. Print each item on its own line, then the most expensive item and the total value of the shop.',
          criteria: ['Dictionary contains exactly 6 items with prices', 'Correctly identifies the most expensive item', 'Total value is summed correctly'],
          hint: 'Use max() on the dictionary\'s .items() with a key function on the price, instead of writing a manual loop to find the most expensive item.' },
        { title: 'Word Counter', points: 80, difficulty: 'Core', description: 'Take a paragraph of text and print the 5 most common words with their counts, ignoring case and punctuation. Use a dictionary - no imports allowed except string.',
          criteria: ['Correctly ignores case and punctuation when counting', 'Uses a dictionary to tally word counts', 'Prints exactly the top 5 words with accurate counts'],
          hint: 'Lowercase each word and strip it of string.punctuation before counting, then sort the dictionary\'s items by count to pull out the top 5.' },
        { title: 'Duplicate Buster', points: 100, difficulty: 'Boss', description: 'Given a list of student registration numbers (make up 15, with some repeats), produce: the unique numbers in original order, the duplicates, and a dictionary of number -> count. Compare doing it with and without a set, in comments.',
          criteria: ['Preserves original order when listing unique numbers', 'Correctly identifies only the duplicated numbers', 'Comments compare the set-based approach with the manual approach'],
          hint: 'A set is great for spotting duplicates fast but doesn\'t preserve order, so you\'ll likely need a second pass with a list or dict to keep the original ordering intact.' },
      ],
    },
    {
      no: 4, week: 2, session: 4, title: 'The Craftsman', topic: 'Functions and working with files',
      problems: [
        { title: 'Function Toolbox', points: 60, difficulty: 'Basic', description: 'Write three functions: area_of_circle(r), is_leap_year(y), and celsius_to_fahrenheit(c). Each must have a docstring and be demonstrated with 3 test calls printing inputs and outputs.',
          criteria: ['Each function has a docstring', 'is_leap_year correctly handles century-year edge cases', 'Each function is demonstrated with 3 test calls showing input and output'],
          hint: 'Remember the leap year rule isn\'t just "divisible by 4" - years divisible by 100 aren\'t leap years unless they\'re also divisible by 400.' },
        { title: 'Marks File Reader', points: 90, difficulty: 'Core', description: 'Create a text file with 10 lines of "name,marks". Write a program that reads it, prints each student with PASS/FAIL (pass = 50+), and writes the failures to a new file failures.txt.',
          criteria: ['Correctly parses each comma-separated line', 'Uses 50 as the pass/fail boundary consistently', 'Writes only the failing students to failures.txt'],
          hint: 'After splitting each line on the comma, convert the marks part to an int before comparing it to 50, and strip trailing newline characters first.' },
        { title: 'Mini Gradebook', points: 120, difficulty: 'Boss', description: 'Combine everything: a menu-driven program (add student, show all, show topper, save to file, load from file) using functions and a dictionary. It must not crash on bad menu input.',
          criteria: ['All five menu options work as described', 'Uses functions to organize each menu action', 'Invalid menu input is handled without crashing'],
          hint: 'Wrap the menu loop in a try/except or an else branch for unrecognized choices, and validate that input() can actually convert to the type you expect before using it.' },
      ],
    },
    {
      no: 5, week: 3, session: 5, title: 'Enter NumPy', topic: 'Arrays, indexing, vectorised math',
      problems: [
        { title: 'Array Basics', points: 60, difficulty: 'Basic', description: 'Create a NumPy array of 20 random integers between 1 and 100. Print its shape, dtype, min, max, mean, and the array sorted. Seed the generator so results are repeatable.',
          criteria: ['Uses a fixed seed so results are repeatable', 'Correctly reports shape, dtype, min, max, and mean', 'Prints the array sorted without altering the original'],
          hint: 'Call np.random.seed() (or use a Generator with a fixed seed) before generating the array, so re-running your script always produces the same numbers.' },
        { title: 'Temperature Lab', points: 90, difficulty: 'Core', description: 'Given 30 days of Lahore temperatures (generate realistic values), convert all to Fahrenheit in ONE vectorised operation (no loop), then report days above 35C using boolean masking.',
          criteria: ['Converts all 30 values in a single vectorised operation', 'Does not use an explicit Python loop for the conversion', 'Correctly counts days above 35C using boolean masking'],
          hint: 'Boolean masking means writing something like temps[temps > 35] rather than looping with an if statement - let NumPy\'s comparison operators build the mask for you.' },
        { title: 'Matrix Mission', points: 120, difficulty: 'Boss', description: 'Create two 3x3 matrices. Show element-wise product vs matrix product (@), the transpose, and solve a small system of linear equations with np.linalg.solve. Explain the difference between * and @ in comments.',
          criteria: ['Correctly distinguishes element-wise product from matrix product', 'Uses np.linalg.solve correctly for the system of equations', 'Comments clearly explain the difference between * and @'],
          hint: 'Remember * multiplies matrices position by position while @ performs true matrix multiplication (row times column) - they only agree in special cases.' },
      ],
    },
    {
      no: 6, week: 3, session: 6, title: 'NumPy Deep Dive', topic: 'Reshaping, aggregation, normalisation',
      problems: [
        { title: 'Reshape Rally', points: 70, difficulty: 'Core', description: 'Build an array of 1-24. Reshape it to 4x6, then 2x3x4. Extract: the second row, the last column, and every alternate element of the flattened array - all with slicing only.',
          criteria: ['Correctly reshapes the array to both 4x6 and 2x3x4', 'Extracts the second row and last column using slicing', 'Extracts every alternate element of the flattened array without a loop'],
          hint: 'For "every alternate element", slicing supports a step argument - something like array[::2] - so you don\'t need to loop and check indices manually.' },
        { title: 'Score Normaliser', points: 110, difficulty: 'Boss', description: 'Generate marks for 5 subjects x 30 students (matrix). Compute per-subject mean and std, then min-max normalise each subject to 0-1 WITHOUT loops. Print which subject had the widest spread and the top student by normalised total.',
          criteria: ['Computes per-subject mean and standard deviation correctly', 'Performs min-max normalisation without any Python loops', 'Correctly identifies both the widest-spread subject and the top student'],
          hint: 'Do your mean, std, min, and max calculations along the correct axis (per subject, not the whole matrix) - axis=0 vs axis=1 is easy to mix up here.' },
      ],
    },
    {
      no: 7, week: 4, session: 7, title: 'Pandas Awakens', topic: 'DataFrames: load, inspect, select, filter',
      problems: [
        { title: 'DataFrame Debut', points: 70, difficulty: 'Basic', description: 'Build a DataFrame of 12 students (name, city, marks, attendance). Show head(), info(), describe(), then select only name+marks, and filter students with marks > 70 AND attendance > 80%.',
          criteria: ['Displays head(), info(), and describe() correctly', 'Correctly selects only the name and marks columns', 'Filter combines both conditions correctly with AND'],
          hint: 'When combining two conditions in a pandas filter, use the & operator with each condition wrapped in parentheses, not Python\'s and keyword.' },
        { title: 'CSV Detective', points: 100, difficulty: 'Core', description: 'Save your DataFrame to CSV, reload it, and answer with code: how many unique cities? Average marks per city? Who has the highest marks in each city? Use value_counts and groupby-idxmax.',
          criteria: ['Correctly reloads the CSV and reproduces the original data', 'Uses value_counts to count unique cities', 'Uses groupby with idxmax to find the top student per city'],
          hint: 'For "highest marks in each city", group the marks column by city and use idxmax() to get the row index you want, then use that to look up the full row.' },
        { title: 'Dirty Data Rescue', points: 130, difficulty: 'Boss', description: 'Deliberately inject problems into your CSV: missing marks, duplicated rows, a city written 3 different ways ("Lahore", "lahore", " LHR "). Write a cleaning script that fixes all three and proves it with before/after counts.',
          criteria: ['Correctly handles missing marks values', 'Removes duplicated rows', 'Standardises inconsistent city name variants with before/after counts shown'],
          hint: 'Standardise the city column with something like .str.strip().str.lower() before comparing city names, since whitespace and casing differences will otherwise look like different cities.' },
      ],
    },
    {
      no: 8, week: 4, session: 8, title: 'Pandas Mastery', topic: 'GroupBy, merge, transformation',
      problems: [
        { title: 'Sales Splitter', points: 90, difficulty: 'Core', description: 'Create a sales DataFrame (date, city, product, units, price). Add a revenue column, then report revenue by city, by product, and by month - each with a single groupby chain.',
          criteria: ['Revenue column is correctly computed from units and price', 'Each report uses a single groupby chain', 'Revenue by month is correctly derived from the date column'],
          hint: 'Extract the month from the date column (for example with .dt.month) before you can group revenue by month.' },
        { title: 'The Merge Job', points: 130, difficulty: 'Boss', description: 'Create two DataFrames: students (id, name, city) and results (id, course, marks) where some students have no results and one result has no student. Demonstrate inner, left, and outer merges, and explain in comments what each one kept and lost.',
          criteria: ['Correctly performs inner, left, and outer merges', 'Comments correctly explain what each merge type kept and dropped', 'Handles the unmatched student and unmatched result cases correctly'],
          hint: 'Think about which side each merge type keeps unmatched rows from - inner drops both, left keeps unmatched students, outer keeps everything with NaNs filling the gaps.' },
      ],
    },
    {
      no: 9, week: 5, session: 9, title: 'Picture the Data', topic: 'Matplotlib: line, bar, scatter, styling',
      problems: [
        { title: 'Chart Starter Pack', points: 80, difficulty: 'Basic', description: 'From your sales data: a line chart of revenue over time, a bar chart of revenue by city, and a scatter of units vs price. Every chart needs a title, axis labels, and a legend. Submit code + saved PNGs.',
          criteria: ['All three chart types are present and correctly plotted', 'Every chart includes a title, axis labels, and a legend', 'Charts are saved as PNG files'],
          hint: 'Even a single-series chart needs a legend to satisfy the requirement - pass a label= to your plot call and then call plt.legend().' },
        { title: 'The Dashboard Figure', points: 130, difficulty: 'Boss', description: 'One figure, 2x2 subplots: line, bar, scatter, and a histogram of marks. Style it: consistent colors, a main title, tight layout, and one annotation pointing at the most interesting data point. This is a portfolio piece - make it clean.',
          criteria: ['All four subplot types appear in a single 2x2 figure', 'Uses a consistent color scheme and a main figure title', 'Includes one annotation pointing at a specific data point'],
          hint: 'Use plt.subplots(2, 2) to get all four axes at once, fig.suptitle() for the overall title, and ax.annotate() with arrowprops for the pointer.' },
      ],
    },
    {
      no: 10, week: 5, session: 10, title: 'Think Like a Model', topic: 'ML concepts: features, labels, EDA',
      problems: [
        { title: 'Feature Hunt', points: 90, difficulty: 'Core', description: 'Take a house-price style dataset (create ~50 rows: area, bedrooms, city, age, price). Identify features vs label in comments, one-hot encode the city column with pandas, and show the correlation of each numeric feature with price.',
          criteria: ['Clearly identifies features versus the label in comments', 'Correctly one-hot encodes the city column with pandas', 'Correctly computes correlation of each numeric feature with price'],
          hint: 'pandas.get_dummies() is the quickest way to one-hot encode the city column, and .corr() on the DataFrame gives you the correlation values you need against price.' },
        { title: 'EDA Mini-Report', points: 130, difficulty: 'Boss', description: 'Produce a short EDA notebook: distributions of every feature, missing-value check, at least 2 charts, and a 5-line written summary at the end stating which features you expect to predict price best and why. You will test your prediction next level.',
          criteria: ['Shows distributions for every feature', 'Performs an explicit missing-value check', 'Written summary makes a clear, reasoned prediction about which features matter most'],
          hint: 'Back your prediction in the summary with something concrete from your EDA - like a correlation value or a visible trend in a chart - rather than just a guess.' },
      ],
    },
    {
      no: 11, week: 6, session: 11, title: 'Split and Fit', topic: 'Train/test split and linear regression',
      problems: [
        { title: 'The Split', points: 90, difficulty: 'Core', description: 'Using your house dataset: train_test_split (80/20, fixed random_state), fit a LinearRegression on the training set, and print the coefficients matched to their feature names. In comments: why do we NEVER evaluate on training data?',
          criteria: ['Uses train_test_split with an 80/20 ratio and a fixed random_state', 'Coefficients are correctly matched to their feature names', 'Comments correctly explain why training data isn\'t used for evaluation'],
          hint: 'model.coef_ returns coefficients in the same order as the columns you trained on, so zip() them with your feature name list rather than guessing the order.' },
        { title: 'Honest Evaluation', points: 130, difficulty: 'Boss', description: 'Evaluate your model on the test set: MAE, RMSE, and R2. Then deliberately overfit (train and evaluate on the same data) and show both results side by side with a 3-line explanation of the gap.',
          criteria: ['Correctly computes MAE, RMSE, and R2 on the test set', 'Deliberately reproduces the overfitting scenario for comparison', 'Explanation clearly accounts for the gap between the two results'],
          hint: 'RMSE isn\'t always a built-in one-liner - depending on your sklearn version you may need to take the square root of mean_squared_error yourself.' },
      ],
    },
    {
      no: 12, week: 6, session: 12, title: 'The Capstone', topic: 'End-to-end regression project',
      problems: [
        { title: 'Full Pipeline: Predict the Price', points: 250, difficulty: 'Boss', description: 'One notebook, end to end: load data -> clean -> EDA (2+ charts) -> encode -> split -> train LinearRegression -> evaluate (MAE, RMSE, R2) -> write a 10-line conclusion: what the model learned, where it fails, what you would try next. This is your track finale and a portfolio project - it will be graded on completeness, correctness, and clarity.',
          criteria: ['Every pipeline stage is present, in order, and functioning', 'Evaluation metrics (MAE, RMSE, R2) are computed correctly on the test set', 'Written conclusion clearly addresses what was learned, where it fails, and next steps'],
          hint: 'Treat this like your earlier regression problems joined end to end - the trickiest part is usually keeping the encoding and column order consistent between training and evaluation.' },
      ],
    },
  ],
};
