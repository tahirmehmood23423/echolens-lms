'use strict';
/** Backend Developer track assessment. Code samples use Python and SQL. */
const { mc, out } = require('../q');

module.exports = [
  // ---- Server-side programming ----
  out('be-pg-01', 'be.programming', 1, 'What does this print?', 'def area(w, h=2):\n    return w * h\n\nprint(area(5))', ['10'],
    'h falls back to its default of 2, so area(5) is 5 * 2 = 10.'),
  mc('be-pg-02', 'be.programming', 2, 'You need to check very quickly whether an email address is already registered, among 100,000 emails. Which Python structure fits best?', ['A set of emails', 'A list of emails', 'A string with all emails joined', 'A tuple of emails'], 0,
    'Membership tests on a set (and on dictionary keys) are constant time on average. A list must be scanned, which is linear.'),
  out('be-pg-03', 'be.programming', 2, 'What does this print?', 'users = [{"name": "Ali", "age": 20}, {"name": "Sara", "age": 17}]\nadults = [u["name"] for u in users if u["age"] >= 18]\nprint(",".join(adults))', ['Ali'],
    'The comprehension keeps names of users aged 18 or over - only Ali - and join produces "Ali".'),
  mc('be-pg-04', 'be.programming', 2, 'What does json.dumps({"a": 1}) return?', ['The string \'{"a": 1}\'', 'A dictionary', 'A file on disk', 'The number 1'], 0,
    'dumps ("dump string") serialises a Python object to a JSON string. json.loads goes the other way.'),
  out('be-pg-05', 'be.programming', 3, 'What does this print?', 'class Account:\n    def __init__(self, balance):\n        self.balance = balance\n\n    def withdraw(self, amount):\n        if amount > self.balance:\n            raise ValueError("insufficient")\n        self.balance -= amount\n\na = Account(100)\na.withdraw(30)\nprint(a.balance)', ['70'],
    '30 is not more than 100, so no error is raised and the balance drops to 70.'),

  // ---- HTTP and REST APIs ----
  mc('be-ht-01', 'be.http', 1, 'Which HTTP method is meant for reading data without changing anything on the server?', ['GET', 'POST', 'DELETE', 'PATCH'], 0,
    'GET retrieves a resource and should have no side effects. POST, PATCH and DELETE change state.'),
  mc('be-ht-02', 'be.http', 1, 'Which status code means a new resource was created?', ['201 Created', '200 OK', '204 No Content', '302 Found'], 0,
    '201 tells the client a resource was created (often with a Location header). 200 is a generic success.'),
  mc('be-ht-03', 'be.http', 2, 'A signed-in student calls an admin-only endpoint. Which status should the API return?', ['403 Forbidden', '401 Unauthorized', '404 Not Found', '500 Internal Server Error'], 0,
    '401 means "we do not know who you are" (not authenticated). 403 means "we know who you are, but you are not allowed".'),
  mc('be-ht-04', 'be.http', 2, 'Which is the most RESTful way to fetch the student with id 42?', ['GET /students/42', 'POST /getStudent?id=42', 'GET /students?action=get&id=42', 'DELETE /students/42'], 0,
    'REST names resources with nouns in the path and uses the HTTP method for the action.'),
  mc('be-ht-05', 'be.http', 2, 'Which methods are expected to be idempotent (repeating the request has the same effect as sending it once)? Select all that apply.', ['GET', 'PUT', 'DELETE', 'POST'], [0, 1, 2],
    'GET, PUT and DELETE are idempotent by definition. POST generally is not: sending it twice can create two records.'),

  // ---- SQL and database design ----
  mc('be-sq-01', 'be.sql', 1, 'Which query returns every row and column from the students table?', ['SELECT * FROM students;', 'GET ALL students;', 'SELECT students;', 'SHOW students *;'], 0,
    'SELECT * FROM table returns all columns of all rows.'),
  mc('be-sq-02', 'be.sql', 2, 'Which query counts students in each city?', ['SELECT city, COUNT(*) FROM students GROUP BY city;', 'SELECT COUNT(city) FROM students;', 'SELECT city FROM students ORDER BY COUNT(*);', 'SELECT DISTINCT COUNT(*) FROM students;'], 0,
    'GROUP BY city makes one group per city, and COUNT(*) counts the rows in each group.'),
  mc('be-sq-03', 'be.sql', 2, 'What does a LEFT JOIN from students to enrollments return?', ['Every student, with enrollment columns filled where a match exists and NULL where none does', 'Only students who have enrollments', 'Only enrollments without students', 'Every possible student-enrollment pair'], 0,
    'LEFT JOIN keeps all rows from the left table. Rows without a match get NULLs for the right table\'s columns.'),
  mc('be-sq-04', 'be.sql', 2, 'What does a PRIMARY KEY guarantee?', ['Each row has a unique, non-null identifier', 'The column is encrypted', 'The table is sorted by that column', 'The column can be left empty'], 0,
    'A primary key is unique and NOT NULL, so every row can be identified reliably. Most databases also index it.'),
  mc('be-sq-05', 'be.sql', 3, 'This query should list students with no enrollment, but it returns no rows. What is the fix?', ['Use WHERE e.student_id IS NULL', 'Use INNER JOIN instead of LEFT JOIN', 'Use WHERE e.student_id = 0', 'Remove the WHERE clause'], 0,
    'Comparing anything to NULL with = gives NULL (unknown), never true. Missing matches must be tested with IS NULL.',
    { type: 'debug', practical: true, code: 'SELECT s.name\nFROM students s\nLEFT JOIN enrollments e ON e.student_id = s.id\nWHERE e.student_id = NULL;' }),

  // ---- Authentication and authorization ----
  mc('be-au-01', 'be.auth', 1, 'What is the difference between authentication and authorization?', ['Authentication checks who you are; authorization checks what you are allowed to do', 'They are the same thing', 'Authorization checks who you are; authentication checks what you may do', 'Authentication is only for admins'], 0,
    'Logging in is authentication. Deciding whether that user may delete a course is authorization.'),
  mc('be-au-02', 'be.auth', 2, 'How should user passwords be stored?', ['As a salted hash from a slow algorithm such as bcrypt or Argon2', 'In plain text so support can read them', 'Encrypted with a key kept in the same database', 'As an MD5 hash'], 0,
    'Slow, salted password hashes make stolen databases expensive to crack. MD5 is far too fast, and reversible encryption exposes every password if the key leaks.'),
  mc('be-au-03', 'be.auth', 2, 'Where must you check that a user is allowed to edit a record?', ['On the server, on every request that changes it', 'Only in the frontend, by hiding the edit button', 'Only when the user logs in', 'In the browser\'s localStorage'], 0,
    'Anyone can call your API directly, so hiding a button is not protection. The server must authorize each request.'),
  mc('be-au-04', 'be.auth', 2, 'Which statement about a standard signed JWT is true?', ['Anyone holding it can read the payload; the signature only stops tampering', 'The payload is encrypted so nobody can read it', 'It can never expire', 'It must be stored in the database to work'], 0,
    'A JWT payload is base64url-encoded, not encrypted. Never put secrets in it; the signature proves it was not modified.'),
  mc('be-au-05', 'be.auth', 3, 'GET /api/orders/:id returns any order to any signed-in user. What is the vulnerability?', ['Broken object-level authorization (IDOR): it must check the order belongs to the requesting user', 'SQL injection', 'Cross-site scripting', 'There is no problem because the user is signed in'], 0,
    'Being signed in is not enough. Changing the id in the URL would reveal other people\'s orders, so ownership must be checked on the server.', { type: 'scenario', practical: true }),

  // ---- Server-side architecture ----
  mc('be-ar-01', 'be.architecture', 1, 'Why keep database passwords in environment variables rather than in the code?', ['Secrets stay out of the repository and can differ per environment', 'Environment variables are faster', 'Code cannot read passwords', 'It makes the database larger'], 0,
    'Committed secrets leak through repositories and backups. Environment configuration keeps them separate and lets staging and production differ.'),
  mc('be-ar-02', 'be.architecture', 2, 'What is the main trade-off of caching an expensive query result?', ['Faster responses, but the cached data can become stale', 'Better security, but slower responses', 'Less memory use, but more database load', 'There is no trade-off'], 0,
    'A cache avoids repeating work but must be invalidated or expire so users do not see outdated data.'),
  mc('be-ar-03', 'be.architecture', 2, 'Where should business rules such as "a student can enrol in at most two courses" live?', ['In a service layer that route handlers call, so the rule is reusable and testable', 'Copied into each route handler', 'Only in the frontend', 'In CSS'], 0,
    'Keeping rules in one service layer means every entry point enforces them the same way and they can be unit-tested without HTTP.'),
  mc('be-ar-04', 'be.architecture', 2, 'A request handler sends 500 emails before responding, so requests time out. What is the better design?', ['Queue the emails as a background job and respond immediately', 'Increase the request timeout to 10 minutes', 'Send the emails from the user\'s browser', 'Send fewer emails'], 0,
    'Slow work belongs in a background worker or queue. The request records the job and returns quickly.', { type: 'scenario' }),
  mc('be-ar-05', 'be.architecture', 3, 'An endpoint returns all 1,000,000 rows of a table at once. What is the standard fix?', ['Paginate with a limit and a cursor or offset', 'Compress the response only', 'Ask clients to have more RAM', 'Return the rows in random order'], 0,
    'Pagination bounds the work per request. Cursor (keyset) pagination stays fast on large tables; OFFSET slows down as it grows.'),

  // ---- Error handling ----
  mc('be-er-01', 'be.errors', 1, 'What is a try/except block for in Python?', ['Handling errors that may occur, instead of letting the program crash', 'Making code run faster', 'Defining a new class', 'Repeating code in a loop'], 0,
    'Code that might raise an exception goes in try; except handles specific exceptions so the program can recover or report clearly.'),
  out('be-er-02', 'be.errors', 2, 'What does this print?', 'def parse(s):\n    try:\n        return int(s)\n    except ValueError:\n        return -1\n\nprint(parse("12") + parse("x"))', ['11'],
    'parse("12") returns 12. int("x") raises ValueError, so parse("x") returns -1. 12 + (-1) = 11.'),
  mc('be-er-03', 'be.errors', 2, 'A client sends a request body that is not valid JSON. Which status code is appropriate?', ['400 Bad Request', '500 Internal Server Error', '200 OK', '404 Not Found'], 0,
    'The problem is the client\'s input, so it is a 4xx error. 400 signals a malformed request.'),
  mc('be-er-04', 'be.errors', 2, 'An unexpected exception happens while handling a request in production. What should the API do?', ['Log full details on the server and return a 500 with a generic message', 'Return the full stack trace to the client', 'Return 200 with an empty body', 'Restart the whole server'], 0,
    'Stack traces can leak internals. Clients get a safe message; the details go to your logs for debugging.'),
  mc('be-er-05', 'be.errors', 3, 'When does a `finally` block run?', ['Always - whether the try block succeeds, raises, or returns', 'Only when an exception is raised', 'Only when no exception is raised', 'Only if except re-raises'], 0,
    'finally runs on every exit path, which makes it the place for cleanup such as closing files or connections.'),

  // ---- Backend testing ----
  mc('be-ts-01', 'be.testing', 1, 'What is a unit test?', ['A test of one small piece of code, such as a function, in isolation', 'A test run by real users', 'A test of the whole deployed system', 'A load test'], 0,
    'Unit tests are small and fast and check one unit of behaviour without external systems.'),
  mc('be-ts-02', 'be.testing', 2, 'is_adult(age) should return True from age 18. Which set of test inputs best checks the boundary?', ['17, 18 and 19', '5, 50 and 100', '18 only', '0 and 1000'], 0,
    'Bugs cluster at boundaries (for example > versus >=). Testing just below, at and just above 18 catches them.'),
  mc('be-ts-03', 'be.testing', 2, 'Why mock the payment gateway when testing your checkout code?', ['So tests are fast, repeatable and never charge real money', 'Because mocks are more accurate than the real gateway', 'To make the code run faster in production', 'Mocks are required by Python'], 0,
    'A mock stands in for an external dependency so you can test your own logic, including failure cases, deterministically.'),
  mc('be-ts-04', 'be.testing', 2, 'Which is an integration test?', ['Calling your API endpoint against a real test database and checking the stored row', 'Checking that a helper adds two numbers', 'Reviewing code by eye', 'Measuring page load time'], 0,
    'Integration tests check that components work together - here the API, its data layer and the database.'),
  mc('be-ts-05', 'be.testing', 3, 'A test passes on your laptop but fails randomly in CI. What is the most likely cause?', ['It is flaky: it depends on timing, test order or shared state', 'CI servers cannot run tests', 'The test is too short', 'Your laptop is faster, so the code is correct'], 0,
    'Random failures usually come from hidden dependencies such as time, ordering or shared data. Isolate each test\'s data and remove timing assumptions.', { type: 'scenario' }),

  // ---- Security fundamentals ----
  mc('be-se-01', 'be.security', 1, 'What is the standard defence against SQL injection?', ['Parameterised queries (prepared statements)', 'Hiding the database port', 'Using longer table names', 'Escaping only single quotes by hand'], 0,
    'Parameters send data separately from the SQL text, so input can never change the query\'s structure.'),
  mc('be-se-02', 'be.security', 2, 'What is wrong with this login query, and how should it be fixed?', ['It allows SQL injection; pass email as a query parameter', 'Nothing is wrong', 'It is slow; add an index', 'It should use SELECT email instead of *'], 0,
    'An email such as \' OR \'1\'=\'1 rewrites the query. Use a placeholder (for example WHERE email = $1) and pass the value separately.',
    { type: 'debug', practical: true, code: 'query = "SELECT * FROM users WHERE email = \'" + email + "\'"\ncursor.execute(query)' }),
  mc('be-se-03', 'be.security', 2, 'What does HTTPS protect?', ['Data travelling between the browser and the server, against eavesdropping and tampering', 'Data stored in your database', 'Your server from all attacks', 'Users\' passwords from being weak'], 0,
    'TLS encrypts and authenticates traffic in transit. Data at rest and application bugs need separate protection.'),
  mc('be-se-04', 'be.security', 2, 'Why rate-limit the login endpoint?', ['To slow down brute-force password guessing', 'To make the site faster for everyone', 'To reduce database size', 'Because browsers require it'], 0,
    'Limiting attempts per account or IP makes guessing passwords impractically slow.'),
  mc('be-se-05', 'be.security', 2, 'User comments are inserted into a page with innerHTML. What attack does this enable, and what fixes it?', ['Cross-site scripting (XSS); escape output or insert it as text', 'SQL injection; use an ORM', 'CSRF; use GET requests', 'DDoS; add caching'], 0,
    'A comment containing <script> or an onerror attribute would run in other users\' browsers. Escape HTML or use textContent.'),
];
