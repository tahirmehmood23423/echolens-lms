'use strict';
const {build,pythonRef}=require('./infra-wave2-helper');
const data=[
  {
    "comp": "m1.c1",
    "title": "Design subnet reachability from routes and address requirements",
    "intro": "A SaaS design places a public front door in one subnet and its database in another. Calling a subnet private is not an enforcement mechanism. Trace addresses, routes and policy to understand actual exposure.",
    "headings": [
      "Understand the boundary",
      "Apply it to an operating decision",
      "Check the model and its limits"
    ],
    "sections": [
      [
        "A VPC defines a logical network scope with configured address ranges and routing. Subnets occupy ranges within an Availability Zone. A public subnet conventionally has a route to an internet gateway; an instance additionally needs appropriate addressing and network policy for direct internet communication. A route alone does not make every resource publicly reachable.",
        "Private subnet designs commonly avoid direct internet-gateway routes for their workloads, but other paths can still exist through NAT, private connectivity, endpoints, peering or intermediaries. Evaluate inbound, outbound and return paths separately instead of assuming a friendly subnet name proves isolation."
      ],
      [
        "Place resources according to required flows and failure scopes. A backend database normally needs only approved application paths, while an internet-facing load balancer can expose the intended service without exposing every backend directly. Segmentation complements identity and application permissions.",
        "The fixture uses ipaddress to check two planned subnets are nonoverlapping subsets of a VPC range. It does not create VPC resources, inspect route tables or certify public/private reachability. Numerical address planning is one prerequisite for a complete network design, not the design’s enforcement proof."
      ]
    ],
    "code": "import ipaddress\nvpc = ipaddress.ip_network(\"10.20.0.0/16\")\nfront = ipaddress.ip_network(\"10.20.1.0/24\")\nback = ipaddress.ip_network(\"10.20.2.0/24\")\nprint(front.subnet_of(vpc) and back.subnet_of(vpc))\nprint(front.overlaps(back))",
    "expect": "True\nFalse",
    "problem": "Check containment and overlap for synthetic VPC subnet plans.",
    "steps": [
      "Parse the planned prefix ranges.",
      "Require each subnet to fit inside the VPC prefix.",
      "Check whether their address sets overlap."
    ],
    "limit": "This local arithmetic does not evaluate any real route, internet gateway, address assignment or access rule.",
    "mistakes": [
      "Treating a subnet’s name as proof of isolation.",
      "Assuming an internet-gateway route alone grants every resource public reachability."
    ],
    "takeaways": [
      "Trace complete required traffic paths.",
      "Keep address planning and effective exposure evidence separate."
    ],
    "practice": [
      [
        "What does a VPC define?",
        "A logical network scope",
        "Every user’s business role",
        "A guaranteed public website",
        "Only a billing label",
        "A VPC scopes configured networking and does not automatically determine application authority."
      ],
      [
        "What scope does an AWS subnet occupy?",
        "A range in one AZ",
        "Every Region simultaneously",
        "A universal IAM directory",
        "A provider billing invoice",
        "A subnet is associated with an Availability Zone and an address range within its VPC."
      ],
      [
        "What is insufficient alone for direct public reachability?",
        "An internet-gateway route",
        "A complete working path",
        "Appropriate addressing and policy",
        "An observed successful connection",
        "Routing is one required condition among addressing, resource behavior and access policy."
      ],
      [
        "Why inspect a subnet beyond its name?",
        "Names do not enforce paths",
        "Private always means no connectivity",
        "Names configure every route",
        "Every label is a security grant",
        "Actual routing and policy determine reachability rather than descriptive resource tags or names."
      ],
      [
        "What does ipaddress overlap test?",
        "Intersection of address sets",
        "Live packet delivery",
        "Every firewall decision",
        "A cloud account’s permissions",
        "The operation calculates prefix overlap without contacting or configuring a network."
      ],
      [
        "Does segmentation replace app authorization?",
        "No",
        "Always",
        "Only with private addresses",
        "Only for databases",
        "A permitted network path does not establish each user’s resource-level business permission."
      ],
      [
        "What must a path review include?",
        "The full return path",
        "Only the source’s nickname",
        "Only a subnet’s chart color",
        "The number of account icons",
        "End-to-end behavior depends on actual forwarding and policy in both relevant directions."
      ],
      [
        "What is the fixture’s overlap result?",
        "False",
        "True for all VPCs",
        "A live route lookup",
        "A created private subnet",
        "The two supplied /24 ranges are distinct within the modeled /16 address space."
      ]
    ],
    "final": [
      [
        "Which evidence establishes subnet address containment?",
        "A prefix-set calculation",
        "Only a private-sounding name",
        "A public DNS label",
        "An IAM role’s title",
        "Address arithmetic can establish that a planned range lies within another range without proving reachability."
      ],
      [
        "What defines public-subnet convention in this context?",
        "Its internet-gateway route",
        "A resource tag named public",
        "A universal anonymous-read grant",
        "Every application’s hostname",
        "The routing convention is meaningful, but resource addressing and security policy still affect actual access."
      ],
      [
        "Why are private paths still worth reviewing?",
        "Other connectivity can exist",
        "Private means no packets ever",
        "Subnets have no routes",
        "IAM names replace networking",
        "Private connectivity, NAT, endpoints and intermediaries can provide paths beyond direct internet ingress."
      ],
      [
        "A database subnet is called private but a forwarding path exposes its port. What failed?",
        "The effective-path assumption",
        "The database’s ability to have a name",
        "The numerical subnet width",
        "The existence of VPC addresses",
        "A descriptive label does not negate actual routes and intermediaries that create exposure."
      ],
      [
        "A VM has an internet-gateway route but lacks the addressing needed for direct internet access. What conclusion fits?",
        "The route is insufficient",
        "Every route grants public identity",
        "The VM must be globally reachable",
        "The application is automatically authorized",
        "Direct connectivity requires the complete addressing, routing, policy and service conditions."
      ],
      [
        "An architect puts replicas in one subnet and claims multi-AZ diversity. What needs review?",
        "Actual AZ placement",
        "Only the replicas’ suffixes",
        "Only the VPC’s logo",
        "The number of role names",
        "Subnets belong to one AZ, so instance count inside one subnet does not establish multi-zone placement."
      ],
      [
        "Two planned /24 ranges do not overlap. Does that certify firewall isolation?",
        "No, enforcement is separate",
        "Yes, nonoverlap denies all packets",
        "Yes, Python configures security groups",
        "Yes, every separate range is encrypted",
        "Address separation and traffic-control behavior are different properties requiring different evidence."
      ],
      [
        "A service is reachable only through a reverse proxy. Which boundary still matters?",
        "The proxy and backend path",
        "Only the backend’s bind label",
        "Only the subnet’s description",
        "The product’s marketing title",
        "Effective exposure includes intermediary forwarding and the backend policy rather than one direct-listener fact alone."
      ],
      [
        "A workload must call an external API without accepting unsolicited internet ingress. What should be designed?",
        "Its outbound and return path",
        "Only a public name",
        "Every subnet as world-readable",
        "An unrestricted administrator role",
        "Outbound reachability and inbound exposure are different requirements that should be modeled deliberately."
      ],
      [
        "The fixture prints containment=true. Can it prove the deployed VPC matches?",
        "No, actual configuration needs evidence",
        "Yes, ipaddress updates AWS",
        "Yes, private prefixes create VPCs",
        "Yes, all accounts use these routes",
        "The local model never reads or creates a real cloud network resource."
      ]
    ]
  },
  {
    "comp": "m1.c1",
    "title": "Combine security groups and network ACLs without confusing state",
    "intro": "A hospital frontend may call one backend port, while unrelated traffic should be denied. Security groups and network ACLs operate at different scopes and have different state handling, so copying the same mental model to both can break either access or protection.",
    "headings": [
      "Understand the boundary",
      "Apply it to an operating decision",
      "Check the model and its limits"
    ],
    "sections": [
      [
        "Security groups act as virtual firewalls associated with supported resources or network interfaces and use allow rules under their documented semantics. They are stateful for tracked traffic, so response behavior differs from a stateless packet filter. Multiple applicable groups and referencing behavior need review against the actual service context.",
        "Network ACLs apply at subnet boundaries and are stateless, with ordered rules that can allow or deny traffic under their semantics. Return traffic must be considered explicitly for stateless policy, including relevant ephemeral-port behavior. Neither control is a substitute for IAM or application authorization."
      ],
      [
        "Design the minimum necessary traffic flow and inspect both layers rather than assuming an allow at one layer overrides a deny at another. A permissive security group does not make an incompatible ACL disappear. Broad 0.0.0.0/0 rules deserve a clear purpose and scope instead of becoming a default troubleshooting fix.",
        "The fixture evaluates a deliberately simplified conjunction of two supplied policy outcomes. It does not implement AWS state tracking, rule ordering, CIDR matching, group references or ephemeral ports. The output demonstrates why all required network gates must permit the intended path."
      ]
    ],
    "code": "cases = [(True, True), (True, False), (False, True)]\nfor group_allows, acl_allows in cases:\n    print(group_allows and acl_allows)",
    "expect": "True\nFalse\nFalse",
    "problem": "Apply two necessary synthetic network policy gates.",
    "steps": [
      "Read the separately supplied group and ACL outcomes.",
      "Require both relevant gates to allow.",
      "Observe that one allow does not override another denial."
    ],
    "limit": "Boolean gates are not an AWS firewall evaluator and do not test connection state or rule ordering.",
    "mistakes": [
      "Treating a stateful group and stateless ACL as identical.",
      "Adding broad rules before locating the actual denied path."
    ],
    "takeaways": [
      "Understand scope and state handling for each layer.",
      "Test intended and denied traffic paths under actual policy."
    ],
    "practice": [
      [
        "What is a security group’s documented state characteristic?",
        "Stateful for tracked traffic",
        "Always a stateless ordered deny list",
        "Only a DNS cache",
        "A universal application role",
        "Security-group state tracking affects how response traffic is handled under its documented behavior."
      ],
      [
        "What is a network ACL’s state characteristic?",
        "Stateless",
        "A complete TCP session store",
        "An encrypted user directory",
        "A mandatory application cookie",
        "Subnet ACL rules evaluate traffic without security-group-style connection state."
      ],
      [
        "Why consider return traffic in ACLs?",
        "Stateless rules must permit it",
        "Return packets never use policy",
        "All ACLs auto-allow every reply",
        "Only request names matter",
        "A stateless boundary needs rules compatible with both required traffic directions."
      ],
      [
        "Does an allow at one layer override every other deny?",
        "No",
        "Always",
        "Only for private addresses",
        "Only with a known service name",
        "An end-to-end path must satisfy each applicable required policy boundary."
      ],
      [
        "What should precede a broad troubleshooting allow?",
        "Locate the denied path",
        "Remove every security boundary",
        "Assume every source is trusted",
        "Publish all policy credentials",
        "Diagnosis should identify the actual blocked flow before expanding access beyond its intended scope."
      ],
      [
        "What scope do network ACLs relate to?",
        "Subnet boundaries",
        "Only customer role pages",
        "Every database row",
        "A Python list’s index",
        "ACL association and evaluation concern subnet traffic rather than application object ownership."
      ],
      [
        "What remains beyond network policy?",
        "Application authorization",
        "A guarantee every user is admin",
        "Only a longer hostname",
        "No further access checks",
        "A transport path does not decide which authenticated user may perform a business operation."
      ],
      [
        "Does the fixture model AWS connection tracking?",
        "No",
        "Always",
        "Only for true booleans",
        "Only on port443",
        "The code combines supplied outcomes and does not implement the provider’s policy engine."
      ]
    ],
    "final": [
      [
        "Which control is stateless in this lesson’s AWS model?",
        "A network ACL",
        "A tracked security group session",
        "An application login cookie",
        "A customer role store",
        "Network ACL handling differs from stateful security-group tracking and needs explicit return-path reasoning."
      ],
      [
        "What makes rule ordering important for ACL review?",
        "The matching evaluation semantics",
        "Only the description’s length",
        "The alphabetic subnet name",
        "The age of a diagram",
        "Ordered rule behavior affects which permit or deny applies under the documented ACL model."
      ],
      [
        "Why can a path fail despite a group allow?",
        "Another required gate denies it",
        "Allow rules bypass all ACLs",
        "Private names force success",
        "Every response is automatically trusted",
        "The complete path includes other applicable policy and routing conditions."
      ],
      [
        "A team opens one inbound ACL port but required replies fail. What was overlooked?",
        "Stateless return traffic",
        "Only the group’s nickname",
        "Only the chart’s arrow color",
        "The length of the server’s id",
        "ACLs do not infer an automatic reverse allowance from a connection’s request direction."
      ],
      [
        "A group permits the API, but the ACL denies the flow. What should the simplified model return?",
        "False",
        "True because one allow wins",
        "A new administrator role",
        "A TLS certificate",
        "The declared model requires both necessary gates to allow and does not let one override the other."
      ],
      [
        "An operator adds a world-open rule to every group to debug one path. What should be corrected?",
        "The change’s excessive scope",
        "Only the rule’s spelling",
        "Only the console’s theme",
        "The number of attached labels",
        "Broad permissions can violate the intended flow boundary and should not replace focused diagnosis."
      ],
      [
        "A hospital API is network-restricted but returns another patient’s data. Which control remains wrong?",
        "Application authorization",
        "The existence of a subnet",
        "The number of ACL rules",
        "The transport’s numeric port",
        "Network reachability restrictions do not enforce patient-level application permissions."
      ],
      [
        "A reviewer copies stateful reply assumptions to an ACL. What distinction matters?",
        "Connection state handling",
        "Only the product abbreviation",
        "Only the source comment count",
        "The hostname’s display case",
        "Stateful and stateless filters handle reverse traffic differently and need different rule reasoning."
      ],
      [
        "The conjunction fixture succeeds once. Can it certify live group references and rule order?",
        "No, actual policy evidence is needed",
        "Yes, booleans contain all AWS semantics",
        "Yes, Python creates network ACLs",
        "Yes, one true proves every packet",
        "The local model does not inspect or execute the cloud provider’s real filtering rules."
      ],
      [
        "A default-deny design needs a new backend flow. What should be reviewed?",
        "The narrow flow and both directions",
        "Only a more reassuring subnet name",
        "Every source as administrator",
        "Only the app’s logo",
        "A justified change should add the required path under each applicable control without unnecessary exposure."
      ]
    ]
  },
  {
    "comp": "m1.c1",
    "title": "Design outbound dependencies and private service paths deliberately",
    "intro": "A logistics worker must read managed storage and call an external carrier API. Outbound access, DNS, routing and service permissions are separate needs; calling a subnet private does not guarantee either required connectivity or restricted disclosure.",
    "headings": [
      "Understand the boundary",
      "Apply it to an operating decision",
      "Check the model and its limits"
    ],
    "sections": [
      [
        "NAT-based egress can provide a path from eligible private workloads toward external destinations under the actual configuration. Private service endpoints can support selected service access without the same public network path, but endpoint type, routes, DNS and policy behavior must match the chosen service. An endpoint is not universal permission to every resource.",
        "A route to a dependency does not verify its identity, authorize data access or bound what data the worker sends. Use trusted DNS and TLS configuration, scoped credentials, appropriate endpoint and resource policies, and a deliberate external-dependency contract. Avoid long-lived embedded keys as a workaround for a failed path."
      ],
      [
        "Review the dependency failure mode: timeouts, retries, alternate paths and observability should preserve workload and security requirements. Restrict unnecessary egress when justified, but test the actual required path rather than assuming a deny-all statement is compatible with all operations.",
        "The fixture selects supplied dependency records that meet route, name and permission conditions. It does not perform DNS, TLS, endpoint-policy evaluation or outbound traffic. These are explicit necessary-condition booleans, not a real cloud network or IAM implementation."
      ]
    ],
    "code": "deps = [{\"name\":\"storage\", \"route\":True,\"dns\":True,\"allowed\":True}, {\"name\":\"carrier\", \"route\":True,\"dns\":False,\"allowed\":True}]\nprint([d[\"name\"] for d in deps if d[\"route\"] and d[\"dns\"] and d[\"allowed\"]])",
    "expect": "['storage']",
    "problem": "Find modeled dependencies meeting all declared prerequisites.",
    "steps": [
      "Keep routing, naming and permission as separate facts.",
      "Require all stated conditions for eligibility.",
      "Retain failed conditions for further review."
    ],
    "limit": "The predicate omits actual provider routing, endpoint types, TLS and policy evaluation, and sends no network traffic.",
    "mistakes": [
      "Treating a private endpoint as unrestricted resource permission.",
      "Embedding permanent credentials to bypass a connectivity problem."
    ],
    "takeaways": [
      "Review full dependency paths and identity controls.",
      "Keep failures bounded and diagnosable without weakening trust."
    ],
    "practice": [
      [
        "What does NAT-based egress concern?",
        "An outbound network path",
        "Every resource’s IAM grant",
        "A completed business request",
        "Universal transport encryption",
        "Address translation and routing support a path but do not supply application permission or TLS identity."
      ],
      [
        "What must a service endpoint match?",
        "The selected service’s behavior",
        "Every possible protocol automatically",
        "All customer roles",
        "A universal unrestricted bucket",
        "Endpoint type, routes, DNS and policy must fit the intended service and access requirement."
      ],
      [
        "Does a working route prove permission?",
        "No",
        "Always",
        "Only for private endpoints",
        "Only for storage services",
        "Network reachability and authorized service operations are independent boundaries."
      ],
      [
        "Why review endpoint DNS configuration?",
        "Names must select the intended path",
        "Names grant every resource action",
        "DNS replaces all IAM",
        "Only labels control subnet routes",
        "Resolution behavior can determine which service endpoint or path the workload actually uses."
      ],
      [
        "What is unsafe as a path-debug workaround?",
        "Embedded long-lived keys",
        "A safe error category",
        "A documented target hostname",
        "A nonsecret route description",
        "Permanent credentials introduce exposure and do not repair the underlying connectivity or trust boundary."
      ],
      [
        "What should outbound retries respect?",
        "Budgets and operation effects",
        "Unlimited attempts forever",
        "Only a new request label",
        "A claim every timeout means rollback",
        "Retries can amplify load or duplicate uncertain effects and need bounded semantic handling."
      ],
      [
        "What does the fixture select?",
        "storage",
        "carrier automatically",
        "Every live AWS endpoint",
        "A real NAT gateway",
        "Only storage has all three supplied prerequisite booleans true in the local model."
      ],
      [
        "Does the fixture perform DNS resolution?",
        "No",
        "Always for a name field",
        "Only for carrier",
        "Only when route is true",
        "A dictionary key named dns is supplied model state rather than a network lookup."
      ]
    ],
    "final": [
      [
        "What is private service connectivity distinct from?",
        "Resource authorization",
        "A configured network path",
        "A possible route selection",
        "A naming behavior",
        "A private path does not automatically authorize the caller’s intended operation on a particular resource."
      ],
      [
        "Why evaluate DNS with endpoint routing?",
        "Names affect path choice",
        "DNS encrypts every request",
        "Endpoints ignore all names",
        "Only UI labels select packets",
        "Configured names and address selection can determine whether traffic reaches the intended service path."
      ],
      [
        "What should an external-dependency contract specify?",
        "Timeout and retry behavior",
        "Every request as infinite work",
        "Only a provider logo",
        "Only the app’s theme",
        "Bounded failure behavior and operation semantics matter for reliable and secure dependency use."
      ],
      [
        "A worker reaches storage through a private endpoint but is denied an object read. What distinction helps?",
        "Network path versus permission",
        "Private endpoints grant all objects",
        "All denials mean no routing",
        "The object must be corrupted",
        "A successful path is separate from identity, endpoint and resource-policy authorization."
      ],
      [
        "A carrier API lookup fails while routes exist. Which prerequisite deserves investigation?",
        "Naming context",
        "Only the worker’s nickname",
        "Only the subnet description",
        "The number of cost tags",
        "The supplied route fact does not prove the resolver path or target-name result is correct."
      ],
      [
        "A team hardcodes a permanent cloud key after endpoint failure. What should be addressed instead?",
        "The actual path and trust issue",
        "Only the key’s display title",
        "Only a larger environment file",
        "A shorter service label",
        "Adding exposed authority does not repair network, naming or trust configuration and creates a separate risk."
      ],
      [
        "A deny-all egress change breaks an essential dependency. What review was missing?",
        "Required-path validation",
        "Only a better rule comment",
        "Only the chart’s color",
        "The order of source imports",
        "Restrictive policy still needs to support explicitly required workload paths under the intended design."
      ],
      [
        "The model lists storage as eligible. What is not established?",
        "A successful real API operation",
        "The supplied booleans were true",
        "The local filter selected storage",
        "The example output was deterministic",
        "No network, TLS or provider authorization system is contacted by the fixture."
      ],
      [
        "An endpoint is configured for one supported service. May an architect infer every external API uses it?",
        "No, endpoint scope is specific",
        "Yes, all protocols share one endpoint",
        "Yes, private means universal",
        "Yes, one route replaces every hostname",
        "Private endpoint capabilities and routing behavior apply to their documented service and type rather than all dependencies."
      ],
      [
        "A retry loop forwards private payloads to an unverified alternate host. What boundary needs review?",
        "Dependency identity and disclosure",
        "Only the request’s display id",
        "Only the number of retries shown",
        "The color of the alert",
        "Failover and retry must preserve the intended peer identity and data-sharing policy instead of trading them away for apparent availability."
      ]
    ]
  },
  {
    "comp": "m2.c1",
    "title": "Use workload roles and temporary credentials with lifecycle control",
    "intro": "A university background worker needs one storage read. A role-based workload identity can avoid distributing permanent shared keys, but temporary credentials still carry authority and need protected delivery, use and expiration behavior.",
    "headings": [
      "Understand the boundary",
      "Apply it to an operating decision",
      "Check the model and its limits"
    ],
    "sections": [
      [
        "An IAM role represents a set of permissions that can be assumed by an allowed principal under its trust policy. Role sessions use temporary security credentials rather than making the role itself a permanent human password. The mechanism used to obtain and refresh credentials depends on the workload platform and configured identity path.",
        "Temporary does not mean harmless: credentials can still authorize actions during their lifetime. Protect them from logs, clients and unintended processes, use the supported credential provider chain and avoid manually copying values into long-lived configuration. Review session duration, refresh failure and revocation/containment options under the actual service model."
      ],
      [
        "Separate who may assume the role from what an assumed session may do. A broad trust policy can expose a narrow role to unintended principals, while a correct trust policy can still lead to excessive action permissions. Workload identity and application end-user identity are also different scopes.",
        "The fixture evaluates an expiry boundary for supplied synthetic role-session metadata. It prints a valid-before-expiry result and an invalid-at-expiry result. It does not obtain, print, refresh or revoke actual AWS credentials and is not an STS implementation."
      ]
    ],
    "code": "session = {\"role\":\"report-reader-demo\", \"expires\":200}\nfor now in [199, 200]:\n    print(now < session[\"expires\"])",
    "expect": "True\nFalse",
    "problem": "Inspect the declared validity interval of synthetic role-session metadata.",
    "steps": [
      "Read the fixture expiry.",
      "Check one time before the boundary.",
      "Check equality without renewing or printing credentials."
    ],
    "limit": "A local expiry predicate does not reproduce AWS credential validation, refresh, revocation or trust-policy enforcement.",
    "mistakes": [
      "Treating temporary credentials as safe to publish.",
      "Confusing permission to assume a role with the role’s allowed actions."
    ],
    "takeaways": [
      "Prefer supported workload identity over copied permanent keys.",
      "Review trust, permissions and session lifecycle separately."
    ],
    "practice": [
      [
        "What does a role trust policy concern?",
        "Who may assume it",
        "Every permitted object action",
        "The color of the console",
        "The billing currency",
        "Trust policy controls the allowed assumption path rather than defining every resulting service action."
      ],
      [
        "What do role sessions commonly use?",
        "Temporary credentials",
        "A public shared password",
        "Every user’s email address",
        "A permanent UI color",
        "A role session receives authority-bearing temporary security credentials under the identity mechanism."
      ],
      [
        "Why protect temporary credentials?",
        "They still grant authority",
        "Expiry makes copying harmless",
        "Logs automatically revoke them",
        "Short strings cannot be reused",
        "Credentials can be used within their validity and scope even when their lifetime is bounded."
      ],
      [
        "What should obtain workload credentials?",
        "The supported identity mechanism",
        "A pasted permanent secret in code",
        "A public browser bundle",
        "An anonymous issue comment",
        "Platform-supported credential delivery and refresh avoid unnecessary manual secret distribution."
      ],
      [
        "What must role review distinguish?",
        "Trust and action permissions",
        "Only a friendly role name",
        "Only the number of letters",
        "Every cloud service as one app",
        "Who may assume a role and what the resulting session can do are separate policy questions."
      ],
      [
        "What does expiry equality do in the fixture?",
        "Rejects validity",
        "Renews the session",
        "Grants administrator rights",
        "Prints real credentials",
        "The declared now-before-expiry rule excludes the equality boundary."
      ],
      [
        "Does the fixture call STS?",
        "No",
        "Always",
        "Only for long role names",
        "Only when now is199",
        "The supplied dictionary and comparison do not request any real role credentials."
      ],
      [
        "What differs from workload identity?",
        "Application end-user identity",
        "A role’s textual label",
        "A synthetic expiry field",
        "A temporary session record",
        "The service’s cloud principal does not automatically identify or authorize each customer using the app."
      ]
    ],
    "final": [
      [
        "Which policy question is about role assumption?",
        "Who can obtain the session",
        "Which object read is allowed afterward",
        "How a chart is colored",
        "What the resource costs",
        "The trust boundary determines the allowed principal/path for assuming a role."
      ],
      [
        "Why prefer supported temporary workload identity?",
        "It reduces copied permanent keys",
        "It eliminates every access review",
        "It makes credentials public",
        "It guarantees every action is safe",
        "Supported role-based delivery can reduce persistent secret distribution while permissions and lifecycle still need review."
      ],
      [
        "What is a temporary credential not equivalent to?",
        "A harmless public label",
        "An authority-bearing value",
        "A bounded-lifetime credential",
        "A protected runtime secret",
        "Temporary values can still be misused within their valid authority and must not be treated as public metadata."
      ],
      [
        "A worker writes its role credentials into support logs. What failed?",
        "Credential protection",
        "The role’s display title",
        "Only the cost tag",
        "The subnet’s description",
        "Temporary authority needs protection from unintended readers just like other usable credentials."
      ],
      [
        "A role has narrow actions but trusts every unexpected principal. What needs repair?",
        "The assumption boundary",
        "Only the resource’s nickname",
        "Only a longer role name",
        "The number of policy files",
        "A narrow action set does not make it appropriate for arbitrary principals to obtain that authority."
      ],
      [
        "A role can be assumed correctly but grants wildcard actions. Which review remains necessary?",
        "Permission scope",
        "Only the login button style",
        "Only the session label",
        "The application’s logo",
        "Correct identity delivery does not justify actions and resources beyond the workload’s actual need."
      ],
      [
        "The session expires at200and now is200in the model. What is printed?",
        "False",
        "True with automatic renewal",
        "A real access token",
        "A successful object read",
        "The local predicate rejects the exact expiry boundary and does not perform refresh."
      ],
      [
        "An SDK cannot refresh credentials after a platform issue. What should be designed?",
        "Bounded failure and diagnostics",
        "Permanent keys in every client",
        "Public logging of the old secret",
        "A guarantee old credentials never expire",
        "Workload identity integration needs defined behavior when delivery or refresh fails while preserving secret handling."
      ],
      [
        "The app’s cloud role can read storage. Does that authorize every customer to see every object?",
        "No, app permissions remain",
        "Yes, one role grants every end user",
        "Yes, storage reads imply public data",
        "Yes, role sessions encode all student ids",
        "Cloud service authority and end-user resource authorization are distinct boundaries."
      ],
      [
        "Can the expiry model certify deployed credential revocation behavior?",
        "No, actual service evidence is needed",
        "Yes, Python dictionaries revoke STS",
        "Yes, expiry fields configure every session",
        "Yes, all temporary authority is identical",
        "The local metadata test does not exercise the provider’s real validation or containment mechanisms."
      ]
    ]
  },
  {
    "comp": "m2.c1",
    "title": "Write least-privilege intent and recognize policy-evaluation limits",
    "intro": "A logistics worker should read one report prefix and never delete reports. An IAM policy should express required actions and resources precisely, with conditions where appropriate, while the review understands how other applicable policy types affect the final decision.",
    "headings": [
      "Understand the boundary",
      "Apply it to an operating decision",
      "Check the model and its limits"
    ],
    "sections": [
      [
        "Least privilege starts from observed and required operations, resources and context rather than a wildcard used for convenience. Identity-based and resource-based policies, permissions boundaries, organization controls, session policy and explicit denies can all matter depending on the principal and request. The exact provider evaluation rules must be checked rather than replaced by a simplistic universal union.",
        "An explicit deny in an applicable policy can override an allow under the documented evaluation model. A permissions boundary or organization control is not simply another action grant. Conversely, having no explicit deny is not always enough to grant an operation; a relevant allow and the applicable evaluation requirements are still needed."
      ],
      [
        "Use reviewable policy statements, supported policy validation tools and isolated allowed/denied cases for the actual request context. A role name such as read-only is not proof that all attached policies are narrow. Resource selection, wildcard behavior and condition keys need service-specific accuracy.",
        "The fixture implements only an explicitly declared exact action-resource allow set with a separate exact deny set. It does not parse IAM JSON, expand wildcards, evaluate principals or conditions, or model every resource-policy and organization interaction. Its value is to expose the stated scope and deny precedence in this limited model."
      ]
    ],
    "code": "allows = {(\"read\", \"reports/demo\"), (\"delete\", \"reports/demo\")}\ndenies = {(\"delete\", \"reports/demo\")}\nfor request in [(\"read\", \"reports/demo\"), (\"delete\", \"reports/demo\"), (\"read\", \"private/other\")]:\n    print(request in allows and request not in denies)",
    "expect": "True\nFalse\nFalse",
    "problem": "Compare exact synthetic allow and deny decisions without implementing IAM.",
    "steps": [
      "Match the entire action-resource pair.",
      "Reject an applicable exact deny.",
      "Reject a request with no matching modeled allow."
    ],
    "limit": "This small set model is not an AWS policy evaluator and cannot validate real IAM wildcard, principal, condition or policy-type semantics.",
    "mistakes": [
      "Treating a permissions boundary as a permission grant.",
      "Assuming no explicit deny means every operation is allowed."
    ],
    "takeaways": [
      "Scope required actions and resources explicitly.",
      "Verify real request contexts with the provider’s documented policy model."
    ],
    "practice": [
      [
        "What should least privilege start from?",
        "Required actions and resources",
        "A wildcard for every service",
        "Only the role’s friendly name",
        "The provider’s logo",
        "The grant should match the workload’s actual operation and target requirements."
      ],
      [
        "What can an applicable explicit deny do?",
        "Override an allow",
        "Grant every unlisted action",
        "Change the billing region",
        "Encrypt every policy document",
        "The documented evaluation model can give explicit deny precedence over otherwise allowed requests."
      ],
      [
        "Is a permissions boundary itself a grant?",
        "No",
        "Always",
        "Only if the name is long",
        "Only for private subnets",
        "A boundary constrains permissions under its semantics and does not simply supply an independent action allow."
      ],
      [
        "Does no explicit deny always imply access?",
        "No",
        "Always",
        "Only for known resources",
        "Only with a signed role name",
        "A relevant allow and the applicable policy evaluation requirements still matter."
      ],
      [
        "Why inspect resource scope?",
        "Actions can expose unrelated data",
        "Names automatically restrict policy",
        "Every read is harmless",
        "All prefixes belong to one user",
        "A useful action can be excessive if it is granted across resources beyond the intended need."
      ],
      [
        "What does the fixture deny despite an allow?",
        "delete reports/demo",
        "read reports/demo",
        "Every local tuple",
        "A public cloud account",
        "The exact delete pair appears in both sets, and the declared model makes the deny decisive."
      ],
      [
        "What does the fixture not support?",
        "IAM condition semantics",
        "Python set membership",
        "An exact action label",
        "An exact resource label",
        "The model does not parse or apply real provider conditions, wildcards or principal-policy interactions."
      ],
      [
        "Why test both allowed and denied cases?",
        "Success alone misses overgrant",
        "Only denials need permissions",
        "Every allow proves all policy",
        "A label certifies every case",
        "Negative cases can reveal unintended authority that a happy-path check never exercises."
      ]
    ],
    "final": [
      [
        "What is a read-only role label not sufficient to prove?",
        "Actual least privilege",
        "That a role has a name",
        "That metadata can be stored",
        "That a description exists",
        "Effective authority comes from real attached and applicable policy, not the role’s reassuring label."
      ],
      [
        "What needs service-specific review in a policy?",
        "Policy request semantics",
        "Only the indentation style",
        "Only the file’s title",
        "A universal owner nickname",
        "Correct permission meaning depends on supported service actions, resource forms and condition semantics."
      ],
      [
        "What should a limited model disclose?",
        "Its omitted policy semantics",
        "A claim of complete AWS equivalence",
        "Only a new diagram",
        "A guarantee every request is covered",
        "A bounded illustration must not be presented as a full provider policy evaluation or validation result."
      ],
      [
        "A worker needs one prefix but receives all-object deletion. What principle failed?",
        "Least privilege",
        "The ability to name resources",
        "The syntax of a JSON string",
        "The number of documentation links",
        "The actions and resource scope exceed the actual workload requirement."
      ],
      [
        "An allow appears in one policy but an applicable explicit deny exists elsewhere. What must the review consider?",
        "Deny precedence",
        "Only the first policy’s title",
        "Only the newest file date",
        "The operator’s preferred role name",
        "Real authorization requires all relevant policy interactions rather than selecting a reassuring allow alone."
      ],
      [
        "A team treats a permissions boundary as if it grants storage read by itself. What is wrong?",
        "A constraint is not a grant",
        "Every boundary is a public key",
        "All storage reads ignore policy",
        "Names configure actual authority",
        "Boundary semantics limit effective permission and are not equivalent to an independent identity allow."
      ],
      [
        "The model has no allow for private/other. What is its result?",
        "False",
        "True because no deny is present",
        "A created policy file",
        "An administrator session",
        "The limited policy requires a matching allow as well as absence of a matching deny."
      ],
      [
        "A test checks one successful report read and declares deletion impossible. What evidence is missing?",
        "The denied operation case",
        "Only another report filename",
        "Only a longer code block",
        "The number of role labels",
        "Success of a required action does not establish that unwanted actions are rejected."
      ],
      [
        "An IAM condition key is copied from an unsupported service example. What should be checked?",
        "The actual service semantics",
        "Only a more attractive policy name",
        "Only the source’s font",
        "The size of a screenshot",
        "Condition keys and resource forms must be valid for the intended service and request context."
      ],
      [
        "Can the exact-set fixture validate a real wildcard resource policy?",
        "No, it omits that engine",
        "Yes, strings parse all wildcards",
        "Yes, all IAM policies are sets",
        "Yes, every principal is identical",
        "No real policy document, condition, resource-policy interaction or wildcard expansion is evaluated."
      ]
    ]
  },
  {
    "comp": "m2.c1",
    "title": "Review cross-account access as trust plus scoped service authority",
    "intro": "A university shares a report with an external analytics account. The design must define which external principal can obtain access, what it may do and how the data is constrained, rather than treating a known account number as permission for every caller.",
    "headings": [
      "Understand the boundary",
      "Apply it to an operating decision",
      "Check the model and its limits"
    ],
    "sections": [
      [
        "Cross-account access can involve role trust, resource-based policy or other supported mechanisms under the selected service. Identity, action, resource and context must fit the documented evaluation model on all relevant sides. A role trust relationship permits an assumption path; it does not automatically make every target resource action valid.",
        "Third-party integrations need deliberate confused-deputy protections where appropriate, including supported external-id or source-context conditions under the actual service contract. These controls supplement the trust and permission design; a condition label is not a universal replacement for authenticated identity or least privilege."
      ],
      [
        "Document ownership, allowed data scope, session and revocation behavior, monitoring and the integration’s end-of-life process. Avoid distributing permanent shared credentials as a shortcut. Verify unwanted principals, actions and resources are denied in an owned isolated test setup.",
        "The fixture evaluates a synthetic request with exact trusted account, role and resource labels. It illustrates that all three declared scope conditions are needed. It is not IAM or STS, does not model external-id protocol behavior and never contacts another account."
      ]
    ],
    "code": "def permitted(request):\n    return request[\"account\"] == \"partner-demo\" and request[\"role\"] == \"analytics-reader\" and request[\"resource\"] == \"approved-report\"\nprint(permitted({\"account\":\"partner-demo\",\"role\":\"analytics-reader\",\"resource\":\"approved-report\"}))\nprint(permitted({\"account\":\"partner-demo\",\"role\":\"analytics-reader\",\"resource\":\"private-history\"}))",
    "expect": "True\nFalse",
    "problem": "Apply a declared account, role and report scope to synthetic integration requests.",
    "steps": [
      "Check the known principal context.",
      "Require the scoped role.",
      "Reject an unrelated target resource."
    ],
    "limit": "The exact-label predicate does not reproduce AWS cross-account evaluation, actual credential delivery or third-party trust protections.",
    "mistakes": [
      "Treating a recognized account identifier as permission to every resource.",
      "Leaving an integration’s trust grant in place after the relationship ends."
    ],
    "takeaways": [
      "Review assumption trust and target authority separately.",
      "Test unwanted contexts and define integration retirement."
    ],
    "practice": [
      [
        "What must cross-account review identify?",
        "Principal, action and resource",
        "Only a familiar account nickname",
        "Only a shared dashboard color",
        "Every employee’s home directory",
        "A scoped integration needs defined identity, operation and target context under the actual service model."
      ],
      [
        "Does role trust grant every resource operation?",
        "No",
        "Always",
        "Only for partner accounts",
        "Only with a long session name",
        "Trust to obtain a role session is distinct from the resulting permission to perform a service operation."
      ],
      [
        "Why review an external-id condition where applicable?",
        "To address the integration trust context",
        "To replace every identity check",
        "To encrypt all report contents",
        "To grant universal administrator rights",
        "Supported confused-deputy protections can constrain the third-party assumption context under their documented contract."
      ],
      [
        "What should an integration retirement plan remove?",
        "Unneeded trust and grants",
        "Only the partner’s logo",
        "Only a browser bookmark",
        "The report’s file extension",
        "Authority should end when the integration relationship or need ends, under verified lifecycle behavior."
      ],
      [
        "Why avoid permanent shared keys?",
        "They spread reusable authority",
        "They always expire instantly",
        "They cannot be copied",
        "They are only public labels",
        "Long-lived shared credentials complicate containment, rotation and attribution compared with appropriately scoped identity mechanisms."
      ],
      [
        "What does the fixture deny?",
        "The private-history target",
        "The approved-report target",
        "Every trusted request",
        "The existence of a partner label",
        "The exact resource scope permits only the approved report, even for the known account and role."
      ],
      [
        "What should negative tests include?",
        "Unwanted principals and targets",
        "Only another successful report read",
        "Only a new role description",
        "The chart’s legend",
        "Tests should challenge unauthorized context rather than infer isolation from one permitted request."
      ],
      [
        "Does the fixture contact a partner account?",
        "No",
        "Always",
        "Only for an approved report",
        "Only if the role label matches",
        "The local predicate reads supplied dictionaries and never obtains real cross-account credentials."
      ]
    ],
    "final": [
      [
        "What is a known account id not equivalent to?",
        "Universal resource authority",
        "A possible principal context",
        "A label used in a trust review",
        "One part of an integration definition",
        "Recognizing an account does not grant all principals and actions unrestricted access to customer data."
      ],
      [
        "Why separate role trust and target permissions?",
        "They answer different questions",
        "Both always mean administrator",
        "All service policies are identical",
        "Trust labels encrypt report contents",
        "An allowed assumption path and an authorized service operation require their own correct scope and evaluation."
      ],
      [
        "What should an integration contract define?",
        "Data scope and retirement",
        "Only a public marketing name",
        "Only the dashboard theme",
        "The partner’s preferred font",
        "A maintainable trust relationship needs limits, ownership, lifecycle and removal behavior."
      ],
      [
        "A partner can assume a role but cannot read the report. What distinction helps?",
        "Trust versus service authority",
        "Assumption always grants every read",
        "Reports never need resource policy",
        "Account labels replace permissions",
        "Obtaining a session does not by itself establish that every target service request is authorized."
      ],
      [
        "A provider integration uses one shared permanent key for all customers. What risk needs review?",
        "Scope, attribution and containment",
        "Only the key’s variable name",
        "Only the number of console tabs",
        "The report’s timestamp format",
        "Shared long-lived authority can cross intended customer boundaries and complicate rotation and incident response."
      ],
      [
        "A partnership ends but its role trust remains. What process failed?",
        "Access lifecycle control",
        "Only the email signature update",
        "Only a chart refresh",
        "The naming of an artifact",
        "Unneeded authority should be retired and the intended denied behavior verified after the relationship ends."
      ],
      [
        "A test covers only the approved report. What remains unproven?",
        "Denial of unrelated targets",
        "That one fixture passed",
        "That an approved label exists",
        "That the local function ran",
        "Positive access evidence alone does not establish the intended resource isolation boundary."
      ],
      [
        "The model accepts one exact account and role pair. Can it certify AWS confused-deputy protection?",
        "No, real mechanism evidence is needed",
        "Yes, strings implement every condition",
        "Yes, account labels validate STS",
        "Yes, all external ids are public grants",
        "The predicate omits actual cross-account identity delivery and service-specific condition semantics."
      ],
      [
        "An engineer adds an external-id label but trusts every principal and action. What still needs correction?",
        "Trust and grant scope",
        "Only the label’s length",
        "Only the report title",
        "The account’s region nickname",
        "A supplemental condition is not a substitute for an appropriately constrained identity and permission design."
      ],
      [
        "A partner job retries a failed report request using another customer’s credentials. What boundary is violated?",
        "Customer-specific authority",
        "Only the retry’s time format",
        "Only the report’s suffix",
        "The provider’s logo policy",
        "Retries and recovery must preserve the intended identity, tenant and resource scope rather than substitute unrelated authority."
      ]
    ]
  },
  {
    "comp": "m3.c1",
    "title": "Keep encryption, peer verification and data permission separate",
    "intro": "A hospital encrypts storage and uses HTTPS for its API. Both controls matter, but neither makes every reader authorized. A service-mediated decrypted read can still disclose data when the application or IAM policy is too broad.",
    "headings": [
      "Understand the boundary",
      "Apply it to an operating decision",
      "Check the model and its limits"
    ],
    "sections": [
      [
        "Encryption at rest protects stored data under the service’s key and access model; encryption in transit protects communication under its negotiated properties. TLS peer verification is necessary to bind the intended endpoint, not merely to produce encrypted bytes. Keep certificate-chain and hostname verification enabled and correct the trust configuration when it fails.",
        "AWS KMS provides managed key capabilities and policy controls under the selected service integration. Data permissions, key permissions and service behavior interact; do not replace their documented evaluation with the claim that anyone knowing a key id may decrypt. Key identifiers are not secret key material, and encryption is not a substitute for least-privilege access."
      ],
      [
        "Review who may use or administer keys, what data paths invoke decryption, how keys are rotated or retired and what recovery depends on them. Deleting or disabling a required key can affect recoverability even when encrypted backups still exist. Administrative convenience should not silently grant every operator data-reading authority.",
        "The fixture creates a Python TLS client context and checks its certificate-required and hostname-check flags. It does not establish a connection or inspect an AWS key. This verifies a safe local default configuration, not complete TLS deployment, KMS policy or data authorization."
      ]
    ],
    "code": "import ssl\ncontext = ssl.create_default_context()\nprint(context.verify_mode == ssl.CERT_REQUIRED)\nprint(context.check_hostname)",
    "expect": "True\nTrue",
    "problem": "Inspect secure client-verification defaults without opening a socket.",
    "steps": [
      "Create the standard verified client context.",
      "Check certificate verification is required.",
      "Check hostname verification remains enabled."
    ],
    "limit": "Context flags do not perform a handshake, validate a real certificate chain or authorize access to encrypted cloud data.",
    "mistakes": [
      "Disabling TLS verification as the permanent fix for a trust error.",
      "Treating encrypted storage as permission for every service-mediated read."
    ],
    "takeaways": [
      "Protect transport identity and stored data under their real contracts.",
      "Review data and key authority as separate access boundaries."
    ],
    "practice": [
      [
        "What is encryption at rest distinct from?",
        "User authorization",
        "A stored-data protection",
        "A key-managed service feature",
        "A storage confidentiality control",
        "Cryptographic storage protection does not decide which authenticated user should receive plaintext data."
      ],
      [
        "Why verify the TLS hostname?",
        "To check the intended peer",
        "To grant every resource action",
        "To replace all chain trust",
        "To increase the port number",
        "Hostname verification helps bind the connection to its expected server identity."
      ],
      [
        "What is a KMS key id not equivalent to?",
        "Secret key material",
        "A resource identifier",
        "A policy reference",
        "A key-related label",
        "An identifier names a key resource and does not itself grant the cryptographic authority or reveal private key material."
      ],
      [
        "What should key administration review include?",
        "Use, lifecycle and recovery",
        "Only the key’s nickname",
        "Only its dashboard icon",
        "The file extension of a report",
        "Key controls can affect both disclosure and the ability to recover encrypted data later."
      ],
      [
        "Does encrypted backup existence prove restore access?",
        "No",
        "Always",
        "Only with long key names",
        "Only in one subnet",
        "Recovery also depends on usable keys, permissions, service behavior and a tested restoration path."
      ],
      [
        "What does the fixture inspect?",
        "TLS context flags",
        "A live AWS certificate",
        "An actual decrypted database",
        "Every KMS policy",
        "The code creates and inspects a local client context without connecting or calling a cloud API."
      ],
      [
        "What should a chain error lead to?",
        "Trust-configuration repair",
        "Permanent verification disablement",
        "Public release of the private key",
        "Administrator access for every caller",
        "A defensive repair restores the intended peer-validation property instead of removing it."
      ],
      [
        "Does the fixture open a socket?",
        "No",
        "Always on context creation",
        "Only for CERT_REQUIRED",
        "Only with hostname checking",
        "Constructing the context and reading its flags does not initiate a network handshake."
      ]
    ],
    "final": [
      [
        "Which access control remains important with encrypted storage?",
        "Who may receive plaintext",
        "Only the key’s display color",
        "Only the storage service name",
        "The number of console tabs",
        "Service-mediated reads can decrypt data for authorized callers, so those permissions must match the intended disclosure boundary."
      ],
      [
        "What does TLS configuration not establish by itself?",
        "A verified live connection",
        "A configured verification flag",
        "A client context object",
        "A declared hostname-check setting",
        "Flags indicate local configuration but a real handshake and intended target still need appropriate evidence."
      ],
      [
        "Why review key lifecycle in recovery planning?",
        "Key loss can block restoration",
        "Encrypted files restore without keys",
        "Key labels contain all plaintext",
        "Backups ignore every key policy",
        "Retained ciphertext may be unusable if required keys or permissions are unavailable."
      ],
      [
        "A hospital’s API decrypts and returns any patient file to any user. What failed?",
        "Application access control",
        "The mere presence of encryption",
        "The existence of a key id",
        "The count of stored objects",
        "Encryption does not repair an overly broad plaintext disclosure path."
      ],
      [
        "An engineer disables hostname checks to connect to an unexpected server. What property was weakened?",
        "Intended-peer assurance",
        "Only the URL’s formatting",
        "Only the response’s indentation",
        "The number of trusted role names",
        "Encrypted communication without the required peer binding can fail the client’s intended trust boundary."
      ],
      [
        "A key administrator role also receives broad data reads for convenience. What should be reviewed?",
        "Separation and least privilege",
        "Only the role’s spelling",
        "Only a more attractive chart",
        "The number of policy documents",
        "Administrative and data-use authority should follow actual operational needs rather than defaulting to a broad combined grant."
      ],
      [
        "A backup remains after its only required key is irrecoverably deleted. What risk exists?",
        "Loss of recoverability",
        "Automatic plaintext availability",
        "Guaranteed stronger restore speed",
        "A new public bucket by definition",
        "Stored encrypted bytes may not support recovery without their needed cryptographic access path."
      ],
      [
        "The local context shows both flags true. Can it certify a provider endpoint’s certificate is valid?",
        "No, no handshake occurred",
        "Yes, flags inspect every server",
        "Yes, all provider names are trusted",
        "Yes, CERT_REQUIRED grants storage access",
        "The test does not contact an endpoint or verify any actual certificate chain or hostname response."
      ],
      [
        "A caller has data permission but the relevant key path denies decryption. What distinction matters?",
        "Data and key authority",
        "Every read bypasses keys",
        "Identifiers are bearer secrets",
        "TLS flags replace KMS policy",
        "The integrated service operation can depend on separate data and cryptographic policy requirements under actual provider semantics."
      ],
      [
        "A team reports secure because transport is encrypted but never checks the expected hostname. What is missing?",
        "Peer identity validation",
        "Only a longer response body",
        "Only a new endpoint nickname",
        "The application’s font",
        "Transport confidentiality alone does not establish that the channel is connected to the intended trusted server."
      ]
    ]
  },
  {
    "comp": "m3.c1",
    "title": "Rotate secrets through delivery, overlap and retirement",
    "intro": "A customer-support worker needs a provider credential and must rotate it without losing service. Secret management is a lifecycle: protect storage and delivery, control readers, verify new use and retire old authority.",
    "headings": [
      "Understand the boundary",
      "Apply it to an operating decision",
      "Check the model and its limits"
    ],
    "sections": [
      [
        "A secret manager can centralize protected secret values and versioned access under its supported model. It does not make an excessive IAM grant safe or prevent an application from logging retrieved credentials. Keep secrets out of source control, public client assets, unreviewed diagnostics and broadly readable environment dumps.",
        "Rotation requires coordination with the system that validates the credential. Creating a new version is not proof the provider accepts it, every consumer has switched or the old value is revoked. Plan bounded overlap where supported, failure handling, validation and retirement according to the actual service contract."
      ],
      [
        "Separate secret metadata from secret values in operational evidence. Use safe version or request references without copying usable credentials. A leaked value may require revocation and exposure review, not merely deleting one file or changing the latest secret-store version.",
        "The fixture models two version labels and a consumer’s transition before retiring the old label. It does not store real credentials, contact a provider or prove every replica refreshed. It illustrates the ordering assumptions that real rotation must verify."
      ]
    ],
    "code": "accepted_versions = {\"v1-demo\", \"v2-demo\"}\nconsumer_version = \"v2-demo\"\nprint(consumer_version in accepted_versions)\naccepted_versions.remove(\"v1-demo\")\nprint(\"v1-demo\" in accepted_versions)\nprint(consumer_version in accepted_versions)",
    "expect": "True\nFalse\nTrue",
    "problem": "Observe a synthetic bounded-overlap rotation and old-version retirement.",
    "steps": [
      "Allow the declared two-version overlap.",
      "Move the modeled consumer to the new accepted label.",
      "Retire the old label and confirm the modeled consumer remains valid."
    ],
    "limit": "Version labels are not credentials; the local set does not validate provider acceptance or fleet-wide rotation and revocation.",
    "mistakes": [
      "Treating a new stored secret version as proof every consumer migrated.",
      "Deleting leaked text without revoking the actual credential."
    ],
    "takeaways": [
      "Verify acceptance and consumer use before retirement where the contract permits.",
      "Protect secret values while recording safe lifecycle evidence."
    ],
    "practice": [
      [
        "What does a secret manager not automatically prevent?",
        "Application secret logging",
        "Protected value storage",
        "A versioned lookup mechanism",
        "A policy-controlled read",
        "An application can still disclose a secret after retrieving it, so downstream handling matters."
      ],
      [
        "What should rotation verify?",
        "New acceptance and consumer use",
        "Only a changed display label",
        "Only the secret’s file extension",
        "Every user’s preferred theme",
        "A usable rotation needs evidence the new authority works and intended consumers actually use it."
      ],
      [
        "Does deleting leaked text revoke the credential?",
        "No",
        "Always",
        "Only in a private repository",
        "Only for short keys",
        "Removing one copy does not invalidate existing copies or the external system’s accepted authority."
      ],
      [
        "Why plan overlap carefully?",
        "Consumers can change at different times",
        "Old credentials should live forever",
        "Every provider accepts infinite versions",
        "Metadata automatically switches all replicas",
        "A defined overlap and retirement process can support migration without leaving unnecessary old authority."
      ],
      [
        "What should routine rotation logs contain?",
        "Safe version references",
        "Raw credential values",
        "Every authorization header",
        "Complete environment dumps",
        "Useful lifecycle evidence should avoid exposing the authority-bearing secret itself."
      ],
      [
        "What does the fixture retire?",
        "The v1-demo label",
        "A real provider key",
        "Every production session",
        "A live AWS role",
        "The local set removes a synthetic accepted-version label and invokes no external identity system."
      ],
      [
        "What if one replica still uses the old value?",
        "Retirement can break it",
        "Version creation updates every process",
        "All consumers share one memory set",
        "Old credentials can never expire",
        "Consumers need a verified refresh or transition plan before retiring authority they still depend on."
      ],
      [
        "Does the fixture prove fleet-wide refresh?",
        "No",
        "Always",
        "Only with two labels",
        "Only if all prints are true",
        "A single in-memory consumer does not observe multiple deployed processes or actual credential use."
      ]
    ],
    "final": [
      [
        "What must remain protected after secret retrieval?",
        "The usable value",
        "Only the display metadata",
        "Only the service’s logo",
        "The number of versions",
        "A protected store does not make the secret safe to log, send to clients or expose to unrelated readers."
      ],
      [
        "Why is creating a new version not complete rotation?",
        "Acceptance and migration remain",
        "Every provider accepts any new string",
        "All consumers update instantly",
        "Old values revoke themselves universally",
        "Rotation includes the validator and consumers as well as storing a replacement value."
      ],
      [
        "What does credential exposure require beyond deleting a file?",
        "Containment and revocation",
        "Only a new filename",
        "Only a hidden commit message",
        "A new browser tab",
        "Existing copies can remain usable, so incident response must address actual authority and exposure."
      ],
      [
        "A new secret works for one worker but others use cached old credentials. What must be verified before retirement?",
        "Consumer migration coverage",
        "Only the version label’s length",
        "Only the team’s status icon",
        "The number of documentation pages",
        "One successful consumer does not establish that the entire intended fleet has transitioned safely."
      ],
      [
        "A provider permits two active versions during migration. What should govern the overlap?",
        "A bounded verified lifecycle",
        "An indefinite permanent duplicate",
        "Only the newest dashboard color",
        "A guarantee all replicas are identical",
        "Overlap can support continuity, but old authority should be retired under a defined tested plan."
      ],
      [
        "A team rotates the stored value but never changes the provider credential. What is missing?",
        "The validator-side transition",
        "Only a more descriptive key name",
        "Only a new file suffix",
        "The region’s friendly label",
        "The actual system accepting the secret must recognize the replacement and retire old authority as required."
      ],
      [
        "A debug endpoint returns all retrieved secrets to speed diagnosis. What boundary failed?",
        "Sensitive-value disclosure",
        "Only the endpoint’s title",
        "Only the request’s font",
        "The number of stored versions",
        "Troubleshooting must preserve secret confidentiality rather than exposing reusable credentials through a new path."
      ],
      [
        "The fixture removes v1-demo. Can it certify the real old credential is revoked?",
        "No, no validator is contacted",
        "Yes, labels revoke every provider key",
        "Yes, Python sets update secret managers",
        "Yes, all consumers share this state",
        "The deterministic model has no external system or production credential and cannot establish actual revocation."
      ],
      [
        "A rotation fails midway and consumers disagree on versions. What does the runbook need?",
        "Recovery and reconciliation behavior",
        "Only a more attractive status page",
        "Only a larger secret description",
        "The number of source imports",
        "Partial lifecycle changes need bounded diagnosis and recovery without blindly leaving or removing authority."
      ],
      [
        "A report claims no exposure because only temporary environment dumps contained the secret. What is wrong?",
        "Those dumps are additional copies",
        "Environment output cannot carry secrets",
        "Temporary files revoke authority",
        "Only repositories can leak values",
        "Secret handling must account for every readable copy, including diagnostics, temporary files and logs."
      ]
    ]
  },
  {
    "comp": "m3.c1",
    "title": "Use cloud audit evidence with coverage, integrity and privacy limits",
    "intro": "A university investigates an unexpected storage permission change. Cloud audit records can identify API activity under configured coverage, but an event trail is not a universal record of every data interaction or a complete causal explanation.",
    "headings": [
      "Understand the boundary",
      "Apply it to an operating decision",
      "Check the model and its limits"
    ],
    "sections": [
      [
        "AWS CloudTrail records supported activity under the selected event and trail configuration. Management and data-event coverage, delivery, retention, regions and selected resources affect the evidence available. Review the actual settings before claiming an absence of events proves an absence of activity.",
        "Protect audit destinations, control readers and writers, monitor collection health and use supported integrity features where appropriate. A private trail can still expose sensitive identifiers and operational context to an overbroad reviewer. Preserve necessary evidence with consistent time interpretation and an appropriate retention policy."
      ],
      [
        "Correlate the authenticated principal context, action, resource, outcome and relevant configuration change. An assumed role’s session context may need additional organizational identity mapping; a familiar role name alone does not identify the human decision-maker. Distinguish denied attempts, accepted control-plane changes and verified downstream effects.",
        "The fixture filters synthetic audit events for a named resource and projects actor, action and outcome while excluding a private detail. It neither retrieves CloudTrail nor verifies signed logs, service-event coverage or live IAM behavior. The model teaches evidence selection and bounded conclusions."
      ]
    ],
    "code": "events = [{\"resource\":\"reports-demo\",\"actor\":\"role-demo\",\"action\":\"policy-change\",\"outcome\":\"accepted\",\"private\":\"SYNTHETIC\"}, {\"resource\":\"other\",\"actor\":\"role-demo\",\"action\":\"read\",\"outcome\":\"denied\"}]\nsafe = [{k:e[k] for k in (\"actor\",\"action\",\"outcome\")} for e in events if e[\"resource\"] == \"reports-demo\"]\nprint(safe)\nprint(all(\"private\" not in e for e in safe))",
    "expect": "[{'actor': 'role-demo', 'action': 'policy-change', 'outcome': 'accepted'}]\nTrue",
    "problem": "Select minimal synthetic audit evidence for a resource-change investigation.",
    "steps": [
      "Filter the relevant resource.",
      "Project declared nonsecret event fields.",
      "Check the excluded detail is absent from the emitted records."
    ],
    "limit": "The supplied-event filter does not inspect actual audit coverage, delivery, cryptographic integrity or effective cloud permissions.",
    "mistakes": [
      "Claiming no activity solely because one unconfigured event category has no records.",
      "Treating an accepted policy change as proof every downstream effect completed."
    ],
    "takeaways": [
      "State audit coverage and retention before interpreting gaps.",
      "Protect evidence while preserving enough context for accountable analysis."
    ],
    "practice": [
      [
        "What determines available audit coverage?",
        "The configured event scope",
        "Only a role’s friendly name",
        "Only the chart’s title",
        "Every user’s password length",
        "Event categories, selected resources, regions, retention and collection settings affect the available evidence."
      ],
      [
        "Does no record always prove no activity?",
        "No",
        "Always",
        "Only for managed services",
        "Only with long trail names",
        "Missing coverage, delivery or retention can leave evidence gaps that do not prove absence of activity."
      ],
      [
        "What should audit destination policy protect?",
        "Integrity and controlled access",
        "Only the log filename’s spelling",
        "A universal public read grant",
        "Every customer’s private key in plaintext",
        "Audit evidence needs protection against tampering and unnecessary disclosure."
      ],
      [
        "Why retain session context?",
        "Role names may not identify the operator",
        "Every role name is a human identity",
        "Session data always grants authority",
        "Only filenames can be correlated",
        "Assumed-role activity can require contextual mapping to the actual principal or organizational actor."
      ],
      [
        "What differs from an accepted control-plane change?",
        "Verified downstream effect",
        "A recorded accepted outcome",
        "An API response category",
        "A supplied audit event",
        "A service’s acceptance record may not establish all eventual effects or every data-plane consequence."
      ],
      [
        "What does the fixture exclude?",
        "The private detail field",
        "The selected actor label",
        "The action category",
        "The outcome category",
        "The allowlisted projection deliberately omits the supplied private property."
      ],
      [
        "What should an investigation preserve?",
        "Evidence and time context",
        "Only the newest reassuring label",
        "Every raw credential publicly",
        "No history after a denial",
        "Relevant protected evidence and consistent time semantics support accountable incident analysis."
      ],
      [
        "Does the fixture verify log signatures?",
        "No",
        "Always",
        "Only if a record is accepted",
        "Only for policy changes",
        "The local list transformation performs no cryptographic integrity or real cloud audit verification."
      ]
    ],
    "final": [
      [
        "What can make a trail incomplete for a particular question?",
        "Its selected event coverage",
        "Only the word audit in its name",
        "Only a longer role label",
        "The number of console icons",
        "The configured event categories and resource scope determine which activity the trail can support investigating."
      ],
      [
        "Why protect audit readers as well as writers?",
        "Evidence can disclose sensitive context",
        "Every audit record is public by definition",
        "Only modification can cause harm",
        "Read access automatically preserves privacy",
        "Operational events can reveal identities, resources and behavior even when raw credentials are excluded."
      ],
      [
        "A role is shared by automation and several humans. What is needed for attribution?",
        "Session and actor context",
        "Only the common role name",
        "Only the app’s logo",
        "The longest event message",
        "A role label alone may not identify the actual operator or initiating workload behind a recorded action."
      ],
      [
        "A trail records management events but not the data category needed by an investigation. What conclusion is valid?",
        "The evidence has a gap",
        "No data access occurred",
        "All users were denied",
        "The resource was never used",
        "Absence from an uncollected category cannot establish that the relevant activity did not happen."
      ],
      [
        "A policy-change API was accepted, but a dependent service still denies access. What should be distinguished?",
        "Control acceptance and effective behavior",
        "An accepted record guarantees all data paths",
        "The app must ignore policy",
        "Audit evidence has no meaning",
        "Propagation, policy interactions and actual request context require separate verification beyond one control-plane outcome."
      ],
      [
        "A security reviewer gets unrestricted access to logs containing sensitive identifiers for convenience. What needs review?",
        "Evidence-access scope",
        "Only the reviewer’s title",
        "Only a chart legend",
        "The number of search filters",
        "Audit utility does not justify unnecessary disclosure; access should match the investigation and retention policy."
      ],
      [
        "An incident script deletes old logs to reduce cost before legal retention review. What requirement may be violated?",
        "Evidence retention duties",
        "Only the filename’s style",
        "Only the search query length",
        "The number of cloud tags",
        "Cost actions must preserve applicable retention, investigation and governance needs rather than erase evidence indiscriminately."
      ],
      [
        "A trail-integrity feature is enabled but no one verifies collection health or expected event arrival. What remains uncertain?",
        "Coverage and delivery",
        "That a setting was selected",
        "That a feature has a name",
        "That configuration can be stored",
        "Integrity configuration alone does not prove the required events were collected and delivered under the actual system behavior."
      ],
      [
        "A synthetic audit projection hides one flat field. Can it certify all nested production logs are safe?",
        "No, schema-wide handling needs evidence",
        "Yes, one allowlist covers all future formats",
        "Yes, hidden fields revoke cloud credentials",
        "Yes, private data cannot enter nested objects",
        "A narrow supplied-record test does not establish complete disclosure handling for evolving real event structures."
      ],
      [
        "A denied API event appears near a successful data export from another role. What should analysis preserve?",
        "Distinct actor, action and outcome context",
        "Only the most alarming event",
        "A claim every nearby event has one actor",
        "A single role label for the whole incident",
        "Temporal proximity alone does not establish causation or identity equivalence across different recorded principals and operations."
      ]
    ]
  }
];
const refs=[
  {
    "id": "aws-vpc",
    "title": "AWS official vpc guidance",
    "url": "https://docs.aws.amazon.com/vpc/latest/userguide/configure-subnets.html",
    "source": {
      "kind": "official-http-snapshot",
      "repo": "aws/official-documentation-snapshots",
      "path": "vpc.html",
      "url": "https://docs.aws.amazon.com/vpc/latest/userguide/configure-subnets.html",
      "sha256": "de8b2629dbe58843a77003b9794be8ba853df48723d093fc044f5fb5ff07d3a8",
      "fetched_at": "2026-11-09T17:12:01.371616+00:00"
    }
  },
  {
    "id": "aws-security-groups",
    "title": "AWS official security groups guidance",
    "url": "https://docs.aws.amazon.com/vpc/latest/userguide/vpc-security-groups.html",
    "source": {
      "kind": "official-http-snapshot",
      "repo": "aws/official-documentation-snapshots",
      "path": "security-groups.html",
      "url": "https://docs.aws.amazon.com/vpc/latest/userguide/vpc-security-groups.html",
      "sha256": "d747896a3bc71b2bb0bdd5262c11d55124d8198fbe3d22a8d36293e30bea6699",
      "fetched_at": "2026-11-09T17:19:14.322047+00:00"
    }
  },
  {
    "id": "aws-network-acls",
    "title": "AWS official network acls guidance",
    "url": "https://docs.aws.amazon.com/vpc/latest/userguide/vpc-network-acls.html",
    "source": {
      "kind": "official-http-snapshot",
      "repo": "aws/official-documentation-snapshots",
      "path": "network-acls.html",
      "url": "https://docs.aws.amazon.com/vpc/latest/userguide/vpc-network-acls.html",
      "sha256": "85332c1c01af47c7a9947913aad1b305ac30bff77c66ba0699f94dfec96d4092",
      "fetched_at": "2026-11-09T17:19:14.929384+00:00"
    }
  },
  {
    "id": "aws-iam",
    "title": "AWS official iam guidance",
    "url": "https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html",
    "source": {
      "kind": "official-http-snapshot",
      "repo": "aws/official-documentation-snapshots",
      "path": "iam.html",
      "url": "https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html",
      "sha256": "c24c12bd1137f869f3aae0affec5d2bf81d05b5f7bcae5fc8a1569edf2cea8b0",
      "fetched_at": "2026-11-09T17:12:01.371827+00:00"
    }
  },
  {
    "id": "aws-policy-evaluation",
    "title": "AWS official policy evaluation guidance",
    "url": "https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic.html",
    "source": {
      "kind": "official-http-snapshot",
      "repo": "aws/official-documentation-snapshots",
      "path": "policy-evaluation.html",
      "url": "https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic.html",
      "sha256": "e14e7f9015beadc33105468ceb68e4ce16f35b138ba4c35824d1f85f0e3aa969",
      "fetched_at": "2026-11-09T17:19:15.596943+00:00"
    }
  },
  {
    "id": "aws-encryption",
    "title": "AWS official encryption guidance",
    "url": "https://docs.aws.amazon.com/kms/latest/developerguide/concepts.html",
    "source": {
      "kind": "official-http-snapshot",
      "repo": "aws/official-documentation-snapshots",
      "path": "encryption.html",
      "url": "https://docs.aws.amazon.com/kms/latest/developerguide/concepts.html",
      "sha256": "914f10c092f01ed45da4713901d72d3f6d0a638ea136ab3eec1812cf1e3b3f93",
      "fetched_at": "2026-11-09T17:12:01.371997+00:00"
    }
  },
  {
    "id": "aws-secrets",
    "title": "AWS official secrets guidance",
    "url": "https://docs.aws.amazon.com/secretsmanager/latest/userguide/intro.html",
    "source": {
      "kind": "official-http-snapshot",
      "repo": "aws/official-documentation-snapshots",
      "path": "secrets.html",
      "url": "https://docs.aws.amazon.com/secretsmanager/latest/userguide/intro.html",
      "sha256": "3757433d2c77ad110c0ab2bfd30e6bd9b89a29b9b3f42630bb8bcd91b43034b1",
      "fetched_at": "2026-11-09T17:19:15.972828+00:00"
    }
  },
  {
    "id": "aws-audit",
    "title": "AWS official audit guidance",
    "url": "https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-user-guide.html",
    "source": {
      "kind": "official-http-snapshot",
      "repo": "aws/official-documentation-snapshots",
      "path": "audit.html",
      "url": "https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-user-guide.html",
      "sha256": "34fed5e2e38b4d781a3d1f916e9fec97ba69f37166a85b9e2847c885959bae3c",
      "fetched_at": "2026-11-09T17:12:01.372130+00:00"
    }
  }
];
refs.push(pythonRef('ipaddress'),pythonRef('ssl'));
const built=build('cloud-networking-iam',data,refs);
module.exports=built.course;
Object.defineProperty(module.exports,'__bank',{value:built.bank,enumerable:false});
