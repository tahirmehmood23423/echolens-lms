'use strict';

// Replaces the pre-launch ShipLens 1.0 draft, which advertised three separate
// tasks. The original series has no registrations, so its schedule, price and
// ID can be kept while its public description and project are corrected.
const description = `ShipLens 1.0 is a monthly build competition for one or two students per team. This edition follows a multi-city education organisation whose branches currently rely on spreadsheets and WhatsApp to reach volunteers.

Your single project is a public volunteer website: explain the organisation's mission, help visitors find a local branch, and give them a clear way to apply. The complete requirements, judging checklist and visual reference open when the project window begins. You then have two weeks to build, publish your source on GitHub and deploy the working website.

Register before the deadline shown here. Your team receives one fee challan; Finance confirms payment before you can submit. The schedule on this page shows the project release, submission deadline and results date.`;

const project = {
  pid: 1,
  title: 'Volunteer Connect: Public Website and Branch Finder',
  difficulty: 'Easy', points: 100,
  description: `A growing education organisation runs volunteer programmes in several cities but has no dependable public website. People cannot quickly learn what it does, find their nearest branch or submit an application. Build its public online home as one responsive, working website.

The main visitor journey is: understand the mission, choose a city or branch, read how to help, and complete a volunteer application. Use realistic sample information for at least three branches. The organisation name and branding may be your own; keep the writing clear and credible. The reference image shows the expected screen structure, but you may create your own visual style.`,
  objective: 'Make it easy for a first-time visitor to understand the organisation, find a branch in their city and apply to volunteer from a phone or desktop.',
  deliverables: `1. A homepage with a clear mission, programme summary, visible Volunteer call to action and navigation to the branch finder.
2. A branch directory containing at least three sample cities. Visitors can search or filter by city and see each branch's location, contact details and volunteer opportunities.
3. A volunteer application form that asks for name, email, WhatsApp, city/branch, availability and area of interest. Validate required fields, show helpful errors and a clear success state. Keep submitted demo applications available after a page refresh using local storage or a backend.
4. A GitHub repository with a README explaining setup, sample data and how the application flow works; plus a publicly reachable deployed website (Render, GitHub Pages or similar).`,
  acceptance_criteria: `The homepage, branch finder and application form work end to end with no dead buttons or placeholder text.
The layout is usable on phone and desktop without horizontal scrolling. Form labels, focus indicators and error messages are accessible.
Searching or filtering branches returns the correct sample branches. An incomplete or invalid application cannot be submitted; a valid one produces a visible confirmation and is still available after refresh.
The submitted GitHub link opens the source repository, the live link opens the working site, and the README lets a reviewer reproduce the project.`,
  visual_url: 'https://www.echolens.digital/img/shiplens-volunteer-website.svg',
  input_spec: null, output_spec: null, example_input: null, example_output: null,
};

function correctLegacyShipLensSeries(data) {
  let corrected = 0;
  for (const event of data.events || []) {
    if (event.series_kind !== 'shiplens' || event.title !== 'ShipLens 1.0' || event.problems?.length !== 3) continue;
    if ((data.event_entries || []).some((entry) => Number(entry.event_id) === Number(event.id))) continue;
    event.description = description;
    event.problems = [{ ...project }];
    corrected++;
  }
  return corrected;
}

module.exports = { description, project, correctLegacyShipLensSeries };
