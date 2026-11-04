'use strict';
/**
 * Length-balanced distractors, common CS bank. id: [wrong1, wrong2, wrong3]
 * (replaces the wrong options in their original order), or
 * { r: shorter correct text, w: [...] } when the correct option was trimmed.
 */
module.exports = {
  'cs-lg-08': ['y % 4 == 0 and (y % 100 == 0 or y % 400 != 0)', '(y % 4 == 0 or y % 100 != 0) and y % 400 == 0', '(y % 100 != 0 and y % 400 == 0) or y % 4 != 0'],
  'cs-cf-01': ['RAM (main memory)', 'SSD (storage drive)', 'GPU driver software'],
  'cs-cf-05': ['A Python script that an interpreter runs', 'An HTML page that a browser displays', 'A bytecode file that only a JVM can run'],
  'cs-cf-06': ['Encrypts the page so nobody can read it on the way', 'Stores your saved passwords for that website', 'Compresses the page so it downloads faster'],
  'cs-ds-03': ['A list of names you scan from the first item', 'A stack where you pop names until you find it', 'A sorted string of all names joined with commas'],
  'cs-ds-06': ['O(1) - the same time for any n', 'O(log n) - halves the work each step', 'O(n^2) - grows with the square of n'],
  'cs-gt-01': ['Uploads your local repository and history to GitHub', 'Creates a new empty branch on the remote server', 'Copies only the latest files, without any history'],
  'cs-gt-04': ['A backup copy of the repository stored on another drive', 'A list of files and folders that Git should ignore', 'A separate remote server that holds a copy of the code'],
  'cs-gt-05': ['Sends your local commits to the remote and updates its branch', 'Undoes your last commit and puts its changes back in your files', 'Shows the differences between your files and the last commit'],
  'cs-gt-06': ['Storing your Git username and password so pushes do not ask', 'Listing the collaborators who are allowed to push to the repository', 'Recording which files were deleted, such as old builds or logs'],
  'cs-db-01': ['TypeError: input() returns a value print() cannot display', 'SyntaxError: strings cannot be joined together with +', 'NameError: the program needs a main() function to start'],
  'cs-db-04': ['The list holds the wrong type of data, such as text where numbers were expected', 'The list has grown too large to fit in memory, such as a list of a billion items', 'The list was not sorted before searching, such as calling index() on random data'],
  'cs-db-05': ['It prints 0 because an empty list has no total', 'It prints None because sum([]) returns nothing', 'It prints an empty line because the list is empty'],
  'cs-db-06': ['Rewrite the whole program from scratch in a cleaner style', 'Add more features until the wrong totals stop appearing', 'Ask a friend to run it on their computer to see if it works'],
  'cs-cf-s1': ['CPU: the processor is too slow, so buy a faster one', 'Disk: the hard drive is full, so delete large files', 'Display: lower the screen resolution to free resources'],
  'cs-ds-p1': ['counts[w] = counts[w] + 1', 'counts.append(w)', 'counts[w] = counts.get(w) + 1'],
  'cs-gt-s1': ['Delete your local copy, clone the repository again and redo your change on top', 'Force-push your version so the remote matches your file, then tell your teammate', 'Run git reset --hard to throw away both sets of changes and start the line again'],
  'cs-pf-s2': ['Copy the same three lines into each of the five screens so they stay independent', 'Ask the developer of each screen to write their own version of the discount', 'Store the discounted prices in a file by hand and read them on every screen'],
  'cs-cf-s2': ['Nothing yet: laptops rarely fail, so back up once the project is finished', 'Print the code on paper so you can type it in again if something goes wrong', 'Rename the folder to "FINAL" so you do not overwrite it by accident later'],
  'cs-gt-p2': ['Push it now, then delete the file in the next commit so the passwords disappear', 'Rename the file to env.txt so Git treats it as a normal text file and hides it', 'Delete the whole repository folder and start a new one without the .env file'],
  'cs-gt-s2': ['Email the zip files more often and add the date and time to every file name', 'Let only one student write all of the code while the other two test it', 'Keep three separate copies and copy changes between them by hand each week'],
  'cs-db-s2': ['Your friend\'s computer is too slow, so Python gives up before the file loads', 'Python can only read CSV files that were created on the same computer', 'The file is too small for pandas to detect, so it is reported as missing'],
  'm-cs-programming-s1': ['Three separate variables, such as name = "Ali", age = 20 and city = "Multan"', 'A single string with commas, such as "Ali,20,Multan", split when needed', 'A list such as ["Ali", 20, "Multan"], read with positions 0, 1 and 2'],
  'm-cs-programming-t3': ['[1] then [2]', '[] then []', '[1] then [1]'],
  'm-cs-logic-s1': ['Test each bulb one by one: up to 8 tests', 'Test pairs of bulbs together: up to 4 tests', 'Test 4 random bulbs, then the rest: 5 tests'],
  'm-cs-computing-p1': ['The hard disk (storage)', 'The CPU cache only', 'ROM (firmware chip)'],
  'm-cs-computing-s1': ['The CPU is overheating, so it lowers its clock speed', 'The Wi-Fi signal is weak, so pages load from the disk', 'The browser cache is full, so the disk keeps cleaning it'],
  'm-cs-computing-t3': ['Processes share one memory space; each thread has its own separate memory', 'They are identical: "thread" is just the Windows name for a process', 'Threads always run on separate computers, while processes share one CPU'],
  'm-cs-dsa_basics-t3': ['Hash tables keep keys sorted, so lookups use binary search; unsorted tables degrade to O(n)', 'Keys are checked one by one each time, but most tables are small, so it feels like O(1)', 'Hashing a key is O(n) in its length, so long keys are slow and short keys are O(1)'],
  'm-cs-git_tools-s1': ['Edit main directly and undo it later if needed', 'Copy the folder and email the copy to yourself', 'Commit to main but do not push until it works'],
  'm-cs-git_tools-t3': ['Rebase keeps both histories and adds a merge commit; merge replays your commits on top of main', 'They are identical: rebase is only the older name for merge, kept for backwards compatibility', 'Merge works only on local branches, while rebase is the only way to update from the remote main'],
  'm-cs-git_tools-p3': ['Delete the file in a new commit and push; that removes it from the repository and its history', 'Rename the file and add it to .gitignore; Git then stops showing it in every earlier commit', 'Make the repository private, then remove the file; nobody else can see the old commits after that'],
  'm-cs-debugging-p1': ['Add a semicolon at the end of the print line', 'Wrap the print in a try/except NameError block', 'Change 5 to "5" so total becomes a string'],
  'm-cs-debugging-s1': ['Rewrite the whole function in a simpler style and hope the bug goes', 'Add random small changes to the code until the total looks right', 'Run it with a much larger input to see if the error grows bigger'],
  'm-cs-debugging-t3': ['Test all 64 commits one by one, newest first', 'Revert all 64 commits, then re-apply them in order', 'Read every diff and guess which commit looks risky'],
  'm-cs-debugging-s3': ['Declare it impossible to fix because it never happens locally, and close the bug report', 'Restart production every hour so the bug has less time to appear, and keep watching it', 'Rewrite the whole feature from scratch so the bug disappears, without finding its cause'],
};
