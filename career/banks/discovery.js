'use strict';
/**
 * Career Discovery quiz - a short, beginner-friendly screening quiz.
 *
 * Written for someone who may never have programmed: every technical word is
 * explained in the question, code snippets are tiny, and nothing assumes
 * prior study. 4 questions per area (8 areas, 32 questions); a quiz draws 12,
 * so a retake gets mostly different questions. Multiple choice only, graded
 * on the server, no negative marking. The result is a starting point for
 * recommendations - never a measure of ability or career suitability.
 */
const { mc } = require('../q');
const P = { practical: true }, S = { type: 'scenario' };
const code = (c, extra = {}) => ({ code: c, ...extra });

module.exports = [
  // ---------------- How computers work ----------------
  mc('dq-cp-1', 'disc.computing', 1, 'A computer follows instructions written by people. What do we call a set of instructions that tells a computer what to do?',
    ['A program', 'A monitor', 'A password', 'A keyboard'], 0,
    'A program is a list of instructions. Monitors and keyboards are hardware; a password is a secret used to sign in.'),
  mc('dq-cp-2', 'disc.computing', 1, 'Your laptop has memory (RAM) and storage (a hard drive or SSD). What happens to things kept only in RAM when the laptop is switched off?',
    ['They are lost', 'They are printed', 'They move to the cloud', 'They stay there forever'], 0,
    'RAM is fast, temporary working memory that is cleared when power goes off. Storage keeps files after shutdown.'),
  mc('dq-cp-3', 'disc.computing', 2, 'Computers store everything - text, pictures, music - using only two digits. Which two?',
    ['0 and 1', '1 and 2', '0 and 9', 'A and B'], 0,
    'Computers use binary: every piece of data is stored as patterns of 0s and 1s (bits).'),
  mc('dq-cp-4', 'disc.computing', 1, 'Which part of a computer is often called its "brain" because it carries out the instructions of programs?',
    ['The processor (CPU)', 'The screen display', 'The power cable', 'The mouse pad'], 0,
    'The CPU (central processing unit) executes program instructions one after another, very quickly.'),

  // ---------------- Programming logic ----------------
  mc('dq-lg-1', 'disc.logic', 1, 'A rule says: "If it is raining, take an umbrella." It is NOT raining today. What does the rule tell you to do?',
    ['Nothing - the rule applies only when it rains', 'Take two umbrellas with you, just in case', 'Always take an umbrella, whatever the weather', 'Stay at home all day, since it may rain later'], 0,
    'An "if" rule only acts when its condition is true. Programs make decisions in exactly this way.'),
  mc('dq-lg-2', 'disc.logic', 2, 'In programming, "and" is true only when both parts are true. Is this statement true or false: "5 is greater than 3 and 2 is greater than 4"?',
    ['False', 'True', 'Both', 'Neither'], 0,
    '5 > 3 is true, but 2 > 4 is false. With "and", one false part makes the whole statement false.'),
  mc('dq-lg-3', 'disc.logic', 2, 'You follow these steps: start with 2, double it, then add 1. What number do you end with?',
    ['5', '4', '3', '6'], 0,
    '2 doubled is 4, and 4 + 1 = 5. Following steps in order is exactly what a computer does with a program.', P),
  mc('dq-lg-4', 'disc.logic', 1, 'The order of instructions matters. Which order makes sense for making a cup of tea?',
    ['Boil water, add the tea, pour into a cup', 'Pour into a cup, add the tea, boil water', 'Add the tea, pour into a cup, boil water', 'Pour into a cup, boil water, add the tea'], 0,
    'Steps must happen in a sensible order. Programs are the same: the computer runs instructions top to bottom.', S),

  // ---------------- Variables and data types ----------------
  mc('dq-vr-1', 'disc.variables', 1, 'In programming, a variable is a named box that stores a value. After running this, what is stored in the box called age?',
    ['20', 'age', '19', 'Nothing'], 0,
    'The line age = 20 puts the value 20 into the variable named age.', code('age = 20', P)),
  mc('dq-vr-2', 'disc.variables', 1, 'Programs store different kinds of data. Which of these is text (called a "string")?',
    ['"Lahore"', '42', '3.5', 'True'], 0,
    'Text values are written in quotes and are called strings. 42 and 3.5 are numbers; True is a yes/no value (boolean).'),
  mc('dq-vr-3', 'disc.variables', 2, 'A variable can be given a new value. What does this program print?',
    ['10', '5', '15', 'score'], 0,
    'score first holds 5, then the second line replaces it with 10, so print shows 10.', code('score = 5\nscore = 10\nprint(score)', P)),
  mc('dq-vr-4', 'disc.variables', 2, 'What does this program print? (The + sign adds numbers together.)',
    ['7', '34', '3 + 4', 'x + y'], 0,
    'x holds 3 and y holds 4, so x + y is 7.', code('x = 3\ny = 4\nprint(x + y)', P)),

  // ---------------- Conditions and loops ----------------
  mc('dq-ct-1', 'disc.control', 1, 'An "if" statement runs code only when a condition is true. What does this program print?',
    ['Pass', 'Fail', 'Pass Fail', 'Nothing'], 0,
    'marks is 70, and 70 >= 50 is true, so the program prints Pass.', code('marks = 70\nif marks >= 50:\n    print("Pass")\nelse:\n    print("Fail")', P)),
  mc('dq-ct-2', 'disc.control', 1, 'A loop repeats instructions. How many times does this loop print "Hi"?',
    ['3 times', '2 times', '1 time', '4 times'], 0,
    'range(3) gives 0, 1 and 2 - three values - so the body runs three times.', code('for i in range(3):\n    print("Hi")', P)),
  mc('dq-ct-3', 'disc.control', 2, 'This program should print "Adult" for ages 18 and over, but for an 18-year-old it prints nothing. Which line is the problem?',
    ['if age > 18:  (it should be age >= 18)', 'age = 18  (18 is not a valid age)', 'print("Adult")  (it needs two quotes)', 'There is no problem with this code'], 0,
    'age > 18 is false when age is exactly 18. Using >= includes 18 itself.', code('age = 18\nif age > 18:\n    print("Adult")', P)),
  mc('dq-ct-4', 'disc.control', 2, 'A shop wants to give a discount to every customer in a list of 500 names. Which programming idea saves writing the same line 500 times?',
    ['A loop', 'A password', 'A comment', 'A font'], 0,
    'A loop repeats the same steps for each item, so you write the instructions once.', S),

  // ---------------- Algorithms and problem solving ----------------
  mc('dq-al-1', 'disc.algorithms', 1, 'An algorithm is a step-by-step method for solving a problem. Which of these is an algorithm?',
    ['A recipe for baking a cake', 'A photo of a finished cake', 'The colour of a birthday cake', 'The price of a cake in a shop'], 0,
    'A recipe lists clear steps in order to reach a result - that is exactly what an algorithm is.'),
  mc('dq-al-2', 'disc.algorithms', 2, 'You are looking for a word in a printed dictionary, which is sorted A-Z. What is the fastest sensible way?',
    ['Open near the middle, then go left or right', 'Read every page, starting from the very first', 'Open random pages until you happen to find it', 'Start from the last page and work backwards'], 0,
    'Because the list is sorted, you can repeatedly halve the search. Computers use this idea too (binary search).', S),
  mc('dq-al-3', 'disc.algorithms', 2, 'To find the largest number in the list 4, 9, 2, 7 you look at each number and remember the biggest so far. What do you remember after looking at all four?',
    ['9', '7', '4', '2'], 0,
    'Biggest so far: 4, then 9, then 9 (2 is smaller), then 9 (7 is smaller). The answer is 9.', P),
  mc('dq-al-4', 'disc.algorithms', 1, 'A big problem feels too hard to solve at once. What do programmers usually do first?',
    ['Break it into smaller steps', 'Give up and start a new one', 'Make the problem even bigger', 'Wait for it to solve itself'], 0,
    'Breaking a problem into smaller pieces (decomposition) is the most common first step in programming.', S),

  // ---------------- Working with data ----------------
  mc('dq-dt-1', 'disc.data', 1, 'A list keeps several values in order. In many languages counting starts from 0. What does this program print?',
    ['20', '10', '30', 'Error'], 0,
    'Position 0 holds 10 and position 1 holds 20, so nums[1] is 20.', code('nums = [10, 20, 30]\nprint(nums[1])', P)),
  mc('dq-dt-2', 'disc.data', 1, 'A school keeps student names and marks in rows and columns. What is this kind of data arrangement called?',
    ['A table', 'A loop', 'A password', 'A browser'], 0,
    'Rows and columns form a table - the way spreadsheets and databases organise data.'),
  mc('dq-dt-3', 'disc.data', 2, 'The marks of five students are 60, 70, 80, 90 and 100. What is the average (mean)?',
    ['80', '70', '90', '400'], 0,
    'Add them (400) and divide by how many there are (5): 400 / 5 = 80.', P),
  mc('dq-dt-4', 'disc.data', 2, 'A survey sheet has the city written as "Lahore", "lahore" and "LAHORE". Why might a program count three cities instead of one?',
    ['Computers treat different capital letters as different text', 'Lahore is too long a word for a computer to store properly', 'The survey sheet must have a broken or a missing column', 'Computers cannot count city names, only numbers in a list'], 0,
    'To a computer, "Lahore" and "LAHORE" are different text. Cleaning data makes the spelling consistent first.', S),

  // ---------------- Internet and web basics ----------------
  mc('dq-wb-1', 'disc.web', 1, 'When you open a website, your browser asks another computer for the page. What is that other computer called?',
    ['A server', 'A printer', 'A keyboard', 'A charger'], 0,
    'A server is a computer that stores websites and sends pages to browsers (the clients) when they ask.'),
  mc('dq-wb-2', 'disc.web', 1, 'Web pages are built with HTML. What is HTML mainly used for?',
    ['Describing the content and structure of a page', 'Making the computer\'s battery last longer', 'Storing passwords inside the computer', 'Connecting the computer to the power'], 0,
    'HTML describes headings, paragraphs, images and links. CSS adds style, and JavaScript adds behaviour.'),
  mc('dq-wb-3', 'disc.web', 2, 'A website address starts with https:// instead of http://. What does the extra "s" tell you?',
    ['The connection is encrypted (secure)', 'The website is slower to load pages', 'The site has more pages for visitors', 'The site is meant only for students'], 0,
    'The "s" stands for secure: data between your browser and the site is encrypted so others cannot read it.'),
  mc('dq-wb-4', 'disc.web', 2, 'You click a link and see "404 Not Found". What does this usually mean?',
    ['The page you asked for does not exist', 'Your computer has run out of battery', 'The website has 404 visitors right now', 'Your keyboard has stopped working'], 0,
    '404 is a status code meaning the server could not find the requested page - often a broken or mistyped link.', S),

  // ---------------- How software is built ----------------
  mc('dq-sw-1', 'disc.software', 1, 'Programmers call a mistake in a program that makes it behave wrongly a ... what?',
    ['A bug', 'A byte', 'A pixel', 'A cable'], 0,
    'A bug is an error in a program. Finding and fixing bugs is called debugging.'),
  mc('dq-sw-2', 'disc.software', 1, 'Before releasing an app, a team tries it out to find problems. What is this activity called?',
    ['Testing', 'Painting', 'Charging', 'Typing'], 0,
    'Testing checks that software works as expected before real users rely on it.', S),
  mc('dq-sw-3', 'disc.software', 2, 'Tools such as Git keep a history of every change to a project\'s code. Why is this useful?',
    ['You can see what changed and go back to an older version', 'It makes the computer screen brighter and sharper', 'It stops anyone from ever making a mistake again', 'It turns code into pictures for the website'], 0,
    'Version control records each change, so teams can review work, find when a bug appeared and undo mistakes.'),
  mc('dq-sw-4', 'disc.software', 2, 'This program crashes. Which line causes the error?',
    ['print(nmae)  - "nmae" is misspelt and was never created', 'name = "Sara"  - names cannot be stored in variables', 'There is no error - the program prints Sara', 'Both lines are wrong because Python needs semicolons'], 0,
    'The variable is called name, but the second line asks for nmae, which does not exist, so Python reports an error.', code('name = "Sara"\nprint(nmae)', P)),
];
