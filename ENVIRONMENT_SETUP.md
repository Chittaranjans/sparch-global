# 🔐 Environment Setup Guide

## Overview

This project uses environment variables to securely manage sensitive configuration like API keys. The `.env` file is **git-ignored** to prevent accidentally pushing secrets to your repository.

## Setup Steps

### 1. Copy the Template

```bash
cp .env.example .env
```

### 2. Get Your Gemini API Key

1. Visit: https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your new API key

### 3. Edit `.env` File

Open `.env` in your editor and replace the placeholder:

```env
# Before
GEMINI_API_KEY=your_gemini_api_key_here

# After (example)
GEMINI_API_KEY=AIzaSyC89ovXNqkSSG921_cGVTzNfKvk8QPDbIw

PORT=3000
NODE_ENV=development
```

### 4. Verify Setup

Start the server and check for the environment variable:

```bash
bun start
```

You should see:
- ✅ Server starts without warnings about missing API key
- ✨ AI-powered features work when uploading resumes
- 🔄 If API key is missing, system falls back to pattern matching

## File Structure

```
job_task/
├── .env                 # Your actual secrets (GIT-IGNORED) ❌ Never commit!
├── .env.example         # Template file (committed) ✅ Safe to push
└── .gitignore           # Contains .env to prevent commits
```

## Git Safety

### What's Ignored?

The `.gitignore` file includes:

```
.env
.env.local
```

This ensures your API keys **never** get committed to git.

### What's Committed?

Only the template file:

```
.env.example  ✅ Safe - contains no real secrets
```

### Verify Before Pushing

Before pushing to git, always check:

```bash
# See what files will be committed
git status

# .env should NOT appear in the list
# If it does, make sure .gitignore is correct
```

## Environment Variables Explained

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `GEMINI_API_KEY` | Yes* | Google Gemini AI API key for resume analysis | `AIzaSy...` |
| `PORT` | No | Server port (default: 3000) | `3000` |
| `NODE_ENV` | No | Environment mode | `development` |

\* If missing, AI features fall back to pattern matching (still functional)

## Troubleshooting

### API Key Not Working?

1. **Check the console output**:
   ```
   ⚠️ GEMINI_API_KEY not found in environment, using fallback
   ```
   This means `.env` file is not loaded correctly.

2. **Verify `.env` file exists**:
   ```bash
   ls -la .env
   ```

3. **Check file content**:
   ```bash
   cat .env
   ```
   Should show: `GEMINI_API_KEY=AIza...`

4. **Restart the server**:
   ```bash
   pkill -f "bun.*app.js"
   bun start
   ```

### AI Features Using Fallback?

Check logs for:
```
🔄 Using fallback pattern-matching analysis
```

This indicates:
- API key is missing or invalid
- Gemini API returned an error
- System automatically switched to offline mode

**Solution**: Verify your API key in `.env`

## Team Collaboration

### For Team Members

When joining the project:

1. Clone the repository
2. Copy `.env.example` to `.env`
3. Ask your team lead for the API key
4. Update `.env` with the provided key
5. Never commit your `.env` file!

### For Team Leads

When sharing the project:

1. Share the repository (`.env` is auto-ignored)
2. Share the API key separately (Slack, email, password manager)
3. Instruct team to use `.env.example` as template
4. Consider using different API keys per environment (dev/staging/prod)

## Production Deployment

### Deployment Platforms

Most platforms support environment variables:

**Vercel / Netlify**:
```bash
# Add via dashboard or CLI
vercel env add GEMINI_API_KEY
```

**Railway / Render**:
- Add via web dashboard under "Environment Variables"

**Docker**:
```bash
docker run -e GEMINI_API_KEY=your_key_here your-image
```

**Kubernetes**:
```yaml
env:
  - name: GEMINI_API_KEY
    valueFrom:
      secretKeyRef:
        name: app-secrets
        key: gemini-api-key
```

### Security Best Practices

1. ✅ Use different API keys for dev/prod
2. ✅ Rotate keys regularly
3. ✅ Never log API keys in console
4. ✅ Use secret management tools in production
5. ❌ Never hardcode keys in source code
6. ❌ Never commit `.env` files
7. ❌ Never share keys in chat/email (use secure methods)

## Advanced Configuration

### Multiple Environments

Create separate files:

```bash
.env.development    # Local development
.env.staging        # Staging environment
.env.production     # Production environment
```

Load based on `NODE_ENV`:

```javascript
require('dotenv').config({ 
  path: `.env.${process.env.NODE_ENV}` 
});
```

### Environment Variable Validation

Check required variables on startup:

```javascript
const requiredEnvVars = ['GEMINI_API_KEY'];
const missing = requiredEnvVars.filter(key => !process.env[key]);

if (missing.length > 0) {
  console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}
```

## Quick Reference

```bash
# Setup
cp .env.example .env
# Edit .env with your API key
bun start

# Check if .env is ignored
git status  # .env should NOT appear

# Verify environment variable is loaded
bun start  # Look for warnings about missing keys
```

## Need Help?

- **API Key Issues**: Check [Gemini AI docs](https://ai.google.dev/docs)
- **Environment Setup**: See [dotenv documentation](https://github.com/motdotla/dotenv)
- **Git Issues**: Review `.gitignore` file

---

**Remember**: Your `.env` file contains secrets. Treat it like a password! 🔐
