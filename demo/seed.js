'use strict';

const accounts = require('./accounts');
const date = days => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
module.exports = async function seed(s, pg) {
  const users = {};
  for (const a of accounts) {
    const u = s.Users.createFixed({ name: 'Demo ' + a.label, role: a.role, username: a.username, email: a.username + '@demo.invalid', password: 'admin' });
    u.onboarding_complete = true;
    u.profile = { phone: 'DEMO-0000', whatsapp: 'DEMO-0000', city: 'Lahore', university: 'Sample University', degree: 'Computer Science', study_year: '3', goal: 'Explore the learning platform', bio: 'Fictional account for product demonstrations.' };
    users[a.username] = u;
  }
  const { admin, teacher, student, free, hr, finance, admit, staff, amb, recruit, head } = users;
  s.Settings.setCert({ org: 'EchoLens DEMO', ceo_name: 'Demo Signatory', tagline: 'Demonstration only - not a qualification', ntn: 'DEMO', cuin: 'DEMO' });
  s.Settings.setBank({ bank_name: 'DEMO - Do not pay', account_title: 'Fictional demo account', account_number: 'DEMO-NOT-PAYABLE', iban: 'DEMO-NOT-PAYABLE', branch: 'Sample branch' });
  s.loadOfficialCatalogue();
  const course = s.Courses.byCode('SC-01');
  const batch = s.Batches.create({ course_id: course.id, name: 'Demo learning cohort', start_date: date(-14), instructor_ids: [teacher.id] });
  s.Enrollments.create(student.id, batch.id);
  // Reuse the real curriculum so the demo reflects the shipped product.
  const track = s.Quests.tracks().find(t => t.course_code === 'SC-01') || s.Quests.tracks()[0];
  const installed = s.Quests.install(batch.id, track.key);
  if (installed.error) throw new Error(installed.error);
  for (const q of s.Quests.forBatch(batch.id).slice(0, 2)) {
    for (const p of q.problems.slice(0, 2)) {
      const sub = s.Quests.submit({ quest_id: q.id, pid: p.pid, user_id: student.id, code: 'print("Demo learning project")', language: 'python', note: 'Sample submission for browsing the assessment workflow.' });
      s.Quests.grade(sub.id, 88, 'Sample feedback: clear approach; add edge-case tests.', teacher.id);
    }
  }
  const pendingQuest = s.Quests.forBatch(batch.id)[2];
  if (pendingQuest) s.Quests.submit({ quest_id: pendingQuest.id, pid: pendingQuest.problems[0].pid, user_id: student.id, code: 'print("Pending review sample")', language: 'python', note: 'Demonstration of work awaiting review.' });
  for (const [i, title] of ['Course introduction', 'Practical workshop', 'Project review'].entries()) {
    const session = s.Sessions.create({ batch_id: batch.id, week_no: i + 1, title, session_date: date(i === 0 ? -7 : i + 1), start_time: '18:00', end_time: '19:30' });
    if (i === 0) {
      session.started_at = date(-7) + 'T18:00:00Z'; session.ended_at = date(-7) + 'T19:30:00Z';
      s.Attendance.mark(session.id, student.id).minutes = 78;
    }
  }
  s.Lessons.create({ batch_id: batch.id, course_id: course.id, week_no: 1, title: 'Sample project brief', type: 'slides', url: '/demo-sample.pdf', position: 1 });
  s.Announcements.create({ batch_id: null, title: 'Welcome to the read-only demo', body: 'All people, submissions, payment records and certificates here are fictional. Open pages and forms to explore; saving and external services are disabled.' }, admin.id);
  s.Announcements.create({ batch_id: batch.id, title: 'Project review this week', body: 'Browse sample grades, assignment details and feedback in this cohort.' }, teacher.id);
  s.Chat.post({ batch_id: batch.id, user: teacher, body: 'Welcome to this sample course discussion. Lesson materials are in the Content tab.' });
  s.Chat.post({ batch_id: batch.id, user: student, body: 'Thank you! I have reviewed the sample project brief.' });
  const report = s.AiReports.create({ user_id: student.id, batch_id: batch.id, markdown: '## Sample activity report\n\nThis is a prewritten demonstration, not a live AI analysis.\n\nThe learner completed introductory exercises and reviewed feedback. Suggested next step: practise edge cases. Browser activity is not proof of assessment correctness.' }, teacher.id);
  s.AiReports.publish(report.id);
  s.Quizzes.create({ batch_id: batch.id, title: 'Demo knowledge check', duration_min: 10, points: 20, created_by: teacher.id, questions: [{ q: 'Which tool stores version history?', options: ['Git', 'A calculator'], answer: 0 }] });
  for (const u of [student, free]) {
    const enrolled = s.OpenQuest.enroll(u.id, 'fc01-c-basics');
    if (enrolled.error) throw new Error(enrolled.error);
    for (const e of u.profile.free_course_enrollments || []) { e.enrolled_at = date(-10) + 'T00:00:00Z'; e.activates_at = date(-9) + 'T00:00:00Z'; e.confirmed_at = e.activates_at; }
    const level = s.Quests.trackDef('fc01-c-basics').levels[0];
    const attempt = s.OpenQuest.submit({ user: u, track_key: 'fc01-c-basics', level: level.no, pid: level.problems[0].pid, code: '#include <stdio.h>\nint main(void) { puts("Demo"); return 0; }', language: 'c', output: 'Demo' });
    if (attempt.error) throw new Error(attempt.error);
    s.OpenAttempts.complete(attempt.attempt.id, 90, 'Sample feedback: a readable introductory solution.', 'staff');
    const cert = s.Certificates.issue({ user_id: u.id, batch_id: u === student ? batch.id : null, kind: 'course', title: 'DEMO — Sample learning certificate', detail: 'Demonstration only. This is not a qualification or a record of actual completion.', issued_by: admin.id, instructor_id: teacher.id, concepts: ['Sample learning outcomes'] }).cert;
    cert.serial = 'DEMO-' + u.username.toUpperCase() + '-001';
    const ticket = s.SupportTickets.create({ user_id: u.id, name: u.name, email: u.email, category: 'course', subject: 'Sample: finding lesson resources', message: 'Where can I find the workshop materials?' });
    s.SupportTickets.addAdminMessage(ticket.id, 'Open your course and select the Content tab to find the sample project brief.', admin.name, false);
  }
  for (const [name, members, lead] of [
    ['HR', [hr], hr], ['Finance', [finance], finance], ['Admissions', [admit], admit],
    ['Teachers', [teacher], teacher], ['Ambassadors', [amb], amb], ['Demo Operations', [head, staff], head],
  ]) {
    const dep = s.Departments.byName(name) || s.Departments.create({ name }, admin.id);
    s.Departments.setHead(dep.id, lead.id);
    for (const u of members) s.DepartmentMembers.add(dep.id, u.id, admin.id);
    s.DepartmentAnnouncements.create({ department_id: dep.id, title: 'Demo team update', body: 'Explore the roster, assignments and completion evidence for this sample department.' }, lead.id);
    s.DepartmentTasks.create({ department_id: dep.id, title: 'Review the sample onboarding guide', description: 'A demonstration task showing member assignment and progress.', scope: 'all' }, lead.id);
    const done = s.DepartmentTasks.create({ department_id: dep.id, title: 'Prepare the weekly summary', description: 'Completed sample task with evidence notes.', scope: 'all' }, lead.id);
    s.DepartmentTasks.markDone(done.task.id, members[0].id, { note: 'Sample summary prepared for the team.' });
  }
  for (const u of [staff, head, hr, teacher]) {
    const record = s.StaffRecords.create({ user_id: u.id, name: u.name, email: u.email, position: u === head ? 'Department Head' : u.role, employment_type: 'paid_staff' });
    s.StaffRecords.addInstruction(record.id, { body: 'Sample onboarding: review the team workflow and department tasks.', by: admin.name });
    s.StaffRecords.addFollowUp(record.id, { body: 'Sample follow-up: how is your onboarding progressing?', by: hr.name });
  }
  const ambassador = s.Ambassadors.create({ user_id: amb.id, name: amb.name, email: amb.email, university: 'Sample University' }, admin.id);
  for (const [i, name] of ['Sample Applicant One', 'Sample Applicant Two', 'Sample Applicant Three'].entries()) {
    const reg = s.Registrations.create({ name, email: `applicant${i}@demo.invalid`, whatsapp: 'DEMO-0000', city: 'Lahore', course_code: 'SC-01', note: 'Fictional admissions record.', ambassador_code: ambassador.code, ambassador_name: amb.name });
    if (i > 0) {
      const { challan } = s.Challans.generate({ registration_id: reg.id, deadline: date(14), generated_by: admit.id });
      reg.status.challan_sent = true; reg.payment_stage = 'challan_sent';
      if (i === 2) { challan.status = 'paid'; challan.paid_at = new Date().toISOString(); reg.payment_stage = 'paid_cleared'; }
    }
  }
  s.Expenses.create({ date: date(-2), category: 'Training', description: 'DEMO workshop materials', amount: 2500 }, finance.id);
  s.Jobs.create({ title: 'Sample junior developer opportunity', company: 'Demo Studio', location: 'Remote', job_type: 'Full-time', description: 'Fictional listing illustrating the jobs portal.', requirements: 'Python, Git and communication skills', posted_by: admin.id });
  s.Events.create({ kind: 'webinar', title: 'Demo career workshop', description: 'A sample event for exploring registrations and event management.', scope: 'both', entry: 'free', starts_at: date(3) + 'T18:00', ends_at: date(3) + 'T19:00', open: true }, admin.id);
  const feedback = s.Feedback.create({ name: student.name, email: student.email, message: 'Sample testimonial for the demo. This is not real customer feedback.', rating: 5 });
  s.Feedback.setStatus(feedback.id, 'approved', admin.name);
  s.CoordinatorQueries.create({ student_id: student.id, student_name: student.name, subject: 'Sample enrollment query', body: 'When does the next workshop begin?' });
  const company = s.Companies.create({ domain: 'demo.invalid', name: 'Demo Studio', size_band: '11-50' });
  recruit.company_id = company.id; recruit.status = 'approved';

  await pg.query(`INSERT INTO talent_profiles (user_id,handle,headline,about,city,remote_pref,availability,work_type,published,education,gems_cache,level_cache,certificate_titles)
    VALUES ($1,'demo-student','Demo Python developer','Fictional candidate profile with sample projects and learning achievements.','Lahore','remote','immediately',ARRAY['full_time','internship'],true,$2,320,'Explorer',ARRAY['DEMO — Sample learning certificate'])`,
    [student.id, JSON.stringify([{ school: 'Sample University', degree: 'BS', field: 'Computer Science', start_year: 2023, end_year: 2027 }])]);
  await pg.query(`INSERT INTO student_skills (user_id,skill_id) SELECT $1,id FROM skills WHERE name IN ('Python','Git','SQL')`, [student.id]);
  await pg.query(`INSERT INTO projects (user_id,source,verified,title,summary,description_markdown,tech_stack,course_name,task_title,instructor_grade,submission_date)
    VALUES ($1,'course',true,'Demo learning dashboard','Sample coursework project.','A fictional project to demonstrate portfolio presentation.',ARRAY['Python','SQL'],$2,'Sample project',88,$3)`, [student.id, course.title, date(-2)]);
  const request = (await pg.query(`INSERT INTO contact_requests (recruiter_id,student_id,message,status,responded_at) VALUES ($1,$2,'Sample introduction from Demo Studio.','accepted',now()) RETURNING id`, [recruit.id, student.id])).rows[0];
  await pg.query(`INSERT INTO contact_reveals (contact_request_id,recruiter_id,student_id,message) VALUES ($1,$2,$3,'Sample consent record')`, [request.id, recruit.id, student.id]);
  await pg.query(`INSERT INTO messages (contact_request_id,sender_role,body) VALUES ($1,'recruiter','Welcome! This is a sample conversation.'),($1,'student','Thank you. These messages are fictional and read-only.')`, [request.id]);
  const list = (await pg.query(`INSERT INTO shortlists (recruiter_id,name) VALUES ($1,'Demo developer shortlist') RETURNING id`, [recruit.id])).rows[0];
  await pg.query(`INSERT INTO shortlist_candidates (shortlist_id,student_id,note) VALUES ($1,$2,'Sample candidate for review')`, [list.id, student.id]);
  await pg.query(`INSERT INTO saved_searches (recruiter_id,name,filters) VALUES ($1,'Remote Python talent',$2)`, [recruit.id, JSON.stringify({ q: 'Python' })]);

  const { PDFDocument, StandardFonts } = require('pdf-lib');
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage();
  page.drawText('EchoLens - SAMPLE PROJECT BRIEF', { x: 50, y: 770, font, size: 20 });
  page.drawText('Demonstration only. Build a small dashboard and explain your approach.', { x: 50, y: 730, font, size: 12 });
  const pdf = Buffer.from(await doc.save());
  const fs = require('node:fs'); const path = require('node:path');
  fs.mkdirSync(process.env.UPLOAD_DIR, { recursive: true });
  fs.writeFileSync(path.join(process.env.UPLOAD_DIR, 'demo-sample.pdf'), pdf);
  const contracts = path.join(process.env.UPLOAD_DIR, 'contracts');
  fs.mkdirSync(contracts, { recursive: true });
  const contractDoc = await PDFDocument.create();
  const contractPage = contractDoc.addPage();
  contractPage.drawText('SAMPLE CONTRACT - DEMONSTRATION ONLY', { x: 45, y: 760, size: 18 });
  contractPage.drawText('Fictional onboarding document. Not a contract or offer of employment.', { x: 45, y: 725, size: 12 });
  fs.writeFileSync(path.join(contracts, 'demo-contract.pdf'), Buffer.from(await contractDoc.save()));
  for (const u of [teacher, amb, staff]) {
    s.Contracts.create({ user_id: u.id, role: u.role, pdf_filename: 'demo-contract.pdf', deadline_at: date(30) + 'T23:59:59Z' }).status = 'submitted';
  }
};
