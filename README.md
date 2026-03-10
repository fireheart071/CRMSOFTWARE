# Simple CRM Application

A modern, responsive Customer Relationship Management (CRM) web application built with Next.js, TypeScript, Tailwind CSS, and Prisma.

## Features

### Sales Pipeline
- Visual Kanban-style pipeline with 7 stages
- Drag and drop leads between stages
- Automatic commission calculation when deals reach Payment stage

### Lead Management
- Add, view, and manage leads/contacts
- Comprehensive lead profiles with activity tracking
- Search and filter functionality

### Commission System
- Automatic commission calculation (4% rate)
- Commission dashboard with pending/paid status
- Revenue and earnings tracking

### User Management
- Authentication with NextAuth.js
- Role-based access (Admin/Sales Representative)
- Secure registration and login

### Dashboard
- Key metrics and KPIs
- Pipeline distribution charts
- Revenue and commission summaries

## Tech Stack

- **Frontend**: Next.js 14, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: SQLite with Prisma ORM
- **Authentication**: NextAuth.js
- **Drag & Drop**: @dnd-kit
- **Charts**: Recharts
- **Forms**: React Hook Form with Zod validation

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up the database:
```bash
npx prisma migrate dev --name init
npx prisma generate
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3001](http://localhost:3001) in your browser

## Default Admin User

- Email: admin@crm.com
- Password: admin123

## Project Structure

```
src/
├── app/
│   ├── api/          # API routes
│   ├── dashboard/    # Dashboard page
│   ├── leads/        # Leads management
│   ├── pipeline/     # Sales pipeline
│   ├── commissions/  # Commission tracking
│   └── login/        # Authentication
├── components/       # Reusable components
├── lib/             # Utilities and configurations
└── prisma/          # Database schema and migrations
```

## Database Schema

- **User**: Authentication and roles
- **Lead**: Contact and deal information
- **Activity**: Lead interaction history
- **Commission**: Earnings tracking

## Deployment

This app can be deployed to Vercel, Netlify, or any platform supporting Next.js.

For production, update the DATABASE_URL in `.env` to use PostgreSQL or another database.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
