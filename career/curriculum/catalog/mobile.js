'use strict';
/**
 * Mobile subtracks. Framework-specific subtracks (Flutter, Kotlin/Android,
 * React Native) are separate: Flutter proficiency does not establish
 * Android or React Native proficiency. Shared mobile concepts are
 * framework-neutral.
 */
const { S } = require('../dsl');

module.exports = [
  S('mobile-ui-fundamentals', 'Mobile Application and UI Fundamentals', 'How mobile apps are built and how good mobile interfaces behave.',
    { level: 'beginner', depth: 1, hours: 12, prereq: ['programming-foundations'], refs: [] }, [
      ['Mobile platforms', ['!Compare native, cross-platform and web apps for a product', 'Explain the app lifecycle at a high level']],
      ['Mobile UI principles', ['!Apply touch-target, layout and navigation conventions', 'Design for different screen sizes and orientations']],
      ['Users and constraints', ['Design for poor networks, battery and storage limits', 'Respect platform guidelines (Material, Human Interface)']],
    ]),
  S('dart-programming', 'Dart Programming', 'The Dart language for Flutter: types, null safety, collections, classes and async.',
    { level: 'beginner', depth: 2, hours: 20, prereq: ['programming-foundations'], refs: [] }, [
      ['Language basics', ['!Use Dart types, final and const correctly', '!Apply sound null safety (?, !, ??, late)']],
      ['Collections and functions', ['Transform lists and maps with collection methods', 'Write functions with named and optional parameters']],
      ['Classes', ['!Model data with classes, constructors and immutability', 'Use mixins and abstract classes appropriately']],
      ['Async Dart', ['!Use Future, async/await and Streams', 'Handle async errors']],
    ]),
  S('flutter-fundamentals', 'Flutter Fundamentals', 'Widgets, the widget tree and building first Flutter screens.',
    { level: 'beginner', depth: 2, hours: 20, prereq: ['dart-programming', 'mobile-ui-fundamentals'], refs: [] }, [
      ['Widgets', ['!Compose screens from stateless and stateful widgets', 'Explain the widget, element and render trees at a high level']],
      ['State basics', ['!Update UI with setState and understand rebuilds']],
      ['Common widgets', ['Use text, images, buttons, lists and forms', 'Apply themes consistently']],
    ]),
  S('flutter-layout-nav-state', 'Flutter Layout, Navigation and State', 'Responsive layouts, multi-screen navigation and app-wide state in Flutter.',
    { level: 'intermediate', depth: 3, hours: 25, prereq: ['flutter-fundamentals'], refs: [] }, [
      ['Layout', ['!Build adaptive layouts with Row, Column, Expanded and constraints', 'Diagnose overflow and constraint errors']],
      ['Navigation', ['!Navigate between screens and pass data with routes', 'Handle deep links and back behaviour']],
      ['State management', ['!Choose Provider, Riverpod or Bloc for a feature', 'Separate UI from business logic']],
    ]),
  S('kotlin-android', 'Kotlin and Android Development', 'Native Android with Kotlin, Jetpack Compose and Android architecture components.',
    { level: 'intermediate', depth: 3, hours: 35, prereq: ['programming-foundations', 'mobile-ui-fundamentals'], refs: [], kind: 'variant' }, [
      ['Kotlin', ['!Use Kotlin null safety, data classes and collections', 'Use coroutines for async work']],
      ['Jetpack Compose', ['!Build UIs with composables and state hoisting', 'Handle recomposition correctly']],
      ['Android architecture', ['!Use ViewModel and lifecycle-aware state to survive configuration changes', 'Navigate with Navigation Compose']],
      ['Android platform', ['Request permissions and use system services', 'Use WorkManager for background work']],
    ]),
  S('react-native', 'React Native Development', 'Cross-platform mobile apps with React Native.',
    { level: 'intermediate', depth: 3, hours: 30, prereq: ['react-fundamentals', 'mobile-ui-fundamentals'], refs: [], kind: 'variant' }, [
      ['React Native basics', ['!Build screens with core components and styles', 'Explain how React Native differs from React for the web']],
      ['Navigation and state', ['!Navigate with React Navigation and manage app state', 'Persist state with AsyncStorage or secure storage']],
      ['Native capabilities', ['Use device APIs and native modules', 'Handle platform differences between Android and iOS']],
    ]),
  S('mobile-apis-networking', 'Mobile APIs and Networking', 'Calling APIs from mobile apps reliably on real-world networks.',
    { level: 'intermediate', depth: 2, hours: 15, prereq: ['mobile-ui-fundamentals', 'http-web-architecture'], refs: [] }, [
      ['Calling APIs', ['!Parse JSON into models and handle errors and timeouts', 'Show loading, error and empty states']],
      ['Unreliable networks', ['!Design retry, caching and offline behaviour', 'Reduce data usage with pagination and compression']],
      ['Real-time and push', ['Explain push notifications and background fetch', 'Choose polling, WebSockets or push for updates']],
    ]),
  S('mobile-storage', 'Local Storage and Databases', 'Keeping data on the device: preferences, files, databases and sync.',
    { level: 'intermediate', depth: 2, hours: 15, prereq: ['mobile-ui-fundamentals'], refs: [] }, [
      ['Key-value and files', ['!Choose preferences, files or a database for a requirement', 'Store files in the right app directories']],
      ['Local databases', ['!Model data in SQLite/Room/Hive and migrate schemas on app updates']],
      ['Offline-first and sync', ['Design local-first data with background sync and conflict handling']],
    ]),
  S('mobile-auth-security', 'Mobile Authentication and Security', 'Signing users in and protecting data on devices.',
    { level: 'intermediate', depth: 3, hours: 15, prereq: ['mobile-apis-networking'], refs: [] }, [
      ['Authentication', ['!Implement token-based sign-in with refresh tokens', 'Use OAuth and social login safely']],
      ['Secure storage', ['!Store secrets in Keychain/Keystore-backed secure storage, never plain preferences']],
      ['App security', ['Protect against insecure transport, logging leaks and reverse engineering', 'Request only necessary permissions']],
    ]),
  S('mobile-architecture', 'Mobile Architecture and Maintainability', 'Structuring mobile codebases so features can grow safely.',
    { level: 'advanced', depth: 3, hours: 15, prereq: ['mobile-apis-networking'], refs: [] }, [
      ['Architecture patterns', ['!Apply layered architecture (UI, state, domain, data)', 'Compare MVVM, MVI and clean architecture trade-offs']],
      ['Dependencies and modules', ['Use dependency injection for testable code', 'Split large apps into feature modules']],
      ['Code quality', ['Enforce linting, formatting and code review', 'Refactor safely with tests']],
    ]),
  S('mobile-testing-debugging', 'Mobile Testing and Debugging', 'Testing and debugging mobile apps across devices.',
    { level: 'intermediate', depth: 3, hours: 15, prereq: ['mobile-ui-fundamentals'], refs: [] }, [
      ['Testing', ['!Write unit, widget/UI and integration tests', 'Mock network and storage dependencies']],
      ['Debugging', ['!Diagnose crashes from logs and crash reports', 'Use profilers and debuggers effectively']],
      ['Device coverage', ['Plan a device and OS-version test matrix', 'Use emulators, real devices and beta testers']],
    ]),
  S('mobile-performance-platform', 'Performance, Accessibility and Platform Integration', 'Fast, accessible apps that use device capabilities well.',
    { level: 'advanced', depth: 3, hours: 15, prereq: ['mobile-testing-debugging'], refs: [] }, [
      ['Performance', ['!Find and fix jank, slow startup and memory leaks', 'Render long lists efficiently']],
      ['Accessibility', ['!Support screen readers, dynamic text and contrast']],
      ['Platform integration', ['Use camera, location, notifications and background work responsibly', 'Respect battery and privacy constraints']],
    ]),
  S('app-distribution', 'App Distribution and Release Management', 'Releasing apps to stores and managing versions safely.',
    { level: 'intermediate', depth: 2, hours: 10, prereq: ['mobile-ui-fundamentals'], refs: [] }, [
      ['Store release', ['!Prepare signed builds and store listings for Google Play and the App Store', 'Meet store review and privacy requirements']],
      ['Release management', ['!Use staged rollouts, versioning and release notes', 'Roll out fixes and handle forced updates']],
      ['Post-release', ['Monitor crashes, ratings and analytics after release']],
    ]),
];
