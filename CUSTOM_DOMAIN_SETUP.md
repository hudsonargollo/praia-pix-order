# 🌐 Custom Domain Setup: cocoloko.clubemkt.digital

## Current Deployment Status ✅

**Production Deployment**: https://70b17cd4.coco-loko-acaiteria.pages.dev
**Production Alias**: https://production.coco-loko-acaiteria.pages.dev
**Target Custom Domain**: cocoloko.clubemkt.digital

## 📋 Setup Instructions

### Step 1: Add Custom Domain in Cloudflare Pages

1. Go to your Cloudflare Pages dashboard
2. Select the project: **coco-loko-acaiteria**
3. Go to **Custom domains** tab
4. Click **Set up a custom domain**
5. Enter: `cocoloko.clubemkt.digital`
6. Click **Continue**

Cloudflare will provide you with DNS records to add.

### Step 2: Add DNS Records in Your Other Cloudflare Account

In your Cloudflare account that manages `clubemkt.digital`, add these DNS records:

#### Option A: CNAME Record (Recommended)
```
Type: CNAME
Name: cocoloko
Target: coco-loko-acaiteria.pages.dev
Proxy status: Proxied (orange cloud)
TTL: Auto
```

#### Option B: If CNAME doesn't work, use A/AAAA Records
Cloudflare will provide specific IP addresses. Typically:
```
Type: A
Name: cocoloko
IPv4 address: [Provided by Cloudflare Pages]
Proxy status: Proxied (orange cloud)

Type: AAAA
Name: cocoloko
IPv6 address: [Provided by Cloudflare Pages]
Proxy status: Proxied (orange cloud)
```

### Step 3: Verify Domain

1. After adding DNS records, return to Cloudflare Pages
2. Click **Activate domain**
3. Wait for DNS propagation (usually 1-5 minutes)
4. Cloudflare will automatically provision SSL certificate

### Step 4: Set as Production Domain (Optional)

In Cloudflare Pages settings:
1. Go to **Custom domains**
2. Find `cocoloko.clubemkt.digital`
3. Click the three dots (⋯)
4. Select **Set as production domain**

This makes it the primary domain for the project.

## 🔧 Alternative: Using Wrangler CLI

You can also add the custom domain via CLI:

```bash
# Add custom domain
npx wrangler pages domain add cocoloko.clubemkt.digital --project-name=coco-loko-acaiteria

# List domains
npx wrangler pages domain list --project-name=coco-loko-acaiteria
```

## 📊 DNS Configuration Summary

### In Cloudflare Account Managing clubemkt.digital:

| Type  | Name     | Target/Value                      | Proxy | TTL  |
|-------|----------|-----------------------------------|-------|------|
| CNAME | cocoloko | coco-loko-acaiteria.pages.dev     | ✅    | Auto |

**Important**: Make sure the orange cloud (Proxy) is enabled for:
- Free SSL/TLS certificate
- DDoS protection
- CDN caching
- Better performance

## ✅ Verification Steps

### 1. Check DNS Propagation
```bash
# Check CNAME record
dig cocoloko.clubemkt.digital CNAME +short

# Check A record (if using A records)
dig cocoloko.clubemkt.digital A +short

# Check from multiple locations
https://dnschecker.org/#CNAME/cocoloko.clubemkt.digital
```

### 2. Test HTTPS
```bash
curl -I https://cocoloko.clubemkt.digital
```

Expected: `HTTP/2 200` with valid SSL certificate

### 3. Browser Test
Open: https://cocoloko.clubemkt.digital

Should show your Coco Loko Açaiteria welcome page.

## 🔐 SSL/TLS Configuration

Cloudflare automatically provisions SSL certificates for custom domains.

**Recommended Settings** (in Cloudflare SSL/TLS settings):
- **SSL/TLS encryption mode**: Full (strict)
- **Always Use HTTPS**: On
- **Automatic HTTPS Rewrites**: On
- **Minimum TLS Version**: 1.2
- **TLS 1.3**: On

## 🚀 Post-Setup Tasks

### 1. Update Environment Variables (if needed)
If you have any hardcoded URLs in your app, update them:

```typescript
// Before
const baseUrl = 'https://coco-loko-acaiteria.pages.dev';

// After
const baseUrl = 'https://cocoloko.clubemkt.digital';
```

### 2. Update QR Codes
If you've printed QR codes with the old domain, you may need to:
- Generate new QR codes with the custom domain
- Or set up redirects (Cloudflare Pages supports `_redirects` file)

### 3. Update Documentation
Update any documentation or links to use the new domain:
- README.md
- API documentation
- Marketing materials
- Social media links

### 4. Set Up Redirects (Optional)
Create a `public/_redirects` file to redirect old URLs:

```
# Redirect old domain to new domain
https://coco-loko-acaiteria.pages.dev/* https://cocoloko.clubemkt.digital/:splat 301!
https://*.coco-loko-acaiteria.pages.dev/* https://cocoloko.clubemkt.digital/:splat 301!
```

## 📱 Update URLs in System

### QR Code Generator
Update `src/lib/qrCodeGenerator.ts` if it uses hardcoded domain:

```typescript
const baseUrl = 'https://cocoloko.clubemkt.digital';
```

### WhatsApp Messages
Update message templates in `src/integrations/whatsapp/templates.ts` if they include URLs:

```typescript
const orderUrl = `https://cocoloko.clubemkt.digital/order/${orderNumber}`;
```

## 🐛 Troubleshooting

### DNS Not Resolving
- Wait 5-10 minutes for DNS propagation
- Clear your DNS cache: `sudo dscacheutil -flushcache` (macOS)
- Try from different network/device
- Check DNS with: https://dnschecker.org

### SSL Certificate Error
- Wait for Cloudflare to provision certificate (can take up to 24 hours)
- Ensure proxy (orange cloud) is enabled
- Check SSL/TLS mode is set to "Full (strict)"

### 404 or Wrong Content
- Verify domain is added in Cloudflare Pages
- Check that DNS points to correct target
- Clear browser cache
- Try incognito/private browsing

### Domain Shows "Not Found"
- Verify domain is activated in Cloudflare Pages
- Check that project name is correct
- Ensure DNS records are correct

## 📊 Monitoring

### Check Domain Status
```bash
# Via Wrangler
npx wrangler pages domain list --project-name=coco-loko-acaiteria

# Via API
curl -X GET "https://api.cloudflare.com/client/v4/accounts/{account_id}/pages/projects/coco-loko-acaiteria/domains" \
  -H "Authorization: Bearer {api_token}"
```

### Monitor SSL Certificate
```bash
# Check certificate expiry
echo | openssl s_client -servername cocoloko.clubemkt.digital -connect cocoloko.clubemkt.digital:443 2>/dev/null | openssl x509 -noout -dates
```

## 🎯 Expected Timeline

| Step | Time |
|------|------|
| Add DNS records | 2 minutes |
| DNS propagation | 1-5 minutes |
| SSL certificate provisioning | 5-15 minutes |
| Full activation | 15-30 minutes |

## ✅ Success Checklist

- [ ] DNS records added in Cloudflare
- [ ] Domain added in Cloudflare Pages
- [ ] DNS resolves correctly
- [ ] HTTPS works without errors
- [ ] SSL certificate is valid
- [ ] Site loads correctly
- [ ] All pages accessible
- [ ] QR codes updated (if needed)
- [ ] Documentation updated
- [ ] Team notified of new URL

## 📞 Support

If you encounter issues:

1. **Cloudflare Pages Docs**: https://developers.cloudflare.com/pages/platform/custom-domains/
2. **Cloudflare Community**: https://community.cloudflare.com/
3. **DNS Checker**: https://dnschecker.org/
4. **SSL Checker**: https://www.ssllabs.com/ssltest/

## 🎉 After Setup

Once the domain is active, your Coco Loko Açaiteria will be accessible at:

**🌐 Production URL**: https://cocoloko.clubemkt.digital

All features will work:
- ✅ Customer ordering
- ✅ PIX payments
- ✅ WhatsApp notifications
- ✅ Kitchen dashboard
- ✅ Cashier panel
- ✅ Real-time updates

---

**Next Steps**: Add the DNS records in your Cloudflare account and the domain will be live! 🚀
