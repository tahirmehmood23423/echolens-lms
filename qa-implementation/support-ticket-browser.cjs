'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const { BASE, launch, context, login } = require('./browser-lib.cjs');

(async () => {
  const browser = await launch();
  const subject = `Compiler dark-mode contrast QA ${Date.now()}`;
  try {
    const publicContext = await context(browser, { width: 1440, height: 1000 });
    const publicPage = await publicContext.newPage();
    await publicPage.goto(BASE + '/open#feedback');
    await publicPage.getByRole('button', { name: 'Submit a support ticket' }).click();
    await publicPage.locator('#supportTicketForm input[name="name"]').fill('QA Ticket Reporter');
    await publicPage.locator('#supportTicketForm input[name="email"]').fill('ticket.reporter@qa.invalid');
    await publicPage.locator('#supportTicketForm select[name="category"]').selectOption('compiler');
    await publicPage.locator('#supportTicketForm input[name="subject"]').fill(subject);
    await publicPage.locator('#supportTicketForm textarea[name="message"]').fill('The editor text was not visible against the background after enabling dark mode.');
    await publicPage.locator('#supportTicketForm input[name="context"]').fill('Online Compiler - Dark mode');
    await publicPage.getByRole('button', { name: 'Submit ticket' }).click();
    await publicPage.waitForFunction(() => /EL-\d{6}/.test(document.querySelector('#modalBody')?.innerText || ''));
    const ticketNumber = (await publicPage.locator('#modalBody').innerText()).match(/EL-\d{6}/)?.[0];
    assert.match(ticketNumber || '', /^EL-\d{6}$/);
    assert.match(await publicPage.locator('#modal').innerText(), /within 24 to 48 hours/i);
    const replyUrl = await publicPage.getByRole('link', { name: 'View ticket & reply' }).getAttribute('href');
    assert.match(replyUrl || '', /#ticket=EL-\d{6}&token=/);
    const publicWall = await publicContext.request.get(BASE + '/api/public/feedback');
    assert.equal((await publicWall.text()).includes(subject), false, 'Private ticket text must never appear on the public feedback wall');
    await publicPage.screenshot({ path: path.join(__dirname, 'evidence', 'support-ticket-receipt.png'), fullPage: true, animations: 'disabled' });
    const learnerContext = await context(browser, { width: 390, height: 844 });
    await login(learnerContext, 'student');
    const learnerPage = await learnerContext.newPage();
    await learnerPage.goto(BASE + '/open#feedback');
    await learnerPage.getByRole('button', { name: 'Submit a support ticket' }).click();
    assert.equal(await learnerPage.locator('#supportTicketForm input[name="name"]').inputValue(), 'QA student');
    assert.equal(await learnerPage.locator('#supportTicketForm input[name="email"]').inputValue(), 'student@qa.invalid');
    assert.equal(await learnerPage.locator('#supportTicketForm input[name="email"]').isEditable(), false);
    const learnerAdminAttempt = await learnerContext.request.get(BASE + '/api/admin/support-tickets');
    assert.equal(learnerAdminAttempt.status(), 403);
    const unrelatedTicketAttempt = await learnerContext.request.get(BASE + `/api/public/support-tickets/${ticketNumber}`);
    assert.equal(unrelatedTicketAttempt.status(), 404);
    await learnerContext.close();

    const adminContext = await context(browser, { width: 1440, height: 1000 });
    await login(adminContext, 'admin');
    const adminPage = await adminContext.newPage();
    await adminPage.goto(BASE + '/dashboard#view=admin-feedback');
    await adminPage.locator('#view-admin-feedback').waitFor({ state: 'visible' });
    await adminPage.getByText(subject, { exact: false }).waitFor();
    assert.match(await adminPage.locator('#view-admin-feedback').innerText(), new RegExp(ticketNumber));
    let ticketRow = adminPage.locator('#view-admin-feedback .list-row').filter({ hasText: subject });
    await ticketRow.locator('textarea[name="message"]').fill('Please tell us which browser and operating system you are using.');
    await ticketRow.getByRole('button', { name: 'Request information' }).click();
    await adminPage.getByText('Please tell us which browser', { exact: false }).waitFor();

    await publicPage.goto(replyUrl);
    await publicPage.getByText('Please tell us which browser', { exact: false }).waitFor();
    await publicPage.screenshot({ path: path.join(__dirname, 'evidence', 'support-ticket-conversation.png'), fullPage: true, animations: 'disabled' });
    await publicPage.locator('#supportReplyForm textarea[name="message"]').fill('I am using Chrome 140 on Windows 11.');
    await publicPage.getByRole('button', { name: 'Send reply' }).click();
    await publicPage.getByText('Your reply was sent to EchoLens Support.').waitFor();
    await publicContext.close();

    await adminPage.reload();
    await adminPage.locator('#view-admin-feedback').waitFor({ state: 'visible' });
    await adminPage.getByText('I am using Chrome 140', { exact: false }).waitFor();
    await adminPage.screenshot({ path: path.join(__dirname, 'evidence', 'support-ticket-admin-queue.png'), fullPage: true, animations: 'disabled' });
    ticketRow = adminPage.locator('#view-admin-feedback .list-row').filter({ hasText: subject });
    await ticketRow.locator('textarea[name="resolution"]').fill('The compiler dark theme was updated so the editor foreground and background now pass contrast checks.');
    await ticketRow.getByRole('button', { name: 'Resolve & email' }).click();
    await adminPage.getByText(subject, { exact: false }).waitFor({ state: 'detached' });
    const queue = await adminContext.request.get(BASE + '/api/admin/support-tickets');
    assert.equal(queue.ok(), true);
    assert.equal((await queue.json()).tickets.some((ticket) => ticket.ticket_no === ticketNumber), false);
    await adminContext.close();
    console.log(JSON.stringify({ ticket: ticketNumber, submitted: true, signed_in_identity_prefilled: true, admin_requested_information: true, user_replied_in_portal: true, visible_to_admin: true, cleared_after_resolution: true }));
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
