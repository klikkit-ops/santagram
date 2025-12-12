# Resend Email Delivery Troubleshooting Guide

## Issue: Emails Not Delivering to Microsoft 365 (and Other Providers)

Microsoft 365 and other enterprise email providers have strict spam filters and authentication requirements. This guide will help you diagnose and fix delivery issues.

---

## Step 1: Verify Domain Authentication in Resend

### ⚠️ CRITICAL ISSUE FOUND: Missing SPF Record

Your domain `santagram.app` is **missing the SPF record**, which is why emails aren't delivering to Microsoft 365. This is the #1 priority to fix.

### Check Domain Status

1. Go to [Resend Dashboard > Domains](https://resend.com/domains)
2. Find `santagram.app` in your domain list
3. Check the status:
   - ✅ **Verified** = Good, DNS records are correct
   - ⚠️ **Pending** = DNS records not yet configured or not propagated
   - ❌ **Failed** = DNS records are incorrect

### Required DNS Records

For `santagram.app` to send emails via Resend, you need these DNS records:

#### 1. SPF Record (TXT) - **MISSING - ADD THIS NOW**
```
Type: TXT
Name: @ (or santagram.app)
Value: v=spf1 include:resend.com ~all
TTL: 3600 (or default)
```

**How to Add in Cloudflare:**
1. Go to Cloudflare Dashboard → Your Domain → DNS
2. Click **"Add record"**
3. Select:
   - **Type**: TXT
   - **Name**: @ (or leave blank, or `santagram.app`)
   - **Content**: `v=spf1 include:resend.com ~all`
   - **TTL**: Auto (or 3600)
4. Click **"Save"**
5. Wait 5-10 minutes, then verify with [MXToolbox SPF Checker](https://mxtoolbox.com/spf.aspx)

#### 2. DKIM Records (TXT)
Resend will provide 2-3 DKIM records. They look like:
```
Type: TXT
Name: resend._domainkey (or similar)
Value: [provided by Resend]
TTL: 3600
```

#### 3. DMARC Record (TXT)
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:your-email@example.com
TTL: 3600
```

**Note:** Replace `your-email@example.com` with your monitoring email (e.g., `jake005588@gmail.com`)

---

## Step 2: Verify DNS Records Are Correct

### Use DNS Checker Tools

1. **MXToolbox SPF Checker**:
   - Go to [mxtoolbox.com/spf.aspx](https://mxtoolbox.com/spf.aspx)
   - Enter `santagram.app`
   - Verify SPF record includes `include:resend.com`

2. **MXToolbox DKIM Checker**:
   - Go to [mxtoolbox.com/dkim.aspx](https://mxtoolbox.com/dkim.aspx)
   - Enter `santagram.app`
   - Verify DKIM records are present

3. **MXToolbox DMARC Checker**:
   - Go to [mxtoolbox.com/dmarc.aspx](https://mxtoolbox.com/dmarc.aspx)
   - Enter `santagram.app`
   - Verify DMARC record exists

### Check DNS Propagation

DNS changes can take up to 48 hours to propagate. Use:
- [dnschecker.org](https://dnschecker.org) - Check DNS propagation globally
- Enter your domain and record type to see if changes have propagated

---

## Step 3: Check Resend Dashboard for Issues

1. Go to [Resend Dashboard > Emails](https://resend.com/emails)
2. Check recent email sends:
   - **Delivered** ✅ = Email reached recipient server
   - **Bounced** ❌ = Email was rejected
   - **Complained** ⚠️ = Recipient marked as spam
   - **Opened** 📧 = Email was opened

3. Click on failed emails to see error messages:
   - **550 5.7.1** = Authentication failure (SPF/DKIM/DMARC)
   - **550 5.1.1** = Invalid recipient
   - **550 5.7.606** = Access denied (blacklisted)

---

## Step 4: Microsoft 365 Specific Issues

### Common Microsoft 365 Blocking Reasons

1. **Missing or Incorrect SPF Record**
   - Microsoft requires SPF to pass
   - Ensure `include:resend.com` is in your SPF record

2. **DKIM Not Signing**
   - Resend automatically signs emails with DKIM
   - Verify DKIM records are in DNS

3. **DMARC Policy Too Strict**
   - Start with `p=none` (monitoring only)
   - Gradually move to `p=quarantine` then `p=reject`

4. **Sender Reputation**
   - New domains have low reputation
   - Send to engaged users first
   - Avoid spam triggers

### Check Microsoft 365 Message Trace

If you have access to the recipient's Microsoft 365 admin center:
1. Go to [Microsoft 365 Admin Center](https://admin.microsoft.com)
2. Navigate to **Exchange** → **Message trace**
3. Search for emails from `santa@santagram.app`
4. Check delivery status and error codes

---

## Step 5: Improve Email Content

### Avoid Spam Triggers

Your current email template is good, but ensure:

- ✅ **Subject line**: Clear and descriptive (avoid excessive emojis)
- ✅ **HTML structure**: Valid HTML with proper DOCTYPE
- ✅ **Text version**: Consider adding a plain text version
- ✅ **Links**: Use absolute URLs (you're already doing this)
- ✅ **Images**: Host images externally (you're not using images, which is good)
- ✅ **Unsubscribe**: Not required for transactional emails, but consider adding

### Add Plain Text Version

Microsoft 365 sometimes prefers plain text emails. Consider adding a `text` version to your emails.

---

## Step 6: Warm Up Your Domain

If `santagram.app` is a new domain for email:

1. **Start Small**: Send to a few trusted recipients first
2. **Gradual Increase**: Slowly increase volume over 2-4 weeks
3. **Monitor Metrics**: Watch bounce rates, complaints, opens
4. **Engage Recipients**: Encourage recipients to:
   - Mark emails as "Not Spam" if they go to junk
   - Add `santa@santagram.app` to contacts
   - Reply to emails (even a simple "thanks")

---

## Step 7: Check Blacklist Status

1. Go to [MXToolbox Blacklist Check](https://mxtoolbox.com/blacklists.aspx)
2. Enter `santagram.app`
3. Check if your domain is listed on any blacklists
4. If listed, follow the blacklist's removal process

---

## Step 8: Test Email Delivery

### Test with Different Providers

Send test emails to:
- ✅ Gmail (usually most permissive)
- ⚠️ Microsoft 365/Outlook (strictest)
- ⚠️ Yahoo Mail
- ⚠️ Corporate email servers

### Use Email Testing Tools

1. **Mail-Tester.com**:
   - Go to [mail-tester.com](https://www.mail-tester.com)
   - Get a test email address
   - Send an email to that address
   - Get a spam score and recommendations

2. **GlockApps**:
   - Professional email deliverability testing
   - Tests across multiple providers including Microsoft 365

---

## Step 9: Monitor and Improve

### Set Up DMARC Reporting

1. Update your DMARC record to include reporting:
   ```
   v=DMARC1; p=none; rua=mailto:jake005588@gmail.com; ruf=mailto:jake005588@gmail.com
   ```

2. You'll receive daily reports showing:
   - Which emails passed/failed authentication
   - Which IPs are sending on your behalf
   - Spam and phishing attempts

### Monitor Resend Metrics

1. Go to [Resend Dashboard > Analytics](https://resend.com/analytics)
2. Track:
   - Delivery rate (should be >95%)
   - Bounce rate (should be <5%)
   - Complaint rate (should be <0.1%)
   - Open rate (indicates engagement)

---

## Quick Fixes Checklist

- [ ] Verify domain is added in Resend Dashboard
- [ ] Add SPF record: `v=spf1 include:resend.com ~all`
- [ ] Add DKIM records (provided by Resend)
- [ ] Add DMARC record: `v=DMARC1; p=none; rua=mailto:jake005588@gmail.com`
- [ ] Wait 24-48 hours for DNS propagation
- [ ] Verify records with MXToolbox
- [ ] Check Resend Dashboard for domain verification status
- [ ] Send test email and check delivery status
- [ ] Check spam/junk folders
- [ ] Test with Mail-Tester.com
- [ ] Monitor bounce rates and complaints

---

## Common Error Codes

| Error Code | Meaning | Solution |
|------------|---------|----------|
| 550 5.7.1 | SPF/DKIM/DMARC failure | Fix DNS records |
| 550 5.1.1 | Invalid recipient | Check email address |
| 550 5.7.606 | Access denied | Domain/IP blacklisted |
| 550 5.7.1 Message rejected | Content flagged | Review email content |
| 421 4.7.0 | Rate limiting | Reduce sending volume |

---

## Contact Support

If issues persist:

1. **Resend Support**: [resend.com/support](https://resend.com/support)
   - They can check your domain configuration
   - Review sending reputation
   - Help with DNS setup

2. **Microsoft Support**: If recipient has Microsoft 365 admin access
   - They can check message trace
   - Review spam filter settings
   - Whitelist your domain if needed

---

## Additional Resources

- [Resend Documentation](https://resend.com/docs)
- [Resend Domain Setup](https://resend.com/docs/dashboard/domains/introduction)
- [Microsoft 365 Email Delivery Best Practices](https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/anti-spam-protection)
- [SPF Record Syntax](https://www.openspf.org/SPF_Record_Syntax)
- [DMARC Guide](https://dmarc.org/wiki/FAQ)

---

**Last Updated**: After completing all steps, verify emails are delivering successfully.

