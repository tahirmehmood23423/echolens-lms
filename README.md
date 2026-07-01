# EchoLens LMS

A company-managed learning portal for EchoLens. There is no public website — the app opens on a sign-in screen, and everything is organised around **courses**. Admin creates accounts and courses; teachers get teaching tools for the courses they are assigned; students see their courses, schedule, content and assignments.

Built with Node.js and Express, with a file-backed database. No build step, so it runs and deploys almost anywhere.

> For how the data works and how to put it online, see **GUIDE.md**.

## How it works

- **Sign in only.** No self-registration. People log in with a **username and password** issued by the school.
- **Auto-generated credentials.** Inside a course, the admin types student names (one per line) and the system creates each username and password and enrols them. Assigning a teacher by name works the same way. The generated logins are shown once to copy and share.
- **Everything lives inside the course.** Open a course and use the **three-dots menu** to schedule classes, add content and files, add assignments, post announcements, add students, and assign or change the teacher. Nothing is buried at the bottom of the dashboard.
- **Teachers mirror students.** An assigned course appears in the teacher's dashboard and its classes in their schedule, plus the teaching tools.
- **Assignments.** Teachers post assignments; students submit by file upload; teachers review submissions per assignment.
- **Admin control.** Add or remove students and teachers on any course, and reassign at any time.
- **Email (optional).** Course announcements email everyone on the course who has an email on file. Works once SMTP is configured; until then messages are logged.

## Roles

- **admin** - runs the school: catalogue, starting courses, accounts, enrolment, and everything a teacher can do.
- **teacher** (stored as `instructor`) - manages the courses they are assigned to.
- **student** - sees their courses, schedule, content, and assignments; submits work.

## Run it locally

You need Node.js 18 or newer.

```bash
npm install
npm run seed      # creates the database and demo accounts
npm start         # starts the server
```

Open http://localhost:3000

### Demo accounts (username / password) - change after first sign in

| Role    | Username  | Password       |
|---------|-----------|----------------|
| Admin   | admin@echolens.digital     | ChangeMe!2026  |
| Teacher | teacher@echolens.digital   | ChangeMe!2026  |
| Student | student@echolens.digital   | ChangeMe!2026  |

Sign in as **admin**, open **Catalogue & new course** to start a course, then open the course and use the three-dots menu to add students, assign a teacher, schedule classes, add content, and set assignments.

## Project structure

```
echolens-lms/
  server.js              Express app: auth + course-centric API
  store.js               Data store (all collections, queries, seed)
  mailer.js              Email sending and templates
  package.json
  .env.example
  GUIDE.md               Database explanation + real-time deployment
  public/
    login.html           Sign-in portal (uses the logo)
    dashboard.html       The app shell
    css/styles.css       Design system (navy + teal, Fraunces + Inter)
    img/logo.png         Company logo
    js/login.js          Login logic
    js/dashboard.js      Course-centric dashboard logic
```

## Deploying

See **GUIDE.md** for step-by-step deployment on Render (free, with a persistent disk so your data and uploads survive restarts), including environment variables, seeding, and pointing `lms.echolens.digital` at it.

## Security notes

Hashed passwords (bcrypt), HTTP-only signed cookies, server-side role and course-ownership checks on every protected route, output escaping in the browser, and a 50 MB upload limit. Set a strong `JWT_SECRET` and run with `NODE_ENV=production` (enables secure cookies over HTTPS) in production.
