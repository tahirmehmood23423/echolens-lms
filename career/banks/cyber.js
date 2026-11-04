'use strict';
/**
 * Cybersecurity Analyst track. Defensive and analytical only: every task uses
 * simulated, authorised lab data; nothing asks students to attack real systems.
 */
const { mc, out, written, submission } = require('../q');

module.exports = [
  // ---- Networking ----
  mc('sc-nw-01', 'sec.networking', 1, 'Which port does HTTPS use by default?', ['443', '80', '22', '25'], 0, 'HTTPS defaults to 443, HTTP to 80, SSH to 22 and SMTP to 25.'),
  mc('sc-nw-02', 'sec.networking', 2, 'What is the main difference between TCP and UDP?', ['TCP sets up a connection and guarantees ordered delivery; UDP sends datagrams without those guarantees', 'UDP is encrypted and TCP is not', 'TCP is only for email', 'There is no difference'], 0,
    'TCP trades some speed for reliability; UDP suits real-time traffic such as voice and DNS queries.'),
  mc('sc-nw-p1', 'sec.networking', 2, 'In a lab firewall log you see thousands of connection attempts from one IP to ports 1-1024 within a minute. What activity does this show?',
    ['A port scan, mapping which services are open', 'A normal software update', 'A user browsing the web', 'A DNS lookup'], 0,
    'Rapid attempts across many ports from one source are the signature of a port scan.', { practical: true }),
  mc('sc-nw-s1', 'sec.networking', 3, 'A small office keeps its file server, staff laptops and guest Wi-Fi on one flat network. What should you recommend first?',
    ['Segment the network so guests and servers are on separate networks with firewall rules between them', 'Turn off the Wi-Fi', 'Give every guest the server password', 'Buy faster routers'], 0,
    'Segmentation limits what a compromised or untrusted device can reach.', { type: 'scenario' }),

  // ---- Linux ----
  mc('sc-lx-01', 'sec.linux', 1, 'Which command lists files in a directory, including hidden files?', ['ls -la', 'cd -a', 'rm -rf', 'cat -l'], 0, 'ls -l gives details and -a includes dot-files.'),
  mc('sc-lx-02', 'sec.linux', 2, 'A file has permissions -rwxr-x---. Who can read it?', ['The owner and members of the file\'s group', 'Everyone', 'Only root', 'Nobody'], 0,
    'rwx for the owner, r-x for the group and --- for others: owner and group can read.'),
  out('sc-lx-p1', 'sec.linux', 2, 'Type the chmod command (numeric form) that gives the owner read and write access to secret.txt, and nobody else any access.', null, ['chmod 600 secret.txt', 'chmod 0600 secret.txt'],
    'Read (4) + write (2) = 6 for the owner, 0 for group and others: 600.', { category: 'practical' }),
  mc('sc-lx-s1', 'sec.linux', 3, 'You find a cron job on a lab server that runs a script from /tmp every minute as root, and nobody knows who added it. What do you do first?',
    ['Preserve evidence (copy the script and logs), then disable the job and report it as a possible compromise', 'Delete everything in /tmp immediately', 'Ignore it', 'Reboot the server and forget about it'], 0,
    'Unknown root jobs running from world-writable locations are a classic persistence technique; keep evidence before cleaning up.', { type: 'scenario' }),

  // ---- Security principles ----
  mc('sc-pr-01', 'sec.principles', 1, 'What does the CIA triad in security stand for?', ['Confidentiality, Integrity, Availability', 'Control, Inspection, Access', 'Cyber, Internet, Attack', 'Code, Identity, Audit'], 0,
    'Security aims to keep data secret, accurate and available.'),
  mc('sc-pr-02', 'sec.principles', 2, 'What is the principle of least privilege?', ['Give each user and program only the access it needs to do its job', 'Give everyone admin rights to save time', 'Remove all passwords', 'Only managers may use computers'], 0,
    'Limiting privileges limits the damage when an account is compromised.'),
  mc('sc-pr-p1', 'sec.principles', 2, 'An intern\'s account can read every student\'s fee records although the intern only needs the course timetable. Which change applies least privilege?',
    ['Restrict the account to timetable access only', 'Change the intern\'s password', 'Log out the intern', 'Give the intern admin rights for convenience'], 0,
    'Access should match the job; reducing permissions removes unnecessary exposure.', { practical: true }),
  mc('sc-pr-s1', 'sec.principles', 3, 'A website\'s only defence is a strong firewall. What does "defence in depth" suggest adding?',
    ['Several independent layers: patching, strong authentication, monitoring, backups and least-privilege access', 'A second identical firewall only', 'Nothing - one strong layer is enough', 'Hiding the website address'], 0,
    'If one control fails, others still protect the system.', { type: 'scenario' }),

  // ---- Authentication security ----
  mc('sc-au-01', 'sec.auth', 1, 'What is multi-factor authentication (MFA)?', ['Proving identity with two or more kinds of factor, such as a password plus a code from a phone', 'Using a very long password', 'Logging in twice', 'Sharing an account'], 0,
    'MFA combines something you know, have or are, so a stolen password alone is not enough.'),
  mc('sc-au-02', 'sec.auth', 2, 'What is credential stuffing?', ['Trying username-password pairs leaked from other sites, relying on password reuse', 'Writing passwords on paper', 'A strong password policy', 'Encrypting passwords'], 0,
    'Attackers reuse leaked credentials at scale; MFA and breached-password checks defend against it.'),
  mc('sc-au-p1', 'sec.auth', 3, 'Lab login logs show one IP trying 5,000 different accounts with one common password each. What control helps most?',
    ['Rate-limit and block by IP and account, require MFA, and alert on many failed logins across accounts', 'Make the login page slower for everyone', 'Email all users their passwords', 'Disable logging'], 0,
    'This is password spraying; rate limits, MFA and cross-account alerting stop it.', { practical: true }),
  mc('sc-au-s1', 'sec.auth', 3, 'Staff receive an email that looks like it comes from IT, asking them to "confirm their password" on a linked page. What should the security team do?',
    ['Warn staff, block the sender and link, check logs for anyone who entered credentials, and reset those passwords', 'Ignore it', 'Reply asking who sent it', 'Ask staff to forward it to everyone'], 0,
    'Phishing response contains the threat, finds affected users and resets compromised credentials.', { type: 'scenario' }),

  // ---- Log analysis ----
  mc('sc-lg-01', 'sec.logs', 1, 'What is a SIEM?', ['A system that collects and correlates security logs and raises alerts', 'A type of virus', 'A web browser', 'A backup tape'], 0,
    'Security information and event management tools centralise logs for detection and investigation.'),
  mc('sc-lg-02', 'sec.logs', 2, 'Which log pattern most suggests a compromised account?', ['A login from a new country at 3 a.m., followed by a mass download of files', 'A user logging in at 9 a.m. from their usual office', 'A failed login with a typo, then success', 'A password change after a reminder email'], 0,
    'Unusual location and time followed by unusual data access is a strong signal.'),
  out('sc-lg-p1', 'sec.logs', 2, 'In these lab auth logs, how many FAILED login attempts came from 10.0.0.9?', 'Accepted password for ali from 10.0.0.4\nFailed password for admin from 10.0.0.9\nFailed password for root from 10.0.0.9\nFailed password for sara from 10.0.0.7\nFailed password for admin from 10.0.0.9\nAccepted password for admin from 10.0.0.9', ['3'],
    'Three "Failed" lines come from 10.0.0.9 - and the last line shows that IP then logged in as admin, which needs investigation.', { category: 'practical' }),
  mc('sc-lg-s1', 'sec.logs', 3, 'Following the previous logs: 10.0.0.9 failed three times and then logged in as admin. What is your next step?',
    ['Treat it as a likely brute-force success: check what the admin session did, contain the account (disable/reset), and preserve the logs', 'Close the alert - the login succeeded', 'Delete the logs', 'Wait a week'], 0,
    'Failures followed by success from the same source may mean a guessed password; investigate the session and contain it.', { type: 'scenario' }),

  // ---- Vulnerability management ----
  mc('sc-vu-01', 'sec.vulns', 1, 'What is a CVE?', ['A public identifier for a known vulnerability', 'A type of firewall', 'An antivirus brand', 'A password manager'], 0,
    'CVE IDs let everyone refer to the same vulnerability.'),
  mc('sc-vu-02', 'sec.vulns', 2, 'What does a CVSS score describe?', ['The severity of a vulnerability on a 0-10 scale', 'The number of users affected', 'The cost of a fix', 'The age of the software'], 0,
    'CVSS rates severity; your own risk also depends on exposure and asset value.'),
  mc('sc-vu-p1', 'sec.vulns', 3, 'A scan finds three issues: a critical flaw on an internet-facing web server, a high flaw on an internal test VM, and a medium flaw on a laptop. In what order do you fix them?',
    ['Internet-facing critical first, then the laptop or test VM according to exposure and value', 'Alphabetical order', 'The test VM first because it is easiest', 'All at once next month'], 0,
    'Prioritise by severity AND exposure: an internet-facing critical issue is the most likely to be exploited.', { practical: true }),
  mc('sc-vu-s1', 'sec.vulns', 3, 'A critical patch is available, but the vendor warns it may break the student portal. What do you do?',
    ['Test the patch on staging, apply temporary mitigations meanwhile, then patch production in a planned window', 'Never patch', 'Patch production immediately without testing', 'Wait for an attack first'], 0,
    'Balance risk and stability: mitigate now, test, then roll out on a schedule.', { type: 'scenario' }),

  // ---- Incident response ----
  mc('sc-ir-01', 'sec.incident', 1, 'Which is the usual order of incident-response phases?', ['Preparation, detection, containment, eradication, recovery, lessons learned', 'Recovery, detection, preparation', 'Eradication, then detection', 'Lessons learned first'], 0,
    'The standard lifecycle moves from being ready, to finding, limiting, removing, restoring and improving.'),
  mc('sc-ir-02', 'sec.incident', 2, 'Why preserve evidence before wiping an infected machine?', ['To learn how the attack happened and support any investigation', 'Evidence speeds up the wipe', 'Wiping is not allowed', 'To keep the malware running'], 0,
    'Without evidence you cannot find the entry point and may be attacked the same way again.'),
  mc('sc-ir-p1', 'sec.incident', 3, 'A lab workstation is encrypting shared files (ransomware). What is the FIRST action?',
    ['Isolate the machine from the network to stop the spread', 'Pay the ransom', 'Restart the machine repeatedly', 'Email everyone the ransom note'], 0,
    'Containment comes first: disconnect the host so it cannot encrypt more shares, then investigate and restore from backups.', { practical: true }),
  mc('sc-ir-s1', 'sec.incident', 3, 'After an incident is resolved, management wants to move on. What should still happen?',
    ['A lessons-learned review: root cause, timeline, what worked, and concrete improvements with owners', 'Nothing - it is resolved', 'Blame a person and close it', 'Delete the incident records'], 0,
    'The review turns one incident into stronger defences for the next.', { type: 'scenario' }),

  // ---- Reviewed ----
  written('sc-wr-01', 'sec.principles', 2, 'theory', 'Explain the CIA triad and give one realistic threat to each of confidentiality, integrity and availability for a university student portal.',
    [['Correctly explains confidentiality, integrity and availability', 3], ['One realistic threat for each', 3]],
    'Confidentiality keeps data secret (threat: a leaked admin password exposing student records). Integrity keeps data accurate (threat: an attacker altering grades). Availability keeps the service usable (threat: a DDoS during exam registration).'),
  submission('sc-sb-01', ['sec.logs', 'sec.incident'], 3, 'Using these SIMULATED lab web-server logs, write a short incident report: what happened, the evidence (with log lines), the likely impact, and three recommended actions.\n\n10:01:12 203.0.113.5 GET /login 200\n10:01:13 203.0.113.5 POST /login 401 user=admin\n... (40 more POST /login 401 user=admin from 203.0.113.5 within 2 minutes)\n10:03:20 203.0.113.5 POST /login 302 user=admin\n10:03:25 203.0.113.5 GET /admin/export?all=1 200 bytes=48233110',
    [['Identifies brute-force followed by successful admin login', 2], ['Cites the specific log evidence (repeated 401s, then 302, then export)', 2], ['Assesses impact (possible data exfiltration of ~48 MB)', 2], ['Gives sound actions (disable/reset admin, block IP, MFA, rate-limit, review export, notify)', 2]],
    'Summary: 203.0.113.5 brute-forced the admin login (40+ failures in two minutes), succeeded at 10:03:20 and downloaded a full export (~48 MB) five seconds later. Impact: likely exfiltration of all exported records. Actions: disable and reset the admin account and invalidate sessions; block the IP and add rate limiting plus MFA for admins; determine exactly what the export contained and follow the data-breach notification process.'),
  written('sc-wr-02', 'sec.incident', 3, 'scenario', 'A teacher reports that their account sent emails they did not write. Walk through how you would respond, from first report to closing the incident.',
    [['Containment: secure the account (reset, revoke sessions, MFA)', 2], ['Investigation: sign-in logs, mailbox rules, sent items, scope', 2], ['Communication: warn recipients/staff', 1], ['Recovery and lessons learned', 1]],
    'Reset the password, revoke active sessions and enable MFA. Review sign-in logs, forwarding rules and sent mail to find how the account was accessed and what was sent. Warn recipients not to trust the messages, check whether other accounts are affected, then document the cause and improve controls, for example phishing training or MFA for all staff.'),
];
