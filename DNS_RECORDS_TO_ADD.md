# DNS Records to Add for Email Delivery

## ⚠️ URGENT: Missing SPF Record

Your domain `santagram.app` is **missing the SPF record**, which is preventing emails from delivering to Microsoft 365 and other providers.

---

## Required DNS Records

### 1. SPF Record (TXT) - **ADD THIS NOW**

**Cloudflare DNS Settings:**
```
Type: TXT
Name: @ (or leave blank)
Content: v=spf1 include:resend.com ~all
TTL: Auto (or 3600)
Proxy status: DNS only (gray cloud)
```

**Steps:**
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select your domain: `santagram.app`
3. Go to **DNS** → **Records**
4. Click **"Add record"**
5. Fill in:
   - **Type**: `TXT`
   - **Name**: `@` (or leave blank)
   - **Content**: `v=spf1 include:resend.com ~all`
   - **TTL**: `Auto` (or `3600`)
   - **Proxy status**: Make sure it's **DNS only** (gray cloud, not orange)
6. Click **"Save"**

**Verification:**
- Wait 5-10 minutes for DNS propagation
- Check with [MXToolbox SPF Checker](https://mxtoolbox.com/spf.aspx)
- Should show: `v=spf1 include:resend.com ~all`

---

### 2. DKIM Records (TXT) - Get from Resend Dashboard

**Where to Get:**
1. Go to [Resend Dashboard > Domains](https://resend.com/domains)
2. Click on `santagram.app`
3. Look for **"DKIM Records"** section
4. Resend will show 2-3 DKIM records to add

**Example Format (your values will be different):**
```
Type: TXT
Name: resend._domainkey (or similar - use exact name from Resend)
Content: [long string provided by Resend]
TTL: Auto (or 3600)
Proxy status: DNS only (gray cloud)
```

**Add each DKIM record separately** - Resend typically provides 2-3 records.

---

### 3. DMARC Record (TXT) - Already Exists ✅

Your DMARC record is already published:
```
Type: TXT
Name: _dmarc
Content: v=DMARC1; p=none;
TTL: Auto (or 3600)
```

**Current Status:** ✅ Published (policy: `none` is fine for now)

**Optional Enhancement:** Add reporting email:
```
Content: v=DMARC1; p=none; rua=mailto:jake005588@gmail.com; ruf=mailto:jake005588@gmail.com
```

---

## Verification Checklist

After adding DNS records, verify with these tools:

- [ ] **SPF Checker**: [mxtoolbox.com/spf.aspx](https://mxtoolbox.com/spf.aspx)
  - Enter: `santagram.app`
  - Should show: `v=spf1 include:resend.com ~all`

- [ ] **DKIM Checker**: [mxtoolbox.com/dkim.aspx](https://mxtoolbox.com/dkim.aspx)
  - Enter: `santagram.app`
  - Should show your DKIM records

- [ ] **DMARC Checker**: [mxtoolbox.com/dmarc.aspx](https://mxtoolbox.com/dmarc.aspx)
  - Enter: `santagram.app`
  - Should show: `v=DMARC1; p=none;`

- [ ] **Resend Dashboard**: [resend.com/domains](https://resend.com/domains)
  - Check if `santagram.app` shows as **"Verified"**

---

## DNS Propagation

- DNS changes can take **5 minutes to 48 hours** to propagate globally
- Cloudflare usually propagates within **5-10 minutes**
- Use [dnschecker.org](https://dnschecker.org) to check global propagation

---

## After Adding Records

1. **Wait 10-15 minutes** for DNS propagation
2. **Verify records** with MXToolbox tools above
3. **Check Resend Dashboard** - domain should show as "Verified"
4. **Send test email** to a Microsoft 365 mailbox
5. **Check delivery status** in Resend Dashboard → Emails

---

## Troubleshooting

### SPF Record Not Showing

- **Check Cloudflare**: Make sure record is saved and not proxied (gray cloud)
- **Wait longer**: DNS can take up to 48 hours globally
- **Check for duplicates**: Only one SPF record should exist
- **Verify syntax**: Must be exactly `v=spf1 include:resend.com ~all`

### DKIM Records Not Showing

- **Get exact values from Resend**: Don't guess the record names
- **Add all records**: Resend provides 2-3 DKIM records, add all of them
- **Check record names**: Must match exactly what Resend provides

### Still Not Working After 24 Hours

1. Check Resend Dashboard for specific error messages
2. Contact Resend Support: [resend.com/support](https://resend.com/support)
3. Verify you're using the correct Resend API key
4. Check if domain is actually added in Resend Dashboard

---

**Priority Order:**
1. ✅ **SPF Record** (MOST IMPORTANT - add this first)
2. ✅ **DKIM Records** (Get from Resend Dashboard)
3. ✅ **DMARC Record** (Already exists, but can enhance with reporting)

