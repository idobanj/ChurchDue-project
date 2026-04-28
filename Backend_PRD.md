Backend PRD — Church Dues Management Platform
1. Backend Overview
Backend Goal

Provide secure backend infrastructure for authentication, organization management, dues tracking, payment recording, refund handling, and Paystack integration.

Backend Scope

Handle:

auth
data storage
business logic
Paystack integration
secure access control
2. Core Backend Responsibilities
authentication
organization creation
student onboarding
dues management
payment tracking
refund processing
Paystack verification
role-based access
3. Backend Architecture
Stack
Supabase Auth
Supabase PostgreSQL
Supabase Storage
Supabase Row Level Security
Paystack API
Serverless functions (for Paystack webhook + refund logic)
4. Data Models
4.1 organizations
id
name
slug
invite_link
paystack_public_key
paystack_secret_key (encrypted)
created_at
4.2 users
id
organization_id
role (admin, student)
full_name
email
date_of_birth
profile_picture_url
created_at
4.3 dues
id
organization_id
title
description
amount
status
created_at
4.4 payments
id
organization_id
student_id
due_id
amount_paid
paystack_reference
status
paid_at
created_at
4.5 refunds
id
payment_id
student_id
organization_id
amount
reason
status
created_at
5. Authentication Logic
Admin Auth
signup
login
forgot password
reset password
Student Auth
signup via invite link
login
forgot password
reset password

Auth handled by Supabase Auth.

6. Authorization Rules
Admin can:
manage organization
manage dues
view all students in org
view all payments in org
process refunds
Student can:
view own dues
view own payments
pay dues
request refund

Enforced with Supabase RLS.

7. Core Backend Logic
7.1 Organization Creation
create admin user
create organization
generate slug
generate invite link
7.2 Student Registration
validate invite link
fetch organization by slug
create student
attach student to organization
7.3 Dues Management
create due
update due
delete due
fetch org dues
7.4 Payment Flow
initialize Paystack payment
pass metadata:
organization_id
student_id
due_id
amount
7.5 Payment Verification
receive Paystack webhook
verify signature
verify transaction
create payment record
update due balance state
7.6 Refund Flow
student creates refund request
admin approves/rejects
backend calls Paystack refund API
webhook confirms refund
update refund + payment status
8. Security Requirements
encrypted Paystack secret keys
signed webhook verification
RLS enabled on all tables
student isolation
organization isolation
secure password reset
no direct client trust for payments
9. Storage Requirements

Use Supabase Storage for:

student profile pictures
church logos (later)
10. Backend Success Criteria

Backend MVP is complete when:

organization can be created
invite link is generated
student joins correct organization
dues CRUD works
Paystack payment verifies
payment records persist
refund flow works
admin/student data isolation works
Select 48 more wor