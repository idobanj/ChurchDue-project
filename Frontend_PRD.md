Frontend PRD — Church Dues Management Platform
1. Product Overview
Product Name

Church Dues Management Platform

Product Goal

Build a web platform that allows churches/fellowships to manage student dues collection, track payments, and monitor balances through a simple admin and student dashboard.

Frontend Goal

Provide a clean, responsive, and easy-to-use interface for:

Church admins to manage dues and track payments
Students to view dues, make payments, and track balances
2. User Roles (Frontend Scope)
Admin

Can:

log in
manage dues
view students
track payments
export records
review refund requests
Student

Can:

sign up via church invite link
log in
view assigned dues
make payment
track paid / remaining balance
request refund
3. Frontend Pages
3.1 Landing Page
Purpose

Public-facing entry page for the platform.

Features
product intro
login button
church admin signup button
student join prompt
3.2 Admin Signup Page
Purpose

Allow church admin create organization account.

Fields
church name
admin full name
email
password
Outcome
organization created
unique invite link generated
3.3 Admin Login Page
Purpose

Admin authentication.

Features
email
password
forgot password
3.4 Student Join / Signup Page
Route

/join/:slug

Purpose

Student joins specific church through invite link.

Fields
full name
email
password
date of birth
profile picture (optional MVP)
Outcome
student account created
automatically linked to organization
3.5 Student Login Page
Purpose

Student authentication.

Features
email
password
forgot password
3.6 Forgot / Reset Password Page
Purpose

Shared password recovery flow for admin and student.

Features
request reset link
reset password form
4. Admin Dashboard
4.1 Dashboard Overview
Purpose

Show admin summary metrics.

Components
total dues created
total amount collected
total outstanding
total students
recent payments
4.2 Dues Management Page
Purpose

Create and manage dues.

Features
create due
edit due
delete due
set due amount
due description
due status (active/inactive)
Output

New dues automatically appear for students.

4.3 Students Page
Purpose

View all students under organization.

Features
student list
profile view
total paid
total outstanding
payment status
4.4 Due Details Page
Purpose

View payment records for a specific due.

Features
list of students under due
amount paid
amount remaining
status (pending / partial / completed)
search/filter
export CSV
4.5 Payments Page
Purpose

Track all incoming payments.

Features
payment table
student name
due name
amount
payment date
payment status
4.6 Refund Requests Page
Purpose

Review and process refund requests.

Features
list refund requests
student
due
amount
reason
approve / reject
refund status
4.7 Settings Page
Purpose

Organization settings.

Features
church info
invite link
copy invite link
Paystack connection status
5. Student Dashboard
5.1 Student Overview
Purpose

Show student payment summary.

Components
total dues assigned
total paid
total remaining
completed dues
recent payments
5.2 Dues Page
Purpose

Show all dues assigned to student.

Features
due name
total amount
amount paid
amount remaining
status
pay button
5.3 Due Details Page
Purpose

View payment breakdown for one due.

Features
due info
payment history
pay installment
request refund
5.4 Payment Modal / Checkout Trigger
Purpose

Initiate payment.

Features
input amount
validate amount
launch Paystack popup
5.5 Refund Request Modal
Purpose

Student requests refund.

Fields
amount
reason
6. UI Components
Navbar
Sidebar
Summary cards
Data tables
Charts
Payment modal
Refund modal
CSV export button
Invite link copy button
Status badges
Toast notifications
Loading states
Empty states
7. Frontend Tech Stack
React
JavaScript
Tailwind CSS
React Router
React Query
Recharts
Supabase JS Client
Paystack Inline Popup
8. Frontend Success Criteria

Frontend MVP is complete when:

admin can create organization
invite link is generated
student can join via invite link
admin can create dues
student can view dues
student can pay dues
payment records update
admin can export due records
refund request flow works