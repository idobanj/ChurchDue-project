# Church Dues Management Platform - Frontend

A web platform for churches/fellowships to manage student dues collection, track payments, and monitor balances.

## Tech Stack

- **React** - UI library
- **Vite** - Build tool
- **React Router** - Routing
- **React Query (TanStack Query)** - Data fetching
- **Tailwind CSS** - Styling
- **Recharts** - Charts and visualization
- **Supabase** - Backend as a Service (Auth, Database, Storage)
- **Paystack** - Payment processing

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase project ([Create one](https://supabase.com))
- A Paystack account ([Sign up](https://paystack.com))

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the frontend directory:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_PAYSTACK_PUBLIC_KEY=your_paystack_public_key
```

3. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── AdminSidebar.jsx
│   ├── StudentSidebar.jsx
│   ├── PaymentModal.jsx
│   └── RefundModal.jsx
├── contexts/         # React contexts
│   └── AuthContext.jsx
├── pages/            # Page components
│   ├── admin/        # Admin dashboard pages
│   ├── student/      # Student dashboard pages
│   └── *.jsx         # Public pages
├── services/         # External service clients
│   └── supabaseClient.js
├── utils/            # Utility functions
└── App.jsx           # Main app component
```

## Features

### Admin Features
- Create and manage organization
- Generate invite links for students
- Create, edit, and delete dues
- View all students and their payment status
- Track all payments with export functionality
- Review and process refund requests
- Dashboard with summary metrics

### Student Features
- Join church via invite link
- View assigned dues
- Make payments via Paystack
- Track payment history
- Request refunds

## Database Setup

You'll need to set up the following tables in Supabase:

1. `organizations` - Church/organization data
2. `users` - User profiles (admin and students)
3. `dues` - Dues/fees configuration
4. `payments` - Payment records
5. `refunds` - Refund requests

See the Backend PRD for detailed schema.

## Build for Production

```bash
npm run build
```

The production build will be in the `dist/` folder.

## Environment Variables

| Variable | Description |
|----------|-------------|
| VITE_SUPABASE_URL | Your Supabase project URL |
| VITE_SUPABASE_ANON_KEY | Your Supabase anonymous/public key |
| VITE_PAYSTACK_PUBLIC_KEY | Your Paystack public key |

## License

MIT
