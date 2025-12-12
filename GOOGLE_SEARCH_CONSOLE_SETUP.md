# Google Search Console Setup Guide

This guide will help you set up Google Search Console for `santagram.app` to improve your search visibility and track performance.

---

## Step 1: Add Property to Google Search Console

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Click **"Add Property"** (or **"Add a property"**)
3. Select **"URL prefix"** (recommended for easier setup)
4. Enter: `https://santagram.app`
5. Click **"Continue"**

---

## Step 2: Verify Ownership

Google will ask you to verify ownership. Choose one of these methods:

### Option A: HTML Tag (Easiest)

1. Google will provide an HTML tag like:
   ```html
   <meta name="google-site-verification" content="YOUR_VERIFICATION_CODE" />
   ```
2. Add this to `app/layout.tsx` in the `<head>` section
3. The verification code should be added to the `verification.google` field in metadata

**Already configured in `app/layout.tsx`** - just add your verification code:
```typescript
verification: {
  google: 'your-verification-code-here',
},
```

### Option B: HTML File Upload

1. Download the HTML verification file from Google
2. Upload it to your `public/` folder
3. Deploy to Vercel
4. Click "Verify" in Google Search Console

### Option C: DNS Record (Most Secure)

1. Google will provide a TXT record to add to your DNS
2. Add it to Cloudflare DNS:
   - **Type**: TXT
   - **Name**: `@` (or leave blank)
   - **Content**: `google-site-verification=YOUR_CODE`
3. Wait 5-10 minutes for DNS propagation
4. Click "Verify" in Google Search Console

---

## Step 3: Submit Sitemap

Once verified:

1. In Google Search Console, go to **"Sitemaps"** in the left sidebar
2. Enter: `https://santagram.app/sitemap.xml`
3. Click **"Submit"**
4. Google will start crawling your site

**Note:** The sitemap is already configured at `/app/sitemap.ts` and will be available at `https://santagram.app/sitemap.xml` after deployment.

---

## Step 4: Request Indexing (Optional but Recommended)

After submitting the sitemap:

1. Go to **"URL Inspection"** in the left sidebar
2. Enter your homepage URL: `https://santagram.app`
3. Click **"Request Indexing"**
4. Repeat for key pages:
   - `https://santagram.app/create`
   - `https://santagram.app/contact`

---

## Step 5: Monitor Performance

After a few days, you'll start seeing data in:

- **Performance**: Search queries, clicks, impressions, CTR, average position
- **Coverage**: Indexed pages, errors, warnings
- **Enhancements**: Rich results, mobile usability
- **Core Web Vitals**: Page speed metrics

---

## SEO Features Already Implemented

✅ **Sitemap** (`/app/sitemap.ts`)
- Automatically generates `sitemap.xml`
- Includes all public pages with priorities and change frequencies

✅ **Robots.txt** (`/app/robots.ts`)
- Allows all search engines
- Blocks `/api/`, `/success`, `/cancel`, `/video/`, `/test-video`
- Points to sitemap

✅ **Structured Data (Schema.org)**
- Product schema with pricing, ratings, availability
- Organization schema
- Website schema with search action

✅ **Meta Tags**
- Title, description, keywords
- Open Graph tags for social sharing
- Twitter Card tags
- Canonical URLs
- Google verification placeholder

✅ **Page-Specific Metadata**
- Homepage: Optimized for "personalized santa video"
- Create page: Optimized for "create santa video"

---

## Key SEO Keywords Targeted

- personalized santa video
- santa message for kids
- custom santa video
- christmas video message
- santa claus video call
- personalized christmas video
- santa video for children
- santa video message
- christmas video from santa
- personalized santa claus video
- santa video gift
- christmas video present

---

## Next Steps for Better SEO

1. **Add Google Verification Code**
   - Get code from Google Search Console
   - Add to `app/layout.tsx` → `metadata.verification.google`

2. **Monitor Search Performance**
   - Check Search Console weekly
   - Look for indexing errors
   - Monitor click-through rates

3. **Improve Content**
   - Add more unique content to pages
   - Create blog posts about Christmas, Santa, etc.
   - Add customer testimonials with schema markup

4. **Build Backlinks**
   - Share on social media
   - Reach out to parenting blogs
   - Submit to Christmas gift directories

5. **Optimize Images**
   - Add alt text to all images (already done)
   - Compress images for faster loading
   - Use descriptive filenames

6. **Mobile Optimization**
   - Test mobile usability in Search Console
   - Ensure responsive design (already implemented)
   - Check Core Web Vitals

---

## Troubleshooting

### Sitemap Not Found (404)

- Wait 5-10 minutes after deployment
- Check that `app/sitemap.ts` exists
- Verify the route is accessible: `https://santagram.app/sitemap.xml`

### Pages Not Indexing

- Check robots.txt isn't blocking pages
- Verify pages return 200 status codes
- Request indexing manually via URL Inspection

### Low Click-Through Rate

- Improve meta descriptions (make them more compelling)
- Add more relevant keywords
- Improve page titles

### Verification Failed

- Double-check the verification code is correct
- Ensure DNS records have propagated (if using DNS method)
- Try a different verification method

---

## Resources

- [Google Search Console Help](https://support.google.com/webmasters)
- [Google Search Central](https://developers.google.com/search)
- [Schema.org Documentation](https://schema.org/)
- [Next.js SEO Guide](https://nextjs.org/learn/seo/introduction-to-seo)

---

**After completing setup, your site will be discoverable via Google Search!** 🎅✨

