# EchoLens LMS - Database & Deployment Guide

This explains **how the data works** (users, courses, slides, assignments, submissions) and **how to put the portal online right now**.

---

## Part 1 - How the database works

### Where the data lives

All records are kept in a single file: **`echolens.json`** (its location is set by `DB_PATH`). Uploaded files (slides, assignment files, student submissions) are kept in the **`uploads/`** folder (set by `UPLOAD_DIR`). Only the file's link is stored in the database; the file itself sits in `uploads/`.

You never edit `echolens.json` by hand — the app reads and writes it for you. But it is plain, readable JSON, which makes backups and inspection easy.

### The collections (think of these as tables)

| Collection | What it holds | Key fields |
|---|---|---|
| `users` | Every account | id, name, **username**, email (optional), password_hash, role (`admin` / `instructor` / `student`) |
| `courses` | The catalogue (course definitions) | id, code, title, tier, weeks, hours, price_pkr |
| `batches` | A course that has been **started** (a running cohort) | id, course_id, name, start_date, status, **instructor_id** |
| `enrollments` | Which student is in which running course | id, user_id, batch_id |
| `sessions` | Live classes on the schedule | id, batch_id, title, date, start/end time, join_url |
| `lessons` | Content: slides, readings, notebooks, videos | id, course_id, batch_id, title, type, url |
| `assignments` | Assignments set by a teacher/admin | id, batch_id, title, description, due_date, file_url |
| `submissions` | A student's answer, plus its grade and gems | id, assignment_id, user_id, file_url, grade, gems, remarks, submitted_at |
| `announcements` | Messages (course-wide or global) | id, batch_id (null = everyone), author_id, title, body |

### How the pieces connect

```
courses (catalogue)
   |
   |  admin "starts a course"
   v
batches (running course) ----- instructor_id -----> users (a teacher)
   |  \
   |   \--- sessions (live classes on the schedule)
   |   \--- lessons (slides / content)
   |   \--- assignments ---> submissions ---> users (a student)
   |
enrollments ---> users (the students on this course)
```

- A **teacher** is linked to a running course through `batches.instructor_id`. That is why an assigned course automatically appears in the teacher's dashboard and its classes in their schedule.
- A **student** is linked through `enrollments`. Same idea: their courses and classes appear automatically.
- **Gems**: when a teacher grades a submission (0-100%), the student earns gems = assignment points x grade. Students see gems and remarks (not the raw percentage); teachers and admins see everything. Leaderboards rank students and courses by gems.
- **Slides and files**: when you upload content, the file is saved in `uploads/` and a `lessons` record stores its link. Assignment reference files work the same way (`assignments.file_url`), and so do student answers (`submissions.file_url`).

### How logins are created

You never type passwords for students. You enter their **names**, and the system:

1. makes a **username** from the name ending in the platform domain (e.g. "Bilal Noor" becomes `bilal.noor@echolens.digital`; duplicates get a number, `bilal.noor2@echolens.digital`),
2. generates an 8-character **password**,
3. shows you the list **once** so you can copy and share it,
4. stores only a secure hash of the password (never the plaintext).

Every username ever issued is kept in a permanent registry, so names are **never reused** even after a student or course is deleted.

Teachers are created the same way when you assign one by name. Everyone can change their own password from **Profile** after signing in.

### Backups

The database file is written **atomically** (write-then-rename) so a crash mid-save cannot corrupt it. To back up everything, copy two things: the **`echolens.json`** file and the **`uploads/`** folder. An admin can also download a full snapshot anytime from **Overview > Full backup (JSON)**. To restore, put the files back. That is your entire database.

### Growing later

Because every read and write goes through one file (`store.js`), you can move to a full SQL database (such as PostgreSQL) later by reimplementing that one file — the rest of the app does not change. For large numbers of uploaded files, move `uploads/` to object storage (Cloudflare R2 or Amazon S3); only the stored links change.

---

## Part 2 - Deploy in real time (free)

The recommended host is **Render** because its free tier supports a small **persistent disk**, which you need so your database file and uploads survive restarts. (Railway works too; notes at the end.)

### Step 1 - Put the code on GitHub

1. Create a free account at github.com and a new **empty** repository called `echolens-lms`.
2. Upload this project folder to it (drag-and-drop in the GitHub web UI works, or use `git`). Do **not** upload `node_modules`, `.env`, `echolens.json`, or `uploads/` — the included `.gitignore` already excludes them.

### Step 2 - Create the web service on Render

1. Sign in at render.com, choose **New > Web Service**, and connect your GitHub repo.
2. Settings:
   - **Runtime:** Node
   - **Build command:** `npm install`
   - **Start command:** `npm start`
   - **Instance type:** Free

### Step 3 - Add a persistent disk

In the service's **Disks** section, add a disk:
- **Mount path:** `/data`
- **Size:** 1 GB is plenty to start.

This gives you a folder at `/data` that is not wiped on restart.

### Step 4 - Set environment variables

In the service's **Environment** section, add:

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | a long random string (see below) |
| `APP_URL` | your Render URL, e.g. `https://echolens-lms.onrender.com` |
| `DB_PATH` | `/data/echolens.json` |
| `UPLOAD_DIR` | `/data/uploads` |

Generate a strong `JWT_SECRET` by running this on your computer and pasting the result:

```
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

To send real emails, also add the SMTP variables from `.env.example` (Gmail needs an **App Password**, not your normal password). You can add these later; the app runs fine without them.

### Step 5 - First deploy and seed

1. Click **Create Web Service**. Render builds and starts it. When it is live, open the URL — you will see the login screen.
2. Seed the starter data **once**: open the service's **Shell** tab on Render and run:

   ```
   npm run seed
   ```

   This creates the demo accounts (admin / teacher / student, password `ChangeMe!2026`).
3. Sign in as **admin**, go to **Profile**, and change the password immediately. Then create your real courses and accounts.

### Step 6 - Use your own domain (optional)

1. In Render, open **Settings > Custom Domains** and add `lms.echolens.digital`.
2. In your domain's DNS, add the **CNAME** record Render shows you.
3. Once it verifies, your portal is live at `https://lms.echolens.digital`. Update `APP_URL` to that address.

### Railway alternative

Railway is similar: create a project from your GitHub repo, add a **Volume** mounted at `/data`, set the same environment variables, and use start command `npm start`. Seed once from its shell with `npm run seed`.

### After you are live

- Change all demo passwords.
- Create your catalogue and start your first real course.
- Back up `/data/echolens.json` and `/data/uploads` regularly (download them from the Render shell, or copy to your own storage).
