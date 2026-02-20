# Hostinger SMTP Email Setup

Follow these steps to use the AyurCentral Hostinger mailbox for transactional emails sent by Video Quiz.

1. **Install dependencies**  
   Run `npm install` to ensure the newly added `nodemailer` package is available after pulling these changes.

2. **Create/Update your `.env.local` (or deployment environment) with SMTP variables**  
   ```env
   EMAIL_SERVER_HOST=smtp.hostinger.com
   EMAIL_SERVER_PORT=465
   EMAIL_SERVER_USER=technicalco-ordinator@ayurcentral.in
   EMAIL_SERVER_PASSWORD=YourEmailPasswordHere
   EMAIL_FROM="AyurCentral VideoQuiz <technicalco-ordinator@ayurcentral.in>"
   # Optional overrides if you need custom TLS behaviour:
   # EMAIL_SERVER_SECURE=true
   # EMAIL_SERVER_TLS_REJECT_UNAUTHORIZED=true
   ```
   `EMAIL_SERVER_SECURE` defaults to `true` when you use port `465`. Set it to `false` only if Hostinger asks you to switch to STARTTLS on port `587`.  
   `EMAIL_SERVER_TLS_REJECT_UNAUTHORIZED` is available for troubleshooting certificate issues; leave it `true` unless you know otherwise.

3. **Local verification**  
   - Start the app locally with `npm run dev`.  
   - Trigger any flow that sends an email (e.g., signup verification) and watch the server console for `[mailer]` logs.  
   - On success, no log appears; on failure, check the logged error for guidance.

4. **Production configuration**  
   Mirror the same environment variables in your Hostinger/Render deployment (or wherever the Next.js app runs). No code changes are required beyond supplying the credentials.

The mailer now prefers SMTP and falls back to Resend/SendGrid only when the SMTP configuration is missing or failing, so providing the Hostinger credentials is all that is needed to switch providers.
