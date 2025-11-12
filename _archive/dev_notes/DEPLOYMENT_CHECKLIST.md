# 🚀 Deployment Checklist

Use this checklist to ensure everything is properly configured after deployment.

---

## Pre-Deployment

### Code Changes
- [x] Mobile header improvements committed
- [ ] All changes pushed to Git repository
- [ ] No uncommitted changes remaining

### Documentation Review
- [x] Read `QUICK_START_FIXES.md`
- [ ] Read `ENVIRONMENT_SETUP.md`
- [ ] SQL scripts ready to run

---

## Cloudflare Pages Setup

### Environment Variables
- [ ] `SUPABASE_URL` added
- [ ] `SUPABASE_SERVICE_KEY` added (service_role key!)
- [ ] `WHATSAPP_ENCRYPTION_KEY` generated and added
- [ ] Variables set for both Production and Preview
- [ ] Saved and confirmed

### Deployment
- [ ] Latest code deployed
- [ ] Deployment successful (green checkmark)
- [ ] No build errors in logs
- [ ] Site accessible at production URL

---

## Supabase Setup

### Database Tables
- [ ] `whatsapp_sessions` table created
- [ ] Table has correct columns (session_id, session_data, phone_number, is_active)
- [ ] RLS policies enabled
- [ ] Indexes created

### Products & Categories
- [ ] Run `DIAGNOSE_PRODUCTS.sql`
- [ ] At least 1 category exists
- [ ] At least 1 product exists
- [ ] Products marked as `available = true`
- [ ] If no products: Run `ADD_SAMPLE_PRODUCTS.sql`

### Storage Bucket
- [ ] `product-images` bucket exists
- [ ] Bucket is public
- [ ] Upload policies configured

---

## Feature Testing

### 1. Mobile Header (No setup needed)
- [ ] Visit site on mobile device or resize browser
- [ ] Logo appears at top of menu page
- [ ] Category buttons scroll horizontally
- [ ] Clicking category scrolls to section
- [ ] Header stays fixed when scrolling

**Test URL:** `/menu`

---

### 2. Waiter Management
- [ ] Visit `/admin-waiters`
- [ ] Page loads without errors
- [ ] Click "Adicionar Novo Garçom"
- [ ] Fill in form:
  - Name: Test Waiter
  - Email: test@example.com
  - Password: test123
- [ ] Click "Criar Garçom"
- [ ] Success message appears
- [ ] Waiter appears in list
- [ ] Can delete test waiter

**Test URL:** `/admin-waiters`

**If fails:** Check environment variables in Cloudflare

---

### 3. Products Management
- [ ] Visit `/admin-products`
- [ ] Products list loads
- [ ] Click "Novo Produto"
- [ ] Fill in form:
  - Name: Test Product
  - Category: (select one)
  - Price: 10.00
  - Description: Test description
- [ ] Upload image (optional)
- [ ] Check "Produto disponível"
- [ ] Click "Salvar"
- [ ] Success message appears
- [ ] Product appears in list

**Test URL:** `/admin-products`

**If fails:** Run `DIAGNOSE_PRODUCTS.sql`

---

### 4. Menu Display
- [ ] Visit `/menu`
- [ ] Categories appear
- [ ] Products appear under categories
- [ ] Product images load (if uploaded)
- [ ] Prices display correctly
- [ ] Can add items to cart
- [ ] Cart button appears at bottom

**Test URL:** `/menu`

**If fails:** Check if products are marked as available

---

### 5. WhatsApp Connection
- [ ] Visit `/whatsapp-admin`
- [ ] Page loads without errors
- [ ] Click "Conectar WhatsApp"
- [ ] QR code appears
- [ ] Open WhatsApp on phone
- [ ] Go to Settings → Linked Devices
- [ ] Tap "Link a Device"
- [ ] Scan QR code
- [ ] Wait for "Conectado!" message
- [ ] Status shows "Conectado"
- [ ] Phone number displays

**Test URL:** `/whatsapp-admin`

**If fails:** 
- Check `WHATSAPP_ENCRYPTION_KEY` is set
- Check `whatsapp_sessions` table exists
- Check browser console for errors

---

## End-to-End Testing

### Complete Order Flow
- [ ] Customer scans QR code
- [ ] Enters name and phone
- [ ] Browses menu
- [ ] Adds items to cart
- [ ] Proceeds to checkout
- [ ] Generates PIX payment
- [ ] Marks payment as complete (test)
- [ ] Order appears in kitchen
- [ ] WhatsApp notification sent (if connected)

---

## Performance Checks

### Page Load Times
- [ ] Home page loads < 2 seconds
- [ ] Menu page loads < 3 seconds
- [ ] Admin pages load < 2 seconds
- [ ] Images load progressively

### Mobile Experience
- [ ] All pages responsive
- [ ] Touch targets large enough
- [ ] No horizontal scrolling
- [ ] Text readable without zooming

### Browser Compatibility
- [ ] Works in Chrome/Edge
- [ ] Works in Safari (iOS)
- [ ] Works in Firefox
- [ ] Works in mobile browsers

---

## Security Checks

### Environment Variables
- [ ] No secrets in Git repository
- [ ] `.env` in `.gitignore`
- [ ] Service role key not exposed to client
- [ ] Encryption key is 64 characters

### Supabase RLS
- [ ] RLS enabled on all tables
- [ ] Public can only read available products
- [ ] Only authenticated users can manage orders
- [ ] Only service role can manage users

### API Endpoints
- [ ] Admin endpoints require authentication
- [ ] CORS configured correctly
- [ ] Rate limiting in place (if applicable)

---

## Monitoring Setup

### Error Tracking
- [ ] Check Cloudflare deployment logs
- [ ] Check Supabase logs
- [ ] Check browser console for errors
- [ ] Set up error notifications (optional)

### WhatsApp Monitoring
- [ ] Connection status visible in admin
- [ ] Delivery stats tracking
- [ ] Error logs accessible
- [ ] Alerts configured (optional)

---

## Post-Deployment

### Documentation
- [ ] Update README with new features
- [ ] Document any custom configurations
- [ ] Note any known issues
- [ ] Update changelog

### Team Communication
- [ ] Notify team of deployment
- [ ] Share admin credentials securely
- [ ] Provide training on new features
- [ ] Schedule follow-up review

### Backup
- [ ] Database backup created
- [ ] Environment variables documented
- [ ] Code tagged in Git
- [ ] Deployment notes saved

---

## Rollback Plan

If something goes wrong:

### Quick Rollback
1. Go to Cloudflare Pages → Deployments
2. Find previous working deployment
3. Click "..." → "Rollback to this deployment"
4. Confirm rollback

### Environment Variables
1. Keep backup of old values
2. Can revert in Cloudflare settings
3. Redeploy after reverting

### Database
1. Supabase has automatic backups
2. Can restore from backup if needed
3. Contact Supabase support if issues

---

## Success Criteria

✅ **All systems operational when:**

1. Mobile header displays correctly
2. Can create and manage waiters
3. Products visible in menu
4. Can add/edit products
5. WhatsApp connected and sending
6. Orders flow through system
7. No console errors
8. All pages load quickly
9. Mobile experience smooth
10. Team trained and ready

---

## Troubleshooting Quick Links

- **Environment issues:** See `ENVIRONMENT_SETUP.md`
- **Product issues:** Run `DIAGNOSE_PRODUCTS.sql`
- **WhatsApp issues:** See `FIXES_GUIDE.md` → WhatsApp section
- **Waiter issues:** Check Cloudflare environment variables
- **General help:** See `QUICK_START_FIXES.md`

---

## Support Contacts

- **Cloudflare Support:** https://dash.cloudflare.com/
- **Supabase Support:** https://supabase.com/dashboard/support
- **Documentation:** All `.md` files in project root

---

**Last Updated:** After fixing all 4 issues
**Next Review:** After first production deployment

---

## Notes

Add any deployment-specific notes here:

- Deployment date: _______________
- Deployed by: _______________
- Issues encountered: _______________
- Resolutions: _______________
- Follow-up needed: _______________
