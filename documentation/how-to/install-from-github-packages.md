---
**STRICTLY CONFIDENTIAL**

This document contains proprietary and confidential information. Unauthorized reproduction, distribution, or disclosure is strictly prohibited. This material is intended solely for authorized recipients.

---

# How to Install Lens from GitHub Packages

## Prerequisites

- Node.js 18+
- GitHub account with access to the objective-arts organization
- GitHub Personal Access Token (PAT) with `read:packages` scope

## Step 1: Create a Personal Access Token

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a name (e.g., "npm packages")
4. Select scope: `read:packages`
5. Click "Generate token"
6. Copy the token immediately (you won't see it again)

## Step 2: Configure npm Authentication

Add to your `~/.npmrc`:

```bash
//npm.pkg.github.com/:_authToken=YOUR_TOKEN_HERE
@objective-arts:registry=https://npm.pkg.github.com
```

Or run:

```bash
npm login --registry=https://npm.pkg.github.com --scope=@objective-arts
# Username: your-github-username
# Password: your-personal-access-token
# Email: your-email
```

## Step 3: Install Lens

```bash
npm install -g @objective-arts/lens
```

Verify:

```bash
lens --version
```

## Updating Lens

When a new version is released:

```bash
npm update -g @objective-arts/lens
```

Or to install a specific version:

```bash
npm install -g @objective-arts/lens@1.2.3
```

## Troubleshooting

### "401 Unauthorized"

Your token may have expired or lacks `read:packages` scope. Generate a new one.

### "404 Not Found"

The package hasn't been published yet, or you don't have access to the repository.

### "ENOACCESS"

You're not a member of the objective-arts organization. Contact your admin.

## For Admins: Publishing a New Release

1. Update version in `package.json`
2. Commit and push
3. Create a GitHub Release with tag `vX.Y.Z`
4. GitHub Actions automatically publishes to GitHub Packages

Or manually:

```bash
npm run build
npm test
npm publish
```
