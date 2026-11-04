'use strict';
/**
 * Career Discovery quiz: a short, beginner-friendly screening quiz.
 *
 * Written for someone who may never have programmed: every technical word is
 * explained in the question, code snippets are tiny, and nothing assumes
 * prior study. 4 questions per area (8 areas, 32 questions); a quiz draws 12,
 * so a retake gets mostly different questions. Multiple choice only, graded
 * on the server, no negative marking. The result is a starting point for
 * recommendations, never a measure of ability or career suitability.
 *
 * Final subject-specialist review (2026-11-04): every item has one
 * defensible answer; wrong options are real beginner misconceptions (not
 * joke options), so the quiz tells "knows this" apart from "guessed"; code
 * outputs were checked by running them; no option length gives the answer away.
 */
const { mc } = require('../q');
const P = { practical: true }, S = { type: 'scenario' };
const code = (c, extra = {}) => ({ code: c, ...extra });

module.exports = [
  // ---------------- How computers work ----------------
  mc('dq-cp-1', 'disc.computing', 1, 'A computer follows instructions written by people. What do we call a set of instructions that tells a computer what to do?',
    ['A program', 'A database', 'A file format', 'A network'], 0,
    'A program is a list of instructions the computer carries out. A database stores data, a file format describes how a file is laid out, and a network connects computers.'),
  mc('dq-cp-2', 'disc.computing', 1, 'Your laptop has memory (RAM) and storage (a hard drive or SSD). What happens to things kept only in RAM when the laptop is switched off?',
    ['They are lost', 'They are saved to the hard drive automatically', 'They stay in RAM until you switch it on again', 'They are copied to the cloud'], 0,
    'RAM is fast, temporary working memory that is cleared when the power goes off. That is why unsaved work disappears; only files saved to storage survive.'),
  mc('dq-cp-3', 'disc.computing', 2, 'Computers store everything (text, pictures, music) as patterns of just two digits. Which two?',
    ['0 and 1', '1 and 2', '0 and 9', '1 and 10'], 0,
    'Computers use binary: every piece of data is stored as patterns of 0s and 1s, called bits.'),
  mc('dq-cp-4', 'disc.computing', 1, 'Which part of a computer is often called its "brain" because it carries out the instructions of programs?',
    ['The processor (CPU)', 'The memory (RAM)', 'The hard drive', 'The graphics card'], 0,
    'The CPU (central processing unit) carries out program instructions. RAM holds what is being worked on, the hard drive keeps files, and the graphics card draws the screen.'),

  // ---------------- Programming logic ----------------
  mc('dq-lg-1', 'disc.logic', 1, 'A rule says: "If it is raining, take an umbrella." It is NOT raining today. What does the rule tell you to do?',
    ['Nothing, because the rule applies only when it rains', 'Take an umbrella, because the rule mentions one', 'Take an umbrella, since rules always apply', 'Stay inside, because the rule is about rain'], 0,
    'An "if" rule only acts when its condition is true. When the condition is false, the action is skipped. Programs make decisions in exactly this way.'),
  mc('dq-lg-2', 'disc.logic', 2, 'In programming, "and" is true only when both parts are true. Is this statement true or false: "5 is greater than 3 and 2 is greater than 4"?',
    ['False', 'True', 'True, because 5 is greater than 3', 'It cannot be decided'], 0,
    '5 > 3 is true, but 2 > 4 is false. With "and", a single false part makes the whole statement false.'),
  mc('dq-lg-3', 'disc.logic', 2, 'You follow these steps exactly: start with 2, double it, then add 1. What number do you end with?',
    ['5', '4', '3', '6'], 0,
    '2 doubled is 4, and 4 + 1 = 5. (6 is what you get if you add 1 first and then double.) Following steps in order is exactly what a computer does with a program.', P),
  mc('dq-lg-4', 'disc.logic', 1, 'The order of instructions matters. Which order makes sense for making a cup of tea?',
    ['Boil the water, pour it into the cup, add the tea bag', 'Pour the water into the cup, add the tea bag, boil the water', 'Add the tea bag, drink the tea, boil the water', 'Drink the tea, boil the water, pour it into the cup'], 0,
    'Steps must happen in a sensible order: you cannot drink tea before it is made. Programs are the same: the computer runs instructions from top to bottom.', S),

  // ---------------- Variables and data types ----------------
  mc('dq-vr-1', 'disc.variables', 1, 'In programming, a variable is a named box that stores a value. After running this line, what is stored in the box called age?',
    ['20', 'age', '"age = 20"', 'Nothing yet'], 0,
    'The line age = 20 puts the value 20 into the variable named age. The name is the label on the box; 20 is what is inside it.', code('age = 20', P)),
  mc('dq-vr-2', 'disc.variables', 1, 'Programs store different kinds of data. Which of these is text (called a "string")?',
    ['"Lahore"', '42', '3.5', 'True'], 0,
    'Text values are written inside quotes and are called strings. 42 is a whole number, 3.5 is a decimal number, and True is a yes/no value (a boolean).'),
  mc('dq-vr-3', 'disc.variables', 2, 'A variable can be given a new value. What does this program print?',
    ['10', '5', '15', 'score'], 0,
    'score first holds 5, then the second line replaces it with 10, so print shows 10. A variable keeps only its latest value; it does not add the two.', code('score = 5\nscore = 10\nprint(score)', P)),
  mc('dq-vr-4', 'disc.variables', 2, 'What does this program print? (The + sign adds numbers together.)',
    ['7', '34', '3 + 4', 'x + y'], 0,
    'x holds 3 and y holds 4, so x + y is 7. print shows the value of the calculation, not the letters you typed. (34 would come from joining text, not adding numbers.)', code('x = 3\ny = 4\nprint(x + y)', P)),

  // ---------------- Conditions and loops ----------------
  mc('dq-ct-1', 'disc.control', 1, 'An "if" statement runs code only when a condition is true. What does this program print?',
    ['Pass', 'Fail', 'Pass Fail', 'Nothing'], 0,
    'marks is 70, and 70 >= 50 is true, so the program prints Pass. The "else" part runs only when the condition is false, so Fail is not printed.', code('marks = 70\nif marks >= 50:\n    print("Pass")\nelse:\n    print("Fail")', P)),
  mc('dq-ct-2', 'disc.control', 1, 'A loop repeats instructions. How many times does this loop print "Hi"?',
    ['3 times', '2 times', '1 time', '4 times'], 0,
    'range(3) gives the numbers 0, 1 and 2, which is three values, so the body runs three times.', code('for i in range(3):\n    print("Hi")', P)),
  mc('dq-ct-3', 'disc.control', 2, 'This program should print "Adult" for ages 18 and over, but for an 18-year-old it prints nothing. Which line is the problem?',
    ['if age > 18:  (it should be age >= 18)', 'age = 18  (18 is not a valid age)', 'print("Adult")  (print needs single quotes)', 'There is no problem with this code'], 0,
    'age > 18 is false when age is exactly 18, so nothing is printed. Using >= ("greater than or equal to") includes 18 itself. Python accepts both single and double quotes.', code('age = 18\nif age > 18:\n    print("Adult")', P)),
  mc('dq-ct-4', 'disc.control', 2, 'A shop wants to give a discount to every customer in a list of 500 names. Which programming idea saves writing the same line 500 times?',
    ['A loop', 'A variable', 'A comment', 'An if statement'], 0,
    'A loop repeats the same steps for each item in the list, so you write the instructions once. A variable stores one value, a comment is a note for people, and an if statement makes a single decision.', S),

  // ---------------- Algorithms and problem solving ----------------
  mc('dq-al-1', 'disc.algorithms', 1, 'An algorithm is a step-by-step method for solving a problem. Which of these is an algorithm?',
    ['A recipe for baking a cake', 'A list of the ingredients for a cake', 'A photo of a finished cake', 'The price of a cake in a shop'], 0,
    'A recipe gives clear steps, in order, to reach a result, which is exactly what an algorithm is. A list of ingredients is data: it says what you need, not what to do.'),
  mc('dq-al-2', 'disc.algorithms', 2, 'You are looking for a word in a printed dictionary, which is sorted A-Z. What is the fastest sensible way?',
    ['Open near the middle, then go left or right', 'Read every page, starting from the very first', 'Open random pages until you happen to find it', 'Start from the last page and work backwards'], 0,
    'Because the words are sorted, each look tells you which half the word is in, so you can keep halving the search. Computers use the same idea, called binary search.', S),
  mc('dq-al-3', 'disc.algorithms', 2, 'To find the largest number in the list 4, 9, 2, 7 you look at each number and remember the biggest so far. What do you remember after looking at all four?',
    ['9', '7', '4', '2'], 0,
    'Biggest so far: 4, then 9, then still 9 (2 is smaller), then still 9 (7 is smaller). 7 is the last number seen, not the biggest.', P),
  mc('dq-al-4', 'disc.algorithms', 1, 'A big problem feels too hard to solve at once. What do programmers usually do first?',
    ['Break it into smaller steps', 'Write all the code at once and test it at the end', 'Learn a new programming language first', 'Ask the computer to work out the steps itself'], 0,
    'Breaking a problem into smaller pieces (called decomposition) is the most common first step. Each small piece is easier to solve and to test.', S),

  // ---------------- Working with data ----------------
  mc('dq-dt-1', 'disc.data', 1, 'A list keeps several values in order. In many languages counting starts from 0. What does this program print?',
    ['20', '10', '30', 'Error'], 0,
    'Position 0 holds 10 and position 1 holds 20, so nums[1] is 20. Counting from 0 is why 10 is a common wrong answer.', code('nums = [10, 20, 30]\nprint(nums[1])', P)),
  mc('dq-dt-2', 'disc.data', 1, 'A school keeps student names and marks in rows and columns, like a spreadsheet. What is this arrangement of data called?',
    ['A table', 'A loop', 'A function', 'A server'], 0,
    'Rows and columns form a table, the way spreadsheets and databases organise data. Each row is one student and each column is one piece of information.'),
  mc('dq-dt-3', 'disc.data', 2, 'The marks of five students are 60, 70, 80, 90 and 100. What is the average (mean)?',
    ['80', '70', '90', '400'], 0,
    'Add them up (400) and divide by how many there are (5): 400 / 5 = 80. 400 is the total, not the average.', P),
  mc('dq-dt-4', 'disc.data', 2, 'A survey sheet has the city written as "Lahore", "lahore" and "LAHORE". Why might a program count three cities instead of one?',
    ['Computers treat different capital letters as different text', 'Lahore is too long a word for a computer to store properly', 'The survey sheet must have a broken or a missing column', 'Computers cannot count city names, only numbers in a list'], 0,
    'To a computer, "Lahore" and "LAHORE" are different pieces of text. Cleaning the data first, by making the spelling and capitals consistent, fixes the count.', S),

  // ---------------- Internet and web basics ----------------
  mc('dq-wb-1', 'disc.web', 1, 'When you open a website, your browser asks another computer for the page. What is that other computer called?',
    ['A server', 'A router', 'A search engine', 'A modem'], 0,
    'A server stores the website and sends pages to browsers (the clients) when they ask. A router and a modem only pass traffic along, and a search engine helps you find sites.'),
  mc('dq-wb-2', 'disc.web', 1, 'Web pages are built with HTML. What is HTML mainly used for?',
    ['Describing the content and structure of a page', 'Storing the website\'s data in a database', 'Making buttons respond when they are clicked', 'Sending the page across the internet'], 0,
    'HTML describes the headings, paragraphs, images and links on a page. CSS adds the style, JavaScript makes things respond to clicks, and databases store the data.'),
  mc('dq-wb-3', 'disc.web', 2, 'A website address starts with https:// instead of http://. What does the extra "s" tell you?',
    ['The connection is encrypted (secure)', 'The website is guaranteed to be honest', 'The site loads faster on phones', 'The site has been checked for viruses'], 0,
    'The "s" means secure: data between your browser and the site is encrypted so others cannot read it on the way. It does not prove the site itself is honest: scam sites can use https too.'),
  mc('dq-wb-4', 'disc.web', 2, 'You click a link and see "404 Not Found". What does this usually mean?',
    ['The page you asked for does not exist', 'Your internet connection has dropped', 'The website\'s server is switched off', 'The page is too large to load'], 0,
    '404 is a status code from the server meaning it is working but cannot find the page you asked for. This is often a broken or mistyped link. If your connection or the server were down, you would not get a reply at all.', S),

  // ---------------- How software is built ----------------
  mc('dq-sw-1', 'disc.software', 1, 'Programmers call a mistake in a program that makes it behave wrongly a ... what?',
    ['A bug', 'A byte', 'A patch', 'A loop'], 0,
    'A bug is an error in a program, and finding and fixing bugs is called debugging. A patch is the fix itself; a byte is a unit of data.'),
  mc('dq-sw-2', 'disc.software', 1, 'Before releasing an app, a team tries it out on purpose to find problems. What is this activity called?',
    ['Testing', 'Deploying', 'Compiling', 'Designing'], 0,
    'Testing checks that software works as expected before real users rely on it. Deploying is releasing it, compiling turns code into a runnable program, and designing plans it.', S),
  mc('dq-sw-3', 'disc.software', 2, 'Tools such as Git keep a history of every change to a project\'s code. Why is this useful?',
    ['You can see what changed and go back to an older version', 'It makes the finished program run faster for its users', 'It finds and fixes the bugs in the code automatically', 'It stops two people from ever changing the same file'], 0,
    'Version control records each change, so a team can review work, see when a bug appeared and undo mistakes. It does not fix bugs or speed up programs, and people can still edit the same file.'),
  mc('dq-sw-4', 'disc.software', 2, 'This program crashes. Which line causes the error?',
    ['print(nmae), because "nmae" is misspelt and was never created', 'name = "Sara", because names cannot be stored in variables', 'There is no error, and the program prints Sara', 'Both lines are wrong because Python needs semicolons'], 0,
    'The variable is called name, but the second line asks for nmae, which does not exist, so Python stops with an error. Spelling must match exactly.', code('name = "Sara"\nprint(nmae)', P)),
];
