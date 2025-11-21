# Comprehend Frontend

A modern, elegant Next.js frontend for the Comprehend API intelligence platform. Upload OpenAPI specifications and interact with your APIs using AI-powered insights.

## Features

- Clean, modern UI with dark gray background and sapphire blue accents
- Drag-and-drop file upload for OpenAPI JSON specifications
- Real-time feedback and validation
- Integration with GraphQL backend and S3 storage
- Responsive design with shadcn/ui components

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Backend GraphQL server running
- AWS S3 bucket configured

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env.local` file in the frontend directory:

```env
NEXT_PUBLIC_GRAPHQL_ENDPOINT=http://localhost:4000/graphql

# AWS credentials for S3 uploads
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your_bucket_name
```

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Building for Production

```bash
npm run build
npm start
```

## Tech Stack

- Next.js 16 with App Router
- React 19
- TypeScript
- Tailwind CSS 4
- shadcn/ui components
- Lucide React icons

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── api/upload/     # S3 upload API route
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Home page
│   ├── components/
│   │   ├── ui/             # shadcn/ui components
│   │   └── file-upload.tsx # File upload component
│   └── lib/
│       ├── utils.ts        # Utility functions
│       └── graphql-client.ts # GraphQL client
```

## Color Scheme

- Background: Dark gray (#1a1a1a)
- Text: White (#ffffff)
- Primary/Accent: Sapphire blue (#0f52ba)
- Cards: Subtle gray (#242424)
- Borders: Muted gray (#3a3a3a)
