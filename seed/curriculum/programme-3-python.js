'use strict';

/**
 * EchoLens Curriculum seed data - Programme 3: Python Programming and
 * Algorithmic Design. Transcribed verbatim from
 * EchoLens_Course_and_Module_Handbook.pdf (pages 27-38). See
 * programme-1-c.js for the video-URL note.
 */
module.exports = {
  code: 'P3',
  name: 'Python Programming and Algorithmic Design',
  courses: [
    {
      code: 'PY3.1',
      title: 'Python Programming Foundations: Think Like an Engineer, Not a Script Writer',
      level: 'Beginner',
      order_no: 1,
      capstone_artifact: 'TaskFlow Productivity and Habit Analytics Suite',
      modules: [
        {
          order_no: 1,
          title: 'Objects, Names and How Python Really Stores Data',
          learning_outcome: 'Explain the difference between a name and an object, and predict mutation behaviour.',
          sections: {
            videos: [
              { channel: 'Fireship', title: 'Python in 100 Seconds', length: '2 min' },
              { channel: 'mCoding', title: 'Python Variables Are Not Boxes', length: '9 min' },
              { channel: 'Corey Schafer', title: 'Python Tutorial: f Strings', length: '10 min' },
            ],
            reading: "In Python a variable is a name bound to an object, not a box holding a value. This single model explains almost every surprise a beginner meets: why assigning one list to another name lets both change it, why an integer comparison with the identity operator sometimes works and sometimes does not, and why a mutable default argument keeps its contents between calls. Formatted string literals are the modern way to build output, and they evaluate the expression inside the braces at the point of formatting.",
            rules: [
              'Assignment binds a name to an object. It never copies the object.',
              'Mutable objects such as lists and dictionaries can be changed through any name bound to them.',
              'Use the equality operator to compare values and the identity operator only to compare with None.',
              'Never use a mutable object as a default argument. It is created once, at definition time.',
            ],
            example: {
              caption: 'Two names, one list, and the fix',
              language: 'python',
              code: `a = [1, 2, 3]
b = a          # same object
b.append(4)
print(a)       # [1, 2, 3, 4]

c = a.copy()   # new object
c.append(5)
print(a, c)    # [1, 2, 3, 4] [1, 2, 3, 4, 5]`,
            },
          },
          assignments: [
            { title: 'Assignment 1.1: Predict the mutation', brief: 'For eight code fragments, predict the printed output before running, then explain every mismatch.', pass_criteria: 'At least six correct with written reasons for the rest.' },
            { title: 'Assignment 1.2: Type converter', brief: 'Write a converter that turns user strings into integers, floats or booleans with a clear rejection for anything else.', pass_criteria: 'All hidden tests pass including empty input and leading spaces.' },
          ],
          project: { title: 'Input validation toolkit', brief: 'Build a reusable validation toolkit that parses and checks numbers, dates, emails and phone numbers from raw text and returns a structured report of what passed and why the rest failed.' },
        },
        {
          order_no: 2,
          title: 'Branching, Search and Numeric Tolerance',
          learning_outcome: 'Implement search strategies and handle floating point comparison correctly.',
          sections: {
            videos: [
              { channel: 'Fireship', title: 'Big O Notation in 100 Seconds', length: '3 min' },
              { channel: 'Computerphile', title: 'Binary Search', length: '9 min' },
            ],
            reading: "Exhaustive search tries every candidate and is the right first answer when the space is small, because it is easy to prove correct. Bisection is the right answer when the space is ordered, because halving the interval each step reaches any precision in a logarithmic number of steps. Both require care with floating point: a loop that waits for two floats to become exactly equal may never terminate, so the exit condition is always expressed as a tolerance on the difference.",
            rules: [
              'Exhaustive search cost grows with the size of the space. Bisection cost grows with the logarithm of it.',
              'Steps needed to reach tolerance t over a range r is the logarithm to base 2 of r divided by t.',
              'Compare floats with an absolute or relative tolerance, never with equality.',
              'Boolean operators short circuit, so the protective test goes on the left.',
            ],
            example: {
              caption: 'Bisection with an explicit tolerance and step ceiling',
              language: 'python',
              code: `def root(f, lo, hi, tol=1e-9, max_steps=200):
    for _ in range(max_steps):
        mid = (lo + hi) / 2
        if hi - lo < tol:
            return mid
        lo, hi = (lo, mid) if f(lo) * f(mid) <= 0 else (mid, hi)
    raise ValueError("no convergence in range")`,
            },
          },
          assignments: [
            { title: 'Assignment 2.1: Tolerance defects', brief: 'Three supplied loops never terminate for some inputs. Diagnose and repair each.', pass_criteria: 'All three terminate for every supplied input.' },
            { title: 'Assignment 2.2: Search comparison', brief: 'Implement exhaustive and bisection square root and compare step counts across five inputs.', pass_criteria: 'Both correct and a written growth comparison.' },
          ],
          project: { title: 'Equation solver', brief: 'Build a solver that finds real roots of a user supplied polynomial within a chosen interval and precision, reporting the number of iterations and warning when no sign change is bracketed.' },
        },
        {
          order_no: 3,
          title: 'Functions, Scope and Higher Order Design',
          learning_outcome: 'Decompose a problem into pure functions and pass behaviour as an argument.',
          sections: {
            videos: [
              { channel: 'Corey Schafer', title: 'Python Tutorial: Scope, LEGB Rule', length: '12 min' },
              { channel: 'Corey Schafer', title: 'Python Tutorial: Lambda Functions', length: '9 min' },
              { channel: 'mCoding', title: 'Higher order functions in Python', length: '10 min' },
            ],
            reading: "Python resolves names by looking in the local scope, then any enclosing scope, then the module scope, then the built ins. Knowing that order explains why assigning to a name inside a function makes it local for the whole function, even before the assignment line. Functions being ordinary objects is the other half of the module: a function can be stored in a list, passed to another function and returned from one, which is how strategies are expressed without a hierarchy of classes.",
            rules: [
              'Name resolution order: local, enclosing, global, built in. First match wins.',
              'Assigning to a name anywhere in a function makes it local throughout that function.',
              'A pure function returns the same output for the same input and changes nothing outside itself. Prefer it.',
              'Passing a function as an argument replaces a whole family of conditional branches.',
            ],
            example: {
              caption: 'Behaviour passed as an argument, and composition',
              language: 'python',
              code: `def compose(f, g):
    return lambda x: f(g(x))

def derivative(f, h=1e-6):
    return lambda x: (f(x + h) - f(x - h)) / (2 * h)

slope_of_square = derivative(lambda x: x * x)
print(round(slope_of_square(3), 4))  # 6.0`,
            },
          },
          assignments: [
            { title: 'Assignment 3.1: Scope trace', brief: 'Predict the output of six scope puzzles and explain each.', pass_criteria: 'At least four correct with written reasoning.' },
            { title: 'Assignment 3.2: Strategy refactor', brief: 'Replace a function containing a six branch conditional with a dictionary of functions.', pass_criteria: 'Identical behaviour, no conditional remaining.' },
          ],
          project: { title: 'Numerical function toolkit', brief: 'Build a toolkit that accepts any single variable function and returns its numerical derivative, its definite integral and a table of values, all through higher order composition.' },
        },
        {
          order_no: 4,
          title: 'Sequences, Slicing and Comprehensions',
          learning_outcome: 'Transform sequences declaratively and reason about copying versus aliasing.',
          sections: {
            videos: [
              { channel: 'Corey Schafer', title: 'Python Tutorial: Comprehensions', length: '12 min' },
              { channel: 'mCoding', title: 'Python slicing explained', length: '8 min' },
            ],
            reading: "Slicing produces a new list, which makes it the simplest way to copy a sequence and also the reason a slice inside a loop can quietly turn a linear algorithm into a quadratic one. Comprehensions are not merely shorter loops: they express a transformation as a single expression, which reads as a statement of intent and is usually faster because the loop machinery runs in the interpreter core. Nested comprehensions are where readability breaks, and the rule of thumb is two levels maximum.",
            rules: [
              'Slice notation is start, stop, step. The stop index is excluded. A negative step reverses.',
              'A full slice produces a shallow copy. Nested objects inside it are still shared.',
              'A comprehension replaces the build a list then append pattern and reads as one transformation.',
              'Stop at two levels of nesting in a comprehension. Beyond that, write the loop.',
            ],
            example: {
              caption: 'Slicing and a two clause comprehension',
              language: 'python',
              code: `data = [4, 9, 2, 7, 5, 1]
print(data[::-1])          # reversed copy
print(data[1:5:2])         # [9, 7]

pairs = [(x, y) for x in range(1, 4) for y in range(1, 4) if x != y]
print(pairs)`,
            },
          },
          assignments: [
            { title: 'Assignment 4.1: Slice puzzles', brief: 'Produce ten required outputs using slicing only, with no loops.', pass_criteria: 'All ten exact.' },
            { title: 'Assignment 4.2: Comprehension conversion', brief: 'Convert six loops into comprehensions and one comprehension back into a loop, explaining why.', pass_criteria: 'Identical output and a written justification.' },
          ],
          project: { title: 'Sequence analytics tool', brief: 'Build a tool that reads a numeric series and reports the longest increasing run, the longest alternating subsequence and a rolling average, using comprehensions and slicing throughout. This project feeds the course final project.' },
        },
      ],
    },
    {
      code: 'PY3.2',
      title: 'Python Data Structures and Object Oriented Design: Build Code That Survives Change',
      level: 'Intermediate',
      order_no: 2,
      capstone_artifact: 'TaskFlow Productivity and Habit Analytics Suite',
      modules: [
        {
          order_no: 1,
          title: 'Dictionaries, Sets and Choosing a Container',
          learning_outcome: 'Select the right container from access pattern and cost rather than habit.',
          sections: {
            videos: [
              { channel: 'Corey Schafer', title: 'Python Tutorial: Dictionary', length: '10 min' },
              { channel: 'mCoding', title: 'Sets in Python', length: '9 min' },
              { channel: 'Fireship', title: 'Hash Tables in 100 Seconds', length: '3 min' },
            ],
            reading: "A dictionary is a hash table, which means lookup by key is constant on average and the keys must be hashable and therefore immutable. A set is the same machinery without values, and it turns membership testing from a linear scan into a constant time check, which is the single most common performance improvement in beginner Python. The correct container is chosen by asking one question: what is the access pattern. Positional access wants a list, keyed access wants a dictionary, membership wants a set.",
            rules: [
              'Dictionary and set lookup is constant on average. List membership testing is linear.',
              'Keys must be hashable, therefore immutable. A list can never be a key, a tuple can.',
              'Set algebra: union, intersection, difference and symmetric difference replace nested loops.',
              'Counting occurrences is a dictionary of counts, or the counter from the standard library.',
            ],
            example: {
              caption: 'Membership and counting done the right way',
              language: 'python',
              code: `words = text.lower().split()
stop = {"the", "and", "of", "a"}     # constant time membership
counts = {}
for w in words:
    if w in stop:
        continue
    counts[w] = counts.get(w, 0) + 1

top = sorted(counts.items(), key=lambda kv: kv[1], reverse=True)[:10]`,
            },
          },
          assignments: [
            { title: 'Assignment 1.1: Container choice', brief: 'For eight described scenarios choose the container and justify in one line.', pass_criteria: 'At least six correct with reasons.' },
            { title: 'Assignment 1.2: Linear to constant', brief: 'Speed up a supplied program by replacing list membership tests.', pass_criteria: 'Identical output and a measured speed up on the large input.' },
          ],
          project: { title: 'Multi file word frequency indexer', brief: 'Build an indexer that scans a folder of text files, builds a term to document map and answers queries with ranked results and per file counts.' },
        },
        {
          order_no: 2,
          title: 'Classes, Properties and Guarded State',
          learning_outcome: 'Design classes whose state cannot be corrupted from outside.',
          sections: {
            videos: [
              { channel: 'Corey Schafer', title: 'Python OOP Tutorial 1: Classes and Instances', length: '15 min' },
              { channel: 'Corey Schafer', title: 'Python OOP Tutorial 2: Class Variables', length: '11 min' },
              { channel: 'Corey Schafer', title: 'Python OOP Tutorial 6: Property Decorators', length: '10 min' },
            ],
            reading: "Python has no private access, only conventions, which shifts the burden of protection onto design. The property decorator is how that is done well: an attribute keeps its simple access syntax while gaining validation on write, so existing calling code never changes. Class attributes versus instance attributes is the other trap in this module, because a class attribute is shared by every instance and a mutable one shared this way produces defects that look like haunting.",
            rules: [
              'A class attribute is shared by all instances. Never make it mutable unless sharing is the intent.',
              'The property decorator adds validation without changing the attribute access syntax used by callers.',
              'A single leading underscore is a convention meaning internal. Nothing enforces it, so document the contract.',
              'Define a readable string representation for every class you will debug, and a precise one for developers.',
            ],
            example: {
              caption: 'A property that guards a state transition',
              language: 'python',
              code: `class Task:
    VALID = {"todo", "doing", "done"}
    def __init__(self, title):
        self.title = title
        self._status = "todo"

    @property
    def status(self):
        return self._status

    @status.setter
    def status(self, value):
        if value not in self.VALID:
            raise ValueError(f"unknown status: {value}")
        self._status = value`,
            },
          },
          assignments: [
            { title: 'Assignment 2.1: Shared state defect', brief: 'A supplied class shares a list between instances. Diagnose and fix.', pass_criteria: 'Instances independent, written explanation correct.' },
            { title: 'Assignment 2.2: Add the guards', brief: 'Convert three plain attributes into validated properties.', pass_criteria: 'All invalid assignment tests raise, valid ones pass unchanged.' },
          ],
          project: { title: 'Guarded task model', brief: 'Build a task class with validated status transitions, priority bounds, due date checking and a readable representation, verified by a suite of misuse tests.' },
        },
        {
          order_no: 3,
          title: 'Dunder Methods and Protocol Design',
          learning_outcome: 'Make your objects behave like built in types by implementing the right protocols.',
          sections: {
            videos: [
              { channel: 'Corey Schafer', title: 'Python OOP Tutorial 5: Special Magic Dunder Methods', length: '13 min' },
              { channel: 'mCoding', title: 'Python dunder methods you should know', length: '11 min' },
            ],
            reading: "Python is built on protocols rather than interfaces. An object is iterable because it implements the iteration protocol, sortable because it implements comparison, printable because it implements string conversion. Implementing these methods is how a custom type stops being a second class citizen and starts working with the whole standard library. Two rules are easy to miss: equality and hashing must agree, and the developer representation should ideally be text that recreates the object.",
            rules: [
              'Implement the string method for users and the representation method for developers.',
              'If two objects compare equal they must hash equal. Define both together or neither.',
              'Implementing less than is enough for sorting. The remaining comparisons can be generated.',
              'Implementing iteration lets your object work with loops, comprehensions and the whole standard library.',
            ],
            example: {
              caption: 'A polynomial type that sorts, prints and adds natively',
              language: 'python',
              code: `class Poly:
    def __init__(self, coeffs): self.c = list(coeffs)
    def __repr__(self): return f"Poly({self.c})"
    def __eq__(self, o):  return isinstance(o, Poly) and self.c == o.c
    def __hash__(self):   return hash(tuple(self.c))
    def __lt__(self, o):  return self.degree() < o.degree()
    def __add__(self, o):
        n = max(len(self.c), len(o.c))
        pad = lambda v: v + [0] * (n - len(v))
        return Poly([x + y for x, y in zip(pad(self.c), pad(o.c))])
    def degree(self): return len(self.c) - 1`,
            },
          },
          assignments: [
            { title: 'Assignment 3.1: Protocol completion', brief: 'Given a partial class, add the representation, equality, hashing and ordering methods.', pass_criteria: 'Object sorts, prints and works as a dictionary key.' },
            { title: 'Assignment 3.2: Custom iterator', brief: 'Implement a class that yields a Fibonacci sequence lazily through the iteration protocol.', pass_criteria: 'Works in a loop and in a comprehension without materialising the whole sequence.' },
          ],
          project: { title: 'Polynomial mathematics type', brief: 'Build a polynomial class supporting addition, multiplication, evaluation, sorting by degree and readable printing, working correctly inside standard library containers.' },
        },
        {
          order_no: 4,
          title: 'Recursion, Backtracking and Divide and Conquer',
          learning_outcome: 'Choose recursion where it clarifies, and implement backtracking with pruning.',
          sections: {
            videos: [
              { channel: 'Computerphile', title: 'What on Earth is Recursion', length: '9 min' },
              { channel: 'Fireship', title: 'Recursion in 100 Seconds', length: '3 min' },
              { channel: 'Computerphile', title: 'Merge Sort', length: '10 min' },
            ],
            reading: "A recursive solution has three parts: a base case that stops, a recursive case that reduces the problem, and a guarantee that repeated reduction reaches the base. Backtracking adds a fourth: undo the choice when the branch fails. That undo step is what turns brute force into something that finishes, especially once a pruning test rejects hopeless branches early. Divide and conquer is the same idea applied to data rather than to choices, and merge sort is its canonical example.",
            rules: [
              'Every recursion needs a base case and a strictly reducing step. Missing either produces infinite depth.',
              'Merge sort runs in n log n time and needs order n extra space. Its comparison count is predictable.',
              'Backtracking is choose, recurse, undo. The undo step is not optional.',
              'A pruning test that rejects a branch early is usually worth more than any constant factor optimisation.',
            ],
            example: {
              caption: 'Backtracking with an explicit undo step',
              language: 'python',
              code: `def solve(board, row, n):
    if row == n:
        return True
    for col in range(n):
        if safe(board, row, col):
            board[row] = col       # choose
            if solve(board, row + 1, n):
                return True
            board[row] = -1        # undo
    return False`,
            },
          },
          assignments: [
            { title: 'Assignment 4.1: Base case repair', brief: 'Four recursive functions never terminate for some inputs. Repair each.', pass_criteria: 'All four terminate correctly on every hidden test.' },
            { title: 'Assignment 4.2: Pruning study', brief: 'Add a pruning test to a brute force solver and report the reduction in explored branches.', pass_criteria: 'Same answers, measurable reduction.' },
          ],
          project: { title: 'Constraint solver', brief: 'Build a solver that handles both maze pathfinding and the N queens placement problem through a shared backtracking core, reporting explored branches and solution paths. This project feeds the course final project.' },
        },
      ],
    },
    {
      code: 'PY3.3',
      title: 'Advanced Python Engineering: Defensive Code, Data Pipelines and Real APIs',
      level: 'Advanced',
      order_no: 3,
      capstone_artifact: 'TaskFlow Productivity and Habit Analytics Suite',
      modules: [
        {
          order_no: 1,
          title: 'Exceptions, Contracts and Failing Well',
          learning_outcome: 'Design failure behaviour deliberately rather than letting it happen.',
          sections: {
            videos: [
              { channel: 'Corey Schafer', title: 'Python Tutorial: Using Try Except Blocks', length: '10 min' },
              { channel: 'mCoding', title: 'Python exceptions done right', length: '11 min' },
            ],
            reading: "Exception handling is a design activity, not a safety net bolted on at the end. A bare handler that catches everything converts a crash into silent wrongness, which is strictly worse. The professional pattern is narrow handlers close to the operation that can fail, custom exception types that carry the context a caller needs to decide, and a clear boundary where errors stop being handled and start being reported. The else and finally clauses exist to keep that boundary readable.",
            rules: [
              'Catch the narrowest exception type that can occur. Never catch everything without re raising.',
              'The else clause runs when no exception occurred. The finally clause always runs, including on return.',
              'Custom exception types carry context. A message alone forces the caller to parse text.',
              'An assertion documents an assumption for developers. It is not input validation and can be disabled.',
            ],
            example: {
              caption: 'A narrow contract with a typed failure',
              language: 'python',
              code: `class ConfigError(Exception):
    def __init__(self, key, reason):
        super().__init__(f"{key}: {reason}")
        self.key, self.reason = key, reason

def read_port(cfg):
    try:
        port = int(cfg["port"])
    except KeyError:
        raise ConfigError("port", "missing")
    except ValueError:
        raise ConfigError("port", "not an integer")
    if not 1 <= port <= 65535:
        raise ConfigError("port", "out of range")
    return port`,
            },
          },
          assignments: [
            { title: 'Assignment 1.1: Handler narrowing', brief: 'Replace five broad handlers with narrow ones and show what each now surfaces.', pass_criteria: 'No defect silently swallowed on any hidden test.' },
            { title: 'Assignment 1.2: Exception hierarchy', brief: 'Design a three level exception hierarchy for a file processing tool.', pass_criteria: 'Callers can handle at any level and receive the right context.' },
          ],
          project: { title: 'Crash proof configuration parser', brief: 'Build a parser that reads a configuration file, validates every field against a schema and reports all errors at once with line numbers rather than failing at the first.' },
        },
        {
          order_no: 2,
          title: 'Generators, Context Managers and Streaming Data',
          learning_outcome: 'Process data larger than memory with lazy pipelines and guaranteed cleanup.',
          sections: {
            videos: [
              { channel: 'Corey Schafer', title: 'Python Tutorial: Generators', length: '11 min' },
              { channel: 'Corey Schafer', title: 'Python Tutorial: Context Managers', length: '11 min' },
              { channel: 'mCoding', title: 'Generators are underrated', length: '9 min' },
            ],
            reading: "A generator produces values one at a time and remembers where it stopped, which means a pipeline of generators processes a file of any size in constant memory. This is the difference between a script that works on the sample and one that works in production. Context managers are the companion idea: they guarantee that a resource is released on every exit path including exceptions, which is why the with statement is not optional for file handling.",
            rules: [
              'A generator holds one item at a time. Memory use stays flat regardless of input size.',
              'Generators are consumed once. Iterate again and you get nothing, unless you rebuild the pipeline.',
              'Always open files with a context manager. It closes on the exception path too.',
              'Chain generators to build a pipeline. Each stage stays a small, testable function.',
            ],
            example: {
              caption: 'A three stage streaming pipeline over a large log',
              language: 'python',
              code: `def lines(path):
    with open(path, encoding="utf-8") as f:
        for line in f:
            yield line.rstrip("\\n")

def errors(rows):
    for r in rows:
        if " ERROR " in r:
            yield r

def parsed(rows):
    for r in rows:
        ts, _, msg = r.partition(" ERROR ")
        yield {"time": ts.strip(), "message": msg.strip()}

for record in parsed(errors(lines("server.log"))):
    print(record)`,
            },
          },
          assignments: [
            { title: 'Assignment 2.1: Memory bounded rewrite', brief: 'Convert a program that loads a whole file into memory into a generator pipeline.', pass_criteria: 'Identical output with flat memory use on a large input.' },
            { title: 'Assignment 2.2: Custom context manager', brief: 'Write a context manager that times a block and guarantees a report even when the block raises.', pass_criteria: 'Report printed on both paths.' },
          ],
          project: { title: 'Streaming log analyser', brief: 'Build an analyser that processes a multi gigabyte log in constant memory and reports error rates per hour, top failing endpoints and the longest quiet period.' },
        },
        {
          order_no: 3,
          title: 'Structured Persistence, Schema Migration and APIs',
          learning_outcome: 'Store structured data durably and consume a real API with a sane failure policy.',
          sections: {
            videos: [
              { channel: 'Corey Schafer', title: 'Python Tutorial: Working with JSON Data', length: '12 min' },
              { channel: 'Corey Schafer', title: 'Python Requests Tutorial', length: '12 min' },
            ],
            reading: "Any application that stores data will eventually change its shape, and the moment that happens the stored file written by the old version becomes a liability. Writing a version number into the file from day one, and a small migration function per version step, converts that liability into a routine upgrade. Calling a network API introduces the second discipline: a request can be slow, can fail, and can succeed with a body you did not expect, so a timeout, a retry policy and a response check are all mandatory rather than optional.",
            rules: [
              'Write a schema version into every stored file. Migration is a chain of small steps, not one rewrite.',
              'Every network call gets an explicit timeout. Without one, a hung server hangs your program.',
              'Retry only on transient failures, with an increasing wait, and cap the number of attempts.',
              'Validate the response shape before using it. A successful status code does not guarantee the body.',
            ],
            example: {
              caption: 'Versioned storage with a migration chain',
              language: 'python',
              code: `MIGRATIONS = {
    1: lambda d: {**d, "tags": [], "version": 2},
    2: lambda d: {**d, "archived": False, "version": 3},
}

def load(path):
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    while data.get("version", 1) in MIGRATIONS:
        data = MIGRATIONS[data["version"]](data)
    return data`,
            },
          },
          assignments: [
            { title: 'Assignment 3.1: Migration chain', brief: 'Write migrations that carry a stored file from version one to version four without data loss.', pass_criteria: 'All supplied old files load correctly.' },
            { title: 'Assignment 3.2: Resilient client', brief: 'Write an API client with timeout, capped retries with increasing wait and response validation.', pass_criteria: 'Survives the simulated flaky endpoint and never hangs.' },
          ],
          project: { title: 'Offline first data store', brief: 'Build a store that works from a local cache when the network is unavailable, synchronises when it returns, resolves conflicts by a documented rule and migrates its own schema on upgrade.' },
        },
        {
          order_no: 4,
          title: 'Testing, Packaging and the Course Capstone',
          learning_outcome: 'Ship a tested, installable Python application with a documented interface.',
          sections: {
            videos: [
              { channel: 'Corey Schafer', title: 'Python Tutorial: Unit Testing Your Code', length: '13 min' },
              { channel: 'mCoding', title: 'Automated testing in Python', length: '12 min' },
            ],
            reading: "Tests are not about proving code correct, they are about making change safe. A test suite that runs in seconds and fails loudly when behaviour changes is what allows a project to be refactored at all. The practical standard is straightforward: test the boundary cases and the error paths rather than the happy path, keep each test independent, and treat a failing test as information rather than an obstacle. Packaging closes the loop by making the work runnable by someone other than its author.",
            rules: [
              'Test the boundaries and the failure paths. The happy path is the least likely place for defects.',
              'Each test must be independent. Shared state between tests produces failures that depend on order.',
              'Coverage measures which lines ran, not whether behaviour is correct. Use it as a gap finder only.',
              'A project someone else cannot install and run in one command is not finished.',
            ],
            example: {
              caption: 'Boundary focused tests rather than happy path tests',
              language: 'python',
              code: `import pytest
from tasks import Task

def test_rejects_unknown_status():
    t = Task("write report")
    with pytest.raises(ValueError):
        t.status = "finished"

@pytest.mark.parametrize("value", ["todo", "doing", "done"])
def test_accepts_valid_statuses(value):
    t = Task("write report")
    t.status = value
    assert t.status == value`,
            },
          },
          assignments: [
            { title: 'Assignment 4.1: Boundary suite', brief: 'Write a test suite for a supplied module covering every error path.', pass_criteria: 'Suite catches all four deliberately introduced defects.' },
            { title: 'Assignment 4.2: Make it installable', brief: 'Package a project so it installs and runs from a clean environment in one command.', pass_criteria: 'Verified install on a fresh environment.' },
          ],
          project: { title: 'Course capstone: TaskFlow productivity and habit analytics suite', brief: 'Build a complete productivity application with custom exception contracts, generator based reporting over files larger than memory, schema migration between two stored versions and a test suite above eighty percent coverage. Defended live.' },
        },
      ],
    },
  ],
};
