'use strict';
const {course}=require('./wave4-mobile-completion-private');
module.exports=course("flutter-fundamentals",[
  {
    "id": "flutter-fundamentals-composition",
    "title": "Compose reusable widgets around explicit inputs",
    "comps": [
      "m1.c1"
    ],
    "intro": "A Flutter widget is an immutable description of part of a user interface. A screen combines small widgets into a tree. Choosing StatelessWidget or StatefulWidget is about whether a widget needs associated mutable State, not whether its appearance can ever change when its parent supplies new inputs.",
    "sections": [
      [
        "Mechanism and terminology",
        "A StatelessWidget implements build(BuildContext context) using constructor inputs and inherited configuration. For example, a PriceLabel with a final int cents can render Text formatted from that value. When its parent rebuilds with a new PriceLabel configuration, its output can change even though the widget owns no mutable State object.",
        "A StatefulWidget creates a separate State object with createState. The widget configuration remains immutable while the associated State retains mutable values across eligible updates at the same tree identity. Prefer reusable children that receive values and callbacks when their parent owns the shared data. Keep validation in the state or business boundary rather than scattering copies of a cart across visual components."
      ],
      [
        "Application and verification",
        "A quantity selector and a total label must consume the same accepted quantity. The parent can pass quantity to both and provide onIncrement to the selector. Local state is useful for a private expanded panel, but a second independent quantity in the selector can drift from checkout totals. Choose the lowest suitable shared owner.",
        "The Dart fixture models a parent-owned quantity and two render descriptions. Both derive from the same value after a validated increment. It verifies ordinary Dart composition and state ownership; actual StatelessWidget and StatefulWidget creation remain source-reviewed Flutter API examples."
      ]
    ],
    "lang": "dart",
    "code": "String label(int units)=>\"Units:$units\";String total(int units,int cents)=>\"Total:${units*cents}\";void main(){var units=2;void increment(){if(units<3)units++;}increment();print(label(units));print(total(units,400));}",
    "expect": "Units:3\nTotal:1200",
    "problem": "Derive selector and total output from one accepted quantity.",
    "steps": [
      "Start with two units at 400 minor units each.",
      "Accept an increment under the stock limit.",
      "Render both descriptions from the same quantity."
    ],
    "limit": "Native Dart 3.13.7 executes the extracted language or decision logic in an isolated process. Flutter widget, rendering, navigation and plugin behavior is source-reviewed against pinned official bytes; no emulator or Flutter widget execution is claimed.",
    "mistakes": [
      "A StatelessWidget can change when inputs change; stateless does not mean permanently fixed pixels.",
      "Duplicating parent-owned quantities creates conflicting truth. Pass values and callbacks instead."
    ],
    "takeaways": [
      "Widgets describe UI from inputs.",
      "State lives in an explicit owner."
    ],
    "practice": [
      "What does a Flutter widget primarily describe?|A UI configuration|A mutable render buffer~Widgets describe rather than directly store painted pixels.|A durable database row~Widget configuration is not persistent storage.|A background upload job~Scheduling belongs to a different component.|Widgets are immutable UI descriptions consumed by the framework.",
      "Can a StatelessWidget show a new price after its parent supplies new inputs?|Yes|No because it never rebuilds~Stateless widgets can rebuild from new inputs.|Only after process restart~A parent update can provide new configuration.|Only if its fields become mutable~Constructor inputs can remain final.|Stateless means no separately owned mutable State, not fixed output forever.",
      "A parent owns units 3 at price 400. What total should both children derive?|1200|800~That uses the old quantity 2.|400~That ignores quantity.|1600~That uses four units.|3*400=1200 from the accepted shared value.",
      "Which input contract supports a reusable quantity child?|Current value and change callback|A second independent cart copy~That creates competing state ownership.|A retained Activity reference~Flutter child inputs need no Android Activity ownership.|A database connection per label~That couples presentation to storage.|The owner publishes values while the child emits user intent.",
      "A private expand toggle has no sibling readers. Which owner can fit?|The local widget State|A global quantity singleton~That adds unrelated lifetime and coupling.|A remote payment record~Expansion is not a payment outcome.|A second checkout repository~That is unnecessary for private presentation state.|Ownership should match readers and lifetime.",
      "Two quantity displays diverge after checkout updates. What should be reviewed?|Duplicate state ownership|Only color contrast~Contrast does not explain conflicting values.|Only string interpolation~Each can render its own different value correctly.|Only image decoding~That is unrelated to quantity truth.|Shared values should derive from one accepted owner.",
      "An immutable PriceLabel input changes from 400 to 450 while units 2 is unchanged. What derived total follows?|900|800~That retains the old price.|450~That ignores quantity.|850~That incorrectly mixes old and new prices.|The shared accepted values give 2*450=900."
    ],
    "formal": [
      "Which type creates a separate mutable State object?|StatefulWidget|StatelessWidget~It has no associated mutable State of its own.|ThemeData~It represents theme configuration.|TextStyle~It describes text styling.|StatefulWidget separates immutable widget configuration from mutable State.",
      "What is a good reusable child boundary?|Inputs plus event callbacks|Hidden mutable global cart~That obscures ownership and prevents independent testing.|A second authoritative total~That can drift from the quantity source.|Automatic server writes during build~That couples rendering to repeated side effects.|Explicit inputs and events keep the child composable.",
      "A basket starts units 1 at price 350. Its owner accepts two increments, capped at 3. What total appears?|1050|350~Two accepted increments change the quantity.|700~That counts only one increment.|1400~The cap prevents four units.|The accepted quantity becomes 3, so 3*350=1050.",
      "A selector keeps its own quantity while a sibling total reads the parent quantity. A server refresh resets only the parent. Which change preserves consistency?|Hoist quantity to their shared owner|Call build twice on the selector~Extra rendering does not synchronize independent sources.|Give each child another copy~That increases competing truth.|Store total as a third mutable value~That adds another synchronization problem.|Both visual children should consume the same accepted state.",
      "A StatelessWidget has final title and receives a replacement configuration with titleB. What behavior is valid?|It can rebuild and displayB|It must keepA forever~Stateless configuration can be updated by its parent.|It must create its own State~A stateless child can render changed inputs.|It must mutate the old widget field~A new immutable configuration can carryB.|Changed parent inputs can change stateless output.",
      "A checkout reducer caps units at 4. Starting 3, increment, increment, decrement produce which units and total at 250?|3 and 750|4 and 1000~The final decrement reduces 4 to 3.|5 and 1250~The cap rejects the second increment.|2 and 500~The first increment was accepted.|The transition trace is 3\u21924\u21924\u21923, yielding 750.",
      "A basket starts units 2 at 300, cap 5. Accepted changes use reject-on-overflow. Apply +2,+2, server-reset 1, +3,-1. What final units and total follow?|3/900|4/1200~That omits the final decrement.|5/1500~That treats rejected overflow as accepted or clamped.|2/600~That fails to apply the changes after the server reset.|The trace is 2\u21924\u21924\u21921\u21924\u21923, and 3*300=900.",
      "Why can a stateless child remain useful on a changing screen?|Its parent can supply new immutable inputs|Its fields must be rewritten in place~Immutable configurations can be replaced.|It automatically persists old values~Persistence is unrelated to stateless rendering.|It prevents all parent rebuilds~This choice does not provide that behavior.|Stateless composition supports dynamic output through changing inputs.",
      "A button callback adds 2 to units 2 under max 5, then adds 2 again if valid. Which final quantity follows?|4|6~The second change would exceed 5 and is rejected.|5~The operation adds two or rejects, not clamps under this policy.|2~The first change is valid.|The first transition reaches 4; the next proposed 6 is rejected.",
      "A screen needs a shared cart and a private animation flag. What ownership follows the stated readers?|Shared cart owner; local animation State|Both values in one global singleton~The animation does not need application lifetime.|Independent cart in every row~That loses shared truth.|Only a database for animation frames~That is the wrong lifetime boundary.|Own shared business state centrally and private transient state locally."
    ],
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
      "6": {
        "code": "void main(){var n=2;void change(int d){if(n+d>=0&&n+d<=5)n+=d;}change(2);change(2);n=1;change(3);change(-1);print(\"$n/${n*300}\");}",
        "expect": "3/900",
        "lang": "dart"
      }
    }
  },
  {
    "id": "flutter-fundamentals-tree-identity",
    "title": "Distinguish widget configuration, elements and rendering",
    "comps": [
      "m1.c2"
    ],
    "intro": "Flutter maintains related trees with different jobs. Widgets are short-lived immutable configurations. Elements retain the relationship between configurations and the mounted tree. Render objects perform layout and painting for widgets that need rendering. Understanding this separation explains why rebuilding a widget is not the same as repainting every pixel.",
    "sections": [
      [
        "Mechanism and terminology",
        "When a parent supplies new configurations, the framework reconciles them with existing elements. Compatibility at a position depends on runtime type and key. A retained element can keep the associated State while receiving a new StatefulWidget configuration. Replacing identity can dispose the old state and create a new one.",
        "Keys communicate identity among siblings. Use stable logical item ids for reorderable rows when local state should follow the same item. A positional index describes where an item currently sits, so inserting at the front changes what that index refers to. A fresh random key on every build forces identity churn instead of preserving it."
      ],
      [
        "Application and verification",
        "In a shopping list, an expanded row should stay attached to its product after sorting. Stable keys help the framework match the product\u2019s new configuration to the proper existing element. Keys do not authorize products, persist state across process death or make mutable data immutable; those concerns still need explicit policies.",
        "The native fixture performs a keyed lookup after a reorder and contrasts it with a positional lookup. It proves the identity reasoning in Dart data structures. It does not simulate Flutter reconciliation or measure rendering; widget tests must confirm State retention for the actual widget hierarchy."
      ]
    ],
    "lang": "dart",
    "code": "void main(){final old=[\"A\",\"B\",\"C\"];final expanded={\"B\":true};final next=[\"X\",...old];print(next.indexOf(\"B\"));print(expanded[next[2]]??false);print(next[1]);}",
    "expect": "2\ntrue\nA",
    "problem": "Trace item identity after inserting a new first row.",
    "steps": [
      "Record expansion by productB.",
      "InsertX before the prior list.",
      "CompareB\u2019s new position with the old positional index."
    ],
    "limit": "Native Dart 3.13.7 executes the extracted language or decision logic in an isolated process. Flutter widget, rendering, navigation and plugin behavior is source-reviewed against pinned official bytes; no emulator or Flutter widget execution is claimed.",
    "mistakes": [
      "Rebuild does not mean every render object repaints. Measure the actual pipeline.",
      "Using random or duplicate keys undermines meaningful row identity. Use stable unique sibling ids."
    ],
    "takeaways": [
      "Widgets, elements and render objects serve different roles.",
      "Keys preserve logical identity during reconciliation."
    ],
    "practice": [
      "Which tree retains mounted configuration relationships?|The element tree|The widget configuration alone~Widgets are replaceable immutable descriptions.|Only the image cache~That stores decoded image resources.|Only the network request queue~That has a different responsibility.|Elements connect widget configurations to their mounted lifecycle.",
      "What do render objects principally perform?|Layout and painting|User authentication~Access control belongs elsewhere.|Database migration~Rendering does not migrate data.|Permanent progress storage~That is not render-object ownership.|Render objects implement the rendering pipeline responsibilities.",
      "A listA,B,C getsX inserted first. Where isB at zero-based indexing?|2|1~Index 1 now containsA.|0~Index 0 containsX.|3~Index 3 containsC.|The new orderX,A,B,C putsB at index 2.",
      "Which row key best follows a product through sorting?|Stable unique product id|A random value per build~That changes identity on every rebuild.|Current sorted index~That follows position rather than product.|Displayed price with duplicates~Equal prices do not uniquely identify products.|Keys should identify the logical sibling item.",
      "Does rebuilding a widget necessarily repaint all pixels?|No|Yes on every rebuild~Build, layout and paint are separate pipeline stages.|Only when a key exists~Keys do not imply global repaint.|Only when a widget is stateless~Stateless rebuilds need not repaint everything.|Framework stages can reuse work when their inputs and invalidation allow it.",
      "A row keeps state under a retained compatible element. What can change?|Its widget configuration|Its business identity must always change~Compatible updates can keep identity.|Its State must always be discarded~Retention can preserve State.|Its data automatically becomes durable~Element retention is not persistence.|A new configuration can update an existing element and State.",
      "RowsA andB swap positions under stable business keys. Which identity should retain A's local expanded state?|A's logical key|The first position always~Position now belongs toB.|B's key~That would move A state to another record.|A fresh random key~That cannot match the existing identity.|Stable logical keys allow state to follow its associated record."
    ],
    "formal": [
      "Which object is normally the immutable UI description?|Widget|State~State contains mutable retained values.|RenderObject~Render objects implement mutable rendering machinery.|StreamSubscription~A subscription owns event delivery.|Widgets describe UI while other objects retain lifecycle and rendering state.",
      "What does a key help identify among siblings?|The logical child|The current user\u2019s permission~Identity is not authorization.|An exact paint duration~Keys do not predict performance.|A durable database version automatically~That requires a separate contract.|Keys participate in child reconciliation identity.",
      "RowsA,B,C haveB expanded by id. After insertionX and deletionA, which id is expanded?|B|X~State is keyed by business identity.|C~Sorting or deletion does not transferB\u2019s key.|A~A was removed.|The remaining orderX,B,C still maps expanded state toB.",
      "A reorderable row uses index keys and remembers an input draft. Which failure is plausible?|Draft follows the position|The database is necessarily erased~Keys do not delete durable records.|Every row becomes stateless~Key choice does not change class declarations.|All rendering stops permanently~Incorrect identity can occur without a crash.|Positional identity can associate retained state with the wrong logical row.",
      "A parent replaces a child with a different runtime type at the same slot. What should code avoid assuming?|That the old State must be retained|That a replacement can create new state~Replacement can create new State.|That disposal needs cleanup~Disposal requires owned resource cleanup.|That widget configuration is immutable~Widget configuration remains immutable.|Compatibility and identity govern whether existing state is reusable.",
      "A list has keys 10,20,30; key 20 owns a draft. The list reorders 30,10,20. What zero-based position should that draft follow?|2|0~Key 30 occupies 0.|1~Key 10 occupies 1.|It must be deleted solely due to reordering~Stable matching identity can preserve it.|The state follows id 20 to its new index 2.",
      "RowsA,B,C own drafts a,b,c under stable unique keys. DeleteB, insertD with draft d, reorderC,D,A, then update A configuration. Which draft order follows?|c,d,a|a,d,c~That keeps drafts attached to old positions.|c,b,a~Deleted B must not supply D draft.|c,d,new~A configuration update under the same identity need not reset its retained draft.|Stable keys retain C and A drafts, delete B ownership and create D ownership.",
      "Why does a key not replace authorization?|Identity matching grants no data access|A key always contains encrypted credentials~Keys need not contain credentials.|Every key is a server token~Most are local UI identities.|The element tree validates tenant access~It does not provide that application policy.|Authorize records at the appropriate trusted data boundary.",
      "A keyed row\u2019s business id remains 7 but its displayed amount changes from 5 to 9. Which pair is consistent?|Same identity, new configuration|New business identity solely because price changed~Price is not the chosen identity.|Same configuration forever~Inputs have changed.|A mandatory process restart~The parent can update normally.|Stable identity allows updated values without changing the logical row.",
      "What evidence validates actual State retention after reordering?|Flutter widget tests|Only the pure list lookup~That models identity but not framework reconciliation.|Only an MCQ count~Question structure is not runtime evidence.|Only a static title~Titles do not exercise retention.|The native trace complements rather than replaces framework tests."
    ],
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
      "6": {
        "code": "void main(){final drafts={\"A\":\"a\",\"B\":\"b\",\"C\":\"c\"};drafts.remove(\"B\");drafts[\"D\"]=\"d\";print([\"C\",\"D\",\"A\"].map((k)=>drafts[k]).join(\",\"));}",
        "expect": "c,d,a",
        "lang": "dart"
      }
    }
  },
  {
    "id": "flutter-fundamentals-stateful-lifecycle",
    "title": "Own State resources and configuration updates",
    "comps": [
      "m1.c1",
      "m1.c2"
    ],
    "intro": "A StatefulWidget\u2019s State has a lifecycle beyond a single build call. Initialization, configuration updates and disposal are distinct points. Use them to own subscriptions and controllers correctly, while keeping build focused on describing current UI.",
    "sections": [
      [
        "Mechanism and terminology",
        "initState runs once for a newly created State and is useful for appropriate one-time setup. When an existing State receives a new compatible widget configuration, didUpdateWidget can react to changed inputs. A subscription tied to widget.itemId must be moved from the old item to the new item when that input changes; initState alone does not cover every retained-State update.",
        "dispose releases resources owned by the State, such as controllers or subscriptions, before calling the required superclass cleanup. An async completion can arrive after disposal; checking mounted before setState prevents an invalid UI update, while cancellation or generation checks can also stop unnecessary work and stale results. Mounted alone does not establish that a result belongs to the latest item."
      ],
      [
        "Application and verification",
        "An order-status card may keep the same State while its orderId changes fromA toB. Cancel theA subscription, subscribe toB and guard delayed callbacks by current identity. If the card is removed, dispose its owned subscription. This prevents both leaks andA events overwritingB\u2019s display.",
        "The Dart fixture models an owner generation that changes on retargeting and disposal. Only a matching live generation is eligible to publish. It verifies the application rule; actual mounted values, widget lifecycle invocation and Flutter subscription integration require widget tests."
      ]
    ],
    "lang": "dart",
    "code": "void main(){var generation=1;var alive=true;final old=generation;generation++;final current=generation;bool accept(int g)=>alive&&g==generation;print(accept(old));print(accept(current));alive=false;print(accept(current));}",
    "expect": "false\ntrue\nfalse",
    "problem": "Reject old and disposed-owner completions.",
    "steps": [
      "Capture the first operation generation.",
      "Advance generation for a new target.",
      "Dispose the owner and re-evaluate eligibility."
    ],
    "limit": "Native Dart 3.13.7 executes the extracted language or decision logic in an isolated process. Flutter widget, rendering, navigation and plugin behavior is source-reviewed against pinned official bytes; no emulator or Flutter widget execution is claimed.",
    "mistakes": [
      "initState does not rerun for every compatible input update. Handle changed configuration in the appropriate lifecycle method.",
      "Mounted only means the State still exists; it does not prove a completion is current. Check operation identity too."
    ],
    "takeaways": [
      "Resource ownership follows the State lifecycle.",
      "Current identity and mounted status are separate checks."
    ],
    "practice": [
      "Which State method handles one-time setup for a new State?|initState|build on every frame~Build can execute repeatedly.|dispose~That releases ownership at the end.|didUpdateWidget only~That handles a retained State receiving updated configuration.|Initialization and repeated rendering are different lifecycle points.",
      "Which lifecycle point releases owned controllers?|dispose|Every Text constructor~Presentation construction does not own all resources.|Only the app\u2019s next launch~That leaves resources retained too long.|Only a successful network callback~Failures and removal also need cleanup.|Dispose is the owner\u2019s cleanup boundary.",
      "A current generation is 2 and a callback captured 1. Is it current?|No|Yes because the State is alive~Liveness alone does not match generation.|Only if the result is non-null~Nullness does not prove identity.|Only if it arrived last~Arrival order is not request ownership.|The captured generation must equal the current generation.",
      "A retained State receives a new itemId. Which lifecycle concern matters?|Replace item-scoped resources|Always recreate the whole app~A compatible State update does not require restart.|Ignore the input because initState ran~The subscription may still target the old item.|Make every item id global~That does not manage resource lifetime.|Input-scoped resources must follow updated configuration.",
      "Can mounted alone reject an old request for another item?|No|Yes for every request~Mounted checks liveness rather than request identity.|Only for integer ids~Id type does not change mounted semantics.|Only if the method is async~Async syntax does not add identity checks.|A live State can still receive a stale completion.",
      "Why cancel obsolete subscriptions when possible?|Avoid unneeded work and stale delivery|To make every remote effect roll back~Cancellation does not establish rollback.|To skip all identity checks forever~Some callbacks may already be in flight.|To persist widget configuration~That is a separate concern.|Cancellation and guards can work together at different boundaries.",
      "A retained State replaces subscriptionX withY and is removed. Which resources require release?|X at replacement; Y at removal|Y only at removal~X also reached its ownership end.|X only at replacement~Y remains owned until removal.|Neither when mounted was checked~Liveness checks do not release resources.|Resource cleanup follows both replacement and final ownership end."
    ],
    "formal": [
      "Which method can react to changed configuration on a retained State?|didUpdateWidget|initState repeated automatically~InitState belongs to new-State initialization.|dispose before every build~Disposal ends ownership rather than updating it.|main on every row update~The process entry point is not the per-widget update hook.|A retained State needs an update hook for changed widget inputs.",
      "What does mounted primarily tell a State?|Whether it remains in the tree|Whether every result is current~It does not identify requests.|Whether its data is authorized~Access control is separate.|Whether its write committed remotely~Liveness does not prove remote outcome.|Mounted is a lifecycle fact rather than an operation-validity proof.",
      "An owner starts generation 4, then retargets twice. Which callback generation is current?|6|4~That belongs to the original target.|5~That belongs to the intermediate target.|All three~Only the latest target is current.|Two generation advances change 4 to 6.",
      "An order card remains mounted but changes fromA toB. A finishes afterB. Which publication rule preserves current UI?|Live and current generation|Accept the last arriving response~That allows staleA to overwriteB.|Check only mounted~Both requests share a live State.|Apply both values by adding their ids~The responses are snapshots for different orders.|Liveness and current request identity must both hold.",
      "A State registers one listener at creation, replaces it on two item changes, then is disposed. How many listener releases are required if each registration owns one resource?|3|1~Both superseded listeners also need release.|2~Final disposal releases the last listener too.|4~Only three listeners were registered.|Release the first at change 1, second at change 2 and third at disposal.",
      "A callback captures generation 3; current generation is 3 but owner was disposed. What should the eligibility rule return?|false|true~Matching identity is insufficient after disposal.|null~The rule returns a Boolean.|A success update~The owner no longer accepts UI publication.|Both current identity and live ownership are required.",
      "A stream card registers generation 1, retargets twice with release-before-replace, accepts only live/current callbacks, then is removed. Callbacks 1,3,2 arrive before removal and 3 after. Which pair is accepted callbacks and total releases?|1/3|2/3~The generation 3 callback after removal is ineligible.|1/2~Removal releases the third registered resource.|3/1~Obsolete callbacks are rejected and replaced resources are released.|Only live generation 3 before removal is accepted; two replacements plus disposal release three resources.",
      "Why should build avoid repeated resource registration?|Build frequency is not ownership lifetime|Build is guaranteed exactly once~It can execute repeatedly.|Resources are always immutable widgets~Subscriptions and controllers have mutable lifetimes.|A key automatically releases every external listener~Cleanup remains the owner\u2019s responsibility.|Register resources in deliberate lifecycle or operation boundaries.",
      "A request starts forA, then target becomesB and owner remains live. Which pair of checks is sufficient under the stated generation policy?|Live owner and captured generation equals current|Live owner and response arrived most recently~Late arrival can be stale.|Response is non-null and old target exists~That does not establish current ownership.|Widget title is unchanged and price is positive~Those do not identify the request.|The predicate must establish both liveness and current operation identity.",
      "What still needs framework tests after the generation fixture?|Flutter lifecycle behavior|Dart integer equality~The fixture executes it.|The Boolean predicate~The fixture executes it.|The printed false/true values~The fixture verifies those outputs.|Pure logic tests do not execute Flutter State lifecycle callbacks."
    ],
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
      "6": {
        "code": "void main(){var g=1;var releases=0;var accepted=0;var alive=true;for(var i=0;i<2;i++){releases++;g++;}for(final x in [1,3,2]){if(alive&&x==g)accepted++;}alive=false;releases++;if(alive&&3==g)accepted++;print(\"$accepted/$releases\");}",
        "expect": "1/3",
        "lang": "dart"
      }
    }
  },
  {
    "id": "flutter-fundamentals-setstate",
    "title": "Apply synchronous transitions with setState",
    "comps": [
      "m2.c1"
    ],
    "intro": "Flutter State holds values that can change while an element remains mounted. A user event changes those values through a deliberate transition; setState tells the framework that this State needs rebuilding. It does not immediately paint pixels, reload the application or persist the value to disk.",
    "sections": [
      [
        "Mechanism and terminology",
        "The callback passed to setState is synchronous. Perform the relevant mutation inside it, such as setState(() { count += 1; }). An async callback returns a Future and is inappropriate here. Await work separately, then use a synchronous callback to publish accepted results. Build can run for many reasons, including parent updates and inherited configuration changes, so it must describe current values without initiating another business command each time.",
        "Several synchronous mutations may be observed together by a later build; do not rely on a build between consecutive setState calls. The mutation happens when the callback runs, while rebuilding is scheduled. Compute invariants from one authoritative state. For a bounded inventory counter, validate both increment and decrement operations at the transition boundary rather than assuming the button is the only caller."
      ],
      [
        "Application and verification",
        "A warehouse picker starts with quantity two and a capacity of four. Incrementing twice reaches four, a third increment is rejected, and a decrement reaches three. The displayed count and remaining capacity should both derive from that accepted quantity. A repeated rebuild should not pick an additional item.",
        "In real Flutter, a State event handler can invoke setState synchronously around this validated transition. The native Dart fixture executes the transition itself and counts accepted changes. It establishes the business result without claiming to execute a frame scheduler or Flutter rendering pipeline."
      ]
    ],
    "lang": "dart",
    "code": "void main(){var count=2;var accepted=0;void change(int delta){final next=count+delta;if(next>=0&&next<=4){count=next;accepted++;}}for(final d in [1,1,1,-1]){change(d);}print(\"$count/$accepted\");}",
    "expect": "3/3",
    "problem": "Trace bounded changes separately from scheduled rendering.",
    "steps": [
      "Start at quantity two.",
      "Apply each proposed change against the bounds.",
      "Report final quantity and accepted transition count."
    ],
    "limit": "Native Dart 3.13.7 executes the extracted language or decision logic in an isolated process. Flutter widget, rendering, navigation and plugin behavior is source-reviewed against pinned official bytes; no emulator or Flutter widget execution is claimed.",
    "mistakes": [
      "Calling an HTTP write from build repeats side effects when unrelated rebuilds happen. Trigger it from an explicit event boundary.",
      "Using an async setState callback mixes scheduling and completion; await outside and publish synchronously."
    ],
    "takeaways": [
      "setState records a synchronous state change and requests rebuilding.",
      "Business transitions must preserve invariants independently of paint timing."
    ],
    "practice": [
      "What should the callback passed to setState return?|Synchronous completion|A delayed network Future~The callback is required to be synchronous.|A new application process~Rebuilding does not restart the process.|A database commit token~Persistence is a separate responsibility.|Flutter executes the state mutation synchronously and schedules rebuilding.",
      "Does changing a local State field persist it across process death?|No, persistence is separate|Yes, every field is serialized~State fields are ordinary runtime memory.|Only if the value is final~Final describes assignment rather than durability.|Only if a key is supplied~A key is not a durable storage mechanism.|Process restoration needs an explicit persistence or restoration design.",
      "A counter starts 1, accepts +2 under cap 4, then rejects +2. What is its value?|3|1~The first transition was accepted.|4~The policy rejects rather than clamps.|5~The second proposal exceeds the cap.|The accepted transitions are 1 to 3 followed by a rejected proposal 5.",
      "A parent rebuilds an order summary twice. Where should submitOrder originate?|An explicit user event|Every invocation of build~Rebuild frequency is unrelated to intended submissions.|The Text constructor~Constructing presentation should not send commands.|Every theme lookup~Theme reads can happen repeatedly.|A user command needs a deliberate event and operation boundary.",
      "Two synchronous changes each increment count 0 before the next frame. What count can the next build read?|2|0~The callbacks already mutated the field.|1~Both accepted mutations run synchronously.|An automatic exception~Multiple synchronous updates can be valid.|Rebuilding is scheduled while the mutation itself happens immediately.",
      "A counter must accept changes from buttons and a scanner. Where belongs its cap rule?|In the shared transition|Only in the disabled button~The scanner bypasses that presentation control.|Only in the displayed label~Rendering cannot reject an invalid mutation.|Only in a color selector~That does not define quantity validity.|All entry paths must pass through the invariant-preserving transition.",
      "A decrement at count 0 is rejected. Should a rejection subtract a second time during build?|No, build only describes state|Yes, to compensate for rejection~The rejected transition made no change.|Only for dark mode~Theme does not change the quantity rule.|Only on the second frame~Frame timing does not authorize another decrement.|Rendering must not convert a rejected command into a new mutation."
    ],
    "formal": [
      "What is scheduled after a valid setState call?|A rebuild for that State|A guaranteed immediate paint~Painting occurs later in the rendering pipeline.|A durable disk snapshot~setState does not provide persistence.|A process-wide cold start~It updates the current mounted tree.|The framework is notified that the State configuration needs rebuilding.",
      "Which callback shape fits setState?|A synchronous mutation|An async network transaction~Await outside the synchronous callback.|A polling infinite loop~That blocks rather than describes a state update.|A delayed stream generator~That does not satisfy the callback contract.|The callback records changes immediately; async work belongs outside it.",
      "A basket starts 2 with cap 5; operations +2,+2,-1 use reject-on-overflow. What final quantity is displayed?|3|5~The second increment is rejected rather than clamped.|4~The final decrement must also run.|6~That exceeds the accepted upper bound.|The trace is 2 to 4, reject 6, then 4 to 3.",
      "A queue starts 0 with cap 2. Enqueue, enqueue, enqueue, dequeue, enqueue are processed synchronously. Which pair is final size and accepted operations?|2 and 4|2 and 5~The third enqueue was rejected.|1 and 3~The last enqueue is valid.|3 and 5~That ignores the capacity limit.|The accepted transitions are 0\u21921\u21922\u21921\u21922, with one rejected enqueue.",
      "A widget updates count inside a synchronous callback. Why might the screen paint later?|Rendering is scheduled|The mutation waits for disk~No persistence is implied.|The field was automatically immutable~A State field can be mutable.|The callback always runs remotely~It runs within the application isolate.|The callback runs now while the framework arranges subsequent rendering work.",
      "A submit button disables itself while pending, but keyboard submission bypasses it. Which change prevents duplicate accepted commands?|Guard the pending transition|Repaint the disabled button twice~That does not constrain the keyboard path.|Store pending only inside the icon~The submission owner still lacks the invariant.|Delay every label update~Timing does not establish acceptance rules.|The shared operation boundary must reject another submit while pending.",
      "A submit owner starts ready. Events are tap,tap,rebuild,failure,tap,rebuild,success,tap. It accepts only ready\u2192pending; failure returns ready and success becomes done. How many starts and which final state?|2/done|3/pending~A tap in done is not accepted.|4/done~Neither rebuild starts an operation.|1/ready~The retry after failure is accepted and then succeeds.|The first tap and post-failure retry are the only accepted starts; success ends in done.",
      "An async load finishes and needs to publish a total. How should setState be used?|Await first, then mutate synchronously|Await inside its async callback~The callback must not return a Future.|Restart the root isolate for each load~A local update does not require restart.|Assign the same Future to every Text~That does not resolve and publish the accepted data.|Separate asynchronous completion from the synchronous UI state mutation.",
      "Two updates multiply units 2 by 2 then subtract 1 before a frame. With both accepted, which value can the rebuild read?|3|2~That ignores both synchronous mutations.|4~That omits the subtraction.|1~That omits multiplication before subtraction.|Sequential callbacks change the field 2\u21924\u21923 before rendering.",
      "A team uses setState for a temporary expanded panel. What durability assumption is valid?|It lives in runtime State|It survives every process restart~No durable write was made.|It shares automatically across devices~setState is a local UI mechanism.|It creates a remote audit event~There is no implied network effect.|State lifetime and durable storage lifetime are separate design concerns."
    ],
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
      "6": {
        "code": "void main(){var phase=\"ready\";var starts=0;for(final e in [\"tap\",\"tap\",\"rebuild\",\"failure\",\"tap\",\"rebuild\",\"success\",\"tap\"]){if(e==\"tap\"&&phase==\"ready\"){starts++;phase=\"pending\";}else if(e==\"failure\"&&phase==\"pending\"){phase=\"ready\";}else if(e==\"success\"&&phase==\"pending\"){phase=\"done\";}}print(\"$starts/$phase\");}",
        "expect": "2/done",
        "lang": "dart"
      }
    }
  },
  {
    "id": "flutter-fundamentals-async-view",
    "title": "Publish loading, empty, error and current data states",
    "comps": [
      "m2.c1"
    ],
    "intro": "A screen that awaits a Future has several meaningful outcomes. Loading means the current request has not completed. Empty means it completed successfully with no rows. Error means it failed. Data means it completed with accepted values. Treating these outcomes explicitly prevents a spinner from hiding failures or an empty list from looking like a network error.",
    "sections": [
      [
        "Mechanism and terminology",
        "Keep enough state to distinguish pending work from completed content. One small application can use a status enum plus immutable data and error fields; a larger feature may use sealed state variants. The important invariant is that impossible combinations such as loading forever with an unhandled error do not become the default display. Decide whether refresh retains existing content and shows a smaller indicator or replaces it with a full-screen loader.",
        "A response can be successful and still be obsolete. Capture a request generation when starting a new filter, await the operation, then require both a live State and the same current generation before publishing. In an actual State, mounted prevents updating after disposal. Generation checks distinguish two operations within the same live State. Cancellation is useful but cannot guarantee that an already committed remote write is undone."
      ],
      [
        "Application and verification",
        "A courier filters orders by region. Region East begins loading before West; West finishes first and is the current selection. If East arrives later, it must not replace West. A successful West response with zero orders produces an empty message, not a failure alert. A retry should start a new operation identity and clear or retain old data according to an explicit UX policy.",
        "The Dart example completes two Futures in the opposite order from their selection. It publishes only the generation belonging to the current selection. This verifies asynchronous language execution and publication guards; Flutter mounted behavior and actual widget assertions remain a separate test boundary."
      ]
    ],
    "lang": "dart",
    "code": "import \"dart:async\";Future<void> main() async{var current=0;var shown=\"idle\";Future<void> load(Future<String> result) async{final token=++current;final value=await result;if(token==current)shown=value;}final east=Completer<String>();final west=Completer<String>();final a=load(east.future);final b=load(west.future);west.complete(\"West:empty\");await b;east.complete(\"East:data\");await a;print(shown);}",
    "expect": "West:empty",
    "problem": "Keep the most recently selected region after reversed completion order.",
    "steps": [
      "Start East followed by West.",
      "Complete West and accept its empty result.",
      "Complete East and reject its obsolete generation."
    ],
    "limit": "Native Dart 3.13.7 executes the extracted language or decision logic in an isolated process. Flutter widget, rendering, navigation and plugin behavior is source-reviewed against pinned official bytes; no emulator or Flutter widget execution is claimed.",
    "mistakes": [
      "Using last-arrival-wins confuses completion order with current user intent. Compare operation identity.",
      "An empty successful list is not a transport failure. Give it a distinct explanation and retry policy."
    ],
    "takeaways": [
      "Model loading and terminal outcomes explicitly.",
      "Liveness and request identity are independent publication conditions."
    ],
    "practice": [
      "What does an empty view state mean?|Success with zero results|A request still in flight~Loading is a different state.|Every request failed~A successful empty response is not an error.|A disposed State object~Lifecycle and data outcome are separate.|Empty is a successful terminal result with no rows to display.",
      "Where should async work run relative to a setState mutation?|Outside its callback|As an awaited callback body~The callback is synchronous.|Inside every label build~That repeats work during rendering.|Only in a database trigger~A UI Future does not require a database.|Await the operation separately and publish an accepted result synchronously.",
      "RequestsA thenB start; B returns first, A last. Which generation may publish?|B only|A only~A no longer matches current intent.|Both in arrival order~A would overwrite the current result.|Neither ever~The currentB response is eligible.|Selection order sets ownership; arrival order does not.",
      "A refresh retains existing rows while pending. What should the UI communicate?|Rows plus refresh activity|Only an unrelated fatal error~No failure occurred yet.|Success with no rows~Rows remain present under this policy.|A second completed purchase~Refresh is not a purchase command.|A deliberate refresh policy can keep content while indicating pending work.",
      "The current response parses successfully as an empty list. Which terminal status fits?|Empty|Loading~The request has completed.|Transport error~No transport failure is stated.|Disposed~Response contents do not establish lifecycle.|A successful zero-row result should become an explicit empty state.",
      "A State is live but the captured generation differs. What should happen?|Discard that completion|Accept because mounted is true~Liveness does not prove currency.|Append it to every screen~The result belongs to another selection.|Set loading forever~Obsolescence does not justify indefinite loading.|A current-generation guard rejects results for obsolete intent.",
      "A failed load leaves pending=true forever. Which invariant is broken?|Terminal outcomes end loading|Every error is an empty list~Failures should retain their own meaning.|All requests require a new process~A local failure can be represented in state.|A spinner must persist until disposal~It should reflect actual pending work.|Both success and failure paths must leave the pending state deliberately."
    ],
    "formal": [
      "Which state distinguishes a failed request from no matching records?|Error|Empty~Empty represents a successful zero-row result.|Data~Data represents accepted returned content.|Loading~Loading represents pending work.|A failure needs its own terminal state and an appropriate recovery action.",
      "What can checking mounted establish before publication?|The State remains mounted|The result matches latest intent~A live owner can have multiple requests.|The remote write was rolled back~Mounted is not a transaction outcome.|The payload is authorized~Liveness does not perform authorization.|Mounted answers a lifecycle question rather than a request identity question.",
      "A filter starts generation 7, then two newer filters start. Completions 8,7,9 arrive. Which result is eligible under latest-generation policy?|9 only|8 then 9~Generation 8 is already obsolete when it completes.|7 only~The original selection has been superseded.|All three~Arrival does not restore obsolete ownership.|The current generation is 9 before any listed completion is considered.",
      "A screen retains data during refresh. Refresh fails, leaving old rows visible. Which representation preserves useful information?|Old rows plus refresh error|Empty success with no explanation~That falsely reports successful zero results.|Indefinite blocking spinner~The operation has completed with failure.|Fresh success from the old timestamp~That misrepresents the freshness of retained data.|Content and refresh outcome can be represented separately when the policy retains rows.",
      "A successful response contains zero orders. What message best reflects its outcome?|No orders match this filter|The service is certainly offline~The response succeeded.|Still waiting for the first response~The request finished.|The widget was destroyed~No disposal evidence is given.|A zero-row success differs from network failure and pending work.",
      "Two requests share a live State. A starts first, B starts second, A fails, B succeeds. What prevents A's failure from replacing B's current result?|Generation checks on errors too|Only checking successful responses~An obsolete error can still overwrite current state.|Only testing whether error is non-null~That says nothing about request ownership.|Only hiding the error icon~The underlying state would still be stale.|The ownership predicate must guard every completion path.",
      "A page retains rows old during refresh. Attempt 1 starts, then 2. Error 1 arrives, success 2 returns empty, attempt 3 starts, removal occurs, then success 3 returns new. What last eligible content/status remains?|empty/success|old/error~Error 1 was obsolete when it completed.|new/success~Attempt 3 completed after removal.|old/loading~Attempt 2 had already published its empty success.|Obsolete error 1 is rejected, empty success 2 is accepted, and completion 3 is rejected after removal.",
      "Why should retry acquire a fresh operation identity?|It becomes the current attempt|It guarantees server rollback~Identity does not undo remote effects.|It replaces all lifecycle cleanup~Resources still need ownership management.|It makes malformed JSON valid~Parsing rules remain unchanged.|A new attempt must be distinguishable from completions of superseded work.",
      "A current generation is 12; owner alive=false. Callback 12 arrives with valid data. Which publication outcome follows?|Reject after removal|Accept matching generation~Liveness is also required.|Wait for a paint to remount it~Painting does not recreate ownership.|Assign to the old State later~The disposed owner is no longer eligible.|The acceptance predicate requires a live owner and matching generation.",
      "A view uses loading/error/data variants. What additional outcome may improve clarity after a successful empty response?|An explicit empty presentation|A synthetic timeout failure~The operation did not time out.|A forced sign-out event~No authentication failure is stated.|A second pending transaction~No new work was requested.|A completed zero-row success deserves a clear empty explanation."
    ],
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
      "6": {
        "code": "void main(){var g=0;var live=true;var content=\"old\";var status=\"success\";g++;g++;void finish(int token,String value,String state){if(live&&token==g){content=value;status=state;}}finish(1,\"old\",\"error\");finish(2,\"empty\",\"success\");g++;live=false;finish(3,\"new\",\"success\");print(\"$content/$status\");}",
        "expect": "empty/success",
        "lang": "dart"
      }
    }
  },
  {
    "id": "flutter-fundamentals-rebuild-scope",
    "title": "Keep rendering pure and bound state ownership",
    "comps": [
      "m2.c1"
    ],
    "intro": "A rebuild evaluates widget descriptions using current inputs. It can follow a local setState, an ancestor update or a change in inherited configuration such as Theme. A rebuild is therefore a poor unit for counting business events. Keep command execution at an event boundary and keep the cost of describing the affected subtree predictable.",
    "sections": [
      [
        "Mechanism and terminology",
        "Place state near the components that need it, while maintaining a single authoritative owner for shared values. A timer that changes one badge does not inherently require ownership by the entire application root. Extracting a badge into its own StatefulWidget can narrow the state update scope. This is a design starting point, not a guarantee that no ancestor or inherited update will rebuild the badge for another reason.",
        "Expensive pure transformations can be computed when their source changes or cached using a key that includes every dependency. Caching a tax total by cart id alone is wrong if quantity or tax rate can change under that id. A const widget is an immutable canonical configuration where Dart permits it; const is not a general switch that prevents every descendant from reacting to inherited dependencies. Measure profile behavior instead of equating a short build function with a proven frame budget."
      ],
      [
        "Application and verification",
        "An inventory screen has a frequently ticking reservation badge and a costly sorted catalogue. The badge can own its local timer with lifecycle cleanup, while the shared catalogue owner recomputes ordering when products or sort mode change. A profile trace should show whether the actual bottleneck is sorting, layout, image decoding or painting before an optimization is accepted.",
        "The fixture demonstrates a pure cached total keyed by both units and rate. It verifies the dependency rule and cache hit count in Dart. It does not measure Flutter build count or frame timing, and its tiny arithmetic is instructional rather than a claim that this calculation needs production caching."
      ]
    ],
    "lang": "dart",
    "code": "void main(){final cache=<String,int>{};var misses=0;int total(int units,int rate){final key=\"$units:$rate\";return cache.putIfAbsent(key,(){misses++;return units*rate;});}print([total(2,100),total(2,100),total(3,100),total(3,120)].join(\",\"));print(misses);}",
    "expect": "200,200,300,360\n3",
    "problem": "Cache a derived value without reusing results across changed dependencies.",
    "steps": [
      "Call the same dependency pair twice.",
      "Change units and then rate.",
      "Count unique recomputations and compare derived totals."
    ],
    "limit": "Native Dart 3.13.7 executes the extracted language or decision logic in an isolated process. Flutter widget, rendering, navigation and plugin behavior is source-reviewed against pinned official bytes; no emulator or Flutter widget execution is claimed.",
    "mistakes": [
      "Counting purchases by build calls duplicates commands when a parent or theme changes. Count accepted events instead.",
      "A partial cache key returns stale output when an omitted input changes. Include dependencies or invalidate explicitly."
    ],
    "takeaways": [
      "Rendering should be pure with respect to business commands.",
      "Optimize measured work and preserve dependency correctness."
    ],
    "practice": [
      "Can an ancestor update cause a child build?|Yes|Never for stateless children~Stateless output can depend on updated inputs.|Only after process termination~Ordinary updates can rebuild children.|Only after a database migration~Rendering is independent of migration events.|Build frequency can reflect parent and inherited configuration changes.",
      "What should a pure build function produce?|A current widget description|A fresh payment on each call~Repeated rendering must not repeat business commands.|An owned listener every call~That accumulates resources without lifetime control.|A permanent disk snapshot~Persistence is a separate operation.|Build describes UI from existing inputs and state.",
      "A cache key uses units but omits rate. Rate changes 100 to 120 for units 3. What stale result could be returned?|300|360~That is the fresh correct result.|120~That ignores quantity.|3~That is only the units value.|The old cached product 3*100 remains 300 if the changed rate is omitted.",
      "A badge ticks each second while catalogue data is stable. Which ownership can narrow local updates?|Badge-local timer State|Every timer in the root State~That broadens the invalidation owner.|A new database per tick~That adds unrelated work.|One network request per label build~That couples rendering to repeated I/O.|The owner should match the readers and lifetime of the transient value.",
      "Does const prove that descendants never respond to a Theme change?|No|Yes for every descendant~Inherited dependencies can still change.|Only on all Android devices~Platform identity does not establish that claim.|Only if the app is offline~Network state does not define inherited updates.|Const configuration is not a blanket prohibition on inherited updates.",
      "A profiler shows image decoding dominates a slow screen. What investigation follows?|Image dimensions and decoding|Only cache a tiny integer sum~That does not address the measured dominant work.|Only rename build methods~Names do not reduce decoding cost.|Only count repository files~File count does not explain frame time.|Optimize the work supported by the performance evidence.",
      "A row receives the same id with a changed quantity. Which cache key is incomplete for total?|Id alone|Id plus quantity plus rate~That includes the stated changing dependencies.|Quantity plus rate~Those determine the stated arithmetic.|A complete immutable input value~That can capture all dependencies.|A stable identity does not imply the item's displayed values are unchanged."
    ],
    "formal": [
      "What does a widget rebuild chiefly recompute?|Widget configuration output|Every database schema~Rendering does not imply migration.|Every network subscription~Resources need explicit lifetime ownership.|A new application binary~Rebuilding does not recompile distribution packages.|Build evaluates descriptions from the current application inputs.",
      "What evidence should guide a performance optimization?|A relevant profile trace|Only the number of widgets~Counts alone do not show dominant time.|Only the shortest method name~Naming has no timing guarantee.|Only the app icon dimensions~That rarely identifies a screen bottleneck.|Measured timing and workload identify which operation actually needs attention.",
      "A cache keys by units and rate. Calls(2,10),(2,10),(3,10),(3,12) occur. How many recomputations?|3|4~The second call reuses its exact pair.|2~Both changed pairs require new results.|1~Only the first pair can share its entry.|The unique pairs are 2:10,3:10 and 3:12.",
      "A badge uses root setState at 10 Hz; its parent also performs a 4 ms transform per rebuild. Under the stated model, moving the timer into a child removes how much repeated parent transform work per second?|40 ms|4 ms~The transform was repeated ten times per second.|400 ms~That multiplies the frequency by ten again.|0 ms~The stated move removes timer-triggered parent rebuild work.|10 updates/second times 4 ms equals 40 ms; actual frame benefit still needs measurement.",
      "A cached total depends on price and discount. Why must a changed discount invalidate it?|The derivation has changed|The widget id always changes~A business id can remain stable.|Dart forbids caches~Maps can hold cached results.|Every theme implies a discount~Those are unrelated dependencies.|Cached outputs remain valid only while every relevant source input remains unchanged.",
      "An order page's build sends a POST. Two ancestor rebuilds occur after one tap. Which change preserves exactly one local command attempt per tap?|Move POST to tap handling|Retain POST but cache the title~Title caching does not control the side effect.|Make the label const only~The ancestor command remains in build.|Retry the POST after every paint~That adds more command attempts.|A deliberate event boundary separates command intent from rendering frequency.",
      "A derived sort cache keys dataVersion and mode. Calls(1,A),(1,A),(1,B),(2,B),(2,B) occur, each miss costs 12 ms. How many milliseconds of recomputation occur, ignoring lookup cost?|36 ms|24 ms~There are three unique dependency pairs, not two.|48 ms~One repeated pair appears twice and hits the cache.|60 ms~That recomputes on every call and ignores both hits.|Three unique version/mode pairs require three 12 ms computations, totaling 36 ms.",
      "Why can extracting a child improve rebuild scope without guaranteeing fewer paints?|Build and paint are distinct stages|Each build always paints all pixels~The pipeline can avoid unnecessary later work.|Children never rebuild from parents~Parent and inherited updates can still matter.|Paint only occurs at process start~Interactive screens paint later too.|A narrower State owner changes one source of rebuilds, while rendering stages have separate rules.",
      "Three cached entries represent rate 10,20,30 for one item. A new discount factor is introduced but omitted from keys. Which redesign fixes all affected outputs?|Include discount or invalidate on change|Increase map capacity only~Capacity does not encode the missing dependency.|Change only the displayed item id~That does not establish the discount dependency.|Keep old values until process death~That knowingly returns stale totals.|Every derived input must participate in validity or an explicit invalidation rule.",
      "A developer claims a pure Dart cache test proves 60 fps in Flutter. What evidence is still needed?|Target-workload profile|Only more integer assertions~Those do not measure rendering timing.|Only a longer class name~Naming does not validate frame time.|Only the cache map length~That does not measure layout or paint.|The fixture verifies logic while frame performance needs framework and device measurements."
    ],
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
      "6": {
        "code": "void main(){final cache=<String>{};var cost=0;for(final key in [\"1:A\",\"1:A\",\"1:B\",\"2:B\",\"2:B\"]){if(cache.add(key))cost+=12;}print(\"${cost} ms\");}",
        "expect": "36 ms",
        "lang": "dart"
      }
    }
  },
  {
    "id": "flutter-fundamentals-core-controls",
    "title": "Build readable text, images and explicit button actions",
    "comps": [
      "m3.c1"
    ],
    "intro": "Common widgets turn application values and user intent into an understandable screen. Text displays content, Image displays decoded visual assets or network content, and buttons expose actions. Their composition should preserve semantic meaning, bounded layout and visible outcomes rather than merely matching a screenshot.",
    "sections": [
      [
        "Mechanism and terminology",
        "Use Text for ordinary text content and a suitable text style from the theme. Allow labels to handle realistic length and user text scaling. Choose an explicit overflow policy when space is intentionally bounded; clipping a product name can be reasonable in a compact row, while clipping an essential error message can prevent recovery. A visually small text string is not evidence that all translated or scaled text will fit.",
        "Image.asset uses an asset declared by the application configuration; Image.network loads from a URL and needs appropriate loading and failure presentation. Constrain image dimensions or reserve an aspect ratio to reduce disruptive layout changes while data arrives. Buttons typically accept an onPressed callback; a null callback disables an action. A button\u2019s disabled appearance communicates availability, while the operation owner still enforces rules against other callers and repeated events."
      ],
      [
        "Application and verification",
        "A delivery proof screen displays a thumbnail, location text and an upload action. Reserve thumbnail space, show a recoverable error when the image cannot load, and give the action a clear pending state. A network image is not evidence that a file has been uploaded; display status should come from the actual operation result. Essential meaning should remain available to assistive technology rather than living only in a decorative icon or image color.",
        "The Dart fixture models an upload gate with ready, pending and done states. Two tap attempts before completion yield one accepted operation, and completion enables the final done presentation. It checks action ownership without claiming to load an asset or test Flutter button semantics."
      ]
    ],
    "lang": "dart",
    "code": "void main(){var phase=\"ready\";var uploads=0;void tap(){if(phase==\"ready\"){phase=\"pending\";uploads++;}}tap();tap();phase=\"done\";print(\"$uploads/$phase\");}",
    "expect": "1/done",
    "problem": "Accept one upload while the operation is pending.",
    "steps": [
      "Begin in the ready state.",
      "Process two taps with a shared operation guard.",
      "Record completion and display the accepted operation count."
    ],
    "limit": "Native Dart 3.13.7 executes the extracted language or decision logic in an isolated process. Flutter widget, rendering, navigation and plugin behavior is source-reviewed against pinned official bytes; no emulator or Flutter widget execution is claimed.",
    "mistakes": [
      "A disabled button alone cannot guard commands from other entry paths. Keep the operation predicate in the owner.",
      "An unconstrained image can shift surrounding controls during load. Reserve intentional layout space and test errors."
    ],
    "takeaways": [
      "Common widgets need explicit content, constraints and interaction states.",
      "UI availability and command acceptance must agree."
    ],
    "practice": [
      "Which widget is suitable for ordinary text content?|Text|Navigator~Navigator owns route history rather than ordinary text.|ThemeData~It describes theme values rather than a label widget.|Future~A Future represents asynchronous completion.|Text renders textual content within the Flutter widget composition.",
      "What does a null onPressed commonly mean for a Flutter button?|The action is disabled|The button submits automatically~A null callback provides no action handler.|The whole process terminates~Disabled controls do not end the app.|The image cache is cleared~That is unrelated to the callback contract.|A button can communicate unavailable action through its disabled state.",
      "An upload owner starts ready; taps ready,pending,pending occur before completion. How many uploads are accepted?|1|2~Only the ready transition accepts work.|3~Pending taps are rejected.|0~The first tap is valid.|The shared guard moves ready to pending on the first accepted tap.",
      "A thumbnail loads slowly and shifts a submit button. What design addresses layout movement?|Reserve a bounded image area|Send the upload twice~Network side effects do not reserve geometry.|Remove all error messages~That obscures failures without stabilizing layout.|Make every label immutable~Immutability does not bound image dimensions.|An explicit size or aspect-ratio placeholder reserves geometry while loading.",
      "A translated label grows beyond its row. What should be reviewed?|Layout and overflow|Only the API host~The host does not determine text fit.|Only the stored user id~Identity does not solve label width.|Only the database index~Query structure does not set text layout.|Real content and scaling must be tested against the intended constraints.",
      "A network image fails. Which presentation supports recovery?|A meaningful error state|A spinner that never stops~The load has already failed.|A false upload success~Image failure is not proof of upload completion.|A hidden primary action~That may remove an unrelated recovery path.|Loading and terminal failure need distinct, useful presentations.",
      "Can image color alone convey essential upload failure accessibly?|No|Yes for every user~Color-only meaning excludes some users.|Only on Wi-Fi~Network transport does not ensure accessibility.|Only if the asset is small~File size does not provide semantic meaning.|Essential state needs an accessible textual or semantic equivalent."
    ],
    "formal": [
      "What source does Image.asset normally use?|Declared application assets|Only a live HTTP response~That describes a network source instead.|A route return Future~Routing is unrelated to asset decoding.|Every remote database row~Images need an appropriate asset or URL source.|Application asset configuration makes packaged resources available to the widget.",
      "What should supplement a network image\u2019s loading presentation?|A failure presentation|An automatic purchase callback~Image loading must not authorize purchase.|A database reset button only~That is unrelated to ordinary loading errors.|A permanently blank area~That gives no useful outcome explanation.|A failed image request should leave a deliberate, understandable terminal presentation.",
      "A form owner accepts submit only in ready. Sequence tap, tap, failure-to-ready, tap occurs. How many submissions are accepted?|2|1~The retry after failure is valid.|3~The second tap during pending is rejected.|0~The initial ready state permits submission.|One submission starts before failure and a second starts after recovery.",
      "A 300 px row reserves 80 px for a thumbnail and 20 px total gap; remaining text area is 200 px. At scaled width 250 px, what layout issue must be handled?|50 px excess text demand|30 px spare text room~The available text area is 200, not 280.|80 px excess image demand~The image fits its stated reservation.|No overflow under these values~250 exceeds 200 by 50.|Compute remaining width before choosing wrapping, flex or overflow behavior.",
      "An app sets onPressed to null while pending. Which additional rule protects keyboard and deep-link submissions?|Guard the shared operation|Disable only the icon color~Color does not constrain alternative callers.|Use a larger button margin~Geometry does not reject duplicate operations.|Hide the thumbnail placeholder~Image layout is unrelated to submission ownership.|The same acceptance predicate must apply outside the button callback too.",
      "A proof upload succeeds but its thumbnail URL later fails. Which state should the UI preserve?|Upload success plus image error|Upload failure by inference~A failed thumbnail does not undo the upload.|A second automatic payment~No payment was requested.|Pending upload forever~The upload already completed.|Separate operation outcome from independent image presentation status.",
      "A card is 360 px wide with 24 px total padding,96 px image and 16 px gap. Text wants 260 px after scaling. Meanwhile two taps occur while upload remains pending. Which pair is text excess and accepted upload starts?|36 px/1|24 px/1~Text receives 224 px, not 236 px.|36 px/2~The second pending tap is rejected.|0 px/2~That ignores both reserved geometry and the operation guard.|Available text width is 360\u221224\u221296\u221216=224, so excess is 36; one ready tap starts the upload.",
      "Why should essential validation text avoid silent clipping?|Users need its recovery instruction|Every message must occupy one pixel~That is not a readability requirement.|Clipping improves every screen reader~Visual clipping does not guarantee semantic recovery.|Validation only matters to developers~The user needs to correct the input.|A hidden explanation can prevent the user from resolving the actual form problem.",
      "An action starts ready, tap makes pending, timeout returns ready, retry makes pending, success makes done. How many accepted starts occurred?|2|1~The retry is a second accepted operation.|3~Completion is not another start.|4~State transitions are not all submissions.|The two ready-to-pending transitions represent accepted command starts.",
      "What additional test is needed after the pure Dart upload gate?|Flutter interaction and semantics|Only repeated integer multiplication~That does not exercise buttons or accessibility.|Only counting source imports~Imports do not execute the control.|Only changing the printed phase name~That does not test framework presentation.|The fixture checks acceptance logic, while widgets and semantics need framework tests."
    ],
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
      "6": {
        "code": "void main(){final excess=260-(360-24-96-16);var pending=false;var starts=0;for(var i=0;i<2;i++){if(!pending){starts++;pending=true;}}print(\"${excess} px/$starts\");}",
        "expect": "36 px/1",
        "lang": "dart"
      }
    }
  },
  {
    "id": "flutter-fundamentals-lists-forms",
    "title": "Connect list identity and validated form submission",
    "comps": [
      "m3.c1"
    ],
    "intro": "Lists present repeated records, while forms collect changes that must satisfy a contract before submission. Both need explicit identity: a row belongs to a logical record, and a form submission belongs to a particular accepted input snapshot. Keeping these identities clear prevents local editing state from following the wrong row or a late save from overwriting newer input.",
    "sections": [
      [
        "Mechanism and terminology",
        "ListView.builder creates children on demand for a scrolling collection rather than eagerly constructing every item configuration in advance. Supply itemCount for a finite list and derive a row from the current index. For reorderable business records with local row state, stable logical keys help preserve the intended identity. Builder use does not replace pagination, image memory management or database query planning; it addresses one layer of construction work.",
        "A Form groups form fields for validation. A stable GlobalKey<FormState> owned outside repeated build creation can access validate, while TextFormField validators return an error string for invalid input and null for valid input. Normalize input deliberately, then validate the exact value to be submitted. A TextEditingController is an owned resource and should be disposed when its owner ends. Client validation improves feedback but does not replace trusted server validation."
      ],
      [
        "Application and verification",
        "A stock adjustment form accepts an integer between 1 and 20 and a reason of at least five trimmed characters. The submit handler validates first, snapshots the normalized data, starts one operation and displays the resulting success or failure. If a user can edit while pending, distinguish the submitted snapshot from newer draft input so a late response does not erase subsequent edits.",
        "The native Dart example normalizes a reason and parses quantity with int.tryParse. It rejects a nonnumeric string and an over-cap value while accepting a valid snapshot. Actual FormState calls, error placement, keyboard behavior and row retention remain Flutter test responsibilities."
      ]
    ],
    "lang": "dart",
    "code": "bool valid(String raw,String reason){final n=int.tryParse(raw.trim());return n!=null&&n>=1&&n<=20&&reason.trim().length>=5;}void main(){print(valid(\" 4 \",\" cycle count \"));print(valid(\"four\",\"cycle count\"));print(valid(\"21\",\"cycle count\"));}",
    "expect": "true\nfalse\nfalse",
    "problem": "Validate the exact normalized stock adjustment before submission.",
    "steps": [
      "Trim input and parse it without throwing.",
      "Apply numeric and reason constraints.",
      "Compare valid, malformed and over-cap cases."
    ],
    "limit": "Native Dart 3.13.7 executes the extracted language or decision logic in an isolated process. Flutter widget, rendering, navigation and plugin behavior is source-reviewed against pinned official bytes; no emulator or Flutter widget execution is claimed.",
    "mistakes": [
      "Creating the form key during every build replaces its identity. Keep the key with its intended owner.",
      "Disposing no controller leaks ownership; disposing a controller owned elsewhere breaks another component. Release only owned resources."
    ],
    "takeaways": [
      "Lazy list construction and stable row identity solve different concerns.",
      "Normalize, validate and snapshot form data at one deliberate boundary."
    ],
    "practice": [
      "What does a TextFormField validator return for valid input?|null|An empty Future~The validator contract is synchronous result text or null.|The entire widget tree~Validation does not return presentation composition.|A new controller~The validator does not create field ownership.|A null validation result means the field has no validation error under that rule.",
      "What is ListView.builder designed to do?|Build children on demand|Persist every row automatically~Storage is a separate concern.|Fetch every server page automatically~Pagination needs an explicit data policy.|Guarantee constant image memory~Image decoding and caching still need attention.|Builder construction supports scrolling collections without eagerly building all children.",
      "A quantity rule accepts 1..20; inputs are 4,four,21. Which acceptance trace follows?|true,false,false|true,true,false~The word is not parsed by int.tryParse.|false,false,true~Four is valid and 21 exceeds the cap.|true,false,true~The upper bound rejects 21.|Parsing and bounds must both succeed for acceptance.",
      "A form key is created inside every build. What should change?|Retain it in its owner|Replace it on each keystroke~That repeats the identity problem.|Move it into every error string~Messages do not own FormState.|Use a random key every frame~That intentionally creates identity churn.|A stable form identity should survive unrelated rebuilds within its intended lifetime.",
      "Rows reorder while one owns an expanded state. What key fits its identity?|Stable record id|Current list index only~The index can refer to another record after reordering.|Fresh random value each build~That discards stable matching.|Displayed price only~Different records can share a price.|Logical keys identify the record rather than its temporary position or value.",
      "An owner creates a TextEditingController. What happens at ownership end?|Dispose that controller|Keep it in a hidden label forever~That retains resources beyond their intended lifetime.|Dispose every controller globally~Other owners may still need theirs.|Recreate the application database~That does not release the owned UI resource.|Resource cleanup belongs to the component that owns the controller lifetime.",
      "A mobile form validates locally. What must its server still do?|Validate trusted constraints|Accept every supplied quantity~Clients can be modified or bypassed.|Trust disabled buttons as policy~Those are presentation behavior.|Skip all authorization checks~Input validity is not access permission.|Client feedback complements rather than replaces trusted server enforcement."
    ],
    "formal": [
      "Which parsing API can reject malformed integer text without a parse exception?|int.tryParse|TextStyle.copyWith~That changes style configuration.|Navigator.push~That opens routes rather than parses numbers.|Theme.of~That retrieves inherited theme data.|int.tryParse returns null when the input is not a valid integer representation.",
      "Where should a stable Form key normally live?|With its form owner|Inside a fresh build expression~That can replace identity on unrelated rebuilds.|In each character string~Text content is not form ownership.|Only in server logs~The running form needs its own local identity.|The key should follow the intended FormState lifetime rather than each rendering call.",
      "A rule requires quantity 1..10 and reason length>=5 after trim. Input quantity 3 and reason '  fix  ' produces what?|Rejected short reason|Accepted normalized reason~The trimmed reason has three characters.|Rejected quantity~Three is within the numeric range.|Accepted because spaces count~The rule uses trimmed length.|The normalized reason is fix, whose length 3 fails the minimum 5.",
      "A list has 1000 rows, a viewport uses 12, and the stated builder model requests 12 visible plus 4 cache rows. How many rows are constructed in that model initially?|16|12~The stated cache adds four rows.|1000~The model does not request all records initially.|4~That omits the visible rows.|12 visible plus 4 cached gives 16; actual framework behavior needs profiling.",
      "A submit snapshots quantity 5, then the user edits draft to 7 while save 5 is pending. What should its completion refer to?|The submitted quantity 5|The new draft 7 automatically~That was not the submitted snapshot.|Every future edit~One response does not identify future intent.|The row index alone~Position does not identify the submitted value.|Keep operation data and newer draft data distinct when editing is allowed during a save.",
      "A form trims before checking a minimum length but sends untrimmed text. Which change restores a coherent contract?|Send the validated snapshot|Only lengthen the button label~That does not align values.|Validate after every paint only~Rendering frequency does not define the submitted value.|Use a random key for each error~That changes identity without fixing normalization.|Validation should evaluate the exact normalized payload that the operation submits.",
      "An editable record draft v 1=5 is submitted as operationA. User edits v 2=7; A succeeds. Clear draft only if its version equals the submitted version. Then submitB and it succeeds with no later edit. Which pair is remaining draft after A and after B?|7/cleared|cleared/cleared~A must not erase the newer v 2 draft.|5/7~Submission snapshots do not overwrite newer drafts.|7/7~B succeeds for the unchanged current draft and may clear it.|A snapshot version 1 differs from current 2, preserving 7; B submits 2, whose matching completion clears it.",
      "Why does ListView.builder not remove the need for API pagination?|Different pipeline layers|It automatically compresses HTTP~It is a widget construction API.|It rewrites database indexes~Storage query planning is a separate layer.|It stores all pages securely~Storage is not its responsibility.|Lazy widget construction can coexist with excessive network or memory use from eager data loading.",
      "A controller owner registers one controller, replaces it once and then is removed. Under explicit ownership, how many disposals are required?|2|1~The superseded controller also needs cleanup.|0~Both owned resources have ended lifetimes.|3~Only two controllers were created.|Dispose the old resource at replacement and the current resource when the owner ends.",
      "What remains to test beyond the native validation function?|Form errors and interaction|Only Dart Boolean operators~Those execute in the fixture.|Only integer parsing output~That is already exercised.|Only the literal numeric bounds~The fixture evaluates them.|Framework tests must cover field wiring, focus, error display and actual submit behavior."
    ],
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
      "6": {
        "code": "void main(){var version=1;int? draft=5;final a=version;version++;draft=7;if(a==version)draft=null;final afterA=draft;final b=version;if(b==version)draft=null;print(\"$afterA/${draft==null?\"cleared\":draft}\");}",
        "expect": "7/cleared",
        "lang": "dart"
      }
    }
  },
  {
    "id": "flutter-fundamentals-themes",
    "title": "Apply consistent themes and deliberate component overrides",
    "comps": [
      "m3.c2"
    ],
    "intro": "A theme expresses reusable visual decisions such as color roles, typography and component defaults. Applying those decisions centrally makes a multi-screen app coherent and lets supported light, dark and high-contrast presentations evolve with less duplicated styling. A theme is still input data consumed by widgets; hard-coded child values can override it.",
    "sections": [
      [
        "Mechanism and terminology",
        "MaterialApp can provide ThemeData through theme and darkTheme with themeMode selecting the intended policy. Theme.of(context) reads the nearest inherited theme. A local Theme can intentionally override a subtree, while explicit widget properties can override relevant defaults. Read the theme using a context beneath the intended provider; a context above a newly returned Theme still sees the ancestor configuration.",
        "Use semantic roles such as a ColorScheme surface, primary and their on-colors rather than assuming one literal color suits every background. Typography should preserve hierarchy while accommodating text scaling. A component override should solve a specific requirement, such as a destructive-action style, without duplicating unrelated theme values. Consistency is about shared rules and meaningful exceptions, not making every control identical."
      ],
      [
        "Application and verification",
        "A field-service app needs one readable order list in light and dark modes. Define shared text and color roles, test disabled and error states in both modes, and review contrast at realistic text sizes. A special warning card can have a local theme, but it must not accidentally change the entire navigation tree. Contrast and screen-reader behavior need actual rendered accessibility checks; a map of color names is only a configuration model.",
        "The fixture resolves a token from global settings and one local override. It shows that an unrelated role remains inherited and that a local role wins only inside its scope. This native Dart map behavior helps explain precedence, while Theme.of lookup, inherited rebuilds and Material rendering remain source-reviewed and require Flutter tests."
      ]
    ],
    "lang": "dart",
    "code": "void main(){final global={\"surface\":\"light\",\"primary\":\"blue\",\"error\":\"red\"};final local={...global,\"surface\":\"dark\"};print(\"${local[\"surface\"]}/${local[\"primary\"]}\");print(global[\"surface\"]);}",
    "expect": "dark/blue\nlight",
    "problem": "Resolve a scoped theme override without mutating the global palette.",
    "steps": [
      "Create global semantic roles.",
      "Copy them into a local override with one changed role.",
      "Compare local inheritance and unchanged global output."
    ],
    "limit": "Native Dart 3.13.7 executes the extracted language or decision logic in an isolated process. Flutter widget, rendering, navigation and plugin behavior is source-reviewed against pinned official bytes; no emulator or Flutter widget execution is claimed.",
    "mistakes": [
      "Reading Theme.of from a context above the new local Theme observes the ancestor. Use a descendant context for the intended scope.",
      "Hard-coding a light background with a dark-mode foreground can break contrast. Use coordinated semantic roles and verify rendered combinations."
    ],
    "takeaways": [
      "Shared themes make visual policy explicit and reusable.",
      "Overrides follow scope and should preserve accessibility."
    ],
    "practice": [
      "What does Theme.of(context) read?|The nearest inherited theme|Every remote style sheet~Flutter theming is not an automatic web CSS fetch.|Only the process startup theme~Inherited configuration can change.|A database migration record~Theme lookup is unrelated to schema history.|The BuildContext position determines the inherited theme visible at that location.",
      "Which ThemeData role helps coordinate text across screens?|Text theme|Request timeout~That configures networking rather than typography.|Route return type~That describes navigation results.|Database index name~That does not define text styling.|A shared text theme provides reusable typography decisions for the application.",
      "Global surface=light and primary=blue; local overrides surface=dark. What pair does the local model resolve?|dark/blue|light/blue~The local surface override wins.|dark/red~Primary was not overridden.|light/red~Neither change matches the declared scope.|A local override replaces the named role and inherits the remaining global values.",
      "A child sets an explicit text color against theme defaults. Which value can win for that property?|The explicit child value|Only the root icon color~The question concerns the child's text property.|Only the database setting~No storage lookup is stated.|Always a random platform color~The widget has an explicit configuration.|Relevant explicit component properties can override their theme defaults.",
      "A context above a newly returned Theme calls Theme.of. What theme can it read?|The ancestor theme|The new descendant theme automatically~The context is not below that provider.|Every sibling theme at once~Inherited lookup follows ancestry.|No theme even with an ancestor~An ancestor can provide it.|Inherited lookup depends on where the context sits in the tree.",
      "A dark theme changes surfaces but leaves hard-coded dark text. What needs review?|Text/background contrast|Only request pagination~That does not determine visible contrast.|Only route ids~Identity does not fix color combinations.|Only asset file extension~That does not establish readable text.|Coordinated semantic roles help preserve readable contrast in each supported mode.",
      "Does a color-token map prove screen-reader usability?|No|Yes for every widget~Tokens do not execute semantics or focus behavior.|Only with enough keys~Map size is not accessibility evidence.|Only in release mode~Build mode does not make tokens a semantics test.|Rendered semantics and interaction require additional framework and accessibility validation.",
      "Global theme is light; nested card overrides error only. Which surface should an inner label inherit?|The light surface|An automatic dark surface~Only error was overridden.|No surface role at all~Unchanged roles remain inherited.|The error color as surface~Role names are not interchangeable.|The scoped override changes error while the global surface role remains available."
    ],
    "formal": [
      "What does darkTheme normally configure in MaterialApp?|A dark-mode theme|A second database schema~Theme configuration is unrelated to storage schemas.|A separate route history~Navigation history is not the theme's purpose.|A guaranteed OLED power budget~Theme selection alone does not measure energy use.|MaterialApp can select among theme configurations under its theme mode policy.",
      "What is the purpose of semantic color roles?|Express reusable visual meaning|Encode each user's credential~Colors are not a secret storage system.|Replace every accessibility test~Roles do not establish rendered usability.|Force all controls to one literal color~Different roles represent different purposes.|A role such as surface or error captures meaning that can adapt across visual modes.",
      "A palette has primary=blue,error=red,surface=white; a subtree changes primary=green. Which pair stays inherited?|error=red,surface=white|error=green,surface=green~Only primary was overridden.|error=red,surface=green~Surface was not changed.|error=blue,surface=white~Error was not assigned primary's value.|A scoped override changes the specified role while preserving other inherited values.",
      "The root uses light; subtreeA uses dark; siblingB has no override. What pair should their descendant lookups resolve?|A dark; B light|A dark; B dark~The override does not extend to the sibling.|A light; B dark~That reverses the declared ancestry.|A light; B light~A's descendant has a nearer dark provider.|Inherited scope follows ancestry rather than every node sharing one screen.",
      "A warning card needs special emphasis. What boundary keeps the override scoped?|A local Theme around the card|A root mutation for every warning~That changes unrelated screens too.|A global replacement on each paint~That couples visual policy to frame frequency.|A database rewrite of every color~That is unrelated to inherited scope.|A subtree provider can apply a deliberate exception within the intended visual boundary.",
      "A theme switch should update ordinary labels but one label has explicit black text. Why might that label remain black?|Its explicit property overrides defaults|Theme changes never rebuild widgets~Inherited dependencies can update.|Dark mode deletes all child properties~Explicit configuration remains available.|Text widgets only read databases~They render configured text and styles.|An explicit relevant property can take precedence over shared theme settings.",
      "Root roles are surface=white,primary=blue,error=red. Outer theme overrides surface=gray. Inner overrides error=orange. One inner Text explicitly sets foreground=black. Which surface/error/foreground triple resolves?|gray/orange/black|white/orange/black~The nearer outer surface overrides the root.|gray/red/black~The nearer inner error overrides red.|gray/orange/blue~The explicit text foreground overrides its relevant default.|Nested roles inherit gray surface and orange error, while the explicit Text foreground remains black.",
      "Why should theme examples use coordinated foreground and background roles?|Their combination determines readability|A foreground alone guarantees contrast~Contrast depends on the background too.|Any two role names always pass contrast~Role names do not prove the rendered values.|Dark mode disables text scaling~Scaling remains a user accessibility concern.|Theme correctness includes the relationship between visual roles in actual rendered contexts.",
      "A nested theme overrides only error=orange, inside another theme with surface=gray. Which combination is expected in the nested scope?|error orange; surface gray|error red; surface gray~The nearer error override wins.|error orange; surface white~The nearer inherited surface remains gray.|error gray; surface orange~Those roles have not been swapped.|Each inherited or overridden role follows the declared nested configuration model.",
      "After the Dart precedence fixture, which validation remains?|Flutter theme and accessibility tests|Only checking map insertion~The fixture already executes that logic.|Only counting token strings~Counts do not test rendered colors or semantics.|Only printing the same palette again~That adds no framework evidence.|The configuration model complements actual inherited-theme, contrast and interaction checks."
    ],
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
      "6": {
        "code": "void main(){final root={\"surface\":\"white\",\"primary\":\"blue\",\"error\":\"red\"};final outer={...root,\"surface\":\"gray\"};final inner={...outer,\"error\":\"orange\"};final foreground=\"black\";print(\"${inner[\"surface\"]}/${inner[\"error\"]}/$foreground\");}",
        "expect": "gray/orange/black",
        "lang": "dart"
      }
    }
  }
],["ui/index.md", "ui/interactivity/index.md", "ui/widgets/index.md", "ui/layout/constraints.md", "cookbook/forms/validation.md", "cookbook/lists/long-lists.md", "cookbook/design/themes.md", "ui/assets/assets-and-images.md"],{repo:'flutter/website',commit:"35ed8c8d5caf1ff8b63a80bfe0f5b1b85e6e8e68",base:'sites/docs/src/content/',title:'Official Flutter: ',verification:'Pinned official source bytes read from isolated /tmp/echolens-native-flutter-next-reference. Native Dart3.13.7 verifies extracted logic; Flutter widget, platform and plugin integration still requires framework/device tests.'});
