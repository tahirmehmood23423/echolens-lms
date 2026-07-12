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
        { title: 'Hello, Data', points: 40, difficulty: 'Basic', description: 'Write a program that asks for your name and city, then prints: "<name> from <city> has joined EchoLens!" using an f-string. Submit your .py file.' },
        { title: 'Bill Splitter', points: 60, difficulty: 'Core', description: 'Ask for a restaurant bill amount and the number of friends. Print each person\'s share rounded to 2 decimal places, and add a 5% tip option. Handle the input as numbers, not text.' },
        { title: 'Type Detective', points: 80, difficulty: 'Boss', description: 'Take any input from the user and report whether it is an integer, a float, or text - without crashing on any input. Show the converted value when conversion is possible. Hint: try/except.' },
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
        { title: 'FizzBuzz, Pakistan Edition', points: 70, difficulty: 'Core', description: 'Print 1 to 50. Multiples of 3 print "Chai", multiples of 5 print "Samosa", multiples of both print "ChaiSamosa". Then print how many of each appeared.' },
        { title: 'Prime Hunter', points: 90, difficulty: 'Boss', description: 'Ask for a number N and print all prime numbers up to N, plus the count. Your loop must skip even numbers greater than 2 for efficiency. Add a comment explaining why.' },
      ],
    },
    {
      no: 3, week: 2, session: 3, title: 'The Collection', topic: 'Lists, dictionaries, tuples, sets',
      problems: [
        { title: 'Tuck Shop Inventory', points: 50, difficulty: 'Basic', description: 'Build a dictionary of 6 tuck-shop items with prices. Print each item on its own line, then the most expensive item and the total value of the shop.' },
        { title: 'Word Counter', points: 80, difficulty: 'Core', description: 'Take a paragraph of text and print the 5 most common words with their counts, ignoring case and punctuation. Use a dictionary - no imports allowed except string.' },
        { title: 'Duplicate Buster', points: 100, difficulty: 'Boss', description: 'Given a list of student registration numbers (make up 15, with some repeats), produce: the unique numbers in original order, the duplicates, and a dictionary of number -> count. Compare doing it with and without a set, in comments.' },
      ],
    },
    {
      no: 4, week: 2, session: 4, title: 'The Craftsman', topic: 'Functions and working with files',
      problems: [
        { title: 'Function Toolbox', points: 60, difficulty: 'Basic', description: 'Write three functions: area_of_circle(r), is_leap_year(y), and celsius_to_fahrenheit(c). Each must have a docstring and be demonstrated with 3 test calls printing inputs and outputs.' },
        { title: 'Marks File Reader', points: 90, difficulty: 'Core', description: 'Create a text file with 10 lines of "name,marks". Write a program that reads it, prints each student with PASS/FAIL (pass = 50+), and writes the failures to a new file failures.txt.' },
        { title: 'Mini Gradebook', points: 120, difficulty: 'Boss', description: 'Combine everything: a menu-driven program (add student, show all, show topper, save to file, load from file) using functions and a dictionary. It must not crash on bad menu input.' },
      ],
    },
    {
      no: 5, week: 3, session: 5, title: 'Enter NumPy', topic: 'Arrays, indexing, vectorised math',
      problems: [
        { title: 'Array Basics', points: 60, difficulty: 'Basic', description: 'Create a NumPy array of 20 random integers between 1 and 100. Print its shape, dtype, min, max, mean, and the array sorted. Seed the generator so results are repeatable.' },
        { title: 'Temperature Lab', points: 90, difficulty: 'Core', description: 'Given 30 days of Lahore temperatures (generate realistic values), convert all to Fahrenheit in ONE vectorised operation (no loop), then report days above 35C using boolean masking.' },
        { title: 'Matrix Mission', points: 120, difficulty: 'Boss', description: 'Create two 3x3 matrices. Show element-wise product vs matrix product (@), the transpose, and solve a small system of linear equations with np.linalg.solve. Explain the difference between * and @ in comments.' },
      ],
    },
    {
      no: 6, week: 3, session: 6, title: 'NumPy Deep Dive', topic: 'Reshaping, aggregation, normalisation',
      problems: [
        { title: 'Reshape Rally', points: 70, difficulty: 'Core', description: 'Build an array of 1-24. Reshape it to 4x6, then 2x3x4. Extract: the second row, the last column, and every alternate element of the flattened array - all with slicing only.' },
        { title: 'Score Normaliser', points: 110, difficulty: 'Boss', description: 'Generate marks for 5 subjects x 30 students (matrix). Compute per-subject mean and std, then min-max normalise each subject to 0-1 WITHOUT loops. Print which subject had the widest spread and the top student by normalised total.' },
      ],
    },
    {
      no: 7, week: 4, session: 7, title: 'Pandas Awakens', topic: 'DataFrames: load, inspect, select, filter',
      problems: [
        { title: 'DataFrame Debut', points: 70, difficulty: 'Basic', description: 'Build a DataFrame of 12 students (name, city, marks, attendance). Show head(), info(), describe(), then select only name+marks, and filter students with marks > 70 AND attendance > 80%.' },
        { title: 'CSV Detective', points: 100, difficulty: 'Core', description: 'Save your DataFrame to CSV, reload it, and answer with code: how many unique cities? Average marks per city? Who has the highest marks in each city? Use value_counts and groupby-idxmax.' },
        { title: 'Dirty Data Rescue', points: 130, difficulty: 'Boss', description: 'Deliberately inject problems into your CSV: missing marks, duplicated rows, a city written 3 different ways ("Lahore", "lahore", " LHR "). Write a cleaning script that fixes all three and proves it with before/after counts.' },
      ],
    },
    {
      no: 8, week: 4, session: 8, title: 'Pandas Mastery', topic: 'GroupBy, merge, transformation',
      problems: [
        { title: 'Sales Splitter', points: 90, difficulty: 'Core', description: 'Create a sales DataFrame (date, city, product, units, price). Add a revenue column, then report revenue by city, by product, and by month - each with a single groupby chain.' },
        { title: 'The Merge Job', points: 130, difficulty: 'Boss', description: 'Create two DataFrames: students (id, name, city) and results (id, course, marks) where some students have no results and one result has no student. Demonstrate inner, left, and outer merges, and explain in comments what each one kept and lost.' },
      ],
    },
    {
      no: 9, week: 5, session: 9, title: 'Picture the Data', topic: 'Matplotlib: line, bar, scatter, styling',
      problems: [
        { title: 'Chart Starter Pack', points: 80, difficulty: 'Basic', description: 'From your sales data: a line chart of revenue over time, a bar chart of revenue by city, and a scatter of units vs price. Every chart needs a title, axis labels, and a legend. Submit code + saved PNGs.' },
        { title: 'The Dashboard Figure', points: 130, difficulty: 'Boss', description: 'One figure, 2x2 subplots: line, bar, scatter, and a histogram of marks. Style it: consistent colors, a main title, tight layout, and one annotation pointing at the most interesting data point. This is a portfolio piece - make it clean.' },
      ],
    },
    {
      no: 10, week: 5, session: 10, title: 'Think Like a Model', topic: 'ML concepts: features, labels, EDA',
      problems: [
        { title: 'Feature Hunt', points: 90, difficulty: 'Core', description: 'Take a house-price style dataset (create ~50 rows: area, bedrooms, city, age, price). Identify features vs label in comments, one-hot encode the city column with pandas, and show the correlation of each numeric feature with price.' },
        { title: 'EDA Mini-Report', points: 130, difficulty: 'Boss', description: 'Produce a short EDA notebook: distributions of every feature, missing-value check, at least 2 charts, and a 5-line written summary at the end stating which features you expect to predict price best and why. You will test your prediction next level.' },
      ],
    },
    {
      no: 11, week: 6, session: 11, title: 'Split and Fit', topic: 'Train/test split and linear regression',
      problems: [
        { title: 'The Split', points: 90, difficulty: 'Core', description: 'Using your house dataset: train_test_split (80/20, fixed random_state), fit a LinearRegression on the training set, and print the coefficients matched to their feature names. In comments: why do we NEVER evaluate on training data?' },
        { title: 'Honest Evaluation', points: 130, difficulty: 'Boss', description: 'Evaluate your model on the test set: MAE, RMSE, and R2. Then deliberately overfit (train and evaluate on the same data) and show both results side by side with a 3-line explanation of the gap.' },
      ],
    },
    {
      no: 12, week: 6, session: 12, title: 'The Capstone', topic: 'End-to-end regression project',
      problems: [
        { title: 'Full Pipeline: Predict the Price', points: 250, difficulty: 'Boss', description: 'One notebook, end to end: load data -> clean -> EDA (2+ charts) -> encode -> split -> train LinearRegression -> evaluate (MAE, RMSE, R2) -> write a 10-line conclusion: what the model learned, where it fails, what you would try next. This is your track finale and a portfolio project - it will be graded on completeness, correctness, and clarity.' },
      ],
    },
  ],
};
