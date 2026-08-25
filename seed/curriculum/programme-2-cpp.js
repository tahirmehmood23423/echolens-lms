'use strict';

/**
 * EchoLens Curriculum seed data - Programme 2: C++ and Object Oriented
 * Software Design. Transcribed verbatim from
 * EchoLens_Course_and_Module_Handbook.pdf (pages 15-26). See
 * programme-1-c.js for the video-URL note.
 */
module.exports = {
  code: 'P2',
  name: 'C++ and Object Oriented Software Design',
  courses: [
    {
      code: 'CPP2.1',
      title: 'Modern C++ Essentials: Write Fast, Type Safe Code With Confidence',
      level: 'Beginner',
      order_no: 1,
      capstone_artifact: 'LedgerLens Expense Management and Analytics Engine',
      modules: [
        {
          order_no: 1,
          title: 'The Modern Core and Stream Formatting',
          learning_outcome: 'Write clean modern C++ with correct initialization and precisely formatted output.',
          sections: {
            videos: [
              { channel: 'Fireship', title: 'C++ in 100 Seconds', length: '3 min' },
              { channel: 'The Cherno', title: 'How C++ Works', length: '10 min' },
              { channel: 'The Cherno', title: 'Variables in C++', length: '10 min' },
            ],
            reading: "Modern C++ is a different language from the one taught in most local syllabi. Uniform initialization with braces rejects narrowing conversions that the old parenthesis form accepted silently. The auto keyword is not laziness, it is a guarantee that the declared type cannot drift out of step with the initialiser. Streams are the first place students meet the idea that formatting is a property of the stream rather than of the value, which is why a manipulator set once affects everything that follows until it is changed again.",
            rules: [
              'Brace initialization rejects narrowing. Prefer it everywhere a constructor is not ambiguous.',
              'The manipulator setprecision combined with fixed gives exactly n digits after the decimal point.',
              'Field width set by setw applies to the very next output item only. Fill and precision persist.',
              'Use auto where the type is obvious from the right hand side, and a named type where it is not.',
            ],
            example: {
              caption: 'A formatted invoice line with persistent and one shot manipulators',
              language: 'cpp',
              code: `#include <iostream>
#include <iomanip>
int main() {
  std::cout << std::fixed << std::setprecision(2);
  std::cout << std::left << std::setw(22) << "Course fee"
            << std::right << std::setw(12) << 18500.0 << '\\n';
  return 0;
}`,
            },
          },
          assignments: [
            { title: 'Assignment 1.1: Narrowing hunt', brief: 'Convert eight parenthesis initializations to brace form and explain the two that now fail to compile.', pass_criteria: 'Correct diagnosis of both narrowing cases.' },
            { title: 'Assignment 1.2: Report formatter', brief: 'Produce a right aligned numeric table with a header rule from supplied data.', pass_criteria: 'Output matches the expected file byte for byte.' },
          ],
          project: { title: 'Tabular invoice generator', brief: 'Build a program that reads line items and prints a fully aligned invoice with subtotal, tax and total, correct to two decimals under every supplied data set.' },
        },
        {
          order_no: 2,
          title: 'Value Semantics, References and Const Correctness',
          learning_outcome: 'Choose between value, reference and const reference parameters on cost and intent.',
          sections: {
            videos: [
              { channel: 'The Cherno', title: 'REFERENCES in C++', length: '10 min' },
              { channel: 'The Cherno', title: 'CONST in C++', length: '12 min' },
            ],
            reading: "A reference is an alias, not an object. That single sentence resolves most confusion in this module: a reference must be bound at creation, cannot be rebound, and costs nothing to pass. Const correctness is where C++ starts paying for itself, because marking a parameter as a const reference is a compiler enforced promise that the function will read but not modify, and that promise is visible to every caller from the signature alone. Passing large objects by value silently copies them, which is the most common performance defect in student code.",
            rules: [
              'Pass small built in types by value. Pass anything larger by const reference.',
              'A const reference parameter is a contract: the caller keeps ownership and the function will not modify.',
              'A reference must be initialised at declaration and can never be made to refer to something else.',
              'Mark member functions const when they do not modify state. Const objects can only call const members.',
            ],
            example: {
              caption: 'The same operation, three parameter choices',
              language: 'cpp',
              code: `void by_value(std::vector<int> v);                 // copies the whole vector
void by_ref(std::vector<int>& v);                   // may modify the caller's vector
void by_const_ref(const std::vector<int>& v);       // reads only, no copy

int sum(const std::vector<int>& v) {                // correct default choice
  int total = 0;
  for (int x : v) total += x;
  return total;
}`,
            },
          },
          assignments: [
            { title: 'Assignment 2.1: Signature review', brief: 'Correct the parameter passing in ten supplied signatures and justify each change in one line.', pass_criteria: 'At least eight correct with reasons.' },
            { title: 'Assignment 2.2: In place partition', brief: 'Partition a vector around a pivot using references, without allocating a second vector.', pass_criteria: 'All hidden tests pass, original vector modified in place.' },
          ],
          project: { title: 'In place vector operations library', brief: 'Build a small library of in place vector operations including partition, rotate, deduplicate and reverse a range, each with a const correct signature and no unnecessary copies.' },
        },
        {
          order_no: 3,
          title: 'Vectors, Strings and the Cost of Growth',
          learning_outcome: 'Use the standard sequence containers correctly and explain their reallocation behaviour.',
          sections: {
            videos: [
              { channel: 'The Cherno', title: 'VECTORS in C++ (std::vector)', length: '12 min' },
              { channel: 'The Cherno', title: 'How Strings Work in C++', length: '13 min' },
              { channel: 'Fireship', title: 'Big O Notation in 100 Seconds', length: '3 min' },
            ],
            reading: "A vector is a contiguous block that grows by allocating a larger block and moving everything into it. Because the growth is geometric, the average cost of an insertion at the end is constant even though individual insertions are occasionally expensive. Two consequences matter in practice: reserving capacity when the final size is known removes the copies entirely, and any pointer or iterator into a vector becomes invalid the moment it reallocates. Strings behave the same way with the added subtlety of small string optimisation.",
            rules: [
              'Size is how many elements exist. Capacity is how many fit before the next reallocation.',
              'Growth is geometric, so appending n elements costs order n in total, amortised constant each.',
              'Reallocation invalidates every iterator, pointer and reference into the vector.',
              'Call reserve when the final size is known. It converts many allocations into one.',
            ],
            example: {
              caption: 'Reserving capacity removes the reallocation copies',
              language: 'cpp',
              code: `#include <vector>
std::vector<int> squares(int n) {
  std::vector<int> out;
  out.reserve(n);                          /* one allocation instead of log n */
  for (int i = 1; i <= n; ++i) out.push_back(i * i);
  return out;                              /* moved, not copied */
}`,
            },
          },
          assignments: [
            { title: 'Assignment 3.1: Capacity trace', brief: 'Print size and capacity after each of thirty insertions and explain the growth pattern.', pass_criteria: 'Correct trace and a written growth factor.' },
            { title: 'Assignment 3.2: Invalidation defect', brief: 'A supplied program holds a reference across a push. Diagnose the crash and fix it two different ways.', pass_criteria: 'Both fixes work and are explained.' },
          ],
          project: { title: 'Fuzzy substring search engine', brief: 'Build a search tool that finds exact and near matches in a body of text with a configurable edit distance, reporting match positions and scores.' },
        },
        {
          order_no: 4,
          title: 'Overloading, Headers and Building a Library',
          learning_outcome: 'Split a program across translation units and design an overload set that resolves unambiguously.',
          sections: {
            videos: [
              { channel: 'The Cherno', title: 'C++ Header Files', length: '11 min' },
              { channel: 'The Cherno', title: 'How the C++ Linker Works', length: '12 min' },
            ],
            reading: "Overload resolution picks the best match, and beginners meet it as a compiler error that seems to come from nowhere. The rule set is simple enough to hold in your head: exact match beats promotion, promotion beats conversion, and an ambiguity is a design fault rather than a compiler limitation. Header discipline is the other half of this module. A header declares, a source file defines, and an include guard prevents the same declaration arriving twice. Getting this wrong produces linker errors that look mysterious until the model is clear.",
            rules: [
              'Resolution order: exact match, then promotion, then standard conversion. Ties are an error, not a coin toss.',
              'Default arguments belong in the declaration only, never repeated in the definition.',
              'Declare in the header, define in the source. Inline and template definitions must stay in the header.',
              'One definition rule: exactly one definition of each entity across the whole program.',
            ],
            example: {
              caption: 'A clean overload set and its header declaration',
              language: 'cpp',
              code: `// vec.h
struct Vec2 { double x, y; };
Vec2 add(Vec2 a, Vec2 b);
Vec2 add(Vec2 a, double k);
double dot(Vec2 a, Vec2 b);

// vec.cpp
Vec2 add(Vec2 a, Vec2 b)   { return { a.x + b.x, a.y + b.y }; }
Vec2 add(Vec2 a, double k) { return { a.x + k,   a.y + k   }; }`,
            },
          },
          assignments: [
            { title: 'Assignment 4.1: Ambiguity repair', brief: 'Four supplied overload sets fail to resolve. Repair each without deleting an overload.', pass_criteria: 'All four compile and behave as specified.' },
            { title: 'Assignment 4.2: Split the file', brief: 'Split a 200 line single file program into headers and sources with guards.', pass_criteria: 'Builds cleanly, no duplicate symbol errors.' },
          ],
          project: { title: 'Vector mathematics library', brief: 'Build a reusable two dimensional and three dimensional vector library with a header, a source file, an overload set for arithmetic and a test driver. This project feeds the course final project.' },
        },
      ],
    },
    {
      code: 'CPP2.2',
      title: 'Object Oriented Design in C++: Classes, Inheritance and Polymorphism That Scale',
      level: 'Intermediate',
      order_no: 2,
      capstone_artifact: 'LedgerLens Expense Management and Analytics Engine',
      modules: [
        {
          order_no: 1,
          title: 'Classes, Invariants and Encapsulation',
          learning_outcome: 'Design a class whose invalid states are unrepresentable rather than merely discouraged.',
          sections: {
            videos: [
              { channel: 'The Cherno', title: 'CLASSES in C++', length: '10 min' },
              { channel: 'The Cherno', title: 'Constructors in C++', length: '10 min' },
              { channel: 'The Cherno', title: 'Member Initializer Lists in C++', length: '9 min' },
            ],
            reading: "An invariant is a statement about an object that is true from the end of its constructor to the start of its destructor. A balance is never negative. A date is always valid. Encapsulation exists to protect invariants, not to hide data for its own sake, and a class that exposes setters for every field has encapsulation in syntax only. Member initializer lists are not a style preference either: members are constructed in declaration order before the constructor body runs, so assigning in the body means constructing twice.",
            rules: [
              'State the invariant in a comment above the class. If you cannot state it, the class has no reason to exist.',
              'Members initialise in declaration order, not in the order written in the list. Match the two to avoid surprises.',
              'Mark single argument constructors explicit unless an implicit conversion is genuinely wanted.',
              'Prefer a constructor that rejects bad input over a setter that validates after the fact.',
            ],
            example: {
              caption: 'A wallet whose invariant cannot be violated from outside',
              language: 'cpp',
              code: `class Wallet {
  long paisa_; // invariant: paisa_ >= 0
public:
  explicit Wallet(long paisa) : paisa_(paisa < 0 ? 0 : paisa) {}
  bool withdraw(long amount) {
    if (amount <= 0 || amount > paisa_) return false;
    paisa_ -= amount; return true;
  }
  long balance() const { return paisa_; }
};`,
            },
          },
          assignments: [
            { title: 'Assignment 1.1: Invariant statements', brief: 'For five supplied classes, write the invariant and identify the member function that can break it.', pass_criteria: 'All five invariants stated, at least four breaches found.' },
            { title: 'Assignment 1.2: Close the class', brief: 'Rewrite a struct with public fields into a class that cannot enter an invalid state.', pass_criteria: 'All hidden misuse tests are rejected.' },
          ],
          project: { title: 'Multi currency wallet', brief: 'Build a wallet class supporting several currencies with a conversion table, rejecting negative balances, unknown currencies and precision losing conversions at the interface.' },
        },
        {
          order_no: 2,
          title: 'Object Lifetime, Destructors and the Rule of Three',
          learning_outcome: 'Manage a resource inside a class so that copying and destruction are always correct.',
          sections: {
            videos: [
              { channel: 'The Cherno', title: 'Object Lifetime in C++', length: '11 min' },
              { channel: 'The Cherno', title: 'Copying and Copy Constructors in C++', length: '13 min' },
            ],
            reading: "When a class owns a resource, the compiler generated copy operations do the wrong thing: they copy the handle rather than the resource, so two objects believe they own the same memory and the second destructor releases it twice. The Rule of Three states that if you need any one of destructor, copy constructor or copy assignment, you almost certainly need all three. Tying resource release to object destruction is the single most important idea in C++, because it makes cleanup automatic on every exit path including exceptions.",
            rules: [
              'Rule of Three: define the destructor, the copy constructor and the copy assignment operator together or none of them.',
              'Copy assignment must handle self assignment and must release the old resource before taking the new one.',
              'Destruction happens in reverse order of construction, automatically, on every exit path.',
              'A shallow copy of an owning class is a double free waiting for a destructor to run.',
            ],
            example: {
              caption: 'An owning buffer with all three operations defined',
              language: 'cpp',
              code: `class Buffer {
  int* data_; std::size_t n_;
public:
  explicit Buffer(std::size_t n) : data_(new int[n]{}), n_(n) {}
  ~Buffer() { delete[] data_; }
  Buffer(const Buffer& o) : data_(new int[o.n_]), n_(o.n_) {
    std::copy(o.data_, o.data_ + n_, data_);
  }
  Buffer& operator=(Buffer o) { std::swap(data_, o.data_); std::swap(n_, o.n_); return *this; }
};`,
            },
          },
          assignments: [
            { title: 'Assignment 2.1: Double free diagnosis', brief: 'A supplied class crashes on copy. Explain the mechanism and fix it.', pass_criteria: 'Correct written explanation and a clean run under the sanitizer.' },
            { title: 'Assignment 2.2: Rule of Three drill', brief: 'Add the three operations to two supplied resource owning classes.', pass_criteria: 'All copy, assign and destroy tests pass with no leaks.' },
          ],
          project: { title: 'Owning matrix container', brief: 'Build a dynamic matrix class that owns its storage, supports copy and assignment correctly, provides bounds checked access and reports its own allocation count for verification.' },
        },
        {
          order_no: 3,
          title: 'Inheritance, Hierarchies and Slicing',
          learning_outcome: 'Model a hierarchy where the base class earns its place, and avoid object slicing.',
          sections: {
            videos: [
              { channel: 'The Cherno', title: 'Inheritance in C++', length: '10 min' },
              { channel: 'The Cherno', title: 'Visibility in C++', length: '8 min' },
            ],
            reading: "Inheritance says that a derived object is substitutable for a base object everywhere the base is expected. If that sentence is not true for your hierarchy, composition is the correct tool and inheritance will produce defects that look like magic. Slicing is the classic trap: assigning a derived object into a base variable copies only the base part and silently discards the rest, which is why polymorphic collections store pointers or references rather than values. Constructor chaining runs base first, destructor chaining runs derived first.",
            rules: [
              'Substitution test: if a derived object cannot stand in for the base everywhere, do not inherit.',
              'Slicing: assigning derived to a base value copies the base part only. Store pointers or references instead.',
              'Construction runs base to derived. Destruction runs derived to base.',
              'Protected means visible to derived classes only. Use it sparingly, it widens the interface you must maintain.',
            ],
            example: {
              caption: 'Slicing shown side by side with the correct form',
              language: 'cpp',
              code: `Asset a = Equity{ "PSO", 1200 };        // sliced: Equity part discarded
Asset& r = e;                           // fine: no copy, full object
std::vector<std::unique_ptr<Asset>> book;
book.push_back(std::make_unique<Equity>("PSO", 1200)); // correct storage`,
            },
          },
          assignments: [
            { title: 'Assignment 3.1: Substitution audit', brief: 'For four supplied hierarchies, decide whether inheritance or composition is correct and justify.', pass_criteria: 'At least three correct with reasons.' },
            { title: 'Assignment 3.2: Slicing repair', brief: 'A supplied portfolio loses derived data. Diagnose and fix.', pass_criteria: 'Derived behaviour preserved through the collection.' },
          ],
          project: { title: 'Financial asset hierarchy', brief: 'Build a hierarchy of asset types with shared base behaviour and type specific valuation, stored polymorphically and printed through a common interface.' },
        },
        {
          order_no: 4,
          title: 'Virtual Functions, Interfaces and Dynamic Dispatch',
          learning_outcome: 'Use runtime polymorphism deliberately and explain its cost.',
          sections: {
            videos: [
              { channel: 'The Cherno', title: 'Virtual Functions in C++', length: '10 min' },
              { channel: 'The Cherno', title: 'Interfaces in C++ (Pure Virtual Functions)', length: '9 min' },
              { channel: 'The Cherno', title: 'Function Pointers in C++', length: '13 min' },
            ],
            reading: "A virtual function is resolved by looking up a pointer in a table attached to the object at run time rather than at compile time. That indirection costs one pointer per object and one lookup per call, which is negligible in almost every application and worth knowing about in the few where it is not. The rule that matters most: any base class intended for polymorphic deletion must have a virtual destructor, or deleting through a base pointer will run the wrong destructor and leak the derived part.",
            rules: [
              'A pure virtual function makes the class abstract. That class becomes an interface, not an implementation.',
              'Any polymorphic base class needs a virtual destructor. Without it, deletion through a base pointer is undefined.',
              'Mark overrides with the override keyword. It turns a silent signature mismatch into a compile error.',
              'Cost of dispatch: one pointer per object plus one indirect call. Do not avoid it on speculation.',
            ],
            example: {
              caption: 'An interface and a polymorphic collection',
              language: 'cpp',
              code: `struct Reportable {
  virtual ~Reportable() = default;
  virtual double value() const = 0;
  virtual std::string label() const = 0;
};
double total(const std::vector<std::unique_ptr<Reportable>>& items) {
  double sum = 0;
  for (const auto& i : items) sum += i->value(); // dispatched at run time
  return sum;
}`,
            },
          },
          assignments: [
            { title: 'Assignment 4.1: Missing virtual destructor', brief: 'Demonstrate the leak caused by a non virtual destructor, then fix it.', pass_criteria: 'Leak shown before and absent after.' },
            { title: 'Assignment 4.2: Interface extraction', brief: 'Extract an interface from three concrete classes and rewrite the caller to depend only on it.', pass_criteria: 'Caller compiles with no concrete class included.' },
          ],
          project: { title: 'Polymorphic portfolio report', brief: 'Build a reporting engine that holds mixed asset types behind one interface, computes totals and per category breakdowns and prints a formatted statement. This project feeds the course final project.' },
        },
      ],
    },
    {
      code: 'CPP2.3',
      title: 'Advanced C++ Engineering: Templates, the Standard Library and Production Persistence',
      level: 'Advanced',
      order_no: 3,
      capstone_artifact: 'LedgerLens Expense Management and Analytics Engine',
      modules: [
        {
          order_no: 1,
          title: 'Templates and Generic Programming',
          learning_outcome: 'Write generic containers and functions and read the errors they produce.',
          sections: {
            videos: [
              { channel: 'The Cherno', title: 'Templates in C++', length: '12 min' },
              { channel: 'Fireship', title: 'C++ Templates explained', length: '8 min' },
            ],
            reading: "A template is not a function, it is a recipe the compiler uses to write functions on demand. Nothing is generated until the template is instantiated with concrete types, which is why template definitions live in headers and why an unused template can contain errors that never surface. Template error messages are famously long because they unwind the whole instantiation chain, and the practical skill is reading them from the bottom, where the original call site is, rather than from the top.",
            rules: [
              'Templates are instantiated on use. The definition must be visible, so it stays in the header.',
              'Read template errors from the last line upward. The first line is usually the deepest, least useful frame.',
              'Specialisation lets one type take a different implementation without changing the call site.',
              'Constrain templates where possible so that misuse fails at the interface rather than deep inside.',
            ],
            example: {
              caption: 'A generic ring buffer with a bounds contract',
              language: 'cpp',
              code: `template <typename T, std::size_t N>
class Ring {
  T slot_[N]; std::size_t head_ = 0, count_ = 0;
public:
  bool push(const T& v) {
    if (count_ == N) return false;
    slot_[(head_ + count_++) % N] = v;
    return true;
  }
  std::size_t size() const { return count_; }
};`,
            },
          },
          assignments: [
            { title: 'Assignment 1.1: Generalise three functions', brief: 'Convert three type specific functions into templates without losing behaviour.', pass_criteria: 'All hidden tests pass across at least three instantiated types.' },
            { title: 'Assignment 1.2: Error archaeology', brief: 'Diagnose four template compilation failures from their messages alone.', pass_criteria: 'Correct root cause for at least three.' },
          ],
          project: { title: 'Generic bounded container', brief: 'Build a fixed capacity generic container with push, pop, peek and iteration, correct for both value types and types that own resources.' },
        },
        {
          order_no: 2,
          title: 'Standard Algorithms, Maps and Lambda Closures',
          learning_outcome: 'Replace hand written loops with standard algorithms and express intent through lambdas.',
          sections: {
            videos: [
              { channel: 'The Cherno', title: 'Lambdas in C++', length: '11 min' },
              { channel: 'The Cherno', title: 'std::map in C++', length: '13 min' },
              { channel: 'Fireship', title: 'Functional Programming in 100 Seconds', length: '3 min' },
            ],
            reading: "Every hand written loop is a small opportunity for an off by one error. Standard algorithms remove that surface and, more importantly, name the intent: a call to a sort or a partition or an accumulate tells the reader what is happening without reading the body. Lambdas make this practical by letting the predicate live at the call site. The capture clause is where the care is needed: capturing by reference into something that outlives the scope is the standard way to create a dangling reference in modern C++.",
            rules: [
              'Ordered map lookup is logarithmic. Unordered map lookup is constant on average and linear in the worst case.',
              'Capture by value copies at the point of definition. Capture by reference must not outlive the referenced object.',
              'The accumulate algorithm folds a range into one value and replaces most manual sum loops.',
              'Prefer a named algorithm over a raw loop wherever one exists. The name is the documentation.',
            ],
            example: {
              caption: 'An analytics pipeline built from algorithms and lambdas',
              language: 'cpp',
              code: `auto total = std::accumulate(tx.begin(), tx.end(), 0.0,
  [](double acc, const Tx& t) { return acc + t.amount; });

std::map<std::string, double> by_category;
for (const auto& t : tx) by_category[t.category] += t.amount;

auto biggest = std::max_element(by_category.begin(), by_category.end(),
  [](auto& a, auto& b) { return a.second < b.second; });`,
            },
          },
          assignments: [
            { title: 'Assignment 2.1: Loop replacement', brief: 'Replace six raw loops with standard algorithms.', pass_criteria: 'Identical output and no explicit index variables remaining.' },
            { title: 'Assignment 2.2: Capture defect', brief: 'A supplied lambda dangles. Diagnose and fix it two ways.', pass_criteria: 'Both fixes correct and explained.' },
          ],
          project: { title: 'Transaction analytics engine', brief: 'Build an engine that loads transactions and produces category totals, monthly trends and the top five outliers, implemented entirely through standard algorithms and lambdas.' },
        },
        {
          order_no: 3,
          title: 'Smart Pointers, Ownership and Serialization',
          learning_outcome: 'Express ownership in the type system and serialise an object graph to disk.',
          sections: {
            videos: [
              { channel: 'The Cherno', title: 'SMART POINTERS in C++', length: '12 min' },
              { channel: 'The Cherno', title: 'File Streams in C++', length: '10 min' },
            ],
            reading: "A raw pointer says nothing about ownership, and that ambiguity is the root of most memory defects in large C++ code bases. A unique pointer says exactly one owner. A shared pointer says reference counted shared ownership. A weak pointer says observation without ownership, and it exists to break the reference cycles that would otherwise leak under shared ownership. Serialization then raises a second question: an object graph with shared nodes cannot be written naively without duplicating them, so identity has to be encoded explicitly.",
            rules: [
              'Unique ownership by default. Reach for shared ownership only when lifetime genuinely cannot be determined.',
              'Two shared pointers referring to each other never reach zero. Break the cycle with a weak reference.',
              'Make the owning object with a factory helper rather than a bare allocation, for exception safety.',
              'Serialising a graph needs stable identifiers. Write nodes once and refer to them by identifier afterwards.',
            ],
            example: {
              caption: 'Ownership expressed in the signatures',
              language: 'cpp',
              code: `std::unique_ptr<Node> make_tree();          // caller receives ownership
void inspect(const Node& n);                // borrows, no ownership
void adopt(std::unique_ptr<Node> n);        // ownership transferred in
std::weak_ptr<Node> parent;                 // observes, breaks the cycle

void save(const Node& n, std::ofstream& out) {
  out << n.id << ',' << n.label << ',' << n.parent_id << '\\n';
}`,
            },
          },
          assignments: [
            { title: 'Assignment 3.1: Ownership rewrite', brief: 'Convert a raw pointer program to smart pointers without changing behaviour.', pass_criteria: 'No explicit deletes remain and no leaks are reported.' },
            { title: 'Assignment 3.2: Cycle breaker', brief: 'A supplied parent and child structure leaks. Fix it with a weak reference.', pass_criteria: 'Leak eliminated, traversal still works both directions.' },
          ],
          project: { title: 'Object graph serializer', brief: 'Build a serializer that writes a linked object graph to both a comma separated and a structured format and reads it back, verified by a round trip equality test.' },
        },
        {
          order_no: 4,
          title: 'Integration and the Course Capstone',
          learning_outcome: 'Combine ownership, algorithms and persistence into a defensible desktop application.',
          sections: {
            videos: [
              { channel: 'The Cherno', title: 'How to make your C++ project structure', length: '13 min' },
              { channel: 'Fireship', title: 'CMake in 100 Seconds', length: '3 min' },
            ],
            reading: "Integration in C++ is mostly about drawing the ownership map before writing the code. Which object owns the store, which borrow from it, what happens to open references when an entry is deleted. A design where those answers are in the signatures rather than in the programmer's memory survives change. The second integration concern is the build: a project that cannot be built by someone else in one command is not finished, however good the code is.",
            rules: [
              'Draw the ownership map first. Every arrow is either owning, borrowing or observing.',
              'Deletion must invalidate every borrow. Design the interface so a stale borrow cannot compile.',
              'One build command. If setup instructions run past three steps, the build is part of the defect surface.',
              'Public interface documented at the header. Implementation detail never leaks into it.',
            ],
            example: {
              caption: 'Interface that makes stale borrowing impossible',
              language: 'cpp',
              code: `class Ledger {
  std::vector<Entry> entries_;
public:
  // Callers receive an index, never a pointer, so deletion cannot dangle.
  std::size_t add(Entry e) { entries_.push_back(std::move(e)); return entries_.size() - 1; }
  const Entry* at(std::size_t i) const {
    return i < entries_.size() ? &entries_[i] : nullptr;
  }
};`,
            },
          },
          assignments: [
            { title: 'Assignment 4.1: Ownership map', brief: 'Produce an ownership diagram for a supplied three class program and identify the one incorrect arrow.', pass_criteria: 'Diagram complete and the defect found.' },
            { title: 'Assignment 4.2: One command build', brief: 'Package a multi file project so it builds from a single command on a clean machine.', pass_criteria: 'Build succeeds from a fresh clone.' },
          ],
          project: { title: 'Course capstone: LedgerLens expense management and analytics engine', brief: 'Build a complete desktop expense system with a polymorphic category hierarchy, owned resources with no raw allocation, standard algorithm reporting and serialization to two interchange formats. Defended live.' },
        },
      ],
    },
  ],
};
