# Email Setup Guide

## Current Status
✅ Email functionality is implemented
✅ Console backend is active (emails print to terminal for testing)
✅ Invitation emails are sent automatically when creating invitations

## Development Mode (Current)
Emails are printed to the terminal/console where Django is running. This is perfect for testing without needing real email credentials.

**To test:**
1. Create an invitation in Team Management
2. Check the terminal where `python manage.py runserver` is running
3. You'll see the full email content printed there

## Production Mode (Gmail SMTP - FREE)

### Step 1: Prepare Gmail Account
1. Use an existing Gmail account or create a new one
2. Enable 2-Factor Authentication:
   - Go to https://myaccount.google.com/security
   - Enable "2-Step Verification"

### Step 2: Generate App Password
1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and "Other (Custom name)"
3. Name it "Vyapar Margadarshan"
4. Click "Generate"
5. Copy the 16-character password (e.g., "abcd efgh ijkl mnop")

### Step 3: Update .env File
Edit `backend/.env` and update these lines:

```env
# Change from console to SMTP
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=abcdefghijklmnop
DEFAULT_FROM_EMAIL=Vyapar Margadarshan <your-email@gmail.com>
```

### Step 4: Restart Django Server
```bash
# Stop the server (Ctrl+C)
# Start it again
python manage.py runserver
```

### Step 5: Test
1. Create an invitation with a real email address
2. Check the recipient's inbox
3. The email should arrive within seconds

## Alternative: Brevo (Sendinblue) - 300 emails/day FREE

If you prefer not to use Gmail:

1. Sign up at https://www.brevo.com/ (free account)
2. Get your SMTP credentials from Settings > SMTP & API
3. Update .env:

```env
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-brevo-email@example.com
EMAIL_HOST_PASSWORD=your-brevo-smtp-key
DEFAULT_FROM_EMAIL=Vyapar Margadarshan <your-brevo-email@example.com>
```

## Troubleshooting

### Emails not sending?
1. Check terminal for error messages
2. Verify EMAIL_HOST_USER and EMAIL_HOST_PASSWORD are correct
3. Make sure 2FA is enabled and you're using App Password (not regular password)
4. Check Gmail's "Less secure app access" is NOT needed (App Passwords work with 2FA)

### Gmail blocking emails?
- Gmail may block if sending too many emails too quickly
- Free Gmail accounts have daily sending limits (~500 emails/day)
- Consider using Brevo for higher volume

### Testing without real emails?
- Keep `EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend`
- All emails will print to terminal instead of sending

## Email Features Implemented

✅ Invitation emails with HTML formatting
✅ Clickable "Accept Invitation" button
✅ Organization name and role information
✅ Expiration date display
✅ Fallback plain text version
✅ Professional email template

## Future Enhancements (Optional)

- [ ] Welcome email after user registration
- [ ] Expense approval notifications
- [ ] Budget alert emails
- [ ] Weekly expense summary emails
- [ ] Password reset emails
- [ ] Email templates with organization branding
