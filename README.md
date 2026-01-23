# Salon Elegance - Supabase Migration

## 🚀 Complete Migration from Render to Supabase

### 📁 FILES TO REPLACE:
1. Replace `admin.js` with `admin-supabase.js`
2. Replace `products.js` with `products-supabase.js`
3. Replace `basket.js` with `basket-supabase.js`
4. Add `supabase-config.js` (new file)

### 📁 FILES TO DELETE:
1. ❌ `server.js` - No longer needed
2. ❌ `publisher.js` - No longer needed
3. ❌ Update `package.json` - Remove Express, CORS, Multer packages

### 🗄️ DATABASE SETUP:
1. Go to https://app.supabase.com
2. Open your project: `zmvwegkziymxdvjiwuhl`
3. Go to **SQL Editor**
4. Copy and paste ALL of `supabase-setup.sql`
5. Click **RUN**

### 🔧 HTML UPDATES:

**In `admin.html`:**
```html
<!-- BEFORE: -->
<script src="js/admin.js"></script>

<!-- AFTER: -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="js/supabase-config.js"></script>
<script src="js/admin-supabase.js"></script>