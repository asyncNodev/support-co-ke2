# Deploying supply.co.ke to cPanel Hosting

## ⚠️ Important: Understanding the Architecture

This application consists of TWO parts:

1. **Frontend (React SPA)** - CAN be hosted on cPanel
2. **Backend (Convex)** - CANNOT be hosted on typical cPanel (requires Node.js server or Convex cloud)

### Why Convex Backend Can't Run on cPanel

- Convex requires a persistent Node.js runtime
- Most cPanel hosting only supports PHP and static files
- Convex uses WebSocket connections that typical cPanel doesn't support
- Convex needs real-time database synchronization

## Deployment Options

### Option 1: Hybrid Approach (Recommended)
- **Frontend**: Host on cPanel (static files)
- **Backend**: Keep on Convex Cloud (free tier available)

### Option 2: Full Self-Hosting
- **Frontend**: Host on cPanel
- **Backend**: Host on VPS/Cloud server with Node.js (DigitalOcean, AWS, etc.)

### Option 3: Alternative Hosting
- Use Vercel/Netlify for frontend (free tier)
- Use Convex Cloud for backend (free tier)

---

## Option 1: Deploy Frontend to cPanel with Convex Backend

This is the easiest approach and works with standard cPanel hosting.

### Prerequisites

Before starting, you need:
- [ ] cPanel hosting account with file manager or FTP access
- [ ] Domain name pointed to your cPanel hosting
- [ ] Convex account (free at convex.dev)
- [ ] Node.js installed on your local computer

### Step 1: Download Your Code from Hercules

1. Log into Hercules App Builder
2. Go to your app settings
3. Click "Download Code"
4. Extract the ZIP file to your computer

### Step 2: Set Up Convex Backend

#### 2.1 Install Dependencies Locally

```bash
# Navigate to your project folder
cd supply-co-ke

# Install dependencies
npm install
# or if using pnpm
pnpm install
```

#### 2.2 Create Convex Account

1. Go to https://convex.dev
2. Sign up for a free account
3. Create a new project called "supply-co-ke"

#### 2.3 Link Your Code to Convex

```bash
# Install Convex CLI globally
npm install -g convex

# Login to Convex
npx convex login

# Initialize Convex (choose your project)
npx convex dev
```

This will:
- Create a Convex deployment
- Generate environment variables
- Deploy your backend functions

#### 2.4 Get Your Convex Deployment URL

After running `npx convex dev`, you'll see:
```
Convex deployment URL: https://your-project.convex.cloud
```

**Copy this URL - you'll need it in Step 3**

### Step 3: Configure Environment Variables

#### 3.1 Create Production Environment File

Create a file named `.env.production` in your project root:

```env
# Convex Backend
VITE_CONVEX_URL=https://your-project.convex.cloud

# Your Domain
VITE_APP_URL=https://supply.co.ke

# Auth (if keeping Hercules Auth - see CUSTOM_AUTH_SETUP.md to change)
VITE_HERCULES_OIDC_AUTHORITY=https://hercules.app
VITE_HERCULES_OIDC_CLIENT_ID=your_client_id_here
```

**Important:** Replace:
- `your-project` with your actual Convex project name
- `supply.co.ke` with your actual domain
- If implementing custom auth, follow `CUSTOM_AUTH_SETUP.md`

#### 3.2 Configure Convex Environment Variables

Set backend environment variables in Convex dashboard:

1. Go to https://dashboard.convex.dev
2. Select your project
3. Go to Settings → Environment Variables
4. Add these variables:

```
BROWSE_AI_API_KEY=your_browse_ai_key (if using)
```

### Step 4: Build the Frontend

Build the production-ready static files:

```bash
# Build for production
npm run build
# or
pnpm build
```

This creates a `dist` folder with:
- HTML, CSS, JavaScript files
- Images and assets
- Everything needed for the frontend

### Step 5: Upload to cPanel

#### Method A: Using File Manager (Easier)

1. **Login to cPanel**
   - Go to `https://yourdomain.com/cpanel` or `https://yourdomain.com:2083`
   - Enter your cPanel username and password

2. **Navigate to File Manager**
   - Find "Files" section
   - Click "File Manager"

3. **Go to public_html**
   - This is your website's root directory
   - If using a subdomain, go to that folder instead

4. **Delete Existing Files** (optional)
   - Select all files in public_html
   - Click "Delete" (backup first if needed!)

5. **Upload Your Built Files**
   - Click "Upload" button
   - Drag the entire `dist` folder from your computer
   - Wait for upload to complete

6. **Move Files from dist to Root**
   - After upload completes, open the `dist` folder
   - Select all files inside `dist`
   - Click "Move"
   - Move to: `/public_html/`
   - Delete the empty `dist` folder

#### Method B: Using FTP (Alternative)

1. **Get FTP Credentials**
   - In cPanel, go to "FTP Accounts"
   - Use main account or create new FTP account
   - Note: hostname, username, password

2. **Connect with FTP Client**
   - Download FileZilla (free): https://filezilla-project.org
   - Open FileZilla
   - Enter:
     - Host: ftp.yourdomain.com (or use cPanel hostname)
     - Username: your FTP username
     - Password: your FTP password
     - Port: 21

3. **Upload Files**
   - Navigate to `/public_html/` on remote (right side)
   - Select all files from your local `dist` folder (left side)
   - Right-click → Upload
   - Wait for transfer to complete

### Step 6: Configure .htaccess for React Router

React Router needs special configuration for direct URL access.

Create/edit `.htaccess` file in public_html:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # Don't rewrite files or directories
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  
  # Rewrite everything else to index.html
  RewriteRule ^ index.html [L]
</IfModule>

# Enable CORS if needed
<IfModule mod_headers.c>
  Header set Access-Control-Allow-Origin "*"
</IfModule>

# Enable Gzip compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Browser caching
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

### Step 7: Verify DNS and SSL

#### 7.1 Check DNS Settings

1. In cPanel, go to "Zone Editor"
2. Verify A record points to your server IP
3. Wait 24-48 hours for DNS propagation (if newly registered)

#### 7.2 Install SSL Certificate

1. In cPanel, go to "SSL/TLS Status"
2. Click "Run AutoSSL" (if available)
3. Or use "Let's Encrypt SSL" from Domains section
4. This enables HTTPS for your site

### Step 8: Test Your Deployment

1. **Visit Your Website**
   ```
   https://supply.co.ke
   ```

2. **Check These Functions:**
   - [ ] Homepage loads
   - [ ] Search works
   - [ ] Product browsing works
   - [ ] Sign in redirects (may need auth config)
   - [ ] Guest RFQ submission works

3. **Check Browser Console**
   - Press F12 to open developer tools
   - Look for any errors in Console tab
   - Verify Convex connection (should see WebSocket connection)

4. **Test Direct URL Access**
   ```
   https://supply.co.ke/browse
   https://supply.co.ke/product/some-id
   ```
   These should work (not show 404)

### Step 9: Deploy Backend Updates (Future Changes)

When you make backend changes:

```bash
# Deploy updated backend
npx convex deploy --prod

# No need to rebuild/upload frontend if only backend changed
```

When you make frontend changes:

```bash
# Rebuild frontend
npm run build

# Upload new dist files to cPanel (repeat Step 5)
```

---

## Option 2: Full Self-Hosting (Advanced)

If you want to host BOTH frontend and backend yourself, you'll need:

### Requirements

- VPS or Cloud Server (DigitalOcean, AWS, Vultr, etc.)
- Ubuntu/Linux server
- Root access
- Domain with DNS control

### High-Level Steps

1. **Replace Convex Backend**
   - Convert Convex functions to Express.js API
   - Set up PostgreSQL or MongoDB database
   - Implement WebSocket for real-time updates
   - Add authentication system (see CUSTOM_AUTH_SETUP.md)

2. **Deploy Backend to VPS**
   - Install Node.js on server
   - Use PM2 for process management
   - Set up Nginx reverse proxy
   - Configure SSL with Let's Encrypt

3. **Deploy Frontend**
   - Build frontend
   - Upload to cPanel or serve from VPS

**This requires significant development work** and is beyond the scope of this guide. Consider hiring a developer if you need this option.

---

## Common Issues and Solutions

### Issue 1: "404 Not Found" on Refresh

**Problem:** Direct URLs like `/browse` show 404

**Solution:** 
- Make sure `.htaccess` file is configured correctly (Step 6)
- Check if mod_rewrite is enabled on your server
- Contact hosting support to enable mod_rewrite

### Issue 2: Blank White Screen

**Problem:** Website shows blank page

**Solution:**
1. Check browser console (F12) for errors
2. Verify `VITE_CONVEX_URL` is correct in `.env.production`
3. Make sure you built with production environment
4. Check if JavaScript files loaded in Network tab

### Issue 3: "Failed to Connect to Backend"

**Problem:** Can't connect to Convex

**Solution:**
1. Verify Convex deployment is running: `npx convex deploy`
2. Check `VITE_CONVEX_URL` matches your Convex project
3. Make sure you deployed backend functions
4. Check Convex dashboard for errors

### Issue 4: Images Not Loading

**Problem:** Logo or product images don't display

**Solution:**
1. Check if images are in `public` folder before building
2. Verify image paths are correct (should be `/image.png` not `./image.png`)
3. Check File Manager to ensure images uploaded correctly

### Issue 5: Authentication Errors

**Problem:** Can't sign in

**Solution:**
1. If keeping Hercules Auth, it won't work after moving
2. You MUST implement custom auth (see CUSTOM_AUTH_SETUP.md)
3. Update all environment variables for your auth system
4. Test auth flow thoroughly

### Issue 6: Build Fails

**Problem:** `npm run build` shows errors

**Solution:**
1. Run `npm install` to ensure dependencies are installed
2. Check for TypeScript errors: `npm run lint`
3. Fix any errors shown
4. Make sure Node.js version is 18+ (`node --version`)

---

## Performance Optimization

### 1. Enable Gzip Compression

Already included in `.htaccess` above, but verify:

```bash
# Check if gzip is working
curl -H "Accept-Encoding: gzip" -I https://supply.co.ke
# Should see: Content-Encoding: gzip
```

### 2. Cloudflare (Free CDN)

1. Sign up at cloudflare.com
2. Add your domain
3. Update nameservers at your domain registrar
4. Enable:
   - Auto Minify (CSS, JavaScript, HTML)
   - Brotli compression
   - Caching

### 3. Image Optimization

Before uploading:
```bash
# Install image optimizer
npm install -g sharp-cli

# Optimize images
sharp -i public/*.png -o public/ -f webp
```

---

## Updating Your Site

### Updating Frontend Only

```bash
# Make your changes
# Then rebuild
npm run build

# Upload dist folder to cPanel
# (Use File Manager or FTP)
```

### Updating Backend Only

```bash
# Make changes to convex/ folder
# Deploy to Convex
npx convex deploy --prod

# No need to re-upload frontend
```

### Updating Both

```bash
# Deploy backend first
npx convex deploy --prod

# Then rebuild and upload frontend
npm run build
# Upload to cPanel
```

---

## Cost Breakdown

### Recommended Setup (Option 1)

- **cPanel Hosting**: $3-10/month (Namecheap, Hostinger, etc.)
- **Domain**: $10-15/year
- **Convex Backend**: FREE (up to 1M function calls/month)
- **SSL Certificate**: FREE (Let's Encrypt)

**Total: ~$5-15/month**

### VPS Setup (Option 2)

- **VPS Server**: $5-20/month (DigitalOcean, Vultr)
- **Domain**: $10-15/year
- **SSL**: FREE
- **Development Time**: 40-80 hours

**Total: $10-25/month + development time**

---

## Getting Help

### cPanel Support
- Contact your hosting provider's support
- Most offer 24/7 chat or ticket support

### Convex Support
- Convex Discord: https://convex.dev/community
- Documentation: https://docs.convex.dev

### Code Issues
- Check `CUSTOM_AUTH_SETUP.md` for authentication
- Review browser console for errors
- Test locally first with `npm run dev`

---

## Checklist: Pre-Launch

Before making your site live:

- [ ] Domain pointed to hosting
- [ ] SSL certificate installed
- [ ] Frontend built and uploaded
- [ ] Convex backend deployed
- [ ] Environment variables configured
- [ ] .htaccess file configured
- [ ] All routes tested (home, browse, product, etc.)
- [ ] Authentication working (if implemented)
- [ ] Guest RFQ submission tested
- [ ] Admin dashboard accessible
- [ ] Images loading correctly
- [ ] Mobile responsive (test on phone)
- [ ] Browser console shows no errors
- [ ] Page load time < 3 seconds
- [ ] SEO meta tags correct
- [ ] Favicon displays

---

## Conclusion

Deploying this application to cPanel is straightforward if you:
1. Keep the Convex backend on Convex Cloud (free)
2. Host only the frontend static files on cPanel
3. Configure .htaccess for React Router

This approach is:
- ✅ Low cost ($5-15/month)
- ✅ Easy to maintain
- ✅ Reliable and fast
- ✅ No server management needed

**Alternative:** If you need full control, consider hosting both frontend and backend on a VPS with Node.js, but this requires significant additional development and server management expertise.

Good luck with your deployment! 🚀
