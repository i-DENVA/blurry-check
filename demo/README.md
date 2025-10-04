# Blurry Check Demo

A Next.js demo application showcasing the Blurry Check package for image and PDF quality analysis.

## Features

- Upload and analyze images (JPG, PNG, GIF, BMP, WebP)
- Upload and analyze PDFs
- Real-time blur detection using multiple algorithms
- Global visit counter
- Responsive design

## Development

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment

### Vercel Deployment with FREE Persistent Storage

1. **Create a GitHub Gist for storage**:
   - Go to https://gist.github.com
   - Create a new **public** gist
   - Name the file `visits.json`
   - Content: `{"count": 0, "lastUpdated": "2025-01-01T00:00:00.000Z"}`
   - Save the gist and note the Gist ID from the URL

2. **Create a GitHub Personal Access Token**:
   - Go to GitHub Settings > Developer settings > Personal access tokens
   - Generate a new token with `gist` scope
   - Copy the token

3. **Deploy to Vercel**:
   - Deploy your project to Vercel
   - In project settings, add environment variables:
     - `GITHUB_TOKEN`: Your personal access token
     - `GITHUB_GIST_ID`: Your gist ID
   - Redeploy

### Visit Counter Storage

- **Local development**: Uses file-based storage in `data/visits.json`
- **Production**: Uses GitHub Gist for FREE persistent storage across deployments
- **Fallback**: If Gist fails, falls back to file storage

## Environment Variables

For persistent visit counting in production:
- `GITHUB_TOKEN` - GitHub personal access token with `gist` scope
- `GITHUB_GIST_ID` - ID of the gist containing the visit data

Optional for local development (will use file storage if not provided).

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint