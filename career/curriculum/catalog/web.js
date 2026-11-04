'use strict';
/** Frontend and full-stack web subtracks. */
const { S } = require('../dsl');

module.exports = [
  S('web-foundations', 'Web and Internet Foundations', 'How browsers, servers and the internet work together to deliver a web page.',
    { level: 'foundation', depth: 1, hours: 12, refs: ['cs106-html-css'] }, [
      ['How the web works', ['!Explain how a browser requests and renders a page from a server', 'Describe domains, DNS, hosting and URLs']],
      ['Browsers and developer tools', ['!Use DevTools to inspect elements, network requests and console errors', 'Explain how HTML, CSS and JavaScript divide the work of a page']],
      ['Web basics for professionals', ['Explain HTTPS, cookies and basic web security at a user level', 'Describe how websites are built, versioned and deployed']],
    ]),
  S('html-semantic', 'HTML and Semantic Web', 'Structuring content correctly so it works for users, browsers, search engines and assistive technology.',
    { level: 'beginner', depth: 2, hours: 15, prereq: ['web-foundations'], refs: ['cs106-html-css'] }, [
      ['Document structure', ['!Structure pages with headings and landmark elements', 'Choose semantic elements over generic divs']],
      ['Forms', ['!Build accessible forms with labels, input types and validation attributes', 'Explain how form submission works']],
      ['Media, links and metadata', ['Add images with meaningful alternative text', 'Write metadata for search engines and sharing']],
    ]),
  S('css-fundamentals', 'CSS Fundamentals', 'Styling with the cascade, selectors, the box model and maintainable CSS.',
    { level: 'beginner', depth: 2, hours: 15, prereq: ['html-semantic'], refs: ['cs106-html-css'] }, [
      ['Selectors and the cascade', ['!Predict which rule wins using specificity and source order', 'Write maintainable selectors and class names']],
      ['Box model and positioning', ['!Predict element size from content, padding, border and margin', 'Use positioning and display types correctly']],
      ['Typography and colour', ['Apply typography, units and colour with accessible contrast', 'Use custom properties for consistent design tokens']],
    ]),
  S('responsive-css', 'Responsive Design and Modern CSS Layout', 'Layouts that work from phones to large screens with Flexbox, Grid and media queries.',
    { level: 'intermediate', depth: 2, hours: 15, prereq: ['css-fundamentals'], refs: ['web-advanced'] }, [
      ['Flexbox', ['!Build one-dimensional layouts and alignments with Flexbox']],
      ['Grid', ['!Build two-dimensional page layouts with CSS Grid', 'Choose between Flexbox and Grid for a layout']],
      ['Responsive design', ['!Use the viewport meta tag, fluid units and media queries for mobile-first design', 'Make images and media responsive and fast']],
    ]),
  S('js-fundamentals', 'JavaScript Fundamentals', 'The JavaScript language: values, types, functions, objects, arrays and modern syntax.',
    { level: 'beginner', depth: 2, hours: 30, prereq: ['programming-foundations'], refs: ['cs105-javascript'] }, [
      ['Values and types', ['!Predict results involving type coercion, equality and truthiness', 'Use let and const with correct scoping']],
      ['Functions', ['!Trace functions, closures and arrow functions', 'Explain how this behaves in different call styles']],
      ['Objects and arrays', ['!Transform data with map, filter, reduce and destructuring', 'Predict reference versus copy behaviour for objects and arrays']],
      ['Modern JavaScript', ['Use modules, template literals, spread and optional chaining', 'Handle errors with try/catch and custom errors']],
    ]),
  S('js-dom-async', 'JavaScript DOM and Asynchronous Programming', 'Making pages interactive and working with timers, promises, fetch and the event loop.',
    { level: 'intermediate', depth: 3, hours: 25, prereq: ['js-fundamentals', 'html-semantic'], refs: ['js-advanced'] }, [
      ['The DOM', ['!Select, create and update elements safely (textContent vs innerHTML)', 'Use event listeners and event delegation']],
      ['The event loop', ['!Predict execution order of synchronous code, timers, promises and microtasks']],
      ['Promises and async/await', ['!Handle async results and errors with async/await', 'Run requests in parallel or sequence appropriately']],
      ['Fetch and browser storage', ['Call APIs with fetch and check response status', 'Use localStorage and sessionStorage appropriately']],
    ]),
  S('typescript-fundamentals', 'TypeScript Fundamentals', 'Static types for safer JavaScript: types, interfaces, generics and narrowing.',
    { level: 'intermediate', depth: 3, hours: 20, prereq: ['js-fundamentals'], refs: ['tt-nextjs-typescript'] }, [
      ['Types and interfaces', ['!Type values, functions and objects with interfaces and type aliases', 'Use optional and readonly properties correctly']],
      ['Unions and narrowing', ['!Narrow union types safely, including discriminated unions', 'Handle null and undefined under strict mode']],
      ['Generics and tooling', ['Write and use generic functions and types', 'Configure tsconfig strictness and interpret compiler errors']],
    ]),
  S('react-fundamentals', 'React Fundamentals', 'Building UIs from components with props, state, events and effects.',
    { level: 'intermediate', depth: 3, hours: 30, prereq: ['js-dom-async'], refs: ['tt-nextjs-typescript'] }, [
      ['Components and JSX', ['!Compose UIs from components that receive props', 'Render lists with stable keys and conditional content']],
      ['State and events', ['!Update state correctly, including functional updates', 'Lift state up and pass callbacks']],
      ['Effects', ['!Use useEffect with correct dependencies and cleanup', 'Fetch data in components and handle loading and error states']],
      ['Forms', ['Build controlled forms with validation', 'Explain controlled versus uncontrolled inputs']],
    ]),
  S('react-advanced', 'Advanced React and State Management', 'Scaling React apps: context, reducers, server state, performance and patterns.',
    { level: 'advanced', depth: 3, hours: 25, prereq: ['react-fundamentals'], refs: ['tt-nextjs-typescript'] }, [
      ['Application state', ['!Choose local state, context, reducers or a store for a requirement', 'Avoid prop drilling and unnecessary global state']],
      ['Server state', ['!Cache and synchronise server data (for example with React Query patterns)', 'Handle optimistic updates and rollback']],
      ['Performance', ['!Diagnose unnecessary re-renders and fix them with memoisation', 'Split code and lazy-load routes']],
      ['Reusable patterns', ['Write custom hooks', 'Design reusable component APIs']],
    ]),
  S('nextjs-architecture', 'Next.js and Modern Frontend Architecture', 'Routing, rendering strategies and data fetching with Next.js.',
    { level: 'advanced', depth: 3, hours: 25, prereq: ['react-fundamentals', 'typescript-fundamentals'], refs: ['tt-nextjs-typescript'] }, [
      ['Routing', ['!Build routes, layouts and dynamic segments with the App Router']],
      ['Rendering strategies', ['!Choose static, server-side, incremental or client rendering for a page', 'Explain server and client components']],
      ['Data and mutations', ['!Fetch data with caching and revalidation', 'Implement server actions or API routes safely']],
      ['Architecture and deployment', ['Organise a large frontend codebase', 'Configure environment variables and deploy a Next.js app']],
    ]),
  S('frontend-api-security', 'API Integration, Authentication and Frontend Security', 'Consuming APIs robustly and keeping users safe in the browser.',
    { level: 'intermediate', depth: 3, hours: 20, prereq: ['js-dom-async'], refs: [] }, [
      ['Robust API integration', ['!Handle loading, error, empty and retry states', 'Prevent duplicate submissions and race conditions in the UI']],
      ['Frontend authentication', ['!Store and send credentials safely (cookies vs tokens)', 'Protect routes and handle expired sessions']],
      ['Browser security', ['!Prevent XSS and explain CORS and CSRF', 'Apply Content-Security-Policy and safe third-party scripts']],
    ]),
  S('frontend-quality', 'Frontend Accessibility, Testing, Performance and Deployment', 'Shipping frontend work that is accessible, tested, fast and reliably deployed.',
    { level: 'advanced', depth: 3, hours: 25, prereq: ['react-fundamentals'], refs: ['web-advanced'] }, [
      ['Accessibility', ['!Meet WCAG basics: keyboard access, focus, labels and contrast', 'Use ARIA only where native HTML is not enough']],
      ['Testing', ['!Write component tests that check behaviour, not implementation', 'Add end-to-end tests for critical flows']],
      ['Performance', ['!Diagnose slow pages with Core Web Vitals and DevTools', 'Optimise images, bundles and caching']],
      ['Deployment', ['Deploy with build pipelines, environments and rollbacks', 'Monitor frontend errors in production']],
    ]),
  S('fullstack-integration-state', 'Frontend-Backend Integration and State Management', 'Connecting UI and server cleanly: contracts, shared types, caching and consistency.',
    { level: 'advanced', depth: 3, hours: 20, prereq: ['react-fundamentals', 'node-express'], refs: ['tt-nextjs-typescript'] }, [
      ['API contracts', ['!Keep request and response shapes consistent with shared types and validation', 'Version contracts without breaking clients']],
      ['Data flow', ['!Keep client and server state consistent after mutations', 'Handle pagination, filtering and real-time updates']],
      ['Failure handling', ['Design user-visible behaviour for partial failures', 'Trace a bug across frontend, API and database']],
    ]),
  S('fullstack-architecture', 'Full-Stack Application Architecture', 'Structuring complete applications that are maintainable, secure and able to grow.',
    { level: 'advanced', depth: 3, hours: 20, prereq: ['fullstack-integration-state', 'database-design'], refs: [] }, [
      ['Application structure', ['!Separate presentation, business logic and data access', 'Choose monolith or services for a team and product size']],
      ['Cross-cutting concerns', ['!Design authentication, logging and error handling across the stack', 'Add caching and background jobs where they help']],
      ['Evolving systems', ['Plan schema and API changes without downtime', 'Make design decisions explicit with trade-offs']],
    ]),
  S('web-deployment-cicd', 'Deployment, CI/CD and Monitoring for Web Apps', 'Getting full-stack apps to production and keeping them healthy.',
    { level: 'intermediate', depth: 2, hours: 15, prereq: ['backend-deployment-ops'], refs: ['tt-cloud-devops'] }, [
      ['Continuous integration', ['!Build and test every change automatically', 'Protect the main branch with checks']],
      ['Deployment', ['!Deploy frontend and backend with environment configuration and migrations', 'Roll back safely']],
      ['Monitoring', ['Monitor errors, uptime and performance', 'Respond to an incident with logs and metrics']],
    ]),
];
