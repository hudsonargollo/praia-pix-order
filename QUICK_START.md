# Quick Start - Store Open/Close Feature

## 🚀 Deploy in 3 Steps

### Step 1: Apply Database Migration
Open your Supabase SQL Editor and run:

```sql
-- Copy and paste the entire contents of:
-- supabase/migrations/20251121000001_create_store_settings_table.sql
```

Or use Supabase CLI:
```bash
supabase db push
```

### Step 2: Deploy Your Code
```bash
npm run build
# Deploy to your hosting (Cloudflare, Vercel, etc.)
```

### Step 3: Test It!
1. Open cashier dashboard: `https://your-domain.com/cashier`
2. Look for the switch in the header (shows "Aberto" or "Fechado")
3. Toggle it and watch the magic happen! ✨

## 🎯 How It Works

**Cashier Dashboard** → Toggle Switch → **Database Updates** → **Real-time Broadcast** → **Customer Menu Updates**

## 📱 What Customers See

### Store Open ✅
- Normal menu
- Can add items to cart
- Can checkout

### Store Closed 🔒
- Red "Loja Fechada" banner
- All buttons disabled and show "Fechado"
- Cannot add items or checkout
- Clear message: "Não estamos aceitando pedidos no momento"

## 🔧 Troubleshooting

**Switch not appearing?**
- Check if user has `cashier` or `admin` role
- Clear browser cache

**Changes not reflecting?**
- Check browser console for errors
- Verify migration was applied successfully
- Check Supabase real-time is enabled

**Buttons still enabled when closed?**
- Hard refresh the page (Cmd+Shift+R or Ctrl+Shift+R)
- Check store_settings table has data

## 📊 Verify Migration

Run this in Supabase SQL Editor:
```sql
-- Check if table exists
SELECT * FROM store_settings;

-- Check if functions exist
SELECT get_store_status();

-- Test updating (as admin/cashier)
SELECT update_store_status(false);
SELECT update_store_status(true);
```

## ✅ Success Indicators

- ✅ Switch appears in cashier header
- ✅ Toggle changes color (green ↔ red)
- ✅ Toast notification appears on toggle
- ✅ Customer menu shows banner when closed
- ✅ Buttons disabled when closed
- ✅ Real-time updates work across tabs

## 🎉 You're Done!

The feature is now live. Cashiers can control when customers can place orders with a simple toggle switch.

---

**Need help?** Check `STORE_STATUS_FEATURE.md` for detailed documentation.
