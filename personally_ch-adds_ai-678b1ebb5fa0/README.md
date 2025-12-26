# Adds AI

An AI-powered website creation platform built with Next.js, Prisma, and Tailwind CSS.

## Features

- **Authentication**: Email/password registration and login
- **Multi-step Website Creation**: Domain setup, article generation, static page content
- **Multi-tenant Logic**: Dynamic content based on domain
- **APIs/Integrations**: OpenAI, Cloudflare, and more

## Tech Stack

- **Frontend**: Next.js (App Router)
- **Backend**: API Routes / Server Actions
- **Database**: PostgreSQL
- **Auth**: JWT-based
- **Styling**: Tailwind CSS
- **AI**: ChatGPT API
- **DNS Management**: Cloudflare API
- **Deployment**: Vercel or Node server (with Apache support for .htaccess)

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- PostgreSQL
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/adds-ai.git
   cd adds-ai
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   - Create a `.env` file in the root directory
   - Add your PostgreSQL connection string:
     ```
     DATABASE_URL="postgresql://username:password@localhost:5432/adds_ai_db"
     ```

4. Run Prisma migrations:
   ```bash
   npx prisma migrate dev
   ```

5. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

- `/app`: Next.js App Router pages and layouts
- `/components`: Reusable React components
- `/prisma`: Database schema and migrations
- `/public`: Static assets

## License

This project is licensed under the MIT License. 