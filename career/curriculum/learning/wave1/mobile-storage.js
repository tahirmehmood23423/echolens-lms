'use strict';
const {course}=require('./wave4-mobile-completion-private');
module.exports=course("mobile-storage",[
  {
    "id": "mobile-storage-choose-store",
    "title": "Choose storage from data shape and failure consequences",
    "comps": [
      "m1.c1"
    ],
    "intro": "Local storage is a set of tools with different contracts. A preference stores a small independent setting, a file stores a byte sequence, and a database provides structured querying and transactional changes. Start with access patterns, consistency and loss tolerance rather than picking the store already used by another screen.",
    "sections": [
      [
        "Mechanism and terminology",
        "A theme preference is a natural small key-value record. A downloaded map tile or photo is naturally a file. A searchable inspection history with related attachments, status filters and atomic edits benefits from a database. A large JSON blob can encode records, but every update then needs an explicit rewrite, concurrency and corruption policy. A database does not automatically turn blobs into efficiently queryable relational fields.",
        "Separate replaceable cache from authoritative unsynchronized data. A cache entry can be regenerated when the server or bundled source remains available. An offline inspection that has never synced may exist only on the device and needs a stronger durability and recovery policy. Ordinary preferences are not a secret vault; platform-backed secure storage belongs to the security boundary and requires its own threat and device tests."
      ],
      [
        "Application and verification",
        "A field inspector records one dark-mode choice, several photos and thousands of queryable findings. The settings store handles the theme, files hold photo bytes and a database indexes findings plus attachment metadata. The repository owns cross-store coordination: a database row referencing a file should not become visible as complete before the file is safely available.",
        "The fixture uses a real SQLite transaction to update a finding and its pending upload record together. This shows the relational operation boundary. It does not imply that a separate photo file joins that SQLite transaction, nor that a mobile plugin has been loaded."
      ]
    ],
    "lang": "python",
    "code": "import sqlite3\nc=sqlite3.connect(\":memory:\")\nc.executescript(\"CREATE TABLE finding(id INTEGER PRIMARY KEY,status TEXT);CREATE TABLE pending(id INTEGER PRIMARY KEY,finding_id INTEGER);\")\nwith c:\n c.execute(\"INSERT INTO finding VALUES(1,?)\",(\"draft\",))\n c.execute(\"INSERT INTO pending VALUES(9,1)\")\nprint(c.execute(\"SELECT status,(SELECT count(*) FROM pending) FROM finding\").fetchone())",
    "expect": "('draft', 1)",
    "problem": "Store a finding and its pending command atomically.",
    "steps": [
      "Create separate structured records.",
      "Commit both records in one transaction.",
      "Query the accepted business status and pending count."
    ],
    "limit": "Isolated Python executes actual standard-library SQLite or temporary-filesystem operations where used, and pure sync/capacity logic elsewhere. This is not a Room, Hive, sqflite, platform directory, secure-store or mobile background execution test. Device integration and educational review remain pending.",
    "mistakes": [
      "Using one preference key for a relational ledger moves query, migration and concurrency work into application code. Choose from the actual operations.",
      "Calling every local file a cache permits loss of unsynchronized user work. Classify data by recoverability."
    ],
    "takeaways": [
      "Match data shape to required operations.",
      "Define which local bytes can safely be regenerated."
    ],
    "practice": [
      "Which store commonly fits a small theme setting?|Key-value preferences|A full video file~The value is a small independent setting.|An image decoder~Decoding is not persistence.|A navigation stack~Routes do not provide durable preference storage.|Small independent non-secret settings fit a key-value contract.",
      "A photo\u2019s original byte sequence is naturally stored as what?|A file|A route parameter only~Route arguments do not persist its bytes.|A Boolean preference~A Boolean cannot represent the original image bytes.|A text color token~That describes visual configuration.|A file stores a byte sequence while metadata may live in a database.",
      "A searchable inspection ledger needs atomic related edits. Which store fits?|A transactional database|One unrelated key per pixel~That does not support the stated record queries.|Only a thumbnail cache~That does not retain structured ledger data.|Only a UI controller~Runtime UI resources are not durable storage.|Structured queries and multi-record consistency favor a transactional database.",
      "An unsent report exists only locally. Is it replaceable cache?|No, it is unsynced work|Yes, because it is local~Location does not establish regenerability.|Yes, if the icon is cached~An icon\u2019s classification does not transfer to user work.|Only after one app repaint~Rendering does not create a remote copy.|Loss of the only unsynchronized copy would lose user work.",
      "A database row and a separate photo file are written. Does SQLite commit both resources atomically?|No|Yes for any nearby filename~A transaction does not include arbitrary filesystem effects.|Only if extensions match~Filename suffixes do not define transaction membership.|Only in dark mode~Visual mode is unrelated to atomicity.|A SQLite transaction includes its database changes, not an independent file write.",
      "A map tile can be downloaded again. Which policy can fit its role?|Evictable cache|Only authoritative ledger~The stated source can regenerate it.|Permanent command journal~A tile is not an outstanding business command.|Identity credential vault~The data is not a credential.|Regenerable content can have a bounded cache and refetch policy."
    ],
    "formal": [
      "What capability most clearly distinguishes a relational database from a plain byte file?|Structured transactional queries|Automatic cross-device sync~Sync still needs an explicit protocol.|Guaranteed secret encryption~Encryption depends on the selected stack.|Mandatory network access~SQLite can operate locally.|A relational store provides query and transaction mechanisms over structured records.",
      "Which property makes data a cache rather than the only authoritative copy?|It can be regenerated|It has a short filename~Names do not define recoverability.|It is written in Dart~Language does not define data authority.|It is stored on Android~Platform does not determine regenerability.|Classification follows the existence of another usable source and loss tolerance.",
      "An inspector saves finding 8 and upload-command 31 in one transaction, then a constraint failure rolls back the transaction. What records remain from that attempt?|Neither record|Finding8 only~Both writes share the rolled-back transaction.|Command31 only~The command write also rolls back.|Both records~The transaction did not commit.|All participating writes are rolled back together on failure under the stated transaction policy.",
      "A 100 MB cache budget already holds tiles 60 MB and 90 MB. The 90 MB tile is protected by active use. What must a new 20 MB insert do under strict capacity?|Reject this insert|Evict only60MB~The protected 90 MB plus 20 MB still exceeds 100 MB.|Delete the active90MB tile~The stated policy protects it.|Relabel it as preferences~Renaming does not change capacity use.|The protected 90 MB plus the new 20 MB exceeds 100 MB even after evicting 60 MB, so the insert must be rejected under this policy.",
      "A team stores structured jobs in one JSON file. Which responsibility remains explicit?|Whole-file update consistency|Automatic SQL index tuning~A plain file does not create relational indexes.|Automatic plugin migrations~The format needs its own schema strategy.|Automatic multi-device merge~File storage does not define sync semantics.|Concurrent or interrupted rewrites require a deliberate consistency and recovery contract.",
      "A local edit commits alone; its separate outbox insert then fails. Existing outbox has 2 rows. What pair is saved edits from this attempt and total pending rows?|1/2|0/2~The edit already committed separately.|1/3~The failed insert adds no pending row.|0/3~That both loses a committed edit and counts a failed insert.|Separate commits can preserve the edit without inserting its required pending command.",
      "A 120 MB pool contains 20 MB unsynced photos and 80 MB regenerable tiles. A new 40 MB tile must fit; evict only replaceable bytes. What minimum tile eviction is required?|20MB|0MB~The new total is 140 MB and exceeds 120 MB.|40MB~Only 20 MB must be removed to meet the exact bound.|60MB~That removes more than the required capacity shortfall.|20+80+40=140 MB, so evict 20 MB of regenerable tiles while preserving unsynced photos.",
      "A credential is placed in plain preferences. Which separate boundary was overlooked?|Secret-storage protection|List scrolling speed~That does not protect credential storage.|Theme inheritance scope~Visual configuration is unrelated.|Widget key identity~Keys do not provide secure storage.|Credentials need an appropriate platform-backed secure-storage design and threat review.",
      "A job and outbox insert are separate autocommits. A crash occurs between them. Which state is possible?|Job without outbox work|Both rolled back by default~Separate autocommits have no shared rollback.|Outbox always written first~The stated order writes the job first.|No local change at all~The first commit can survive.|The gap can preserve the business edit without its required future synchronization work.",
      "Why must a storage decision include loss tolerance?|Recovery obligations differ|Every store has equal durability~Contracts and usage policies differ.|Smaller icons prevent loss~Appearance does not establish recovery.|All preferences are encrypted~That is not an ordinary preference guarantee.|Replaceable content and only-copy user work need different retention and failure policies."
    ],
    "quiz_count": 3,
    "formal_levels": [
      "E",
      "E",
      "H",
      "H",
      "M",
      "H",
      "A",
      "M",
      "H",
      "M"
    ],
    "formal_scenarios": [
      false,
      false,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true
    ],
    "formal_code": {
      "5": {
        "code": "edits=0\npending=2\nedits+=1\nfailed=True\nif not failed:pending+=1\nprint(f\"{edits}/{pending}\")",
        "expect": "1/2",
        "lang": "python"
      },
      "6": {
        "code": "required=max(0,20+80+40-120)\nprint(f\"{required}MB\")",
        "expect": "20MB",
        "lang": "python"
      }
    }
  },
  {
    "id": "mobile-storage-directories",
    "title": "Separate durable documents, caches and owned paths",
    "comps": [
      "m1.c2"
    ],
    "intro": "A mobile filesystem has locations with distinct retention, sharing and backup behavior. Choosing the right directory is part of the data contract. A path returned by a platform plugin is preferable to a hard-coded simulator path, and a cache directory must not be the only home for unsent customer work.",
    "sections": [
      [
        "Mechanism and terminology",
        "Temporary or cache locations can be cleared by the operating system or application policy. Application document or support locations are intended for longer-lived app data, with precise platform backup, visibility and deletion behavior checked against the supported operating systems. App removal, user data clearing and device loss are separate events; local durability is not a cross-device backup guarantee. Exported files and shared media need an explicit sharing and permission flow rather than assuming every app-private path is public.",
        "Treat filenames from users or APIs as untrusted path components. Resolve them beneath an owned root, reject traversal and avoid letting a display label become an arbitrary write target. A lexical containment check alone can be insufficient when untrusted symlinks or races are possible; restrict directory ownership and use appropriate platform file APIs. Record stable logical identifiers in metadata and resolve actual roots at runtime, since absolute sandbox paths may change."
      ],
      [
        "Application and verification",
        "A survey app stores unsynced measurements and reference images. Measurements belong in durable app storage; reference images may be cached when the remote source remains available. Exporting a report creates a separate artifact through a supported sharing workflow. Deleting the cache should not remove measurements or revoke the ability to reconcile pending work.",
        "The Python fixture creates a temporary owned root, resolves two candidate paths and checks containment. It exercises real path resolution in this Linux environment. It does not test mobile path_provider results, platform backup policy, secure file descriptors or resistance to a concurrent symlink attacker."
      ]
    ],
    "lang": "python",
    "code": "from pathlib import Path\nfrom tempfile import TemporaryDirectory\nwith TemporaryDirectory() as d:\n root=Path(d).resolve()\n for name in [\"reports/day.json\",\"../escape.json\"]:\n  p=(root/name).resolve()\n  print(p.is_relative_to(root))",
    "expect": "True\nFalse",
    "problem": "Reject a candidate path that escapes its owned root.",
    "steps": [
      "Create an isolated owned directory.",
      "Resolve a relative descendant and a traversal path.",
      "Compare each resolved path with the root boundary."
    ],
    "limit": "Isolated Python executes actual standard-library SQLite or temporary-filesystem operations where used, and pure sync/capacity logic elsewhere. This is not a Room, Hive, sqflite, platform directory, secure-store or mobile background execution test. Device integration and educational review remain pending.",
    "mistakes": [
      "Hard-coding one simulator sandbox path breaks portability and can break after reinstall. Resolve the platform-owned directory at runtime.",
      "A cache name does not make unsynced work recoverable. Keep the only copy outside casual eviction policy."
    ],
    "takeaways": [
      "Directory choice encodes retention and sharing expectations.",
      "Treat path containment and platform storage policy as explicit boundaries."
    ],
    "practice": [
      "Which directory class may be cleared as replaceable content?|Cache or temporary|Only a remote SQL table~The question concerns local directory retention.|Every durable journal always~Only-copy journals need a different policy.|Only the theme palette~A palette is not a directory class.|Cache storage is appropriate only when the loss and regeneration policy permits eviction.",
      "How should an app find its current private storage root?|Use platform directory APIs|Copy a simulator absolute path~That path is not a portable deployment contract.|Use a user\u2019s display name as root~Names do not define an owned directory.|Assume the root never moves~Sandbox paths can change.|Resolve supported platform directories rather than embedding one development-machine path.",
      "An unsynced survey is stored only in temporary files. What is the risk?|Eviction loses user work|Automatic server recovery~No server copy is stated.|Guaranteed backup on every device~Temporary files do not establish backup policy.|Only a label changes~The original measurement bytes can be lost.|The only authoritative local copy must not rely on an evictable directory.",
      "A root /app/data resolves candidate ../secret. Does the normalized path remain under that root?|No|Yes because it contains data text~Containment depends on path structure.|Only if extension is json~Suffixes do not determine ancestry.|Only in offline mode~Network state does not alter path resolution.|Parent traversal resolves outside the owned descendant boundary.",
      "Why store a logical file id rather than an old absolute sandbox path?|Resolve current root later|To bypass all access checks~Identity does not grant filesystem permission.|To make every file public~Sharing remains explicit.|To force every file into cache~Retention is a separate decision.|Stable metadata can be combined with the currently valid platform root.",
      "A report must be shared with another app. Which work remains?|Use a supported sharing flow|Expose all private directories~That broadens access beyond the report.|Assume private equals public~App-private files are not automatically available to others.|Rewrite every database table~That does not implement sharing.|Export or sharing should follow the target platform\u2019s supported access mechanism."
    ],
    "formal": [
      "What does a directory retention policy describe?|When its data may disappear|Which widget builds fastest~Rendering speed is unrelated to retention.|Which route returns a value~Routing is a separate contract.|Which color has more contrast~Color semantics do not define durability.|Retention determines whether removal is acceptable and what recovery must follow.",
      "What does a root containment check attempt to enforce?|Owned-subtree writes|Every file is encrypted~Containment does not provide encryption.|Every filename is unique~An owned root can contain conflicting names.|Every export is public~Sharing is separate from path ancestry.|The check constrains destination ancestry rather than unrelated confidentiality or identity properties.",
      "Root /data/app has candidate reports/../draft.txt. After normalization, where is it?|Inside as /data/app/draft.txt|Outside as /data/draft.txt~One reports parent cancels reports only.|Inside reports/draft.txt~The parent segment removes reports.|At filesystem root /draft.txt~The relative path does not climb that far.|Normalizing the intermediate reports segment preserves the app-owned root.",
      "Durable drafts use 40 MB, regenerable cache 60 MB. A cache-only cleanup removes 25 MB. How many draft bytes should it remove?|0MB|25MB~That would violate the cache-only boundary.|40MB~Drafts are not the cleanup target.|65MB~That combines unrelated quantities.|A cleanup scoped to replaceable cache must preserve durable draft storage.",
      "An old private path fails after reinstall. Which metadata design reduces path coupling?|Logical id plus current root|A longer old absolute path~It remains bound to the previous sandbox.|A path copied from another user~That introduces another invalid owner path.|A route title as filesystem root~Display navigation does not provide directory ownership.|Resolve the current platform root and derive the owned file from a stable identifier.",
      "A cache cleanup deletes cacheA and cacheB, while durable draftD and live staged fileS are excluded by reference policy. What retained identifiers remain?|D,S|S only~D is durable and excluded from cleanup.|D only~S has a live operation reference.|A,B~Those are the eligible cache targets.|The cleanup removes only the eligible cache entries and retains durable or referenced work.",
      "An owned root checks resolved candidates reports/a, reports/../../escape, and ../sibling/a. With no symlinks and a temporary absolute root, how many are descendants?|1/3|2/3~Both parent-escaping candidates resolve outside the root.|3/3~Relative input does not guarantee containment.|0/3~reports/a is a valid descendant.|Only the first candidate remains inside the owned root after normalization.",
      "Does app-private storage guarantee recovery after device loss?|No|Yes with any filename~A local filename is not a backup.|Only when labels are lowercase~Case does not establish remote recovery.|Only after one successful repaint~Rendering does not replicate data.|Local retention and cross-device recovery are different guarantees.",
      "A containment helper resolves symlinks once before a later write. What race remains possible under an untrusted directory owner?|Destination changes after checking|Integer overflow in text color~That does not concern filesystem ownership.|Automatic SQLite rollback~No database transaction is stated.|Every file becomes immutable~The helper does not create immutability.|A check-then-use gap may require stronger owned-directory or file-descriptor safeguards.",
      "What still needs device validation after the Linux path fixture?|Mobile roots and sharing|Python Boolean equality~The fixture executes it.|The supplied traversal example~The fixture evaluates it.|The printed True/False values~Those are checked outputs.|Linux path resolution does not exercise mobile directory plugins, backup policies or sharing APIs."
    ],
    "quiz_count": 3,
    "formal_levels": [
      "E",
      "E",
      "H",
      "H",
      "M",
      "H",
      "A",
      "M",
      "H",
      "M"
    ],
    "formal_scenarios": [
      false,
      false,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true
    ],
    "formal_code": {
      "5": {
        "code": "files={\"A\":\"cache\",\"B\":\"cache\",\"D\":\"durable\",\"S\":\"active\"}\nprint(\",\".join(k for k,v in files.items() if v!=\"cache\"))",
        "expect": "D,S",
        "lang": "python"
      },
      "6": {
        "code": "from pathlib import Path\nfrom tempfile import TemporaryDirectory\nwith TemporaryDirectory() as d:\n root=(Path(d)/\"owned\").resolve()\n names=[\"reports/a\",\"reports/../../escape\",\"../sibling/a\"]\n good=sum((root/n).resolve().is_relative_to(root) for n in names)\n print(f\"{good}/3\")",
        "expect": "1/3",
        "lang": "python"
      }
    }
  },
  {
    "id": "mobile-storage-file-commit",
    "title": "Publish file replacements with capacity and recovery rules",
    "comps": [
      "m1.c1",
      "m1.c2"
    ],
    "intro": "Updating a file safely involves more than calling write once. A process can stop during encoding, disk space can run out, and metadata can point to content that never became available. Define which complete version readers may observe and which temporary artifacts can be recovered or discarded.",
    "sections": [
      [
        "Mechanism and terminology",
        "For replaceable snapshots, a common approach writes a temporary file in the destination filesystem, validates it, then atomically replaces the destination using the platform-supported rename or replace operation. Atomic name replacement is narrower than durable persistence after power loss. Flushing file contents and, where required and supported, directory metadata belongs to a separate durability protocol. Cross-filesystem moves may not have the same atomic contract.",
        "A database and independent files need a recoverable coordination design. One option writes a staged file, records metadata as pending, publishes the file and then marks metadata complete. On startup, inspect pending records and orphan files using stable operation ids. Never let cleanup delete a staged file still referenced by a live operation. File checksums can detect changed bytes but do not authenticate an untrusted sender by themselves."
      ],
      [
        "Application and verification",
        "A route map update needs old content to remain usable until a complete new snapshot is ready. If old uses 30 MB and new needs 45 MB, a staging design may temporarily need 75 MB plus overhead. A 60 MB available budget cannot support both without another explicit policy, such as streamed external storage, rejecting the update or allowing loss of the old regenerable cache. User-created unsynced files must not be sacrificed by the cache policy.",
        "The fixture writes an old snapshot, writes a staged new snapshot and replaces the target using os.replace within one temporary filesystem. It reads the accepted bytes and checks that the staged name disappeared. It demonstrates this host filesystem operation, not mobile crash durability or platform-specific rename behavior."
      ]
    ],
    "lang": "python",
    "code": "import os\nfrom pathlib import Path\nfrom tempfile import TemporaryDirectory\nwith TemporaryDirectory() as d:\n p=Path(d)/\"snapshot\";t=Path(d)/\"staged\"\n p.write_text(\"old\");t.write_text(\"new\")\n os.replace(t,p)\n print(p.read_text());print(t.exists())",
    "expect": "new\nFalse",
    "problem": "Replace a complete snapshot without publishing partial staged text.",
    "steps": [
      "Keep the existing target while staging new content.",
      "Replace the target within the same filesystem.",
      "Read the final target and inspect the staged name."
    ],
    "limit": "Isolated Python executes actual standard-library SQLite or temporary-filesystem operations where used, and pure sync/capacity logic elsewhere. This is not a Room, Hive, sqflite, platform directory, secure-store or mobile background execution test. Device integration and educational review remain pending.",
    "mistakes": [
      "Deleting old data before confirming sufficient staging capacity can remove the usable copy unnecessarily. Calculate peak usage.",
      "Treating rename success as universal power-loss durability overstates the contract. Document flushing and recovery separately."
    ],
    "takeaways": [
      "Atomic visibility and power-loss durability are distinct.",
      "Cross-store coordination needs explicit recoverable states."
    ],
    "practice": [
      "Why stage a new snapshot before publishing it?|Avoid partial visible content|Guarantee every remote write~A local file operation cannot prove remote outcomes.|Remove all capacity needs~Staging can increase peak usage.|Replace all authentication checks~File staging is not identity verification.|Readers should observe a complete old or new snapshot under the chosen publication contract.",
      "What does a checksum primarily detect?|Changed bytes|Authorized sender identity~A plain checksum is not authentication.|Guaranteed disk durability~A digest does not force storage flushes.|User consent to sharing~Consent is a separate application boundary.|A digest can detect mismatch against expected content but needs a trusted source to establish authenticity.",
      "Old snapshot 20 MB and new 30 MB coexist during staging. Ignoring overhead, what peak space is needed?|50MB|30MB~That omits the retained old copy.|20MB~That omits the staged new copy.|10MB~The size difference is not peak occupancy.|Staging retains old 20 MB while writing new 30 MB, totaling 50 MB.",
      "A file was staged but its metadata remains pending after restart. What should recovery do?|Reconcile that operation id|Delete all durable drafts~That destroys unrelated work.|Assume upload success~Local staging does not prove remote completion.|Mark all files public~Sharing does not resolve publication state.|Stable operation identity lets recovery inspect the specific staged file and metadata state.",
      "Does os.replace in the fixture prove mobile power-loss durability?|No|Yes for every filesystem~The executed host operation does not establish every platform contract.|Only because filenames are short~Name length does not prove durability.|Only because Python is isolated~Isolation does not simulate sudden power loss.|The fixture validates host replacement behavior while platform durability needs further evidence.",
      "A cleanup sees an orphan-like staged file referenced by an active command. What should it do?|Respect the active reference|Delete it solely by suffix~A staging suffix does not establish abandonment.|Delete all command records first~That destroys the recovery relationship.|Overwrite another user\u2019s draft~That does not resolve ownership.|Cleanup must account for live references and operation states before deleting staged content."
    ],
    "formal": [
      "What is atomic file publication intended to provide?|A complete visible version|Automatic cloud backup~Publishing a local name does not replicate bytes.|Unlimited staging storage~Capacity remains finite.|A shared database transaction~Independent files do not join SQLite transactions automatically.|Atomic replacement narrows the visible transition rather than every durability or synchronization concern.",
      "What extra concern remains after a rename succeeds?|Power-loss durability|Whether addition works~Rename semantics do not concern arithmetic.|Every widget\u2019s local expansion state~That is unrelated to file durability.|The route title\u2019s spelling~That does not force durable persistence.|Visibility atomicity and flushing to durable media have distinct requirements.",
      "Old 35 MB and staged new 50 MB must coexist under an 80 MB budget. Ignoring overhead, what shortfall exists?|5MB|15MB~The total 85 exceeds 80 by 5, not 15.|0MB~Both copies do not fit together.|45MB~That subtracts unrelated values.|The required peak is 35+50=85 MB, so capacity is short by 5 MB.",
      "A file state machine runs staged\u2192published\u2192metadata-complete. Crash occurs after publish before final metadata. Which recovery action is consistent?|Inspect published file and finish metadata|Blindly discard every published file~That may remove a valid completed replacement.|Assume metadata must already be complete~The stated crash happened before that step.|Repeat a remote payment automatically~That is unrelated to file publication.|Recovery should reconcile the existing operation state rather than infer completion from missing callbacks.",
      "Why should temporary replacement files normally use the target filesystem?|Preserve the intended replace contract|Automatically encrypt the bytes~Filesystem co-location does not supply encryption.|Avoid every write permission check~Permissions still apply.|Guarantee infinite free space~Capacity is still bounded.|Cross-filesystem moves can have different visibility and failure semantics from same-filesystem replacement.",
      "Metadata starts pending, file is published, crash occurs before metadata-complete. Recovery verifies the expected file and commits completion. What final file/metadata pair follows?|published/complete|staged/complete~The file had already been published.|published/pending~The verified recovery completed the metadata.|missing/complete~No deletion occurred.|Recovery recognizes the published bytes and finishes the interrupted metadata transition.",
      "A 60 MB pool must retain old 30 MB while staging new 45 MB. Publication cannot start until full staging succeeds. What staging shortfall and visible version follow if no eviction is allowed?|15MB/old|0MB/new~The required 75 MB does not fit.|15MB/new~The new version cannot publish before complete staging.|30MB/missing~The old copy remains retained.|Peak 75 MB exceeds 60 MB by 15 MB, so staging is rejected and the old complete snapshot stays visible.",
      "A digest matches a value supplied by the same untrusted sender. What is still unestablished?|Authenticity of that sender|Equality of those supplied bytes~A digest can establish the expected-byte comparison.|Length of the digest string~That can be inspected directly.|Whether local comparison ran~Execution can verify comparison behavior.|An attacker can supply matching bytes and a matching checksum; trust must come from another boundary.",
      "A staged file is 10 MB, current target 15 MB, unrelated durable draft 20 MB. After successful replace, what snapshot-plus-draft footprint remains, ignoring overhead?|30MB|45MB~The old target no longer remains at the destination.|25MB~That omits the durable draft or uses the wrong snapshot size.|10MB~The unrelated draft remains present.|The new 10 MB snapshot plus untouched 20 MB draft totals 30 MB.",
      "What does startup reconciliation prevent in a two-store file workflow?|Abandoned intermediate states|All future disk failures~Recovery logic cannot eliminate physical failure.|Every authorization defect~Storage reconciliation is not access control.|All platform permission prompts~Permissions are a separate device concern.|Recovery can complete or repair staged/published metadata transitions left by interruption."
    ],
    "quiz_count": 3,
    "formal_levels": [
      "E",
      "E",
      "H",
      "H",
      "M",
      "H",
      "A",
      "M",
      "H",
      "M"
    ],
    "formal_scenarios": [
      false,
      false,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true
    ],
    "formal_code": {
      "5": {
        "code": "file=\"published\"\nmeta=\"pending\"\nverified=True\nif file==\"published\" and verified:meta=\"complete\"\nprint(f\"{file}/{meta}\")",
        "expect": "published/complete",
        "lang": "python"
      },
      "6": {
        "code": "budget=60\nold=30\nnew=45\nshort=max(0,old+new-budget)\nvisible=\"old\" if short else \"new\"\nprint(f\"{short}MB/{visible}\")",
        "expect": "15MB/old",
        "lang": "python"
      }
    }
  },
  {
    "id": "mobile-storage-schema",
    "title": "Model local identities, relationships and constraints",
    "comps": [
      "m2.c1"
    ],
    "intro": "A local database schema turns product rules into explicit relationships and constraints. A primary key identifies one record, a foreign key links records, and a CHECK or unique constraint rejects invalid states within its supported contract. These rules complement application validation and prevent alternate write paths from silently corrupting the model.",
    "sections": [
      [
        "Mechanism and terminology",
        "Choose stable local identifiers that can exist before a network connection. Keep a remote identifier separately when the server assigns it later. An attachment row can reference its inspection without storing a duplicated mutable inspection title as identity. Foreign-key enforcement must actually be enabled and verified on each relevant connection; declaring a relationship in prose or an object model is not enough.",
        "Store quantities and currency using intentional representations. Integer minor units avoid introducing binary floating rounding into ordinary fixed-currency arithmetic, while currency and scale still need a domain rule. A NOT NULL column blocks missing values but does not by itself reject an empty string. Parameterized statements separate supplied values from SQL syntax; concatenating a user\u2019s label into a query can change its meaning."
      ],
      [
        "Application and verification",
        "A stocktake stores inspections and item adjustments. Adjustment quantity must be nonnegative, each row belongs to an existing inspection, and an operation id must be unique to prevent duplicated local command insertion. Test those invariants through the same connections and migration paths the application uses. Room and Hive expose different modeling mechanisms; do not assume a SQLite foreign-key declaration describes every object-store adapter.",
        "The real SQLite fixture enables foreign keys, inserts a parent and valid child, then attempts an orphan. It captures an integrity error and counts the remaining valid rows. This verifies SQLite enforcement on this connection rather than Room annotations or a mobile plugin."
      ]
    ],
    "lang": "python",
    "code": "import sqlite3\nc=sqlite3.connect(\":memory:\");c.execute(\"PRAGMA foreign_keys=ON\")\nc.executescript(\"CREATE TABLE inspection(id INTEGER PRIMARY KEY);CREATE TABLE adjustment(id INTEGER PRIMARY KEY,inspection_id INTEGER REFERENCES inspection(id),qty INTEGER CHECK(qty>=0));INSERT INTO inspection VALUES(1);INSERT INTO adjustment VALUES(8,1,3);\")\ntry:c.execute(\"INSERT INTO adjustment VALUES(9,2,1)\")\nexcept sqlite3.IntegrityError:print(\"orphan rejected\")\nprint(c.execute(\"SELECT count(*) FROM adjustment\").fetchone()[0])",
    "expect": "orphan rejected\n1",
    "problem": "Reject an orphan while retaining a valid adjustment.",
    "steps": [
      "Enable enforcement on the actual connection.",
      "Create the parent and one valid child.",
      "Attempt an invalid reference and inspect the valid row count."
    ],
    "limit": "Isolated Python executes actual standard-library SQLite or temporary-filesystem operations where used, and pure sync/capacity logic elsewhere. This is not a Room, Hive, sqflite, platform directory, secure-store or mobile background execution test. Device integration and educational review remain pending.",
    "mistakes": [
      "A NOT NULL field still accepts an empty string unless another rule rejects it. Express the real domain constraint.",
      "Remote ids are unavailable before some offline creates. Use a stable local identity and explicit remote mapping."
    ],
    "takeaways": [
      "Identity and relationships must survive offline creation.",
      "Verify enforcement in the actual engine and connection configuration."
    ],
    "practice": [
      "What does a primary key identify?|One logical database row|Every file directory~A database row identity is not filesystem ancestry.|Only a color palette~Visual roles are unrelated.|Only a network socket~Connections are not row keys.|A primary key establishes a unique identity within its table.",
      "What does NOT NULL alone reject?|Missing SQL NULL values|Every empty string~Empty text is not SQL NULL.|Every negative integer~A separate bound is required.|Every duplicated filename~Uniqueness is a different constraint.|NOT NULL distinguishes missing values from other validly represented values.",
      "A child references parent 2 but only parent 1 exists with foreign keys enforced. What happens?|The orphan insert fails|Parent2 is invented automatically~A foreign key does not create parents.|The child silently refers to1~The engine does not rewrite supplied identity that way.|Every parent is deleted~That is not the insert behavior.|The relationship rejects a referenced parent identity that does not exist.",
      "A quantity has CHECK(qty>=0). Attempt qty=-1. Which result fits?|Constraint rejection|Automatic zero clamping~CHECK rejects rather than rewrites the value.|A new parent record~The quantity rule does not create parents.|Automatic retry with2~The engine does not choose a replacement quantity.|The declared check excludes negative stored quantities.",
      "A client creates an inspection offline before server assignment. What identity approach fits?|Local id plus remote mapping|Wait for a remote id always~That prevents the stated offline creation.|Use the current row index~Position can change and is not stable identity.|Use the displayed title alone~Titles may collide or change.|A stable local identity supports offline work while remote identity is mapped later.",
      "A supplied label contains a quote. What query construction handles it as data?|Bound parameters|SQL string concatenation~That mixes input with SQL syntax.|Dropping the whole table~That does not preserve the intended write.|Using a text color token~Styling does not bind SQL values.|Parameter binding separates values from statement syntax."
    ],
    "formal": [
      "What constraint typically blocks duplicate operation ids?|A unique constraint|A text theme~Presentation does not enforce row uniqueness.|A route stack~Navigation does not constrain database writes.|A cache size limit~Capacity is unrelated to identifier uniqueness.|Uniqueness can reject an already stored operation identity at the database boundary.",
      "What should be verified for SQLite foreign-key enforcement?|Actual connection settings|Only table names in slides~Documentation alone does not enable enforcement.|Only row display colors~Colors do not enforce references.|Only the operating-system logo~Platform branding does not establish this connection setting.|The runtime connection must enforce the relationship rather than merely declare it.",
      "A ledger stores prices in cents: items 250*3 and 175*2. What total minor units result?|1100|925~That omits one 175 item.|1275~That adds another 175 item.|425~That adds unit prices without quantities.|250*3+175*2=750+350=1100 minor units.",
      "A schema permits quantity>=0 and unique operation id. Existing opA has qty 4. A retry inserts opA qty 5. Which rule rejects it first relevant to identity?|The unique operation id|The nonnegative quantity check~Five satisfies that bound.|The text scale factor~That is not a database rule.|The remote timeout~No network behavior is involved.|A retry cannot create another row under the same constrained identity.",
      "Why keep remote identity separate from local identity for offline creates?|Remote assignment may happen later|Local ids must change each repaint~Stable identity should not follow rendering frequency.|All servers use row positions~That is not a reliable remote id contract.|Foreign keys require internet~Local enforcement does not require a network.|A pending local entity can exist before the server returns its mapping.",
      "A nonblank rule trims text and requires length>=4. Values are NULL, empty text, three spaces, and padded code. How many satisfy the complete rule?|1|0~The trimmed word code is valid.|2~Whitespace-only text is not nonblank.|3~Missing and empty values also fail.|Only the normalized four-character word satisfies both presence and length.",
      "SQLite foreign keys are enabled. Parent 1 exists and childA references 1. In one transaction insert childB referencing 1, then childC referencing 2. The orphan fails and rolls back. What child ids remain?|A|A,B~B belongs to the failed transaction.|A,B,C~The orphan violates the enforced relationship.|B~The prior committedA is not removed by rollback.|The failed transaction rolls backB andC while preserving prior committedA.",
      "Why is a SQLite schema test insufficient to validate Hive adapters?|Their storage models differ|SQL never runs locally~SQLite is a local engine.|Hive annotations are SQL constraints~Those contracts should not be assumed identical.|Foreign keys need a UI screen~The engine can enforce them independently.|Engine and adapter behavior must be validated under their actual APIs and data model.",
      "A table has unique op idsA,B,C. InsertingB again fails, thenD succeeds. What distinct op count remains?|4|3~D adds a new identity.|5~The duplicateB insert fails.|2~The failed insert does not remove existing rows.|Three existing unique rows plusD gives four; retryB contributes no new row.",
      "What does parameter binding protect at query construction time?|Values stay separate from SQL|Every user is authorized~Access permission remains separate.|Every disk write is durable~Binding does not flush storage.|Every schema migration succeeds~Migration needs its own validation.|Binding handles supplied values as data rather than concatenated SQL syntax."
    ],
    "quiz_count": 3,
    "formal_levels": [
      "E",
      "E",
      "H",
      "H",
      "M",
      "H",
      "A",
      "M",
      "H",
      "M"
    ],
    "formal_scenarios": [
      false,
      false,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true
    ],
    "formal_code": {
      "5": {
        "code": "values=[None,\"\",\"   \",\" code \"]\nprint(sum(v is not None and len(v.strip())>=4 for v in values))",
        "expect": "1",
        "lang": "python"
      },
      "6": {
        "code": "import sqlite3\nc=sqlite3.connect(\":memory:\");c.execute(\"PRAGMA foreign_keys=ON\")\nc.executescript(\"CREATE TABLE p(id INTEGER PRIMARY KEY);CREATE TABLE ch(id TEXT PRIMARY KEY,pid INTEGER REFERENCES p(id));INSERT INTO p VALUES(1);INSERT INTO ch VALUES('A',1);\")\ntry:\n with c:\n  c.execute(\"INSERT INTO ch VALUES('B',1)\")\n  c.execute(\"INSERT INTO ch VALUES('C',2)\")\nexcept sqlite3.IntegrityError:pass\nprint(\",\".join(x[0] for x in c.execute(\"SELECT id FROM ch ORDER BY id\")))",
        "expect": "A",
        "lang": "python"
      }
    }
  },
  {
    "id": "mobile-storage-migrations",
    "title": "Migrate installed data through explicit version paths",
    "comps": [
      "m2.c1"
    ],
    "intro": "A schema migration changes the shape of data that users already have. New installations and upgrades follow different starting conditions. A CREATE TABLE statement that works on an empty database is not evidence that a device upgrading from an older release will preserve its records.",
    "sections": [
      [
        "Mechanism and terminology",
        "Version each supported schema and define ordered upgrade steps. A device moving from version 1 to 3 may need both 1\u21922 and 2\u21923, unless a tested direct path provides the same result. Adding a non-null field requires a valid default or a backfill before enforcement. Rebuilding a table can preserve rows only when the copy explicitly maps old fields to new fields and the transaction handles failure without silently destroying the original data.",
        "Treat destructive fallback as a product data-loss decision, not an ordinary migration shortcut. Replaceable caches may be recreated under an explicit policy; unsynced work generally cannot. Inspect row counts, key relationships, preserved values and query behavior after each supported upgrade. A schema version marker must agree with the actual completed schema; update it within the migration\u2019s successful transaction boundary."
      ],
      [
        "Application and verification",
        "An installed inspection database has id and title in version 1. Version 2 adds a status defaulting to draft; version 3 adds an operation-id column for pending work. Test upgrades from each retained release, including nonempty and boundary data. A failed backfill must not leave the database claiming version 3 while the required fields remain absent.",
        "The fixture performs an actual SQLite ALTER TABLE and PRAGMA user_version update inside a transaction. It queries the old row\u2019s new default and the version marker. This validates the SQL path on host SQLite; Room migration registration and mobile plugin startup require their own tests."
      ]
    ],
    "lang": "python",
    "code": "import sqlite3\nc=sqlite3.connect(\":memory:\")\nc.executescript(\"CREATE TABLE report(id INTEGER PRIMARY KEY,title TEXT);INSERT INTO report VALUES(1,'roof');PRAGMA user_version=1;\")\nc.execute(\"BEGIN\")\nwith c:\n c.execute(\"ALTER TABLE report ADD COLUMN status TEXT NOT NULL DEFAULT 'draft'\")\n c.execute(\"PRAGMA user_version=2\")\nprint(c.execute(\"SELECT title,status FROM report\").fetchone());print(c.execute(\"PRAGMA user_version\").fetchone()[0])",
    "expect": "('roof', 'draft')\n2",
    "problem": "Upgrade an existing row without deleting its title.",
    "steps": [
      "Create nonempty version 1 data.",
      "Add the required field with a valid default.",
      "Advance the version and inspect preserved data."
    ],
    "limit": "Isolated Python executes actual standard-library SQLite or temporary-filesystem operations where used, and pure sync/capacity logic elsewhere. This is not a Room, Hive, sqflite, platform directory, secure-store or mobile background execution test. Device integration and educational review remain pending.",
    "mistakes": [
      "Testing only a fresh install misses the installed-data path. Keep upgrade fixtures for supported old versions.",
      "Setting the version before a failing change makes metadata lie about the schema. Commit the successful path together."
    ],
    "takeaways": [
      "Migration correctness includes preserved user data.",
      "Version markers describe completed structure rather than intended work."
    ],
    "practice": [
      "What is a schema migration?|An installed-data upgrade|Only a new app icon~Icons do not transform stored records.|Only a route push~Navigation does not change schema.|Only a cache lookup~Lookup does not upgrade structure.|A migration changes an existing storage schema and its data according to an explicit version path.",
      "Why test with nonempty old data?|Verify preservation and backfill|Empty databases contain every edge case~They cannot reveal lost old values.|Only to measure label width~Rendering width is unrelated to migration correctness.|Only to rename release notes~Notes do not execute upgrade SQL.|Installed rows expose preservation and transformation requirements absent from a fresh schema.",
      "Version 1\u21923 uses steps 1\u21922 and 2\u21923. Which steps must a version 1 device receive?|Both ordered steps|Only2\u21923~Version 1 lacks changes supplied by the first step.|Neither after app repaint~Rendering does not migrate storage.|Only a new title string~That does not perform the schema transformations.|The upgrade path must establish all required intermediate or equivalent final transformations.",
      "A required status is added to existing rows. What must be planned?|A valid default or backfill|Only a larger icon~That cannot supply stored values.|A random deletion of all rows~That loses installed user data.|Only a route parameter~Navigation input is not a persistent migration.|Existing rows need values satisfying the new constraint.",
      "A migration fails halfway. What should its version marker describe?|The last completed schema|The hoped-for future schema~Intention does not establish completed structure.|Every release at once~One actual stored schema needs an accurate marker.|The current theme mode~Presentation is unrelated to schema version.|Version metadata should agree with the successfully committed database state.",
      "When may destructive recreation be reasonable?|Explicitly replaceable cache|Every unsent report automatically~That can erase the only user copy.|Every pending payment command~That destroys recovery evidence.|Whenever a label changes~A UI change does not justify data loss.|Recreation needs an explicit loss policy and a source capable of regenerating the data."
    ],
    "formal": [
      "What distinguishes fresh-install tests from migration tests?|Their starting schema and data|Only the test filename~Actual fixture state determines coverage.|Only the screen orientation~That does not define schema history.|Only the current wallpaper~That is unrelated to stored structure.|Upgrade tests begin with older installed structure and records that must be transformed safely.",
      "What should a migration version marker indicate?|Successfully installed structure|Only the package download time~Downloading does not complete the database upgrade.|Only a requested future schema~Requests can fail.|Only a server\u2019s label text~The local schema needs its own accurate state.|The marker must correspond to the schema and data actually available after successful commit.",
      "An upgrade copies 120 rows but its filter mistakenly excludes 15 archived records that must be retained. How many records are lost?|15|105~That is the number retained, not lost.|120~Some rows were copied successfully.|0~The retention requirement includes archived rows.|The mistaken exclusion drops 15 required existing records.",
      "A v 1 row title='roof' gains status DEFAULT 'draft'. Which post-migration row is correct?|roof/draft|blank/draft~The old title must be preserved.|roof/NULL~The new required default supplies draft.|draft/roof~That swaps the fields.|The additive migration preserves the title and supplies the configured required default.",
      "Why should upgrade tests include the oldest supported release?|Users may skip releases|Every device upgrades weekly~Release adoption is not guaranteed.|Old schema disappears on download~The installed database persists independently.|Routes automatically backfill columns~Navigation does not transform records.|The application must handle supported devices that have not installed intermediate releases.",
      "A migration marker is 2. Step 2\u21923 commits; step 3\u21924 starts then fails and rolls back. What completed marker should recovery observe?|3|2~The first step already committed successfully.|4~The failed second step did not commit.|0~Rollback does not delete the previously committed marker.|The marker advances only with a successful committed schema step.",
      "A version 1 SQLite table has 2 rows. An explicit BEGIN adds status and sets user_version 2, then an injected failure rolls back. What version/column-count/row-count remains?|1/2/2|2/3/2~Both schema and marker changes were uncommitted and roll back.|1/3/2~The explicit transaction rolls back the added column too.|1/2/0~The prior committed rows remain.|An explicit SQLite transaction rolls back these DDL and marker changes, preserving the old two-column, two-row database.",
      "What should be reviewed beyond row counts after migration?|Values, keys and query behavior|Only the release logo~That does not validate transformed data.|Only file name length~It cannot establish field preservation.|Only the settings screen color~Presentation does not prove schema correctness.|Equal counts can still hide swapped fields, broken relations or changed query semantics.",
      "A device moves v 2\u2192v 4 using steps 2\u21923 and 3\u21924. The first adds 4 fields and the second adds 2. How many new fields arise under the stated additive path?|6|4~The second upgrade also applies.|2~The first upgrade also applies.|8~That counts unstated additions.|Four additions followed by two additions produce six new fields on that path.",
      "Does successful host ALTER TABLE prove Room migration registration works?|No|Yes for every app build~The host SQL test does not load the mobile registration.|Only if the database has one row~Row count does not test Room wiring.|Only if the title is ASCII~Text content does not establish registration.|The SQL mechanism and the mobile framework\u2019s upgrade invocation are separate validation boundaries."
    ],
    "quiz_count": 3,
    "formal_levels": [
      "E",
      "E",
      "H",
      "H",
      "M",
      "H",
      "A",
      "M",
      "H",
      "M"
    ],
    "formal_scenarios": [
      false,
      false,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true
    ],
    "formal_code": {
      "5": {
        "code": "marker=2\nmarker=3\nproposed=4\nfailed=True\nif not failed:marker=proposed\nprint(marker)",
        "expect": "3",
        "lang": "python"
      },
      "6": {
        "code": "import sqlite3\nc=sqlite3.connect(\":memory:\")\nc.executescript(\"CREATE TABLE t(id INTEGER PRIMARY KEY,label TEXT);INSERT INTO t VALUES(1,'a');INSERT INTO t VALUES(2,'b');PRAGMA user_version=1;\")\ntry:\n c.execute(\"BEGIN\")\n with c:\n  c.execute(\"ALTER TABLE t ADD COLUMN status TEXT DEFAULT 'draft'\")\n  c.execute(\"PRAGMA user_version=2\")\n  raise RuntimeError()\nexcept RuntimeError:pass\nv=c.execute(\"PRAGMA user_version\").fetchone()[0]\ncols=len(c.execute(\"PRAGMA table_info(t)\").fetchall())\nn=c.execute(\"SELECT count(*) FROM t\").fetchone()[0]\nprint(f\"{v}/{cols}/{n}\")",
        "expect": "1/2/2",
        "lang": "python"
      }
    }
  },
  {
    "id": "mobile-storage-transactions",
    "title": "Use atomic writes, bound parameters and selective queries",
    "comps": [
      "m2.c1"
    ],
    "intro": "A local transaction groups related database changes so a failure can leave the prior committed state intact. It does not automatically include HTTP requests or independent files. Keep the transaction boundary focused on the invariants that the local engine can actually enforce.",
    "sections": [
      [
        "Mechanism and terminology",
        "For a balance transfer, debit and credit must either both commit or both roll back. A command journal can similarly update business state and insert its outbox record in one local transaction. Awaiting a remote service while holding a local write transaction can increase lock duration and still does not create a distributed transaction. Record durable intent locally, release the transaction, then reconcile the remote result through a separate protocol.",
        "Query only needed records and columns, using bound parameters and an index aligned with real filters and ordering. A composite index on owner_id,status can help a query constrained by its leading owner field; it is not a universal acceleration for every unrelated predicate. Use EXPLAIN QUERY PLAN and realistic volumes to inspect the engine\u2019s plan. Deterministic ordering needs a stable tie-breaker when timestamps can match."
      ],
      [
        "Application and verification",
        "A courier wallet transfer debits one account and credits another. A second constraint failure must roll back the debit. The app also lists pending jobs by owner and state with a stable id order. Validate correctness before benchmarking; an extremely fast query that misses a tenant predicate is still wrong.",
        "The actual SQLite fixture starts two balances, attempts an invalid debit under CHECK(balance>=0) inside a transaction and confirms that both stored balances remain unchanged. This proves the tested rollback mechanism, not mobile concurrency, Room scheduling or remote payment settlement."
      ]
    ],
    "lang": "python",
    "code": "import sqlite3\nc=sqlite3.connect(\":memory:\")\nc.executescript(\"CREATE TABLE wallet(id INTEGER PRIMARY KEY,balance INTEGER CHECK(balance>=0));INSERT INTO wallet VALUES(1,40);INSERT INTO wallet VALUES(2,60);\")\ntry:\n with c:\n  c.execute(\"UPDATE wallet SET balance=balance+50 WHERE id=2\")\n  c.execute(\"UPDATE wallet SET balance=balance-50 WHERE id=1\")\nexcept sqlite3.IntegrityError:print(\"rolled back\")\nprint(c.execute(\"SELECT balance FROM wallet ORDER BY id\").fetchall())",
    "expect": "rolled back\n[(40,), (60,)]",
    "problem": "Roll back both sides when one transfer update violates a constraint.",
    "steps": [
      "Start with known committed balances.",
      "Attempt both updates in one transaction.",
      "Catch the failure and inspect both stored balances."
    ],
    "limit": "Isolated Python executes actual standard-library SQLite or temporary-filesystem operations where used, and pure sync/capacity logic elsewhere. This is not a Room, Hive, sqflite, platform directory, secure-store or mobile background execution test. Device integration and educational review remain pending.",
    "mistakes": [
      "Holding a database transaction across a slow HTTP call does not make the server part of that transaction. Separate local intent from remote settlement.",
      "An index on the wrong leading columns may not support the intended query. Inspect the real plan and workload."
    ],
    "takeaways": [
      "Local atomicity covers participating database operations.",
      "Correct filters and deterministic order precede query optimization."
    ],
    "practice": [
      "What does rollback restore under a failed local transaction?|Prior committed DB state|Every remote server side effect~Remote effects are outside an ordinary SQLite transaction.|Every deleted photo globally~Independent files do not automatically participate.|The last widget title only~Rollback concerns stored database changes.|Participating uncommitted database writes are undone under the tested transaction contract.",
      "What should supplied query values use?|Bound parameters|Raw SQL concatenation~That mixes values with executable syntax.|Only a widget key~Keys do not bind database values.|A hard-coded simulator path~Paths do not parameterize statements.|Binding separates query structure from supplied data.",
      "Balances 40 and 60 receive a transactional +50 to second then invalid -50 from first. What balances remain after rollback?|40 and60|40 and110~The first update must also roll back.|-10 and110~That violates the constraint and ignores rollback.|0 and100~No clamping transfer policy was stated.|Both changes belong to one failed transaction, so prior committed balances remain.",
      "Two records share a timestamp. Which ordering makes pagination deterministic?|Timestamp plus stable id|Timestamp alone~Ties remain unordered under that key alone.|Only the current label width~Layout is unrelated to record order.|Random order on each request~That destabilizes page boundaries.|A stable tie-breaker defines order when the main sort value is equal.",
      "Does an HTTP call join a SQLite transaction automatically?|No|Yes when awaited~Await controls sequencing, not distributed atomicity.|Only if URLs are short~URL length does not define transaction membership.|Only if rows are cached~Caching does not enlist the server.|Local transaction mechanisms do not control independent remote service commits.",
      "An index is added for owner,status. What validates its usefulness?|Inspect its query plan|Only count index names~Names do not prove plan selection or benefit.|Only inspect app colors~Presentation is unrelated to access paths.|Only rename the route~Routing does not change the query\u2019s index contract.|Use the engine\u2019s plan and representative workload to assess the actual query."
    ],
    "formal": [
      "Which work normally belongs inside a short local transaction?|Related local writes|A user typing for ten minutes~Interactive waiting would retain an unnecessary transaction lifetime.|An unbounded remote upload~It is outside local atomicity and can prolong locks.|Every animation frame~Frames do not define persistence boundaries.|Group local operations that need one atomic outcome and avoid unrelated waiting.",
      "What does EXPLAIN QUERY PLAN help inspect?|The chosen access strategy|The user\u2019s consent history~Query planning is unrelated to permissions.|Every network retry delay~That belongs to transport behavior.|The image\u2019s pixel colors~Rendering is not a database access path.|The engine can expose whether and how it searches tables and indexes.",
      "A transfer begins 100 and 50, moves 30 successfully, then a separate failed transfer of 90 rolls back. What balances remain?|70 and80|10 and140~That applies the rejected second transfer.|100 and50~The first transaction already committed.|0 and150~No clamping policy is stated.|The successful first transfer persists; the failed later transaction preserves 70 and 80.",
      "A query filters owner=A and status=pending. Data has A pending 3,A done 4,B pending 5. How many rows match?|3|8~That omits the owner filter.|7~That includes A\u2019s done rows.|12~That ignores both predicates.|Both predicates must hold, leaving the three pending rows owned byA.",
      "Why include a tie-breaker in a timestamp-sorted job feed?|Equal timestamps need stable order|It encrypts each row~Ordering does not provide encryption.|It replaces owner authorization~Filter and access checks remain separate.|It guarantees every page is cached~Caching is another policy.|Stable order prevents ambiguous boundaries among rows with identical primary sort values.",
      "An owner/status filter targets A,pending. Rows are (A,pending),(B,pending),(A,done),(A,pending). What count should a correctly scoped query return?|2|3~That includes another owner or a done row.|4~That ignores both predicates.|1~There are two matching A pending rows.|Both owner and status predicates must hold for each returned row.",
      "Balances 80,20 undergo successful atomic transfer 30, then a failed atomic transfer 70 from the first. What balances and committed-transfer count remain?|50/50/1|-20/120/2~The second transfer violates the nonnegative bound and rolls back.|80/20/0~The first transfer already committed.|50/120/1~The credit from the failed second transfer must roll back too.|The first transfer commits 50/50; the second fails atomically, preserving both balances and one committed transfer.",
      "A composite index begins owner_id,status. What should not be assumed without plan evidence?|It accelerates every status-only query|It can support relevant owner filtering~That leading predicate aligns with the index structure.|It has a defined column order~The declaration establishes that order.|It occupies storage~Indexes consume storage for their maintained structure.|Index usefulness depends on predicate shape, engine decisions and workload.",
      "Two independent autocommits perform debit then credit; a crash follows debit. What inconsistency can remain?|Debit without credit|Both automatically rolled back~The debit already committed independently.|A valid atomic transfer always~There was no shared transaction.|Credit without debit under this order~The crash occurred before the credit.|Separate commits expose an intermediate business state that one transaction would avoid.",
      "What remains after host rollback verification for mobile adoption?|Plugin and concurrency tests|Only more tuple formatting~That does not exercise mobile transaction wiring.|Only changing row ids~That repeats the same host mechanism.|Only printing the same balances~Those values were already checked.|The engine fixture complements adapter, lifecycle and multi-connection behavior validation."
    ],
    "quiz_count": 3,
    "formal_levels": [
      "E",
      "E",
      "H",
      "H",
      "M",
      "H",
      "A",
      "M",
      "H",
      "M"
    ],
    "formal_scenarios": [
      false,
      false,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true
    ],
    "formal_code": {
      "5": {
        "code": "rows=[(\"A\",\"pending\"),(\"B\",\"pending\"),(\"A\",\"done\"),(\"A\",\"pending\")]\nprint(sum(a==\"A\" and b==\"pending\" for a,b in rows))",
        "expect": "2",
        "lang": "python"
      },
      "6": {
        "code": "import sqlite3\nc=sqlite3.connect(\":memory:\")\nc.executescript(\"CREATE TABLE w(id INTEGER PRIMARY KEY,b INTEGER CHECK(b>=0));INSERT INTO w VALUES(1,80);INSERT INTO w VALUES(2,20);\")\ncommits=0\nfor amount in [30,70]:\n try:\n  with c:\n   c.execute(\"UPDATE w SET b=b-? WHERE id=1\",(amount,))\n   c.execute(\"UPDATE w SET b=b+? WHERE id=2\",(amount,))\n  commits+=1\n except sqlite3.IntegrityError:pass\na,b=[x[0] for x in c.execute(\"SELECT b FROM w ORDER BY id\")]\nprint(f\"{a}/{b}/{commits}\")",
        "expect": "50/50/1",
        "lang": "python"
      }
    }
  },
  {
    "id": "mobile-storage-outbox",
    "title": "Commit offline intent and retry with stable operation identity",
    "comps": [
      "m3.c1"
    ],
    "intro": "Offline-first editing means a user can make a local accepted change before the network succeeds. A durable outbox records which remote commands remain outstanding. The local edit and its outbox insertion should share one database transaction so an interruption cannot save the edit without its future synchronization intent.",
    "sections": [
      [
        "Mechanism and terminology",
        "Assign an operation id before the first send and keep it for retries of the same business intent. The server must implement an idempotency contract that recognizes this identity; merely putting a key in a request does not guarantee deduplication. A timeout means the client lacks a definitive outcome, not that the server definitely rejected or rolled back the command. Keep enough durable state to reconcile that uncertainty.",
        "Model pending, in-flight and acknowledged work with explicit transitions. Recover interrupted in-flight work by inspecting leases or a persisted retry policy rather than leaving it stuck forever. A bounded batch controls memory and data usage. Successful delivery should mark or remove only the acknowledged operation ids; an acknowledgement for one batch must not erase later edits added while the request was in flight."
      ],
      [
        "Application and verification",
        "A delivery app records parcel notes in a tunnel. Each note edit updates the local record and inserts a unique pending command. When connectivity returns, the worker sends a bounded set, retries with the same ids when outcomes are ambiguous, and acknowledges only confirmed commands. The server still enforces user access and validates the note. The UI can label data as locally saved while sync is pending instead of claiming a remote save.",
        "The SQLite fixture atomically inserts one note and one outbox operation, then acknowledges the operation. It reports preserved business content and an empty pending queue. The fixture tests local mechanics only; background scheduling and a real server idempotency endpoint remain unexecuted."
      ]
    ],
    "lang": "python",
    "code": "import sqlite3\nc=sqlite3.connect(\":memory:\")\nc.executescript(\"CREATE TABLE note(id INTEGER PRIMARY KEY,body TEXT);CREATE TABLE outbox(op TEXT PRIMARY KEY,note_id INTEGER);\")\nwith c:\n c.execute(\"INSERT INTO note VALUES(1,?)\",(\"left at desk\",))\n c.execute(\"INSERT INTO outbox VALUES(?,1)\",(\"op-1\",))\nwith c:c.execute(\"DELETE FROM outbox WHERE op=?\",(\"op-1\",))\nprint(c.execute(\"SELECT body FROM note\").fetchone()[0]);print(c.execute(\"SELECT count(*) FROM outbox\").fetchone()[0])",
    "expect": "left at desk\n0",
    "problem": "Acknowledge synchronization without deleting the saved note.",
    "steps": [
      "Commit note and stable operation id together.",
      "Acknowledge that exact operation.",
      "Inspect note preservation and pending queue count."
    ],
    "limit": "Isolated Python executes actual standard-library SQLite or temporary-filesystem operations where used, and pure sync/capacity logic elsewhere. This is not a Room, Hive, sqflite, platform directory, secure-store or mobile background execution test. Device integration and educational review remain pending.",
    "mistakes": [
      "Generating a new id for every retry can make one intent look like several commands. Reuse its operation identity.",
      "Deleting the whole outbox after one response can erase edits created during the request. Acknowledge exact ids."
    ],
    "takeaways": [
      "Durable intent survives UI and process lifetimes.",
      "Ambiguous remote outcomes require identity and reconciliation."
    ],
    "practice": [
      "What does an outbox record retain?|Pending remote intent|Only the screen\u2019s text size~Typography is unrelated to outstanding synchronization.|A guaranteed server rollback~An outbox cannot undo an accepted remote effect.|Only a route animation~Routes are not durable command journals.|The outbox records work that must be delivered or reconciled after a local accepted change.",
      "Which id should a retry of the same intent use?|The original operation id|A new random id every attempt~That can represent duplicate business intents remotely.|The current widget index~Position is not stable command identity.|The text color\u2019s name~Visual roles do not identify operations.|Stable identity lets a supported server protocol recognize repeated delivery of one intent.",
      "Outbox starts A,B; worker sendsA, then user addsC; A is acknowledged. What remains pending?|B,C|Nothing~OnlyA was acknowledged.|A,B,C~The confirmedA may leave the pending set.|C only~B was not part of the acknowledgement.|Acknowledge the exact confirmed operation without deleting unrelated pending work.",
      "A send times out after reaching the server. What outcome is known?|The client lacks confirmation|The server certainly rolled back~Timeout does not prove remote transaction outcome.|The command certainly never arrived~The scenario states it reached the server.|The local edit must disappear~Local acceptance has its own durable state.|The server may have committed; reconcile or retry under its idempotency contract.",
      "Where should local edit and outbox insertion be committed?|One local transaction|Separate unrelated autocommits~A crash can split state from intent.|Only inside an image callback~Image loading does not own the business edit.|Only after every paint~Rendering frequency is not a persistence boundary.|The two local writes represent one accepted state transition and should share its atomic boundary.",
      "An acknowledgement names op 7. Which queued record may it remove?|op7 only|Every later operation~Those were not acknowledged.|Every user\u2019s queue~The acknowledgement is not global permission.|Every local business row~Acknowledging delivery does not require deleting saved records.|Precise acknowledgement preserves outstanding intent and its business data."
    ],
    "formal": [
      "What does a timeout prove about a remote write?|Confirmation was not received|The server never committed~It may have completed before the response was lost.|The local database rolled back~The remote timeout does not define local transaction outcome.|The user never requested it~An operation was already sent.|Timeout is an observation gap that may require reconciliation of an already completed effect.",
      "Which boundary must support idempotency for retries to deduplicate remote commands?|The server protocol|Only a button color~Presentation cannot deduplicate server effects.|Only the widget key~UI identity is unrelated to server command identity.|Only a map tile cache~That has no authority over remote transactions.|A stable client id must be recognized and enforced by the remote endpoint\u2019s contract.",
      "Pending idsA,B,C are sent asA,B; response confirmsB only, thenD is added. What remains pending?|A,C,D|C,D~A lacks confirmation.|A,B,C,D~B was confirmed.|D only~C was never sent andA was not acknowledged.|RemoveB only and preserve every unconfirmed or newly created operation.",
      "A batch size is 20 and pending count 47. With all requests succeeding, how many batches are needed?|3|2~Two batches can carry at most 40.|4~Three batches already cover 47.|47~Each batch can carry more than one operation.|20+20+7 operations require three bounded batches.",
      "An in-flight marker survives process death with no worker owning it. What should startup recovery consider?|Lease or retry reconciliation|Treat it as permanently done~No acknowledgement is stated.|Keep it stuck forever~That prevents eventual delivery.|Delete its unsynced business data~That loses accepted work.|Interrupted ownership needs a recoverable transition back into valid delivery or reconciliation work.",
      "Pending operations start P,Q. BatchP is sent; R is added; acknowledgement covers P only, then Q fails without confirmation. Which pending order remains?|Q,R|P,Q,R~P has been acknowledged.|R~Q remains unconfirmed after failure.|Q~R was newly added and remains pending.|Only the acknowledged operationP leaves the queue; failure does not confirmQ.",
      "A note edit uses operationX. First send commits remotely but response is lost; retryX is deduplicated by the server; exact acknowledgement removesX. What remote-effect and local-pending counts remain?|1/0|2/0~The stated server contract deduplicatesX.|1/1~The exact acknowledgement removesX from pending.|0/0~The first send did commit remotely.|Two deliveries under one supported operation identity create one effect, then confirmed local intent leaves the queue.",
      "A key is attached to requests but server ignores it. What guarantee is missing?|Remote deduplication|Local parameter binding~That concerns SQL query construction.|A visible loading spinner~It does not determine server behavior.|A stable file extension~That is unrelated to command identity.|Client identity alone cannot force a server to treat repeated deliveries as one intent.",
      "A transaction inserts both local row and outbox. Its second write fails before commit. What state should survive from that attempt?|Neither new row|Only the local row~The shared transaction rolls back both writes.|Only the outbox~Its insert failed and the transaction is rolled back.|Both new rows~The transaction did not commit.|Atomic local acceptance prevents orphan intent or an edit without its required pending command.",
      "What mobile behavior remains untested by a host SQLite outbox fixture?|Mobile worker invocation|The SQL delete predicate~The fixture executes it.|The saved note text~The fixture reads it.|The pending count query~The fixture executes it.|A host database test does not exercise operating-system background limits or actual mobile worker invocation."
    ],
    "quiz_count": 3,
    "formal_levels": [
      "E",
      "E",
      "H",
      "H",
      "M",
      "H",
      "A",
      "M",
      "H",
      "M"
    ],
    "formal_scenarios": [
      false,
      false,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true
    ],
    "formal_code": {
      "5": {
        "code": "pending=[\"P\",\"Q\"]\npending.append(\"R\")\npending=[x for x in pending if x!=\"P\"]\nprint(\",\".join(pending))",
        "expect": "Q,R",
        "lang": "python"
      },
      "6": {
        "code": "seen=set()\neffects=0\npending={\"X\"}\nfor op in [\"X\",\"X\"]:\n if op not in seen:seen.add(op);effects+=1\npending.discard(\"X\")\nprint(f\"{effects}/{len(pending)}\")",
        "expect": "1/0",
        "lang": "python"
      }
    }
  },
  {
    "id": "mobile-storage-conflicts",
    "title": "Detect concurrent edits and choose a domain merge policy",
    "comps": [
      "m3.c1"
    ],
    "intro": "Synchronization is not only delivery. Two devices can edit the same record from the same earlier version. A conflict policy defines whether changes can be merged, whether one replaces another, or whether a user or trusted service must resolve the disagreement. The correct choice depends on the meaning of the data.",
    "sections": [
      [
        "Mechanism and terminology",
        "Use a server revision or equivalent concurrency token to express the version on which an edit was based. A conditional update can reject a stale base rather than silently overwriting a newer value. Device wall-clock timestamps are not a reliable global ordering guarantee because clocks can differ. Last-write-wins may be acceptable for some preferences but can lose meaningful concurrent work in notes, stock counts or financial actions.",
        "Independent fields can sometimes merge when both changed different fields from a known common base. If both changed the same field incompatibly, preserve the conflict or apply a justified domain rule. Additive counters can use operation-based deltas under a deduplicated protocol, while replacing snapshots of counters can lose concurrent increments. Deletion may require a tombstone so an offline device does not re-upload an old record as if it were a new create."
      ],
      [
        "Application and verification",
        "Two technicians start from revision 4. One changes an inspection note while the other changes priority. A three-way merge can retain both if the common base and field-level rules establish nonoverlap. If both replace the same note, concatenating strings automatically may create nonsense; preserve enough evidence for a deliberate resolution. A server revision protects against stale overwrites but does not decide which domain merge is acceptable.",
        "The fixture implements a three-way field merge over a common base. It accepts independent local and remote edits and reports a conflict when both changed one field differently. This executes deterministic merge logic without claiming a complete synchronization protocol or a mobile storage adapter."
      ]
    ],
    "lang": "python",
    "code": "base={\"note\":\"base\",\"priority\":1}\nlocal={\"note\":\"local\",\"priority\":1}\nremote={\"note\":\"base\",\"priority\":2}\nmerged={}\nfor k in base:\n if local[k]==base[k]:merged[k]=remote[k]\n elif remote[k]==base[k] or local[k]==remote[k]:merged[k]=local[k]\n else:merged[k]=\"CONFLICT\"\nprint(merged[\"note\"],merged[\"priority\"])\nprint(\"CONFLICT\" if \"local\"!=\"base\" and \"remote\"!=\"base\" and \"local\"!=\"remote\" else \"merged\")",
    "expect": "local 2\nCONFLICT",
    "problem": "Merge nonoverlapping fields and identify an incompatible same-field edit.",
    "steps": [
      "Compare each branch with the common base.",
      "Keep independent changes when the rule permits.",
      "Reject automatic resolution of incompatible replacements."
    ],
    "limit": "Isolated Python executes actual standard-library SQLite or temporary-filesystem operations where used, and pure sync/capacity logic elsewhere. This is not a Room, Hive, sqflite, platform directory, secure-store or mobile background execution test. Device integration and educational review remain pending.",
    "mistakes": [
      "Comparing device timestamps alone assumes synchronized clocks and a valid loss policy. Prefer explicit revisions and domain rules.",
      "Using snapshot replacement for independently incremented counters can lose work. Model accepted operations when the domain permits it."
    ],
    "takeaways": [
      "Conflict detection and conflict resolution are different responsibilities.",
      "Merge according to domain meaning and retained evidence."
    ],
    "practice": [
      "What does a base revision represent?|The version an edit assumed|Only the latest widget count~Rendering is unrelated to concurrency history.|Every device\u2019s wall-clock time~A revision need not be a timestamp.|Only the storage directory name~Paths do not define record version.|A concurrency token identifies the prior state on which the attempted change was based.",
      "What is a tombstone in a sync design?|A retained deletion marker|A second image thumbnail~Images do not represent record deletion.|A cache capacity number~Capacity is a different policy.|A route transition label~Navigation does not convey durable deletion intent.|A deletion marker can prevent obsolete offline records from being mistaken for new creates.",
      "Base noteA,priority 1; local changes noteB; remote changes priority 2. Under independent-field merge, what follows?|noteB,priority2|noteA,priority2~That loses the independent local note edit.|noteB,priority1~That loses the independent remote priority edit.|noteA,priority1~That discards both changes.|Each branch changed a different field from the common base, allowing the stated merge.",
      "Both branches replace noteA with differentB andC. What should the stated conflict-detection rule report?|A same-field conflict|Guaranteed merge asB~That chooses a winner without a domain rule.|Guaranteed merge asC~That chooses a winner without a domain rule.|No change fromA~That silently discards both edits.|Both changed the same base field incompatibly, so independent-field merge cannot choose a result.",
      "Why can device timestamps misorder edits?|Device clocks may differ|SQL forbids timestamps~Timestamps can be stored but do not guarantee shared time.|Every clock is server-certified~That cannot be assumed.|Only dark mode changes time~Visual policy is unrelated to clock accuracy.|Wall clocks on separate devices do not establish a reliable total order of business events.",
      "A server rejects an update based on stale revision 4 after revision 5 exists. What has it detected?|Concurrent-version mismatch|Automatic successful merge~Detection does not choose a merge result.|A local image decode error~That is unrelated to record revision.|A guaranteed lost network packet~The mismatch is a data-version concern.|The client\u2019s assumed prior state no longer matches the current server revision."
    ],
    "formal": [
      "What additional decision follows conflict detection?|A domain resolution policy|Always delete both copies~That loses evidence without justification.|Always trust the largest phone clock~Clocks do not define universal correctness.|Always concatenate numeric strings~That is not a valid general domain merge.|Detecting disagreement does not determine which merged or selected result is appropriate.",
      "Which case can support a three-way nonoverlapping-field merge?|Different fields changed from one base|One common field changed differently~That needs a conflict rule.|No retained common base ever~Without the base, change attribution is harder.|Every financial action by replacement~Financial meaning needs a specific protocol.|The base lets the merge identify independent changes rather than guess from final snapshots.",
      "A counter starts 10. DeviceA accepts +2 andB +3, with deduplicated additive operations. What merged count follows?|15|13~That losesA\u2019s increment.|12~That losesB\u2019s increment.|25~That adds full snapshots rather than deltas.|Apply each accepted delta once:10+2+3=15.",
      "A record is deleted at revision 8 while an offline client retains revision 6. What can a tombstone prevent?|Obsolete resurrection|Every future authorized create~A new identity can follow a separate create policy.|All device storage failures~Deletion markers do not repair hardware.|Every network timeout~Transport reliability is a different concern.|A retained deletion version lets sync reject an old record as obsolete rather than recreating it blindly.",
      "What is risky about last-write-wins on a shared free-text note?|It may discard concurrent work|It always preserves both meanings~A single winner can lose another edit.|It makes clocks irrelevant always~Timestamp-based winners depend on a time policy.|It supplies automatic user consent~Conflict policy does not establish consent.|The policy chooses one replacement and may lose valuable information from another branch.",
      "Strict conditional updates start revision 7,value 10. Edit(base 7,value 12) succeeds and advances to 8; edit(base 7,value 13) follows. Which revision/value remains?|8/12|8/13~The second edit uses a stale base and must be rejected.|7/10~The first edit was valid and committed.|9/13~That accepts the stale update as another revision.|Only the first supplied base matches current revision, so the stale replacement cannot overwrite it.",
      "Base x 1,y 1; local x 2,y 1; remote x 3,y 2. Three-way merge marks incompatible same-field changes as conflict and retains independent changes. What pair follows?|conflict/2|2/2~Both branches changedx differently, so 2 is not an automatic winner.|3/1~That choosesx without policy and loses remote y.|1/1~That discards the branch changes.|x conflicts because both branches differ from base and each other; only remote changedy.",
      "Why should deleted records retain sync evidence for an explicit period?|Offline replicas may still hold them|Every tombstone must live forever~Retention should follow the replication and product policy.|It reduces image dimensions~That is unrelated to deletion knowledge.|It forces every client online instantly~Markers cannot control network availability.|Deletion knowledge must remain available long enough for the supported reconciliation contract.",
      "Two clients replace counter 10 with 12 and 13 using naive last-write-wins. What increment total can be lost if 13 wins?|The +2 from the other client|No increments can be lost~The winner preserves only one replacement snapshot.|The entire starting10 always~The winning snapshot still contains the base.|A guaranteed +15~That is not one client\u2019s lost delta.|The 13 snapshot includesB\u2019s +3 but omitsA\u2019s independent +2.",
      "What does the merge fixture leave unvalidated?|Server and mobile sync integration|Dictionary field comparison~The fixture executes that logic.|The independent-field result~The fixture prints it.|The same-field conflict predicate~The fixture evaluates it.|A deterministic local merge example does not implement server revisions, device storage or background delivery."
    ],
    "quiz_count": 3,
    "formal_levels": [
      "E",
      "E",
      "H",
      "H",
      "M",
      "H",
      "A",
      "M",
      "H",
      "M"
    ],
    "formal_scenarios": [
      false,
      false,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true
    ],
    "formal_code": {
      "5": {
        "code": "rev=7\nvalue=10\nfor base,new in [(7,12),(7,13)]:\n if base==rev:rev+=1;value=new\nprint(f\"{rev}/{value}\")",
        "expect": "8/12",
        "lang": "python"
      },
      "6": {
        "code": "base={\"x\":1,\"y\":1}\nl={\"x\":2,\"y\":1};r={\"x\":3,\"y\":2};out={}\nfor k in base:\n if l[k]==base[k]:out[k]=r[k]\n elif r[k]==base[k] or l[k]==r[k]:out[k]=l[k]\n else:out[k]=\"conflict\"\nprint(f\"{out['x']}/{out['y']}\")",
        "expect": "conflict/2",
        "lang": "python"
      }
    }
  },
  {
    "id": "mobile-storage-recovery",
    "title": "Reconcile interrupted sync, retention and acknowledged evidence",
    "comps": [
      "m3.c1"
    ],
    "intro": "A reliable offline feature must explain what happens after interruption. A process may stop after local commit, after sending a command, after remote commit or before acknowledging locally. Recovery uses durable operation identity and observed state to decide what can be retried, reconciled, retained or safely removed.",
    "sections": [
      [
        "Mechanism and terminology",
        "Distinguish pending local intent, an uncertain remote outcome and a confirmed remote acknowledgement. The client can retry an uncertain command under a supported idempotency contract or query its status, then update local evidence. A UI timeout or process death cannot prove remote failure. A retry backoff policy controls load, and a maximum retry count should move work into a visible recoverable state rather than silently declaring success.",
        "Retention must preserve evidence needed by other replicas and active operations. Evicting old cache entries is different from deleting acknowledged journal entries, tombstones or unsynced attachments. Garbage collection should check references, age or server watermark rules and actual acknowledgement state. A sync cursor must advance only after its corresponding data changes commit, otherwise a crash can cause the next run to skip records never applied locally."
      ],
      [
        "Application and verification",
        "An inspection app downloads changes after cursor 100. It applies changes 101..110 and cursor 110 in one transaction. If the write fails, both remain at the prior committed state so the next attempt can replay. Upload recovery similarly keeps operation ids for ambiguous outcomes and exposes a pending or failed-to-sync badge without erasing the local accepted report. Test restart boundaries explicitly rather than relying on a happy-path send.",
        "The SQLite fixture stages an update and cursor advance in one transaction, injects an exception and checks that old data and cursor remain. It then retries successfully. This verifies atomic replay eligibility in the host engine, not real process termination, OS background execution or a live synchronization endpoint."
      ]
    ],
    "lang": "python",
    "code": "import sqlite3\nc=sqlite3.connect(\":memory:\")\nc.executescript(\"CREATE TABLE meta(cursor INTEGER);INSERT INTO meta VALUES(100);CREATE TABLE item(id INTEGER PRIMARY KEY,value TEXT);\")\ntry:\n with c:\n  c.execute(\"INSERT INTO item VALUES(101,'new')\")\n  c.execute(\"UPDATE meta SET cursor=101\")\n  raise RuntimeError(\"interrupted\")\nexcept RuntimeError:pass\nprint(c.execute(\"SELECT cursor FROM meta\").fetchone()[0],c.execute(\"SELECT count(*) FROM item\").fetchone()[0])\nwith c:\n c.execute(\"INSERT INTO item VALUES(101,'new')\")\n c.execute(\"UPDATE meta SET cursor=101\")\nprint(c.execute(\"SELECT cursor FROM meta\").fetchone()[0],c.execute(\"SELECT count(*) FROM item\").fetchone()[0])",
    "expect": "100 0\n101 1",
    "problem": "Keep the replay cursor consistent with applied downloaded rows.",
    "steps": [
      "Begin at committed cursor 100 with no items.",
      "Inject failure after both uncommitted changes and inspect rollback.",
      "Retry the atomic data/cursor update successfully."
    ],
    "limit": "Isolated Python executes actual standard-library SQLite or temporary-filesystem operations where used, and pure sync/capacity logic elsewhere. This is not a Room, Hive, sqflite, platform directory, secure-store or mobile background execution test. Device integration and educational review remain pending.",
    "mistakes": [
      "Advancing a cursor before committing downloaded data can skip changes forever after interruption. Commit data and cursor together.",
      "Dropping a failed queue item after a retry limit hides unsynced intent. Move it to an explicit recoverable state."
    ],
    "takeaways": [
      "Recovery needs evidence about durable state, not only callbacks.",
      "Cleanup and cursor movement must preserve replay and acknowledgement invariants."
    ],
    "practice": [
      "What should a sync cursor describe?|Committed applied progress|Only the last response received~Receipt does not prove the data committed.|The screen\u2019s scroll position~That is a different kind of cursor.|The newest requested future change~A request may fail before application.|The cursor must match the remote range successfully applied to local durable state.",
      "What should happen when retries reach a configured limit?|Expose recoverable pending failure|Pretend synchronization succeeded~No acknowledgement exists.|Erase unsynced user work~That destroys accepted intent.|Delete every tombstone~That is unrelated to the failed command.|A retry limit changes the recovery path and visibility, not the truth of remote completion.",
      "Cursor 100 and row 101 are updated in one transaction that rolls back. What cursor and new-row count remain?|100/0|101/0~The cursor must roll back with the data.|100/1~The row was not committed.|101/1~The transaction failed.|Atomic rollback preserves the prior cursor and leaves the new row unapplied.",
      "A command remotely commits but the app dies before local acknowledgement. What recovery state is possible?|Pending with uncertain remote outcome|Guaranteed remote failure~The remote commit already occurred.|No local intent ever existed~The app had a command to send.|Automatic rollback across devices~Process death cannot undo the server commit.|The local durable queue may still show pending until status or idempotent retry reconciles it.",
      "A cache cleanup sees unsynced attachment bytes. What rule should apply?|Preserve unsynced references|Delete them as old files~Age alone does not make the only copy replaceable.|Mark the command acknowledged~Cleanup cannot invent server confirmation.|Advance the download cursor~That does not resolve upload state.|Retention must preserve content required by outstanding local intent.",
      "What should a backoff policy primarily control?|Retry timing and load|Whether every write committed~Timing does not prove remote outcome.|The user\u2019s authentication role~Backoff is not access control.|Every schema column type~Migrations define schema shape.|Backoff spaces retry attempts without changing their semantic success or failure."
    ],
    "formal": [
      "What state warrants remote outcome reconciliation?|An ambiguous sent command|Only a decorative icon~That does not represent remote intent.|Every untouched preference~There is no pending remote effect.|A completed local sort~It has no uncertain server outcome.|A send that may have committed without confirmation needs status evidence or a safe retry protocol.",
      "What must garbage collection consider for synchronization artifacts?|References and ack policy|Only filename length~That does not establish safe deletion.|Only current text scale~Presentation size is unrelated.|Only whether an icon is blue~Color does not prove retention eligibility.|Deletion must preserve evidence and bytes still needed by active operations or replicas.",
      "Cursor 20 is advanced to 25 before data 21..25 commits; the data write fails. What can the next cursor-based fetch skip?|Changes21..25|Only change20~The advanced cursor starts after 25.|Every change after25~Those remain in the future fetch range.|No changes under any protocol~The marker no longer reflects applied data.|The cursor falsely claims progress and may exclude the missing range from replay.",
      "Retry delays are 1,2,4 seconds before three attempts. Ignoring request time, what total delay is imposed?|7 seconds|4 seconds~That counts only the final delay.|6 seconds~1+2+4 is 7.|8 seconds~No fourth delay is stated.|The cumulative wait is 1+2+4=7 seconds under the supplied schedule.",
      "A confirmed opA and uncertain opB share one report. Which operation may leave the pending set under exact-ack policy?|A only|B only~Its outcome remains uncertain.|Both automatically~A\u2019s acknowledgement does not confirmB.|Neither forever~ConfirmedA can advance according to retention policy.|Acknowledgement is specific evidence for the named operation rather than all work on the same report.",
      "A batch at cursor 50 applies rows 51,52 and proposes cursor 52, but rolls back. A retry then commits both rows and cursor. What final cursor and stored-new-row count follow?|52/2|50/0~That omits the successful retry.|52/4~Rolled-back rows do not duplicate the retry rows.|50/2~The retry commits its cursor with the rows.|Rollback leaves the prior state; one successful replay commits two rows and cursor 52.",
      "QueueA is confirmed, B uncertain, C pending. Cleanup removes confirmed only. B is reconciled committed and acknowledged, cleanup runs again. What remains pending?|C|A,C~A was already confirmed and eligible for cleanup.|B,C~B became confirmed before the second cleanup.|empty~C has never been acknowledged.|Only confirmed identities leave the pending set, so unconfirmedC remains.",
      "Why is an injected transaction exception weaker than a device crash test?|It does not simulate OS termination|It fails to run SQL at all~The fixture executes real SQLite statements.|It never verifies rollback~The fixture queries the post-failure state.|It cannot compare cursor values~Those values are directly inspected.|Controlled exceptions validate one rollback path but not process death, disk flushing or platform scheduling.",
      "A worker removes records older than 7 days; one 9-day attachment is the only copy for an unsynced op. What does a reference-aware policy require?|Preserve or escalate that attachment|Delete solely by age~The live operation still requires the only copy.|Mark its server upload successful~No acknowledgement is available.|Delete all newer attachments too~That broadens unnecessary loss.|Retention age must not override the requirement to preserve outstanding user intent without an explicit recovery decision.",
      "What remains human-review pending after these executable fixtures?|Domain policy and device integration|Whether the printed tuple exists~Execution already verifies supplied output.|Whether integer addition works~The arithmetic is executed.|Whether the SQL statements ran~The isolated runner provides that evidence.|Technical mechanisms support review, while domain tradeoffs, educational quality and platform behavior require further evaluation."
    ],
    "quiz_count": 3,
    "formal_levels": [
      "E",
      "E",
      "H",
      "H",
      "M",
      "H",
      "A",
      "M",
      "H",
      "M"
    ],
    "formal_scenarios": [
      false,
      false,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true
    ],
    "formal_code": {
      "5": {
        "code": "cursor=50\nrows=set()\nfailed=True\nif not failed:rows.update([51,52]);cursor=52\nrows.update([51,52]);cursor=52\nprint(f\"{cursor}/{len(rows)}\")",
        "expect": "52/2",
        "lang": "python"
      },
      "6": {
        "code": "q={\"A\":\"confirmed\",\"B\":\"uncertain\",\"C\":\"pending\"}\nq={k:v for k,v in q.items() if v!=\"confirmed\"}\nq[\"B\"]=\"confirmed\"\nq={k:v for k,v in q.items() if v!=\"confirmed\"}\nprint(\",\".join(q))",
        "expect": "C",
        "lang": "python"
      }
    }
  }
],["cookbook/persistence/reading-writing-files.md", "cookbook/persistence/sqlite.md", "app-architecture/design-patterns/key-value-data.md", "app-architecture/design-patterns/sql.md", "app-architecture/design-patterns/offline-first.md"],{repo:'flutter/website',commit:"35ed8c8d5caf1ff8b63a80bfe0f5b1b85e6e8e68",base:'sites/docs/src/content/',title:'Official Flutter: ',verification:'Pinned official source bytes read from isolated /tmp/echolens-flutter-wave4-mobile-reference. Python SQLite, temporary-filesystem and protocol fixtures verify extracted mechanisms; Room, Hive, mobile plugin and device integration require separate tests.'});
