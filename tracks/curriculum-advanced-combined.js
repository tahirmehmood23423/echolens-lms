'use strict';
/** EchoLens tracks - the merged "Advanced" free sub-course per language.
 * Each language now has exactly 2 free courses: Course 1 (Fundamentals -
 * tracks/free-micro.js, tracks/cs-fundamentals.js, untouched) and Course 2
 * (this file) - one combined course covering what were previously two
 * separate Intermediate/Advanced courses, reorganised into a Basic tier
 * (levels 1-4) and an Advanced tier (levels 5-8) within the same course,
 * per an explicit product decision to simplify the free catalogue to 2
 * courses per language rather than 3. No content was removed - every
 * module, assignment and project from the former Intermediate and
 * Advanced tracks is preserved here verbatim, just renumbered and
 * retitled with its tier.
 *
 * Every video reference now carries a real, working `videos[]` entry
 * with a genuine YouTube link - built as a search-query URL from the
 * exact channel + exact title already printed alongside it (e.g.
 * https://www.youtube.com/results?search_query=Fireship+C+in+100+Seconds),
 * never a guessed/fabricated video id. A specific video id can be wrong in
 * a way a search link cannot: the wrong id silently sends a student to an
 * unrelated video, while a search for the exact channel and exact title
 * reliably surfaces the right one at the top of the results.
 */

module.exports = [
  {
    "key": "c-advanced",
    "course_code": "CS1-ADV",
    "free": true,
    "friendly_grading": true,
    "default_language": "c",
    "title": "Advanced C Programming",
    "description": "Course 2 (final) of the C Programming free ladder - combines the Basic tier (formerly \"CS1.2: Pointers, Memory and Modular C\") and the Advanced tier (formerly \"CS1.3: Advanced C Systems Engineering\") into one course, eight modules total, each with its own two assignments and module project.",
    "outcome": "Trace a call stack by hand and reason about recursion and pass-by-value; move fluently between array notation and pointer arithmetic; handle C strings without overrunning a buffer; predict the exact size and layout of a struct. Manage heap memory across a program lifetime with zero leaks; implement the four core dynamic structures and choose between them on evidence; persist structured data to disk and recover it after an interrupted write; combine heap structures, persistence and error recovery into one defensible application.",
    "keywords": [
      "C pointers course",
      "C memory layout",
      "buffer overflow C",
      "struct padding C",
      "intermediate C programming",
      "advanced C programming",
      "C dynamic memory",
      "C hash table",
      "C file persistence",
      "C systems engineering course"
    ],
    "key_concepts": [
      "Call stack & activation records",
      "Pass-by-value vs pass-by-address",
      "Pointer arithmetic",
      "Row-major memory layout",
      "Buffer safety & snprintf",
      "Struct padding & alignment",
      "Unions",
      "malloc/realloc/free discipline",
      "Linked lists, stacks & queues",
      "Hash tables with chaining",
      "Binary file streams",
      "Atomic writes",
      "Systems integration"
    ],
    "pass_mark": 60,
    "titleNames": [
      "Stack Tracer",
      "Pointer Adept",
      "Heap Guardian",
      "Systems Engineer"
    ],
    "levels": [
      {
        "no": 1,
        "week": 1,
        "session": 1,
        "title": "Basic 1: Procedural Abstraction and the Call Stack",
        "video_url": null,
        "topic": "Calling a function pushes an activation record onto the stack containing the return address, the saved base pointer and the local variables. That record explains three things at once: why C passes arguments by value, why returning the address of a local variable is a defect, and why deep recursion eventually exhausts the stack.\n\nKey rules:\n- Arguments are copied. To let a function modify a caller variable, pass its address.\n- Never return a pointer to a local variable - that memory is reclaimed the moment the function returns.\n- Recursion depth costs stack space per frame; tail-shaped recursion may or may not be optimised, so do not rely on it.\n- Declare in the header, define in the source. Anything not in the header should be marked static.\n\nWorked example - recursive GCD and fast exponentiation:\nlong gcd(long a, long b) { return b == 0 ? a : gcd(b, a % b); }\nlong power(long base, long exp) {\n  if (exp == 0) return 1;\n  long half = power(base, exp / 2);\n  return (exp % 2) ? half * half * base : half * half;\n}",
        "problems": [
          {
            "title": "Stack trace by hand",
            "points": 30,
            "difficulty": "Basic",
            "description": "Given a three level recursive function, draw every frame at maximum depth with the value of each local.",
            "criteria": [
              "Frame count and values correct."
            ],
            "hint": "Recursion depth costs stack space per frame - draw one box per call.",
            "solution": "Every activation frame drawn correctly, with the right local values at maximum recursion depth."
          },
          {
            "title": "Swap and modify",
            "points": 40,
            "difficulty": "Core",
            "description": "Write functions that swap two integers and normalise a value in place.",
            "criteria": [
              "Caller variables actually change and no globals are used."
            ],
            "hint": "Arguments are copied - pass the address to let a function modify a caller variable.",
            "solution": "Functions taking pointer parameters that genuinely mutate the caller's variables, with no global state used."
          },
          {
            "title": "Module project: Modular mathematics library",
            "points": 60,
            "difficulty": "Boss",
            "description": "Build a reusable library with a header and a source file exposing greatest common divisor, fast exponentiation, modular arithmetic and a factorial with overflow detection, plus a test driver that exercises each.",
            "criteria": [
              "Declarations live in the header, definitions in the source, and a test driver exercises GCD, fast exponentiation, modular arithmetic and factorial overflow detection."
            ],
            "hint": "Declare in the header, define in the source.",
            "solution": "A header/source split library covering all four functions, verified by its own test driver."
          }
        ],
        "tier": "Basic",
        "videos": [
          {
            "channel": "Computerphile",
            "title": "What on Earth is Recursion",
            "length": "9 min",
            "url": "https://www.youtube.com/results?search_query=Computerphile%20What%20on%20Earth%20is%20Recursion"
          },
          {
            "channel": "Low Level Learning",
            "title": "the stack explained",
            "length": "12 min",
            "url": "https://www.youtube.com/results?search_query=Low%20Level%20Learning%20the%20stack%20explained"
          }
        ]
      },
      {
        "no": 2,
        "week": 1,
        "session": 2,
        "title": "Basic 2: Contiguous Layouts and Two Dimensional Arrays",
        "video_url": null,
        "topic": "An array name in an expression decays to a pointer to its first element, which is why indexing and pointer arithmetic are the same operation written two ways. A two dimensional array is stored in row major order as one contiguous block, which is why iterating rows then columns is dramatically faster than the reverse - the fast order walks memory in the direction the cache prefetches.\n\nKey rules:\n- arr[i] is defined as the value at (arr + i). They are interchangeable.\n- Pointer arithmetic scales by the element size - adding one moves one element, not one byte.\n- Row major layout: element (r, c) of an array with C columns sits at offset (r*C + c).\n- Traverse in memory order. Row then column is cache friendly, column then row is not.\n\nWorked example - in-place transpose walking memory in row major order:\nvoid transpose(int m[][4], int n) {\n  for (int r = 0; r < n; r++)\n    for (int c = r + 1; c < n; c++) {\n      int t = m[r][c]; m[r][c] = m[c][r]; m[c][r] = t;\n    }\n}",
        "problems": [
          {
            "title": "Notation conversion",
            "points": 30,
            "difficulty": "Basic",
            "description": "Rewrite ten indexed expressions using only pointer arithmetic, and ten pointer expressions using only indexing.",
            "criteria": [
              "Identical behaviour on all hidden tests."
            ],
            "hint": "arr[i] and *(arr + i) are the same operation written two ways.",
            "solution": "Twenty expressions correctly converted between indexing and pointer arithmetic, all behaviourally identical."
          },
          {
            "title": "Traversal timing",
            "points": 40,
            "difficulty": "Core",
            "description": "Sum a large matrix in both orders and report the timing difference.",
            "criteria": [
              "Correct sums and a written cache based explanation."
            ],
            "hint": "Row-then-column walks memory in the direction the cache prefetches.",
            "solution": "Both traversal orders summed correctly, with a written explanation citing cache locality for the timing gap."
          },
          {
            "title": "Module project: Image convolution filter",
            "points": 60,
            "difficulty": "Boss",
            "description": "Build a single pass convolution filter that applies a blur or edge detection kernel to a grayscale matrix loaded from a text file, handling edge pixels explicitly rather than skipping them.",
            "criteria": [
              "A single pass over the matrix applies the kernel, and edge pixels are handled explicitly rather than skipped or crashing."
            ],
            "hint": "Row major layout means element (r,c) sits at offset r*C + c.",
            "solution": "A convolution filter that reads a grayscale matrix from file, applies the kernel in one pass, and explicitly handles every edge pixel."
          }
        ],
        "tier": "Basic",
        "videos": [
          {
            "channel": "Low Level Learning",
            "title": "you will never ask about pointers again after watching this video",
            "length": "10 min",
            "url": "https://www.youtube.com/results?search_query=Low%20Level%20Learning%20you%20will%20never%20ask%20about%20pointers%20again%20after%20watching%20this%20video"
          },
          {
            "channel": "Jacob Sorber",
            "title": "Pointer Arithmetic in C",
            "length": "8 min",
            "url": "https://www.youtube.com/results?search_query=Jacob%20Sorber%20Pointer%20Arithmetic%20in%20C"
          },
          {
            "channel": "Computerphile",
            "title": "Cache Memory Explained",
            "length": "10 min",
            "url": "https://www.youtube.com/results?search_query=Computerphile%20Cache%20Memory%20Explained"
          }
        ]
      },
      {
        "no": 3,
        "week": 1,
        "session": 3,
        "title": "Basic 3: Strings, Buffers and Memory Safety",
        "video_url": null,
        "topic": "A C string is a character array with a terminating zero byte, and every library function trusts you to have put that byte there. The entire family of buffer overflow vulnerabilities comes from functions that write until they find a terminator with no knowledge of how much room they have. The professional habit: use the bounded variants, always reserve one byte for the terminator, and treat any function that cannot be told a size limit as unusable in production.\n\nKey rules:\n- A buffer for n visible characters needs n+1 bytes. The terminator is not optional.\n- Use snprintf rather than sprintf, and prefer bounded copies over unbounded ones.\n- Never use gets - it cannot be used safely under any circumstance and has been removed from the standard.\n- strlen counts characters up to the terminator; it is not the allocation size.\n\nWorked example - a bounded copy that always terminates:\nvoid safe_copy(char *dst, size_t dst_size, const char *src) {\n  if (dst_size == 0) return;\n  size_t i = 0;\n  while (i + 1 < dst_size && src[i]) { dst[i] = src[i]; i++; }\n  dst[i] = '\\0';\n}",
        "problems": [
          {
            "title": "Vulnerability audit",
            "points": 30,
            "difficulty": "Basic",
            "description": "You are given a 60 line program with four boundary defects. Find and fix each, and write one line explaining the failure mode.",
            "criteria": [
              "All four found, program clean under the address sanitizer."
            ],
            "hint": "A buffer for n visible characters needs n+1 bytes for the terminator.",
            "solution": "All four boundary defects found, fixed and explained, with a clean address-sanitizer run afterward."
          },
          {
            "title": "String utilities",
            "points": 40,
            "difficulty": "Core",
            "description": "Implement bounded versions of length, copy, concatenate and compare without using the standard library equivalents.",
            "criteria": [
              "All hidden tests pass including empty and maximum length inputs."
            ],
            "hint": "Reserve one byte for the terminator in every bounded operation.",
            "solution": "Bounded length/copy/concatenate/compare implementations passing every hidden test, including empty and max-length inputs."
          },
          {
            "title": "Module project: Input sanitizer with pattern matching",
            "points": 60,
            "difficulty": "Boss",
            "description": "Build a sanitizer that validates user input against a simple pattern language supporting literal characters, digit classes and wildcards, rejecting anything that would overrun a fixed destination buffer.",
            "criteria": [
              "The pattern language supports literal characters, digit classes and wildcards, and any input that would overrun the fixed destination buffer is rejected rather than copied."
            ],
            "hint": "Never use gets - treat any unbounded-write function as unusable.",
            "solution": "A pattern-matching sanitizer that validates against literals/digit-classes/wildcards and refuses any overrunning input."
          }
        ],
        "tier": "Basic",
        "videos": [
          {
            "channel": "Low Level Learning",
            "title": "buffer overflow explained",
            "length": "11 min",
            "url": "https://www.youtube.com/results?search_query=Low%20Level%20Learning%20buffer%20overflow%20explained"
          },
          {
            "channel": "Jacob Sorber",
            "title": "C strings and the null terminator",
            "length": "9 min",
            "url": "https://www.youtube.com/results?search_query=Jacob%20Sorber%20C%20strings%20and%20the%20null%20terminator"
          }
        ]
      },
      {
        "no": 4,
        "week": 2,
        "session": 1,
        "title": "Basic 4: Structs, Padding, Unions and Binary Layout",
        "video_url": null,
        "topic": "A struct is not the sum of its members. The compiler inserts padding so that each member begins at an address that is a multiple of its own alignment requirement, and adds trailing padding so arrays of the struct stay aligned. Reordering members from largest to smallest often shrinks a struct by a third with no code change. Unions place all members at the same address and are the standard tool for tagged variant records.\n\nKey rules:\n- A member of size s is placed at the next offset divisible by s; total size rounds up to the largest member alignment.\n- Ordering members from largest to smallest usually minimises padding.\n- A union is exactly as large as its largest member - only one member is valid at a time, so pair it with a tag.\n- Never write a struct straight to disk or a socket without a defined layout; padding is not portable.\n\nWorked example - two identical field sets, different sizes:\nstruct wasteful { char a; int b; char c; }; /* likely 12 bytes */\nstruct packed   { int b; char a; char c; };  /* likely 8 bytes  */",
        "problems": [
          {
            "title": "Size prediction",
            "points": 30,
            "difficulty": "Basic",
            "description": "Predict the size of six structs before compiling, then verify.",
            "criteria": [
              "At least five correct with a written padding map for each."
            ],
            "hint": "Each member is placed at the next offset divisible by its own size.",
            "solution": "Predicted sizes matching the real compiled sizes for at least five of six structs, each with a padding map."
          },
          {
            "title": "Struct diet",
            "points": 40,
            "difficulty": "Core",
            "description": "Reorder three supplied structs to minimise size without removing any field.",
            "criteria": [
              "Target sizes met exactly."
            ],
            "hint": "Ordering members from largest to smallest usually minimises padding.",
            "solution": "All three structs reordered to hit the target minimal size with every original field intact."
          },
          {
            "title": "Module project: Binary packet serializer",
            "points": 60,
            "difficulty": "Boss",
            "description": "Build a serializer that writes a network style header of fixed width fields into a byte buffer with an explicit layout, and a matching parser that reads it back, verified by a round trip test.",
            "criteria": [
              "The layout is explicit rather than relying on native struct padding, and a round-trip test proves the parser reconstructs exactly what the serializer wrote."
            ],
            "hint": "Never write a struct straight to disk without a defined layout - padding is not portable.",
            "solution": "A serializer/parser pair with an explicit, portable byte layout that survives a round-trip test."
          }
        ],
        "tier": "Basic",
        "videos": [
          {
            "channel": "Jacob Sorber",
            "title": "Structure padding and alignment in C",
            "length": "10 min",
            "url": "https://www.youtube.com/results?search_query=Jacob%20Sorber%20Structure%20padding%20and%20alignment%20in%20C"
          },
          {
            "channel": "Low Level Learning",
            "title": "how struct padding wastes your memory",
            "length": "9 min",
            "url": "https://www.youtube.com/results?search_query=Low%20Level%20Learning%20how%20struct%20padding%20wastes%20your%20memory"
          }
        ]
      },
      {
        "no": 5,
        "week": 1,
        "session": 1,
        "title": "Advanced 1: The Heap, Allocation and Leak Discipline",
        "video_url": null,
        "topic": "The heap is memory whose lifetime you control rather than the compiler. That control is the source of the four defects that dominate C bug reports: the leak, the use after free, the double free and the buffer overrun on heap memory. Every one is preventable by a discipline: every allocation has exactly one owner, and the free lives in the same file as the allocation.\n\nKey rules:\n- Every allocation call has exactly one matching release call on every path, including error paths.\n- After releasing a pointer, set it to null - a null dereference crashes loudly, a dangling one corrupts silently.\n- realloc may move the block - always assign its result, never assign it over the only pointer you have.\n- Zeroing allocation costs a pass over the memory - use it when the zero state matters, not by reflex.\n\nWorked example - a growable array that survives reallocation failure:\nint push(int **arr, size_t *len, size_t *cap, int value) {\n  if (*len == *cap) {\n    size_t next = *cap ? *cap * 2 : 8;\n    int *tmp = realloc(*arr, next * sizeof(int));\n    if (!tmp) return 0;\n    *arr = tmp; *cap = next;\n  }\n  (*arr)[(*len)++] = value; return 1;\n}",
        "problems": [
          {
            "title": "Leak hunt",
            "points": 30,
            "difficulty": "Basic",
            "description": "A supplied program leaks on three of its seven code paths. Find and fix all three.",
            "criteria": [
              "Clean report under the leak checker across every path including early returns."
            ],
            "hint": "Every allocation needs a matching release on every path, including error paths.",
            "solution": "All three leaking paths found and fixed, with a clean leak-checker report across every path."
          },
          {
            "title": "Growable buffer",
            "points": 40,
            "difficulty": "Core",
            "description": "Implement a dynamic array with push, pop, at and free operations.",
            "criteria": [
              "All hidden tests pass, no leaks, correct behaviour when allocation fails."
            ],
            "hint": "Never assign realloc's result over the only pointer you have.",
            "solution": "A dynamic array implementation passing every hidden test, leak-free, correct even when allocation fails."
          },
          {
            "title": "Module project: Fixed block arena allocator",
            "points": 60,
            "difficulty": "Boss",
            "description": "Build an allocator that requests one large block from the system and hands out fixed size chunks from it, with a free list and a statistics report showing chunks used, free and fragmentation.",
            "criteria": [
              "One large block backs all chunk allocations, a free list tracks reuse, and a statistics report shows chunks used, free and fragmentation."
            ],
            "hint": "Every allocation has exactly one owner.",
            "solution": "An arena allocator with a working free list and an accurate used/free/fragmentation report."
          }
        ],
        "tier": "Advanced",
        "videos": [
          {
            "channel": "Jacob Sorber",
            "title": "Allocating memory with malloc, calloc, realloc, and free",
            "length": "12 min",
            "url": "https://www.youtube.com/results?search_query=Jacob%20Sorber%20Allocating%20memory%20with%20malloc%2C%20calloc%2C%20realloc%2C%20and%20free"
          },
          {
            "channel": "Low Level Learning",
            "title": "i wrote my own memory allocator in C to prove a point",
            "length": "13 min",
            "url": "https://www.youtube.com/results?search_query=Low%20Level%20Learning%20i%20wrote%20my%20own%20memory%20allocator%20in%20C%20to%20prove%20a%20point"
          }
        ]
      },
      {
        "no": 6,
        "week": 1,
        "session": 2,
        "title": "Advanced 2: Linked Structures, Stacks, Queues and Hash Tables",
        "video_url": null,
        "topic": "Once memory can be requested at run time, data structures stop being fixed arrays and become graphs of nodes. A linked list gives constant time insertion at the cost of cache locality. A hash table with separate chaining is a fixed array of list heads, and its performance collapses from constant to linear when the hash distributes badly - measuring chain length matters more than choosing a clever hash.\n\nKey rules:\n- Load factor equals stored entries divided by bucket count - above roughly 0.75, grow the table and rehash.\n- Average lookup cost in a chained table is one plus half the load factor.\n- A stack is last in first out and a queue is first in first out - the choice encodes the algorithm.\n- Every node structure needs a matching destroy function that walks and releases the whole structure.\n\nWorked example - separate chaining insert with a simple string hash:\nunsigned long hash(const char *s) {\n  unsigned long h = 5381;\n  while (*s) h = h * 33 + (unsigned char)*s++;\n  return h;\n}\nvoid insert(struct node **buckets, size_t n, const char *key, int value) {\n  size_t i = hash(key) % n;\n  struct node *node = make_node(key, value);\n  node->next = buckets[i]; buckets[i] = node;\n}",
        "problems": [
          {
            "title": "List surgery",
            "points": 30,
            "difficulty": "Basic",
            "description": "Implement insert at position, delete by value and reverse in place for a singly linked list.",
            "criteria": [
              "All hidden tests pass including empty and single node lists, no leaks."
            ],
            "hint": "Every node structure needs a matching destroy function.",
            "solution": "All three operations correct on every hidden test, including empty and single-node lists, with no leaks."
          },
          {
            "title": "Collision study",
            "points": 40,
            "difficulty": "Core",
            "description": "Insert ten thousand keys under two different hash functions and report the chain length distribution.",
            "criteria": [
              "Both tables correct and a written comparison of the distributions."
            ],
            "hint": "Above roughly 0.75 load factor, grow the table and rehash.",
            "solution": "Both hash functions correctly compared, with a clear written analysis of their chain-length distributions."
          },
          {
            "title": "Module project: Instrumented hash table",
            "points": 60,
            "difficulty": "Boss",
            "description": "Build a hash table with separate chaining that reports load factor, longest chain and average probe length on demand, and automatically grows when the load factor is exceeded.",
            "criteria": [
              "Load factor, longest chain and average probe length are reported on demand, and the table grows automatically past the load factor threshold."
            ],
            "hint": "Average lookup cost is one plus half the load factor.",
            "solution": "A self-growing hash table with accurate on-demand load factor, longest-chain and average-probe reporting."
          }
        ],
        "tier": "Advanced",
        "videos": [
          {
            "channel": "Computerphile",
            "title": "Hashing Algorithms and Security",
            "length": "8 min",
            "url": "https://www.youtube.com/results?search_query=Computerphile%20Hashing%20Algorithms%20and%20Security"
          },
          {
            "channel": "Fireship",
            "title": "Data Structures in 10 Minutes",
            "length": "10 min",
            "url": "https://www.youtube.com/results?search_query=Fireship%20Data%20Structures%20in%2010%20Minutes"
          },
          {
            "channel": "Jacob Sorber",
            "title": "Linked lists in C",
            "length": "11 min",
            "url": "https://www.youtube.com/results?search_query=Jacob%20Sorber%20Linked%20lists%20in%20C"
          }
        ]
      },
      {
        "no": 7,
        "week": 1,
        "session": 3,
        "title": "Advanced 3: File Streams, Binary Records and Durable Writes",
        "video_url": null,
        "topic": "Text mode is for humans and binary mode is for machines, and mixing them is where most file corruption starts. Binary records give constant time access to record number n because the offset is simply n multiplied by the record size. Durability is the harder half: a system that must survive a crash writes to a temporary file, flushes it, and only then replaces the original.\n\nKey rules:\n- Record n begins at byte offset n multiplied by the record size.\n- Open binary files in binary mode explicitly.\n- A successful write is not a durable write - flush the stream, then rename the temporary file over the original.\n- Always check the return value of every read and write call.\n\nWorked example - atomic replace: write to a temporary file, then rename:\nint save_atomic(const char *path, const void *data, size_t n) {\n  char tmp[256]; snprintf(tmp, sizeof tmp, \"%s.tmp\", path);\n  FILE *f = fopen(tmp, \"wb\");\n  if (!f) return 0;\n  if (fwrite(data, 1, n, f) != n) { fclose(f); return 0; }\n  fflush(f); fclose(f);\n  return rename(tmp, path) == 0;\n}",
        "problems": [
          {
            "title": "Record seek",
            "points": 30,
            "difficulty": "Basic",
            "description": "Implement read, update and append by record number over a fixed width binary file.",
            "criteria": [
              "Correct behaviour at the first, last and beyond the end positions."
            ],
            "hint": "Record n begins at byte offset n multiplied by the record size.",
            "solution": "Read/update/append all correct at the first, last and beyond-the-end record positions."
          },
          {
            "title": "Crash simulation",
            "points": 40,
            "difficulty": "Core",
            "description": "Interrupt a write halfway and demonstrate that your atomic save leaves the original intact.",
            "criteria": [
              "Original file readable after every simulated interruption."
            ],
            "hint": "A successful write is not a durable write until the temp file is renamed over the original.",
            "solution": "The original file proven intact after every simulated mid-write interruption."
          },
          {
            "title": "Module project: Binary record database",
            "points": 60,
            "difficulty": "Boss",
            "description": "Build a small database supporting add, find by key, update in place and delete with a free list, backed by a binary file and an in memory index rebuilt on startup.",
            "criteria": [
              "Add/find/update/delete all work correctly, backed by a binary file, with the in-memory index correctly rebuilt on startup."
            ],
            "hint": "Flush the stream, then rename the temp file over the original for a durable write.",
            "solution": "A working record database with a free list for deletions and a correctly rebuilt startup index."
          }
        ],
        "tier": "Advanced",
        "videos": [
          {
            "channel": "Jacob Sorber",
            "title": "Reading and writing binary files in C",
            "length": "12 min",
            "url": "https://www.youtube.com/results?search_query=Jacob%20Sorber%20Reading%20and%20writing%20binary%20files%20in%20C"
          },
          {
            "channel": "Low Level Learning",
            "title": "how files actually work",
            "length": "11 min",
            "url": "https://www.youtube.com/results?search_query=Low%20Level%20Learning%20how%20files%20actually%20work"
          }
        ]
      },
      {
        "no": 8,
        "week": 2,
        "session": 1,
        "title": "Advanced 4: Systems Integration and the Course Capstone",
        "video_url": null,
        "topic": "Integration is a distinct skill from implementation. A program that combines dynamic structures, file persistence and user input has failure modes none of the parts have alone: a partially applied transaction, an index that disagrees with the file, memory freed by one subsystem while another still holds a pointer. The professional answer is a layered design with one owning module per resource and a single entry point for every state change.\n\nKey rules:\n- One module owns each resource - other modules borrow through functions, never raw pointers.\n- Every state change goes through a single function so logging, validation and rollback live in one place.\n- A transaction is applied only after every precondition is checked.\n- A regression harness that replays a recorded input file catches more than manual testing.\n\nWorked example - a single guarded entry point for state change:\nint apply_transfer(Bank *b, int from, int to, long paisa) {\n  if (paisa <= 0) return ERR_AMOUNT;\n  Account *a = find(b, from), *z = find(b, to);\n  if (!a || !z) return ERR_NO_ACCOUNT;\n  if (a->balance < paisa) return ERR_FUNDS;\n  a->balance -= paisa; z->balance += paisa;\n  return journal_append(b, from, to, paisa);\n}",
        "problems": [
          {
            "title": "Integration defects",
            "points": 30,
            "difficulty": "Basic",
            "description": "A supplied two subsystem program has an ownership defect and an index consistency defect. Diagnose and repair both.",
            "criteria": [
              "Both found, explained in writing and fixed."
            ],
            "hint": "One module should own each resource; others only borrow through functions.",
            "solution": "Both the ownership defect and the index consistency defect correctly diagnosed, explained and fixed."
          },
          {
            "title": "Regression harness",
            "points": 40,
            "difficulty": "Core",
            "description": "Build a replay harness that runs a recorded command file and compares output against an expected file.",
            "criteria": [
              "Harness detects a deliberately introduced regression."
            ],
            "hint": "A replay harness catches more than manual testing.",
            "solution": "A working replay harness that correctly flags a deliberately introduced regression."
          },
          {
            "title": "Course capstone: MiniBank distributed CLI and transaction engine",
            "points": 60,
            "difficulty": "Boss",
            "description": "Build a complete banking terminal application with heap managed accounts, binary persistence, a transaction journal, rollback on partial failure and zero leaks under a ten thousand operation stress run.",
            "criteria": [
              "Accounts are heap managed, persistence and a transaction journal both work, partial failures roll back, and a ten-thousand-operation stress run shows zero leaks."
            ],
            "hint": "Apply a transaction only after every precondition is checked, and make the journal write durable last.",
            "solution": "A complete MiniBank engine surviving a ten-thousand-operation stress run with correct rollback and zero leaks."
          }
        ],
        "tier": "Advanced",
        "videos": [
          {
            "channel": "Low Level Learning",
            "title": "how to structure a C project",
            "length": "12 min",
            "url": "https://www.youtube.com/results?search_query=Low%20Level%20Learning%20how%20to%20structure%20a%20C%20project"
          },
          {
            "channel": "Jacob Sorber",
            "title": "Writing a Makefile",
            "length": "10 min",
            "url": "https://www.youtube.com/results?search_query=Jacob%20Sorber%20Writing%20a%20Makefile"
          }
        ]
      }
    ]
  },
  {
    "key": "cpp-advanced",
    "course_code": "CPP2-ADV",
    "free": true,
    "friendly_grading": true,
    "default_language": "cpp",
    "title": "Advanced C++ Programming",
    "description": "Course 2 (final) of the C++ Programming free ladder - combines the Basic tier (formerly \"CPP2.2: Object Oriented Design in C++\") and the Advanced tier (formerly \"CPP2.3: Advanced C++ Engineering\") into one course, eight modules total, each with its own two assignments and module project.",
    "outcome": "Design a class whose invalid states are unrepresentable; manage a resource inside a class so copying and destruction are always correct; model a hierarchy where the base class earns its place and avoid slicing; use runtime polymorphism deliberately and explain its cost. Write generic containers and functions and read the errors they produce; replace hand written loops with standard algorithms and express intent through lambdas; express ownership in the type system and serialise an object graph; combine ownership, algorithms and persistence into a defensible desktop application.",
    "keywords": [
      "C++ OOP course",
      "C++ inheritance",
      "Rule of Three C++",
      "virtual functions C++",
      "intermediate C++ programming",
      "C++ templates course",
      "C++ smart pointers",
      "C++ STL algorithms",
      "C++ serialization",
      "advanced C++ engineering"
    ],
    "key_concepts": [
      "Class invariants",
      "Rule of Three",
      "Inheritance & slicing",
      "Virtual functions & dynamic dispatch",
      "Abstract interfaces",
      "Templates & generic programming",
      "Standard algorithms & lambdas",
      "Smart pointers & ownership",
      "Object graph serialization",
      "Project integration"
    ],
    "pass_mark": 60,
    "titleNames": [
      "Invariant Guard",
      "Dispatch Architect",
      "Template Engineer",
      "Ownership Architect"
    ],
    "levels": [
      {
        "no": 1,
        "week": 1,
        "session": 1,
        "title": "Basic 1: Classes, Invariants and Encapsulation",
        "video_url": null,
        "topic": "An invariant is a statement about an object that is true from the end of its constructor to the start of its destructor - a balance is never negative, a date is always valid. Encapsulation exists to protect invariants, not to hide data for its own sake; a class that exposes setters for every field has encapsulation in syntax only. Member initializer lists matter because members construct in declaration order before the constructor body runs - assigning in the body means constructing twice.\n\nKey rules:\n- State the invariant in a comment above the class. If you cannot state it, the class has no reason to exist.\n- Members initialise in declaration order, not the order written in the list.\n- Mark single argument constructors explicit unless an implicit conversion is genuinely wanted.\n- Prefer a constructor that rejects bad input over a setter that validates after the fact.\n\nWorked example - a wallet whose invariant cannot be violated from outside:\nclass Wallet {\n  long paisa_; // invariant: paisa_ >= 0\npublic:\n  explicit Wallet(long paisa) : paisa_(paisa < 0 ? 0 : paisa) {}\n  bool withdraw(long amount) {\n    if (amount <= 0 || amount > paisa_) return false;\n    paisa_ -= amount; return true;\n  }\n  long balance() const { return paisa_; }\n};",
        "problems": [
          {
            "title": "Invariant statements",
            "points": 30,
            "difficulty": "Basic",
            "description": "For five supplied classes, write the invariant and identify the member function that can break it.",
            "criteria": [
              "All five invariants stated, at least four breaches found."
            ],
            "hint": "If you cannot state the invariant, the class has no reason to exist.",
            "solution": "Five correctly stated invariants, with at least four real breaching member functions identified."
          },
          {
            "title": "Close the class",
            "points": 40,
            "difficulty": "Core",
            "description": "Rewrite a struct with public fields into a class that cannot enter an invalid state.",
            "criteria": [
              "All hidden misuse tests are rejected."
            ],
            "hint": "Prefer a constructor that rejects bad input over a setter that validates after the fact.",
            "solution": "A fully encapsulated class rejecting every hidden misuse attempt."
          },
          {
            "title": "Module project: Multi currency wallet",
            "points": 60,
            "difficulty": "Boss",
            "description": "Build a wallet class supporting several currencies with a conversion table, rejecting negative balances, unknown currencies and precision losing conversions at the interface.",
            "criteria": [
              "Negative balances, unknown currencies and precision-losing conversions are all rejected at the constructor/interface, not left to the caller to validate."
            ],
            "hint": "State the invariant in a comment above the class.",
            "solution": "A multi-currency wallet whose interface makes negative balances, unknown currencies and lossy conversions unrepresentable."
          }
        ],
        "tier": "Basic",
        "videos": [
          {
            "channel": "The Cherno",
            "title": "CLASSES in C++",
            "length": "10 min",
            "url": "https://www.youtube.com/results?search_query=The%20Cherno%20CLASSES%20in%20C%2B%2B"
          }
        ]
      },
      {
        "no": 2,
        "week": 1,
        "session": 2,
        "title": "Basic 2: Object Lifetime, Destructors and the Rule of Three",
        "video_url": null,
        "topic": "When a class owns a resource, the compiler generated copy operations copy the handle rather than the resource, so two objects believe they own the same memory and the second destructor releases it twice. The Rule of Three: if you need any one of destructor, copy constructor or copy assignment, you almost certainly need all three. Tying resource release to object destruction is the single most important idea in C++ - it makes cleanup automatic on every exit path including exceptions.\n\nKey rules:\n- Rule of Three: define the destructor, copy constructor and copy assignment operator together or none of them.\n- Copy assignment must handle self assignment and release the old resource before taking the new one.\n- Destruction happens in reverse order of construction, automatically, on every exit path.\n- A shallow copy of an owning class is a double free waiting for a destructor to run.\n\nWorked example - an owning buffer with all three operations defined:\nclass Buffer {\n  int* data_; std::size_t n_;\npublic:\n  explicit Buffer(std::size_t n) : data_(new int[n]{}), n_(n) {}\n  ~Buffer() { delete[] data_; }\n  Buffer(const Buffer& o) : data_(new int[o.n_]), n_(o.n_) { std::copy(o.data_, o.data_ + n_, data_); }\n  Buffer& operator=(Buffer o) { std::swap(data_, o.data_); std::swap(n_, o.n_); return *this; }\n};",
        "problems": [
          {
            "title": "Double free diagnosis",
            "points": 30,
            "difficulty": "Basic",
            "description": "A supplied class crashes on copy. Explain the mechanism and fix it.",
            "criteria": [
              "Correct written explanation and a clean run under the sanitizer."
            ],
            "hint": "A shallow copy of an owning class is a double free waiting to happen.",
            "solution": "The double-free mechanism correctly explained, with a fix producing a clean sanitizer run."
          },
          {
            "title": "Rule of Three drill",
            "points": 40,
            "difficulty": "Core",
            "description": "Add the three operations to two supplied resource owning classes.",
            "criteria": [
              "All copy, assign and destroy tests pass with no leaks."
            ],
            "hint": "Define destructor, copy constructor and copy assignment together, or none of them.",
            "solution": "Both classes given a correct destructor, copy constructor and copy assignment, leak-free under every test."
          },
          {
            "title": "Module project: Owning matrix container",
            "points": 60,
            "difficulty": "Boss",
            "description": "Build a dynamic matrix class that owns its storage, supports copy and assignment correctly, provides bounds checked access and reports its own allocation count for verification.",
            "criteria": [
              "Copy and assignment are both correct under the Rule of Three, access is bounds-checked, and an allocation counter is exposed for verification."
            ],
            "hint": "Copy assignment must handle self-assignment and release the old resource first.",
            "solution": "A self-owning matrix class with correct copy/assignment, bounds-checked access and a verifiable allocation counter."
          }
        ],
        "tier": "Basic",
        "videos": [
          {
            "channel": "The Cherno",
            "title": "Object Lifetime in C++",
            "length": "11 min",
            "url": "https://www.youtube.com/results?search_query=The%20Cherno%20Object%20Lifetime%20in%20C%2B%2B"
          }
        ]
      },
      {
        "no": 3,
        "week": 1,
        "session": 3,
        "title": "Basic 3: Inheritance, Hierarchies and Slicing",
        "video_url": null,
        "topic": "Inheritance says a derived object is substitutable for a base object everywhere the base is expected. If that is not true for your hierarchy, composition is the correct tool. Slicing is the classic trap: assigning a derived object into a base variable copies only the base part and silently discards the rest, which is why polymorphic collections store pointers or references rather than values. Construction runs base to derived; destruction runs derived to base.\n\nKey rules:\n- Substitution test: if a derived object cannot stand in for the base everywhere, do not inherit.\n- Slicing copies the base part only - store pointers or references instead.\n- Construction runs base to derived; destruction runs derived to base.\n- Protected means visible to derived classes only - use it sparingly, it widens the interface you must maintain.\n\nWorked example - slicing shown side by side with the correct form:\nAsset a = Equity{ \"PSO\", 1200 };        // sliced: Equity part discarded\nstd::vector<std::unique_ptr<Asset>> book;\nbook.push_back(std::make_unique<Equity>(\"PSO\", 1200)); // correct storage",
        "problems": [
          {
            "title": "Substitution audit",
            "points": 30,
            "difficulty": "Basic",
            "description": "For four supplied hierarchies, decide whether inheritance or composition is correct and justify.",
            "criteria": [
              "At least three correct with reasons."
            ],
            "hint": "If a derived object cannot stand in for the base everywhere, do not inherit.",
            "solution": "At least three of four hierarchies correctly judged as inheritance or composition, with sound reasoning."
          },
          {
            "title": "Slicing repair",
            "points": 40,
            "difficulty": "Core",
            "description": "A supplied portfolio loses derived data. Diagnose and fix.",
            "criteria": [
              "Derived behaviour preserved through the collection."
            ],
            "hint": "Store pointers or references in polymorphic collections, never values.",
            "solution": "The slicing bug diagnosed and fixed by switching to pointer/reference storage, preserving derived behaviour."
          },
          {
            "title": "Module project: Financial asset hierarchy",
            "points": 60,
            "difficulty": "Boss",
            "description": "Build a hierarchy of asset types with shared base behaviour and type specific valuation, stored polymorphically and printed through a common interface.",
            "criteria": [
              "Assets are stored polymorphically (no slicing) and printed through one shared interface while each type still computes its own valuation."
            ],
            "hint": "Slicing copies only the base part - store pointers or references.",
            "solution": "An asset hierarchy stored without slicing, each type valuing itself correctly through a shared printing interface."
          }
        ],
        "tier": "Basic",
        "videos": [
          {
            "channel": "The Cherno",
            "title": "Inheritance in C++",
            "length": "10 min",
            "url": "https://www.youtube.com/results?search_query=The%20Cherno%20Inheritance%20in%20C%2B%2B"
          }
        ]
      },
      {
        "no": 4,
        "week": 2,
        "session": 1,
        "title": "Basic 4: Virtual Functions, Interfaces and Dynamic Dispatch",
        "video_url": null,
        "topic": "A virtual function is resolved by looking up a pointer in a table attached to the object at run time rather than at compile time. That indirection costs one pointer per object and one lookup per call - negligible in almost every application. The rule that matters most: any base class intended for polymorphic deletion must have a virtual destructor, or deleting through a base pointer will run the wrong destructor and leak the derived part.\n\nKey rules:\n- A pure virtual function makes the class abstract - that class becomes an interface, not an implementation.\n- Any polymorphic base class needs a virtual destructor.\n- Mark overrides with the override keyword - it turns a silent signature mismatch into a compile error.\n- Cost of dispatch: one pointer per object plus one indirect call. Do not avoid it on speculation.\n\nWorked example - an interface and a polymorphic collection:\nstruct Reportable {\n  virtual ~Reportable() = default;\n  virtual double value() const = 0;\n  virtual std::string label() const = 0;\n};\ndouble total(const std::vector<std::unique_ptr<Reportable>>& items) {\n  double sum = 0;\n  for (const auto& i : items) sum += i->value(); // dispatched at run time\n  return sum;\n}",
        "problems": [
          {
            "title": "Missing virtual destructor",
            "points": 30,
            "difficulty": "Basic",
            "description": "Demonstrate the leak caused by a non virtual destructor, then fix it.",
            "criteria": [
              "Leak shown before and absent after."
            ],
            "hint": "Any polymorphic base class needs a virtual destructor.",
            "solution": "The leak reproduced with a non-virtual destructor, then eliminated once it is made virtual."
          },
          {
            "title": "Interface extraction",
            "points": 40,
            "difficulty": "Core",
            "description": "Extract an interface from three concrete classes and rewrite the caller to depend only on it.",
            "criteria": [
              "Caller compiles with no concrete class included."
            ],
            "hint": "A pure virtual function makes the class abstract.",
            "solution": "A clean interface extracted from all three classes, with the caller depending on it alone."
          },
          {
            "title": "Module project: Polymorphic portfolio report",
            "points": 60,
            "difficulty": "Boss",
            "description": "Build a reporting engine that holds mixed asset types behind one interface, computes totals and per category breakdowns and prints a formatted statement.",
            "criteria": [
              "Mixed asset types are held behind one interface with a virtual destructor, and totals/per-category breakdowns are computed and printed correctly."
            ],
            "hint": "Cost of dispatch is one pointer per object plus one indirect call - use it deliberately here.",
            "solution": "A polymorphic reporting engine producing correct totals and category breakdowns across mixed asset types."
          }
        ],
        "tier": "Basic",
        "videos": [
          {
            "channel": "The Cherno",
            "title": "Virtual Functions in C++",
            "length": "10 min",
            "url": "https://www.youtube.com/results?search_query=The%20Cherno%20Virtual%20Functions%20in%20C%2B%2B"
          }
        ]
      },
      {
        "no": 5,
        "week": 1,
        "session": 1,
        "title": "Advanced 1: Templates and Generic Programming",
        "video_url": null,
        "topic": "A template is not a function, it is a recipe the compiler uses to write functions on demand. Nothing is generated until the template is instantiated with concrete types, which is why template definitions live in headers. Template error messages are long because they unwind the whole instantiation chain - read them from the bottom, where the original call site is.\n\nKey rules:\n- Templates are instantiated on use - the definition must be visible, so it stays in the header.\n- Read template errors from the last line upward.\n- Specialisation lets one type take a different implementation without changing the call site.\n- Constrain templates where possible so misuse fails at the interface rather than deep inside.\n\nWorked example - a generic ring buffer with a bounds contract:\ntemplate <typename T, std::size_t N>\nclass Ring {\n  T slot_[N]; std::size_t head_ = 0, count_ = 0;\npublic:\n  bool push(const T& v) {\n    if (count_ == N) return false;\n    slot_[(head_ + count_++) % N] = v; return true;\n  }\n};",
        "problems": [
          {
            "title": "Generalise three functions",
            "points": 30,
            "difficulty": "Basic",
            "description": "Convert three type specific functions into templates without losing behaviour.",
            "criteria": [
              "All hidden tests pass across at least three instantiated types."
            ],
            "hint": "Template definitions must stay in the header - they are instantiated on use.",
            "solution": "All three functions correctly templated, passing every hidden test across at least three instantiated types."
          },
          {
            "title": "Error archaeology",
            "points": 40,
            "difficulty": "Core",
            "description": "Diagnose four template compilation failures from their messages alone.",
            "criteria": [
              "Correct root cause for at least three."
            ],
            "hint": "Read template errors from the last line upward.",
            "solution": "The correct root cause identified for at least three of the four template failures."
          },
          {
            "title": "Module project: Generic bounded container",
            "points": 60,
            "difficulty": "Boss",
            "description": "Build a fixed capacity generic container with push, pop, peek and iteration, correct for both value types and types that own resources.",
            "criteria": [
              "Push/pop/peek/iteration are all correct both for plain value types and for resource-owning types."
            ],
            "hint": "Constrain templates so misuse fails at the interface.",
            "solution": "A generic bounded container proven correct for both plain values and resource-owning types."
          }
        ],
        "tier": "Advanced",
        "videos": [
          {
            "channel": "The Cherno",
            "title": "Templates in C++",
            "length": "12 min",
            "url": "https://www.youtube.com/results?search_query=The%20Cherno%20Templates%20in%20C%2B%2B"
          },
          {
            "channel": "Fireship",
            "title": "C++ Templates explained",
            "length": "8 min",
            "url": "https://www.youtube.com/results?search_query=Fireship%20C%2B%2B%20Templates%20explained"
          }
        ]
      },
      {
        "no": 6,
        "week": 1,
        "session": 2,
        "title": "Advanced 2: Standard Algorithms, Maps and Lambda Closures",
        "video_url": null,
        "topic": "Every hand written loop is a small opportunity for an off by one error. Standard algorithms remove that surface and name the intent: a call to sort or accumulate tells the reader what is happening without reading the body. The capture clause is where care is needed - capturing by reference into something that outlives the scope is the standard way to create a dangling reference.\n\nKey rules:\n- Ordered map lookup is logarithmic; unordered map lookup is constant on average.\n- Capture by value copies at the point of definition; capture by reference must not outlive the referenced object.\n- The accumulate algorithm folds a range into one value and replaces most manual sum loops.\n- Prefer a named algorithm over a raw loop wherever one exists.\n\nWorked example - an analytics pipeline built from algorithms and lambdas:\nauto total = std::accumulate(tx.begin(), tx.end(), 0.0,\n  [](double acc, const Tx& t) { return acc + t.amount; });\nstd::map<std::string, double> by_category;\nfor (const auto& t : tx) by_category[t.category] += t.amount;",
        "problems": [
          {
            "title": "Loop replacement",
            "points": 30,
            "difficulty": "Basic",
            "description": "Replace six raw loops with standard algorithms.",
            "criteria": [
              "Identical output and no explicit index variables remaining."
            ],
            "hint": "Prefer a named algorithm over a raw loop wherever one exists.",
            "solution": "All six loops replaced with standard algorithms, output identical, no manual indices remaining."
          },
          {
            "title": "Capture defect",
            "points": 40,
            "difficulty": "Core",
            "description": "A supplied lambda dangles. Diagnose and fix it two ways.",
            "criteria": [
              "Both fixes correct and explained."
            ],
            "hint": "A reference captured into something that outlives the scope dangles.",
            "solution": "The dangling capture diagnosed and fixed two distinct ways, both explained correctly."
          },
          {
            "title": "Module project: Transaction analytics engine",
            "points": 60,
            "difficulty": "Boss",
            "description": "Build an engine that loads transactions and produces category totals, monthly trends and the top five outliers, implemented entirely through standard algorithms and lambdas.",
            "criteria": [
              "Category totals, monthly trends and the top five outliers are all produced using standard algorithms and lambdas, not hand-written loops."
            ],
            "hint": "Accumulate folds a range into one value - use it for the totals.",
            "solution": "A fully algorithm-and-lambda-driven analytics engine producing correct totals, trends and outliers."
          }
        ],
        "tier": "Advanced",
        "videos": [
          {
            "channel": "The Cherno",
            "title": "Lambdas in C++",
            "length": "11 min",
            "url": "https://www.youtube.com/results?search_query=The%20Cherno%20Lambdas%20in%20C%2B%2B"
          },
          {
            "channel": "Fireship",
            "title": "Functional Programming in 100 Seconds",
            "length": "3 min",
            "url": "https://www.youtube.com/results?search_query=Fireship%20Functional%20Programming%20in%20100%20Seconds"
          }
        ]
      },
      {
        "no": 7,
        "week": 1,
        "session": 3,
        "title": "Advanced 3: Smart Pointers, Ownership and Serialization",
        "video_url": null,
        "topic": "A raw pointer says nothing about ownership, and that ambiguity is the root of most memory defects in large C++ code bases. A unique pointer says exactly one owner; a shared pointer says reference counted shared ownership; a weak pointer breaks the reference cycles that would otherwise leak. Serializing a graph needs stable identifiers - write nodes once and refer to them by identifier afterwards.\n\nKey rules:\n- Unique ownership by default; reach for shared ownership only when lifetime genuinely cannot be determined.\n- Two shared pointers referring to each other never reach zero - break the cycle with a weak reference.\n- Make the owning object with a factory helper rather than a bare allocation, for exception safety.\n- Serialising a graph needs stable identifiers.\n\nWorked example - ownership expressed in the signatures:\nstd::unique_ptr<Node> make_tree();\nvoid inspect(const Node& n);\nvoid adopt(std::unique_ptr<Node> n);\nstd::weak_ptr<Node> parent;",
        "problems": [
          {
            "title": "Ownership rewrite",
            "points": 30,
            "difficulty": "Basic",
            "description": "Convert a raw pointer program to smart pointers without changing behaviour.",
            "criteria": [
              "No explicit deletes remain and no leaks are reported."
            ],
            "hint": "Unique ownership is the default choice.",
            "solution": "Every raw pointer converted to a smart pointer, no explicit deletes remaining, no leaks reported."
          },
          {
            "title": "Cycle breaker",
            "points": 40,
            "difficulty": "Core",
            "description": "A supplied parent and child structure leaks. Fix it with a weak reference.",
            "criteria": [
              "Leak eliminated, traversal still works both directions."
            ],
            "hint": "A weak pointer breaks the reference cycle that shared pointers would create.",
            "solution": "The reference cycle broken with a weak pointer, leak eliminated, both-direction traversal preserved."
          },
          {
            "title": "Module project: Object graph serializer",
            "points": 60,
            "difficulty": "Boss",
            "description": "Build a serializer that writes a linked object graph to both a comma separated and a structured format and reads it back, verified by a round trip equality test.",
            "criteria": [
              "Both output formats round-trip correctly, verified by an equality test against the original graph."
            ],
            "hint": "Serializing a graph needs stable identifiers, not raw addresses.",
            "solution": "A dual-format serializer whose round trip is verified equal to the original object graph."
          }
        ],
        "tier": "Advanced",
        "videos": [
          {
            "channel": "The Cherno",
            "title": "SMART POINTERS in C++",
            "length": "12 min",
            "url": "https://www.youtube.com/results?search_query=The%20Cherno%20SMART%20POINTERS%20in%20C%2B%2B"
          }
        ]
      },
      {
        "no": 8,
        "week": 2,
        "session": 1,
        "title": "Advanced 4: Integration and the Course Capstone",
        "video_url": null,
        "topic": "Integration in C++ is mostly about drawing the ownership map before writing the code: which object owns the store, which borrow from it, what happens to open references when an entry is deleted. A design where those answers are in the signatures rather than the programmer's memory survives change. A project that cannot be built by someone else in one command is not finished.\n\nKey rules:\n- Draw the ownership map first - every arrow is either owning, borrowing or observing.\n- Deletion must invalidate every borrow - design the interface so a stale borrow cannot compile.\n- One build command - if setup runs past three steps, the build is part of the defect surface.\n- Public interface documented at the header; implementation detail never leaks into it.\n\nWorked example - interface that makes stale borrowing impossible:\nclass Ledger {\n  std::vector<Entry> entries_;\npublic:\n  std::size_t add(Entry e) { entries_.push_back(std::move(e)); return entries_.size() - 1; }\n  const Entry* at(std::size_t i) const { return i < entries_.size() ? &entries_[i] : nullptr; }\n};",
        "problems": [
          {
            "title": "Ownership map",
            "points": 30,
            "difficulty": "Basic",
            "description": "Produce an ownership diagram for a supplied three class program and identify the one incorrect arrow.",
            "criteria": [
              "Diagram complete and the defect found."
            ],
            "hint": "Every arrow is either owning, borrowing or observing.",
            "solution": "A complete ownership diagram with the single incorrect arrow correctly identified."
          },
          {
            "title": "One command build",
            "points": 40,
            "difficulty": "Core",
            "description": "Package a multi file project so it builds from a single command on a clean machine.",
            "criteria": [
              "Build succeeds from a fresh clone."
            ],
            "hint": "If setup runs past three steps, the build is part of the defect surface.",
            "solution": "The project building successfully with one command from a completely fresh clone."
          },
          {
            "title": "Course capstone: LedgerLens expense management and analytics engine",
            "points": 60,
            "difficulty": "Boss",
            "description": "Build a complete desktop expense system with a polymorphic category hierarchy, owned resources with no raw allocation, standard algorithm reporting and serialization to two interchange formats.",
            "criteria": [
              "The category hierarchy is polymorphic, no raw allocation is used, reporting runs through standard algorithms, and serialization supports two interchange formats."
            ],
            "hint": "Draw the ownership map before writing the code.",
            "solution": "A complete LedgerLens engine meeting every constraint: polymorphic categories, no raw allocation, algorithm-driven reporting, two serialization formats."
          }
        ],
        "tier": "Advanced",
        "videos": [
          {
            "channel": "The Cherno",
            "title": "How to make your C++ project structure",
            "length": "13 min",
            "url": "https://www.youtube.com/results?search_query=The%20Cherno%20How%20to%20make%20your%20C%2B%2B%20project%20structure"
          },
          {
            "channel": "Fireship",
            "title": "CMake in 100 Seconds",
            "length": "3 min",
            "url": "https://www.youtube.com/results?search_query=Fireship%20CMake%20in%20100%20Seconds"
          }
        ]
      }
    ]
  },
  {
    "key": "python-advanced",
    "course_code": "PY3-ADV",
    "free": true,
    "friendly_grading": true,
    "default_language": "python",
    "title": "Advanced Python Programming",
    "description": "Course 2 (final) of the Python Programming free ladder - combines the Basic tier (formerly \"PY3.2: Python Data Structures and Object Oriented Design\") and the Advanced tier (formerly \"PY3.3: Advanced Python Engineering\") into one course, eight modules total, each with its own two assignments and module project.",
    "outcome": "Select the right container from access pattern and cost; design classes whose state cannot be corrupted from outside; make objects behave like built-in types through protocols; choose recursion where it clarifies and implement backtracking with pruning. Design failure behaviour deliberately rather than letting it happen; process data larger than memory with lazy pipelines and guaranteed cleanup; store structured data durably and consume a real API with a sane failure policy; ship a tested, installable Python application with a documented interface.",
    "keywords": [
      "Python data structures course",
      "Python OOP",
      "dunder methods Python",
      "Python recursion",
      "intermediate Python programming",
      "Python exceptions course",
      "Python generators",
      "Python API client",
      "Python testing pytest",
      "advanced Python engineering"
    ],
    "key_concepts": [
      "Dictionaries & sets",
      "Properties & guarded state",
      "Dunder methods & protocols",
      "Recursion & backtracking",
      "Exception hierarchies",
      "Generators & context managers",
      "Schema migration",
      "Resilient API clients",
      "Testing & packaging"
    ],
    "pass_mark": 60,
    "titleNames": [
      "Container Chooser",
      "Protocol Designer",
      "Defensive Coder",
      "Engineering Lead"
    ],
    "levels": [
      {
        "no": 1,
        "week": 1,
        "session": 1,
        "title": "Basic 1: Dictionaries, Sets and Choosing a Container",
        "video_url": null,
        "topic": "A dictionary is a hash table: lookup by key is constant on average and keys must be hashable, therefore immutable. A set is the same machinery without values, turning membership testing from a linear scan into a constant time check - the single most common performance improvement in beginner Python. The correct container is chosen by asking one question: what is the access pattern.\n\nKey rules:\n- Dictionary and set lookup is constant on average. List membership testing is linear.\n- Keys must be hashable, therefore immutable - a list can never be a key, a tuple can.\n- Set algebra (union, intersection, difference, symmetric difference) replaces nested loops.\n- Counting occurrences is a dictionary of counts, or Counter from the standard library.\n\nWorked example - membership and counting done the right way:\nwords = text.lower().split()\nstop = {\"the\", \"and\", \"of\", \"a\"}     # constant time membership\ncounts = {}\nfor w in words:\n    if w in stop: continue\n    counts[w] = counts.get(w, 0) + 1",
        "problems": [
          {
            "title": "Container choice",
            "points": 30,
            "difficulty": "Basic",
            "description": "For eight described scenarios choose the container and justify in one line.",
            "criteria": [
              "At least six correct with reasons."
            ],
            "hint": "Ask one question: what is the access pattern?",
            "solution": "At least six of eight container choices correct, each with a sound one-line justification."
          },
          {
            "title": "Linear to constant",
            "points": 40,
            "difficulty": "Core",
            "description": "Speed up a supplied program by replacing list membership tests.",
            "criteria": [
              "Identical output and a measured speed up on the large input."
            ],
            "hint": "Set membership testing is constant time; list membership testing is linear.",
            "solution": "Membership tests replaced with sets, producing identical output and a measured speedup."
          },
          {
            "title": "Module project: Multi file word frequency indexer",
            "points": 60,
            "difficulty": "Boss",
            "description": "Build an indexer that scans a folder of text files, builds a term to document map and answers queries with ranked results and per file counts.",
            "criteria": [
              "A term-to-document map is built across the folder, and queries return ranked results with per-file counts."
            ],
            "hint": "Dictionary lookup is constant on average - use it for the term-to-document map.",
            "solution": "An indexer scanning a whole folder, answering ranked queries with correct per-file counts."
          }
        ],
        "tier": "Basic",
        "videos": [
          {
            "channel": "Corey Schafer",
            "title": "Python Tutorial: Dictionary",
            "length": "10 min",
            "url": "https://www.youtube.com/results?search_query=Corey%20Schafer%20Python%20Tutorial%3A%20Dictionary"
          },
          {
            "channel": "mCoding",
            "title": "Sets in Python",
            "length": "9 min",
            "url": "https://www.youtube.com/results?search_query=mCoding%20Sets%20in%20Python"
          },
          {
            "channel": "Fireship",
            "title": "Hash Tables in 100 Seconds",
            "length": "3 min",
            "url": "https://www.youtube.com/results?search_query=Fireship%20Hash%20Tables%20in%20100%20Seconds"
          }
        ]
      },
      {
        "no": 2,
        "week": 1,
        "session": 2,
        "title": "Basic 2: Classes, Properties and Guarded State",
        "video_url": null,
        "topic": "Python has no private access, only conventions, which shifts the burden of protection onto design. The property decorator keeps an attribute's simple access syntax while gaining validation on write, so existing calling code never changes. Class attributes versus instance attributes is the other trap: a class attribute is shared by every instance, and a mutable one shared this way produces defects that look like haunting.\n\nKey rules:\n- A class attribute is shared by all instances - never make it mutable unless sharing is the intent.\n- The property decorator adds validation without changing the attribute access syntax used by callers.\n- A single leading underscore is a convention meaning internal - nothing enforces it, so document the contract.\n- Define a readable string representation for every class you will debug, and a precise one for developers.\n\nWorked example - a property that guards a state transition:\nclass Task:\n    VALID = {\"todo\", \"doing\", \"done\"}\n    def __init__(self, title):\n        self.title = title; self._status = \"todo\"\n    @property\n    def status(self): return self._status\n    @status.setter\n    def status(self, value):\n        if value not in self.VALID: raise ValueError(f\"unknown status: {value}\")\n        self._status = value",
        "problems": [
          {
            "title": "Shared state defect",
            "points": 30,
            "difficulty": "Basic",
            "description": "A supplied class shares a list between instances. Diagnose and fix.",
            "criteria": [
              "Instances independent, written explanation correct."
            ],
            "hint": "A mutable class attribute is shared by every instance.",
            "solution": "The shared-list defect diagnosed and fixed so every instance holds its own independent list."
          },
          {
            "title": "Add the guards",
            "points": 40,
            "difficulty": "Core",
            "description": "Convert three plain attributes into validated properties.",
            "criteria": [
              "All invalid assignment tests raise, valid ones pass unchanged."
            ],
            "hint": "The property decorator validates on write without changing access syntax.",
            "solution": "All three attributes converted to properties that reject invalid values and accept valid ones unchanged."
          },
          {
            "title": "Module project: Guarded task model",
            "points": 60,
            "difficulty": "Boss",
            "description": "Build a task class with validated status transitions, priority bounds, due date checking and a readable representation, verified by a suite of misuse tests.",
            "criteria": [
              "Status transitions, priority bounds and due dates are all validated by properties, and a misuse test suite passes."
            ],
            "hint": "Guard every field that could be set to an invalid value from outside.",
            "solution": "A task class with fully guarded state, passing every misuse test in the verification suite."
          }
        ],
        "tier": "Basic",
        "videos": [
          {
            "channel": "Corey Schafer",
            "title": "Python OOP Tutorial 1: Classes and Instances",
            "length": "15 min",
            "url": "https://www.youtube.com/results?search_query=Corey%20Schafer%20Python%20OOP%20Tutorial%201%3A%20Classes%20and%20Instances"
          }
        ]
      },
      {
        "no": 3,
        "week": 1,
        "session": 3,
        "title": "Basic 3: Dunder Methods and Protocol Design",
        "video_url": null,
        "topic": "Python is built on protocols rather than interfaces: an object is iterable because it implements the iteration protocol, sortable because it implements comparison, printable because it implements string conversion. Two rules are easy to miss: equality and hashing must agree, and the developer representation should ideally be text that recreates the object.\n\nKey rules:\n- Implement the string method for users and the representation method for developers.\n- If two objects compare equal they must hash equal - define both together or neither.\n- Implementing less-than is enough for sorting; the remaining comparisons can be generated.\n- Implementing iteration lets your object work with loops, comprehensions and the whole standard library.\n\nWorked example - a polynomial type that sorts, prints and adds natively:\nclass Poly:\n    def __init__(self, coeffs): self.c = list(coeffs)\n    def __repr__(self): return f\"Poly({self.c})\"\n    def __eq__(self, o): return isinstance(o, Poly) and self.c == o.c\n    def __hash__(self): return hash(tuple(self.c))\n    def __lt__(self, o): return self.degree() < o.degree()\n    def degree(self): return len(self.c) - 1",
        "problems": [
          {
            "title": "Protocol completion",
            "points": 30,
            "difficulty": "Basic",
            "description": "Given a partial class, add the representation, equality, hashing and ordering methods.",
            "criteria": [
              "Object sorts, prints and works as a dictionary key."
            ],
            "hint": "If two objects compare equal they must hash equal.",
            "solution": "All four protocol methods added correctly, with the object sorting, printing and working as a dict key."
          },
          {
            "title": "Custom iterator",
            "points": 40,
            "difficulty": "Core",
            "description": "Implement a class that yields a Fibonacci sequence lazily through the iteration protocol.",
            "criteria": [
              "Works in a loop and in a comprehension without materialising the whole sequence."
            ],
            "hint": "Implementing iteration lets your object work with loops and comprehensions.",
            "solution": "A lazily-iterating Fibonacci class that never materialises the full sequence, working in loops and comprehensions."
          },
          {
            "title": "Module project: Polynomial mathematics type",
            "points": 60,
            "difficulty": "Boss",
            "description": "Build a polynomial class supporting addition, multiplication, evaluation, sorting by degree and readable printing, working correctly inside standard library containers.",
            "criteria": [
              "Addition, multiplication, evaluation, sorting by degree and printing all work, and the type behaves correctly inside standard library containers."
            ],
            "hint": "Equality and hashing must agree if the type is used as a dict key or set member.",
            "solution": "A fully protocol-complete polynomial type that adds, multiplies, evaluates, sorts and prints correctly."
          }
        ],
        "tier": "Basic",
        "videos": [
          {
            "channel": "Corey Schafer",
            "title": "Python OOP Tutorial 5: Special Magic Dunder Methods",
            "length": "13 min",
            "url": "https://www.youtube.com/results?search_query=Corey%20Schafer%20Python%20OOP%20Tutorial%205%3A%20Special%20Magic%20Dunder%20Methods"
          },
          {
            "channel": "mCoding",
            "title": "Python dunder methods you should know",
            "length": "11 min",
            "url": "https://www.youtube.com/results?search_query=mCoding%20Python%20dunder%20methods%20you%20should%20know"
          }
        ]
      },
      {
        "no": 4,
        "week": 2,
        "session": 1,
        "title": "Basic 4: Recursion, Backtracking and Divide and Conquer",
        "video_url": null,
        "topic": "A recursive solution has three parts: a base case that stops, a recursive case that reduces the problem, and a guarantee that repeated reduction reaches the base. Backtracking adds a fourth: undo the choice when the branch fails - that undo step turns brute force into something that finishes, especially once a pruning test rejects hopeless branches early.\n\nKey rules:\n- Every recursion needs a base case and a strictly reducing step.\n- Merge sort runs in n log n time and needs order n extra space.\n- Backtracking is choose, recurse, undo - the undo step is not optional.\n- A pruning test that rejects a branch early is usually worth more than any constant factor optimisation.\n\nWorked example - backtracking with an explicit undo step:\ndef solve(board, row, n):\n    if row == n: return True\n    for col in range(n):\n        if safe(board, row, col):\n            board[row] = col            # choose\n            if solve(board, row + 1, n): return True\n            board[row] = -1             # undo\n    return False",
        "problems": [
          {
            "title": "Base case repair",
            "points": 30,
            "difficulty": "Basic",
            "description": "Four recursive functions never terminate for some inputs. Repair each.",
            "criteria": [
              "All four terminate correctly on every hidden test."
            ],
            "hint": "Every recursion needs a base case and a strictly reducing step.",
            "solution": "All four functions repaired to terminate correctly on every hidden test."
          },
          {
            "title": "Pruning study",
            "points": 40,
            "difficulty": "Core",
            "description": "Add a pruning test to a brute force solver and report the reduction in explored branches.",
            "criteria": [
              "Same answers, measurable reduction."
            ],
            "hint": "A pruning test that rejects a branch early is usually the biggest win.",
            "solution": "A pruning test added with identical final answers and a measured reduction in explored branches."
          },
          {
            "title": "Module project: Constraint solver",
            "points": 60,
            "difficulty": "Boss",
            "description": "Build a solver that handles both maze pathfinding and the N queens placement problem through a shared backtracking core, reporting explored branches and solution paths.",
            "criteria": [
              "Both maze pathfinding and N queens run through the same backtracking core, and the solver reports explored branches and solution paths."
            ],
            "hint": "Backtracking is choose, recurse, undo - the undo step is required.",
            "solution": "A shared backtracking core solving both maze pathfinding and N queens, reporting explored branches and the found path."
          }
        ],
        "tier": "Basic",
        "videos": [
          {
            "channel": "Computerphile",
            "title": "What on Earth is Recursion",
            "length": "9 min",
            "url": "https://www.youtube.com/results?search_query=Computerphile%20What%20on%20Earth%20is%20Recursion"
          },
          {
            "channel": "Fireship",
            "title": "Recursion in 100 Seconds",
            "length": "3 min",
            "url": "https://www.youtube.com/results?search_query=Fireship%20Recursion%20in%20100%20Seconds"
          },
          {
            "channel": "Computerphile",
            "title": "Merge Sort",
            "length": "10 min",
            "url": "https://www.youtube.com/results?search_query=Computerphile%20Merge%20Sort"
          }
        ]
      },
      {
        "no": 5,
        "week": 1,
        "session": 1,
        "title": "Advanced 1: Exceptions, Contracts and Failing Well",
        "video_url": null,
        "topic": "Exception handling is a design activity, not a safety net bolted on at the end. A bare handler that catches everything converts a crash into silent wrongness, which is strictly worse. The professional pattern: narrow handlers close to the operation that can fail, custom exception types that carry the context a caller needs to decide, and a clear boundary where errors stop being handled and start being reported.\n\nKey rules:\n- Catch the narrowest exception type that can occur - never catch everything without re-raising.\n- The else clause runs when no exception occurred; finally always runs, including on return.\n- Custom exception types carry context - a message alone forces the caller to parse text.\n- An assertion documents an assumption for developers; it is not input validation.\n\nWorked example - a narrow contract with a typed failure:\nclass ConfigError(Exception):\n    def __init__(self, key, reason):\n        super().__init__(f\"{key}: {reason}\")\n        self.key, self.reason = key, reason\n\ndef read_port(cfg):\n    try: port = int(cfg[\"port\"])\n    except KeyError: raise ConfigError(\"port\", \"missing\")\n    except ValueError: raise ConfigError(\"port\", \"not an integer\")\n    return port",
        "problems": [
          {
            "title": "Handler narrowing",
            "points": 30,
            "difficulty": "Basic",
            "description": "Replace five broad handlers with narrow ones and show what each now surfaces.",
            "criteria": [
              "No defect silently swallowed on any hidden test."
            ],
            "hint": "Never catch everything without re-raising.",
            "solution": "All five handlers narrowed, with no defect silently swallowed on any hidden test."
          },
          {
            "title": "Exception hierarchy",
            "points": 40,
            "difficulty": "Core",
            "description": "Design a three level exception hierarchy for a file processing tool.",
            "criteria": [
              "Callers can handle at any level and receive the right context."
            ],
            "hint": "Custom exception types should carry the context a caller needs.",
            "solution": "A correct three-level hierarchy letting callers handle at any level with the right context available."
          },
          {
            "title": "Module project: Crash proof configuration parser",
            "points": 60,
            "difficulty": "Boss",
            "description": "Build a parser that reads a configuration file, validates every field against a schema and reports all errors at once with line numbers rather than failing at the first.",
            "criteria": [
              "Every field is validated against the schema, and all errors are reported at once with line numbers rather than stopping at the first."
            ],
            "hint": "Design failure behaviour deliberately - collect every error rather than stopping at the first.",
            "solution": "A parser reporting every schema violation at once, with correct line numbers, instead of failing on the first error."
          }
        ],
        "tier": "Advanced",
        "videos": [
          {
            "channel": "Corey Schafer",
            "title": "Python Tutorial: Using Try Except Blocks",
            "length": "10 min",
            "url": "https://www.youtube.com/results?search_query=Corey%20Schafer%20Python%20Tutorial%3A%20Using%20Try%20Except%20Blocks"
          },
          {
            "channel": "mCoding",
            "title": "Python exceptions done right",
            "length": "11 min",
            "url": "https://www.youtube.com/results?search_query=mCoding%20Python%20exceptions%20done%20right"
          }
        ]
      },
      {
        "no": 6,
        "week": 1,
        "session": 2,
        "title": "Advanced 2: Generators, Context Managers and Streaming Data",
        "video_url": null,
        "topic": "A generator produces values one at a time and remembers where it stopped, which means a pipeline of generators processes a file of any size in constant memory. Context managers guarantee that a resource is released on every exit path including exceptions, which is why the with statement is not optional for file handling.\n\nKey rules:\n- A generator holds one item at a time - memory use stays flat regardless of input size.\n- Generators are consumed once - iterate again and you get nothing.\n- Always open files with a context manager - it closes on the exception path too.\n- Chain generators to build a pipeline; each stage stays a small, testable function.\n\nWorked example - a three stage streaming pipeline over a large log:\ndef lines(path):\n    with open(path, encoding=\"utf-8\") as f:\n        for line in f: yield line.rstrip(\"\\n\")\n\ndef errors(rows):\n    for r in rows:\n        if \" ERROR \" in r: yield r",
        "problems": [
          {
            "title": "Memory bounded rewrite",
            "points": 30,
            "difficulty": "Basic",
            "description": "Convert a program that loads a whole file into memory into a generator pipeline.",
            "criteria": [
              "Identical output with flat memory use on a large input."
            ],
            "hint": "A generator holds one item at a time, keeping memory flat.",
            "solution": "The program converted to a generator pipeline with identical output and flat memory use on a large input."
          },
          {
            "title": "Custom context manager",
            "points": 40,
            "difficulty": "Core",
            "description": "Write a context manager that times a block and guarantees a report even when the block raises.",
            "criteria": [
              "Report printed on both paths."
            ],
            "hint": "Context managers release resources on every exit path, including exceptions.",
            "solution": "A context manager producing its timing report on both the success and the exception path."
          },
          {
            "title": "Module project: Streaming log analyser",
            "points": 60,
            "difficulty": "Boss",
            "description": "Build an analyser that processes a multi gigabyte log in constant memory and reports error rates per hour, top failing endpoints and the longest quiet period.",
            "criteria": [
              "A multi-gigabyte log is processed in constant memory, and error rates per hour, top failing endpoints and the longest quiet period are all reported correctly."
            ],
            "hint": "Chain small generator stages to build the pipeline.",
            "solution": "A constant-memory log analyser producing correct hourly error rates, top endpoints and the longest quiet period."
          }
        ],
        "tier": "Advanced",
        "videos": [
          {
            "channel": "Corey Schafer",
            "title": "Python Tutorial: Generators",
            "length": "11 min",
            "url": "https://www.youtube.com/results?search_query=Corey%20Schafer%20Python%20Tutorial%3A%20Generators"
          },
          {
            "channel": "mCoding",
            "title": "Generators are underrated",
            "length": "9 min",
            "url": "https://www.youtube.com/results?search_query=mCoding%20Generators%20are%20underrated"
          }
        ]
      },
      {
        "no": 7,
        "week": 1,
        "session": 3,
        "title": "Advanced 3: Structured Persistence, Schema Migration and APIs",
        "video_url": null,
        "topic": "Any application that stores data will eventually change its shape, and the moment that happens the file written by the old version becomes a liability. Writing a version number into the file from day one, and a small migration function per version step, converts that liability into a routine upgrade. Calling a network API needs a timeout, a retry policy and a response check - all mandatory rather than optional.\n\nKey rules:\n- Write a schema version into every stored file - migration is a chain of small steps.\n- Every network call gets an explicit timeout.\n- Retry only on transient failures, with an increasing wait, and cap the number of attempts.\n- Validate the response shape before using it.\n\nWorked example - versioned storage with a migration chain:\nMIGRATIONS = {\n    1: lambda d: {**d, \"tags\": [], \"version\": 2},\n    2: lambda d: {**d, \"archived\": False, \"version\": 3},\n}\ndef load(path):\n    with open(path, encoding=\"utf-8\") as f: data = json.load(f)\n    while data.get(\"version\", 1) in MIGRATIONS: data = MIGRATIONS[data[\"version\"]](data)\n    return data",
        "problems": [
          {
            "title": "Migration chain",
            "points": 30,
            "difficulty": "Basic",
            "description": "Write migrations that carry a stored file from version one to version four without data loss.",
            "criteria": [
              "All supplied old files load correctly."
            ],
            "hint": "Migration is a chain of small steps, not one rewrite.",
            "solution": "All old versioned files correctly migrated to version four with no data loss."
          },
          {
            "title": "Resilient client",
            "points": 40,
            "difficulty": "Core",
            "description": "Write an API client with timeout, capped retries with increasing wait and response validation.",
            "criteria": [
              "Survives the simulated flaky endpoint and never hangs."
            ],
            "hint": "Every network call needs an explicit timeout.",
            "solution": "A resilient client surviving the simulated flaky endpoint with a capped retry policy and no hang."
          },
          {
            "title": "Module project: Offline first data store",
            "points": 60,
            "difficulty": "Boss",
            "description": "Build a store that works from a local cache when the network is unavailable, synchronises when it returns, resolves conflicts by a documented rule and migrates its own schema on upgrade.",
            "criteria": [
              "The store functions offline from a local cache, synchronises correctly when the network returns, resolves conflicts by a documented rule, and migrates its own schema."
            ],
            "hint": "Write a schema version into every stored file from day one.",
            "solution": "A working offline-first store with correct conflict resolution, sync, and its own schema migration chain."
          }
        ],
        "tier": "Advanced",
        "videos": [
          {
            "channel": "Corey Schafer",
            "title": "Python Tutorial: Working with JSON Data",
            "length": "12 min",
            "url": "https://www.youtube.com/results?search_query=Corey%20Schafer%20Python%20Tutorial%3A%20Working%20with%20JSON%20Data"
          }
        ]
      },
      {
        "no": 8,
        "week": 2,
        "session": 1,
        "title": "Advanced 4: Testing, Packaging and the Course Capstone",
        "video_url": null,
        "topic": "Tests are not about proving code correct, they are about making change safe. A test suite that runs in seconds and fails loudly when behaviour changes is what allows a project to be refactored at all. Test the boundary cases and the error paths rather than the happy path. Packaging closes the loop by making the work runnable by someone other than its author.\n\nKey rules:\n- Test the boundaries and the failure paths - the happy path is the least likely place for defects.\n- Each test must be independent.\n- Coverage measures which lines ran, not whether behaviour is correct.\n- A project someone else cannot install and run in one command is not finished.\n\nWorked example - boundary focused tests rather than happy path tests:\nimport pytest\nfrom tasks import Task\n\ndef test_rejects_unknown_status():\n    t = Task(\"write report\")\n    with pytest.raises(ValueError):\n        t.status = \"finished\"",
        "problems": [
          {
            "title": "Boundary suite",
            "points": 30,
            "difficulty": "Basic",
            "description": "Write a test suite for a supplied module covering every error path.",
            "criteria": [
              "Suite catches all four deliberately introduced defects."
            ],
            "hint": "Test boundaries and failure paths, not just the happy path.",
            "solution": "A test suite that correctly catches all four deliberately introduced defects."
          },
          {
            "title": "Make it installable",
            "points": 40,
            "difficulty": "Core",
            "description": "Package a project so it installs and runs from a clean environment in one command.",
            "criteria": [
              "Verified install on a fresh environment."
            ],
            "hint": "A project someone else cannot install in one command is not finished.",
            "solution": "The project verified to install and run correctly from a clean environment in one command."
          },
          {
            "title": "Course capstone: TaskFlow productivity and habit analytics suite",
            "points": 60,
            "difficulty": "Boss",
            "description": "Build a complete productivity application with custom exception contracts, generator based reporting over files larger than memory, schema migration between two stored versions and a test suite above eighty percent coverage.",
            "criteria": [
              "Custom exception contracts, generator-based reporting over oversized files, schema migration between two versions, and over 80% test coverage are all present and working."
            ],
            "hint": "Test the boundaries and failure paths first.",
            "solution": "A complete TaskFlow suite meeting every constraint, verified by a test suite above eighty percent coverage."
          }
        ],
        "tier": "Advanced",
        "videos": [
          {
            "channel": "Corey Schafer",
            "title": "Python Tutorial: Unit Testing Your Code",
            "length": "13 min",
            "url": "https://www.youtube.com/results?search_query=Corey%20Schafer%20Python%20Tutorial%3A%20Unit%20Testing%20Your%20Code"
          },
          {
            "channel": "mCoding",
            "title": "Automated testing in Python",
            "length": "12 min",
            "url": "https://www.youtube.com/results?search_query=mCoding%20Automated%20testing%20in%20Python"
          }
        ]
      }
    ]
  },
  {
    "key": "js-advanced",
    "course_code": "JS4-ADV",
    "free": true,
    "friendly_grading": true,
    "default_language": "web",
    "title": "Advanced JavaScript Programming",
    "description": "Course 2 (final) of the JavaScript Programming free ladder - combines the Basic tier (formerly \"JS4.2: The Browser Runtime\") and the Advanced tier (formerly \"JS4.3: Advanced JavaScript Applications\") into one course, eight modules total, each with its own two assignments and module project.",
    "outcome": "Predict the execution order of synchronous code, timers and promises; update the page efficiently and avoid layout thrashing; control event flow precisely; manage an interface with one listener and a single source of truth. Coordinate concurrent network work with retries, timeouts and cancellation; choose a storage mechanism deliberately and design cache expiry; defend against injection and structure an application into modules; assemble state, data access, rendering and accessibility into one production application.",
    "keywords": [
      "JavaScript event loop course",
      "DOM performance",
      "event delegation JavaScript",
      "reactive JavaScript no framework",
      "intermediate JavaScript",
      "JavaScript async course",
      "JavaScript web security",
      "JavaScript caching",
      "vanilla JS architecture",
      "advanced JavaScript applications"
    ],
    "key_concepts": [
      "Event loop, tasks & microtasks",
      "Layout thrashing",
      "Event propagation",
      "Event delegation & reactive rendering",
      "Promise combinators & backoff",
      "Browser storage & cache expiry",
      "XSS defence & modules",
      "Layered application architecture"
    ],
    "pass_mark": 60,
    "titleNames": [
      "Loop Reasoner",
      "Delegation Architect",
      "Async Engineer",
      "Application Architect"
    ],
    "levels": [
      {
        "no": 1,
        "week": 1,
        "session": 1,
        "title": "Basic 1: The Event Loop, Tasks and Microtasks",
        "video_url": null,
        "topic": "JavaScript runs on a single thread, and everything that appears concurrent is actually queued. The engine finishes the current synchronous work, then drains the entire microtask queue, then takes one task from the macrotask queue and repeats. This explains why a resolved promise callback always runs before a zero millisecond timer, and why a long synchronous loop freezes the interface completely.\n\nKey rules:\n- Order: current synchronous code, then all microtasks, then one macrotask, then repeat.\n- Promise callbacks are microtasks; timer callbacks and interface events are macrotasks.\n- A timer set to zero milliseconds is a request, not a promise - it runs after the current work and all microtasks.\n- Long synchronous work blocks rendering; break it into chunks that yield between them.\n\nWorked example - execution order made explicit:\nconsole.log(\"1 sync\");\nsetTimeout(() => console.log(\"4 macrotask\"), 0);\nPromise.resolve().then(() => console.log(\"3 microtask\"));\nconsole.log(\"2 sync\");\n// prints 1, 2, 3, 4",
        "problems": [
          {
            "title": "Order prediction",
            "points": 30,
            "difficulty": "Basic",
            "description": "Predict the output order of six mixed scripts before running.",
            "criteria": [
              "At least four correct with written reasoning."
            ],
            "hint": "Synchronous code first, then every microtask, then one macrotask.",
            "solution": "At least four of six execution orders correctly predicted, with sound reasoning about the queue order."
          },
          {
            "title": "Unblock the interface",
            "points": 40,
            "difficulty": "Core",
            "description": "A supplied page freezes during a long computation. Chunk the work so the interface stays responsive.",
            "criteria": [
              "Same result, measured frame drops eliminated."
            ],
            "hint": "Break long synchronous work into chunks that yield between them.",
            "solution": "The computation chunked to yield periodically, producing the same result with frame drops eliminated."
          },
          {
            "title": "Module project: Priority task scheduler",
            "points": 60,
            "difficulty": "Boss",
            "description": "Build a scheduler that accepts tasks with priorities, runs them without blocking the interface, supports cancellation and reports queue depth in real time.",
            "criteria": [
              "Tasks run without blocking the interface, cancellation works, and queue depth is reported in real time."
            ],
            "hint": "Chunk work and yield between chunks to stay off the blocking path.",
            "solution": "A non-blocking priority scheduler supporting cancellation and a live queue-depth readout."
          }
        ],
        "tier": "Basic",
        "videos": [
          {
            "channel": "Fireship",
            "title": "The Async Await Episode I Promised",
            "length": "12 min",
            "url": "https://www.youtube.com/results?search_query=Fireship%20The%20Async%20Await%20Episode%20I%20Promised"
          },
          {
            "channel": "Web Dev Simplified",
            "title": "JavaScript Event Loop explained",
            "length": "10 min",
            "url": "https://www.youtube.com/results?search_query=Web%20Dev%20Simplified%20JavaScript%20Event%20Loop%20explained"
          }
        ]
      },
      {
        "no": 2,
        "week": 1,
        "session": 2,
        "title": "Basic 2: Document Internals and Render Cost",
        "video_url": null,
        "topic": "Reading a layout property forces the browser to finish any pending layout work before it can answer, so alternating reads and writes inside a loop makes the browser recompute layout on every iteration - layout thrashing, the most common cause of a page that feels slow despite fast code. The fix is to batch: read everything, then write everything, and build detached subtrees in a fragment before attaching them once.\n\nKey rules:\n- Reading a geometry property forces layout - alternating reads and writes in a loop forces it repeatedly.\n- Batch all reads, then all writes. Never interleave them inside a loop.\n- Build many nodes in a document fragment and attach once.\n- Changes to transform and opacity can be composited without a full layout pass - prefer them for animation.\n\nWorked example - batched construction with a single insertion:\nfunction renderRows(container, rows) {\n  const frag = document.createDocumentFragment();\n  for (const row of rows) {\n    const el = document.createElement(\"tr\");\n    el.innerHTML = `<td>${row.name}</td><td>${row.total}</td>`;\n    frag.appendChild(el);\n  }\n  container.replaceChildren(frag); // one layout pass\n}",
        "problems": [
          {
            "title": "Thrashing repair",
            "points": 30,
            "difficulty": "Basic",
            "description": "A supplied loop reads and writes geometry alternately. Repair it and measure the difference.",
            "criteria": [
              "Correct output and a recorded improvement."
            ],
            "hint": "Batch all reads first, then all writes - never interleave.",
            "solution": "Reads and writes separated into two batches, with a measured, recorded performance improvement."
          },
          {
            "title": "Fragment rendering",
            "points": 40,
            "difficulty": "Core",
            "description": "Render two thousand rows in under one hundred milliseconds.",
            "criteria": [
              "Measured render time within budget on the test machine."
            ],
            "hint": "Build nodes in a document fragment and attach once.",
            "solution": "Two thousand rows rendered via a single fragment attachment, within the measured performance budget."
          },
          {
            "title": "Module project: High performance data grid",
            "points": 60,
            "difficulty": "Boss",
            "description": "Build a grid that renders and re sorts several thousand rows while keeping interaction responsive, with a visible performance readout.",
            "criteria": [
              "Several thousand rows render and re-sort while interaction stays responsive, with a visible performance readout."
            ],
            "hint": "Batch reads and writes, and attach new rows via a single fragment.",
            "solution": "A responsive data grid handling several thousand rows with a live performance readout."
          }
        ],
        "tier": "Basic",
        "videos": [
          {
            "channel": "Web Dev Simplified",
            "title": "Learn DOM Manipulation In 18 Minutes",
            "length": "15 min",
            "url": "https://www.youtube.com/results?search_query=Web%20Dev%20Simplified%20Learn%20DOM%20Manipulation%20In%2018%20Minutes"
          },
          {
            "channel": "Fireship",
            "title": "The DOM in 100 Seconds",
            "length": "3 min",
            "url": "https://www.youtube.com/results?search_query=Fireship%20The%20DOM%20in%20100%20Seconds"
          },
          {
            "channel": "Web Dev Simplified",
            "title": "Document Fragments explained",
            "length": "8 min",
            "url": "https://www.youtube.com/results?search_query=Web%20Dev%20Simplified%20Document%20Fragments%20explained"
          }
        ]
      },
      {
        "no": 3,
        "week": 1,
        "session": 3,
        "title": "Basic 3: Events, Propagation and Form Control",
        "video_url": null,
        "topic": "An event travels down from the document to the target, then back up. Handlers attached in the default mode fire on the way up, which is why a click on a child also triggers a parent handler. The distinction between the element that was clicked and the element the handler is attached to is what makes delegation possible. Forms add their own default behaviours that must be prevented deliberately.\n\nKey rules:\n- Phases: capture downward, target, then bubble upward. Handlers bubble by default.\n- The target property is what was interacted with; the current target is what the handler is attached to.\n- Preventing the default action stops the browser behaviour; stopping propagation stops other handlers - they are different.\n- Validate on submit, not on every keystroke.\n\nWorked example - target against current target in one handler:\nform.addEventListener(\"submit\", (e) => {\n  e.preventDefault();\n  const data = Object.fromEntries(new FormData(form));\n  if (!data.email) return show(\"Email is required\");\n  submit(data);\n});",
        "problems": [
          {
            "title": "Propagation puzzles",
            "points": 30,
            "difficulty": "Basic",
            "description": "Predict which handlers fire and in what order for five nested structures.",
            "criteria": [
              "At least four correct with reasons."
            ],
            "hint": "Handlers bubble by default: target first, then upward.",
            "solution": "At least four of five propagation orders correctly predicted with sound reasoning."
          },
          {
            "title": "Dynamic form",
            "points": 40,
            "difficulty": "Core",
            "description": "Build a form where rows can be added and removed and validation still applies to every row.",
            "criteria": [
              "All hidden interaction tests pass."
            ],
            "hint": "Validate on submit, not on every keystroke.",
            "solution": "A dynamic multi-row form where validation correctly covers every added or removed row."
          },
          {
            "title": "Module project: Dynamic form controller",
            "points": 60,
            "difficulty": "Boss",
            "description": "Build a controller for a form with repeatable sections, per field validation on submit, accessible error messaging and a clean serialised payload.",
            "criteria": [
              "Repeatable sections validate per field on submit, errors are accessibly announced, and the payload serialises cleanly."
            ],
            "hint": "Preventing default stops the browser behaviour; stopping propagation stops other handlers - use the right one.",
            "solution": "A repeatable-section form controller with accessible validation and a clean serialised submission payload."
          }
        ],
        "tier": "Basic",
        "videos": [
          {
            "channel": "Web Dev Simplified",
            "title": "Learn JavaScript Event Bubbling And Capturing",
            "length": "10 min",
            "url": "https://www.youtube.com/results?search_query=Web%20Dev%20Simplified%20Learn%20JavaScript%20Event%20Bubbling%20And%20Capturing"
          }
        ]
      },
      {
        "no": 4,
        "week": 2,
        "session": 1,
        "title": "Basic 4: Event Delegation and Reactive Rendering",
        "video_url": null,
        "topic": "Attaching a listener to every element does not scale: elements added later have no listener, removed elements leak theirs. Delegation attaches one listener to a stable container and identifies the action from the event target and a data attribute. Paired with a single state object as the only source of truth, and a render function that draws the interface from that state, this produces a small reactive architecture with no framework at all.\n\nKey rules:\n- One listener on a stable ancestor - identify the action from a data attribute on the target.\n- Elements added after page load work automatically under delegation.\n- Keep one state object as the single source of truth - the interface is a function of that state.\n- Never read application state back out of the document.\n\nWorked example - one listener, one state object, one render:\nconst state = { items: [] };\nlist.addEventListener(\"click\", (e) => {\n  const btn = e.target.closest(\"[data-action]\");\n  if (!btn) return;\n  const id = Number(btn.dataset.id);\n  if (btn.dataset.action === \"delete\") state.items = state.items.filter(i => i.id !== id);\n  render(state);\n});",
        "problems": [
          {
            "title": "Listener reduction",
            "points": 30,
            "difficulty": "Basic",
            "description": "Convert a page with forty listeners to a single delegated one.",
            "criteria": [
              "Identical behaviour, one listener, works for dynamically added elements."
            ],
            "hint": "Identify the action from a data attribute on the event target.",
            "solution": "Forty listeners consolidated into one delegated listener, working correctly for dynamically added elements."
          },
          {
            "title": "State as truth",
            "points": 40,
            "difficulty": "Core",
            "description": "Refactor a component that reads values back from the document so that state is the only source.",
            "criteria": [
              "All hidden state tests pass."
            ],
            "hint": "Never read application state back out of the document - it is output, not storage.",
            "solution": "The component refactored so the document is pure output and state is the only real source of truth."
          },
          {
            "title": "Module project: Reactive task board",
            "points": 60,
            "difficulty": "Boss",
            "description": "Build a create, read, update and delete board driven by one state object and one delegated listener, with filtering, counts and no framework.",
            "criteria": [
              "Create/read/update/delete, filtering and counts all run off one state object and one delegated listener, with no framework used."
            ],
            "hint": "Keep one state object as the single source of truth; render is a function of it.",
            "solution": "A full CRUD task board driven entirely by one state object and one delegated listener, with correct filtering and counts."
          }
        ],
        "tier": "Basic",
        "videos": [
          {
            "channel": "Web Dev Simplified",
            "title": "Learn Event Delegation In 8 Minutes",
            "length": "8 min",
            "url": "https://www.youtube.com/results?search_query=Web%20Dev%20Simplified%20Learn%20Event%20Delegation%20In%208%20Minutes"
          },
          {
            "channel": "Fireship",
            "title": "Build a to do app with vanilla JavaScript",
            "length": "12 min",
            "url": "https://www.youtube.com/results?search_query=Fireship%20Build%20a%20to%20do%20app%20with%20vanilla%20JavaScript"
          }
        ]
      },
      {
        "no": 5,
        "week": 1,
        "session": 1,
        "title": "Advanced 1: Promises, Concurrency and Failure Policy",
        "video_url": null,
        "topic": "Awaiting requests one after another when they do not depend on each other turns a fast page into a slow one. All rejects as soon as one fails, which is right when every result is required; all-settled reports every outcome, right when a dashboard should render whatever succeeded. Every request also needs a timeout and a retry policy.\n\nKey rules:\n- Awaiting sequentially adds the durations; running together takes the longest single duration.\n- All rejects on first failure; all-settled always resolves with the outcome of each.\n- Exponential backoff waits base multiplied by two to the power of the attempt number, with a cap and jitter.\n- Attach an abort signal to every request so slow work can be cancelled.\n\nWorked example - concurrent fetch with timeout and capped backoff:\nasync function fetchWithRetry(url, attempts = 3) {\n  for (let i = 0; i < attempts; i++) {\n    const ac = new AbortController();\n    const timer = setTimeout(() => ac.abort(), 5000);\n    try { const res = await fetch(url, { signal: ac.signal }); if (res.ok) return res.json(); }\n    catch {} finally { clearTimeout(timer); }\n    await new Promise(r => setTimeout(r, Math.min(2 ** i * 250, 4000)));\n  }\n  throw new Error(`failed after ${attempts} attempts`);\n}",
        "problems": [
          {
            "title": "Sequential to concurrent",
            "points": 30,
            "difficulty": "Basic",
            "description": "Convert five sequential awaits into concurrent execution and measure the improvement.",
            "criteria": [
              "Same results and a recorded reduction in total time."
            ],
            "hint": "Running requests together takes the longest single duration, not the sum.",
            "solution": "The five awaits converted to run concurrently with the same results and a measured time reduction."
          },
          {
            "title": "Failure policy",
            "points": 40,
            "difficulty": "Core",
            "description": "For four described dashboards choose between all and all settled and justify.",
            "criteria": [
              "At least three correct with reasons."
            ],
            "hint": "Use all-settled when partial success should still render.",
            "solution": "At least three of four failure-policy choices correct with sound justification."
          },
          {
            "title": "Module project: Resilient API client",
            "points": 60,
            "difficulty": "Boss",
            "description": "Build a client with concurrency limits, per request timeout, capped exponential backoff, cancellation and a request log showing every retry and its reason.",
            "criteria": [
              "Concurrency limits, per-request timeout, capped backoff, cancellation and a full retry log are all present and correct."
            ],
            "hint": "Attach an abort signal to every request.",
            "solution": "A fully resilient API client meeting every constraint, with an accurate retry log."
          }
        ],
        "tier": "Advanced",
        "videos": [
          {
            "channel": "Fireship",
            "title": "The Async Await Episode I Promised",
            "length": "12 min",
            "url": "https://www.youtube.com/results?search_query=Fireship%20The%20Async%20Await%20Episode%20I%20Promised"
          },
          {
            "channel": "Web Dev Simplified",
            "title": "Learn Fetch API In 6 Minutes",
            "length": "6 min",
            "url": "https://www.youtube.com/results?search_query=Web%20Dev%20Simplified%20Learn%20Fetch%20API%20In%206%20Minutes"
          }
        ]
      },
      {
        "no": 6,
        "week": 1,
        "session": 2,
        "title": "Advanced 2: Browser Storage and Cache Strategy",
        "video_url": null,
        "topic": "The browser offers several storage mechanisms and they are not interchangeable. Simple key value storage is synchronous, string only and small; session storage clears with the tab; the indexed database is asynchronous, structured and large. The harder problem is not storage but invalidation: cached data without an expiry rule becomes wrong data that the user trusts.\n\nKey rules:\n- Simple key value storage is synchronous and blocks the thread - keep it small and infrequent.\n- Session storage clears when the tab closes; local storage persists until cleared.\n- Store a timestamp with every cache entry and discard anything older than its allowed age.\n- Storage can fail when the quota is exceeded - wrap writes and degrade gracefully.\n\nWorked example - a cache entry that knows its own expiry:\nconst cache = {\n  set(key, value, ttlMs) {\n    try { localStorage.setItem(key, JSON.stringify({ value, expires: Date.now() + ttlMs })); } catch {}\n  },\n  get(key) {\n    const raw = localStorage.getItem(key);\n    if (!raw) return null;\n    const { value, expires } = JSON.parse(raw);\n    if (Date.now() > expires) { localStorage.removeItem(key); return null; }\n    return value;\n  }\n};",
        "problems": [
          {
            "title": "Mechanism choice",
            "points": 30,
            "difficulty": "Basic",
            "description": "For eight scenarios choose the storage mechanism and justify.",
            "criteria": [
              "At least six correct with reasons."
            ],
            "hint": "Match the mechanism to size, structure and lifetime needs.",
            "solution": "At least six of eight storage choices correct with sound justification."
          },
          {
            "title": "Quota handling",
            "points": 40,
            "difficulty": "Core",
            "description": "Make a supplied application survive a full storage quota without breaking.",
            "criteria": [
              "Application still functional with caching disabled."
            ],
            "hint": "Wrap storage writes and degrade gracefully when the quota is exceeded.",
            "solution": "The application surviving a full quota gracefully, remaining functional with caching disabled."
          },
          {
            "title": "Module project: Tiered cache manager",
            "points": 60,
            "difficulty": "Boss",
            "description": "Build a cache manager with memory and persistent tiers, per key expiry, a size cap with least recently used eviction and a hit rate report.",
            "criteria": [
              "Memory and persistent tiers, per-key expiry, LRU eviction under a size cap, and an accurate hit rate report are all present."
            ],
            "hint": "Store a timestamp with every entry and discard anything past its allowed age.",
            "solution": "A tiered cache manager with correct LRU eviction and an accurate hit-rate report."
          }
        ],
        "tier": "Advanced",
        "videos": [
          {
            "channel": "Web Dev Simplified",
            "title": "Learn localStorage In 5 Minutes",
            "length": "5 min",
            "url": "https://www.youtube.com/results?search_query=Web%20Dev%20Simplified%20Learn%20localStorage%20In%205%20Minutes"
          },
          {
            "channel": "Fireship",
            "title": "IndexedDB in 100 Seconds",
            "length": "3 min",
            "url": "https://www.youtube.com/results?search_query=Fireship%20IndexedDB%20in%20100%20Seconds"
          }
        ]
      },
      {
        "no": 7,
        "week": 1,
        "session": 3,
        "title": "Advanced 3: Web Security and Module Architecture",
        "video_url": null,
        "topic": "Cross site scripting happens when data supplied by a user is treated as markup. The defence is a boundary: user data is inserted as text, never as markup, and if markup genuinely must be rendered it passes through a sanitiser with an allow list. The cross origin policy is the browser refusing to let one origin read another's responses without permission.\n\nKey rules:\n- Insert user data as text content, never as markup.\n- Sanitise with an allow list of permitted elements and attributes - deny lists are always incomplete.\n- Cross origin restrictions are enforced by the browser; the response headers grant the permission.\n- One module, one responsibility, one export surface - circular imports are a design smell.\n\nWorked example - text insertion against markup insertion:\n// unsafe: user content becomes markup\nel.innerHTML = `<p>${comment}</p>`;\n// safe: user content stays text\nconst p = document.createElement(\"p\");\np.textContent = comment;\nel.replaceChildren(p);",
        "problems": [
          {
            "title": "Injection audit",
            "points": 30,
            "difficulty": "Basic",
            "description": "Find and fix five injection points in a supplied application.",
            "criteria": [
              "All five closed, supplied attack payloads render as harmless text."
            ],
            "hint": "Insert user data as text content, never as markup.",
            "solution": "All five injection points closed, with the supplied attack payloads rendering as inert text."
          },
          {
            "title": "Module split",
            "points": 40,
            "difficulty": "Core",
            "description": "Split a single file application into modules with no circular imports.",
            "criteria": [
              "Builds and runs, dependency graph acyclic."
            ],
            "hint": "One module, one responsibility, one export surface.",
            "solution": "The application split into modules with a verified acyclic dependency graph, building and running correctly."
          },
          {
            "title": "Module project: Comment system with a sanitiser",
            "points": 60,
            "difficulty": "Boss",
            "description": "Build a comment feature that accepts limited formatting through an allow list sanitiser, rejects everything else and passes a supplied set of attack payloads.",
            "criteria": [
              "The allow-list sanitiser accepts limited formatting and rejects everything else, passing every supplied attack payload."
            ],
            "hint": "Sanitise with an allow list, never a deny list.",
            "solution": "A comment system whose sanitiser correctly passes every supplied attack payload while allowing legitimate formatting."
          }
        ],
        "tier": "Advanced",
        "videos": [
          {
            "channel": "Fireship",
            "title": "Web Security in 100 Seconds",
            "length": "3 min",
            "url": "https://www.youtube.com/results?search_query=Fireship%20Web%20Security%20in%20100%20Seconds"
          },
          {
            "channel": "Web Dev Simplified",
            "title": "Learn ES6 Modules In 10 Minutes",
            "length": "10 min",
            "url": "https://www.youtube.com/results?search_query=Web%20Dev%20Simplified%20Learn%20ES6%20Modules%20In%2010%20Minutes"
          },
          {
            "channel": "Fireship",
            "title": "CORS in 100 Seconds",
            "length": "3 min",
            "url": "https://www.youtube.com/results?search_query=Fireship%20CORS%20in%20100%20Seconds"
          }
        ]
      },
      {
        "no": 8,
        "week": 2,
        "session": 1,
        "title": "Advanced 4: Application Architecture and the Course Capstone",
        "video_url": null,
        "topic": "A framework free application still needs an architecture: a state module that owns data, a data access module that owns network and storage, a render module that turns state into markup, and a controller that binds events to state changes. Every one of those can be tested alone. Accessibility belongs here too - keyboard access and focus management are architectural decisions, not a stylesheet pass.\n\nKey rules:\n- Four layers: state, data access, render, controller - each depends only on the one below it.\n- Render is a pure function of state.\n- Every interactive element must be reachable and operable by keyboard alone.\n- Set a performance budget before building and measure against it.\n\nWorked example - a render function that is pure with respect to state:\nfunction render(state) {\n  root.replaceChildren(header(state), listView(state), footer(state));\n}\nfunction dispatch(action) {\n  state = reduce(state, action);\n  render(state);\n}",
        "problems": [
          {
            "title": "Layer separation",
            "points": 30,
            "difficulty": "Basic",
            "description": "Refactor a supplied tangled application into the four layers.",
            "criteria": [
              "No layer reaches past its neighbour, all tests pass."
            ],
            "hint": "Each layer should depend only on the one directly below it.",
            "solution": "The application correctly split into four layers, each depending only on its neighbour, all tests passing."
          },
          {
            "title": "Keyboard pass",
            "points": 40,
            "difficulty": "Core",
            "description": "Make a supplied interface fully keyboard operable with visible focus.",
            "criteria": [
              "Every action reachable without a pointer."
            ],
            "hint": "Keyboard access is an architectural decision, not a stylesheet pass.",
            "solution": "Every interface action made reachable and operable by keyboard alone, with visible focus throughout."
          },
          {
            "title": "Course capstone: PulseBoard real time interactive dashboard",
            "points": 60,
            "difficulty": "Boss",
            "description": "Build a single page dashboard with reactive state and no framework, concurrent data fetching with backoff, tiered caching with expiry, injection defences and interaction held under one hundred milliseconds with one thousand records.",
            "criteria": [
              "Reactive state, concurrent fetching with backoff, tiered caching, injection defences and sub-100ms interaction with a thousand records are all present and verified."
            ],
            "hint": "Render should stay a pure function of one state object.",
            "solution": "A complete PulseBoard dashboard meeting every constraint, with interaction verified under 100ms at 1000 records."
          }
        ],
        "tier": "Advanced",
        "videos": [
          {
            "channel": "Fireship",
            "title": "10 modern JavaScript one liners",
            "length": "9 min",
            "url": "https://www.youtube.com/results?search_query=Fireship%2010%20modern%20JavaScript%20one%20liners"
          },
          {
            "channel": "Web Dev Simplified",
            "title": "Learn Web Accessibility In 10 Minutes",
            "length": "10 min",
            "url": "https://www.youtube.com/results?search_query=Web%20Dev%20Simplified%20Learn%20Web%20Accessibility%20In%2010%20Minutes"
          }
        ]
      }
    ]
  },
  {
    "key": "web-advanced",
    "course_code": "WEB5-ADV",
    "free": true,
    "friendly_grading": true,
    "default_language": "web",
    "title": "Advanced CSS and Web Development",
    "description": "Course 2 (final) of the CSS and Web Development free ladder - combines the Basic tier (formerly \"WEB5.2: CSS Architecture and Responsive Layout\") and the Advanced tier (formerly \"WEB5.3: Advanced CSS - Grid, Subgrid and Motion\") into one course, eight modules total, each with its own two assignments and module project.",
    "outcome": "Predict which CSS rule wins and build a themeable token system; diagnose layout defects from the box model; lay out one dimensional components with correct axis reasoning; control how items grow, shrink and wrap under real content. Build layouts that reflow by themselves without breakpoint proliferation; align nested components to a shared grid and express layout by name; scale a design continuously and animate without harming users; ship an accessible interface inside a measured performance budget.",
    "keywords": [
      "CSS cascade course",
      "CSS box model",
      "flexbox course",
      "responsive CSS layout",
      "intermediate CSS",
      "CSS grid course",
      "CSS subgrid",
      "container queries",
      "fluid typography CSS",
      "advanced CSS design systems"
    ],
    "key_concepts": [
      "Cascade & specificity",
      "Custom properties / design tokens",
      "Box model & formatting contexts",
      "Flexbox alignment",
      "Flexible sizing & wrapping",
      "Two dimensional grid",
      "Named areas & subgrid",
      "Fluid type & container queries",
      "Reduced motion",
      "Performance budget & design systems"
    ],
    "pass_mark": 60,
    "titleNames": [
      "Cascade Reader",
      "Layout Architect",
      "Grid Architect",
      "Design Systems Lead"
    ],
    "levels": [
      {
        "no": 1,
        "week": 1,
        "session": 1,
        "title": "Basic 1: The Cascade, Specificity and Design Tokens",
        "video_url": null,
        "topic": "Specificity is a comparison, not a score - once that is clear the endless override war ends. The fix for a rule not applying is almost never to add an override of last resort, it is to lower the specificity of the competing rule. Custom properties cascade and inherit, which means a theme is a set of values redefined at one place in the tree rather than a duplicate stylesheet.\n\nKey rules:\n- Specificity compares identifier count, then class count, then element count. A later rule wins only on a tie.\n- The override of last resort is a maintenance debt - reach for it only in a utility layer.\n- Custom properties inherit; redefine them on a wrapper element to retheme everything inside it.\n- Cascade layers let you order whole groups of rules, so a reset can never accidentally outrank a component.\n\nWorked example - a token system retheming through one redefinition:\n:root { --brand: #0E3457; --accent: #03C39A; --surface: #FAF8F3; --text: #12212F; }\n[data-theme=\"dark\"] { --surface: #0B1620; --text: #E8EFF3; }\n.card { background: var(--surface); color: var(--text); border-top: 3px solid var(--accent); }",
        "problems": [
          {
            "title": "Specificity puzzles",
            "points": 30,
            "difficulty": "Basic",
            "description": "For eight rule pairs state which wins and why.",
            "criteria": [
              "At least six correct with reasons."
            ],
            "hint": "A later rule only wins on a specificity tie.",
            "solution": "At least six of eight specificity winners correctly identified with sound reasoning."
          },
          {
            "title": "Remove the overrides",
            "points": 40,
            "difficulty": "Core",
            "description": "Eliminate every override of last resort from a supplied stylesheet without changing the rendered result.",
            "criteria": [
              "None remaining, visual output identical."
            ],
            "hint": "Lower the specificity of the competing rule instead of overriding.",
            "solution": "Every override of last resort removed while the rendered page stays pixel-identical."
          },
          {
            "title": "Module project: Themeable design token system",
            "points": 60,
            "difficulty": "Boss",
            "description": "Build a token system with light and dark themes, spacing and type scales, applied to a component set and switchable with a single attribute change.",
            "criteria": [
              "Light and dark themes, spacing and type scale all switch correctly from a single attribute change."
            ],
            "hint": "Custom properties inherit - retheme by redefining them on a wrapper.",
            "solution": "A full token system with both themes switching correctly from one attribute, applied across a real component set."
          }
        ],
        "tier": "Basic",
        "videos": [
          {
            "channel": "Kevin Powell",
            "title": "CSS specificity explained",
            "length": "12 min",
            "url": "https://www.youtube.com/results?search_query=Kevin%20Powell%20CSS%20specificity%20explained"
          },
          {
            "channel": "Fireship",
            "title": "CSS Cascade Layers in 100 Seconds",
            "length": "3 min",
            "url": "https://www.youtube.com/results?search_query=Fireship%20CSS%20Cascade%20Layers%20in%20100%20Seconds"
          }
        ]
      },
      {
        "no": 2,
        "week": 1,
        "session": 2,
        "title": "Basic 2: The Box Model, Formatting Contexts and Overflow",
        "video_url": null,
        "topic": "Most mysterious spacing comes from two behaviours: the default box sizing that adds padding and border on top of the declared width, and margin collapsing between adjacent vertical margins. A new formatting context is created by overflow, flex, grid or a few other properties - it contains floats and stops margin collapse. Debugging layout is a matter of asking which box and which context, in that order.\n\nKey rules:\n- With border-box sizing, the declared width includes padding and border - set it globally.\n- Adjacent vertical margins collapse to the larger of the two; horizontal margins never collapse.\n- A new formatting context contains floats and stops margin collapse.\n- Overflow hidden clips silently; overflow auto scrolls only when needed.\n\nWorked example - predictable sizing and a contained context:\n*, *::before, *::after { box-sizing: border-box; }\n.card { inline-size: 320px; padding: 1.5rem; border: 1px solid var(--line); display: flow-root; }",
        "problems": [
          {
            "title": "Spacing diagnosis",
            "points": 30,
            "difficulty": "Basic",
            "description": "Explain the cause of six spacing anomalies and fix each.",
            "criteria": [
              "At least five correct diagnoses with fixes."
            ],
            "hint": "Ask which box, then which formatting context.",
            "solution": "At least five of six spacing anomalies correctly diagnosed and fixed."
          },
          {
            "title": "Overflow repair",
            "points": 40,
            "difficulty": "Core",
            "description": "Fix three components where content escapes or is clipped.",
            "criteria": [
              "Content visible and scrollable as specified at every width."
            ],
            "hint": "Overflow hidden clips silently; overflow auto scrolls only when needed.",
            "solution": "All three components fixed so content is correctly visible or scrollable at every width."
          },
          {
            "title": "Module project: Pixel accurate card component set",
            "points": 60,
            "difficulty": "Boss",
            "description": "Build a card set matching a supplied design at three widths, with consistent spacing, contained overflow and no magic numbers in the stylesheet.",
            "criteria": [
              "The design matches at all three widths with consistent spacing, contained overflow and no unexplained magic numbers."
            ],
            "hint": "Set border-box sizing globally and use a new formatting context to contain overflow.",
            "solution": "A pixel-accurate card set matching the design at three widths, with no magic numbers in the stylesheet."
          }
        ],
        "tier": "Basic",
        "videos": [
          {
            "channel": "Kevin Powell",
            "title": "The CSS box model explained",
            "length": "11 min",
            "url": "https://www.youtube.com/results?search_query=Kevin%20Powell%20The%20CSS%20box%20model%20explained"
          }
        ]
      },
      {
        "no": 3,
        "week": 1,
        "session": 3,
        "title": "Basic 3: Flexbox Alignment Mechanics",
        "video_url": null,
        "topic": "Nearly every flexbox difficulty is an axis mistake. Justification works along the main axis, alignment works along the cross axis, and changing the direction swaps which is which. Modern gap spacing removed the last reason to space items with margins, which also removed the last row spacing defect.\n\nKey rules:\n- Justify along the main axis; align along the cross axis.\n- An automatic margin absorbs free space and is the cleanest way to push one group apart from another.\n- Use gap for spacing between items - margins on children produce edge defects when wrapping.\n- Align-self overrides the container alignment for one item without a wrapper.\n\nWorked example - a navigation bar with a pushed group and no margin hacks:\n.nav { display: flex; align-items: center; gap: 1.5rem; }\n.nav__brand { margin-inline-end: auto; }",
        "problems": [
          {
            "title": "Axis drills",
            "points": 30,
            "difficulty": "Basic",
            "description": "Reproduce eight supplied layouts using flexbox only, with no positioning.",
            "criteria": [
              "All eight match at every test width."
            ],
            "hint": "Justify along the main axis, align along the cross axis.",
            "solution": "All eight layouts reproduced correctly using flexbox alone, matching at every test width."
          },
          {
            "title": "Margin to gap",
            "points": 40,
            "difficulty": "Core",
            "description": "Convert a margin spaced layout to gap and fix the wrapping defects it reveals.",
            "criteria": [
              "Clean spacing at all widths."
            ],
            "hint": "Use gap instead of margins between items to avoid edge defects when wrapping.",
            "solution": "The layout converted to gap spacing with every wrapping defect resolved."
          },
          {
            "title": "Module project: Responsive site header",
            "points": 60,
            "difficulty": "Boss",
            "description": "Build a header with brand, navigation, search and a call to action that reflows cleanly from wide desktop to narrow mobile without a media query where possible.",
            "criteria": [
              "Brand, navigation, search and CTA all reflow cleanly from desktop to mobile with minimal reliance on media queries."
            ],
            "hint": "An automatic margin is the cleanest way to push one group apart from another.",
            "solution": "A fully responsive header reflowing across widths using flexbox mechanics rather than heavy media-query overrides."
          }
        ],
        "tier": "Basic",
        "videos": [
          {
            "channel": "Kevin Powell",
            "title": "Learn Flexbox in 15 minutes",
            "length": "15 min",
            "url": "https://www.youtube.com/results?search_query=Kevin%20Powell%20Learn%20Flexbox%20in%2015%20minutes"
          },
          {
            "channel": "Fireship",
            "title": "Flexbox in 100 Seconds",
            "length": "3 min",
            "url": "https://www.youtube.com/results?search_query=Fireship%20Flexbox%20in%20100%20Seconds"
          },
          {
            "channel": "Web Dev Simplified",
            "title": "Learn Flexbox In 15 Minutes",
            "length": "15 min",
            "url": "https://www.youtube.com/results?search_query=Web%20Dev%20Simplified%20Learn%20Flexbox%20In%2015%20Minutes"
          }
        ]
      },
      {
        "no": 4,
        "week": 2,
        "session": 1,
        "title": "Basic 4: Flexible Sizing, Wrapping and Intrinsic Layout",
        "video_url": null,
        "topic": "The growth, shrink and basis triple decides what happens when the container is bigger or smaller than the content. The other half of this module is intrinsic sizing: keywords that let an element size itself from its own content rather than a guessed pixel value. Layouts built from intrinsic sizes survive content changes; layouts built from fixed pixel values break the first time a longer word arrives.\n\nKey rules:\n- The shorthand order is grow, shrink, basis. Basis wins over a declared width when both are present.\n- An item cannot shrink below its minimum content size unless that minimum is explicitly lowered.\n- Wrapping plus a basis with a minimum produces a responsive grid with no media query.\n- Intrinsic keywords let content decide the size.\n\nWorked example - auto wrapping cards with no media query at all:\n.cloud { display: flex; flex-wrap: wrap; gap: 1rem; }\n.cloud > * { flex: 1 1 min(18rem, 100%); min-inline-size: 0; }",
        "problems": [
          {
            "title": "Sizing predictions",
            "points": 30,
            "difficulty": "Basic",
            "description": "Predict the rendered width of items under six different declarations.",
            "criteria": [
              "At least four correct with reasons."
            ],
            "hint": "The shorthand order is grow, shrink, basis.",
            "solution": "At least four of six rendered widths correctly predicted with sound reasoning."
          },
          {
            "title": "Overflow under long content",
            "points": 40,
            "difficulty": "Core",
            "description": "Fix three layouts that break when given a very long unbroken word.",
            "criteria": [
              "No horizontal scroll at any width."
            ],
            "hint": "An item cannot shrink below its minimum content size unless explicitly lowered.",
            "solution": "All three layouts fixed with no horizontal scroll at any width, even with an extreme unbroken word."
          },
          {
            "title": "Module project: Content aware tag cloud",
            "points": 60,
            "difficulty": "Boss",
            "description": "Build a tag cloud that wraps naturally, keeps even spacing, handles very long labels without overflow and needs no media query.",
            "criteria": [
              "Wrapping is natural, spacing stays even, long labels never overflow, and no media query is needed."
            ],
            "hint": "Wrapping plus a basis with a minimum produces a responsive layout with no media query.",
            "solution": "A tag cloud that wraps and spaces itself correctly at every size with zero media queries and no overflow."
          }
        ],
        "tier": "Basic",
        "videos": [
          {
            "channel": "Kevin Powell",
            "title": "flex grow, flex shrink and flex basis explained",
            "length": "13 min",
            "url": "https://www.youtube.com/results?search_query=Kevin%20Powell%20flex%20grow%2C%20flex%20shrink%20and%20flex%20basis%20explained"
          }
        ]
      },
      {
        "no": 5,
        "week": 1,
        "session": 1,
        "title": "Advanced 1: Two Dimensional Grid Layout",
        "video_url": null,
        "topic": "Grid is the first layout system that is genuinely two dimensional - rows and columns are declared together rather than emerging from the content flow. The single most valuable pattern is the automatically fitting track with a minimum and maximum size, because it produces a responsive grid that adds and removes columns by itself as the container changes, replacing a stack of breakpoints with one line.\n\nKey rules:\n- The fractional unit distributes leftover space after fixed tracks are placed.\n- Automatically fitting tracks collapse empty ones; automatically filling tracks keep them.\n- A minimum and maximum track function gives a floor and a ceiling, making reflow automatic.\n- Implicit rows are created as needed - set their size explicitly when consistency matters.\n\nWorked example - a responsive grid with no media queries:\n.editorial {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(min(20rem, 100%), 1fr));\n  gap: clamp(1rem, 2vw, 2rem);\n}",
        "problems": [
          {
            "title": "Breakpoint elimination",
            "points": 30,
            "difficulty": "Basic",
            "description": "Replace a five breakpoint layout with an automatically reflowing grid.",
            "criteria": [
              "Identical behaviour at every width, no media query for column count."
            ],
            "hint": "An auto-fit track with a min/max produces automatic reflow.",
            "solution": "The five-breakpoint layout replaced by one auto-reflowing grid rule, identical at every width."
          },
          {
            "title": "Track drills",
            "points": 40,
            "difficulty": "Core",
            "description": "Reproduce six supplied layouts using grid tracks only.",
            "criteria": [
              "All six match at three widths."
            ],
            "hint": "The fractional unit distributes leftover space after fixed tracks.",
            "solution": "All six layouts correctly reproduced with grid tracks alone, matching at three widths."
          },
          {
            "title": "Module project: Reflowing editorial grid",
            "points": 60,
            "difficulty": "Boss",
            "description": "Build a magazine style layout with feature and standard articles that reflows from one to four columns automatically and keeps a consistent vertical rhythm.",
            "criteria": [
              "The layout reflows automatically from one to four columns and keeps a consistent vertical rhythm throughout."
            ],
            "hint": "Use auto-fit with a minmax track function for automatic reflow.",
            "solution": "An editorial grid reflowing automatically across one to four columns with a consistent vertical rhythm."
          }
        ],
        "tier": "Advanced",
        "videos": [
          {
            "channel": "Kevin Powell",
            "title": "Learn CSS Grid in 20 minutes",
            "length": "15 min",
            "url": "https://www.youtube.com/results?search_query=Kevin%20Powell%20Learn%20CSS%20Grid%20in%2020%20minutes"
          },
          {
            "channel": "Fireship",
            "title": "CSS Grid in 100 Seconds",
            "length": "3 min",
            "url": "https://www.youtube.com/results?search_query=Fireship%20CSS%20Grid%20in%20100%20Seconds"
          },
          {
            "channel": "Kevin Powell",
            "title": "auto fit vs auto fill in CSS Grid",
            "length": "10 min",
            "url": "https://www.youtube.com/results?search_query=Kevin%20Powell%20auto%20fit%20vs%20auto%20fill%20in%20CSS%20Grid"
          }
        ]
      },
      {
        "no": 6,
        "week": 1,
        "session": 2,
        "title": "Advanced 2: Named Areas, Subgrid and Alignment Across Components",
        "video_url": null,
        "topic": "Named template areas turn a layout into something readable in the stylesheet, because the declaration is a picture of the arrangement. Subgrid solves the harder problem: making the internals of separate child components line up with each other. With it, a row of cards can have its titles, bodies and footers aligned across all cards regardless of content length.\n\nKey rules:\n- Template areas are declared as rows of names - each name must form a rectangle.\n- Subgrid makes a child use the parent tracks, aligning internals across sibling components.\n- Grid items can overlap deliberately by assigning them to the same lines.\n- Reordering by grid placement changes the visual order only - reading order stays as written.\n\nWorked example - card internals aligned across siblings using subgrid:\n.card-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }\n.card { display: grid; grid-template-rows: subgrid; grid-row: span 3; }",
        "problems": [
          {
            "title": "Area naming",
            "points": 30,
            "difficulty": "Basic",
            "description": "Express three supplied page layouts entirely with named areas.",
            "criteria": [
              "All three match and every area forms a rectangle."
            ],
            "hint": "Each named area must form a rectangle.",
            "solution": "All three layouts expressed correctly via named areas, each forming a valid rectangle."
          },
          {
            "title": "Alignment without heights",
            "points": 40,
            "difficulty": "Core",
            "description": "Align card internals across a row without any fixed height.",
            "criteria": [
              "Alignment holds with content of very different lengths."
            ],
            "hint": "Subgrid makes a child use the parent tracks for alignment.",
            "solution": "Card internals aligned via subgrid, holding correctly even with very different content lengths."
          },
          {
            "title": "Module project: Asymmetric dashboard layout",
            "points": 60,
            "difficulty": "Boss",
            "description": "Build a dashboard with panels of differing sizes using named areas and subgrid aligned internals, holding its alignment under every supplied data set.",
            "criteria": [
              "Panels of differing sizes are laid out with named areas, internals align via subgrid, and alignment holds under every supplied data set."
            ],
            "hint": "Reordering by grid placement never changes the reading order.",
            "solution": "An asymmetric dashboard whose subgrid-aligned internals hold correctly across every supplied data set."
          }
        ],
        "tier": "Advanced",
        "videos": [
          {
            "channel": "Kevin Powell",
            "title": "CSS subgrid explained",
            "length": "13 min",
            "url": "https://www.youtube.com/results?search_query=Kevin%20Powell%20CSS%20subgrid%20explained"
          }
        ]
      },
      {
        "no": 7,
        "week": 1,
        "session": 3,
        "title": "Advanced 3: Fluid Type, Container Queries and Accessible Motion",
        "video_url": null,
        "topic": "Fluid sizing replaces a stack of breakpoint overrides with one expression that has a floor, a preferred value that scales with the viewport, and a ceiling. Container queries fix the deeper flaw in responsive design: a component should respond to the space it has been given, not the size of the window. Motion needs a user preference check - for some users motion causes real physical discomfort.\n\nKey rules:\n- A clamped value takes a minimum, a preferred scaling value and a maximum.\n- Container queries respond to the parent size, so a component behaves correctly wherever placed.\n- Always honour the reduced motion preference - replace movement with a fade or with nothing.\n- Animate transform and opacity; animating layout properties forces a full recalculation each frame.\n\nWorked example - fluid type, a container query and a motion preference check:\nh1 { font-size: clamp(1.75rem, 1.2rem + 2.5vw, 3.25rem); }\n.panel { container-type: inline-size; }\n@media (prefers-reduced-motion: reduce) {\n  *, *::before, *::after { animation-duration: 0.01ms !important; }\n}",
        "problems": [
          {
            "title": "Breakpoint to fluid",
            "points": 30,
            "difficulty": "Basic",
            "description": "Convert a four breakpoint type scale to fluid expressions.",
            "criteria": [
              "Sizes match at the original breakpoints and scale smoothly between them."
            ],
            "hint": "A clamped value takes a floor, a scaling preferred value, and a ceiling.",
            "solution": "The type scale converted to fluid clamp() expressions matching the original breakpoints and scaling smoothly between them."
          },
          {
            "title": "Portable component",
            "points": 40,
            "difficulty": "Core",
            "description": "Make one component render correctly in a sidebar, a main column and a modal without any change.",
            "criteria": [
              "Correct in all three placements."
            ],
            "hint": "Container queries respond to the parent size, not the viewport.",
            "solution": "One component rendering correctly in all three placements using container queries, with no per-placement changes."
          },
          {
            "title": "Module project: Fluid multi device layout",
            "points": 60,
            "difficulty": "Boss",
            "description": "Build a page whose type, spacing and component layout scale continuously across three device classes, with container aware components and a full reduced motion path.",
            "criteria": [
              "Type, spacing and layout scale continuously across three device classes, components are container-aware, and reduced motion is fully honoured."
            ],
            "hint": "Always honour the reduced motion preference.",
            "solution": "A fully fluid, container-aware page with a complete reduced-motion path across three device classes."
          }
        ],
        "tier": "Advanced",
        "videos": [
          {
            "channel": "Kevin Powell",
            "title": "Fluid typography with clamp",
            "length": "12 min",
            "url": "https://www.youtube.com/results?search_query=Kevin%20Powell%20Fluid%20typography%20with%20clamp"
          },
          {
            "channel": "Fireship",
            "title": "CSS Container Queries in 100 Seconds",
            "length": "3 min",
            "url": "https://www.youtube.com/results?search_query=Fireship%20CSS%20Container%20Queries%20in%20100%20Seconds"
          }
        ]
      },
      {
        "no": 8,
        "week": 2,
        "session": 1,
        "title": "Advanced 4: Performance, Design Systems and the Course Capstone",
        "video_url": null,
        "topic": "An interface is finished when it meets a number, not when it looks done. Layout shift, interaction delay and largest paint time are all measurable and fixable: reserving space for images, avoiding long synchronous work, loading what matters first. A design system replaces one-off decisions with a small set of tokens and components that have already been measured.\n\nKey rules:\n- Reserve space for every image and embed with width and height - unreserved space is the main cause of layout shift.\n- Set the performance budget before building, measured on a mid range device.\n- A design system is tokens, components and rules for combining them.\n- Document each component with its variants, states and accessibility notes.\n\nWorked example - reserving space and loading in priority order:\n<img src=\"hero.avif\" width=\"1600\" height=\"900\" alt=\"Cohort graduation\" fetchpriority=\"high\">\n<style> .hero { aspect-ratio: 16 / 9; } </style>",
        "problems": [
          {
            "title": "Shift elimination",
            "points": 30,
            "difficulty": "Basic",
            "description": "Reduce the layout shift on a supplied page below the required threshold.",
            "criteria": [
              "Measured score within budget."
            ],
            "hint": "Reserve space for every image and embed with width and height.",
            "solution": "The layout shift score reduced below the required threshold, verified by measurement."
          },
          {
            "title": "Component documentation",
            "points": 40,
            "difficulty": "Core",
            "description": "Document three components with variants, states and accessibility notes.",
            "criteria": [
              "Another student can rebuild each from the documentation alone."
            ],
            "hint": "A design system is tokens, components and rules for combining them.",
            "solution": "Documentation complete enough that all three components could be rebuilt from it alone."
          },
          {
            "title": "Course capstone: DevFolio accessible personal portfolio platform",
            "points": 60,
            "difficulty": "Boss",
            "description": "Build a production portfolio using grid and subgrid, a complete token system, three verified breakpoints, zero accessibility violations at the required level, a full reduced motion path and a met performance budget.",
            "criteria": [
              "Grid/subgrid, a complete token system, three verified breakpoints, zero accessibility violations, full reduced motion, and a met performance budget are all present and verified."
            ],
            "hint": "Set the performance budget before building, and measure against it throughout.",
            "solution": "A complete DevFolio portfolio meeting every constraint, verified against its performance budget and zero accessibility violations."
          }
        ],
        "tier": "Advanced",
        "videos": [
          {
            "channel": "Fireship",
            "title": "Core Web Vitals explained",
            "length": "9 min",
            "url": "https://www.youtube.com/results?search_query=Fireship%20Core%20Web%20Vitals%20explained"
          },
          {
            "channel": "Kevin Powell",
            "title": "How to structure your CSS",
            "length": "13 min",
            "url": "https://www.youtube.com/results?search_query=Kevin%20Powell%20How%20to%20structure%20your%20CSS"
          }
        ]
      }
    ]
  }
];
