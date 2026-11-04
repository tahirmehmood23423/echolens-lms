'use strict';
/** Server-rendered shell for /career; public/js/career.js draws every view into #career. */
const publicNavigation = require('../public-navigation');
const publicFooter = require('../public-footer');

function render() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<script src="/js/consent.js?v1"></script>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Career Paths & Skill Assessment | EchoLens</title>
<meta name="description" content="Explore 12 technology career tracks, take a free skill assessment, see your strengths and gaps, and follow a personalised roadmap built from EchoLens courses.">
<meta name="robots" content="index, follow">
<meta name="theme-color" content="#0FBFA8">
<link rel="canonical" href="https://www.echolens.digital/career">
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..650&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/styles.css?v1451">
<link rel="stylesheet" href="/css/public-navigation.css?v1">
<link rel="stylesheet" href="/css/public-footer.css?v1">
<link rel="stylesheet" href="/css/career.css?v6">
</head>
<body class="career-page">
${publicNavigation.render()}
<main id="career" class="cr-wrap" tabindex="-1" aria-live="polite"><p class="cr-muted">Loading&hellip;</p></main>
${publicFooter.render()}
<script src="/js/workflow-ui.js?v2"></script>
<script src="/js/public-navigation.js?v1"></script>
<script src="/js/coderunner.js?v1422"></script>
<script src="/js/career-discovery.js?v2"></script>
<script src="/js/career-curriculum.js?v1"></script>
<script src="/js/career.js?v7"></script>
</body>
</html>`;
}
module.exports = { render };
