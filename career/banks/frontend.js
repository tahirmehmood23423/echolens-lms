'use strict';
/** Frontend Web Developer track assessment. */
const { mc, out } = require('../q');

module.exports = [
  // ---- HTML and semantic markup ----
  mc('fe-ht-01', 'fe.html', 1, 'Which element is most appropriate for a site\'s main navigation links?', ['<nav>', '<div>', '<section>', '<span>'], 0,
    '<nav> marks a block of navigation links, which helps screen readers and search engines. <div> and <span> carry no meaning.'),
  mc('fe-ht-02', 'fe.html', 1, 'How do you give an image a text alternative for screen-reader users?', ['The alt attribute: <img src="x.png" alt="...">', 'The title attribute only', 'A comment next to the image', 'The name attribute'], 0,
    'alt text is read by screen readers and shown if the image fails to load. Decorative images use alt="".'),
  mc('fe-ht-03', 'fe.html', 2, 'Which input type lets the browser check that the value looks like an email address?', ['type="email"', 'type="text"', 'type="mail"', 'type="string"'], 0,
    'type="email" adds built-in format validation and shows an email keyboard on phones. "mail" and "string" are not valid types.'),
  mc('fe-ht-04', 'fe.html', 2, 'Which of these are semantic HTML elements? Select all that apply.', ['<header>', '<article>', '<footer>', '<div>'], [0, 1, 2],
    '<header>, <article> and <footer> describe the role of their content. <div> is a generic container with no meaning.'),
  mc('fe-ht-05', 'fe.html', 2, 'What correctly connects a label to its input?', ['<label for="email">Email</label> <input id="email">', '<label name="email">Email</label> <input name="email">', '<label>Email</label> <input label="Email">', '<input placeholder="Email"> with no label'], 0,
    'The label\'s for must match the input\'s id (or the input must be inside the label). Then clicking the label focuses the input and screen readers announce it. A placeholder is not a label.'),

  // ---- CSS and responsive design ----
  mc('fe-cs-01', 'fe.css', 1, 'Which CSS property changes the colour of text?', ['color', 'font-color', 'text-color', 'background'], 0,
    'The property is color. font-color and text-color do not exist in CSS.'),
  mc('fe-cs-02', 'fe.css', 2, 'An element has width: 200px; padding: 20px; border: 5px solid; and box-sizing: border-box. How wide is it on screen?', ['200px', '250px', '240px', '225px'], 0,
    'With border-box, the width already includes padding and border, so the element stays 200px wide. With content-box it would be 200 + 40 + 10 = 250px.'),
  mc('fe-cs-03', 'fe.css', 2, 'You want child items in one row with equal space between them. Which CSS on the parent does this?', ['display: flex; justify-content: space-between;', 'display: block; text-align: justify;', 'display: flex; align-items: space-between;', 'float: left;'], 0,
    'justify-content distributes items along the main axis (a row by default). align-items works on the cross axis and has no space-between value.'),
  mc('fe-cs-04', 'fe.css', 2, 'Which media query applies styles only on screens 600px wide or narrower?', ['@media (max-width: 600px) { ... }', '@media (min-width: 600px) { ... }', '@media (width > 600px) { ... }', '@screen 600px { ... }'], 0,
    'max-width: 600px matches viewports up to and including 600px. min-width matches 600px and wider.'),
  mc('fe-cs-05', 'fe.css', 3, 'For <h1 id="title" class="heading">, the rules h1 { color: red }, .heading { color: green } and #title { color: blue } all apply. What colour is the heading?', ['Blue', 'Green', 'Red', 'Whichever rule is written last'], 0,
    'Specificity decides, not order: an id selector beats a class selector, which beats an element selector. Source order only matters between equally specific rules.'),

  // ---- JavaScript fundamentals ----
  out('fe-js-01', 'fe.js', 1, 'What does this print?', 'console.log(typeof 42);', ['number'], 'typeof returns the string "number" for numbers.'),
  out('fe-js-02', 'fe.js', 2, 'What does this print?', 'console.log(1 + "2");', ['12', '"12"'],
    'If either operand of + is a string, JavaScript converts the other to a string and concatenates: "1" + "2" is "12".'),
  mc('fe-js-03', 'fe.js', 2, 'Which statement is true?', ['0 == "" is true, but 0 === "" is false', 'Both are true', 'Both are false', '0 == "" is false, but 0 === "" is true'], 0,
    '== converts types before comparing ("" becomes 0), while === also requires the same type. Prefer === to avoid surprises.'),
  out('fe-js-04', 'fe.js', 2, 'What does this print?', 'const nums = [1, 2, 3, 4];\nconst out = nums.filter(n => n % 2 === 0).map(n => n * 10);\nconsole.log(out.join(","));', ['20,40'],
    'filter keeps the even numbers [2, 4]; map multiplies each by 10 to give [20, 40]; join(",") produces "20,40".'),
  out('fe-js-05', 'fe.js', 3, 'What does this print?', 'function counter() {\n  let c = 0;\n  return () => ++c;\n}\nconst next = counter();\nnext();\nnext();\nconsole.log(next());', ['3'],
    'The returned arrow function is a closure: it keeps its own c between calls. The third call raises c to 3.'),

  // ---- DOM manipulation ----
  mc('fe-dm-01', 'fe.dom', 1, 'How do you select the element with id="msg"?', ['document.getElementById("msg")', 'document.getElement("#msg")', 'document.id("msg")', 'window.msg.select()'], 0,
    'getElementById takes the id without the # sign. document.querySelector("#msg") also works.'),
  mc('fe-dm-02', 'fe.dom', 2, 'You want to show a user\'s comment on the page without the browser interpreting any HTML in it. Which property should you set?', ['element.textContent', 'element.innerHTML', 'element.outerHTML', 'document.write()'], 0,
    'textContent inserts plain text, so <script> or other tags are shown literally. innerHTML parses HTML and can open an XSS hole.'),
  mc('fe-dm-03', 'fe.dom', 2, 'How do you run a function `handler` whenever a button is clicked?', ['button.addEventListener("click", handler)', 'button.click = handler()', 'button.addEventListener("onclick", handler())', 'button.on("click", handler)'], 0,
    'addEventListener takes the event name without "on" and a reference to the function, not the result of calling it.'),
  mc('fe-dm-04', 'fe.dom', 2, 'This page logs "saved" immediately on load and then nothing when the button is clicked. What is the fix?', ['Pass the function without calling it: addEventListener("click", save)', 'Move the <script> above the button', 'Rename save to onSave', 'Use "onclick" instead of "click"'], 0,
    'save() runs save immediately and passes its return value (undefined) as the listener. Passing save (no parentheses) registers the function itself.',
    { type: 'debug', practical: true, code: '<button id="save">Save</button>\n<script>\n  document.getElementById("save").addEventListener("click", save());\n  function save() { console.log("saved"); }\n</script>' }),
  mc('fe-dm-05', 'fe.dom', 3, 'List items are added to a <ul> while the page runs, and each item must respond to clicks. What is the most efficient approach?', ['Add one listener to the <ul> and use event.target.closest("li") to find the clicked item', 'Add a listener to every <li> once on page load', 'Poll the list every second for clicks', 'Reload the page after each new item'], 0,
    'Event delegation: clicks bubble up to the parent, so one listener handles current and future items. Listeners added on load miss items added later.', { type: 'scenario' }),

  // ---- TypeScript basics ----
  mc('fe-ts-01', 'fe.typescript', 1, 'What does TypeScript mainly add to JavaScript?', ['Static types that are checked before the code runs', 'A faster JavaScript engine', 'A new browser API', 'Automatic CSS generation'], 0,
    'TypeScript adds type annotations and checks them at compile time, then compiles to plain JavaScript.'),
  mc('fe-ts-02', 'fe.typescript', 2, 'What happens with `let age: number = "20";`?', ['The TypeScript compiler reports a type error', 'age becomes the number 20', 'It runs fine because JavaScript is dynamic', 'The browser throws a TypeError at runtime'], 0,
    'A string is not assignable to number, so tsc reports an error before the code ever runs.'),
  mc('fe-ts-03', 'fe.typescript', 2, 'Given `interface User { name: string; age?: number }`, which value is a valid User?', ['{ name: "Ali" }', '{ age: 20 }', '{ name: 20 }', '{ name: "Ali", age: "20" }'], 0,
    'name is required and must be a string; age is optional (the ?) but must be a number if present.'),
  mc('fe-ts-04', 'fe.typescript', 2, 'What does the type `string | number` mean?', ['The value can be either a string or a number', 'The value must be both a string and a number', 'The value is converted to a string', 'The value is an array of strings and numbers'], 0,
    '| creates a union type: any one of the listed types is allowed.'),
  mc('fe-ts-05', 'fe.typescript', 3, 'With `function add(a: number, b: number): number { return a + b; }`, which call does the compiler reject?', ['add("1", 2)', 'add(1, 2)', 'add(1.5, 2.5)', 'add(-1, 0)'], 0,
    '"1" is a string, not a number. TypeScript checks argument types at every call site.'),

  // ---- React fundamentals ----
  mc('fe-rc-01', 'fe.react', 1, 'What is a React function component?', ['A function that returns JSX describing part of the UI', 'A CSS file for one page', 'A database table', 'A server route'], 0,
    'A component is a function that takes props and returns JSX. React calls it to render that part of the interface.'),
  mc('fe-rc-02', 'fe.react', 2, 'Why should you update state with setCount(count + 1) instead of writing count = count + 1?', ['Only the setter tells React to re-render with the new value', 'Assignment is slower', 'count is a constant in JavaScript', 'There is no difference'], 0,
    'State lives inside React. Changing a local variable does not schedule a render; calling the setter does.'),
  mc('fe-rc-03', 'fe.react', 2, 'Why does React want a `key` prop on items rendered from an array?', ['So React can match each item between renders; use a stable, unique id', 'To style each item', 'To make items clickable', 'Keys are only needed for forms'], 0,
    'Keys let React tell which items were added, removed or moved. Array indexes break when the order changes, so prefer stable ids.'),
  mc('fe-rc-04', 'fe.react', 2, 'In a production build, when does useEffect(fn, []) run fn?', ['Once, after the component first renders', 'Before every render', 'After every render', 'Never'], 0,
    'An empty dependency array means the effect runs after the first render only (its cleanup runs on unmount). Development Strict Mode may run it twice to surface bugs.'),
  mc('fe-rc-05', 'fe.react', 3, 'Clicking this button once shows 1, not 2. What fixes it?', ['Use the updater form: setCount(c => c + 1) for both calls', 'Call setCount three times', 'Use a let variable instead of state', 'Wrap the button in a <form>'], 0,
    'Both calls read the same stale count (0) from this render, so both set it to 1. The updater function receives the latest pending value each time.',
    { type: 'debug', practical: true, code: 'function Counter() {\n  const [count, setCount] = useState(0);\n  return (\n    <button onClick={() => { setCount(count + 1); setCount(count + 1); }}>\n      {count}\n    </button>\n  );\n}' }),

  // ---- API integration ----
  mc('fe-ap-01', 'fe.api', 1, 'What does fetch("/api/courses") return?', ['A Promise that resolves to a Response', 'The JSON data directly', 'A string of HTML', 'Nothing'], 0,
    'fetch is asynchronous: it returns a Promise for a Response object, which you then read with response.json() or similar.'),
  mc('fe-ap-02', 'fe.api', 2, 'The server answers a fetch() call with HTTP 404. What does fetch do?', ['Resolves normally; you must check response.ok or response.status', 'Rejects the Promise', 'Retries automatically', 'Throws a SyntaxError'], 0,
    'fetch only rejects on network failure. HTTP error statuses still resolve, so check response.ok (true for 200-299).'),
  mc('fe-ap-03', 'fe.api', 2, 'In which order are the letters printed?', ['A, C, B', 'A, B, C', 'B, A, C', 'C, A, B'], 0,
    'The .then callback runs later, after the request completes, while console.log("C") runs immediately.',
    { code: 'console.log("A");\nfetch("/api").then(() => console.log("B"));\nconsole.log("C");' }),
  mc('fe-ap-04', 'fe.api', 2, 'How do you send a JavaScript object as JSON in a POST request?', ['fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })', 'fetch(url, { method: "POST", body: data })', 'fetch(url + JSON.stringify(data))', 'fetch.post(url, data)'], 0,
    'The body must be a string (JSON.stringify), and the Content-Type header tells the server how to parse it.'),
  mc('fe-ap-05', 'fe.api', 3, 'This throws "res.json is not a function". What is the fix?', ['Add await before fetch: const res = await fetch(...)', 'Change res.json() to JSON.parse(res)', 'Remove async from the function', 'Use XMLHttpRequest instead'], 0,
    'Without await, res is still a Promise, which has no json() method. Awaiting fetch gives you the Response.',
    { type: 'debug', practical: true, code: 'async function load() {\n  const res = fetch("/api/courses");\n  const data = await res.json();\n  return data;\n}' }),

  // ---- Debugging and accessibility ----
  mc('fe-dx-01', 'fe.debug_a11y', 1, 'A button shows only a trash-can icon. What helps screen-reader users most?', ['aria-label="Delete item" on the button', 'A tooltip that appears on hover', 'Making the icon red', 'A larger icon'], 0,
    'An accessible name such as aria-label tells assistive technology what the button does. Colour and hover tooltips do not reach screen-reader or keyboard users.'),
  mc('fe-dx-02', 'fe.debug_a11y', 2, 'Why is light-grey body text on a white background a problem?', ['Low contrast is hard to read, especially for low-vision users; WCAG AA asks for 4.5:1 for normal text', 'Grey is not a valid CSS colour', 'It slows the page down', 'Search engines ignore grey text'], 0,
    'Text needs enough contrast with its background. WCAG AA requires at least 4.5:1 for normal text and 3:1 for large text.'),
  mc('fe-dx-03', 'fe.debug_a11y', 2, 'The console shows "Uncaught TypeError: Cannot read properties of null (reading \'addEventListener\')". What is the most likely cause?', ['The element was not found - the id is wrong or the script ran before the element existed', 'addEventListener is not supported', 'The CSS file failed to load', 'The function name is too long'], 0,
    'getElementById returned null. Check the id, or load the script with defer or at the end of <body> so the element exists first.', { type: 'debug' }),
  mc('fe-dx-04', 'fe.debug_a11y', 2, 'What is wrong with using <div onclick="..."> as a button?', ['It cannot be focused or activated with the keyboard by default; use <button>', 'Divs cannot have click handlers', 'It is slower to render', 'Nothing - it is the recommended approach'], 0,
    'A <button> is focusable and responds to Enter and Space automatically, and screen readers announce it as a button. A div needs extra tabindex, role and key handling to match.'),
  mc('fe-dx-05', 'fe.debug_a11y', 2, 'Where in browser DevTools do you check whether an API request failed and what status it returned?', ['The Network tab', 'The Elements tab', 'The Sources tab', 'The Application tab'], 0,
    'The Network tab lists every request with its status code, headers, payload and response.'),
];
