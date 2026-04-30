# Sync — Real-Time Group Decision Web App

A lightning-fast web app for group decision-making with real-time voting, swipe physics, and instant results reveal.

## Features

- **Real-time Voting**: See votes update instantly as participants vote
- **Swipe Voting**: Drag options left/right with satisfying Framer Motion physics (100px threshold)
- **Coin Flip Ties**: When options tie, a smooth coin-flip animation reveals the winner
- **Session Expiry**: Sessions automatically expire after 24 hours
- **Anonymous Auth**: No login required — unique sessions via localStorage
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Invite Sharing**: Copy invite links or use native share (mobile)

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Database**: Supabase (PostgreSQL + Realtime)
- **Authentication**: Supabase Anonymous Auth
- **Styling**: Tailwind CSS v4
- **Animations**: Framer Motion + Canvas Confetti
- **UI**: Sonner (toasts)
- **Routing**: React Router v6

## Setup

### Prerequisites

- Node.js 18+
- Supabase project (free tier works great)

### Installation

```bash
# Clone and install
git clone <repo-url>
cd sync
npm install

# Create .env from example
cp .env.example .env

# Fill in your Supabase credentials in .env
# VITE_SUPABASE_URL=your-project-url
# VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a free project
2. In your project, go to **SQL Editor** and paste the contents of `supabase-schema.sql`
3. Run the SQL to create tables and RLS policies
4. Copy your project URL and anon key to `.env`

## Running Locally

```bash
npm run dev
```

Visit `http://localhost:5173` and start creating sessions!

## Testing Checklist

### Session Creation
- [ ] Create a session with topic and 2-6 options
- [ ] Verify error toast if topic is empty or exceeds 60 chars
- [ ] Verify error toast if fewer than 2 or more than 6 options

### Join Session
- [ ] Join a session via copied invite link with a display name
- [ ] Verify error if session doesn't exist
- [ ] Verify error if display name is empty
- [ ] Join the same session from different browsers to test multi-device

### Waiting Room
- [ ] See creator avatar and other participants in real-time
- [ ] Click "Start Voting" as creator (only creator can)
- [ ] Verify error toast if start fails
- [ ] Share button copies invite link to clipboard
- [ ] Native share works on mobile

### Vote Submission
- [ ] Drag left/right to vote (100px threshold)
- [ ] See immediate button feedback while voting
- [ ] Cannot vote twice (buttons disabled)
- [ ] See vote count update in real-time as others vote
- [ ] Swipe animations feel smooth and responsive

### Vote Reveal
- [ ] See 3-2-1 countdown
- [ ] See winner with vote breakdown bars
- [ ] Confetti animation on winner reveal
- [ ] If tie: coin flip animation determines winner
- [ ] "Play Again" button resets for new round (creator only)

### Real-Time Behavior
- [ ] Open session in 2+ tabs — see updates instantly
- [ ] Open session in 2+ browsers — real-time sync works
- [ ] Leave waiting room, return to session — correct state restored

### Edge Cases
- [ ] Session expires after 24 hours (manually update DB for testing)
- [ ] Browser tab closed mid-vote — rejoin and vote again
- [ ] Network interruption — app recovers gracefully
- [ ] Multiple rapid clicks on buttons — no duplicate operations

## Deploying for Free

### Option 1: Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Configure to use main branch in Vercel dashboard
```

**Benefits**: Automatic deployments on push, preview URLs, edge functions (if needed)

### Option 2: Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

**Benefits**: Simple setup, drag-drop deployment, free SSL

### Option 3: GitHub Pages

1. Set repo to public
2. Go to Settings → Pages → Build and deployment
3. Select "GitHub Actions"
4. Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

**Benefits**: No monthly costs, tight GitHub integration

## Environment Variables

**For Local Development** (create `.env`):
```
VITE_SUPABASE_URL=your-url
VITE_SUPABASE_ANON_KEY=your-key
```

**For Production** (set in Vercel/Netlify dashboard):
- Same as above (these are safe — they're anonymous keys, not secret keys)
- ✅ Safe to include in repository (marked public in Supabase)
- ❌ Never include Supabase secret/service role keys in frontend code

## Building for Production

```bash
npm run build
npm run preview  # Test production build locally
```

## Troubleshooting

**Blank page after deploy?**
- Check build logs for TypeScript errors
- Verify `.env` variables are set in your hosting platform's dashboard
- Check browser console for errors

**Real-time updates not working?**
- Verify Supabase connection in console
- Check Supabase project is running (not paused)
- Confirm RLS policies in `supabase-schema.sql` are applied

**Invite links don't work?**
- Session may have expired (24-hour limit)
- Verify session ID in URL is correct
- Check Supabase database for session record

## Database Schema

Tables:
- `sessions` — voting sessions (topic, status, options)
- `options` — voting options per session
- `participants` — people in sessions (name, avatar, has_voted)
- `votes` — individual votes (participant + option)

All tables use RLS policies to ensure only authenticated users and session creators can access/modify data.

## License

MIT

## Contributing

Submit issues and PRs on GitHub!

## Author

Built with ❤️ for group decisions made simple.
