# Milap

Milap is a premium, AI-powered event hosting and vendor management platform designed for luxury and elegance. Built with Next.js and styled with a bespoke dark maroon glassmorphism theme inspired by traditional Pichwai art, Milap connects users with top-tier verified vendors across India for weddings, corporate events, and grand celebrations.

## Features

- **Luxurious User Interface:** Immersive dark glassmorphism design with gold accents and intricate Indian floral (Pichwai) motifs.
- **Vendor Discovery:** Browse a curated list of verified photographers, decorators, caterers, and more.
- **Advanced Filtering:** Filter vendors by category, city, price range, and minimum ratings with instant visual feedback.
- **AI-Powered Assistance:** Integrated Groq AI assistant to help hosts plan their events, suggest vendors, and manage budgets seamlessly.
- **Secure Authentication:** Complete authentication flow for hosts, vendors, and administrators.
- **Dashboard & Analytics:** Dedicated dashboards for hosts to track their timelines and for admins to monitor platform analytics.
- **Responsive Design:** A fully responsive web app that delivers a premium experience on both desktop and mobile devices.

## Technology Stack

- **Frontend:** Next.js 15 (App Router), React, TypeScript
- **Styling:** Tailwind CSS (Custom Dark Glassmorphism Theme)
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Data Fetching:** SWR
- **AI Integration:** Groq API
- **Backend/Database:** Next.js API Routes, Prisma / Firebase (configured per environment)
- **Deployment ready**

## Getting Started

First, install dependencies:
```bash
npm install
# or
pnpm install
```

Then, run the development server:
```bash
npm run dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure
- `src/app`: Next.js App Router containing public, auth, and dashboard routes.
- `src/components`: Reusable UI components, including the custom `VendorCard`, `VendorFilters`, and global `TempleArch` layouts.
- `src/lib`: Utility functions, constants, animations, and database configurations.
- `public`: Static assets, fonts, and images.

## License

This project is licensed under the MIT License.
