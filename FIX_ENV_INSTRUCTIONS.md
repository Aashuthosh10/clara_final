# Fix Your .env File - Remove NULL Characters

Your `.env` file has NULL characters that are causing issues. Here's how to fix it:

## Quick Fix Steps:

1. **Delete your current `.env` file** (it has corrupted NULL characters)

2. **Copy from `env-template.txt`:**
   ```powershell
   # In CLARA-A folder, run:
   copy env-template.txt .env
   ```

3. **Edit `.env` and add your Sarvam API key:**
   ```
   SARVAM_API_KEY=sk_ql1a4nll_kJf8dbyeoFKhQF8IUxrbXp78
   SARVAM_API_URL=https://api.sarvam.ai
   ```

4. **Save the file** - Make sure you save it as plain text (not with encoding issues)

5. **Restart your CLARA server**

## What Was Fixed:

✅ Updated `voices.js` with correct Sarvam speaker names (`anushka` instead of `hin_in_native_f`)
✅ Updated `env-template.txt` with clean Sarvam configuration
✅ The `target_language_code` (like `hi-IN`, `ta-IN`) is what creates native accent - not the speaker name

## Important:

- **Speaker name** (`anushka`) = Voice style (clear, professional)
- **target_language_code** (`hi-IN`, `ta-IN`) = Native accent (this is what makes it sound native!)

The language code `hi-IN` will make it sound like native Hindi, `ta-IN` like native Tamil, etc.

