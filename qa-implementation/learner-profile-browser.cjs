'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const { BASE, launch, context, login } = require('./browser-lib.cjs');

(async () => {
  const browser = await launch();
  const email = `learner.profile.${Date.now()}@qa.invalid`;
  try {
    const learner = await context(browser, { width: 900, height: 1000 });
    const page = await learner.newPage();
    await page.goto(BASE + '/open#signup');
    await page.getByRole('button', { name: 'Create a free account with email' }).click();
    for (const name of ['name', 'email', 'whatsapp', 'city', 'university', 'degree', 'study_year']) {
      await page.locator(`#suForm [name="${name}"]`).waitFor();
    }
    await page.screenshot({ path: path.join(__dirname, 'evidence', 'learner-registration-profile.png'), fullPage: true, animations: 'disabled' });

    const incomplete = await learner.request.post(BASE + '/api/auth/register-open', { data: { name: 'Profile QA', email, whatsapp: '03001234567' } });
    assert.equal(incomplete.status(), 400);
    const created = await learner.request.post(BASE + '/api/auth/register-open', { data: {
      name: 'Profile QA Learner', email, whatsapp: '03001234567', city: 'Lahore',
      university: 'QA University', degree: 'BS Computer Science', study_year: '3',
      goal: 'Become a backend engineer', marketing_opt_in: false,
    } });
    assert.equal(created.status(), 200);
    const me = await (await learner.request.get(BASE + '/api/auth/me')).json();
    assert.equal(me.learner_profile_complete, true);
    assert.equal(me.profile.city, 'Lahore');
    assert.equal(me.profile.university, 'QA University');
    assert.equal(me.profile.degree, 'BS Computer Science');
    assert.equal(me.profile.study_year, '3');
    assert.equal(me.profile.marketing_opt_in, 'no');

    const enrollments = [];
    for (const track_key of ['fc01-c-basics', 'fc02-cpp-objects']) {
      const response = await learner.request.post(BASE + '/api/open/enrollments', { data: { track_key } });
      assert.equal(response.status(), 201);
      enrollments.push((await response.json()).enrollment.track_key);
    }
    const third = await learner.request.post(BASE + '/api/open/enrollments', { data: { track_key: 'cs104-python' } });
    assert.equal(third.status(), 409);
    assert.match((await third.json()).error, /2 courses at a time/i);
    await learner.close();

    const returning = await context(browser, { width: 900, height: 1000 });
    await login(returning, 'free');
    await returning.request.post(BASE + '/api/me/profile', { data: { city: '', university: '', degree: '', study_year: '' } });
    const dashboard = await returning.newPage();
    await dashboard.goto(BASE + '/dashboard');
    await dashboard.locator('#learnerProfileForm').waitFor();
    assert.equal(await dashboard.locator('#modalBox .close').isVisible(), false);
    await dashboard.locator('#learnerProfileForm input[name="whatsapp"]').fill('03001234567');
    await dashboard.locator('#learnerProfileForm input[name="city"]').fill('Karachi');
    await dashboard.locator('#learnerProfileForm input[name="university"]').fill('Returning Learner University');
    await dashboard.locator('#learnerProfileForm input[name="degree"]').fill('BS Software Engineering');
    await dashboard.locator('#learnerProfileForm select[name="study_year"]').selectOption('4');
    await dashboard.screenshot({ path: path.join(__dirname, 'evidence', 'learner-profile-after-signin.png'), fullPage: true, animations: 'disabled' });
    await dashboard.getByRole('button', { name: 'Save and continue' }).click();
    await dashboard.getByText('Profile complete - welcome aboard!').waitFor();
    const returningMe = await (await returning.request.get(BASE + '/api/auth/me')).json();
    assert.equal(returningMe.learner_profile_complete, true);
    await returning.close();

    const admin = await context(browser);
    await login(admin, 'admin');
    const leads = await (await admin.request.get(BASE + '/api/admin/leads')).json();
    const lead = leads.leads.find((item) => item.email === email);
    assert.ok(lead, 'new learner must be available for operational lead follow-up');
    assert.equal(lead.whatsapp, '03001234567');
    await admin.close();

    console.log(JSON.stringify({ signup_profile_persisted: true, post_signin_profile_required: true, lead_created: true, active_course_limit: enrollments.length, third_course_rejected: true }));
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
