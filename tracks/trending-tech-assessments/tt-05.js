'use strict';
// TT-05 High Performance Backend Engineering with Go. The browser compiler
// builds a single main package with the standard library only (no go test,
// -race, -gcflags or third-party modules), so the coding tasks below are
// written for exactly that.
// Quiz rows: [question, options, index of the correct option, explanation].
module.exports = {
  quizzes: {
    'A5.1': [
      ['A method with a pointer receiver (func (u *User) Save())...', ['receives a copy of the struct', 'can modify the original struct', 'cannot be called on a variable', 'allocates every call'], 1, 'Pointer receivers share the caller\'s value.'],
      ['Escape analysis decides...', ['which goroutine runs first', 'whether a value can stay on the stack or must move to the heap', 'garbage collection frequency', 'import order'], 1, 'Values that outlive the function escape to the heap.'],
      ['Which flag prints the compiler\'s escape analysis decisions?', ['-race', '-gcflags=-m', '-v', '-ldflags=-s'], 1, 'go build -gcflags=-m explains what escapes and why.'],
      ['In benchmark output, allocs/op reports...', ['CPU cores used', 'heap allocations per operation', 'goroutines started', 'lines of code'], 1, 'b.ReportAllocs() or -benchmem shows it.'],
      ['Returning a pointer to a local variable in Go is...', ['a dangling-pointer bug', 'safe - the value escapes to the heap', 'a compile error', 'undefined behaviour'], 1, 'Go\'s escape analysis makes this safe.'],
    ],
    'A5.2': [
      ['How does a type implement an interface in Go?', ['With an implements keyword', 'Implicitly, by having all the interface\'s methods', 'By embedding the interface', 'Through registration'], 1, 'Satisfaction is structural and implicit.'],
      ['Why accept an interface in a processor function?', ['It runs faster', 'Any implementation (including a test mock) can be passed without changing the processor', 'Interfaces are required for structs', 'To avoid errors'], 1, 'This is the core of dependency injection in Go.'],
      ['"Accept interfaces, return structs" means...', ['functions take behaviour-defined parameters and return concrete types', 'never use structs', 'always return interfaces', 'avoid methods'], 0, 'Callers get concrete types; inputs stay flexible.'],
      ['Struct embedding gives...', ['inheritance with virtual methods', 'composition with promoted fields and methods', 'generics', 'reflection'], 1, 'Embedded methods are promoted to the outer type.'],
      ['A nil interface value vs an interface holding a nil pointer:', ['are always equal', 'differ - the second is non-nil because it has a type', 'cannot exist', 'both panic'], 1, 'An interface is nil only when type and value are nil.'],
    ],
    'A5.3': [
      ['defer f.Close() runs...', ['immediately', 'when the surrounding function returns', 'at program exit', 'when the GC runs'], 1, 'Deferred calls run in LIFO order on return.'],
      ['fmt.Errorf("read %s: %w", name, err) does what with err?', ['Discards it', 'Wraps it so errors.Is / errors.As can find it', 'Converts it to a string only', 'Panics'], 1, '%w preserves the wrapped error chain.'],
      ['errors.Is(err, fs.ErrNotExist) checks...', ['only the outermost error', 'every error in the wrapped chain for a match', 'the error message text', 'the stack trace'], 1, 'It unwraps repeatedly.'],
      ['A sentinel error is...', ['a panic', 'a package-level error value compared by identity, e.g. io.EOF', 'an error type with fields', 'a log message'], 1, 'Callers compare with errors.Is.'],
      ['Good wrapping context at each layer names...', ['nothing', 'the operation and the subject, e.g. "parse config.yaml"', 'the developer', 'the Go version'], 1, 'The final message reads like a breadcrumb trail.'],
    ],
    'A5.4': [
      ['What does `go f()` do?', ['Calls f and waits', 'Starts f in a new goroutine and continues immediately', 'Compiles f', 'Defers f'], 1, 'Goroutines run concurrently.'],
      ['A buffered channel make(chan int, 50)...', ['blocks every send', 'lets up to 50 sends proceed without a waiting receiver', 'is unlimited', 'cannot be closed'], 1, 'Sends block only when the buffer is full.'],
      ['Ranging over a channel ends when...', ['it is empty', 'it is closed and drained', 'a timeout passes', 'never'], 1, 'Close the jobs channel so workers exit their loops.'],
      ['Which tool waits for a group of goroutines to finish?', ['time.Sleep', 'sync.WaitGroup', 'runtime.GC', 'os.Exit'], 1, 'Add/Done/Wait coordinate completion.'],
      ['A goroutine leak is...', ['a memory corruption', 'a goroutine blocked forever that never exits', 'a compile error', 'a closed channel'], 1, 'Leaked goroutines hold memory indefinitely.'],
    ],
    'A5.5': [
      ['`select` lets a goroutine...', ['choose a random function', 'wait on several channel operations and proceed with whichever is ready first', 'sort channels', 'close channels'], 1, 'It multiplexes channel operations.'],
      ['time.After(200 * time.Millisecond) returns...', ['an error', 'a channel that receives once after the duration', 'a timer that panics', 'a context'], 1, 'Useful as a timeout case in select.'],
      ['context.WithTimeout gives...', ['a faster CPU', 'a context whose Done channel closes when the deadline passes', 'a retry policy', 'a logger'], 1, 'Pass it down so work can stop.'],
      ['To avoid leaking the abandoned upstream goroutine, its result channel should be...', ['unbuffered', 'buffered with capacity 1 (or the goroutine must watch ctx.Done)', 'closed by the caller first', 'nil'], 1, 'Otherwise its send blocks forever after the caller leaves.'],
      ['Why always call the cancel function returned by WithTimeout?', ['It is optional style', 'It releases the context\'s resources promptly', 'It restarts the timer', 'It panics otherwise'], 1, 'defer cancel() prevents context leaks.'],
    ],
    'A5.6': [
      ['sync.RWMutex allows...', ['one reader at a time', 'many concurrent readers or one exclusive writer', 'unlimited writers', 'no locking'], 1, 'RLock for reads, Lock for writes.'],
      ['A data race occurs when...', ['two goroutines read the same variable', 'goroutines access the same memory concurrently and at least one writes, without synchronisation', 'a channel is closed', 'a mutex is used'], 1, 'Races give undefined, intermittent results.'],
      ['Which command reports data races?', ['go vet', 'go test -race (or go run -race)', 'go fmt', 'go mod tidy'], 1, 'The race detector instruments memory accesses.'],
      ['Cancelling a parent context...', ['affects only the parent', 'also cancels every context derived from it', 'restarts children', 'does nothing'], 1, 'Cancellation propagates down the tree.'],
      ['Why should a cache method check ctx.Err() or ctx.Done()?', ['For logging', 'To stop work promptly when the caller has given up', 'Contexts store cache values', 'To speed up locks'], 1, 'Honouring cancellation avoids wasted work.'],
    ],
    'A5.7': [
      ['In net/http, a handler implements...', ['Run()', 'ServeHTTP(w http.ResponseWriter, r *http.Request)', 'Handle(string)', 'Main()'], 1, 'http.HandlerFunc adapts ordinary functions.'],
      ['Which status should a POST with malformed JSON return?', ['200', '400', '404', '500'], 1, '400 Bad Request: the client sent invalid input.'],
      ['Middleware in Go is typically a function of the form...', ['func(http.Handler) http.Handler', 'func() error', 'func(string) int', 'func(chan int)'], 0, 'It wraps a handler with extra behaviour.'],
      ['Recovery middleware uses which built-in to catch a panic?', ['catch', 'recover() inside a deferred function', 'try', 'errors.Is'], 1, 'recover only works in a deferred call.'],
      ['net/http/httptest.NewRecorder lets you...', ['load test a server', 'call a handler in-process and inspect the response without a network', 'mock DNS', 'record videos'], 1, 'Ideal for handler tests.'],
    ],
    'A5.8': [
      ['A connection pool...', ['opens a new connection per query', 'reuses a bounded set of open connections across requests', 'caches query results', 'encrypts queries'], 1, 'Opening connections is expensive; pools amortise it.'],
      ['If MaxConns is too small under load, requests...', ['run faster', 'wait to acquire a connection, adding latency or timing out', 'skip the database', 'use more memory'], 1, 'Acquisition wait time reveals pool pressure.'],
      ['Parameterised queries ($1, $2) protect against...', ['slow queries', 'SQL injection', 'deadlocks', 'pool exhaustion'], 1, 'Values never become part of the SQL text.'],
      ['Why release (or close rows from) every pooled query promptly?', ['Style only', 'Unreleased connections are not returned to the pool, eventually exhausting it', 'It frees CPU', 'It is automatic'], 1, 'Leaked connections starve later requests.'],
      ['k6 is a tool for...', ['unit testing', 'load testing HTTP services with scripted virtual users', 'database migrations', 'code formatting'], 1, 'It reports latency percentiles and error rates.'],
    ],
    'A5.9': [
      ['sqlc generates...', ['SQL from Go structs', 'type-safe Go code from SQL queries', 'database schemas from JSON', 'migrations'], 1, 'You write SQL; sqlc writes the Go.'],
      ['A transfer debits one account and credits another. Without a transaction, a crash between them...', ['is harmless', 'loses or creates money', 'is automatically retried', 'is impossible'], 1, 'The two writes must be atomic.'],
      ['Ten concurrent transfers on the same account keep totals correct when...', ['you add time.Sleep', 'rows are locked (e.g. SELECT ... FOR UPDATE) or the isolation level prevents lost updates', 'you use more goroutines', 'you remove the transaction'], 1, 'Locking serialises conflicting updates.'],
      ['A common way to avoid deadlocks when locking two accounts is to...', ['lock in random order', 'always lock rows in a consistent order, e.g. by id', 'never commit', 'use two connections'], 1, 'Consistent ordering removes cycles.'],
      ['If any step of a transaction fails you should...', ['commit anyway', 'roll back', 'ignore it', 'restart the database'], 1, 'Rollback restores the previous consistent state.'],
    ],
    'A5.10': [
      ['Protocol Buffers are...', ['a JSON dialect', 'a compact, schema-defined binary serialisation format', 'a database', 'an HTTP verb'], 1, '.proto files define messages and services.'],
      ['gRPC runs over...', ['FTP', 'HTTP/2', 'SMTP', 'raw UDP only'], 1, 'HTTP/2 enables multiplexed streams.'],
      ['A deadline that expires produces which gRPC status?', ['NOT_FOUND', 'DEADLINE_EXCEEDED', 'OK', 'UNAUTHENTICATED'], 1, 'The call is cancelled with that code.'],
      ['Adding a new field with a new field number to a message...', ['breaks old clients', 'stays backward compatible - old clients ignore it', 'requires a new service', 'is not allowed'], 1, 'Never reuse or renumber existing fields.'],
      ['Why set a deadline on every client call?', ['To make calls slower', 'So a slow server cannot hold client resources forever', 'Deadlines are mandatory syntax', 'For logging'], 1, 'Unbounded calls pile up under failure.'],
    ],
    'A5.11': [
      ['Cache-aside means the application...', ['writes only to the cache', 'reads the cache first, and on a miss loads from the database and fills the cache', 'lets the database fill the cache', 'never expires keys'], 1, 'The app manages the cache explicitly.'],
      ['Why delete (invalidate) the cache key on update?', ['To save memory only', 'So the next read does not serve stale data', 'Redis requires it', 'To trigger a backup'], 1, 'Invalidation keeps cache and database consistent.'],
      ['A TTL of 60 seconds means...', ['the key lives forever', 'the key expires automatically after 60 seconds', 'reads take 60 ms', 'only 60 keys fit'], 1, 'TTL bounds staleness.'],
      ['A cache stampede happens when...', ['the cache is full', 'many requests miss the same cold key at once and all hit the database', 'Redis restarts', 'keys are too long'], 1, 'Single-flight coalescing lets one request load it.'],
      ['Go\'s golang.org/x/sync/singleflight helps by...', ['retrying failed calls', 'collapsing concurrent calls for the same key into one execution', 'encrypting values', 'sharding Redis'], 1, 'All waiters share the single result.'],
    ],
    'A5.12': [
      ['Graceful shutdown means the server...', ['exits instantly on SIGTERM', 'stops accepting new requests, finishes in-flight ones, then closes resources', 'restarts', 'ignores signals'], 1, 'http.Server.Shutdown drains connections.'],
      ['Which signal do orchestrators like Kubernetes send first to stop a container?', ['SIGKILL', 'SIGTERM', 'SIGHUP', 'SIGSTOP'], 1, 'SIGKILL follows only after the grace period.'],
      ['Structured logging writes logs as...', ['free text only', 'key-value records (e.g. JSON) that machines can query', 'images', 'binary dumps'], 1, 'Go\'s log/slog provides this.'],
      ['p99 latency is...', ['the average', 'the latency 99% of requests are faster than', 'the fastest request', 'the median'], 1, 'Tail latency captures the slow outliers.'],
      ['When comparing before/after an optimisation, you should...', ['change the load test too', 'run the same load test and compare p99 and error rate', 'compare only averages', 'test only once on a laptop with other apps'], 1, 'Same workload, same metrics, for a fair comparison.'],
    ],
  },
  tasks: {
    'A5.1': { language: 'go', title: 'Value vs pointer receivers, benchmarked', description: 'Define the same domain struct (e.g. an Order with several fields) twice: one type with value-receiver methods and one with pointer-receiver methods. In main, use testing.Benchmark with b.ReportAllocs() to benchmark an operation on each, and print ns/op and allocs/op for both. Add a comment explaining which version allocates and why (escape analysis).', criteria: ['Two implementations differ only in receiver kind.', 'testing.Benchmark results for both are printed with ns/op and allocs/op.', 'A comment explains the allocation difference in terms of escape analysis.', 'The program builds and runs in the compiler.'], hint: 'Call testing.Benchmark(func(b *testing.B) { b.ReportAllocs(); for i := 0; i < b.N; i++ { ... } }) from main.' },
    'A5.2': { language: 'go', title: 'PaymentGateway interface with a mock', description: 'Define a PaymentGateway interface (Charge(amountCents int64) (string, error)). Implement it with StripeGateway and PayPalGateway structs (simulated, no network) and write one Processor that accepts the interface. In main, run the processor with both real implementations and with a MockGateway that records calls and can be told to fail.', criteria: ['Processor depends only on the interface, with no type switch.', 'Both implementations and the mock satisfy the interface.', 'The mock is injected with no change to Processor.', 'A simulated failure from the mock is handled and printed.'], hint: 'Add var _ PaymentGateway = (*MockGateway)(nil) to assert the interface at compile time.' },
    'A5.3': { language: 'go', title: 'File processing with defer and error wrapping', description: 'Write processFile(path string) error that opens a file, defers Close, reads it and wraps any failure with context at two layers (e.g. "load report: read data.csv: ..."). Trigger a failure by opening a path that does not exist, then show that errors.Is(err, fs.ErrNotExist) is true through both layers. Also process a file you create first with os.WriteFile in a temp directory.', criteria: ['The file is closed via defer on every path.', 'Errors are wrapped with %w at two layers naming the file and operation.', 'errors.Is matches fs.ErrNotExist through both layers.', 'The successful case processes a file created with os.WriteFile.'], hint: 'Use os.MkdirTemp("", "demo") for a writable directory.' },
    'A5.4': { language: 'go', title: 'Worker pool with leak check', description: 'Build a pool of five worker goroutines that process fifty jobs from a buffered jobs channel and send results on a second channel. Collect all fifty results, then assert that runtime.NumGoroutine() is back to its starting value (allow a short sleep for exit).', criteria: ['Exactly five workers process all fifty jobs.', 'All fifty results are collected with no deadlock.', 'The jobs channel is closed so workers exit.', 'A goroutine count check at the end shows no leaked workers.'], hint: 'Close results only after a WaitGroup confirms every worker has finished.' },
    'A5.5': { language: 'go', title: 'Upstream timeout with select', description: 'Write callWithTimeout(ctx, upstream func() int) (int, error) that returns the upstream result or a timeout error after 200 ms. Simulate a 300 ms upstream and a 50 ms upstream; print the measured elapsed time for each. Show that the abandoned goroutine finishes (does not block forever) by checking runtime.NumGoroutine after a short wait.', criteria: ['The 300 ms upstream returns a timeout error in roughly 200 ms.', 'The 50 ms upstream returns its value.', 'The abandoned goroutine terminates (buffered channel or ctx-aware send).', 'Elapsed times are printed.'], hint: 'Use context.WithTimeout and a result channel of capacity 1.' },
    'A5.6': { language: 'go', title: 'Thread-safe cache honouring context cancellation', description: 'Implement a Cache with Get/Set guarded by sync.RWMutex, where Get and Set take a context and return ctx.Err() if it is cancelled. Run 100 concurrent goroutines mixing reads and writes, verify the final contents are consistent, then start long-running work loops and show that cancelling the parent context stops all of them within one second.', criteria: ['Reads use RLock and writes use Lock.', '100 concurrent operations complete with consistent final values.', 'Operations return an error once the context is cancelled.', 'All workers stop within one second of cancellation (time it).'], hint: 'Workers can loop with select { case <-ctx.Done(): return; default: ... }.' },
    'A5.7': { language: 'go', title: 'REST API with net/http and recovery middleware', description: 'Using only the standard library (Go 1.22 http.ServeMux patterns like "GET /users/{id}"), build create, read, update and list endpoints over an in-memory user store with validation. Add recovery middleware that catches a panic, logs it with a request id and returns 500. In main, exercise every endpoint with httptest.NewRecorder and print the status codes: 201/200, 400 for malformed JSON, 404 for a missing id, and 500 for a route that panics.', criteria: ['Create, read, update and list endpoints return correct status codes.', 'Malformed JSON returns 400 and a missing record returns 404.', 'A panic is recovered, logged with a request id, and returns 500 without crashing.', 'All requests are exercised in-process with httptest and the codes are printed.'], hint: 'r.PathValue("id") reads path parameters with the Go 1.22 mux.' },
  },
};
