# Project: Adds AI

## Tech Stack
- **Frontend**: Next.js (App Router)
- **Backend**: API Routes / Server Actions
- **Database**: PostgreSQL
- **Auth**: JWT-based 
- **Styling**: Tailwind CSS
- **AI**: ChatGPT API
- **DNS Management**: Cloudflare API
- **Deployment**: Vercel or Node server (with Apache support for .htaccess)

---

## Features

### 1. Authentication
- Register/Login (email + password)
- Authenticated sessions using cookies or tokens

### 2. Layout
- Header and Footer components (shared across pages)
- Protected routes after login

---

## Step-by-Step Web App Flow

### Step 0: Dashboard
- Post-login dashboard contains:
  - Button: `Create Website` → redirects to `/create`

---

### Step 1: Website Setup Form
Route: `/create/step-1`

#### Form Fields:
- `domain` (e.g. yourdomain.com)
- `siteName` (e.g. Tech Journal)
- `tagline` (e.g. Latest Trends in AI)
- `logo` (file upload)
- `favicon` (file upload)
- `themeColor` (hex code)
- `company` (string)
- `phoneNumber`
- `email`
- `address`

#### On Submit:
- Store this data in DB
- Trigger background job:
  - Get Zone ID of domain via Cloudflare API
  - Add "A" record to domain's DNS
  - Create `.htaccess` file that redirects domain traffic to our server (Apache-compatible)

---

### Step 2: Article Generation Form
Route: `/create/step-2`

#### Form Fields:
- `contentStyle` (e.g. Informative, Conversational)
- `tone` (e.g. Professional, Friendly)
- `niche/category` (e.g. Health, Tech)
- `language` (e.g. English, French)
- `numberOfArticles` (integer)

#### On "Generate" Click:
- Call OpenAI (ChatGPT) to generate that number of articles
- Each article contains:
  - Title
  - Content
  - Featured Image (via DALL·E or image API)

#### Preview:
- Show cards for each article
- On "Save and continue":
  - Save all articles in DB linked to this specific website

---

### Step 3: Static Page Content Setup
Route: `/create/step-3`

#### Pages (Accordion Items):
- Home
- About
- Privacy Policy
- Advertise with Us
- Contact Us
- Terms and Conditions

#### Each Page Input:
- Can have different inputs for different pages.

#### On Save:
- Store all static page content into DB for this domain/site

---

### Step 4: Success Page
Route: `/create/success`

- Display message: `Your site is live now and you can access it at yourdomain.com`
- Button: `View My Website`

---

## Generated Website Features

Each site behaves as a dynamic multi-tenant app, rendering data based on the domain accessed.

### Pages:
- **Static Pages**: Home, About, Privacy, etc. (fetched dynamically from DB)
- **SERP Page**: Users can search articles
- **Article Page**: Full view of a selected article

---

## Multi-Tenant Logic
- Detect domain from `req.headers.host`
- Fetch correct site data using that domain
- Render dynamic content from database accordingly

---

## APIs / Integrations
- ChatGPT API (article content)
- DALL·E or similar (featured image generation)
- Cloudflare API:
  - Get Zone ID
  - Create A record
- Optional: Mailer (e.g. send email after creation)

---

## Testing