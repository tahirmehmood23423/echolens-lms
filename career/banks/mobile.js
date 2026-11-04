'use strict';
/** Mobile App Developer track. Examples use Flutter/Dart; the concepts carry to Kotlin and other stacks. */
const { mc, out, written, submission } = require('../q');

module.exports = [
  // ---- Mobile UI ----
  mc('mo-ui-01', 'mob.ui', 1, 'In Flutter, what is a widget?', ['A description of part of the user interface; screens are built by combining widgets', 'A database table', 'A background service', 'A type of network request'], 0,
    'Everything on screen in Flutter - text, padding, layouts, buttons - is a widget, composed into a tree.'),
  mc('mo-ui-02', 'mob.ui', 2, 'Which Flutter widget arranges its children vertically?', ['Column', 'Row', 'Stack', 'Container'], 0,
    'Column lays children out top to bottom, Row left to right, and Stack on top of each other.'),
  mc('mo-ui-p1', 'mob.ui', 2, 'This screen shows a yellow-and-black "overflowed" stripe on small phones because the list is taller than the screen. What fixes it?',
    ['Make the content scrollable, for example with a ListView or SingleChildScrollView', 'Make the font smaller on every phone', 'Wrap it in a Row', 'Remove the Column'], 0,
    'A Column never scrolls; when its children are taller than the screen they overflow. A scrollable widget lets the content extend beyond the viewport.',
    { type: 'debug', code: 'Column(\n  children: products.map((p) => ProductTile(p)).toList(),\n)' }),
  mc('mo-ui-s1', 'mob.ui', 2, 'Your app must work on small Android phones and large tablets. What is the right approach?',
    ['Build a responsive layout that adapts to the available width (for example LayoutBuilder or MediaQuery breakpoints)', 'Design for one phone size and scale everything up', 'Make a separate app for each device', 'Lock the app to one orientation and size'], 0,
    'Layouts that respond to the available space keep one codebase usable across screen sizes.', { type: 'scenario' }),

  // ---- Flutter/Dart or Kotlin ----
  out('mo-fw-01', 'mob.framework', 1, 'What does this Dart code print?', 'void main() {\n  var name = "Ali";\n  print("Hello, $name!");\n}', ['Hello, Ali!'],
    'Dart string interpolation replaces $name with the variable\'s value.'),
  mc('mo-fw-02', 'mob.framework', 2, 'In Dart, what does the ? in `String? city;` mean?', ['city may hold a String or null', 'city must not be null', 'city is optional to declare', 'city is a constant'], 0,
    'Dart has sound null safety: a type without ? can never be null, and String? explicitly allows null, so the compiler makes you check it.'),
  mc('mo-fw-p1', 'mob.framework', 2, 'This Dart code does not compile because name might be null. Which change handles that correctly?',
    ['print(name?.length ?? 0);', 'print(name.length);', 'Remove the ? from String?', 'print(name!.length); with no other change'], 0,
    'The ?. operator returns null instead of crashing, and ?? supplies a default. The ! operator compiles but throws at runtime when the value is null.',
    { type: 'debug', code: 'String? name = readNameFromForm();\nprint(name.length);' }),
  mc('mo-fw-s1', 'mob.framework', 2, 'A startup must ship Android and iOS apps quickly with a small team. Which choice is most reasonable to start with?',
    ['A cross-platform framework such as Flutter, sharing one codebase', 'Two separate native apps written from scratch by one developer', 'A desktop application', 'A command-line tool'], 0,
    'Cross-platform frameworks let a small team ship to both platforms from one codebase; native-only is worth it when platform-specific performance or features dominate.', { type: 'scenario' }),

  // ---- State management ----
  mc('mo-st-01', 'mob.state', 1, 'In Flutter, which kind of widget can change what it shows during its lifetime?', ['StatefulWidget', 'StatelessWidget', 'Text', 'Icon'], 0,
    'A StatefulWidget keeps mutable state in its State object and rebuilds when that state changes.'),
  mc('mo-st-02', 'mob.state', 2, 'Inside a State class, why must a counter be changed inside setState(() { ... })?', ['setState tells Flutter to rebuild the widget so the new value appears', 'It saves the value to disk', 'It makes the code run faster', 'It is required for every variable'], 0,
    'Changing the variable alone does not trigger a rebuild; setState marks the widget dirty so build runs again.'),
  mc('mo-st-p1', 'mob.state', 2, 'Tapping the button changes count, but the number on screen never updates. What is the fix?',
    ['Wrap the change in setState: setState(() => count++);', 'Make count a const', 'Move count into build()', 'Use a StatelessWidget'], 0,
    'Without setState Flutter does not know the state changed. Declaring count inside build would reset it to 0 on every rebuild.',
    { type: 'debug', code: 'class _CounterState extends State<Counter> {\n  int count = 0;\n  @override\n  Widget build(BuildContext context) => ElevatedButton(\n    onPressed: () { count++; },\n    child: Text("$count"),\n  );\n}' }),
  mc('mo-st-s1', 'mob.state', 3, 'The logged-in user\'s name is needed on 12 different screens, and you are passing it through every constructor. What is better?',
    ['Use app-wide state management (for example Provider, Riverpod or BLoC) so screens read the user from one place', 'Keep passing it through every constructor', 'Store it in a global mutable variable that nothing listens to', 'Ask the user to type their name on each screen'], 0,
    'Shared state belongs in a provider or store that widgets can listen to, instead of being threaded through every layer.', { type: 'scenario' }),

  // ---- Local storage ----
  mc('mo-sg-01', 'mob.storage', 1, 'Which is suitable for saving a small user setting, such as dark mode on or off?', ['A key-value store such as shared_preferences (Android SharedPreferences)', 'A remote SQL server', 'The app\'s source code', 'A text message'], 0,
    'Small settings fit a simple key-value store kept on the device.'),
  mc('mo-sg-02', 'mob.storage', 2, 'Your app must store thousands of offline notes that users can search. Which storage fits best?', ['A local database such as SQLite (or a package built on it)', 'shared_preferences with one key per note', 'A single JSON string in memory', 'Image files'], 0,
    'Structured data that needs queries belongs in a local database; key-value stores are meant for small settings.'),
  mc('mo-sg-p1', 'mob.storage', 2, 'This code saves an auth token in shared_preferences in plain text. What should you use instead?',
    ['Secure storage backed by the Android Keystore / iOS Keychain (for example flutter_secure_storage)', 'A longer key name', 'Base64-encode the token first', 'Save it twice'], 0,
    'Tokens are credentials. Platform secure storage encrypts them; Base64 is only an encoding, not protection.',
    { type: 'debug', code: 'final prefs = await SharedPreferences.getInstance();\nawait prefs.setString("auth_token", token);' }),
  mc('mo-sg-s1', 'mob.storage', 3, 'Users in areas with weak signal want to read courses offline. What design fits?',
    ['Cache course content locally, show cached data immediately, and sync changes when the connection returns', 'Show an error whenever there is no signal', 'Download every course on first launch', 'Disable the app offline'], 0,
    'An offline-first design keeps the app usable on poor connections and reconciles with the server later.', { type: 'scenario' }),

  // ---- Application lifecycle ----
  mc('mo-lc-01', 'mob.lifecycle', 1, 'What usually happens to your app when the user switches to another app?', ['It moves to the background (paused) and may later be stopped by the system to free memory', 'It keeps running exactly as before forever', 'It is uninstalled', 'It restarts the phone'], 0,
    'Mobile operating systems pause background apps and can kill them under memory pressure, so apps must save important state.'),
  mc('mo-lc-02', 'mob.lifecycle', 2, 'Why save a half-filled form when the app goes to the background?', ['The system may kill the app, and the user would lose their input', 'Background apps cannot show forms', 'It makes the form load faster', 'It is required by the app store'], 0,
    'Persisting draft input before backgrounding protects the user if the process is killed.'),
  mc('mo-lc-p1', 'mob.lifecycle', 3, 'A Flutter screen starts a timer in initState but never stops it, and errors appear after the user leaves the screen. What is the fix?',
    ['Cancel the timer in dispose()', 'Start the timer in build()', 'Make the timer faster', 'Use a global timer'], 0,
    'Resources started in initState should be released in dispose; otherwise the timer keeps calling setState on a widget that is gone.',
    { type: 'debug', code: '@override\nvoid initState() {\n  super.initState();\n  timer = Timer.periodic(const Duration(seconds: 1), (_) => setState(() => seconds++));\n}' }),
  mc('mo-lc-s1', 'mob.lifecycle', 3, 'Users say a video lesson keeps playing sound after they press the home button. What should the app do?',
    ['Listen for lifecycle changes and pause playback when the app goes to the background', 'Raise the volume', 'Restart the video', 'Ask users not to press home'], 0,
    'Responding to the paused lifecycle state lets the app stop work the user can no longer see.', { type: 'scenario' }),

  // ---- Mobile testing ----
  mc('mo-ts-01', 'mob.testing', 1, 'What does a widget test in Flutter check?', ['That a widget renders and responds to interaction correctly, without a real device', 'That the phone battery lasts', 'Server load', 'App store ranking'], 0,
    'Widget tests pump a widget in a test environment and check what it shows and how it reacts.'),
  mc('mo-ts-02', 'mob.testing', 2, 'Why run integration tests on a real device or emulator as well as unit tests?', ['They check complete user flows across screens, plugins and the platform', 'They are faster than unit tests', 'They replace code review', 'They need no setup'], 0,
    'Unit tests check logic in isolation; integration tests catch problems that only appear when the pieces run together on a device.'),
  mc('mo-ts-p1', 'mob.testing', 2, 'Which assertion completes this widget test for a counter that starts at 0 and shows 1 after one tap?',
    ["expect(find.text('1'), findsOneWidget);", "expect('1', true);", "assert(count == 1);", "find.text('1');"], 0,
    'find.text locates widgets showing that text and findsOneWidget asserts exactly one is on screen. Calling find alone asserts nothing.',
    { practical: true, code: "await tester.pumpWidget(const MyApp());\nawait tester.tap(find.byIcon(Icons.add));\nawait tester.pump();\n// ???" }),
  mc('mo-ts-s1', 'mob.testing', 3, 'Crashes are reported only on some older Android phones you do not own. What do you do?',
    ['Collect crash reports (for example Firebase Crashlytics) with device details, then reproduce on an emulator with that Android version', 'Ignore older phones', 'Raise the minimum Android version without checking', 'Ask users to buy new phones'], 0,
    'Crash reports show the stack trace and device; emulators let you reproduce the exact OS version.', { type: 'scenario' }),

  // ---- Reviewed ----
  written('mo-wr-01', 'mob.state', 2, 'theory', 'Explain the difference between a StatelessWidget and a StatefulWidget in Flutter, and give one example of when you would use each.',
    [['Stateless: depends only on its inputs and does not change by itself', 2], ['Stateful: holds mutable state and rebuilds via setState', 2], ['Appropriate example for each', 2]],
    'A StatelessWidget only renders its constructor inputs, for example a static profile card. A StatefulWidget owns mutable state in a State object and rebuilds when setState is called, for example a form field or a counter.'),
  submission('mo-sb-01', ['mob.ui', 'mob.state'], 3, 'Write a Flutter StatefulWidget for a to-do screen: a TextField and an Add button that appends the text to a list shown below, clears the field, and ignores empty input.',
    [['Correct StatefulWidget/State structure', 2], ['Adds items via setState and clears the field (TextEditingController)', 2], ['Ignores empty or whitespace-only input', 1], ['Shows the list (ListView or Column of items)', 2], ['Disposes the controller', 1]],
    'class Todos extends StatefulWidget { ... }\nclass _TodosState extends State<Todos> {\n  final c = TextEditingController(); final items = <String>[];\n  void add() { final t = c.text.trim(); if (t.isEmpty) return; setState(() { items.add(t); c.clear(); }); }\n  @override void dispose() { c.dispose(); super.dispose(); }\n  @override Widget build(BuildContext context) => Column(children: [TextField(controller: c), ElevatedButton(onPressed: add, child: const Text("Add")), ...items.map(Text.new)]);\n}'),
  written('mo-wr-02', 'mob.storage', 3, 'scenario', 'A delivery app is used by riders with unreliable mobile data. Describe how you would design it so riders can keep working offline and nothing is lost.',
    [['Local persistence of data and pending actions (queue)', 2], ['Sync when connectivity returns, with retries', 2], ['Conflict handling or idempotent server updates', 1], ['Clear offline/sync status shown to the rider', 1]],
    'Store assigned deliveries locally and record each status change in a local queue. When the connection returns, sync the queue with retries and idempotent requests so a delivery is not marked twice, resolve conflicts with server timestamps, and show the rider what is pending versus synced.'),
];
