# Testing Guide - After `npm run dev`

## 🚀 Prerequisites

### 1. Environment Variables Setup

Create/update `.env.local` in the project root:

```bash
# Supabase (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Redis (REQUIRED for usage tracking)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# AI Providers (at least one required)
GOOGLE_AI_API_KEY=your-gemini-key
GROQ_API_KEY=your-groq-key
# Optional:
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
```

### 2. Supabase Database Setup

Run these SQL commands in your Supabase SQL Editor:

```sql
-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  github_username TEXT,
  avatar_url TEXT,
  display_name TEXT,
  tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'premium')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create usage_tracking table
CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_id TEXT,
  action TEXT NOT NULL CHECK (action IN ('generate', 'analyze')),
  stack TEXT,
  repo_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create saved_readmes table
CREATE TABLE IF NOT EXISTS saved_readmes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  repo_url TEXT,
  stack TEXT,
  sections JSONB DEFAULT '[]',
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create waitlist table
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  feature TEXT NOT NULL,
  use_case TEXT,
  value_level TEXT CHECK (value_level IN ('nice-to-have', 'time-saver', 'need-for-work')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  email TEXT,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  page TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_readmes ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- 8. RLS Policies for usage_tracking
CREATE POLICY "Users can view own usage"
  ON usage_tracking FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Anyone can insert usage"
  ON usage_tracking FOR INSERT
  WITH CHECK (true);

-- 9. RLS Policies for saved_readmes
CREATE POLICY "Users can view own READMEs"
  ON saved_readmes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own READMEs"
  ON saved_readmes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own READMEs"
  ON saved_readmes FOR DELETE
  USING (auth.uid() = user_id);

-- 10. RLS Policies for waitlist
CREATE POLICY "Anyone can view waitlist"
  ON waitlist FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert waitlist"
  ON waitlist FOR INSERT
  WITH CHECK (true);

-- 11. RLS Policies for feedback
CREATE POLICY "Anyone can insert feedback"
  ON feedback FOR INSERT
  WITH CHECK (true);

-- 12. Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, github_username, avatar_url, display_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'user_name',
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'user_name',
      'Developer'
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Trigger to call function on new user
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 3. Supabase Auth Setup

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable GitHub provider
3. Add your GitHub OAuth App credentials:
   - Client ID
   - Client Secret
4. Set redirect URL: `http://localhost:3000/auth/callback`

---

## 🧪 Testing Steps

### Step 1: Start the Dev Server

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

---

### Step 2: Test Anonymous User Flow

**What to test:**
- ✅ Can access the homepage without login
- ✅ Can generate README sections (limited to 2 per day)
- ✅ Usage meter shows "2/2" limit
- ✅ Session cookie is set (`readme_session`)

**Steps:**
1. Open browser in **Incognito/Private mode** (to ensure no existing session)
2. Go to `http://localhost:3000`
3. You should see a "Sign in with GitHub" button
4. Try generating a README section:
   - Enter a project name
   - Select a section (e.g., "Introduction")
   - Click Generate
5. Check browser DevTools → Application → Cookies
   - Should see `readme_session` cookie
6. Generate 2 more sections
   - After 2nd generation, should see limit message
   - Usage meter should show "2/2"

**Expected Results:**
- ✅ First 2 generations work
- ✅ 3rd generation shows: "You've used your 2 free generations. Sign in to get 5 per day!"
- ✅ Usage meter displays correctly

---

### Step 3: Test GitHub OAuth Login

**What to test:**
- ✅ Login button redirects to GitHub
- ✅ OAuth callback works
- ✅ User profile is created in Supabase
- ✅ User menu appears after login

**Steps:**
1. Click "Sign in with GitHub"
2. Authorize on GitHub
3. Should redirect back to homepage
4. Check:
   - User menu appears (avatar + name)
   - No "Sign in" button visible
5. Open Supabase Dashboard → Table Editor → `profiles`
   - Should see your new profile row
   - `tier` should be `free`

**Expected Results:**
- ✅ Login successful
- ✅ Profile created automatically
- ✅ User menu shows your GitHub username/avatar

---

### Step 4: Test Logged-In User Features

**What to test:**
- ✅ Can generate 5 sections per day (not 2)
- ✅ Can save READMEs
- ✅ Can access dashboard
- ✅ Usage meter shows "X/5"

**Steps:**
1. After logging in, try generating sections
2. Generate 5 sections (should all work)
3. Try to save a README:
   - Generate a section
   - Look for "Save" button (if implemented in UI)
   - Or test via API: `POST /api/user/readmes`
4. Go to `/dashboard`
   - Should see your saved READMEs
   - Should see usage meter

**Expected Results:**
- ✅ 5 generations work (not limited to 2)
- ✅ Can save READMEs
- ✅ Dashboard loads with your data

---

### Step 5: Test Usage Tracking

**What to test:**
- ✅ Usage is tracked in Redis
- ✅ Usage is logged to Supabase
- ✅ Limits reset at midnight UTC

**Steps:**
1. Generate a section
2. Check Supabase Dashboard → `usage_tracking` table
   - Should see a new row
   - Should have `action: 'generate'`
   - Should have your `user_id` (if logged in) or `session_id` (if anonymous)
3. Check Redis (Upstash Dashboard):
   - Look for keys like `usage:daily:user-id:2025-01-15`
   - Value should be the count

**Expected Results:**
- ✅ Data appears in both Redis and Supabase
- ✅ Counts increment correctly

---

### Step 6: Test Waitlist Feature

**What to test:**
- ✅ Can join waitlist for locked features
- ✅ Waitlist count displays
- ✅ Email is saved correctly

**Steps:**
1. Find a locked feature (e.g., "Private Repos" if implemented)
2. Click the lock icon
3. Fill out waitlist form:
   - Email (pre-filled if logged in)
   - Use case (optional)
4. Submit
5. Check Supabase Dashboard → `waitlist` table
   - Should see your entry
   - `feature` column should match

**Expected Results:**
- ✅ Waitlist modal opens
- ✅ Submission successful
- ✅ Count updates
- ✅ Data saved to database

---

### Step 7: Test API Routes Directly

**Test `/api/user/usage`:**
```bash
curl http://localhost:3000/api/user/usage
```
Should return:
```json
{
  "used": 0,
  "limit": 2,
  "remaining": 2,
  "tier": "anonymous",
  "resetsAt": "2025-01-16T00:00:00.000Z"
}
```

**Test `/api/generate` (POST):**
```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "sectionId": "introduction",
    "projectName": "Test Project",
    "stack": {"primary": "nextjs", "language": "typescript"}
  }'
```

**Test `/api/waitlist` (GET):**
```bash
curl "http://localhost:3000/api/waitlist?feature=private-repos"
```

---

### Step 8: Test Error Handling

**What to test:**
- ✅ Graceful degradation if Supabase is down
- ✅ Graceful degradation if Redis is down
- ✅ Proper error messages

**Steps:**
1. Temporarily break Supabase connection (wrong URL in env)
2. Try generating a section
   - Should still work (fails open)
   - Should log warning but not crash
3. Fix Supabase, break Redis
4. Try generating
   - Should still work
   - Should log warning

**Expected Results:**
- ✅ App doesn't crash
- ✅ Errors are logged
- ✅ User experience is not broken

---

### Step 9: Test Admin Dashboard (if applicable)

**What to test:**
- ✅ Admin can access `/admin`
- ✅ Non-admin gets 403
- ✅ Stats load correctly

**Steps:**
1. Set `ADMIN_EMAILS` in `.env.local`:
   ```bash
   ADMIN_EMAILS=your-email@gmail.com
   ```
2. Login with that email
3. Go to `/admin`
4. Should see dashboard with stats
5. Logout and login with different email
6. Try `/admin` - should get 403

**Expected Results:**
- ✅ Admin access works
- ✅ Non-admin blocked
- ✅ Stats display correctly

---

## 🐛 Common Issues & Debugging

### Issue: "Cannot find module '@/supabase/client'"

**Fix:** Check your `tsconfig.json` has:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Issue: "NEXT_PUBLIC_SUPABASE_URL is not defined"

**Fix:** 
- Make sure `.env.local` exists in project root
- Restart dev server after adding env vars
- Check variable names are exact (case-sensitive)

### Issue: "Profile not created on login"

**Fix:**
- Check Supabase trigger is created (see SQL above)
- Check Supabase Dashboard → Database → Functions
- Check auth callback route is working

### Issue: "Usage limit not working"

**Fix:**
- Check Redis connection (Upstash dashboard)
- Check Redis keys are being created
- Check `usage.ts` is being called correctly
- Look at browser console for errors

### Issue: "RLS policy violation"

**Fix:**
- Check RLS policies in Supabase
- Make sure policies allow the operations you're testing
- Check if you're using service role key (should use anon key for client)

---

## 📊 Verification Checklist

After testing, verify:

- [ ] Anonymous users can generate 2 sections
- [ ] Logged-in users can generate 5 sections
- [ ] Usage meter displays correctly
- [ ] READMEs can be saved (logged-in only)
- [ ] Dashboard shows saved READMEs
- [ ] Waitlist signup works
- [ ] OAuth login works
- [ ] Profile auto-creates on signup
- [ ] Usage tracked in Supabase
- [ ] Usage tracked in Redis
- [ ] Error handling works gracefully
- [ ] No console errors
- [ ] No TypeScript errors

---

## 🚀 Ready for Production?

Once all tests pass:

1. **Deploy to Vercel staging**
2. **Add environment variables in Vercel dashboard**
3. **Update Supabase redirect URLs** to include production domain
4. **Test again in staging**
5. **Monitor logs** for any issues
6. **Deploy to production**

---

## 💡 Pro Tips

1. **Use browser DevTools** to check:
   - Network tab (API calls)
   - Console (errors)
   - Application tab (cookies, localStorage)

2. **Use Supabase Dashboard** to:
   - View database tables
   - Check auth users
   - View logs

3. **Use Upstash Dashboard** to:
   - View Redis keys
   - Check usage counts

4. **Test in incognito** to avoid cached sessions

5. **Clear cookies** between tests if needed

