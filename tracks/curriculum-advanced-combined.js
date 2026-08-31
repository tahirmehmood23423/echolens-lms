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
 *
 * Exception: `c-advanced` ("Advanced C Programming - Systems & Memory
 * Control"), `cpp-advanced` ("Advanced C++ (OOP & Architecture)"),
 * `python-advanced` ("Advanced Python - Core Language Internals") and
 * `js-advanced` ("Advanced JavaScript - Production Architecture") were all
 * rewritten to follow their official syllabus PDFs verbatim (same
 * real-life-analogy + explanation + video + one literal-I/O Compiler Quest
 * per topic shape as tracks/free-micro.js's FC-01/FC-02): C/C++ are
 * 4-module/12-topic, Python and JavaScript are 5-module/15-topic.
 * `c-advanced`/`cpp-advanced` use real `video_url` watch links (embeddable
 * inline, see openSolveVideo() in public/js/open.js). `python-advanced` and
 * `js-advanced` instead carry a `video_url` YouTube search link
 * (youtube.com/results?search_query=...) built from their updated syllabus
 * PDFs' "Video lesson" query text - a wrong watch id silently sends a
 * student to an unrelated video, a keyword search does not; these render as
 * an external "Watch video" link rather than an inline embed. web-advanced
 * below still uses the older videos[] search-query array. The old 8-level
 * Basic/Advanced-tier curricula they replaced are preserved in git history.
 */

module.exports = [
  {
    "key": "c-advanced",
    "course_code": "CS1-ADV",
    "free": true,
    "friendly_grading": true,
    "default_language": "c",
    "title": "Advanced C Programming",
    "description": "Advanced C Programming - Systems & Memory Control: systems-level C beyond the fundamentals - pointers and memory addressing, dynamic heap allocation, structs and bitwise hardware control, through to file persistence and function-pointer dispatch. Four modules, twelve topics, one real-life analogy, one video and one scenario-based Compiler Quest each.",
    "outcome": "Read, write and navigate memory directly through pointers, pointer arithmetic and double pointers; manage the heap safely with malloc/calloc/realloc/free and avoid leaks and dangling pointers; design structs and typedefs and build a linked list, and manipulate hardware-style bit flags with bitwise masks; persist data to disk with both text and binary streams, and dispatch behaviour dynamically through function pointers.",
    "keywords": [
      "advanced C programming",
      "C pointers and memory",
      "C dynamic memory allocation",
      "C structs and linked lists",
      "C bitwise operations",
      "C file I/O",
      "C function pointers",
      "systems programming in C"
    ],
    "key_concepts": [
      "Pointers & dereferencing",
      "Pointer arithmetic",
      "Double pointers (**ptr)",
      "malloc() & calloc()",
      "Buffer resizing with realloc",
      "Memory leaks & free()",
      "struct & typedef",
      "Linked lists",
      "Bitwise operations & masks",
      "Stream file I/O",
      "Binary block I/O",
      "Function pointers & callbacks"
    ],
    "pass_mark": 60,
    "titleNames": [
      "Pointer Adept",
      "Heap Guardian",
      "Struct Architect",
      "Systems Engineer"
    ],
    "levels": [
      {
        "no": 1,
        "week": 1,
        "session": 1,
        "title": "Pointers & Dereferencing",
        "video_url": "https://www.youtube.com/watch?v=Hi-Ul47t3nQ",
        "topic": "Real-life analogy: Think of a treasure map containing coordinates written on a parchment. The parchment itself is not the chest of gold - it merely holds the geographical latitude and longitude (the address) of where the gold is buried. Opening the chest at those coordinates is dereferencing.\n\nA pointer is a special variable whose value is the physical hexadecimal memory address of another variable in RAM. Using the reference operator & extracts the memory location, while the dereference operator * accesses or modifies the data stored directly at that target address, unlocking low-level memory mutation across function scopes.",
        "problems": [
          {
            "title": "Memory Address Mutation Engine",
            "points": 30,
            "difficulty": "Basic",
            "description": "Write a program that takes an integer, stores its reference in a pointer, and multiplies the original variable's value by 3 strictly through the dereference operator - the same coordinates-to-treasure move the analogy describes, applied to a real variable in memory.\n\nSample Input: 15\nExpected Output:\nUpdated Value: 45",
            "criteria": [
              "The multiplication is performed strictly through the dereference operator (*ptr = *ptr * 3;), never by reassigning the original variable's name directly",
              "For input 15 the program prints exactly \"Updated Value: 45\""
            ],
            "hint": "int *ptr = &value; *ptr = *ptr * 3;",
            "solution": "A pointer holding the variable's address, whose target is multiplied by 3 through *ptr, correctly turning 15 into 45."
          }
        ]
      },
      {
        "no": 2,
        "week": 1,
        "session": 2,
        "title": "Pointer Arithmetic",
        "video_url": "https://www.youtube.com/watch?v=ASVB8KAFypk",
        "topic": "Real-life analogy: Think of a street where houses are numbered in steps of 4 meters. If you are standing at House 0 and take \"1 step forward,\" you don't advance 1 millimeter - you jump exactly 4 meters down the sidewalk to House 1.\n\nIn C, an array name decays into a constant pointer to its first element (arr == &arr[0]). Adding 1 to a pointer (ptr + 1) does not add 1 byte - it advances the address by sizeof(type) bytes (e.g. 4 bytes for an int). Therefore *(arr + i) is mathematically and mechanically identical to arr[i].",
        "problems": [
          {
            "title": "Buffer Navigation via Pointer Arithmetic",
            "points": 40,
            "difficulty": "Core",
            "description": "Read an integer size N followed by N integers into an array. Traverse and print all elements in reverse strictly using pointer arithmetic without brackets [] - proving *(arr + i) and arr[i] really are the same address, just written two different ways.\n\nSample Input:\n4\n10 20 30 40\nExpected Output:\n40 30 20 10",
            "criteria": [
              "Every element access uses *(arr + i) style pointer arithmetic - no [] indexing appears anywhere in the traversal",
              "For the sample input the program prints exactly \"40 30 20 10\", walking the array backward from the last element to the first"
            ],
            "hint": "Loop i from N-1 down to 0, printing *(arr + i) each time - never arr[i].",
            "solution": "A reverse traversal using only *(arr + i) pointer arithmetic, correctly printing 40 30 20 10 for the sample array."
          }
        ]
      },
      {
        "no": 3,
        "week": 1,
        "session": 3,
        "title": "Double Pointers (**ptr)",
        "video_url": "https://www.youtube.com/watch?v=d3kd5KbGB48",
        "topic": "Real-life analogy: If a manager wants to reassign which employee leads a project, they don't just change the employee's title - they update the CEO's project-assignment ledger (a pointer to a pointer) to point to a completely different lead engineer.\n\nBecause C does not have native pass-by-reference syntax, pointers allow functions to mutate variables in the caller's stack frame. When a function needs to allocate or modify the pointer itself (such as altering where a buffer points), a double pointer (type**) is passed to allow indirection across two stack levels.",
        "problems": [
          {
            "title": "In-Place High-Performance Variable Swap",
            "points": 40,
            "difficulty": "Core",
            "description": "Implement void swap(int *a, int *b). Read two integers, pass their memory addresses into swap(), and print their updated order in main() - the classic proof that a function can reach back into the caller's stack frame through a pointer.\n\nSample Input: 88 99\nExpected Output:\nSwapped: 99 88",
            "criteria": [
              "swap(int *a, int *b) dereferences both parameters to exchange the values (using a temporary variable), and is called as swap(&x, &y)",
              "For input \"88 99\" main() prints exactly \"Swapped: 99 88\" after the call, proving the swap reached the caller's real variables"
            ],
            "hint": "Inside swap: int temp = *a; *a = *b; *b = temp;",
            "solution": "A pointer-based swap() that genuinely exchanges the caller's two variables, printing Swapped: 99 88 for input 88 99."
          }
        ]
      },
      {
        "no": 4,
        "week": 2,
        "session": 1,
        "title": "malloc() & calloc()",
        "video_url": "https://www.youtube.com/watch?v=n_Se6bt8jM0",
        "topic": "Real-life analogy: Stack memory is like booking a hotel room for a fixed 24 hours (automatic checkout upon leaving). Heap allocation is buying commercial land on demand - you can request any custom acreage you need at runtime, but you must construct and manage it manually.\n\nStack memory has a fixed size and automatic lifetime tied to function scope. malloc(size_t) requests contiguous raw bytes from the Heap at runtime and returns a void* pointer to the base address. calloc(num, size) allocates memory and initializes every single bit to zero, preventing garbage value issues.",
        "problems": [
          {
            "title": "Dynamic Array Allocator",
            "points": 30,
            "difficulty": "Basic",
            "description": "Read an integer size N. Allocate space dynamically for N floats using malloc, populate the elements from input, calculate their sum, and print the total formatted to 2 decimals - buying exactly the acreage needed for N floats, no more, no less.\n\nSample Input:\n3\n1.5 2.5 4.0\nExpected Output:\nSum: 8.00",
            "criteria": [
              "malloc(N * sizeof(float)) sizes the allocation to exactly N floats, and the pointer is freed at the end",
              "For the sample input the program prints exactly \"Sum: 8.00\", using %.2f formatting"
            ],
            "hint": "float *arr = malloc(N * sizeof(float)); then printf(\"Sum: %.2f\\n\", total);",
            "solution": "A malloc'd float array sized exactly to N, correctly summed and printed as Sum: 8.00 for the sample input."
          }
        ]
      },
      {
        "no": 5,
        "week": 2,
        "session": 2,
        "title": "Buffer Resizing (realloc)",
        "video_url": "https://www.youtube.com/watch?v=eo9vm5n6DBo",
        "topic": "Real-life analogy: Think of expanding a modular warehouse. If adjacent land is empty, the builder simply moves the back wall outward. If adjacent land is occupied by neighbors, the builder purchases an entirely new large plot across town, moves all your inventory there, and tears down the old building.\n\nrealloc(ptr, new_size) expands or shrinks an existing heap allocation. If contiguous space is available immediately following the current block, it expands in-place. Otherwise, it allocates a new block elsewhere, copies the existing data over automatically, frees the old block, and returns the new pointer.",
        "problems": [
          {
            "title": "Dynamic Telemetry Buffer Resizing",
            "points": 40,
            "difficulty": "Core",
            "description": "Allocate an initial array of 2 integers with values [10, 20]. Use realloc to grow the buffer capacity to 4, append two incoming integers, and print all 4 elements - the warehouse moving to a bigger plot without losing any inventory already stored.\n\nSample Input: 30 40\nExpected Output:\n10 20 30 40",
            "criteria": [
              "realloc's return value is assigned back to the pointer variable (never discarded or assigned to a second, separate pointer)",
              "The original two values [10, 20] survive the resize, and for input \"30 40\" the program prints exactly \"10 20 30 40\""
            ],
            "hint": "arr = realloc(arr, 4 * sizeof(int)); then arr[2] = 30; arr[3] = 40;",
            "solution": "A realloc-based grow from 2 to 4 ints that preserves the original values and correctly appends the two new ones, printing 10 20 30 40."
          }
        ]
      },
      {
        "no": 6,
        "week": 2,
        "session": 3,
        "title": "Memory Leaks & free()",
        "video_url": "https://www.youtube.com/watch?v=1KVpi0VN82E",
        "topic": "Real-life analogy: Renting an apartment key, making a copy, throwing the original lease in the incinerator, and leaving the water running. You can never return the key (a memory leak), and trying to open the door after the building is demolished (a dangling pointer) leads to disaster.\n\nHeap allocations persist until explicitly released. Failing to call free(ptr) causes memory leaks that consume system RAM over time. After freeing memory, the pointer becomes a dangling pointer - dereferencing it invokes undefined behavior. Always set pointers to NULL immediately after freeing.",
        "problems": [
          {
            "title": "Safe Heap Cleanup & Sentinel Verification",
            "points": 40,
            "difficulty": "Core",
            "description": "Allocate an integer on the heap, store the value 500, free the memory, and set the pointer to NULL. Check if the pointer equals NULL before printing a safe status - closing the incinerator door and confirming the key can never be used again.\n\nInput: None\nExpected Output:\nPointer Safely Nullified",
            "criteria": [
              "free(ptr) is called before ptr is explicitly set to NULL, in that order",
              "The program checks if (ptr == NULL) before printing, and prints exactly \"Pointer Safely Nullified\""
            ],
            "hint": "free(ptr); ptr = NULL; if (ptr == NULL) printf(\"Pointer Safely Nullified\\n\");",
            "solution": "A heap integer that is freed, immediately nullified, and verified safe via a NULL check before printing the exact status line."
          }
        ]
      },
      {
        "no": 7,
        "week": 3,
        "session": 1,
        "title": "struct & typedef",
        "video_url": "https://www.youtube.com/watch?v=CI9dRTvzgqE",
        "topic": "Real-life analogy: Think of a composite passport document. It binds different types of identity records - name (string), age (int), and visa validity (char) - into one cohesive official booklet that can be handled as a single unit.\n\nThe struct keyword packages heterogeneous data types into a contiguous composite type. Compilers automatically insert invisible byte alignment padding to keep fields aligned to 4-byte or 8-byte word boundaries for CPU performance. The typedef keyword creates clean type aliases for concise syntax.",
        "problems": [
          {
            "title": "Embedded Sensor Telemetry Packet",
            "points": 30,
            "difficulty": "Basic",
            "description": "Define a typedef struct named Telemetry containing int sensor_id and float voltage. Read values from input, populate the struct, and print a formatted log - binding two different record types into one passport-style booklet.\n\nSample Input: 101 3.32\nExpected Output:\nSensor ID: 101 | Voltage: 3.32V",
            "criteria": [
              "A typedef struct Telemetry exists with exactly int sensor_id and float voltage fields, populated from the two input values",
              "For input \"101 3.32\" the program prints exactly \"Sensor ID: 101 | Voltage: 3.32V\""
            ],
            "hint": "typedef struct { int sensor_id; float voltage; } Telemetry; then printf(\"Sensor ID: %d | Voltage: %.2fV\\n\", t.sensor_id, t.voltage);",
            "solution": "A Telemetry struct populated from input and printed in the exact required log format."
          }
        ]
      },
      {
        "no": 8,
        "week": 3,
        "session": 2,
        "title": "Linked Lists",
        "video_url": "https://www.youtube.com/watch?v=1fi2CPGcdA8",
        "topic": "Real-life analogy: Think of a treasure hunt where every clue card contains two things: a clue message (the data payload) and a written GPS coordinate pointing to the location of the next card in the forest (the next pointer).\n\nA self-referential struct contains a member pointer that points to another struct of its own type (struct Node *next;). Unlike contiguous arrays, linked lists allocate elements non-contiguously on the heap, linking nodes dynamically through pointer chains. This enables O(1) insertions without memory reallocations.",
        "problems": [
          {
            "title": "Linked List Traversal Engine",
            "points": 40,
            "difficulty": "Core",
            "description": "Construct a 2-node singly linked list dynamically on the heap from two input integers. Traverse the list from head to tail and print the sequence - following the clue cards one GPS coordinate at a time until the trail ends.\n\nSample Input: 25 50\nExpected Output:\n25 -> 50 -> NULL",
            "criteria": [
              "Both nodes are allocated with malloc (a self-referential struct Node { int data; struct Node *next; };), linked via the first node's next pointer, not stored in a plain array",
              "For input \"25 50\" the traversal prints exactly \"25 -> 50 -> NULL\""
            ],
            "hint": "head->next = second; second->next = NULL; then walk with a temp pointer printing data followed by \" -> \".",
            "solution": "A 2-node heap-allocated linked list correctly traversed head to tail, printing 25 -> 50 -> NULL."
          }
        ]
      },
      {
        "no": 9,
        "week": 3,
        "session": 3,
        "title": "Bitwise Operations & Masks",
        "video_url": "https://www.youtube.com/watch?v=tGpBOeBtr7w",
        "topic": "Real-life analogy: Think of an electrical control panel with 8 physical toggle switches. Rather than building 8 separate giant power boxes, a single master byte controls all 8 switches. Flipping Switch #3 up is a bitwise OR operation.\n\nBitwise operators manipulate raw binary bits inside an integer: AND (&), OR (|), XOR (^), NOT (~), Left Shift (<<), and Right Shift (>>). Bit masks allow programmers to set, clear, and toggle individual hardware flags in microcontroller registers without altering neighboring bits.",
        "problems": [
          {
            "title": "Hardware Status Flag Masking",
            "points": 40,
            "difficulty": "Core",
            "description": "Read an integer register value and a bit index (0-7). Use bitwise left-shift and OR (val | (1 << bit)) to set that bit to 1, then print the new integer value - flipping exactly one switch on the control panel without disturbing the other seven.\n\nSample Input: 8 1\nExpected Output:\nUpdated Register: 10",
            "criteria": [
              "The bit is set using val | (1 << bit), not by recomputing the whole register value some other way",
              "For input \"8 1\" the program prints exactly \"Updated Register: 10\" (binary 1000 with bit 1 set becomes 1010 = 10)"
            ],
            "hint": "int updated = val | (1 << bit); printf(\"Updated Register: %d\\n\", updated);",
            "solution": "A single OR-with-shifted-mask operation that correctly sets the requested bit, turning register 8 with bit 1 into 10."
          }
        ]
      },
      {
        "no": 10,
        "week": 4,
        "session": 1,
        "title": "Stream File I/O",
        "video_url": "https://www.youtube.com/watch?v=UqB4EgUxapM",
        "topic": "Real-life analogy: Opening a file stream is like connecting a pipeline to an underground storage silo. The valve is opened with a mode key (\"r\" for read, \"w\" for write). If you forget to close the valve (fclose), fuel leaks into the system buffer.\n\nC manages persistent disk files using a buffered stream handled by the FILE* control structure. Programs must open streams with fopen(), perform formatted disk reads/writes via fscanf() and fprintf(), and flush/release kernel handles using fclose() to prevent resource locks.",
        "problems": [
          {
            "title": "Persistent System Log File Writer",
            "points": 30,
            "difficulty": "Basic",
            "description": "Create a file named audit.log using fopen(\"audit.log\", \"w\"), write an incoming log string using fprintf(), close the file, reopen it in read mode, and print its content - opening and closing the pipeline valve correctly on both ends.\n\nSample Input: AUTH_SUCCESS_NODE_9\nExpected Output:\nAudit Log Content: AUTH_SUCCESS_NODE_9",
            "criteria": [
              "The file is opened \"w\" to write and fclose()'d before being reopened \"r\" to read - never left open across both operations",
              "For input \"AUTH_SUCCESS_NODE_9\" the program prints exactly \"Audit Log Content: AUTH_SUCCESS_NODE_9\" after reading it back from disk"
            ],
            "hint": "fopen(\"audit.log\",\"w\") -> fprintf -> fclose, then fopen(\"audit.log\",\"r\") -> fscanf -> fclose.",
            "solution": "A write-then-reopen-and-read cycle through audit.log, correctly closing the file between the two operations and printing the exact recovered content."
          }
        ]
      },
      {
        "no": 11,
        "week": 4,
        "session": 2,
        "title": "Binary Block I/O",
        "video_url": "https://www.youtube.com/watch?v=vESy0Up66RU",
        "topic": "Real-life analogy: Writing plain text to disk is like translating a document word-by-word into handwriting. Binary block I/O is taking a high-speed polaroid photograph of the exact physical RAM memory block and dumping it directly onto the disk in milliseconds.\n\nText files convert internal numbers into ASCII strings, which is slow and space-inefficient. Binary I/O via fwrite() and fread() streams raw contiguous byte buffers directly between RAM and disk storage, preserving exact binary representations of structs and large arrays with zero translation overhead.",
        "problems": [
          {
            "title": "Binary Struct Serialization",
            "points": 40,
            "difficulty": "Core",
            "description": "Write a struct containing int code, key directly to a binary file data.bin using fwrite. Read it back with fread and print the decoded fields - the polaroid-photograph copy of the exact memory block, not a translated text version.\n\nSample Input: 777 999\nExpected Output:\nDecoded Binary: Code=777, Key=999",
            "criteria": [
              "fwrite(&record, sizeof(record), 1, fp) writes the whole struct as raw bytes (not fprintf'd as text), and fread reads it back the same way",
              "For input \"777 999\" the program prints exactly \"Decoded Binary: Code=777, Key=999\" after reading the binary file back"
            ],
            "hint": "fwrite(&rec, sizeof(rec), 1, fp); ... fread(&rec, sizeof(rec), 1, fp);",
            "solution": "A struct written and read back via fwrite/fread as raw binary, correctly decoding to Code=777, Key=999."
          }
        ]
      },
      {
        "no": 12,
        "week": 4,
        "session": 3,
        "title": "Function Pointers & Callbacks",
        "video_url": "https://www.youtube.com/watch?v=BRsv3ZXoHto",
        "topic": "Real-life analogy: Think of a universal power drill with quick-swap bit chucks. The drill handle (the host execution engine) doesn't care whether you plug in a screwdriver bit or a sanding bit - it simply invokes whatever tool bit is slotted in at runtime.\n\nIn C, executable machine code also resides in memory. A function's name points to the memory address of its entry instruction. A function pointer (int (*func_ptr)(int, int)) stores this executable address, enabling dynamic callback routines, event listeners, and pluggable dispatch tables like the standard library's qsort().",
        "problems": [
          {
            "title": "Dynamic Arithmetic Dispatch Engine",
            "points": 60,
            "difficulty": "Boss",
            "description": "Create two functions: add(a,b) and multiply(a,b). Assign their pointers dynamically based on an operator flag ('+' or '*') and execute the operation via the function pointer - the drill handle invoking whichever bit is slotted in, decided only at runtime. The capstone finale for this course.\n\nSample Input: * 6 7\nExpected Output:\nDispatch Result: 42",
            "criteria": [
              "A function pointer variable (e.g. int (*op)(int,int)) is assigned to either add or multiply based on the operator flag, and the operation is executed by CALLING THROUGH that pointer, not by an if/else branching directly to add() or multiply()",
              "For input \"* 6 7\" the program prints exactly \"Dispatch Result: 42\""
            ],
            "hint": "int (*op)(int,int) = (flag == '*') ? multiply : add; then printf(\"Dispatch Result: %d\\n\", op(a,b));",
            "solution": "A function pointer dynamically assigned to add or multiply based on the flag and invoked through the pointer, correctly dispatching 6*7 to 42."
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
    "description": "Advanced C++ (OOP & Architecture): systems-level object-oriented design - inheritance, virtual dispatch and abstract interfaces, operator overloading and copy control, templates and generic programming, through to smart pointers and move semantics. Four modules, twelve topics, one real-life analogy, one video and one scenario-based Compiler Quest each.",
    "outcome": "Design class hierarchies with protected inheritance and dynamic dispatch through virtual functions and abstract interfaces; overload operators for natural object syntax, and implement safe deep-copy and self-assignment-protected copy control (the Rule of Three/Five); write generic function and class templates, and use STL algorithms with lambdas; manage heap ownership safely with std::unique_ptr and std::shared_ptr, and transfer resources efficiently with move semantics.",
    "keywords": [
      "advanced C++ programming",
      "C++ inheritance and polymorphism",
      "C++ operator overloading",
      "C++ copy control and Rule of Five",
      "C++ templates",
      "C++ STL algorithms and lambdas",
      "C++ smart pointers",
      "C++ move semantics"
    ],
    "key_concepts": [
      "Inheritance & protected",
      "Virtual functions & vtables",
      "Abstract classes & interfaces",
      "Operator overloading (+, ==, <<)",
      "Deep vs shallow copy",
      "Rule of Three / Five",
      "Function templates",
      "Class templates",
      "STL algorithms & lambdas",
      "std::unique_ptr",
      "std::shared_ptr & reference counting",
      "Move semantics & std::move"
    ],
    "pass_mark": 60,
    "titleNames": [
      "Dispatch Architect",
      "Copy Control Guardian",
      "Template Engineer",
      "Ownership Architect"
    ],
    "levels": [
      {
        "no": 1,
        "week": 1,
        "session": 1,
        "title": "Inheritance & protected",
        "video_url": "https://www.youtube.com/watch?v=5HYIFFuGcvk",
        "topic": "Real-life analogy: A basic vehicle blueprint contains wheels, engine, and steering. An electric sports car inherits all base traits but adds battery packs and turbo modes without rebuilding a vehicle from scratch.\n\nInheritance enables a derived class to inherit member variables and methods from a base class (class Car : public Vehicle). The protected access specifier keeps members private from external client code while keeping them accessible to derived child classes.",
        "problems": [
          {
            "title": "Vehicle Fleet Inheritance",
            "points": 30,
            "difficulty": "Basic",
            "description": "Create a base class Vehicle with protected int speed. Derive a child class Truck that takes speed and cargo payload from input and prints a combined spec sheet - the electric sports car adding its own traits on top of the shared vehicle blueprint.\n\nSample Input: 80 5000\nExpected Output:\nTruck Speed: 80 km/h | Payload: 5000 kg",
            "criteria": [
              "speed is declared protected int in Vehicle (not private), so Truck can access it directly as an inherited member",
              "For input \"80 5000\" the program prints exactly \"Truck Speed: 80 km/h | Payload: 5000 kg\""
            ],
            "hint": "class Vehicle { protected: int speed; }; class Truck : public Vehicle { public: int payload; };",
            "solution": "A Truck class inheriting protected speed from Vehicle and adding its own payload, correctly printing the combined spec sheet."
          }
        ]
      },
      {
        "no": 2,
        "week": 1,
        "session": 2,
        "title": "Virtual Functions & vtables",
        "video_url": "https://www.youtube.com/watch?v=FA5bvYW4iUc",
        "topic": "Real-life analogy: A universal remote control has a \"Power\" button. When pointed at a TV, it turns on the screen; when pointed at an air conditioner, it spins up the compressor. The remote doesn't know the exact machine model - it relies on the device's internal response.\n\nDeclaring a base method as virtual enables dynamic dispatch (runtime polymorphism). The compiler generates a virtual method table (vtable) and assigns a virtual pointer (vptr) to each object. When calling a method via a base pointer (Shape* ptr), C++ resolves the derived object's override dynamically.",
        "problems": [
          {
            "title": "Dynamic Payment Gateway Dispatch",
            "points": 40,
            "difficulty": "Core",
            "description": "Define base class Payment with virtual void pay(). Derive CryptoPayment that overrides pay(). Invoke it using a base class pointer (Payment*) - the same remote-control button triggering a different response depending on which device is actually plugged in.\n\nSample Input: 250\nExpected Output:\nProcessing Crypto Tx: $250",
            "criteria": [
              "pay() is declared virtual in Payment and overridden in CryptoPayment, and is called through a Payment* pointer (not a CryptoPayment pointer/object directly)",
              "For input 250 the program prints exactly \"Processing Crypto Tx: $250\", proving the base pointer dispatched to the derived override"
            ],
            "hint": "class Payment { public: virtual void pay() {} }; class CryptoPayment : public Payment { public: void pay() override { ... } }; Payment* p = new CryptoPayment(); p->pay();",
            "solution": "A virtual pay() overridden in CryptoPayment, correctly dispatched at runtime through a base Payment* pointer."
          }
        ]
      },
      {
        "no": 3,
        "week": 1,
        "session": 3,
        "title": "Abstract Classes & Interfaces",
        "video_url": "https://www.youtube.com/watch?v=UWAdd13EfM8",
        "topic": "Real-life analogy: An international standard for electrical wall plugs specifies exact pin dimensions and voltages. The standard itself cannot produce electricity - it is a pure contract that third-party manufacturers must implement.\n\nA class containing at least one pure virtual function (virtual void render() = 0;) is an Abstract Class. It cannot be instantiated directly and serves as a strict structural interface/contract. Derived classes must override all pure virtual methods to become concrete instantiable classes.",
        "problems": [
          {
            "title": "Sensor Interface Contract",
            "points": 40,
            "difficulty": "Core",
            "description": "Create an abstract class ISensor with pure virtual method virtual double readValue() = 0;. Implement a concrete TempSensor class that reads and returns Celsius input - the wall-plug standard that only becomes real electricity once a concrete manufacturer implements it.\n\nSample Input: 36.5\nExpected Output:\nSensor Reading: 36.5 C",
            "criteria": [
              "ISensor declares readValue() as pure virtual (= 0;) and is never instantiated directly - only TempSensor, which overrides it, is instantiated",
              "For input 36.5 the program prints exactly \"Sensor Reading: 36.5 C\""
            ],
            "hint": "class ISensor { public: virtual double readValue() = 0; }; class TempSensor : public ISensor { public: double readValue() override { ... } };",
            "solution": "An abstract ISensor interface implemented by a concrete TempSensor, correctly reading and printing 36.5 C."
          }
        ]
      },
      {
        "no": 4,
        "week": 2,
        "session": 1,
        "title": "Operator Overloading (+, ==, <<)",
        "video_url": "https://www.youtube.com/watch?v=mS9755gF66w",
        "topic": "Real-life analogy: Adding two numbers (2 + 3 = 5) is basic arithmetic. Adding two time durations (2 hours + 45 minutes = 2h 45m) requires teaching the plus operator how to manipulate compound clock objects.\n\nC++ allows user-defined classes to redefine standard language operators by implementing operator+, operator==, or the stream insertion operator<<. This gives custom objects natural, mathematical syntax without awkward method names like p1.add(p2).",
        "problems": [
          {
            "title": "2D Vector Addition Operator",
            "points": 30,
            "difficulty": "Basic",
            "description": "Create a Vector2D class with int x, y. Overload the + operator so that v1 + v2 sums both coordinates. Read 4 integers for two vectors and print the resulting sum - teaching the plus sign how to add compound coordinate objects, not just plain numbers.\n\nSample Input: 2 3 4 5\nExpected Output:\nResult Vector: (6, 8)",
            "criteria": [
              "operator+ is overloaded as a member (or friend) function on Vector2D, and v1 + v2 uses that operator directly rather than a manually-named method like add()",
              "For input \"2 3 4 5\" the program prints exactly \"Result Vector: (6, 8)\""
            ],
            "hint": "Vector2D operator+(const Vector2D& other) { return Vector2D{x + other.x, y + other.y}; }",
            "solution": "An overloaded + operator on Vector2D that correctly sums two vectors' coordinates, printing Result Vector: (6, 8)."
          }
        ]
      },
      {
        "no": 5,
        "week": 2,
        "session": 2,
        "title": "Deep vs Shallow Copy",
        "video_url": "https://www.youtube.com/watch?v=G_UgbP8clOs",
        "topic": "Real-life analogy: A Shallow Copy gives two housemates the same single front door key (if one changes the lock, the other is locked out). A Deep Copy builds an identical duplicate house with its own separate door lock and keys.\n\nDefault memberwise copy constructors perform shallow copies: copying raw pointer addresses. If one object goes out of scope and frees the memory, the other object holds a broken dangling pointer (a double-free crash). A user-defined copy constructor allocates a fresh heap block and clones the data contents independently.",
        "problems": [
          {
            "title": "Deep Copy Buffer Protector",
            "points": 40,
            "difficulty": "Core",
            "description": "Write a class HeapBuffer that dynamically allocates an integer on the heap. Implement a deep copy constructor. Copy an object, modify the original, and prove the clone remains unmodified - the duplicate house with its own separate lock, unaffected by changes to the original.\n\nSample Input: 50 99\nExpected Output:\nOriginal: 99 | Cloned: 50",
            "criteria": [
              "The copy constructor allocates a NEW heap block for the clone (new int(*other.ptr)) rather than copying the pointer address itself",
              "After the original is modified post-copy, the clone still holds its own separate value, printing exactly \"Original: 99 | Cloned: 50\" for the sample input"
            ],
            "hint": "HeapBuffer(const HeapBuffer& other) { data = new int(*other.data); } - never data = other.data;",
            "solution": "A user-defined deep-copy constructor that clones the heap integer into its own separate block, correctly keeping the clone at 50 while the original changes to 99."
          }
        ]
      },
      {
        "no": 6,
        "week": 2,
        "session": 3,
        "title": "Rule of Three / Five",
        "video_url": "https://www.youtube.com/watch?v=z3QlnTRLNfw",
        "topic": "Real-life analogy: If you sign a commercial lease for property, you must have clear contractual procedures for when you enter, when you sublease (copy), when you transfer ownership (move), and when you terminate the lease (destructor).\n\nIf a class manages raw heap memory or system resources, it must explicitly define the Rule of Five: Destructor, Copy Constructor, Copy Assignment Operator, Move Constructor, and Move Assignment Operator. This prevents memory leaks, dangling pointers, and shallow double-frees.",
        "problems": [
          {
            "title": "Safe Assignment Operator (=)",
            "points": 40,
            "difficulty": "Core",
            "description": "Overload the assignment operator HeapInt& operator=(const HeapInt& other) with self-assignment protection (this != &other). Assign an object and print the value - the lease contract's explicit sublease clause, protecting against assigning an object to itself.\n\nSample Input: 750\nExpected Output:\nAssigned Value: 750",
            "criteria": [
              "operator= checks if (this != &other) before doing any work, guarding against self-assignment corrupting the object",
              "For input 750 the program prints exactly \"Assigned Value: 750\" after the assignment"
            ],
            "hint": "HeapInt& operator=(const HeapInt& other) { if (this != &other) { delete data; data = new int(*other.data); } return *this; }",
            "solution": "A self-assignment-safe operator= that correctly copies the value, printing Assigned Value: 750."
          }
        ]
      },
      {
        "no": 7,
        "week": 3,
        "session": 1,
        "title": "Function Templates",
        "video_url": "https://www.youtube.com/watch?v=I-hZkUa9mIs",
        "topic": "Real-life analogy: Think of a cookie cutter mold. The cutter does not care whether you punch out gingerbread dough, chocolate dough, or clay - the structural star shape remains identical regardless of the material.\n\nTemplates enable generic programming without duplicating identical logic for different data types. Declaring template <typename T> instructs the compiler to generate type-specific functions at compile-time when called with int, double, or custom objects, ensuring zero runtime performance penalty.",
        "problems": [
          {
            "title": "Universal Generic Max Finder",
            "points": 30,
            "difficulty": "Basic",
            "description": "Write a function template T getMax(T a, T b). Read two integers and two floating-point numbers from input, compute their maximums, and print the results - the same cookie-cutter mold stamping out a working getMax for whatever type is dropped in.\n\nSample Input: 12 45 3.14 2.71\nExpected Output:\nInt Max: 45 | Float Max: 3.14",
            "criteria": [
              "A single function template T getMax(T a, T b) is used for BOTH the integer comparison and the float comparison - not two separately hand-written functions",
              "For input \"12 45 3.14 2.71\" the program prints exactly \"Int Max: 45 | Float Max: 3.14\""
            ],
            "hint": "template <typename T> T getMax(T a, T b) { return (a > b) ? a : b; }",
            "solution": "One getMax<T>() template correctly instantiated for both int and float, printing 45 and 3.14 respectively."
          }
        ]
      },
      {
        "no": 8,
        "week": 3,
        "session": 2,
        "title": "Class Templates",
        "video_url": "https://www.youtube.com/watch?v=PD8MXD3uVOk",
        "topic": "Real-life analogy: A shipping freight container has standard locks and crane attachment hooks. It works identically whether it is loaded with cars, electronics, or grain. The container structure is type-agnostic.\n\nA class template parameterized by template <class T> allows entire data structures (like Stacks, Queues, and Matrices) to hold any arbitrary payload. The compiler stamps out a concrete class implementation for each instantiation (such as Box<int> or Box<std::string>).",
        "problems": [
          {
            "title": "Generic Key-Value Pair Box",
            "points": 40,
            "difficulty": "Core",
            "description": "Create a template class Pair<T1, T2> that stores two elements of different types. Instantiate Pair<string, int> and print the pair - the same freight-container structure holding a completely different payload type each time.\n\nSample Input: Latency 15\nExpected Output:\nPair -> Key: Latency, Val: 15ms",
            "criteria": [
              "Pair is declared as template <typename T1, typename T2> class Pair with two differently-typed members, and instantiated concretely as Pair<std::string, int>",
              "For input \"Latency 15\" the program prints exactly \"Pair -> Key: Latency, Val: 15ms\""
            ],
            "hint": "template <typename T1, typename T2> class Pair { public: T1 key; T2 val; };  Pair<std::string, int> p;",
            "solution": "A two-type Pair<T1,T2> template instantiated as Pair<string,int>, correctly printing the key/value pair with the ms suffix."
          }
        ]
      },
      {
        "no": 9,
        "week": 3,
        "session": 3,
        "title": "STL Algorithms & Lambdas",
        "video_url": "https://www.youtube.com/watch?v=HyhvU5SJTlQ",
        "topic": "Real-life analogy: Instead of writing custom sorting steps for a deck of cards from scratch, you hand the deck to an automated card sorter along with a rule card: \"Sort from Lowest to Highest.\"\n\nThe Standard Template Library provides high-performance algorithms (std::sort, std::find_if, std::accumulate) in <algorithm>. Anonymous inline lambda functions [captures](params) { body } pass custom predicate logic directly into STL algorithms without defining separate helper functions.",
        "problems": [
          {
            "title": "Lambda-Powered Filter & Sort",
            "points": 40,
            "difficulty": "Core",
            "description": "Read 4 integers into a vector. Sort them in descending order using std::sort with a custom lambda [](int a, int b){ return a > b; } and print the elements - handing the deck of cards to the automated sorter along with its own rule card, instead of writing a separate named function.\n\nSample Input: 15 4 89 23\nExpected Output:\nSorted: 89 23 15 4",
            "criteria": [
              "std::sort is called with an inline lambda predicate ([](int a, int b){ return a > b; }), not a separately-defined comparator function or a manual sorting loop",
              "For input \"15 4 89 23\" the program prints exactly \"Sorted: 89 23 15 4\""
            ],
            "hint": "std::sort(v.begin(), v.end(), [](int a, int b){ return a > b; });",
            "solution": "A std::sort call driven by an inline descending-order lambda, correctly producing 89 23 15 4."
          }
        ]
      },
      {
        "no": 10,
        "week": 4,
        "session": 1,
        "title": "std::unique_ptr",
        "video_url": "https://www.youtube.com/watch?v=UOB7-B2MfwA",
        "topic": "Real-life analogy: Think of a physical airplane ticket with an assigned seat number. Only one passenger can hold that unique ticket at a time. If you give the ticket to another person, you surrender your own possession completely (move semantics).\n\nstd::unique_ptr<T> is a scoped smart pointer that owns and manages a heap object exclusively. It cannot be copied, preventing multiple-pointer ownership bugs. When the unique pointer goes out of scope, it calls delete automatically, eliminating manual memory leaks.",
        "problems": [
          {
            "title": "Scoped Smart Pointer Allocator",
            "points": 30,
            "difficulty": "Basic",
            "description": "Allocate an integer dynamically using std::make_unique<int>(). Read a value, store it via the smart pointer, and print it without calling delete - the one-passenger airplane ticket that cleans up automatically when its scope ends, no manual free required.\n\nSample Input: 320\nExpected Output:\nSmart Pointer Val: 320",
            "criteria": [
              "The integer is allocated with std::make_unique<int>() (not raw new), and delete never appears anywhere in the code",
              "For input 320 the program prints exactly \"Smart Pointer Val: 320\""
            ],
            "hint": "std::unique_ptr<int> ptr = std::make_unique<int>(value); std::cout << \"Smart Pointer Val: \" << *ptr;",
            "solution": "An std::make_unique<int> allocation with no manual delete, correctly printing Smart Pointer Val: 320."
          }
        ]
      },
      {
        "no": 11,
        "week": 4,
        "session": 2,
        "title": "std::shared_ptr & Reference Counting",
        "video_url": "https://www.youtube.com/watch?v=UOB7-B2MfwA",
        "topic": "Real-life analogy: Think of an office room light wired to a smart occupancy sensor. Every person who enters increments the occupant count by 1. When a person leaves, the count drops. The light turns off only when the last person exits (count = 0).\n\nstd::shared_ptr<T> maintains a thread-safe reference control block. Multiple shared pointers can point to the same heap resource. Every copy increments the reference count; when a pointer goes out of scope, the count decrements. When the counter hits zero, the managed object is destroyed.",
        "problems": [
          {
            "title": "Reference Count Monitor",
            "points": 40,
            "difficulty": "Core",
            "description": "Create a shared_ptr<int> with value 100. Create a second shared pointer copying the first. Print the current reference count using .use_count() - two people now occupying the same room, both counted by the same sensor.\n\nInput: None\nExpected Output:\nShared Count: 2",
            "criteria": [
              "A second std::shared_ptr<int> is created by COPYING the first (not by making a second, independent std::make_shared call), so both genuinely share the same control block",
              "The program prints exactly \"Shared Count: 2\" using .use_count(), reflecting both owners"
            ],
            "hint": "auto p1 = std::make_shared<int>(100); auto p2 = p1; std::cout << \"Shared Count: \" << p1.use_count();",
            "solution": "Two shared_ptrs sharing one control block via a copy, correctly reporting a use_count() of 2."
          }
        ]
      },
      {
        "no": 12,
        "week": 4,
        "session": 3,
        "title": "Move Semantics & std::move",
        "video_url": "https://www.youtube.com/watch?v=zK8A4Ko53HY",
        "topic": "Real-life analogy: Moving into a new apartment. Instead of making exact duplicate photocopies of 500 books in your library and throwing the originals away, you pick up the existing boxes of books and move them into the new room.\n\nTraditional copying duplicates expensive heap buffers. Modern C++ (C++11+) introduces Move Semantics with Rvalue References (T&&). Using std::move() casts an object into an rvalue, allowing the receiving object to steal its internal heap pointers in O(1) time, leaving the source object in a valid but empty state.",
        "problems": [
          {
            "title": "Zero-Copy Buffer Transfer",
            "points": 60,
            "difficulty": "Boss",
            "description": "Create a std::vector<int> with elements [1, 2, 3]. Use std::move() to transfer ownership to a second vector. Print the size of the original vector to prove it was moved - picking up the existing boxes of books rather than photocopying all 500 and throwing the originals away. The capstone finale, closing out the course's ownership-and-memory arc.\n\nInput: None\nExpected Output:\nOriginal Size: 0 | New Size: 3",
            "criteria": [
              "std::move() is used to transfer the vector (std::vector<int> newVec = std::move(original);), not a copy assignment or a manual element-by-element loop",
              "The program prints exactly \"Original Size: 0 | New Size: 3\", proving the original vector was left empty by the move rather than duplicated"
            ],
            "hint": "std::vector<int> newVec = std::move(original); then print original.size() and newVec.size().",
            "solution": "A std::move()-based vector transfer that correctly empties the original (size 0) while the new vector ends up with all 3 elements."
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
    "description": "Advanced Python (Core Language Internals): the Python data model beyond the fundamentals - the iterator protocol and lazy generators, closures and decorators, dunder methods, descriptors and metaclasses, context managers and the memory model, through to threading, multiprocessing and asyncio concurrency. Five modules, fifteen topics, one real-life analogy, one video and one scenario-based Compiler Quest each.",
    "outcome": "Build lazy iterables and generator pipelines that stream data larger than memory; capture state in closures and wrap behaviour with function, parameterised and class decorators; integrate custom classes with Python syntax through dunder methods, descriptors and attribute interception, and customise class creation with abstract base classes and metaclasses; guarantee cleanup with custom and contextlib context managers and shrink memory with __slots__ and weakref; run I/O-bound work concurrently with threads and a synchronised queue, bypass the GIL with multiprocessing, and schedule thousands of coroutines with asyncio.",
    "keywords": [
      "advanced Python programming",
      "Python iterator protocol",
      "Python generators and yield",
      "Python decorators and closures",
      "Python dunder methods",
      "Python metaclasses",
      "Python context managers",
      "Python __slots__ and weakref",
      "Python threading and multiprocessing",
      "Python asyncio"
    ],
    "key_concepts": [
      "Iterator protocol (__iter__, __next__)",
      "Generators & yield",
      "map, filter, reduce & functools",
      "Closures & function factories",
      "Function decorators & functools.wraps",
      "Decorators with arguments & class decorators",
      "Dunder methods (__repr__, __eq__, __getitem__, __call__)",
      "Descriptors & attribute interception",
      "Abstract base classes & metaclasses",
      "Custom context managers (__enter__, __exit__)",
      "contextlib & @contextmanager",
      "Garbage collection, __slots__ & weakref",
      "Threading, multiprocessing & the GIL",
      "Thread synchronization (Lock & Queue)",
      "Async programming with asyncio"
    ],
    "pass_mark": 60,
    "titleNames": [
      "Lazy Iterator Adept",
      "Decorator Engineer",
      "Protocol Metaprogrammer",
      "Concurrency Architect"
    ],
    "levels": [
      {
        "no": 1,
        "week": 1,
        "session": 1,
        "title": "Iterator Protocol (__iter__, __next__)",
        "video_url": "https://www.youtube.com/results?search_query=python%20iterator%20protocol%20__iter__%20__next__",
        "topic": "Real-life analogy: Think of a mechanical ticket-roll dispenser that serves one numbered ticket every time a customer pulls the lever, and raises a little flag the moment the roll runs empty.\n\nA Python iterator implements __iter__() (which returns the iterator object itself) and __next__() (which returns the next value, or raises StopIteration once the elements are exhausted). Building your own iterable lets you evaluate lazily over a huge - even endless - stream without ever holding all of it in RAM at once.",
        "problems": [
          {
            "title": "Custom Range Countdown Iterator",
            "points": 30,
            "difficulty": "Basic",
            "description": "Implement an iterator class Countdown(start) whose __next__ counts down from start to 1 and then raises StopIteration. Drive it with a for loop and print each number followed by LIFTOFF - the ticket dispenser handing out one ticket per lever pull until the roll is empty.\n\nSample Input: 3\nExpected Output: 3 2 1 LIFTOFF",
            "criteria": [
              "Countdown defines both __iter__ (returning self) and __next__, and __next__ raises StopIteration once it passes 1 - the loop is never ended by an if/break in the caller",
              "For input 3 the program prints exactly \"3 2 1 LIFTOFF\" on one line"
            ],
            "hint": "In __next__: if self.current < 1: raise StopIteration; otherwise decrement and return the previous value.",
            "solution": "A Countdown iterator raising StopIteration after 1, printing \"3 2 1 LIFTOFF\" when consumed by a for loop."
          }
        ]
      },
      {
        "no": 2,
        "week": 1,
        "session": 2,
        "title": "Generators & yield Statements",
        "video_url": "https://www.youtube.com/results?search_query=python%20generators%20yield",
        "topic": "Real-life analogy: Think of a chef who cooks each dish on demand as an order reaches the counter, pausing between orders - rather than cooking ten thousand meals in advance and letting them go cold.\n\nA generator function uses yield to produce values one at a time, suspending its own execution between calls and resuming exactly where it left off. It holds only the current state in memory, so it can walk a gigabyte-scale dataset in constant space.",
        "problems": [
          {
            "title": "Lazy Fibonacci Generator",
            "points": 40,
            "difficulty": "Core",
            "description": "Write a generator function fib(n) that yields the first n Fibonacci numbers lazily (starting 0, 1, 1, 2, ...). Read n, consume the generator with a for loop, and print the numbers space-separated - the chef plating one dish per order instead of all at once.\n\nSample Input: 5\nExpected Output: 0 1 1 2 3",
            "criteria": [
              "fib is a generator using yield - there is no full list built up and returned, values are produced one at a time",
              "For input 5 the program prints exactly \"0 1 1 2 3\""
            ],
            "hint": "a, b = 0, 1; loop n times: yield a; then a, b = b, a + b.",
            "solution": "A yield-based fib(n) generator producing the first n Fibonacci numbers, printing \"0 1 1 2 3\" for n = 5."
          }
        ]
      },
      {
        "no": 3,
        "week": 1,
        "session": 3,
        "title": "Built-in Functional Tools (map, filter, reduce, functools)",
        "video_url": "https://www.youtube.com/results?search_query=python%20map%20filter%20reduce%20functools",
        "topic": "Real-life analogy: Think of an automated factory conveyor: each package is reshaped at one station (map), defective items are kicked off the belt at the next (filter), and finally every remaining weight is added into a single gross payload total (reduce).\n\nPython's functional primitives - map(), filter() and functools.reduce() - describe a transformation as a pipeline rather than a loop with mutable accumulators. functools.partial pre-binds arguments so small, reusable step functions compose cleanly.",
        "problems": [
          {
            "title": "Functional Pipeline Processor",
            "points": 40,
            "difficulty": "Core",
            "description": "Read a line of space-separated integers. Using filter() drop the odd numbers, using map() square the remaining evens, and using functools.reduce() sum them into one total - the conveyor transforming, rejecting and then totalling in a single declarative pass.\n\nSample Input: 1 2 3 4 5 6\nExpected Output: Reduced Total: 56",
            "criteria": [
              "The three stages use filter(), map() and functools.reduce() respectively - not a plain for loop with an accumulator variable",
              "For input \"1 2 3 4 5 6\" the program prints exactly \"Reduced Total: 56\" (2*2 + 4*4 + 6*6)"
            ],
            "hint": "reduce(lambda acc, x: acc + x, map(lambda n: n * n, filter(lambda n: n % 2 == 0, nums))).",
            "solution": "A filter -> map -> reduce pipeline squaring the even inputs and summing them to 56."
          }
        ]
      },
      {
        "no": 4,
        "week": 2,
        "session": 1,
        "title": "Closures & Function Factories",
        "video_url": "https://www.youtube.com/results?search_query=python%20closures%20function%20factory",
        "topic": "Real-life analogy: Think of a customised stamp tool pre-loaded with one department's ink. Wherever you carry it, every impression it makes still carries that same department's mark.\n\nA closure is an inner function that keeps access to variables from its enclosing function's scope even after that outer function has returned. A function factory uses this to manufacture specialised functions, each carrying its own captured configuration.",
        "problems": [
          {
            "title": "Custom Power Function Factory",
            "points": 30,
            "difficulty": "Basic",
            "description": "Write a factory power_factory(exp) that returns a function computing x ** exp for whatever x it is later given. Read two integers - the exponent then the base - build the function with the exponent, call it with the base, and print the result. For \"3 4\" that is 4 ** 3.\n\nSample Input: 3 4\nExpected Output: 64",
            "criteria": [
              "power_factory returns an inner function that closes over exp - the exponent is captured once, not passed again at call time",
              "For input \"3 4\" the program prints exactly \"64\" (4 ** 3)"
            ],
            "hint": "def power_factory(exp): def inner(x): return x ** exp; return inner  - then cube = power_factory(3); print(cube(4)).",
            "solution": "A closure factory capturing the exponent, so power_factory(3)(4) returns 64."
          }
        ]
      },
      {
        "no": 5,
        "week": 2,
        "session": 2,
        "title": "Function Decorators & functools.wraps",
        "video_url": "https://www.youtube.com/results?search_query=python%20decorators%20functools%20wraps",
        "topic": "Real-life analogy: Think of slipping a waterproof case onto a phone. The phone does exactly what it did before, but every interaction now passes through an added layer of protection.\n\nA decorator is a callable that takes a function and returns a replacement wrapping extra behaviour around it, applied with @decorator syntax. Wrapping the inner function with @functools.wraps(func) copies across the original name, docstring and signature so introspection still works.",
        "problems": [
          {
            "title": "Execution Timer Decorator",
            "points": 40,
            "difficulty": "Core",
            "description": "Write a decorator @timing_decorator that prints a start line before the wrapped function runs and a finish line after. Decorate a function named \"Task\", call it, and show the surrounding log - the protective case adding a layer around every call without changing the phone.\n\nSample Input: RunTask\nExpected Output:\n[START] Task\n[FINISH] Task",
            "criteria": [
              "timing_decorator returns a wrapper that calls the original function between the [START] and [FINISH] prints, and uses @functools.wraps(func)",
              "Running the decorated task prints exactly two lines: \"[START] Task\" then \"[FINISH] Task\""
            ],
            "hint": "def timing_decorator(func): @functools.wraps(func) def wrapper(*a, **kw): print(\"[START] Task\"); r = func(*a, **kw); print(\"[FINISH] Task\"); return r; return wrapper.",
            "solution": "A @timing_decorator wrapping the call in [START]/[FINISH] log lines while preserving metadata via functools.wraps."
          }
        ]
      },
      {
        "no": 6,
        "week": 2,
        "session": 3,
        "title": "Decorators with Arguments & Class Decorators",
        "video_url": "https://www.youtube.com/results?search_query=python%20decorators%20with%20arguments%20class%20decorators",
        "topic": "Real-life analogy: Think of a security scanner whose alarm sensitivity is dialled to a different threshold depending on whether it is screening carry-on bags or heavy cargo freight.\n\nA decorator that takes its own arguments needs a three-level nest: the outer call captures the arguments, the middle layer receives the function, and the inner layer runs it. A class-based decorator instead implements __call__, which lets it keep state cleanly across every invocation of the wrapped function.",
        "problems": [
          {
            "title": "Configurable Retry Decorator",
            "points": 40,
            "difficulty": "Core",
            "description": "Write a parameterised decorator @retry(num_times=2) that re-runs a function each time it raises an exception, up to num_times extra attempts, and prints which retry finally succeeded. Apply it to a function that fails once then succeeds - the scanner set to its retry threshold before it gives up.\n\nSample Input: FailOnceThenSucceed\nExpected Output: [Retry 1] Success",
            "criteria": [
              "retry(num_times=2) is a three-tier decorator factory (arguments -> function -> wrapper) that catches the exception and re-calls up to num_times times",
              "When the target fails once then succeeds, the program prints exactly \"[Retry 1] Success\""
            ],
            "hint": "def retry(num_times=2): def deco(func): def wrapper(*a, **kw): for i in range(1, num_times + 1): try: return func(*a, **kw) except Exception: continue ...",
            "solution": "A @retry(num_times=2) decorator that swallows the first failure and prints \"[Retry 1] Success\" on the successful re-run."
          }
        ]
      },
      {
        "no": 7,
        "week": 3,
        "session": 1,
        "title": "Advanced Dunder Methods (__repr__, __eq__, __getitem__, __call__)",
        "video_url": "https://www.youtube.com/results?search_query=python%20dunder%20magic%20methods%20repr%20eq%20getitem%20call",
        "topic": "Real-life analogy: Think of teaching a custom-built vehicle to respond to the universal controls every driver expects - the accelerator, the brake pedal, and the diagnostic port on the dashboard.\n\nSpecial \"dunder\" (double-underscore) methods plug a class into Python's own syntax: __repr__ gives a useful debugging string, __eq__ defines ==, __getitem__ enables obj[k] indexing, and __call__ makes an instance callable like a function.",
        "problems": [
          {
            "title": "Callable Vector Math Class",
            "points": 40,
            "difficulty": "Core",
            "description": "Implement a 2D Vector(x, y) class with __add__ so v1 + v2 adds componentwise, __repr__ printing it as Vector(x, y), and __getitem__ so v[0] is x and v[1] is y. Add two vectors and print the sum plus its first component.\n\nSample Input: v1=(2,3), v2=(4,5)\nExpected Output: Vector(6, 8) | Index 0: 6",
            "criteria": [
              "Vector defines __add__, __repr__ and __getitem__, and the + and [] in the program go through those dunder methods (not named helper methods)",
              "For v1=(2,3) and v2=(4,5) the program prints exactly \"Vector(6, 8) | Index 0: 6\""
            ],
            "hint": "__add__ returns Vector(self.x + other.x, self.y + other.y); __getitem__ maps index 0 -> self.x and 1 -> self.y.",
            "solution": "A Vector class whose __add__/__repr__/__getitem__ produce \"Vector(6, 8) | Index 0: 6\" for the sample vectors."
          }
        ]
      },
      {
        "no": 8,
        "week": 3,
        "session": 2,
        "title": "Property Descriptors & Attribute Interception (__getattr__, __setattr__)",
        "video_url": "https://www.youtube.com/results?search_query=python%20descriptors%20getattr%20setattr%20property",
        "topic": "Real-life analogy: Think of a smart building system that intercepts every attempt to change a room's thermostat, checking the requested temperature is sane before it ever lets the furnace fire.\n\nThe descriptor protocol (__get__, __set__, __delete__) is the machinery behind @property: a descriptor is a class attribute that runs code on access. __getattr__ and __setattr__ intercept attribute access on an instance, enabling validation, defaults and proxying.",
        "problems": [
          {
            "title": "Validated Integer Descriptor",
            "points": 40,
            "difficulty": "Core",
            "description": "Create a descriptor class PositiveNumber that stores an integer on the owner object but raises ValueError(\"Negative values prohibited\") in its __set__ whenever the assigned value is negative. Attach it to a class attribute, attempt to set it to -5, and print the caught error - the building system refusing an out-of-range thermostat setting.\n\nSample Input: Set -5\nExpected Output: ValueError: Negative values prohibited",
            "criteria": [
              "PositiveNumber implements __set__ (plus __set_name__ / __get__ as needed) and raises ValueError inside __set__ for negatives - the check lives in the descriptor, not in the caller",
              "Assigning -5 and printing the caught exception yields exactly \"ValueError: Negative values prohibited\""
            ],
            "hint": "In __set__(self, obj, value): if value < 0: raise ValueError(\"Negative values prohibited\").",
            "solution": "A PositiveNumber descriptor whose __set__ rejects -5 with \"ValueError: Negative values prohibited\"."
          }
        ]
      },
      {
        "no": 9,
        "week": 3,
        "session": 3,
        "title": "Abstract Base Classes (abc module) & Metaclasses",
        "video_url": "https://www.youtube.com/results?search_query=python%20abstract%20base%20classes%20metaclasses%20abc",
        "topic": "Real-life analogy: Think of a national industrial standard that requires every compliant engine factory to produce a certified mounting bracket before it is allowed to open its doors at all.\n\nThe abc module enforces a structural contract: a class with an @abstractmethod cannot be instantiated until a subclass implements that method. Metaclasses go one level deeper - by inheriting from type they customise class creation itself, powering automatic subclass registration and field validation.",
        "problems": [
          {
            "title": "Abstract Database Connector Contract",
            "points": 40,
            "difficulty": "Core",
            "description": "Define an abstract base class DatabasePlugin (using abc.ABC) with an abstract method connect(). Create a concrete ConcretePlugin subclass that implements connect() to print the success line, instantiate it and call connect() - the factory that may only open once it produces the certified part.\n\nSample Input: ConcretePlugin\nExpected Output: Plugin Connected Successfully",
            "criteria": [
              "DatabasePlugin subclasses abc.ABC and marks connect() with @abstractmethod, so instantiating DatabasePlugin directly would raise TypeError",
              "ConcretePlugin implements connect(); instantiating it and calling connect() prints exactly \"Plugin Connected Successfully\""
            ],
            "hint": "from abc import ABC, abstractmethod; class DatabasePlugin(ABC): @abstractmethod def connect(self): ...",
            "solution": "An abstract DatabasePlugin contract with a concrete ConcretePlugin whose connect() prints \"Plugin Connected Successfully\"."
          }
        ]
      },
      {
        "no": 10,
        "week": 4,
        "session": 1,
        "title": "Custom Context Managers (__enter__, __exit__)",
        "video_url": "https://www.youtube.com/results?search_query=python%20context%20managers%20__enter__%20__exit__%20with%20statement",
        "topic": "Real-life analogy: Think of borrowing a book from a library - the check-out is logged as you walk in, and the security scan and any late fee are settled automatically as you pass back through the door, whether or not you finished the book.\n\nThe with statement calls __enter__() to acquire a resource and __exit__() to release it - and __exit__ runs even if the block raises an exception, making it the reliable place for cleanup.",
        "problems": [
          {
            "title": "High-Precision Code Timer Context Manager",
            "points": 30,
            "difficulty": "Basic",
            "description": "Implement a Timer context manager whose __enter__ records a start time and whose __exit__ prints a completion line. Use it in a with block around a small workload and show the message printed on exit - the library door settling everything as you leave.\n\nSample Input: RunWorkload\nExpected Output: [Timer] Execution completed successfully",
            "criteria": [
              "Timer is a class defining __enter__ and __exit__ (not the @contextmanager form here), and the completion line is printed from inside __exit__",
              "Running a \"with Timer():\" block prints exactly \"[Timer] Execution completed successfully\""
            ],
            "hint": "class Timer: def __enter__(self): self.t0 = time.perf_counter(); return self  def __exit__(self, *exc): print(\"[Timer] Execution completed successfully\").",
            "solution": "A class-based Timer context manager printing \"[Timer] Execution completed successfully\" from __exit__."
          }
        ]
      },
      {
        "no": 11,
        "week": 4,
        "session": 2,
        "title": "contextlib Utilities (@contextmanager)",
        "video_url": "https://www.youtube.com/results?search_query=python%20contextlib%20contextmanager%20decorator",
        "topic": "Real-life analogy: Think of an express checkout lane that folds scanning and bagging into one smooth motion, instead of two separate stations.\n\nThe @contextlib.contextmanager decorator turns a generator with a single yield into a full context manager: everything before the yield is the __enter__ work, the yielded value is the \"as\" target, and everything after (ideally in a finally) is the __exit__ cleanup - no boilerplate class required.",
        "problems": [
          {
            "title": "Standard Output Redirector",
            "points": 40,
            "difficulty": "Core",
            "description": "Using @contextlib.contextmanager, write a context manager that temporarily replaces sys.stdout with an in-memory io.StringIO buffer, restores it on exit, and makes the captured text available. Inside the block print \"Test Message\", then after the block print it back behind a label.\n\nSample Input: RedirectStream\nExpected Output: [Captured Output] Test Message",
            "criteria": [
              "The context manager is a single-yield generator decorated with @contextmanager, and sys.stdout is restored in a finally block",
              "After the with block, the captured buffer content is printed as exactly \"[Captured Output] Test Message\""
            ],
            "hint": "old = sys.stdout; sys.stdout = io.StringIO(); try: yield sys.stdout finally: sys.stdout = old.",
            "solution": "A @contextmanager-based redirector capturing stdout into a StringIO, yielding \"[Captured Output] Test Message\" afterward."
          }
        ]
      },
      {
        "no": 12,
        "week": 4,
        "session": 3,
        "title": "Garbage Collection, __slots__ & weakref",
        "video_url": "https://www.youtube.com/results?search_query=python%20__slots__%20weakref%20garbage%20collection%20memory",
        "topic": "Real-life analogy: Think of designing a micro-apartment with a fixed set of built-in wall cubbies instead of bulky movable closets - the same storage in a fraction of the footprint and cost.\n\nCPython frees objects by reference counting, with a cyclic collector for reference loops. Declaring __slots__ removes each instance's per-object __dict__, cutting memory sharply, and weakref lets one object refer to another without keeping it alive, breaking reference cycles.",
        "problems": [
          {
            "title": "Memory-Optimized __slots__ Point",
            "points": 40,
            "difficulty": "Core",
            "description": "Create a Point class declaring __slots__ = (\"x\", \"y\") with an __repr__ of Point(x, y). Build Point(10, 20), print it, then attempt to set an undeclared attribute z and report the AttributeError - the fixed wall cubbies with no room for anything unplanned.\n\nSample Input: Set Point(10, 20)\nExpected Output: Point(10, 20) | AttributeError on z",
            "criteria": [
              "Point declares __slots__ = (\"x\", \"y\") so no per-instance __dict__ exists, and assigning p.z raises AttributeError",
              "The program prints exactly \"Point(10, 20) | AttributeError on z\""
            ],
            "hint": "Wrap p.z = 1 in try/except AttributeError, and print the repr and the \"AttributeError on z\" note on one line.",
            "solution": "A __slots__-based Point that prints its repr and reports \"AttributeError on z\" when an undeclared attribute is set."
          }
        ]
      },
      {
        "no": 13,
        "week": 5,
        "session": 1,
        "title": "Threading vs Multiprocessing & the GIL",
        "video_url": "https://www.youtube.com/results?search_query=python%20threading%20vs%20multiprocessing%20GIL",
        "topic": "Real-life analogy: Threading is two cooks sharing a single kitchen counter - fine while they are mostly waiting on phone orders, but a bottleneck when both need to chop at once. Multiprocessing is building two separate kitchens in two separate buildings.\n\nThe Global Interpreter Lock (GIL) lets only one thread execute Python bytecode at a time, so threading helps I/O-bound work (network, disk) but not CPU-bound work. multiprocessing sidesteps the GIL by running separate interpreter processes on separate cores.",
        "problems": [
          {
            "title": "Concurrent Thread Worker Pool",
            "points": 40,
            "difficulty": "Core",
            "description": "Read a worker count N. Launch N threads with threading.Thread, passing each a 1-based worker id, where each worker prints \"Worker <id> Finished\". Join every thread before the program ends so all workers complete - the cooks sharing the counter, all done before service closes.\n\nSample Input: 2 Workers\nExpected Output:\nWorker 1 Finished\nWorker 2 Finished",
            "criteria": [
              "N threading.Thread objects are started with a target and a worker-id argument, and every thread is .join()ed before the program exits",
              "For 2 workers the output contains exactly the lines \"Worker 1 Finished\" and \"Worker 2 Finished\" (one per line)"
            ],
            "hint": "threads = [threading.Thread(target=work, args=(i,)) for i in range(1, n + 1)]; start each, then join each.",
            "solution": "Two joined worker threads each printing \"Worker <id> Finished\"."
          }
        ]
      },
      {
        "no": 14,
        "week": 5,
        "session": 2,
        "title": "Thread Synchronization with Lock & Queue",
        "video_url": "https://www.youtube.com/results?search_query=python%20threading%20lock%20queue%20synchronization",
        "topic": "Real-life analogy: Think of a single-teller bank desk with a velvet-rope queue and a locked cash drawer - only one customer is served at a time, and no two hands ever reach into the drawer at once.\n\nWhen threads share mutable state, unsynchronised updates race and corrupt it. threading.Lock gives mutual exclusion, cleanest as \"with lock:\", and the thread-safe queue.Queue hands work between producer and consumer threads without any explicit locking.",
        "problems": [
          {
            "title": "Mutex-Guarded Counter",
            "points": 40,
            "difficulty": "Core",
            "description": "Start 2 threads that each increment a shared counter 1000 times. Guard every increment with a single shared threading.Lock so no updates are lost, then print the final total - the locked cash drawer that only one hand touches at a time.\n\nInput: None\nExpected Output: Final Thread-Safe Counter: 2000",
            "criteria": [
              "Every increment of the shared counter happens inside \"with lock:\" using one shared Lock, and both threads are joined before the total is read",
              "The program prints exactly \"Final Thread-Safe Counter: 2000\" on every run, with no lost updates"
            ],
            "hint": "Hold the counter in a shared mutable object; inside each loop iteration: with lock: obj.value += 1.",
            "solution": "A lock-guarded shared counter incremented 2000 times across two threads, always printing 2000."
          }
        ]
      },
      {
        "no": 15,
        "week": 5,
        "session": 3,
        "title": "Asynchronous Programming with AsyncIO (async / await)",
        "video_url": "https://www.youtube.com/results?search_query=python%20asyncio%20async%20await",
        "topic": "Real-life analogy: Think of a chess grandmaster playing fifty opponents at once. Rather than standing at board one waiting for a reply, the master plays a move, walks to board two, and only returns to board one once that opponent has moved - one person, many games in flight.\n\nasyncio is single-threaded cooperative multitasking: a coroutine defined with async def gives up control at each await during I/O, and asyncio.gather() runs many coroutines concurrently on one event loop, ideal for thousands of simultaneous network calls.",
        "problems": [
          {
            "title": "Async Coroutine Task Gatherer",
            "points": 60,
            "difficulty": "Boss",
            "description": "Write an async coroutine fetch(task_id) that simulates a network call with await asyncio.sleep(...). Read a task count N, dispatch N of these coroutines concurrently with asyncio.gather(), await them all, and print the completion summary - the capstone finale, the grandmaster keeping every game moving at once instead of blocking on the first.\n\nSample Input: 3 Tasks\nExpected Output: [Async Engine] 3 Network Tasks Completed",
            "criteria": [
              "fetch is an async def coroutine using await asyncio.sleep(...), and all N coroutines are launched together via a single awaited asyncio.gather(*tasks) - not awaited one at a time in a loop",
              "For 3 tasks the program prints exactly \"[Async Engine] 3 Network Tasks Completed\""
            ],
            "hint": "await asyncio.gather(*(fetch(i) for i in range(n))) inside an async main(), run with asyncio.run(main()).",
            "solution": "An asyncio.gather() dispatch of N network coroutines, printing \"[Async Engine] 3 Network Tasks Completed\" - capstone complete."
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
    "description": "Advanced JavaScript (Production Architecture): the language internals behind frameworks - prototypal inheritance and true private fields, Proxies, Reflect and well-known Symbols, the microtask/macrotask event loop and weak-reference memory management, through to Promise combinators, async generators, custom event systems and Web Worker concurrency with SharedArrayBuffer. Five modules, fifteen topics, one real-life analogy, one video and one scenario-based Compiler Quest each.",
    "outcome": "Trace property lookups along the prototype chain and extend built-ins safely, and enforce true encapsulation with #private fields and property descriptors; intercept object operations with Proxy traps and forward them transparently with Reflect, and hook engine behaviour through well-known Symbols; reason about microtask versus macrotask ordering, and prevent leaks with WeakMap, WeakRef and FinalizationRegistry; orchestrate concurrent work with Promise.all / allSettled / race / any, cancel it with AbortController, and stream it with async generators; build decoupled systems on EventTarget / CustomEvent and move CPU-bound work off the main thread with Web Workers, SharedArrayBuffer and Atomics.",
    "keywords": [
      "advanced JavaScript programming",
      "JavaScript prototypal inheritance",
      "JavaScript private class fields",
      "JavaScript Proxy and Reflect",
      "JavaScript well-known symbols",
      "JavaScript event loop microtasks",
      "JavaScript WeakMap and WeakRef",
      "JavaScript Promise combinators",
      "JavaScript async generators",
      "JavaScript Web Workers and Atomics"
    ],
    "key_concepts": [
      "Prototypal inheritance & the prototype chain",
      "ES6 classes & #private fields",
      "Property descriptors (freeze, seal)",
      "Proxy traps (get, set, deleteProperty)",
      "Reflect API & transparent forwarding",
      "Well-known Symbols (iterator, toPrimitive)",
      "Microtasks vs macrotasks",
      "WeakMap & WeakSet",
      "FinalizationRegistry & WeakRef",
      "Promise combinators (all, allSettled, race, any)",
      "AbortController & cancellation",
      "Async generators & for-await-of",
      "Custom events (EventTarget, CustomEvent)",
      "Web Workers (postMessage, onmessage)",
      "SharedArrayBuffer & Atomics"
    ],
    "pass_mark": 60,
    "titleNames": [
      "Prototype Adept",
      "Metaprogrammer",
      "Memory Steward",
      "Concurrency Architect"
    ],
    "levels": [
      {
        "no": 1,
        "week": 1,
        "session": 1,
        "title": "Prototypal Inheritance & the Prototype Chain",
        "video_url": "https://www.youtube.com/results?search_query=javascript%20prototypal%20inheritance%20prototype%20chain",
        "topic": "Real-life analogy: Think of a hereditary royal lineage. If a young prince does not personally own a particular castle, the court checks his father the king, then the grandfather, on up the family tree to the founding monarch (Object.prototype).\n\nEvery JavaScript object holds an internal [[Prototype]] link (readable via Object.getPrototypeOf() or __proto__). When a property lookup misses on an object, the engine follows that link to the next object, and the next, until it either finds the property or reaches null.",
        "problems": [
          {
            "title": "Prototype Delegation Engine",
            "points": 30,
            "difficulty": "Basic",
            "description": "Create a base object with a greet() method, link a child object to it with Object.create(base), and call greet() on the child so the lookup is resolved by delegation up the chain - the court finding the castle one level up the family tree.\n\nInput: None\nExpected Output: [Delegation OK] Hello from Base Prototype",
            "criteria": [
              "The child is created with Object.create(base) (not by copying greet onto it), so greet() is found on the prototype, not the child itself",
              "Calling child.greet() prints exactly \"[Delegation OK] Hello from Base Prototype\""
            ],
            "hint": "const base = { greet() { console.log(\"[Delegation OK] Hello from Base Prototype\"); } }; const child = Object.create(base); child.greet();",
            "solution": "An Object.create(base) child whose greet() call is resolved by prototype delegation, printing the exact line."
          }
        ]
      },
      {
        "no": 2,
        "week": 1,
        "session": 2,
        "title": "Function Constructors vs ES6 Classes & #private Fields",
        "video_url": "https://www.youtube.com/results?search_query=javascript%20ES6%20classes%20private%20fields%20constructor",
        "topic": "Real-life analogy: Think of a high-security briefcase. Its outer pockets are open for anyone to inspect, but the inner vault (#private) is sealed behind a hardware lock that cannot be picked from outside.\n\nES6 class syntax is sugar over the prototype system. A field declared with a # prefix is a hard private field enforced by the engine itself: it is invisible to Object.keys, JSON.stringify and reflection, and touching it from outside the class is a syntax error.",
        "problems": [
          {
            "title": "Hard Encapsulated Wallet",
            "points": 30,
            "difficulty": "Basic",
            "description": "Create a Wallet class with a #balance private field, a deposit(amount) method and a getBalance() method. Deposit 500, print the balance through the getter, and also print the result of reading the field from outside as a plain property (which is undefined) - the vault stays sealed.\n\nSample Input: Deposit 500\nExpected Output: Balance: $500 | Private Access: undefined",
            "criteria": [
              "balance is declared as #balance and is only reachable through class methods - outside code reads wallet[\"balance\"] (or similar) and gets undefined",
              "For a deposit of 500 the program prints exactly \"Balance: $500 | Private Access: undefined\""
            ],
            "hint": "class Wallet { #balance = 0; deposit(a) { this.#balance += a; } getBalance() { return this.#balance; } } - reading w.balance from outside is undefined.",
            "solution": "A Wallet with a #balance field, printing \"Balance: $500 | Private Access: undefined\" after a deposit."
          }
        ]
      },
      {
        "no": 3,
        "week": 1,
        "session": 3,
        "title": "Property Descriptors (Object.defineProperty, freeze, seal)",
        "video_url": "https://www.youtube.com/results?search_query=javascript%20object%20defineProperty%20freeze%20seal",
        "topic": "Real-life analogy: Think of notarising a legal contract with tamper-evident wax seals: individual clauses can be marked read-only (writable: false) or non-removable (configurable: false), or the whole document can be locked shut (Object.freeze).\n\nEvery property has a descriptor - value, writable, enumerable, configurable. Object.seal() stops keys being added or removed but leaves values editable; Object.freeze() locks the whole object so existing values cannot change either.",
        "problems": [
          {
            "title": "Immutable Config Protector",
            "points": 40,
            "difficulty": "Core",
            "description": "Build a config object with a host of \"127.0.0.1\", freeze it with Object.freeze(), then attempt to reassign config.host and print the (unchanged) value to prove the freeze held - the contract sealed against tampering.\n\nInput: None\nExpected Output: Config Host: 127.0.0.1 (Immutable)",
            "criteria": [
              "The object is locked with Object.freeze() and the code then attempts to mutate config.host (the mutation must silently fail or throw, not be skipped)",
              "The program prints exactly \"Config Host: 127.0.0.1 (Immutable)\", showing the value never changed"
            ],
            "hint": "const config = Object.freeze({ host: \"127.0.0.1\" }); config.host = \"0.0.0.0\"; // no effect",
            "solution": "A frozen config whose host survives a reassignment attempt, printing \"Config Host: 127.0.0.1 (Immutable)\"."
          }
        ]
      },
      {
        "no": 4,
        "week": 2,
        "session": 1,
        "title": "Proxy Traps (get, set, deleteProperty)",
        "video_url": "https://www.youtube.com/results?search_query=javascript%20proxy%20object%20traps%20get%20set",
        "topic": "Real-life analogy: Think of a diplomatic security attache who intercepts, inspects and validates every package and courier before letting any of it through the embassy gate.\n\nA Proxy wraps a target object and intercepts fundamental operations through traps: get for reads, set for writes, deleteProperty for deletions, apply for calls. A trap can validate, transform, log or reject the operation before (or instead of) letting it reach the target.",
        "problems": [
          {
            "title": "Schema-Validating Proxy",
            "points": 40,
            "difficulty": "Core",
            "description": "Wrap a user object in a Proxy whose set trap throws a TypeError(\"Age must be a positive integer\") whenever age is assigned a non-number or a negative value. Attempt user.age = -5, catch the error, and print its message - the attache turning away an invalid courier at the gate.\n\nSample Input: user.age = -5\nExpected Output: TypeError: Age must be a positive integer",
            "criteria": [
              "The validation lives in the Proxy set trap (not in a setter method or the caller), and it throws a TypeError for a non-number or negative age",
              "Assigning -5 and printing the caught error yields exactly \"TypeError: Age must be a positive integer\""
            ],
            "hint": "new Proxy(user, { set(t, k, v) { if (k === \"age\" && (typeof v !== \"number\" || v < 0)) throw new TypeError(\"Age must be a positive integer\"); t[k] = v; return true; } })",
            "solution": "A Proxy set trap rejecting age = -5 with \"TypeError: Age must be a positive integer\"."
          }
        ]
      },
      {
        "no": 5,
        "week": 2,
        "session": 2,
        "title": "Reflect API & Transparent Forwarding",
        "video_url": "https://www.youtube.com/results?search_query=javascript%20reflect%20api",
        "topic": "Real-life analogy: Think of a universal remote-control protocol: whatever brand of television you point it at, the standard commands - power, volume, input - forward through cleanly without any vendor-specific quirks.\n\nThe Reflect API exposes the interceptable object operations as plain functions - Reflect.get, Reflect.set, Reflect.has, Reflect.deleteProperty - with predictable return values. Inside a Proxy trap, calling the matching Reflect method is the correct way to perform the default behaviour while preserving the receiver.",
        "problems": [
          {
            "title": "Reflect Property Forwarder",
            "points": 40,
            "difficulty": "Core",
            "description": "Given a plain object, use Reflect.set() to add a property and Reflect.has() to check it exists, and print both boolean results on one line - the standard commands forwarding through cleanly.\n\nInput: None\nExpected Output: Property Added: true | Key Exists: true",
            "criteria": [
              "The property is written with Reflect.set(obj, key, value) and the check uses Reflect.has(obj, key) - not obj[key] = ... and key in obj",
              "The program prints exactly \"Property Added: true | Key Exists: true\""
            ],
            "hint": "const added = Reflect.set(obj, \"role\", \"admin\"); const exists = Reflect.has(obj, \"role\");",
            "solution": "A Reflect.set() write and Reflect.has() check both returning true, printing \"Property Added: true | Key Exists: true\"."
          }
        ]
      },
      {
        "no": 6,
        "week": 2,
        "session": 3,
        "title": "Well-Known Symbols (Symbol.iterator, Symbol.toPrimitive)",
        "video_url": "https://www.youtube.com/results?search_query=javascript%20well%20known%20symbols%20iterator%20toPrimitive",
        "topic": "Real-life analogy: Think of the standard markings stencilled on a shipping container. The barcode (Symbol.iterator) tells any crane in any port how to unload it, without the crane needing to know what is inside.\n\nSymbol() creates a guaranteed-unique key. The well-known symbols - Symbol.iterator, Symbol.toPrimitive, Symbol.hasInstance - are hooks the engine already looks for, so defining them on your class overrides how for...of, coercion and instanceof behave for its instances.",
        "problems": [
          {
            "title": "Custom Iterable Range Object",
            "points": 40,
            "difficulty": "Core",
            "description": "Create a Range(start, end) object that defines [Symbol.iterator]() so it yields every integer from start to end inclusive. Consume Range(1, 4) with a for...of loop and print the values space-separated - the container marking that lets any crane unload it.\n\nSample Input: Range(1, 4)\nExpected Output: 1 2 3 4",
            "criteria": [
              "Range defines a [Symbol.iterator]() method (a generator or a manual iterator) - it is consumed directly by for...of, not by a .toArray() helper",
              "For Range(1, 4) the program prints exactly \"1 2 3 4\""
            ],
            "hint": "*[Symbol.iterator]() { for (let i = this.start; i <= this.end; i++) yield i; }",
            "solution": "A Range object with a [Symbol.iterator]() generator, printing \"1 2 3 4\" when looped with for...of."
          }
        ]
      },
      {
        "no": 7,
        "week": 3,
        "session": 1,
        "title": "Microtasks vs Macrotasks (queueMicrotask, MutationObserver)",
        "video_url": "https://www.youtube.com/results?search_query=javascript%20microtasks%20macrotasks%20event%20loop%20queueMicrotask",
        "topic": "Real-life analogy: Think of a bank teller. They call the next ticket from the lobby (a macrotask), but before calling another ticket they must first finish every piece of desk paperwork already in front of them (the microtasks).\n\nThe event loop runs one macrotask (a setTimeout / setInterval callback, an I/O event), then drains the entire microtask queue (Promise callbacks, queueMicrotask) before it will paint or take the next macrotask. So a promise callback always runs before a setTimeout(fn, 0) queued at the same time.",
        "problems": [
          {
            "title": "Event Loop Priority Ordering",
            "points": 40,
            "difficulty": "Core",
            "description": "In one script, log a synchronous line, schedule a queueMicrotask() that logs a microtask line, and schedule a setTimeout(..., 0) that logs a macrotask line. Print a single arrow-joined summary showing the real order they run in - the teller clearing the desk before calling the next ticket.\n\nInput: None\nExpected Output: Synchronous -> Microtask -> Macrotask",
            "criteria": [
              "The microtask line comes from queueMicrotask() (or Promise.resolve().then) and the macrotask line from setTimeout(..., 0) - the ordering is observed, not hard-coded",
              "The program prints exactly \"Synchronous -> Microtask -> Macrotask\""
            ],
            "hint": "Collect the three labels as each callback fires, then print order.join(\" -> \") from the last (setTimeout) callback.",
            "solution": "An observed run order of sync, then microtask, then macrotask, printed as \"Synchronous -> Microtask -> Macrotask\"."
          }
        ]
      },
      {
        "no": 8,
        "week": 3,
        "session": 2,
        "title": "WeakMap & WeakSet (Memory Leak Prevention)",
        "video_url": "https://www.youtube.com/results?search_query=javascript%20weakmap%20weakset%20memory%20leak",
        "topic": "Real-life analogy: Think of a coat-check tag. While you are in the building the tag ties your ticket to your coat; once you leave for good the tag is discarded on its own - it never keeps your coat hostage.\n\nA WeakMap keys entries by object, and holds those keys weakly: when nothing else references a key object, the entry is garbage-collected automatically. WeakMap/WeakSet are not enumerable and have no size - which is exactly what makes them safe for DOM node metadata and private caches.",
        "problems": [
          {
            "title": "WeakMap Metadata Store",
            "points": 40,
            "difficulty": "Core",
            "description": "Create a WeakMap, use an object as a key to store some private metadata, read it back to confirm the key works, and show that the WeakMap cannot be iterated (no keys(), no forEach, no size). Print the one-line status.\n\nInput: None\nExpected Output: WeakMap Key Valid: true | Iterability: Non-enumerable",
            "criteria": [
              "Metadata is stored and retrieved via wm.set(objKey, data) / wm.get(objKey), and the code confirms the WeakMap exposes no iteration (typeof wm.keys === \"undefined\" or equivalent)",
              "The program prints exactly \"WeakMap Key Valid: true | Iterability: Non-enumerable\""
            ],
            "hint": "const wm = new WeakMap(); wm.set(node, meta); const valid = wm.get(node) === meta; wm.keys is undefined.",
            "solution": "A WeakMap storing metadata under an object key, printing \"WeakMap Key Valid: true | Iterability: Non-enumerable\"."
          }
        ]
      },
      {
        "no": 9,
        "week": 3,
        "session": 3,
        "title": "FinalizationRegistry & Garbage Collection Mechanics",
        "video_url": "https://www.youtube.com/results?search_query=javascript%20finalizationregistry%20weakref%20garbage%20collection",
        "topic": "Real-life analogy: Think of leaving instructions with a will executor: \"when this particular antique safe is finally demolished by the city, file a notice in the municipal archive.\"\n\nA FinalizationRegistry lets you register a cleanup callback that may fire after an object has been reclaimed by the garbage collector, receiving a held token you chose. Paired with WeakRef, it is how you release external resources - file handles, sockets, native buffers - tied to a JavaScript object's lifetime.",
        "problems": [
          {
            "title": "Finalizer Registry Logger",
            "points": 40,
            "difficulty": "Core",
            "description": "Create a FinalizationRegistry with a cleanup callback, register an object with a held token, and print the confirmation that the hook is now in place - the instructions filed with the executor.\n\nSample Input: RegisterCleanupToken\nExpected Output: [Finalizer] Cleanup Hook Registered",
            "criteria": [
              "A FinalizationRegistry is constructed with a callback and registry.register(obj, token) is actually called (the cleanup is registered, not just described)",
              "After registering, the program prints exactly \"[Finalizer] Cleanup Hook Registered\""
            ],
            "hint": "const reg = new FinalizationRegistry(tok => console.log(`[GC] ${tok}`)); reg.register(resource, \"buffer#1\"); console.log(\"[Finalizer] Cleanup Hook Registered\");",
            "solution": "A FinalizationRegistry with a registered object and token, printing \"[Finalizer] Cleanup Hook Registered\"."
          }
        ]
      },
      {
        "no": 10,
        "week": 4,
        "session": 1,
        "title": "Promise Combinators (all, allSettled, race, any)",
        "video_url": "https://www.youtube.com/results?search_query=javascript%20promise%20all%20allSettled%20race%20any",
        "topic": "Real-life analogy: Think of an election news desk tracking four districts. Promise.all needs every district to report and fails if one collapses; Promise.any calls it the moment the first result lands; Promise.allSettled publishes the full audit of every district, wins and failures alike.\n\nPromise.all() is fail-fast parallel, Promise.allSettled() reports the outcome of every input regardless of rejections, Promise.race() settles as soon as the first input settles (fulfilled or rejected), and Promise.any() resolves with the first fulfilment.",
        "problems": [
          {
            "title": "Resilient allSettled Audit",
            "points": 40,
            "difficulty": "Core",
            "description": "Run three promises - two that resolve and one that rejects - through Promise.allSettled(). Count how many fulfilled and how many rejected from the results array, and print the summary - the news desk publishing the full audit whatever happened.\n\nInput: None\nExpected Output: Fulfilled: 2 | Rejected: 1",
            "criteria": [
              "Promise.allSettled() is used (not Promise.all, which would reject) and the counts come from inspecting each result's status field",
              "The program prints exactly \"Fulfilled: 2 | Rejected: 1\""
            ],
            "hint": "const results = await Promise.allSettled([p1, p2, p3]); count results.filter(r => r.status === \"fulfilled\").length.",
            "solution": "A Promise.allSettled() audit of 2 resolves and 1 reject, printing \"Fulfilled: 2 | Rejected: 1\"."
          }
        ]
      },
      {
        "no": 11,
        "week": 4,
        "session": 2,
        "title": "AbortController & Request Cancellation",
        "video_url": "https://www.youtube.com/results?search_query=javascript%20abortcontroller%20abortsignal%20fetch%20cancel",
        "topic": "Real-life analogy: Think of the \"Cancel Print\" button on a 500-page press: one press and the job stops mid-run, before it wastes any more paper.\n\nAn AbortController produces an AbortSignal you pass into fetch(), an event listener, or your own async work. Calling controller.abort() rejects the pending operation with an AbortError, which is how you stop stale requests when the user navigates away or types a new query.",
        "problems": [
          {
            "title": "Aborted Signal Handler",
            "points": 40,
            "difficulty": "Core",
            "description": "Start a simulated async operation wired to an AbortController's signal, call controller.abort() while it is still pending, catch the resulting AbortError, and print a clean cancellation line - the press stopping mid-run.\n\nSample Input: CancelRequest\nExpected Output: [CANCELED] AbortError: Operation Aborted Safely",
            "criteria": [
              "The async operation observes controller.signal and rejects when abort() is called, and the rejection is handled in a catch block (the error is not left unhandled)",
              "The program prints exactly \"[CANCELED] AbortError: Operation Aborted Safely\""
            ],
            "hint": "const c = new AbortController(); const p = task(c.signal); c.abort(); try { await p; } catch { console.log(\"[CANCELED] AbortError: Operation Aborted Safely\"); }",
            "solution": "An AbortController-cancelled task whose AbortError is caught, printing \"[CANCELED] AbortError: Operation Aborted Safely\"."
          }
        ]
      },
      {
        "no": 12,
        "week": 4,
        "session": 3,
        "title": "Async Generators & for-await-of",
        "video_url": "https://www.youtube.com/results?search_query=javascript%20async%20generators%20for%20await%20of",
        "topic": "Real-life analogy: Think of streaming a series instead of downloading the whole season first - each chunk arrives and plays as it lands, and you can stop watching at any point.\n\nAn async generator (async function*) yields values that are themselves awaited, so it can pause for I/O between items. It is consumed with for await (const item of stream), which pulls one item at a time and never buffers the whole sequence in memory.",
        "problems": [
          {
            "title": "Async Sequence Streamer",
            "points": 40,
            "difficulty": "Core",
            "description": "Write an async function* that yields 1, 2, 3 with a simulated await delay between each, and consume it with for await (const n of gen()), printing \"Stream Item: <n>\" per value - the episodes arriving and playing one at a time.\n\nSample Input: Stream 3 Numbers\nExpected Output:\nStream Item: 1\nStream Item: 2\nStream Item: 3",
            "criteria": [
              "The producer is an async function* using yield with an await between items, and it is consumed with a for await...of loop (not collected into an array first)",
              "The program prints exactly three lines: \"Stream Item: 1\", \"Stream Item: 2\", \"Stream Item: 3\""
            ],
            "hint": "async function* gen() { for (let i = 1; i <= 3; i++) { await delay(10); yield i; } } then for await (const n of gen()) ...",
            "solution": "An async generator streamed with for await...of, printing \"Stream Item: 1..3\" one line at a time."
          }
        ]
      },
      {
        "no": 13,
        "week": 5,
        "session": 1,
        "title": "Custom Event System (CustomEvent & EventTarget)",
        "video_url": "https://www.youtube.com/results?search_query=javascript%20customevent%20eventtarget%20dispatchevent",
        "topic": "Real-life analogy: Think of a stock-exchange bell. When the index hits a record the exchange rings it once (dispatches an event); every broker tuned to that signal reacts on their own, and the exchange never needs to know who is listening.\n\nEventTarget and CustomEvent give you publish/subscribe with no framework: addEventListener registers a handler, and dispatchEvent(new CustomEvent(name, { detail })) fires it with a payload, keeping the emitter and the listeners fully decoupled.",
        "problems": [
          {
            "title": "Decoupled Custom Event Notifier",
            "points": 40,
            "difficulty": "Core",
            "description": "Create an EventTarget, add a listener for \"userLogin\" that reads event.detail.username, then dispatch a CustomEvent(\"userLogin\", { detail: { username: \"Alex\" } }) and let the listener print the greeting - the bell rung once, the broker reacting.\n\nSample Input: User: \"Alex\"\nExpected Output: [EVENT RECEIVED] User Alex logged in",
            "criteria": [
              "The username travels in the CustomEvent detail payload and is read from event.detail inside the listener (not from a shared outer variable)",
              "Dispatching the event prints exactly \"[EVENT RECEIVED] User Alex logged in\""
            ],
            "hint": "bus.addEventListener(\"userLogin\", e => console.log(`[EVENT RECEIVED] User ${e.detail.username} logged in`)); bus.dispatchEvent(new CustomEvent(\"userLogin\", { detail: { username: \"Alex\" } }));",
            "solution": "An EventTarget listener reading a CustomEvent detail payload, printing \"[EVENT RECEIVED] User Alex logged in\"."
          }
        ]
      },
      {
        "no": 14,
        "week": 5,
        "session": 2,
        "title": "Multithreading with Web Workers (postMessage, onmessage)",
        "video_url": "https://www.youtube.com/results?search_query=javascript%20web%20workers%20postMessage%20onmessage",
        "topic": "Real-life analogy: Think of a restaurant manager hiring an accountant in an upstairs office. The manager keeps greeting guests at the door (the UI thread) while the accountant crunches the tax spreadsheets in the background (the worker thread).\n\nA Web Worker runs a script on its own thread, isolated from the main thread and the DOM. The two sides communicate only by structured-clone message passing - postMessage() to send, an onmessage handler to receive - so heavy computation never blocks rendering.",
        "problems": [
          {
            "title": "Background Message Worker Simulator",
            "points": 40,
            "difficulty": "Core",
            "description": "Simulate the worker round trip: the main side \"dispatches\" a payload with postMessage, the worker side receives it in onmessage, does the work, and posts a result back that the main side prints. Show the full exchange on one line.\n\nSample Input: ComputePayload\nExpected Output: [MAIN] Dispatched to Worker -> [WORKER] Response: Computation 100% OK",
            "criteria": [
              "The exchange goes through a postMessage / onmessage pair (a real Worker or a faithful stand-in with the same message-passing shape), not a direct function call",
              "The program prints exactly \"[MAIN] Dispatched to Worker -> [WORKER] Response: Computation 100% OK\""
            ],
            "hint": "worker.onmessage = e => console.log(`[MAIN] Dispatched to Worker -> [WORKER] Response: ${e.data}`); worker.postMessage(\"ComputePayload\");",
            "solution": "A postMessage/onmessage round trip printing \"[MAIN] Dispatched to Worker -> [WORKER] Response: Computation 100% OK\"."
          }
        ]
      },
      {
        "no": 15,
        "week": 5,
        "session": 3,
        "title": "SharedArrayBuffer & Atomics (Thread Synchronization)",
        "video_url": "https://www.youtube.com/results?search_query=javascript%20sharedarraybuffer%20atomics%20thread%20synchronization",
        "topic": "Real-life analogy: Think of one physical whiteboard in a shared room. Instead of photographing notes and emailing copies, every worker writes on the same board - and follows an atomic marker rule so two people never overwrite the same spot at once.\n\nA SharedArrayBuffer is real memory shared between the main thread and workers with no message-copy overhead. The Atomics object provides the safe operations on it - Atomics.add, Atomics.load, Atomics.wait, Atomics.notify - that make concurrent reads and writes race-free.",
        "problems": [
          {
            "title": "Atomic Counter Synchronizer",
            "points": 60,
            "difficulty": "Boss",
            "description": "Allocate a SharedArrayBuffer, wrap it in an Int32Array view, and increment slot 0 with Atomics.add() instead of the plain ++ operator, then read it back with Atomics.load() and print the race-free result - the capstone finale, every worker writing safely on the one shared whiteboard.\n\nInput: None\nExpected Output: Atomic Value: 1 (Race-Condition Free)",
            "criteria": [
              "The counter lives in an Int32Array backed by a SharedArrayBuffer, and it is incremented with Atomics.add(view, 0, 1) - not view[0]++",
              "Reading it back with Atomics.load prints exactly \"Atomic Value: 1 (Race-Condition Free)\""
            ],
            "hint": "const view = new Int32Array(new SharedArrayBuffer(4)); Atomics.add(view, 0, 1); console.log(`Atomic Value: ${Atomics.load(view, 0)} (Race-Condition Free)`);",
            "solution": "An Atomics.add() increment on a SharedArrayBuffer-backed Int32Array, printing \"Atomic Value: 1 (Race-Condition Free)\" - capstone complete."
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
