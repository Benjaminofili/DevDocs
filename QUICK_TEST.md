# Quick Test Guide - After Integration

## ✅ What Was Just Added

I've integrated the auth components into your UI:

1. **Header Component** (`src/components/layout/Header.tsx`)
   - Shows on all pages
   - Contains: Usage Meter + User Menu + Login Button

2. **Added to Pages:**
   - ✅ Homepage (`/`)
   - ✅ Generate page (`/generate`)
   - ✅ Dashboard page (`/dashboard`)

## 🚀 How to Test Now

### Step 1: Make sure you're on the right branch
```bash
git branch
# Should show: feat/supabase-auth-usage-tracking
```

### Step 2: Start the dev server
```bash
npm run dev
```

### Step 3: Open browser
Go to: `http://localhost:3000`

### Step 4: What You Should See

**On the Homepage:**
- ✅ Header at the top with:
  - "📝 DevDocs" logo (left)
  - Usage Meter showing "0/2" (if anonymous) or "0/5" (if logged in)
  - Login Button OR User Menu (if logged in)

**On `/generate` page:**
- ✅ Same header at top
- ✅ Usage meter visible
- ✅ Auth buttons visible

**On `/dashboard` page:**
- ✅ Header at top
- ✅ Your saved READMEs (if any)
- ✅ Usage meter

## 🧪 Test the Features

### Test 1: Anonymous User
1. Open in **Incognito/Private** browser
2. Go to `http://localhost:3000`
3. **You should see:**
   - Header with "Sign in with GitHub" button
   - Usage meter showing "0/2"
4. Try generating a section
5. Usage should increment to "1/2", then "2/2"
6. After 2 generations, should see limit message

### Test 2: Login Flow
1. Click "Sign in with GitHub"
2. Authorize on GitHub
3. Should redirect back
4. **You should see:**
   - User menu (avatar + name) instead of login button
   - Usage meter now shows "0/5" (free tier)
5. Can generate 5 sections now

### Test 3: Dashboard
1. After logging in, go to `/dashboard`
2. Should see your saved READMEs
3. Usage meter visible

## 🐛 If You Don't See the Header

**Check:**
1. Browser console for errors (F12)
2. Terminal for build errors
3. Make sure `.env.local` has Supabase vars:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```

**Common Issues:**
- If header doesn't show: Check browser console
- If "Cannot find module" error: Restart dev server
- If auth doesn't work: Check Supabase env vars

## 📝 Next Steps

Once you see the header working:
1. Test the full flow (anonymous → login → generate → save)
2. Check Supabase dashboard for data
3. Test usage limits
4. Test dashboard functionality

---

**The components are now integrated!** You should see them when you run `npm run dev`.

