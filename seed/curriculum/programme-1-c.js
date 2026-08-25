'use strict';

/**
 * EchoLens Curriculum seed data - Programme 1: C Systems Programming.
 * Transcribed verbatim from EchoLens_Course_and_Module_Handbook.pdf
 * (pages 3-14). Video entries deliberately carry no url: the handbook's
 * own "Video library note" says entries resolve through YouTube by
 * channel + exact title rather than a fixed identifier, precisely so the
 * library never breaks - inventing a URL here would violate that.
 */
module.exports = {
  code: 'P1',
  name: 'C Systems Programming',
  courses: [
    {
      code: 'CS1.1',
      title: 'C Programming Foundations: From First Compile to Working Command Line Tools',
      level: 'Beginner',
      order_no: 1,
      capstone_artifact: 'MiniBank Distributed CLI and Transaction Engine',
      modules: [
        {
          order_no: 1,
          title: 'How C Actually Becomes a Program',
          learning_outcome: 'Explain the four stages a source file passes through, and manipulate individual bits with confidence.',
          sections: {
            videos: [
              { channel: 'Fireship', title: 'C in 100 Seconds', length: '2 min' },
              { channel: 'Jacob Sorber', title: 'Learn C in minutes (lesson 0)', length: '9 min' },
              { channel: 'Low Level Learning', title: 'how does a compiler work', length: '12 min' },
            ],
            reading: "A C source file is not executed. It is transformed. The preprocessor pastes headers and expands macros, the compiler emits assembly for your target architecture, the assembler produces an object file of machine code with unresolved symbols, and the linker binds those symbols into an executable. Most beginner errors are actually stage errors: an undeclared identifier is a compiler complaint, an undefined reference is a linker complaint, and knowing which stage spoke tells you where to look. Bit manipulation belongs here because at this level a value is only a pattern of bits, and permissions, flags and hardware registers are all read the same way.",
            rules: [
              'Stage order: preprocess, compile, assemble, link. Each stage has its own error vocabulary.',
              'Left shift by n multiplies by 2 to the power n. Right shift by n divides by 2 to the power n for unsigned values.',
              'Test a flag with (value AND mask). Set with (value OR mask). Clear with (value AND NOT mask). Toggle with (value XOR mask).',
              'Compile with warnings on. The flags -Wall -Wextra turn silent defects into visible ones.',
            ],
            example: {
              caption: 'Reading a Unix permission mask bit by bit',
              language: 'c',
              code: `#include <stdio.h>
int main(void) {
  unsigned int mode = 0755; /* rwxr-xr-x */
  printf("owner write: %d\\n", (mode & 0200) != 0);
  mode &= ~0022; /* clear group and other write */
  printf("mode now: %o\\n", mode);
  return 0;
}`,
            },
          },
          assignments: [
            { title: 'Assignment 1.1: Stage detective', brief: 'You are given five broken programs. Identify which build stage each failure comes from and fix it.', pass_criteria: 'Correct stage named for at least four of five, all five compiling cleanly with -Wall -Wextra.' },
            { title: 'Assignment 1.2: Flag toolkit', brief: 'Write four functions that set, clear, toggle and test a bit at a given position.', pass_criteria: 'All hidden tests pass, no branching used inside any of the four functions.' },
          ],
          project: { title: 'Unix permission mask evaluator', brief: 'Build a command line tool that accepts an octal mode and prints the full rwx table, then accepts an operation such as u+x or go-w and prints the resulting mode. Must handle invalid input without crashing.' },
        },
        {
          order_no: 2,
          title: 'Types, Precision and the Limits of Memory',
          learning_outcome: 'Predict where numeric types overflow or lose precision, and read input safely.',
          sections: {
            videos: [
              { channel: 'Jacob Sorber', title: 'Learning C: Basic Types (numbers, arrays, structs, pointers)', length: '11 min' },
              { channel: 'Computerphile', title: 'Floating Point Numbers', length: '9 min' },
              { channel: 'Low Level Learning', title: 'integer overflow explained', length: '10 min' },
            ],
            reading: "Every numeric type in C is a fixed width box, and the interesting behaviour happens at the edges of that box. Signed overflow is undefined behaviour, which means the compiler is permitted to assume it never happens and optimise on that assumption. Unsigned overflow wraps predictably. Floating point cannot represent most decimal fractions exactly, so money is never stored as a float in production systems. Input handling is the other half of this module: the classic scanf pattern leaves the newline in the buffer and silently poisons the next read, which is why disciplined programs read a whole line and then parse it.",
            rules: [
              'Signed overflow is undefined behaviour. Unsigned arithmetic wraps modulo 2 to the power of the bit width.',
              'Store currency as an integer count of the smallest unit, for example paisa, and format on output only.',
              'Never compare floats with equality. Compare the absolute difference against a chosen tolerance.',
              'Prefer reading a full line then parsing it. A bare scanf call leaves the terminator in the stream.',
            ],
            example: {
              caption: 'Currency held as integer paisa, formatted only at the edge',
              language: 'c',
              code: `#include <stdio.h>
long add_money(long a_paisa, long b_paisa) { return a_paisa + b_paisa; }
int main(void) {
  long total = add_money(125050, 74999); /* 1250.50 + 749.99 */
  printf("Total: PKR %ld.%02ld\\n", total / 100, total % 100);
  return 0;
}`,
            },
          },
          assignments: [
            { title: 'Assignment 2.1: Overflow map', brief: 'For six given expressions, predict the printed result before running, then run and explain any difference.', pass_criteria: 'At least four predictions correct with a written reason for every mismatch.' },
            { title: 'Assignment 2.2: Safe reader', brief: 'Write a function that reads an integer from the user, rejects non numeric input, and re prompts.', pass_criteria: 'Survives letters, empty lines and values beyond the integer range without an infinite loop.' },
          ],
          project: { title: 'High precision billing calculator', brief: 'Build a calculator that applies a percentage discount and a tax rate to an item list and prints a receipt. All internal arithmetic in integer units, output correct to two decimals, and totals must reconcile exactly.' },
        },
        {
          order_no: 3,
          title: 'Deterministic Logic and Branching',
          learning_outcome: 'Design branch structures that are provably exhaustive, and implement a small state machine.',
          sections: {
            videos: [
              { channel: 'Low Level Learning', title: 'how to write clean C control flow', length: '10 min' },
              { channel: 'Computerphile', title: 'Finite State Machines', length: '10 min' },
            ],
            reading: "A conditional structure is a claim that every possible input lands in exactly one branch. Most logic defects are inputs that land in none. Writing the default branch first, before the interesting cases, is a habit that eliminates a whole category of bug. The switch construct compiles to a jump table when the cases are dense, which is why it is preferred for token dispatch, and its fall through behaviour is a feature when documented and a defect when accidental. A finite state machine is simply a switch inside a loop where the state variable carries meaning between iterations, and it is the standard shape for any parser.",
            rules: [
              'NOT (a AND b) equals (NOT a) OR (NOT b). Use De Morgan to simplify nested negations rather than adding brackets.',
              'Logical AND and OR short circuit. Put the cheap or protective test on the left, for example a null check before a dereference.',
              'Every switch gets a default branch, even when it is only there to report an impossible state.',
              'A state machine needs three things named explicitly: the state set, the input alphabet and the transition rule.',
            ],
            example: {
              caption: 'A two state tokenizer skeleton',
              language: 'c',
              code: `enum state { SCAN, IN_NUMBER };
int classify(const char *s) {
  enum state st = SCAN;
  int tokens = 0;
  for (; *s; s++) {
    switch (st) {
      case SCAN: if (*s >= '0' && *s <= '9') { st = IN_NUMBER; tokens++; } break;
      case IN_NUMBER: if (*s < '0' || *s > '9') { st = SCAN; } break;
      default: return -1;
    }
  }
  return tokens;
}`,
            },
          },
          assignments: [
            { title: 'Assignment 3.1: Exhaustive branching', brief: 'Rewrite a supplied grading function so that every input value including negatives and values above the maximum is handled.', pass_criteria: 'All hidden boundary tests pass and no input reaches an unhandled path.' },
            { title: 'Assignment 3.2: De Morgan refactor', brief: 'Simplify eight compound conditions without changing behaviour.', pass_criteria: 'All outputs identical to the original and the total operator count reduced.' },
          ],
          project: { title: 'Infix expression tokenizer', brief: "Build a tokenizer that turns a mathematical string such as 12+4*(3-1) into a printed token list with type labels. Must reject malformed input with a position accurate error message." },
        },
        {
          order_no: 4,
          title: 'Iteration, Invariants and Algorithmic Cost',
          learning_outcome: 'Reason about loop correctness through invariants and estimate the cost of an algorithm before running it.',
          sections: {
            videos: [
              { channel: 'Fireship', title: 'Big O Notation in 100 Seconds', length: '3 min' },
              { channel: 'Computerphile', title: 'Sieve of Eratosthenes', length: '10 min' },
              { channel: 'Low Level Learning', title: 'how loops actually work in assembly', length: '11 min' },
            ],
            reading: "A loop invariant is a statement that is true before the loop begins, remains true after every iteration, and combined with the exit condition proves the result. Writing the invariant as a comment above the loop turns debugging from guesswork into checking. Cost analysis at this level does not need formal proofs: counting how many times the innermost statement runs as the input grows is enough to tell a linear algorithm from a quadratic one, and that distinction is the difference between a program that finishes and one that does not.",
            rules: [
              'Nested loop over the same collection is quadratic. A single pass is linear. A halving loop is logarithmic.',
              'The sieve of Eratosthenes runs in roughly n log log n and beats trial division for any meaningful range.',
              'Bisection halves the search interval each step, so the error after k steps is the starting range divided by 2 to the power k.',
              'Every loop needs a written termination argument. If you cannot state why it stops, it may not.',
            ],
            example: {
              caption: 'Bisection root finding with a stated tolerance',
              language: 'c',
              code: `#include <math.h>
double root(double (*f)(double), double lo, double hi, double tol) {
  while (hi - lo > tol) { /* invariant: sign change stays bracketed */
    double mid = lo + (hi - lo) / 2;
    if (f(lo) * f(mid) <= 0) hi = mid; else lo = mid;
  }
  return lo + (hi - lo) / 2;
}`,
            },
          },
          assignments: [
            { title: 'Assignment 4.1: Invariant statements', brief: 'For five supplied loops, write the invariant and the termination argument, then repair the two that are wrong.', pass_criteria: 'Both defects found and corrected.' },
            { title: 'Assignment 4.2: Cost comparison', brief: 'Implement prime detection twice, by trial division and by sieve, and record timings across four input sizes.', pass_criteria: 'Correct output from both and a written explanation of the growth difference.' },
          ],
          project: { title: 'Numerical toolkit', brief: 'Build a command line toolkit combining a sieve based prime lister and a bisection root finder for a user supplied polynomial, with a timing report for each operation. This project feeds directly into the course final project.' },
        },
      ],
    },
    {
      code: 'CS1.2',
      title: 'Pointers, Memory and Modular C: The Layer Most Programmers Skip',
      level: 'Intermediate',
      order_no: 2,
      capstone_artifact: 'MiniBank Distributed CLI and Transaction Engine',
      modules: [
        {
          order_no: 1,
          title: 'Functions, the Call Stack and Recursion',
          learning_outcome: 'Trace a call stack by hand and reason about recursion depth and pass by value semantics.',
          sections: {
            videos: [
              { channel: 'Computerphile', title: 'What on Earth is Recursion', length: '9 min' },
              { channel: 'Low Level Learning', title: 'the stack explained', length: '12 min' },
            ],
            reading: "Calling a function pushes an activation record onto the stack containing the return address, the saved base pointer and the local variables. Understanding that record explains three things at once: why C passes arguments by value, why returning the address of a local variable is a defect, and why deep recursion eventually exhausts the stack. Modular design in C is not decoration. Splitting behaviour across headers and source files controls what other translation units can see, and that visibility boundary is the only encapsulation the language gives you.",
            rules: [
              'Arguments are copied. To let a function modify a caller variable, pass its address.',
              'Never return a pointer to a local variable. That memory is reclaimed the moment the function returns.',
              'Recursion depth costs stack space per frame. Tail shaped recursion may or may not be optimised, so do not rely on it.',
              'Declare in the header, define in the source. Anything not in the header should be marked static.',
            ],
            example: {
              caption: 'Recursive greatest common divisor and fast exponentiation',
              language: 'c',
              code: `long gcd(long a, long b) { return b == 0 ? a : gcd(b, a % b); }
long power(long base, long exp) {
  if (exp == 0) return 1;
  long half = power(base, exp / 2);
  return (exp % 2) ? half * half * base : half * half;
}`,
            },
          },
          assignments: [
            { title: 'Assignment 1.1: Stack trace by hand', brief: 'Given a three level recursive function, draw every frame at maximum depth with the value of each local.', pass_criteria: 'Frame count and values correct.' },
            { title: 'Assignment 1.2: Swap and modify', brief: 'Write functions that swap two integers and normalise a value in place.', pass_criteria: 'Caller variables actually change and no globals are used.' },
          ],
          project: { title: 'Modular mathematics library', brief: 'Build a reusable library with a header and a source file exposing greatest common divisor, fast exponentiation, modular arithmetic and a factorial with overflow detection, plus a test driver that exercises each.' },
        },
        {
          order_no: 2,
          title: 'Arrays, Pointer Arithmetic and Memory Layout',
          learning_outcome: 'Move between array notation and pointer arithmetic fluently and reason about traversal order.',
          sections: {
            videos: [
              { channel: 'Low Level Learning', title: 'you will never ask about pointers again after watching this video', length: '10 min' },
              { channel: 'Jacob Sorber', title: 'Pointer Arithmetic in C', length: '8 min' },
              { channel: 'Computerphile', title: 'Cache Memory Explained', length: '10 min' },
            ],
            reading: "An array name in an expression decays to a pointer to its first element, which is why indexing and pointer arithmetic are the same operation written two ways. Pointer arithmetic is scaled by the size of the pointed to type, so adding one to an integer pointer advances four bytes on a typical platform. A two dimensional array is stored in row major order as one contiguous block, and this single fact explains why iterating rows then columns is dramatically faster than the reverse: the fast order walks memory in the direction the cache prefetches.",
            rules: [
              'The expression arr[i] is defined as the value at (arr + i). They are interchangeable.',
              'Pointer arithmetic scales by the element size. Adding one moves one element, not one byte.',
              'Row major layout: element (r, c) of an array with C columns sits at offset (r multiplied by C, plus c).',
              'Traverse in memory order. Row then column is cache friendly, column then row is not.',
            ],
            example: {
              caption: 'In place transpose walking memory in row major order',
              language: 'c',
              code: `void transpose(int m[][4], int n) {
  for (int r = 0; r < n; r++)
    for (int c = r + 1; c < n; c++) {
      int t = m[r][c];
      m[r][c] = m[c][r];
      m[c][r] = t;
    }
}`,
            },
          },
          assignments: [
            { title: 'Assignment 2.1: Notation conversion', brief: 'Rewrite ten indexed expressions using only pointer arithmetic, and ten pointer expressions using only indexing.', pass_criteria: 'Identical behaviour on all hidden tests.' },
            { title: 'Assignment 2.2: Traversal timing', brief: 'Sum a large matrix in both orders and report the timing difference.', pass_criteria: 'Correct sums and a written cache based explanation.' },
          ],
          project: { title: 'Image convolution filter', brief: 'Build a single pass convolution filter that applies a blur or edge detection kernel to a grayscale matrix loaded from a text file, handling edge pixels explicitly rather than skipping them.' },
        },
        {
          order_no: 3,
          title: 'Strings, Buffers and Memory Safety',
          learning_outcome: 'Handle C strings without overrunning a buffer, and audit unsafe code for boundary defects.',
          sections: {
            videos: [
              { channel: 'Low Level Learning', title: 'buffer overflow explained', length: '11 min' },
              { channel: 'Jacob Sorber', title: 'C strings and the null terminator', length: '9 min' },
            ],
            reading: "A C string is a character array with a terminating zero byte, and every library function trusts you to have put that byte there. The entire family of buffer overflow vulnerabilities comes from functions that write until they find a terminator with no knowledge of how much room they have. The professional habit is simple: use the bounded variants, always reserve one byte for the terminator, and treat any function that cannot be told a size limit as unusable in production. This module is where students first audit code rather than only write it.",
            rules: [
              'A buffer for n visible characters needs n plus 1 bytes. The terminator is not optional.',
              'Use snprintf rather than sprintf, and prefer bounded copies over unbounded ones.',
              'Never use gets. It cannot be used safely under any circumstance and has been removed from the standard.',
              'The strlen function counts characters up to the terminator. It is not the allocation size.',
            ],
            example: {
              caption: 'A bounded copy that always terminates',
              language: 'c',
              code: `#include <stddef.h>
void safe_copy(char *dst, size_t dst_size, const char *src) {
  if (dst_size == 0) return;
  size_t i = 0;
  while (i + 1 < dst_size && src[i]) { dst[i] = src[i]; i++; }
  dst[i] = '\\0';
}`,
            },
          },
          assignments: [
            { title: 'Assignment 3.1: Vulnerability audit', brief: 'You are given a 60 line program with four boundary defects. Find and fix each, and write one line explaining the failure mode.', pass_criteria: 'All four found, program clean under the address sanitizer.' },
            { title: 'Assignment 3.2: String utilities', brief: 'Implement bounded versions of length, copy, concatenate and compare without using the standard library equivalents.', pass_criteria: 'All hidden tests pass including empty and maximum length inputs.' },
          ],
          project: { title: 'Input sanitizer with pattern matching', brief: 'Build a sanitizer that validates user input against a simple pattern language supporting literal characters, digit classes and wildcards, rejecting anything that would overrun a fixed destination buffer.' },
        },
        {
          order_no: 4,
          title: 'Structs, Padding, Unions and Binary Layout',
          learning_outcome: 'Predict the exact size of a struct and lay out a record for a binary format.',
          sections: {
            videos: [
              { channel: 'Jacob Sorber', title: 'Structure padding and alignment in C', length: '10 min' },
              { channel: 'Low Level Learning', title: 'how struct padding wastes your memory', length: '9 min' },
            ],
            reading: "A struct is not the sum of its members. The compiler inserts padding so that each member begins at an address that is a multiple of its own alignment requirement, and adds trailing padding so that arrays of the struct stay aligned. Reordering members from largest to smallest often shrinks a struct by a third with no code change, which matters enormously when you have a million of them. Unions place all members at the same address and are the standard tool for tagged variant records and for inspecting the byte representation of a value.",
            rules: [
              'A member of size s is placed at the next offset divisible by s. Total size is rounded up to the largest member alignment.',
              'Ordering members from largest to smallest usually minimises padding.',
              'A union is exactly as large as its largest member. Only one member is valid at a time, so pair it with a tag.',
              'Never write a struct straight to disk or a socket without a defined layout. Padding is not portable.',
            ],
            example: {
              caption: 'Two identical field sets with different sizes',
              language: 'c',
              code: `#include <stdio.h>
struct wasteful { char a; int b; char c; }; /* likely 12 bytes */
struct packed { int b; char a; char c; };  /* likely 8 bytes  */
int main(void) {
  printf("%zu %zu\\n", sizeof(struct wasteful), sizeof(struct packed));
  return 0;
}`,
            },
          },
          assignments: [
            { title: 'Assignment 4.1: Size prediction', brief: 'Predict the size of six structs before compiling, then verify.', pass_criteria: 'At least five correct with a written padding map for each.' },
            { title: 'Assignment 4.2: Struct diet', brief: 'Reorder three supplied structs to minimise size without removing any field.', pass_criteria: 'Target sizes met exactly.' },
          ],
          project: { title: 'Binary packet serializer', brief: 'Build a serializer that writes a network style header of fixed width fields into a byte buffer with an explicit layout, and a matching parser that reads it back, verified by a round trip test.' },
        },
      ],
    },
    {
      code: 'CS1.3',
      title: 'Advanced C Systems Engineering: Dynamic Memory, Data Structures and File Persistence',
      level: 'Advanced',
      order_no: 3,
      capstone_artifact: 'MiniBank Distributed CLI and Transaction Engine',
      modules: [
        {
          order_no: 1,
          title: 'The Heap, Allocation and Leak Discipline',
          learning_outcome: 'Manage heap memory across a program lifetime with zero leaks and no invalid access.',
          sections: {
            videos: [
              { channel: 'Jacob Sorber', title: 'Allocating memory with malloc, calloc, realloc, and free', length: '12 min' },
              { channel: 'Jacob Sorber', title: 'Pulling Back the Curtain on the Heap', length: '13 min' },
              { channel: 'Low Level Learning', title: 'i wrote my own memory allocator in C to prove a point', length: '13 min' },
            ],
            reading: "The heap is memory whose lifetime you control rather than the compiler. That control is the reason C can build systems that outlive any single function, and it is also the source of the four defects that dominate C bug reports: the leak, the use after free, the double free and the buffer overrun on heap memory. Every one of them is preventable by a discipline rather than a tool: every allocation has exactly one owner, the owner is named in a comment, and the free lives in the same file as the allocation.",
            rules: [
              'Every allocation call has exactly one matching release call on every path, including error paths.',
              'After releasing a pointer, set it to null. A null dereference crashes loudly, a dangling one corrupts silently.',
              'The realloc call may move the block. Always assign its result, and never assign it over the only pointer you have.',
              'Zeroing allocation costs a pass over the memory. Use it when the zero state matters, not by reflex.',
            ],
            example: {
              caption: 'A growable array that survives reallocation failure',
              language: 'c',
              code: `#include <stdlib.h>
int push(int **arr, size_t *len, size_t *cap, int value) {
  if (*len == *cap) {
    size_t next = *cap ? *cap * 2 : 8;
    int *tmp = realloc(*arr, next * sizeof(int));
    if (!tmp) return 0; /* original block still valid */
    *arr = tmp; *cap = next;
  }
  (*arr)[(*len)++] = value;
  return 1;
}`,
            },
          },
          assignments: [
            { title: 'Assignment 1.1: Leak hunt', brief: 'A supplied program leaks on three of its seven code paths. Find and fix all three.', pass_criteria: 'Clean report under the leak checker across every path including early returns.' },
            { title: 'Assignment 1.2: Growable buffer', brief: 'Implement a dynamic array with push, pop, at and free operations.', pass_criteria: 'All hidden tests pass, no leaks, correct behaviour when allocation fails.' },
          ],
          project: { title: 'Fixed block arena allocator', brief: 'Build an allocator that requests one large block from the system and hands out fixed size chunks from it, with a free list and a statistics report showing chunks used, free and fragmentation.' },
        },
        {
          order_no: 2,
          title: 'Linked Structures, Stacks, Queues and Hash Tables',
          learning_outcome: 'Implement the four core dynamic structures and choose between them on evidence.',
          sections: {
            videos: [
              { channel: 'Computerphile', title: 'Hashing Algorithms and Security', length: '8 min' },
              { channel: 'Fireship', title: 'Data Structures in 10 Minutes', length: '10 min' },
              { channel: 'Jacob Sorber', title: 'Linked lists in C', length: '11 min' },
            ],
            reading: "Once memory can be requested at run time, data structures stop being fixed arrays and become graphs of nodes. A linked list gives constant time insertion at the cost of losing cache locality and random access. A stack and a queue are the same node machinery with different insertion and removal rules, and their value is that the rule itself encodes the intent. A hash table with separate chaining is a fixed array of list heads, and its performance collapses from constant to linear when the hash distributes badly, which is why measuring chain length matters more than choosing a clever hash.",
            rules: [
              'Load factor equals stored entries divided by bucket count. Above roughly 0.75, grow the table and rehash.',
              'Average lookup cost in a chained table is one plus half the load factor. Worst case is linear.',
              'A stack is last in first out and a queue is first in first out. The choice encodes the algorithm, not the storage.',
              'Every node structure needs a matching destroy function that walks and releases the whole structure.',
            ],
            example: {
              caption: 'Separate chaining insert with a simple string hash',
              language: 'c',
              code: `unsigned long hash(const char *s) {
  unsigned long h = 5381;
  while (*s) h = h * 33 + (unsigned char)*s++;
  return h;
}
void insert(struct node **buckets, size_t n, const char *key, int value) {
  size_t i = hash(key) % n;
  struct node *node = make_node(key, value);
  node->next = buckets[i]; /* head insertion, constant time */
  buckets[i] = node;
}`,
            },
          },
          assignments: [
            { title: 'Assignment 2.1: List surgery', brief: 'Implement insert at position, delete by value and reverse in place for a singly linked list.', pass_criteria: 'All hidden tests pass including empty and single node lists, no leaks.' },
            { title: 'Assignment 2.2: Collision study', brief: 'Insert ten thousand keys under two different hash functions and report the chain length distribution.', pass_criteria: 'Both tables correct and a written comparison of the distributions.' },
          ],
          project: { title: 'Instrumented hash table', brief: 'Build a hash table with separate chaining that reports load factor, longest chain and average probe length on demand, and automatically grows when the load factor is exceeded.' },
        },
        {
          order_no: 3,
          title: 'File Streams, Binary Records and Durable Writes',
          learning_outcome: 'Persist structured data to disk and recover it correctly after an interrupted write.',
          sections: {
            videos: [
              { channel: 'Jacob Sorber', title: 'Reading and writing binary files in C', length: '12 min' },
              { channel: 'Low Level Learning', title: 'how files actually work', length: '11 min' },
            ],
            reading: "Text mode is for humans and binary mode is for machines, and mixing them is where most file corruption starts. Binary records give constant time access to record number n because the offset is simply n multiplied by the record size, which turns a file into a primitive database. Durability is the harder half: a write that returns successfully may still be sitting in a buffer, so a system that must survive a crash writes to a temporary file, flushes it, and only then replaces the original. That pattern is worth more in an interview than any syntax.",
            rules: [
              'Record n begins at byte offset n multiplied by the record size. That is the whole indexing scheme.',
              'Open binary files in binary mode explicitly. On some platforms text mode rewrites byte sequences.',
              'A successful write is not a durable write. Flush the stream, then rename the temporary file over the original.',
              'Always check the return value of every read and write call. Short reads are normal, not exceptional.',
            ],
            example: {
              caption: 'Atomic replace: write to a temporary file, then rename',
              language: 'c',
              code: `#include <stdio.h>
int save_atomic(const char *path, const void *data, size_t n) {
  char tmp[256];
  snprintf(tmp, sizeof tmp, "%s.tmp", path);
  FILE *f = fopen(tmp, "wb");
  if (!f) return 0;
  if (fwrite(data, 1, n, f) != n) { fclose(f); return 0; }
  fflush(f); fclose(f);
  return rename(tmp, path) == 0;
}`,
            },
          },
          assignments: [
            { title: 'Assignment 3.1: Record seek', brief: 'Implement read, update and append by record number over a fixed width binary file.', pass_criteria: 'Correct behaviour at the first, last and beyond the end positions.' },
            { title: 'Assignment 3.2: Crash simulation', brief: 'Interrupt a write halfway and demonstrate that your atomic save leaves the original intact.', pass_criteria: 'Original file readable after every simulated interruption.' },
          ],
          project: { title: 'Binary record database', brief: 'Build a small database supporting add, find by key, update in place and delete with a free list, backed by a binary file and an in memory index rebuilt on startup.' },
        },
        {
          order_no: 4,
          title: 'Systems Integration and the Course Capstone',
          learning_outcome: 'Combine heap structures, persistence and error recovery into one defensible application.',
          sections: {
            videos: [
              { channel: 'Low Level Learning', title: 'how to structure a C project', length: '12 min' },
              { channel: 'Jacob Sorber', title: 'Writing a Makefile', length: '10 min' },
            ],
            reading: "Integration is a distinct skill from implementation. A program that combines dynamic structures, file persistence and user input has failure modes that none of the parts have alone: a partially applied transaction, an index that disagrees with the file, memory freed by one subsystem while another still holds a pointer. The professional answer is a layered design with one owning module per resource, a single entry point for every state change, and a regression test that replays a recorded session. This module is where the course stops teaching features and starts teaching engineering.",
            rules: [
              'One module owns each resource. Other modules borrow through functions, never through raw pointers.',
              'Every state change goes through a single function so that logging, validation and rollback live in one place.',
              'A transaction is applied only after every precondition is checked. Partial application is the defect to design out.',
              'A regression harness that replays a recorded input file catches more than any amount of manual testing.',
            ],
            example: {
              caption: 'A single guarded entry point for state change',
              language: 'c',
              code: `int apply_transfer(Bank *b, int from, int to, long paisa) {
  if (paisa <= 0) return ERR_AMOUNT;
  Account *a = find(b, from), *z = find(b, to);
  if (!a || !z) return ERR_NO_ACCOUNT;
  if (a->balance < paisa) return ERR_FUNDS;
  a->balance -= paisa; z->balance += paisa;
  return journal_append(b, from, to, paisa); /* durable last */
}`,
            },
          },
          assignments: [
            { title: 'Assignment 4.1: Integration defects', brief: 'A supplied two subsystem program has an ownership defect and an index consistency defect. Diagnose and repair both.', pass_criteria: 'Both found, explained in writing and fixed.' },
            { title: 'Assignment 4.2: Regression harness', brief: 'Build a replay harness that runs a recorded command file and compares output against an expected file.', pass_criteria: 'Harness detects a deliberately introduced regression.' },
          ],
          project: { title: 'Course capstone: MiniBank distributed command line transaction engine', brief: 'Build a complete banking terminal application with heap managed accounts, binary persistence, a transaction journal, rollback on partial failure and zero leaks under a ten thousand operation stress run. Defended live.' },
        },
      ],
    },
  ],
};
