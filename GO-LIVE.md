# Going live at market.edumv.com

The setup is:
- **Neon:** database and photo storage.
- **Vercel:** runs the website.
- **GoDaddy:** keeps the domain. Your GoDaddy Basic hosting can't run this app, so it isn't used, and anything already on edumv.com keeps working.

## What you do (about 20 minutes)

1. **Neon API key.** In the Neon Console, open **Account settings → API keys** and create a key. A key limited to project `holy-feather-15022919` is safest.
2. **Vercel account.** Sign up free at https://vercel.com (you can sign in with GitHub). Under **Account settings → Tokens**, create a token.
3. **Give both to Claude safely.** In Claude, open the cloud environment menu in the session title bar, choose **Edit**, and add two environment variables:
   - `NEON_API_KEY`: your Neon key
   - `VERCEL_TOKEN`: your Vercel token

   Don't paste keys into the chat. Then start a new session and say **"continue going live"**.
4. **One DNS record at GoDaddy**, when Claude asks. Go to **My Products → edumv.com → DNS → Add record**:
   - Type: `CNAME`
   - Name: `market`
   - Value: the address Vercel shows (usually `cname.vercel-dns.com`)

## What Claude then does

1. Links the Neon project and runs `neon deploy`, which creates the `uploads` photo bucket.
2. Creates the Vercel project from the GitHub branch and sets its settings:
   - `DATABASE_URL`: Neon's pooled connection string
   - `AUTH_SECRET`: a fresh random value
   - `ADMIN_PHONES`: your phone number
   - `NEXT_PUBLIC_SITE_URL=https://market.edumv.com`
   - `STORAGE_DRIVER=neon` plus Neon's `AWS_*` storage values
   - For the trial: `DEMO_LOGIN=true` and optionally `SEED_DEMO=true`
3. Deploys. Each deploy sets up or updates the database tables and categories automatically (the `vercel-build` script).
4. Adds `market.edumv.com` to the Vercel project and tests the live site.

## Trial vs real launch

| | Trial (`DEMO_LOGIN=true`) | Real launch |
|---|---|---|
| Sign-in code | Shown on screen | Sent by SMS |
| Who can sign in | Anyone, as any number | Only the phone's owner |
| Banner | "Demo version for testing" on every page | None |
| Safe for real orders | No | Yes |

For the real launch, create a Twilio account (or a local Dhiraagu/Ooredoo SMS service) and change these settings in Vercel:
- `SMS_PROVIDER=twilio`, plus the `TWILIO_*` values
- `DEMO_LOGIN=false`

If you used demo shops (`SEED_DEMO=true`), ask Claude to remove them before launch.

## Costs

Neon and Vercel both have free plans that should cover a launch on one island. SMS is the only per-use cost.
