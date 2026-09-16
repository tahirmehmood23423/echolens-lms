'use strict';

// Public demonstration credentials, used only with synthetic demo records.
module.exports = Object.freeze([
  { username: 'admin', role: 'admin', label: 'Administrator', description: 'Courses, users, reports, certificates and settings' },
  { username: 'teacher', role: 'instructor', label: 'Instructor', description: 'Teaching, assignments, grading and attendance' },
  { username: 'student', role: 'student', label: 'Student', description: 'Courses, learning progress, gems and certificates' },
  { username: 'free', role: 'free', label: 'Free learner', description: 'Open courses, assignments and learner profile' },
  { username: 'coord', role: 'coordinator', label: 'Academic coordinator', description: 'Course oversight, student rosters and reporting' },
  { username: 'hr', role: 'hr', label: 'Human resources', description: 'Staff, departments, contracts and onboarding' },
  { username: 'finance', role: 'finance', label: 'Finance', description: 'Fees, payments, expenses and balance sheet' },
  { username: 'admit', role: 'student_coordinator', label: 'Admissions', description: 'Registrations, challans and enrollment support' },
  { username: 'staff', role: 'staff', label: 'Staff', description: 'Department tasks, announcements and staff profile' },
  { username: 'amb', role: 'ambassador', label: 'Ambassador', description: 'Referrals, duties and ambassador performance' },
  { username: 'recruit', role: 'recruiter', label: 'Recruiter', description: 'Talent profiles, projects, search and shortlists' },
  { username: 'head', role: 'staff', label: 'Department head', description: 'Department roster, tasks and member progress' },
]);
