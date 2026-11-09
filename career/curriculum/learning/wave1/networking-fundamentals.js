'use strict';
const {build,pythonRef}=require('./infra-helper');
const data=[
  {
    "comp": "m1.c1",
    "title": "Separate link, IP and application responsibilities",
    "intro": "A retail client can reach its local switch but still cannot load the inventory API. Network layers describe different responsibilities: one successful link check is not evidence that naming, routing, transport and application behavior all work.",
    "headings": [
      "Understand the boundary",
      "Apply it to an operating decision",
      "Check the model and its limits"
    ],
    "sections": [
      [
        "A link connects neighboring interfaces on a local network; IP addressing and routing move packets between networks. A transport such as TCP or UDP provides communication behavior for endpoints, while an application protocol such as HTTP defines request/response meaning. Layer models are useful abstractions, not guarantees that every real feature fits only one box.",
        "An IP address identifies an interface or endpoint context within a network scheme; a DNS name is a naming abstraction that may resolve to several addresses and change over time. A MAC address is associated with link-layer operation and is not a universal routed identity or a substitute for application authentication."
      ],
      [
        "Troubleshooting should ask which boundary a test actually observes. A successful local link does not verify a remote route, a successful TCP connection does not verify a valid HTTP response, and an HTTP response does not prove permission to a particular customer record. Avoid interpreting one layer’s evidence as complete service health.",
        "The fixture represents a dependency chain as named test outcomes. It identifies the first failed layer while preserving earlier successful observations. It does not inspect packets, configure interfaces or conduct any network probe; actual paths can have more complex dependencies and partial failures."
      ]
    ],
    "code": "checks = [(\"link\", True), (\"ip_route\", True), (\"tcp_connect\", False), (\"http\", False)]\nprint(next(name for name, ok in checks if not ok))\nprint([name for name, ok in checks if ok])",
    "expect": "tcp_connect\n['link', 'ip_route']",
    "problem": "Locate the first failed boundary in supplied network-check evidence.",
    "steps": [
      "Read checks in the declared dependency order.",
      "Select the first false outcome.",
      "Retain the earlier passed observations without inferring application success."
    ],
    "limit": "The sequence is synthetic evidence, not a live packet trace or proof of a particular real routing topology.",
    "mistakes": [
      "Claiming that a local link proves the remote application works.",
      "Using an IP or MAC address as universal user authentication."
    ],
    "takeaways": [
      "State which layer each check observes.",
      "Separate network reachability from application authorization."
    ],
    "practice": [
      [
        "Which responsibility belongs to IP routing?",
        "Moving between networks",
        "Rendering every web page",
        "Verifying every customer role",
        "Choosing a CSS layout",
        "IP routing supports packet delivery between networks rather than application semantics."
      ],
      [
        "What does a local link commonly connect?",
        "Neighboring interfaces",
        "Every global DNS record",
        "All application accounts",
        "Every cloud billing tag",
        "Link-layer connectivity concerns adjacent interfaces under the local network technology."
      ],
      [
        "What does HTTP describe?",
        "Application message semantics",
        "Only physical cable color",
        "Every kernel scheduling choice",
        "The sole possible transport",
        "HTTP defines application-level request and response meaning rather than all lower-layer mechanics."
      ],
      [
        "Why can a DNS name differ from an IP address?",
        "Names can map to changing addresses",
        "Names always encrypt packets",
        "An IP address is an application password",
        "Names guarantee one fixed machine forever",
        "Naming and addressing are separate abstractions, and mappings can change or contain multiple addresses."
      ],
      [
        "What does the synthetic check sequence identify?",
        "The first failed boundary",
        "The live router vendor",
        "Every packet’s content",
        "The user’s actual permission",
        "The fixture selects a supplied failed outcome without performing a network operation."
      ],
      [
        "Does TCP connection success prove an HTTP operation works?",
        "No, it is narrower evidence",
        "Yes for every status code",
        "Yes if the port is numeric",
        "Yes if the host has a name",
        "Transport establishment does not establish application semantics or correct service behavior."
      ],
      [
        "Why distinguish an address from authentication?",
        "Location is not authority",
        "All addresses are passwords",
        "MAC labels prove customer ownership",
        "Routing replaces all session checks",
        "Endpoint addressing does not grant the business permission associated with an authenticated user."
      ],
      [
        "What should a layered diagnosis retain?",
        "Each check’s actual scope",
        "Only the most reassuring result",
        "Every unverified assumption",
        "Only the host’s nickname",
        "Useful evidence records what each check observed without expanding its conclusion beyond that scope."
      ]
    ],
    "final": [
      [
        "Which abstraction forwards packets across network boundaries?",
        "IP routing",
        "A browser layout engine",
        "A user-role editor",
        "An application serializer",
        "Routing handles network-layer delivery rather than presentation or business permissions."
      ],
      [
        "What is a DNS name distinct from?",
        "A particular IP address",
        "A naming label by definition",
        "A text identifier by definition",
        "A possible service label",
        "A name can resolve to multiple or changing addresses and need not identify one permanent address."
      ],
      [
        "What does the fixture’s first false item represent?",
        "Its modeled failed boundary",
        "A captured real SYN packet",
        "A live firewall configuration",
        "The true root cause by itself",
        "The list reports supplied test evidence and does not capture or diagnose a real network."
      ],
      [
        "A retail terminal can reach its switch but not a remote API. Which conclusion is justified?",
        "The local link is not the full path",
        "The remote application is healthy",
        "Customer authorization is correct",
        "DNS must be working perfectly",
        "Local connectivity is a limited observation and does not establish all later network or application steps."
      ],
      [
        "A TCP connection succeeds while the API returns an error. Which distinction matters?",
        "Transport and application differ",
        "TCP guarantees every HTTP result",
        "The response cannot be real",
        "All application failures are cable faults",
        "Connection establishment and successful application processing are different behaviors."
      ],
      [
        "A gateway sees a source address matching an office subnet. Does that alone prove an employee’s role?",
        "No, identity needs its own evidence",
        "Yes, subnets grant every business role",
        "Yes, routing authenticates users",
        "Yes, IP syntax contains permissions",
        "Network location can be policy context but is not universal proof of authenticated user authority."
      ],
      [
        "A name resolves to two addresses. What should the client design recognize?",
        "A name can have multiple targets",
        "DNS has necessarily been corrupted",
        "Both addresses are one password",
        "The browser must disable TLS",
        "Multiple address records are compatible with the separation of naming and endpoint addressing."
      ],
      [
        "A diagnosis reports only ping success. What remains unverified for a purchase request?",
        "The application operation",
        "That one echo exchange succeeded",
        "That some network path responded",
        "That the target had an address",
        "A narrow reachability test does not validate the application’s transaction or permission semantics."
      ],
      [
        "An engineer labels every failure network down without recording tested layers. What would improve the report?",
        "Bounded observations per check",
        "A more dramatic incident title",
        "A longer hostname",
        "A different chart background",
        "Layer-specific evidence narrows hypotheses and avoids claiming more than the checks establish."
      ],
      [
        "A training model prints tcp_connect as failed. Can it establish the production firewall is responsible?",
        "No, causes remain untested",
        "Yes, every TCP failure is a firewall",
        "Yes, dictionaries capture packets",
        "Yes, the name identifies the device",
        "A supplied outcome is not evidence isolating a real firewall, route, server or client cause."
      ]
    ]
  },
  {
    "comp": "m1.c1",
    "title": "Calculate CIDR membership and route scope",
    "intro": "A SaaS office is assigned an IPv4 subnet. An engineer must determine whether a target address belongs to that prefix and which route is more specific. CIDR is a prefix notation, not a count of trusted users.",
    "headings": [
      "Understand the boundary",
      "Apply it to an operating decision",
      "Check the model and its limits"
    ],
    "sections": [
      [
        "CIDR writes an address with a prefix length. In IPv4, /24 fixes the first 24 of 32 bits, leaving eight address bits within that prefix. A subnet’s network address is obtained by masking the host bits. The address count is a mathematical property; usable host conventions depend on context, including special small prefixes.",
        "IPv6 uses 128-bit addresses and a different allocation/operational model. Do not apply IPv4 broadcast assumptions to IPv6. An address being inside a private prefix does not automatically establish privacy, reachability, encryption or authorization."
      ],
      [
        "Routers commonly choose the longest matching destination prefix among eligible routes before other applicable selection details. A /24 can therefore be more specific than a covering /16. An overlapping prefix is not necessarily an error, but conflicting design assumptions about ownership or return routes can create failures.",
        "The fixture uses Python ipaddress for exact membership and address counts. All addresses are documentation/private examples. It does not install routes, enumerate a real subnet or send packets, and its arithmetic does not certify the organization’s deployed network plan."
      ]
    ],
    "code": "import ipaddress\nnet = ipaddress.ip_network(\"192.0.2.0/24\")\nprint(net.num_addresses)\nprint(ipaddress.ip_address(\"192.0.2.42\") in net)\nprint(ipaddress.ip_address(\"192.0.3.42\") in net)",
    "expect": "256\nTrue\nFalse",
    "problem": "Check two documentation addresses against one explicit IPv4 prefix.",
    "steps": [
      "Parse a strict network prefix.",
      "Read its mathematical address count.",
      "Evaluate membership without sending traffic."
    ],
    "limit": "Address arithmetic verifies only the supplied prefix facts; it does not establish host availability, trust or actual route selection.",
    "mistakes": [
      "Treating subnet membership as user authorization.",
      "Assuming every IPv4 prefix has the same usable-host conventions."
    ],
    "takeaways": [
      "Separate prefix arithmetic from deployed reachability.",
      "Use the most specific applicable route under actual routing policy."
    ],
    "practice": [
      [
        "What does IPv4 /24 fix?",
        "Twenty-four prefix bits",
        "Twenty-four trusted users",
        "Twenty-four total addresses",
        "Twenty-four encrypted packets",
        "The slash length counts network-prefix bits rather than users or traffic."
      ],
      [
        "How many addresses are in an IPv4 /24 mathematically?",
        "256",
        "24",
        "254 under every convention",
        "128",
        "Eight remaining bits produce 256 address combinations; usable-host conventions are a separate issue."
      ],
      [
        "What makes /24 more specific than covering /16?",
        "Its longer matching prefix",
        "Its larger address count",
        "Its shorter text label",
        "Its automatic authentication",
        "More fixed prefix bits describe a smaller destination set when the prefixes cover the same address."
      ],
      [
        "What does subnet membership not prove?",
        "Host reachability",
        "The result of the mathematical test",
        "A matching bit prefix",
        "That the address is in the supplied set",
        "An address can lie within a prefix even if no host or valid deployed route exists for it."
      ],
      [
        "How many bits are in an IPv6 address?",
        "128",
        "32",
        "24",
        "64 for every address",
        "IPv6 uses 128-bit addresses, while common subnet conventions do not change the full address width."
      ],
      [
        "What creates the IPv4 network address?",
        "Masking host bits",
        "Encrypting the hostname",
        "Sorting user accounts",
        "Adding the service port",
        "Applying the prefix mask separates the network portion from the variable host bits."
      ],
      [
        "Does a private address automatically encrypt traffic?",
        "No",
        "Yes on every router",
        "Only if it ends in zero",
        "Only when the port is small",
        "Private addressing is an allocation/routing context and does not itself supply transport encryption."
      ],
      [
        "What does ipaddress membership avoid here?",
        "Sending network probes",
        "All arithmetic checks",
        "Reading the supplied prefix",
        "Constructing address objects",
        "The example performs local address calculations without contacting the named addresses."
      ]
    ],
    "final": [
      [
        "Which notation expresses a network prefix length?",
        "CIDR slash notation",
        "An application role name",
        "A TLS session cookie",
        "An executable suffix",
        "CIDR combines an address with the number of fixed network-prefix bits."
      ],
      [
        "What is the mathematical IPv4 /24 address count?",
        "256 addresses",
        "24 addresses",
        "32 addresses",
        "128 addresses",
        "A 32-bit address with 24 fixed bits leaves eight variable bits and therefore 256 combinations."
      ],
      [
        "Which matching route is more specific, /16 or /24?",
        "The /24 route",
        "The /16 route by definition",
        "The lexically shorter route",
        "The first route with a friendly name",
        "Longest-prefix matching favors the more specific matching destination prefix among eligible routes."
      ],
      [
        "A target is inside the office prefix but does not respond. What did membership establish?",
        "Only address-set inclusion",
        "A working host",
        "A permitted application action",
        "An encrypted connection",
        "A mathematical inclusion result is not evidence that a live target or usable path exists."
      ],
      [
        "A SaaS operator treats every private-subnet request as an administrator. Which boundary is missing?",
        "Actual identity and authority",
        "Only a longer prefix",
        "Only an IPv6 conversion",
        "A different address separator",
        "Network location does not establish the authenticated role or business permission required for an action."
      ],
      [
        "A reviewer subtracts two addresses for every possible IPv4 prefix without checking context. What is wrong?",
        "Usability conventions vary",
        "Every prefix has infinite addresses",
        "All prefixes contain one host",
        "CIDR forbids small prefixes",
        "Special cases and operational context mean a universal usable-host subtraction rule is not valid."
      ],
      [
        "An engineer applies an IPv4 broadcast assumption to IPv6. What should be corrected?",
        "The protocol-specific model",
        "Only the address capitalization",
        "Only the log filename",
        "The application’s display theme",
        "IPv6 behavior and addressing conventions must be understood on their own rather than copied from IPv4."
      ],
      [
        "Two configured routes overlap intentionally. What should be understood?",
        "Selection and return-path policy",
        "Overlap always proves corruption",
        "Names determine the selected route",
        "The longer prefix grants user identity",
        "Overlaps need deliberate routing and ownership reasoning, including the path used for responses."
      ],
      [
        "A spreadsheet says a subnet is isolated because its address is private. What further evidence is needed?",
        "Actual routing and access policy",
        "Only the prefix string length",
        "Only a server’s nickname",
        "The number of rows in the sheet",
        "Private addressing alone does not establish segmentation, permitted paths or exposure boundaries."
      ],
      [
        "A prefix calculation succeeds locally. Can it certify the cloud route table matches the plan?",
        "No, deployment evidence is separate",
        "Yes, Python updates route tables",
        "Yes, address math enforces IAM",
        "Yes, every region shares one route",
        "The arithmetic example neither reads nor changes any deployed routing configuration."
      ]
    ]
  },
  {
    "comp": "m1.c2",
    "title": "Choose TCP and UDP from required delivery semantics",
    "intro": "A university sends lecture video and payment confirmations over networks. The application must choose transport behavior from its requirements, not from the slogan that one protocol is always fast and the other always safe.",
    "headings": [
      "Understand the boundary",
      "Apply it to an operating decision",
      "Check the model and its limits"
    ],
    "sections": [
      [
        "TCP supplies a reliable ordered byte stream between endpoints, with connection state, acknowledgements and congestion control. A byte stream has no inherent application-message boundaries, so a receiver must parse its own framing. A successful send call does not mean the remote business operation committed.",
        "UDP supplies datagrams without TCP’s built-in retransmission, ordering or stream guarantee. Applications can add mechanisms above UDP; protocols such as QUIC use UDP while defining substantial additional behavior. The transport name alone therefore does not describe every application-level reliability property."
      ],
      [
        "Choose by latency, loss handling, ordering, congestion behavior and application semantics. A real-time stream may prefer timely newer data over late retransmission, while an order operation needs a defined acknowledgement and idempotency policy regardless of transport. Encryption is separate: raw TCP is not automatically TLS, and UDP is not inherently encrypted.",
        "The fixture shows application framing over a byte stream by buffering two chunks until a newline delimiter is available. It does not open sockets or implement TCP. It demonstrates why a receive chunk cannot be assumed to equal exactly one business message."
      ]
    ],
    "code": "buffer = \"\"\nmessages = []\nfor chunk in [\"order=1\\nord\", \"er=2\\n\"]:\n    buffer += chunk\n    while \"\\n\" in buffer:\n        message, buffer = buffer.split(\"\\n\", 1)\n        messages.append(message)\nprint(messages)\nprint(buffer == \"\")",
    "expect": "['order=1', 'order=2']\nTrue",
    "problem": "Reassemble two delimiter-framed messages from arbitrary stream chunks.",
    "steps": [
      "Append each supplied chunk to a retained buffer.",
      "Extract complete delimiter-terminated messages.",
      "Leave any incomplete tail for later input."
    ],
    "limit": "This string model illustrates framing only; it is not socket code, congestion control, secure parsing or a complete bounded-buffer protocol.",
    "mistakes": [
      "Assuming one TCP receive always equals one application message.",
      "Equating transport acknowledgement with business transaction completion."
    ],
    "takeaways": [
      "Specify application framing and acknowledgement semantics.",
      "Treat transport, encryption and business reliability as distinct decisions."
    ],
    "practice": [
      [
        "What does TCP expose to an application?",
        "An ordered byte stream",
        "A guaranteed one-message-per-read API",
        "Automatic customer authorization",
        "A completed purchase certificate",
        "TCP stream semantics do not define the application’s message boundaries or business result."
      ],
      [
        "What does UDP preserve conceptually?",
        "Datagram boundaries",
        "A TCP ordered byte stream",
        "Automatic reliable retries",
        "A universal encrypted session",
        "UDP communicates datagrams without providing TCP’s built-in reliable stream behavior."
      ],
      [
        "What must a stream application define?",
        "Message framing",
        "Only the desktop theme",
        "Only the user’s nickname",
        "A mandatory one-byte request",
        "The receiver needs a way to identify complete messages within arbitrary stream chunks."
      ],
      [
        "What does a successful send fail to prove?",
        "Remote business commit",
        "That a local API accepted data",
        "That the call returned success",
        "The current function’s result",
        "Transport or local buffer acceptance is not an application transaction acknowledgement."
      ],
      [
        "Does raw TCP automatically supply encryption?",
        "No",
        "Always",
        "Only on even port numbers",
        "Only with long payloads",
        "Encryption requires an appropriate secure protocol such as TLS rather than TCP alone."
      ],
      [
        "Why might a real-time stream handle loss differently?",
        "Late data may be less useful",
        "Loss always grants identity",
        "All packets have equal deadlines",
        "UDP forbids application recovery",
        "An application can prioritize timely content over delayed retransmission according to its semantics."
      ],
      [
        "What does the fixture retain between chunks?",
        "An incomplete tail buffer",
        "A live router connection",
        "The operating-system socket table",
        "Every historical customer record",
        "Stream framing needs state for a partial message that arrives across chunk boundaries."
      ],
      [
        "What can an application add above UDP?",
        "Reliability mechanisms",
        "A guarantee by UDP alone",
        "The absence of congestion concerns",
        "Automatic business authorization",
        "Higher-level protocols can implement behavior not supplied by the UDP transport itself."
      ]
    ],
    "final": [
      [
        "Which transport abstraction is a reliable ordered stream?",
        "TCP",
        "UDP by itself",
        "A DNS record",
        "A filesystem path",
        "TCP defines ordered stream delivery while application message and business semantics remain separate."
      ],
      [
        "What does a raw TCP stream lack inherently?",
        "Message boundaries",
        "An ordering abstraction",
        "Connection state",
        "A byte representation",
        "The application must frame messages instead of assuming each read is one complete request."
      ],
      [
        "What should determine transport choice?",
        "The workload’s semantics",
        "Only a slogan about speed",
        "The longest protocol name",
        "The application’s color palette",
        "Latency, loss, ordering and required behavior determine the tradeoffs rather than a universal ranking."
      ],
      [
        "A payment client’s send call succeeds but the response is lost. What is still uncertain?",
        "Whether the order committed",
        "Whether Python text can print",
        "Whether ports are numbers",
        "Whether the client has a filename",
        "Local or transport acceptance does not settle the remote business outcome, so retry policy needs application semantics."
      ],
      [
        "A stream receive returns half a JSON message. What should a correct parser do?",
        "Retain the incomplete frame",
        "Treat the chunk as a complete order",
        "Invent missing fields",
        "Assume the peer is authorized",
        "A framing implementation must wait for a complete message under a bounded, validated protocol."
      ],
      [
        "A lecture stream values current audio more than old lost packets. Which factor matters?",
        "Timeliness versus recovery",
        "The account’s display initials",
        "The spelling of the hostname",
        "The order of source comments",
        "For some real-time workloads, a late retransmitted sample can be less useful than timely newer content."
      ],
      [
        "A team claims UDP cannot support any reliable application protocol. What is wrong?",
        "Higher layers can add reliability",
        "UDP already is a TCP stream",
        "Every datagram is encrypted",
        "Ports define all delivery rules",
        "UDP itself lacks TCP’s guarantees, but applications or higher protocols can implement additional mechanisms."
      ],
      [
        "A service uses TCP on port 443 without TLS. What assumption is unsafe?",
        "The port guarantees encryption",
        "TCP is a stream",
        "The port is a numeric endpoint",
        "The service can accept bytes",
        "A conventional port does not prove a secure protocol was negotiated or peer identity verified."
      ],
      [
        "The fixture joins order=1 and order=2 across split chunks. What did it demonstrate?",
        "Application framing logic",
        "A real TCP retransmission test",
        "Production socket backpressure",
        "A complete payment acknowledgement",
        "The deterministic string operation illustrates reconstruction without invoking a transport implementation."
      ],
      [
        "A stream parser buffers forever without a delimiter limit. What remains necessary?",
        "Bounded input and timeout policy",
        "A claim TCP solves all memory limits",
        "Only a longer message name",
        "A new UI heading",
        "Reliable transport does not bound application buffering or protect an unbounded parser from resource pressure."
      ]
    ]
  },
  {
    "comp": "m2.c1",
    "title": "Separate DNS naming from DHCP configuration",
    "intro": "A newly connected retail terminal receives a usable address but cannot resolve inventory.example. The address-configuration service and the naming service solve different problems, so one can work while the other fails.",
    "headings": [
      "Understand the boundary",
      "Apply it to an operating decision",
      "Check the model and its limits"
    ],
    "sections": [
      [
        "DNS resolves names through records and a distributed hierarchy. Resolvers can cache answers according to TTL behavior, and a name may have multiple records or return a negative answer. DNS resolution does not establish the application’s identity, permission or health; TLS and application checks still have their own roles.",
        "DHCP commonly supplies a client’s network configuration through a lease, potentially including an address, routing and resolver information. A lease is time-bounded configuration, not permanent ownership of an address. A manually configured system may not use DHCP at all."
      ],
      [
        "When a name fails, distinguish resolver reachability, response type, stale caches and the address actually selected by the client. A successful lookup from one tool does not prove another process uses the same resolver cache or network context. Avoid replacing a failing DNS name with an unreviewed fixed address in production without understanding identity and lifecycle implications.",
        "The fixture uses synthetic DNS cache entries and a lease expiry to compare two independent boundaries. It prints one unexpired cached answer and rejects an expired lease at equality. It performs no DNS query, DHCP exchange or local-interface inspection."
      ]
    ],
    "code": "now = 50\ncache = {\"inventory.example\": {\"addresses\": [\"192.0.2.10\"], \"expires\": 80}}\nlease = {\"address\": \"192.0.2.20\", \"expires\": 50}\nentry = cache[\"inventory.example\"]\nprint(entry[\"addresses\"] if now < entry[\"expires\"] else [])\nprint(now < lease[\"expires\"])",
    "expect": "['192.0.2.10']\nFalse",
    "problem": "Evaluate a synthetic cached name answer and a separate address lease.",
    "steps": [
      "Apply the cache entry’s declared expiry.",
      "Return only its supplied address list when valid.",
      "Evaluate the independent lease boundary without renewing it."
    ],
    "limit": "The model neither resolves names nor configures addresses, and real resolver/lease behavior depends on protocol and implementation policy.",
    "mistakes": [
      "Treating a DHCP lease as proof that DNS works.",
      "Using a cached DNS answer as proof of application health."
    ],
    "takeaways": [
      "Name resolution and address configuration need separate checks.",
      "Record caching and lease lifetimes explicitly."
    ],
    "practice": [
      [
        "What does DNS primarily map?",
        "Names to records",
        "Employees to every role",
        "Passwords to CPU cores",
        "Files to administrator grants",
        "DNS provides naming records rather than application authority or operating privileges."
      ],
      [
        "What does DHCP commonly supply?",
        "Leased network configuration",
        "Every web application secret",
        "A permanent business identity",
        "The complete TLS certificate chain",
        "DHCP supports time-bounded client network configuration and may provide resolver information."
      ],
      [
        "What does a DNS TTL concern?",
        "Cache lifetime",
        "A mandatory TCP port",
        "A customer permission level",
        "A password-hashing cost",
        "TTL describes caching lifetime behavior rather than transport or authorization policy."
      ],
      [
        "Can a DNS answer contain multiple addresses?",
        "Yes",
        "Never",
        "Only if all addresses are passwords",
        "Only when DHCP is disabled",
        "A name can legitimately have multiple address records under the naming design."
      ],
      [
        "What does a valid lease not prove?",
        "Application health",
        "Its modeled validity interval",
        "That a configured address was supplied",
        "That a lease record exists",
        "Address configuration alone does not establish successful application processing or dependencies."
      ],
      [
        "Why check resolver context?",
        "Processes may differ",
        "All tools share every cache",
        "Every name has one immutable answer",
        "DNS never caches negative answers",
        "Different processes or network contexts can use different resolvers and cached state."
      ],
      [
        "What is the fixture’s expired-lease decision?",
        "Invalid at equality",
        "Renewed automatically",
        "Permanently reserved",
        "Converted into a DNS record",
        "The declared now-before-expiry predicate rejects the exact expiry boundary."
      ],
      [
        "Does the cache fixture contact a resolver?",
        "No",
        "Yes for every dictionary key",
        "Only for .example names",
        "Only when the list has one address",
        "It reads supplied Python records without issuing network queries."
      ]
    ],
    "final": [
      [
        "Which system concerns name records rather than address leases?",
        "DNS",
        "DHCP lease renewal",
        "A process scheduler",
        "A disk allocator",
        "DNS naming and DHCP address configuration are distinct responsibilities."
      ],
      [
        "What does a DHCP lease describe?",
        "Time-bounded configuration",
        "Permanent ownership of an address",
        "A universal application login",
        "A signed business transaction",
        "A lease has a lifecycle and does not grant indefinite ownership or application authority."
      ],
      [
        "What is unproved by successful name resolution?",
        "Application correctness",
        "That an answer was obtained",
        "That a name query completed",
        "That supplied records can be read",
        "Name lookup is a limited step before connection, secure peer verification and application behavior."
      ],
      [
        "A terminal has a DHCP address but name lookups fail. What distinction helps?",
        "Configuration and naming differ",
        "DHCP guarantees every DNS answer",
        "All failures must be HTTP syntax",
        "Address leases encrypt name records",
        "A configured interface does not prove a resolver path or valid naming answer."
      ],
      [
        "A browser and a diagnostic tool show different answers. What should be compared?",
        "Resolver and cache contexts",
        "Only their window titles",
        "Only their font sizes",
        "The number of desktop shortcuts",
        "Different resolver paths and caches can produce different observations without one simple universal answer."
      ],
      [
        "A team pins a service IP to bypass DNS. What lifecycle issue needs review?",
        "Changing targets and identity",
        "Only the fixed string’s length",
        "Only the terminal prompt",
        "Whether every IP has a nickname",
        "Hardcoding can bypass naming changes and complicate TLS identity or service failover assumptions."
      ],
      [
        "A cached record expires at 80 and now is 50 in the fixture. What result is returned?",
        "Its supplied address list",
        "A live DHCP renewal",
        "Every address on the internet",
        "A new authentication credential",
        "The model returns the supplied cached addresses while its strict validity predicate holds."
      ],
      [
        "A lease expires at 50 and now is 50. What does the model say?",
        "The lease is not valid",
        "The lease lasts forever",
        "The address becomes a username",
        "The DNS cache is erased automatically",
        "Expiry equality is outside the fixture’s declared valid interval and does not trigger another service automatically."
      ],
      [
        "An operator treats an NXDOMAIN response as a broken cable by definition. What is missing?",
        "DNS response meaning",
        "A longer Ethernet label",
        "A different browser icon",
        "A new password salt",
        "A negative naming response is distinct from failure to reach any network service at all."
      ],
      [
        "Can this local cache dictionary certify production resolver behavior?",
        "No, it is a bounded model",
        "Yes, all resolvers use this dictionary",
        "Yes, .example is a live test host",
        "Yes, lease fields configure DNS",
        "The fixture illustrates policy decisions without observing an actual resolver implementation or deployment."
      ]
    ]
  },
  {
    "comp": "m2.c1",
    "title": "Understand HTTP over verified TLS",
    "intro": "A student opens a fee-payment page using HTTPS. Transport protection must establish the intended peer and protect the channel, while HTTP status and application permissions still describe separate outcomes.",
    "headings": [
      "Understand the boundary",
      "Apply it to an operating decision",
      "Check the model and its limits"
    ],
    "sections": [
      [
        "HTTP defines methods, fields, status codes and representation semantics. A request can be syntactically valid yet fail due to missing authorization, invalid state or a dependency. A 2xx response is meaningful only under the application’s documented contract; it is not a universal certificate that every business side effect completed.",
        "TLS protects communication under its negotiated security properties and peer-verification policy. Certificate-chain trust and hostname verification help establish the intended server identity. Merely encrypting to an unverified peer can protect against passive observation while still failing the intended identity boundary."
      ],
      [
        "Keep certificate verification enabled and repair incorrect hostnames, chains or trust configuration when needed. Do not embed a shared private key or server secret in a client to solve a connection problem. HTTPS does not decide which student owns a fee record or make an unsafe application response harmless.",
        "The fixture models acceptance as the conjunction of trusted chain, matching hostname and a successful application authorization decision. It does not perform a TLS handshake or issue HTTP requests. It shows that transport verification and business authorization are individually necessary under the declared policy."
      ]
    ],
    "code": "cases = [(True, True, True), (True, False, True), (True, True, False)]\nfor chain_trusted, hostname_matches, authorized in cases:\n    print(chain_trusted and hostname_matches and authorized)",
    "expect": "True\nFalse\nFalse",
    "problem": "Apply separate peer-verification and application-authorization conditions.",
    "steps": [
      "Evaluate the chain-trust condition.",
      "Require the intended hostname.",
      "Independently require authorization for the requested record."
    ],
    "limit": "Boolean conjunction does not implement TLS, certificate validation or a real authorization middleware.",
    "mistakes": [
      "Disabling peer verification to make a connection test pass.",
      "Treating HTTPS as permission to every business record."
    ],
    "takeaways": [
      "Preserve transport trust and application authority as separate gates.",
      "Interpret HTTP outcomes using the actual operation contract."
    ],
    "practice": [
      [
        "What does HTTP primarily define?",
        "Application request semantics",
        "Every physical link detail",
        "The kernel’s process scheduler",
        "Universal customer permissions",
        "HTTP describes application messages and their meaning rather than all lower layers or business authority."
      ],
      [
        "Why verify the server hostname?",
        "To bind the intended peer",
        "To grant every caller admin",
        "To increase the URL length",
        "To replace all certificate trust",
        "Hostname verification is part of checking that the secure connection targets the intended identity."
      ],
      [
        "What should a certificate-chain error trigger?",
        "Repair trust configuration",
        "Disable verification by default",
        "Publish the private key",
        "Skip every account check",
        "A defensive correction restores the intended trust property rather than removing peer verification."
      ],
      [
        "Does HTTPS authorize a student’s fee record?",
        "No",
        "Always for every student",
        "Only if the hostname is long",
        "Only on common ports",
        "Transport protection does not encode object-level application permission."
      ],
      [
        "What does the modeled false hostname case produce?",
        "Rejection",
        "Automatic administrator access",
        "An HTTP status by itself",
        "A new trusted certificate",
        "The declared policy requires the hostname condition along with the other necessary gates."
      ],
      [
        "Why interpret a 202 response by contract?",
        "Accepted is not always completed",
        "Every 202 means money moved",
        "All 2xx responses are identical",
        "TLS ignores HTTP status codes",
        "An accepted asynchronous operation can remain pending, so business completion needs its documented evidence."
      ],
      [
        "What is unsafe to place in a public client?",
        "A shared server secret",
        "A public service hostname",
        "A documented route name",
        "A nonsecret response schema",
        "A shared private credential in client assets can be recovered and used outside the intended server boundary."
      ],
      [
        "What does the fixture not perform?",
        "A TLS handshake",
        "A boolean policy check",
        "An evaluation of supplied cases",
        "A local deterministic print",
        "It illustrates independent policy conditions without invoking real cryptographic or network implementations."
      ]
    ],
    "final": [
      [
        "Which mechanism establishes application method and status semantics?",
        "HTTP",
        "A RAM allocator",
        "A filesystem permission bit",
        "A CPU scheduler",
        "HTTP is an application protocol whose messages carry methods, fields, status and representation semantics."
      ],
      [
        "What is part of secure peer verification?",
        "Trust and hostname checks",
        "Only the URL’s visual length",
        "Only a green application icon",
        "Only a valid customer record id",
        "A secure connection should establish the intended peer under the configured chain and hostname policy."
      ],
      [
        "What does TLS not replace?",
        "Object-level authorization",
        "Transport channel protection",
        "Its negotiated peer-check policy",
        "Encrypted record handling",
        "Application permission for a particular resource is independent from transport security."
      ],
      [
        "A payment client sees a certificate-chain error. Which corrective direction is appropriate?",
        "Repair the trust path",
        "Keep verification disabled forever",
        "Expose the server private key",
        "Allow every requester to bypass login",
        "The repair should preserve peer verification by correcting trust or chain configuration."
      ],
      [
        "A fee endpoint uses HTTPS but returns another student’s record. What boundary failed?",
        "Application authorization",
        "The mere presence of TLS",
        "The URL parser’s slash count",
        "The server’s document title",
        "Secure transport does not justify disclosure of a resource to an unauthorized caller."
      ],
      [
        "An API returns 202 for a queued refund. What should the UI claim?",
        "The request was accepted",
        "The provider reversal is complete",
        "Every bank has settled",
        "All future processing is guaranteed",
        "The documented accepted state is different from evidence that asynchronous financial work completed."
      ],
      [
        "A browser establishes encrypted transport to an unverified peer. What remains missing?",
        "Intended-peer assurance",
        "The existence of encrypted bytes",
        "A negotiated channel by itself",
        "The ability to represent a hostname",
        "Encryption without appropriate identity verification does not establish the server trust boundary intended by the client."
      ],
      [
        "A developer publishes a shared API secret in JavaScript to fix authentication. What is the problem?",
        "Client assets expose the secret",
        "Only the variable name is short",
        "JavaScript encrypts every string",
        "TLS makes public bundles private forever",
        "A secret delivered to clients can be recovered and reused, so it does not remain a protected server credential."
      ],
      [
        "A model case has trusted chain and matching name but unauthorized=false. What is the declared result?",
        "Reject the operation",
        "Grant it because TLS passed",
        "Replace the student’s identity",
        "Ignore the resource boundary",
        "The policy requires independent authorization even after transport peer conditions succeed."
      ],
      [
        "Can the boolean fixture certify a real provider’s TLS deployment?",
        "No, actual handshake evidence is needed",
        "Yes, true values validate certificates",
        "Yes, Python sets the provider chain",
        "Yes, no network evidence can matter",
        "The local model does not contact or inspect any actual TLS endpoint or cryptographic configuration."
      ]
    ]
  },
  {
    "comp": "m2.c2",
    "title": "Interpret ports, listeners and service conventions",
    "intro": "A support engineer sees port 443 in a runbook and assumes the service must be HTTPS and reachable. A port identifies an endpoint within a transport namespace; conventional assignments help interpretation but do not prove what is actually listening.",
    "headings": [
      "Understand the boundary",
      "Apply it to an operating decision",
      "Check the model and its limits"
    ],
    "sections": [
      [
        "A transport endpoint includes an address and port under a protocol such as TCP or UDP. The same numeric port can have separate TCP and UDP uses. Common conventions include TCP 80 for HTTP, TCP 443 for HTTPS, DNS commonly using UDP and TCP 53, and SSH commonly using TCP 22. Actual services can be configured differently.",
        "A listening socket is bound under a local address and transport. Binding only to loopback normally limits direct network exposure to the local host context, while binding to a wildcard address can expose additional interfaces subject to routing and firewall policy. A configured listener still needs the actual path and access controls to be reachable."
      ],
      [
        "Do not identify a protocol solely by its port or assume that an open port means a healthy authorized operation. Check the expected protocol, peer identity, network policy and application behavior. Firewalls can filter by address, port, protocol and connection context, but the exact semantics depend on the device and policy.",
        "The fixture represents endpoints as protocol/address/port tuples. It shows that TCP 53 and UDP 53 are separate entries, and that loopback versus wildcard binding are different declared scopes. It does not bind a socket, scan a host or inspect production firewall rules."
      ]
    ],
    "code": "endpoints = {(\"tcp\", \"127.0.0.1\", 53), (\"udp\", \"127.0.0.1\", 53), (\"tcp\", \"0.0.0.0\", 443)}\nprint(len(endpoints))\nprint((\"tcp\", \"127.0.0.1\", 443) in endpoints)\nprint((\"udp\", \"127.0.0.1\", 53) in endpoints)",
    "expect": "3\nFalse\nTrue",
    "problem": "Compare distinct synthetic transport endpoints without opening listeners.",
    "steps": [
      "Include protocol, address and port in each key.",
      "Count the distinct declared bindings.",
      "Test an exact tuple rather than inferring another address scope."
    ],
    "limit": "These tuples illustrate identity and scope only; actual wildcard matching, socket binding and firewall traversal are not executed.",
    "mistakes": [
      "Inferring encryption solely from port 443.",
      "Treating TCP and UDP port numbers as one shared endpoint namespace."
    ],
    "takeaways": [
      "Use protocol, address and port together.",
      "Verify service behavior and network policy beyond naming conventions."
    ],
    "practice": [
      [
        "Which fields identify a transport endpoint context?",
        "Protocol, address and port",
        "Only the port number",
        "Only the server’s logo",
        "Only a DNS display name",
        "Transport protocol and address matter as well as the numeric port."
      ],
      [
        "What is the conventional HTTPS TCP port?",
        "443",
        "22",
        "53",
        "25",
        "TCP 443 is a common assignment, though actual protocol behavior still needs verification."
      ],
      [
        "Which protocols commonly use port 53 for DNS?",
        "UDP and TCP",
        "Only HTTP methods",
        "Only a filesystem API",
        "Only the CPU scheduler",
        "DNS can use both UDP and TCP, so one numeric port does not identify one transport namespace."
      ],
      [
        "What does loopback binding usually limit?",
        "Direct access to local context",
        "Every application role",
        "All outbound traffic forever",
        "Only filename parsing",
        "A loopback listener is not directly bound to external interfaces, although forwarding can alter exposure paths."
      ],
      [
        "Does a conventional port prove its protocol?",
        "No",
        "Always",
        "Only on even numbers",
        "Only below 1024",
        "Services can be configured differently, so the actual protocol must be checked rather than assumed."
      ],
      [
        "Why can a listener remain unreachable?",
        "Path or policy can block it",
        "Listeners guarantee every route",
        "Port numbers contain all firewall rules",
        "Only the username is too short",
        "Routing, binding scope and firewall controls can prevent access even when a process listens."
      ],
      [
        "What does the tuple count represent?",
        "Declared distinct endpoints",
        "Live accepted connections",
        "A scan of public services",
        "Every machine on a subnet",
        "The set contains synthetic declarations and no network discovery results."
      ],
      [
        "What should an open port not be treated as?",
        "Proof of useful health",
        "Evidence that some transport responded",
        "A limited endpoint observation",
        "A possible diagnostic clue",
        "Transport access does not establish complete application correctness or authorized business behavior."
      ]
    ],
    "final": [
      [
        "Which pair can use the same numeric port as separate transport endpoints?",
        "TCP and UDP",
        "Two identical exact TCP tuples",
        "One tuple duplicated in a set",
        "A filename and its suffix",
        "TCP and UDP have separate transport contexts even when the number matches."
      ],
      [
        "What does port 443 conventionally suggest?",
        "HTTPS over TCP",
        "A guaranteed trusted certificate",
        "Universal administrator access",
        "A completed financial transaction",
        "The conventional assignment is a useful hint, not proof of secure peer verification or business success."
      ],
      [
        "What distinguishes loopback from wildcard binding?",
        "The declared local address scope",
        "The application’s source language",
        "The number of account roles",
        "The time an invoice was created",
        "Binding scope affects which local interfaces can receive traffic under actual networking policy."
      ],
      [
        "A service listens on 443 but speaks plain HTTP. Which assumption failed?",
        "Port implies encryption",
        "A listener can have a port",
        "HTTP has application semantics",
        "TCP has stream behavior",
        "A port convention does not make the protocol implementation negotiate TLS."
      ],
      [
        "A DNS firewall rule allows UDP 53 but required TCP DNS traffic fails. What was missed?",
        "Transport-specific coverage",
        "The query’s font",
        "The server’s display initials",
        "A mandatory universal HTTP route",
        "Using one transport’s port allowance does not automatically allow the other transport’s required traffic."
      ],
      [
        "An engineer sees a listener but the remote connection times out. What should also be inspected?",
        "Routing and access policy",
        "Only the process title",
        "Only the application icon",
        "Only the source comment count",
        "Listening is one local condition and does not certify the end-to-end path through routing and filters."
      ],
      [
        "An app binds to loopback and a forwarding proxy exposes it remotely. What must the exposure review include?",
        "The full forwarding path",
        "Only the app’s bind string",
        "Only the port’s conventional name",
        "Only the container’s label",
        "Effective exposure can include proxies and forwarding beyond the application’s direct listener scope."
      ],
      [
        "A scan reports an accepting TCP endpoint. Can it prove the customer API works?",
        "No, application checks remain",
        "Yes, every open TCP port is healthy",
        "Yes, all listeners authorize customers",
        "Yes, the number contains the schema",
        "A transport-level observation is narrower than a validated application operation and its permissions."
      ],
      [
        "The synthetic set includes wildcard TCP 443 but not the exact loopback tuple. What is the printed exact-membership result?",
        "False",
        "True because it executes kernel matching",
        "A live HTTP status",
        "A TLS certificate",
        "The fixture checks Python tuple equality, not actual wildcard binding semantics in a socket API."
      ],
      [
        "A reviewer wants evidence for production firewall enforcement. Is this tuple fixture sufficient?",
        "No, real policy evidence is needed",
        "Yes, strings configure every firewall",
        "Yes, every host shares this set",
        "Yes, all ports are public by definition",
        "The model does not read, change or test any real network enforcement boundary."
      ]
    ]
  },
  {
    "comp": "m3.c1",
    "title": "Distinguish switches, routers and default-deny filters",
    "intro": "A hospital network separates reception terminals, clinical systems and guest Wi-Fi. The design must describe which links connect devices, which paths route between networks and which operations are intentionally permitted.",
    "headings": [
      "Understand the boundary",
      "Apply it to an operating decision",
      "Check the model and its limits"
    ],
    "sections": [
      [
        "A switch commonly forwards local link-layer frames using its learned forwarding information, while a router forwards network-layer packets between networks. Modern devices can combine functions, so diagnose the actual behavior rather than relying only on the product’s label. A default gateway supplies a route toward destinations outside directly connected scope under the host’s configuration.",
        "A firewall applies a traffic policy, potentially considering addresses, protocols, ports, state and other context. Default deny means traffic without an explicit permitted path is rejected under the policy, not that every named internal device is automatically trusted. Segmentation reduces permitted paths but does not replace application permissions."
      ],
      [
        "Design rules from necessary flows: reception to the registration API, clinical systems to their authorized services, guest clients to intended public access. Consider return paths and the actual stateful/stateless semantics. Broad temporary exceptions can silently erase the intended boundary if not documented and removed.",
        "The fixture checks a small allowlist of synthetic source-zone/destination-service pairs. It permits one documented flow and denies another. It does not configure a switch, evaluate packet-state tracking or prove that the deployed hospital topology matches the policy."
      ]
    ],
    "code": "allowed = {(\"reception\", \"registration-api\"), (\"clinical\", \"records-api\")}\nfor flow in [(\"reception\", \"registration-api\"), (\"guest\", \"records-api\")]:\n    print(flow in allowed)",
    "expect": "True\nFalse",
    "problem": "Apply a default-deny model to two explicit hospital traffic flows.",
    "steps": [
      "List only necessary allowed flow pairs.",
      "Evaluate a documented reception path.",
      "Reject a guest path absent from the policy."
    ],
    "limit": "An allowlist model is not a live firewall or complete stateful traffic evaluation; actual interfaces, routes and return traffic remain untested.",
    "mistakes": [
      "Assuming every internal network is authorized for every service.",
      "Treating segmentation as a replacement for user-level permissions."
    ],
    "takeaways": [
      "Describe allowed flows and their enforcement points.",
      "Review temporary exceptions and return-path requirements."
    ],
    "practice": [
      [
        "What does a router primarily forward between?",
        "Networks",
        "Customer role descriptions",
        "Spreadsheet worksheets",
        "Application source comments",
        "Routing supports traffic movement between network scopes rather than application business records."
      ],
      [
        "What does a switch commonly forward locally?",
        "Link-layer frames",
        "Every user’s credentials",
        "Only HTTP status codes",
        "All cloud cost budgets",
        "Switching typically concerns local link-layer forwarding, though devices can combine several functions."
      ],
      [
        "What does default deny require for access?",
        "An explicit allowed path",
        "Only an internal label",
        "A sufficiently long hostname",
        "Any known port number",
        "Under default-deny policy, absence of a matching permit should not silently create a grant."
      ],
      [
        "Why define source and destination in a flow policy?",
        "Scope matters",
        "Names alone encrypt packets",
        "Every source is equally trusted",
        "Rules only control UI colors",
        "Traffic authority depends on the specific path and operation rather than a service name in isolation."
      ],
      [
        "What can a default gateway provide?",
        "A next-hop route",
        "A universal application login",
        "A guaranteed DNS record",
        "Every user’s group membership",
        "A gateway is part of routing configuration, not customer authentication or naming correctness."
      ],
      [
        "Does segmentation replace user authorization?",
        "No",
        "Always for internal users",
        "Only with a large subnet",
        "Only if switch labels match",
        "Network boundaries complement rather than replace application-level access decisions."
      ],
      [
        "What is denied in the model?",
        "Guest to records-api",
        "Reception to registration-api",
        "A configured allowed pair",
        "Reading the synthetic allowlist",
        "The guest-to-records pair is absent, so the default-deny membership rule rejects it."
      ],
      [
        "Why review temporary network exceptions?",
        "They can outlive their need",
        "They always expire automatically",
        "They only alter documentation",
        "They cannot expand access",
        "Unretired exceptions can broaden permitted paths beyond the intended design."
      ]
    ],
    "final": [
      [
        "Which device role commonly links network-layer destinations across networks?",
        "A router",
        "A stylesheet compiler",
        "A customer serializer",
        "An invoice template",
        "The routing role forwards packets between network scopes under its configured policy."
      ],
      [
        "What is an important firewall decision input?",
        "The actual traffic context",
        "Only the device’s marketing name",
        "Only the service’s logo",
        "Only the administrator’s font",
        "Policy can depend on protocol, addresses, ports and connection context rather than a label alone."
      ],
      [
        "What should an absent default-deny permit produce?",
        "Denial",
        "An automatic broad grant",
        "A new administrator account",
        "An implicit encryption key",
        "Default deny does not invent access when no approved rule matches the required flow."
      ],
      [
        "Guest Wi-Fi can reach patient records because both zones are called internal. What failed?",
        "Scoped network policy",
        "The spelling of the subnet",
        "The display order of hospitals",
        "The number of DNS labels",
        "A broad internal label should not replace explicit restrictions between guest and sensitive service paths."
      ],
      [
        "Reception can call its API but the reply path is blocked. What design detail matters?",
        "Return-path behavior",
        "Only the request’s title",
        "Only the subnet’s nickname",
        "The terminal’s wallpaper",
        "End-to-end communication requires the actual response route and applicable stateful or stateless policy."
      ],
      [
        "A firewall allows a service, but that API returns every patient record to any staff member. What still failed?",
        "Application authorization",
        "The existence of a route",
        "The presence of a port",
        "The number of network layers",
        "Permitted transport paths do not decide which authenticated user may read each sensitive resource."
      ],
      [
        "A support exception opens every zone and is never retired. What should the review address?",
        "Exception scope and lifecycle",
        "Only the rule comment length",
        "Only the color of the diagram",
        "Only the device’s serial format",
        "Temporary access needs a documented narrow purpose and timely removal rather than permanent broad exposure."
      ],
      [
        "A product combines switching and routing. How should an incident be analyzed?",
        "By its actual functions",
        "Only by the word switch",
        "Only by the vendor’s logo",
        "Only by the rack position",
        "Modern devices can combine roles, so observed forwarding and configured policy matter more than labels."
      ],
      [
        "The model permits reception to registration-api. Does it prove production packets are accepted?",
        "No, deployed enforcement is untested",
        "Yes, tuples configure routers",
        "Yes, model names identify real hosts",
        "Yes, Python sets replace firewall state",
        "The local data model does not execute or inspect any real network enforcement mechanism."
      ],
      [
        "An architect counts subnets and declares all sensitive data isolated. What evidence is still needed?",
        "Allowed-path enforcement",
        "Only more subnet names",
        "Only a larger diagram",
        "Only the number of switch ports",
        "Segmentation intent must be tied to actual routing and policy behavior, not just a list of prefixes."
      ]
    ]
  },
  {
    "comp": "m3.c1",
    "title": "Reason about NAT, proxies and load-balanced paths",
    "intro": "A SaaS application sits behind a reverse proxy and load balancer. The backend sees an intermediary’s address, and outbound workers use translated addresses. Understanding these paths prevents confusing a forwarding header with a verified user identity.",
    "headings": [
      "Understand the boundary",
      "Apply it to an operating decision",
      "Check the model and its limits"
    ],
    "sections": [
      [
        "NAT translates address or port information under a device’s mapping policy. It can change which source address a destination sees, but address translation is not authentication or encryption. Reachability and filtering depend on the actual NAT and firewall configuration; NAT should not be treated as a universal security guarantee.",
        "A forward proxy acts on behalf of clients, while a reverse proxy fronts servers. A load balancer distributes eligible work across backends under its health and selection policy. One front-door address can therefore represent multiple application instances, and each instance still needs appropriate identity, state and permission handling."
      ],
      [
        "Forwarded client metadata is trustworthy only through a configured ingress trust model. An arbitrary caller can supply a header string; the backend must distinguish trusted proxy assertions from untrusted input. Shared sessions, revocation, rate limits and connection handling need deliberate behavior when requests can reach different replicas.",
        "The fixture performs deterministic round-robin selection among modeled healthy backend records. It skips an unhealthy backend but does not test an actual health check, proxy, TLS termination or connection draining. A model’s healthy flag is supplied evidence, not proof that a server can satisfy every real workload."
      ]
    ],
    "code": "backends = [{\"id\":\"a\", \"healthy\":True}, {\"id\":\"b\", \"healthy\":False}, {\"id\":\"c\", \"healthy\":True}]\nready = [b[\"id\"] for b in backends if b[\"healthy\"]]\nprint([ready[i % len(ready)] for i in range(5)])",
    "expect": "['a', 'c', 'a', 'c', 'a']",
    "problem": "Distribute synthetic requests among eligible backend records.",
    "steps": [
      "Filter the supplied healthy set.",
      "Apply round-robin indexing over eligible entries.",
      "Observe that the ineligible backend is not selected."
    ],
    "limit": "No network or health endpoint is contacted. Real balancing must handle empty pools, changing health, in-flight work and the actual service contract.",
    "mistakes": [
      "Trusting any forwarded-address header as authenticated identity.",
      "Treating NAT as encryption or universal access control."
    ],
    "takeaways": [
      "Trace every intermediary and its trust boundary.",
      "Verify replica-aware state and real health behavior separately."
    ],
    "practice": [
      [
        "What does NAT change under its policy?",
        "Address or port mappings",
        "The user’s business role",
        "Every application password",
        "The meaning of all HTTP methods",
        "Address translation changes network endpoint representation rather than granting application authority."
      ],
      [
        "What does a reverse proxy front?",
        "Backend servers",
        "Every local keyboard",
        "Only the client’s disk",
        "All operating-system users",
        "A reverse proxy accepts client-facing traffic on behalf of backend services."
      ],
      [
        "What should a load balancer select among?",
        "Eligible backends",
        "Every stored secret",
        "All users with long names",
        "Only the newest source file",
        "Selection should follow the balancing and health policy for the backend pool."
      ],
      [
        "Why distrust arbitrary forwarded headers?",
        "Callers can supply them",
        "Every header is encrypted authority",
        "NAT signs every header",
        "A name always proves provenance",
        "Header assertions become authoritative only within a reviewed trusted-ingress boundary."
      ],
      [
        "Does NAT provide encryption by itself?",
        "No",
        "Always",
        "Only for long addresses",
        "Only on private subnets",
        "Address translation and cryptographic channel protection are different mechanisms."
      ],
      [
        "What does the fixture skip?",
        "The unhealthy backend b",
        "Every healthy backend",
        "All requests after the first",
        "Every backend with an id",
        "The model filters by its supplied healthy field before applying selection."
      ],
      [
        "What if the eligible pool is empty?",
        "A failure policy is needed",
        "Modulo arithmetic creates a server",
        "Every request must succeed",
        "An identity grant is generated",
        "A real balancer needs explicit empty-pool behavior rather than assuming at least one healthy target."
      ],
      [
        "Why consider shared state across replicas?",
        "Requests can hit different instances",
        "All requests stay in one dictionary",
        "Load balancing removes session lifecycle",
        "Backend names grant customer roles",
        "Distributed routing can expose inconsistent session, rate-limit or revocation state if not designed deliberately."
      ]
    ],
    "final": [
      [
        "Which mechanism translates endpoint addressing information?",
        "NAT",
        "A customer-role verifier",
        "An HTML text encoder",
        "A file ownership review",
        "NAT concerns address or port mappings rather than business identity or output rendering."
      ],
      [
        "What distinguishes a reverse proxy’s position?",
        "It fronts server services",
        "It is always the end user",
        "It replaces every backend database",
        "It guarantees user authorization",
        "A reverse proxy stands on the server side of the client-facing path while application controls remain necessary."
      ],
      [
        "What does a healthy flag in this fixture represent?",
        "Supplied model state",
        "A real service probe",
        "A measured production SLO",
        "A verified TLS certificate",
        "The test receives health booleans and does not contact actual backend endpoints."
      ],
      [
        "A backend trusts X-Forwarded-For from direct public clients. Which boundary needs repair?",
        "Trusted ingress provenance",
        "Only the header’s capitalization",
        "Only the JSON whitespace",
        "Only the client’s UI theme",
        "An untrusted caller can manufacture a forwarding assertion unless the ingress trust path is controlled."
      ],
      [
        "A team uses NAT and claims sensitive traffic is encrypted. What is incorrect?",
        "Translation is not encryption",
        "NAT never changes addresses",
        "Ports cannot be translated",
        "Every private network forbids TLS",
        "Address remapping does not supply cryptographic confidentiality or peer verification."
      ],
      [
        "A load balancer routes a user to a second replica whose session state is stale. What needs design?",
        "Cross-instance lifecycle behavior",
        "Only the replica’s display name",
        "Only the source code indentation",
        "A new port-number convention",
        "Session and revocation decisions must remain correct when requests can reach different instances."
      ],
      [
        "A health check validates only process existence while purchases fail. What does balancing still need?",
        "Appropriate readiness evidence",
        "A claim running means healthy",
        "Only a more attractive dashboard",
        "A longer backend identifier",
        "Pool eligibility should match the intended workload behavior instead of assuming process existence is sufficient."
      ],
      [
        "A deployment drains one backend with in-flight requests. Which operational behavior matters?",
        "Connection and request handling",
        "Only the backend’s nickname",
        "Only the rack color",
        "The order of environment variable names",
        "Real balancing must define what happens to existing work and connections during backend changes."
      ],
      [
        "The model alternates a and c successfully. What remains untested?",
        "Live proxy and backend behavior",
        "The deterministic list order",
        "The supplied health filtering",
        "The arithmetic selection result",
        "A local selection model does not exercise actual forwarding, TLS termination, network failures or application readiness."
      ],
      [
        "Every backend becomes unavailable. Why is an explicit empty-pool policy necessary?",
        "No eligible target remains",
        "The user must become administrator",
        "NAT creates replacement instances",
        "The modulo operator starts a server",
        "The routing layer needs a bounded failure or recovery response when no backend is eligible."
      ]
    ]
  },
  {
    "comp": "m3.c2",
    "title": "Troubleshoot from narrow evidence without intrusive probing",
    "intro": "A university helpdesk receives a report that the course API is unavailable. A safe investigation starts with the expected target, observed error and an owned environment. Each diagnostic tool has a limited question it can answer.",
    "headings": [
      "Understand the boundary",
      "Apply it to an operating decision",
      "Check the model and its limits"
    ],
    "sections": [
      [
        "ping commonly tests ICMP echo reachability where permitted; a failed echo does not prove the host is down because policy can filter it. traceroute-style tools infer path responses subject to filtering, asymmetric routes and implementation details. An asterisk is not automatic proof that the next hop is broken.",
        "dig examines DNS responses through a selected resolver, while curl can inspect an application request under its configured proxy and trust behavior. Record the exact target, relevant error category and test context without copying authorization headers or production secrets into public reports. A tool’s exit status and response status describe different layers."
      ],
      [
        "Use a sequence of nonintrusive checks scoped to the authorized local or test environment: configuration, naming, route/transport and application. Distinguish timeout, refusal, name failure, TLS trust failure and HTTP authorization response instead of rewriting every problem as network down. Repair the observed boundary and verify the intended operation.",
        "The fixture classifies supplied outcomes into narrow evidence categories. It does not execute ping, traceroute, dig, curl or any packet transmission. Its role is to teach accurate incident wording and next-step reasoning without probing a public service or assuming every symptom has one cause."
      ]
    ],
    "code": "outcomes = [(\"dns\", \"answer\"), (\"tcp\", \"connected\"), (\"tls\", \"hostname_mismatch\"), (\"http\", \"not_attempted\")]\nproblem = next((layer, value) for layer, value in outcomes if value not in {\"answer\", \"connected\"})\nprint(problem[0])\nprint(problem[1])",
    "expect": "tls\nhostname_mismatch",
    "problem": "Identify the first unresolved layer from supplied diagnostic outcomes.",
    "steps": [
      "Retain successful naming and transport evidence.",
      "Find the first outcome outside the declared success set.",
      "Report the layer and observed category without inventing a root cause."
    ],
    "limit": "The classification does not run diagnostics or prove the cause of any live incident; real tools, proxies and policy need their own scoped evidence.",
    "mistakes": [
      "Calling a filtered echo proof that an entire application is down.",
      "Disabling TLS verification or sharing raw credentials to simplify diagnosis."
    ],
    "takeaways": [
      "Report exact observations and their limits.",
      "Use authorized targets and preserve required security properties during repair."
    ],
    "practice": [
      [
        "What does ping commonly test?",
        "ICMP echo behavior",
        "Every HTTP permission",
        "A completed database transaction",
        "The validity of all TLS certificates",
        "Echo reachability is a narrow network observation, not full application validation."
      ],
      [
        "Why can a host fail to answer ping while serving HTTPS?",
        "ICMP can be filtered",
        "HTTPS requires every echo",
        "DNS forbids encrypted traffic",
        "All hosts share one port",
        "Network policy can treat ICMP differently from the application’s transport traffic."
      ],
      [
        "What does dig principally inspect?",
        "DNS responses",
        "Process memory allocation",
        "Every application session",
        "Local filesystem ownership",
        "The tool is used for naming queries rather than workload or operating-system permission checks."
      ],
      [
        "What should curl diagnostics preserve?",
        "Proxy and trust context",
        "A permanent TLS bypass",
        "Public credential dumps",
        "Every private request body",
        "Intermediaries and peer-verification configuration affect what the request actually tests."
      ],
      [
        "What is an HTTP 403 narrower than?",
        "A claim the network is down",
        "An observed application response",
        "A server’s response status",
        "Evidence a request reached an HTTP responder",
        "An authorization-related HTTP response is different from failure to establish any network communication."
      ],
      [
        "What does a traceroute asterisk not prove alone?",
        "A broken next hop",
        "No response was observed there",
        "A limited probe result",
        "A missing expected response",
        "Filtering and response behavior can prevent a probe reply even when forwarding continues."
      ],
      [
        "What is the fixture’s first unresolved layer?",
        "tls",
        "dns",
        "tcp",
        "A live router scan",
        "The supplied sequence shows hostname mismatch after successful naming and transport records."
      ],
      [
        "What should a diagnostic report omit?",
        "Raw credentials",
        "The safe error category",
        "The intended target name",
        "The authorized test context",
        "Credentials are authority-bearing data and should not be copied into routine incident evidence."
      ]
    ],
    "final": [
      [
        "Which tool is primarily associated with DNS querying?",
        "dig",
        "chmod",
        "journalctl as a DNS resolver",
        "A disk formatter",
        "DNS diagnostics inspect name-server responses rather than unrelated host management operations."
      ],
      [
        "What does a connection refusal describe most directly?",
        "A transport-level observation",
        "Guaranteed application authorization",
        "Proof every router failed",
        "A successful payment commit",
        "Refusal is a bounded connection outcome and not evidence of business-level completion or permission."
      ],
      [
        "Why distinguish timeout from HTTP 403?",
        "They arise at different boundaries",
        "All failures mean no packets moved",
        "Every 403 is a cable fault",
        "Timeouts prove invalid passwords",
        "An application response and an unanswered operation support different diagnostic conclusions."
      ],
      [
        "A university API serves HTTPS but does not reply to ping. What should the report avoid?",
        "Declaring it down from echo alone",
        "Recording that echo failed",
        "Testing the intended authorized endpoint",
        "Noting the policy context",
        "ICMP behavior alone does not settle the availability of the actual HTTPS service."
      ],
      [
        "A traceroute shows one asterisk then later hops reply. Which interpretation is sound?",
        "One probe lacked a response",
        "That hop certainly stopped all forwarding",
        "The destination cannot exist",
        "Every later reply is invalid",
        "Intermediate response filtering or timing can create missing replies without proving path failure."
      ],
      [
        "A certificate hostname mismatch appears after TCP connection. What is the defensive correction direction?",
        "Fix target and trust configuration",
        "Disable hostname checking permanently",
        "Publish the server private key",
        "Grant the client administrator rights",
        "The repair should preserve intended-peer verification while correcting the actual identity or configuration mismatch."
      ],
      [
        "A support engineer posts an authorization header to explain a curl failure. What went wrong?",
        "Credential disclosure in evidence",
        "Only the command name was short",
        "Headers are never credentials",
        "TLS encrypts public issue text forever",
        "Diagnostic sharing must exclude raw credentials even when they were used in an authorized local request."
      ],
      [
        "The fixture reports TLS mismatch and HTTP not attempted. Can it establish an HTTP 500 occurred?",
        "No, HTTP was not observed",
        "Yes, always HTTP 500",
        "Yes, dictionary order creates a response",
        "Yes, port 443 defines all status codes",
        "The supplied observations contain no HTTP response, so inventing an application status exceeds the evidence."
      ],
      [
        "A team probes unrelated public hosts to reproduce a local app failure. What scope should guide testing?",
        "Authorized test targets",
        "Any public host",
        "Every neighboring subnet",
        "Any address returning no echo",
        "The investigation should stay within the authorized environment and avoid unrelated public-system probing."
      ],
      [
        "After a narrow configuration repair, which validation best supports recovery?",
        "The intended operation",
        "Only a process id",
        "Only a renamed incident file",
        "Disabling the failed check",
        "Recovery evidence should test the actual needed behavior while retaining required security boundaries."
      ]
    ]
  }
];
const refs=['ipaddress','socket'].map(pythonRef);
refs.push({id:'http-semantics',title:'HTTP Semantics (RFC 9110), official HTTP Working Group source',url:'https://github.com/httpwg/http-core/blob/bde37f634681bd5462568b73aa722af9c9a3ef5e/rfc9110.xml',source:{repo:'httpwg/http-core',commit:'bde37f634681bd5462568b73aa722af9c9a3ef5e',path:'rfc9110.xml',verification:'Pinned official protocol source, not a live endpoint test.'}});
const built=build('networking-fundamentals',data,refs);
module.exports=built.course;
Object.defineProperty(module.exports,'__bank',{value:built.bank,enumerable:false});
