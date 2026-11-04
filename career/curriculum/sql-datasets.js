'use strict';
/**
 * Small, original datasets shown with SQL questions. Every SQL output
 * question's code is <dataset> + <query>, and scripts/verify-career-code.js
 * runs it in SQLite to confirm the keyed answer. Queries avoid
 * dialect-specific behaviour (NULL sort order, LIKE case rules) unless the
 * question is explicitly about it.
 */
const CUSTOMERS = `CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT, city TEXT);
INSERT INTO customers VALUES
  (1, 'Ali', 'Lahore'), (2, 'Sara', 'Karachi'),
  (3, 'Omar', NULL), (4, 'Hina', 'Lahore');`;
const ORDERS = `CREATE TABLE orders (id INTEGER PRIMARY KEY, customer_id INTEGER, total INTEGER, status TEXT);
INSERT INTO orders VALUES
  (10, 1, 2500, 'paid'), (11, 1, 1200, 'refunded'),
  (12, 2, 800, 'paid'), (13, NULL, 400, 'paid'),
  (14, 2, NULL, 'pending');`;
const ITEMS = `CREATE TABLE order_items (order_id INTEGER, product TEXT, qty INTEGER);
INSERT INTO order_items VALUES
  (10, 'Pen', 3), (10, 'Book', 1), (11, 'Pen', 2), (12, 'Bag', 1);`;
const PAYMENTS = `CREATE TABLE payments (order_id INTEGER, amount INTEGER);
INSERT INTO payments VALUES (10, 1500), (10, 1000), (12, 800);`;
const PATIENTS = `CREATE TABLE patients (id INTEGER PRIMARY KEY, name TEXT, ward TEXT, age INTEGER);
INSERT INTO patients VALUES
  (1, 'Bilal', 'A', 34), (2, 'Zara', 'B', NULL), (3, 'Usman', 'A', 61),
  (4, 'Ayesha', 'C', 45), (5, 'Fahad', 'B', 29);`;
const ENROLL = `CREATE TABLE enrollments (student_id INTEGER, course TEXT, score INTEGER);
INSERT INTO enrollments VALUES
  (1, 'SQL', 82), (1, 'Python', 91), (2, 'SQL', NULL),
  (3, 'SQL', 67), (3, 'Python', 74), (4, 'Python', 88);`;
const EMPLOYEES = `CREATE TABLE employees (id INTEGER PRIMARY KEY, name TEXT, manager_id INTEGER);
INSERT INTO employees VALUES
  (1, 'Nadia', NULL), (2, 'Kamran', 1), (3, 'Sana', 1), (4, 'Tariq', 2);`;
const sql = (...parts) => parts.join('\n\n');
module.exports = { CUSTOMERS, ORDERS, ITEMS, PAYMENTS, PATIENTS, ENROLL, EMPLOYEES, sql };
