'use strict';
// Fixed synthetic fixtures only. No live DB URL, migration runner or student data.
// Statements are explicit so the PostgreSQL runner never splits SQL on semicolons.
const cases=[];
function add(id,statements,expect,probes=[]){cases.push({id,statements,expect,probes});}
add('db-requirements',[
 'CREATE TABLE students(id INTEGER PRIMARY KEY, name TEXT NOT NULL)',
 'CREATE TABLE applications(id INTEGER PRIMARY KEY, student_id INTEGER NOT NULL REFERENCES students(id), intake TEXT NOT NULL)',
 "INSERT INTO students VALUES(1,'Amina'),(2,'Bilal')",
 "INSERT INTO applications VALUES(10,1,'Autumn'),(11,1,'Spring')",
 'SELECT s.id, COUNT(a.id) AS applications FROM students s LEFT JOIN applications a ON a.student_id=s.id GROUP BY s.id ORDER BY s.id'
],'1, 2; 2, 0',[
 {label:'Mandatory owner',sql:"INSERT INTO applications VALUES(12,NULL,'Summer')",sqlstate:'23502'},
 {label:'Referenced student exists',sql:"INSERT INTO applications VALUES(12,99,'Summer')",sqlstate:'23503'}
]);
add('db-relationships',[
 'CREATE TABLE tenants(id INTEGER PRIMARY KEY)',
 'CREATE TABLE students(tenant_id INTEGER NOT NULL REFERENCES tenants(id), id INTEGER NOT NULL, PRIMARY KEY(tenant_id,id))',
 'CREATE TABLE courses(tenant_id INTEGER NOT NULL REFERENCES tenants(id), id INTEGER NOT NULL, PRIMARY KEY(tenant_id,id))',
 'CREATE TABLE enrollments(tenant_id INTEGER NOT NULL, student_id INTEGER NOT NULL, course_id INTEGER NOT NULL, PRIMARY KEY(tenant_id,student_id,course_id), FOREIGN KEY(tenant_id,student_id) REFERENCES students(tenant_id,id), FOREIGN KEY(tenant_id,course_id) REFERENCES courses(tenant_id,id))',
 'INSERT INTO tenants VALUES(1),(2)',
 'INSERT INTO students VALUES(1,7),(2,8)',
 'INSERT INTO courses VALUES(1,10),(1,11),(2,12)',
 'INSERT INTO enrollments VALUES(1,7,10),(1,7,11)',
 'SELECT tenant_id, student_id, COUNT(*) AS courses FROM enrollments GROUP BY tenant_id,student_id ORDER BY tenant_id,student_id'
],'1, 7, 2',[
 {label:'Reject cross-tenant course reference',sql:'INSERT INTO enrollments VALUES(1,7,12)',sqlstate:'23503'},
 {label:'Reject duplicate enrollment pair',sql:'INSERT INTO enrollments VALUES(1,7,10)',sqlstate:'23505'}
]);
add('db-keys',[
 'CREATE TABLE customers(id INTEGER PRIMARY KEY, account_code TEXT NOT NULL UNIQUE, email TEXT NOT NULL)',
 "INSERT INTO customers VALUES(1,'CUS-7','old@example.test')",
 "UPDATE customers SET email='new@example.test' WHERE id=1",
 'SELECT id,account_code,email FROM customers ORDER BY id'
],'1, CUS-7, new@example.test',[
 {label:'Candidate business key remains unique',sql:"INSERT INTO customers VALUES(2,'CUS-7','other@example.test')",sqlstate:'23505'},
 {label:'Primary identity remains unique',sql:"INSERT INTO customers VALUES(1,'CUS-8','other@example.test')",sqlstate:'23505'}
]);
add('db-commerce',[
 'CREATE TABLE customers(id INTEGER PRIMARY KEY)',
 'CREATE TABLE categories(id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE)',
 'CREATE TABLE products(id INTEGER PRIMARY KEY, category_id INTEGER NOT NULL REFERENCES categories(id), current_cents INTEGER NOT NULL CHECK(current_cents>=0))',
 'CREATE TABLE inventory(product_id INTEGER PRIMARY KEY REFERENCES products(id), available INTEGER NOT NULL CHECK(available>=0))',
 "CREATE TABLE orders(id INTEGER PRIMARY KEY, customer_id INTEGER NOT NULL REFERENCES customers(id), status TEXT NOT NULL CHECK(status IN ('placed','cancelled','shipped')))",
 'CREATE TABLE order_items(order_id INTEGER NOT NULL REFERENCES orders(id), line_no INTEGER NOT NULL, product_id INTEGER NOT NULL REFERENCES products(id), quantity INTEGER NOT NULL CHECK(quantity>0), price_at_purchase INTEGER NOT NULL CHECK(price_at_purchase>=0), PRIMARY KEY(order_id,line_no))',
 'CREATE TABLE payments(id INTEGER PRIMARY KEY, order_id INTEGER NOT NULL REFERENCES orders(id), cents INTEGER NOT NULL CHECK(cents>=0), provider_ref TEXT NOT NULL UNIQUE)',
 'INSERT INTO customers VALUES(1)',
 "INSERT INTO categories VALUES(1,'Books')",
 'INSERT INTO products VALUES(7,1,1200)',
 'INSERT INTO inventory VALUES(7,10)',
 "INSERT INTO orders VALUES(10,1,'placed')",
 'INSERT INTO order_items VALUES(10,1,7,2,1200)',
 "INSERT INTO payments VALUES(20,10,2400,'pay-demo-20')",
 'UPDATE products SET current_cents=1500 WHERE id=7',
 'SELECT oi.order_id, SUM(oi.quantity*oi.price_at_purchase) AS historical_total FROM order_items oi GROUP BY oi.order_id'
],'10, 2400',[
 {label:'Positive line quantity',sql:'INSERT INTO order_items VALUES(10,2,7,0,1200)',sqlstate:'23514'},
 {label:'Unique external payment reference',sql:"INSERT INTO payments VALUES(21,10,2400,'pay-demo-20')",sqlstate:'23505'},
 {label:'Index is not automatically added to every foreign-key child',sql:"SELECT COUNT(*)::integer AS count FROM pg_indexes WHERE schemaname=current_schema() AND tablename='payments'",rows:[{count:2}]}
]);
add('db-types',[
 "CREATE TABLE invoices(id INTEGER PRIMARY KEY, currency TEXT NOT NULL CHECK(currency IN ('USD','PKR')), amount NUMERIC(10,2) NOT NULL CHECK(amount>=0 AND amount<>\'NaN\'))",
 "INSERT INTO invoices VALUES(1,'USD',12.30)",
 'SELECT id,CAST(amount*100 AS INTEGER) AS minor_units FROM invoices ORDER BY id'
],'1, 1230',[
 {label:'PostgreSQL numeric scale rounds input',sql:"SELECT (12.345::numeric(10,2))::text AS amount",rows:[{amount:'12.35'}]},
 {label:'Nonfinite NaN money rejected',sql:"INSERT INTO invoices VALUES(2,'USD','NaN')",sqlstate:'23514'},
 {label:'Numeric precision overflow',sql:"INSERT INTO invoices VALUES(2,'USD',123456789.00)",sqlstate:'22003'},
 {label:'timestamptz denotes an instant, not original zone label',sql:"SELECT ('2026-12-01 09:00+05'::timestamptz = '2026-12-01 04:00+00'::timestamptz) AS same_instant",rows:[{same_instant:true}]},
 {label:'JSONB extraction uses PostgreSQL semantics',sql:`SELECT ('{"channel":"email"}'::jsonb ->> 'channel') AS channel`,rows:[{channel:'email'}]},
 {label:'PostgreSQL text column type is explicit',sql:"SELECT pg_typeof('invoice-note'::text)::text AS type",rows:[{type:'text'}]}
]);
add('db-constraints',[
 'CREATE TABLE loans(id INTEGER PRIMARY KEY, copy_id INTEGER NOT NULL, return_day TEXT, UNIQUE(copy_id,return_day), CHECK(return_day IS NULL OR return_day>=\'2026-01-01\'))',
 'INSERT INTO loans VALUES(1,7,NULL),(2,7,NULL)',
 'SELECT copy_id,COUNT(*) AS rows_count FROM loans GROUP BY copy_id'
],'7, 2',[
 {label:'CHECK accepts unknown unless NOT NULL separately required',sql:'CREATE TABLE nullable_check(score INTEGER CHECK(score>=0)); INSERT INTO nullable_check VALUES(NULL)',success:true},
 {label:'Reject a false CHECK predicate',sql:"INSERT INTO loans VALUES(3,8,'2025-01-01')",sqlstate:'23514'},
 {label:'Partial unique index implements one active loan per copy',sql:'CREATE TABLE active_loans(id INTEGER PRIMARY KEY,copy_id INTEGER NOT NULL,returned_at TIMESTAMPTZ); CREATE UNIQUE INDEX one_active_loan ON active_loans(copy_id) WHERE returned_at IS NULL; INSERT INTO active_loans VALUES(1,7,NULL); INSERT INTO active_loans VALUES(2,7,NULL)',sqlstate:'23505'}
]);
add('db-referential',[
 'CREATE TABLE orders(id INTEGER PRIMARY KEY)',
 'CREATE TABLE payments(id INTEGER PRIMARY KEY, order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE RESTRICT)',
 'CREATE TABLE draft_orders(id INTEGER PRIMARY KEY)',
 'CREATE TABLE draft_lines(id INTEGER PRIMARY KEY,draft_id INTEGER NOT NULL REFERENCES draft_orders(id) ON DELETE CASCADE)',
 'INSERT INTO orders VALUES(10)',
 'INSERT INTO payments VALUES(20,10)',
 'INSERT INTO draft_orders VALUES(1)',
 'INSERT INTO draft_lines VALUES(2,1),(3,1)',
 'DELETE FROM draft_orders WHERE id=1',
 'SELECT (SELECT COUNT(*) FROM payments) AS retained_payments,(SELECT COUNT(*) FROM draft_lines) AS draft_lines'
],'1, 0',[
 {label:'Restrict preserves a referenced order',sql:'DELETE FROM orders WHERE id=10',sqlstate:'23503'},
 {label:'Foreign key rejects a missing order',sql:'INSERT INTO payments VALUES(21,99)',sqlstate:'23503'}
]);
add('db-transactions',[
 'CREATE TABLE stock(product_id INTEGER PRIMARY KEY,available INTEGER NOT NULL CHECK(available>=0))',
 'INSERT INTO stock VALUES(7,1)',
 'BEGIN',
 'UPDATE stock SET available=available-1 WHERE product_id=7 AND available>=1',
 'ROLLBACK',
 'SELECT product_id,available FROM stock ORDER BY product_id'
],'7, 1',[
 {label:'Conditional atomic decrement permits only available units',sql:'UPDATE stock SET available=available-1 WHERE product_id=7 AND available>=1 RETURNING available',rows:[{available:0}]},
 {label:'Two sequential purchase attempts cannot consume two from one',sql:'UPDATE stock SET available=available-1 WHERE product_id=7 AND available>=1; UPDATE stock SET available=available-1 WHERE product_id=7 AND available>=1 RETURNING available',rows:[]},
 {label:'Negative stock rejected independently of application',sql:'UPDATE stock SET available=-1 WHERE product_id=7',sqlstate:'23514'}
]);
add('db-dependencies',[
 'CREATE TABLE courses(id INTEGER PRIMARY KEY,title TEXT NOT NULL)',
 'CREATE TABLE students(id INTEGER PRIMARY KEY,name TEXT NOT NULL)',
 'CREATE TABLE enrollments(student_id INTEGER NOT NULL REFERENCES students(id),course_id INTEGER NOT NULL REFERENCES courses(id),grade TEXT,PRIMARY KEY(student_id,course_id))',
 "INSERT INTO courses VALUES(10,'Database Design')",
 "INSERT INTO students VALUES(1,'Amina'),(2,'Bilal')",
 "INSERT INTO enrollments VALUES(1,10,'A'),(2,10,'B')",
 "UPDATE courses SET title='Relational Database Design' WHERE id=10",
 'SELECT e.student_id,c.title FROM enrollments e JOIN courses c ON c.id=e.course_id ORDER BY e.student_id'
],'1, Relational Database Design; 2, Relational Database Design',[
 {label:'One enrollment per student/course candidate key',sql:"INSERT INTO enrollments VALUES(1,10,'C')",sqlstate:'23505'}
]);
add('db-normalize',[
 'CREATE TABLE books(id INTEGER PRIMARY KEY,title TEXT NOT NULL)',
 'CREATE TABLE authors(id INTEGER PRIMARY KEY,name TEXT NOT NULL)',
 'CREATE TABLE book_authors(book_id INTEGER NOT NULL REFERENCES books(id),author_id INTEGER NOT NULL REFERENCES authors(id),PRIMARY KEY(book_id,author_id))',
 "INSERT INTO books VALUES(1,'Reliable Data')",
 "INSERT INTO authors VALUES(10,'Amina'),(11,'Bilal')",
 'INSERT INTO book_authors VALUES(1,10),(1,11)',
 'SELECT b.title,a.name FROM book_authors ba JOIN books b ON b.id=ba.book_id JOIN authors a ON a.id=ba.author_id ORDER BY a.id'
],'Reliable Data, Amina; Reliable Data, Bilal',[
 {label:'Separate authors can exist without a current book',sql:"INSERT INTO authors VALUES(12,'Chen'); SELECT COUNT(*)::integer AS count FROM authors",rows:[{count:3}]}
]);
add('db-denormalize-indexes',[
 'CREATE TABLE tickets(id INTEGER PRIMARY KEY,tenant_id INTEGER NOT NULL,status TEXT NOT NULL,created_no INTEGER NOT NULL)',
 'CREATE INDEX tenant_status_created ON tickets(tenant_id,status,created_no,id)',
 "INSERT INTO tickets VALUES(1,7,'open',10),(2,7,'closed',11),(3,8,'open',12),(4,7,'open',13)",
 "SELECT id FROM tickets WHERE tenant_id=7 AND status='open' ORDER BY created_no,id"
],'1; 4',[
 {label:'PostgreSQL catalog records the intended composite index',sql:"SELECT COUNT(*)::integer AS count FROM pg_indexes WHERE schemaname=current_schema() AND tablename='tickets' AND indexname='tenant_status_created'",rows:[{count:1}]},
 {label:'A normal secondary index does not imply uniqueness',sql:"INSERT INTO tickets VALUES(5,7,'open',13); SELECT COUNT(*)::integer AS count FROM tickets WHERE tenant_id=7 AND status='open'",rows:[{count:3}]}
]);
add('db-evolution-review',[
 'CREATE TABLE profiles(id INTEGER PRIMARY KEY,name TEXT NOT NULL)',
 "INSERT INTO profiles VALUES(1,'Amina')",
 'ALTER TABLE profiles ADD COLUMN display_name TEXT',
 'UPDATE profiles SET display_name=name WHERE display_name IS NULL',
 'SELECT id,name,display_name FROM profiles ORDER BY id'
],'1, Amina, Amina',[
 {label:'Old writer can omit the newly optional field during overlap',sql:"INSERT INTO profiles(id,name) VALUES(2,'Bilal'); SELECT display_name FROM profiles WHERE id=2",rows:[{display_name:null}]},
 {label:'New writer can supply both fields during overlap',sql:"INSERT INTO profiles VALUES(3,'Chen','Chen C.'); SELECT name,display_name FROM profiles WHERE id=3",rows:[{name:'Chen',display_name:'Chen C.'}]}
]);
module.exports=cases;
