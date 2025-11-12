# 🚀 Quick DNS Setup Guide

## What You Need to Do

### In Your Cloudflare Account (clubemkt.digital)

Add this DNS record:

```
Type:   CNAME
Name:   cocoloko
Target: coco-loko-acaiteria.pages.dev
Proxy:  ✅ Enabled (orange cloud)
TTL:    Auto
```

### In Cloudflare Pages Dashboard

1. Go to: https://dash.cloudflare.com/
2. Select **Pages** → **coco-loko-acaiteria**
3. Click **Custom domains** tab
4. Click **Set up a custom domain**
5. Enter: `cocoloko.clubemkt.digital`
6. Click **Continue** → **Activate domain**

## That's It! 🎉

Wait 5-10 minutes for DNS propagation, then visit:

**https://cocoloko.clubemkt.digital**

---

## DNS Record Details

| Field | Value |
|-------|-------|
| **Type** | CNAME |
| **Name** | cocoloko |
| **Target** | coco-loko-acaiteria.pages.dev |
| **Proxy** | Enabled (🟠) |
| **TTL** | Auto |

## Verification

```bash
# Check DNS
dig cocoloko.clubemkt.digital CNAME +short

# Test site
curl -I https://cocoloko.clubemkt.digital
```

## Timeline

- DNS records: 2 min
- DNS propagation: 5-10 min  
- SSL certificate: 10-15 min
- **Total: ~15-20 minutes**

---

**Current Deployment**: https://70b17cd4.coco-loko-acaiteria.pages.dev
**Target Domain**: https://cocoloko.clubemkt.digital
