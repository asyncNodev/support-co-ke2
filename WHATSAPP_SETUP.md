# WhatsApp Notifications Setup Guide

## Overview

Your app now supports WhatsApp notifications! Users can receive instant alerts about RFQs, quotations, and important updates directly on WhatsApp.

## Features

### For Hospitals (Buyers)
- 💰 New quotation received alerts
- 📊 Price comparison notifications
- 🤝 Group buying opportunities
- ✅ RFQ status updates

### For Vendors
- 🏥 New RFQ alerts matching their categories
- 🎉 Quotation chosen notifications with buyer contact info
- ⚡ Instant mobile alerts for time-sensitive opportunities

### For Admins
- 👤 New user registration alerts
- 📢 Platform activity notifications

## Setup Instructions

### 1. Get Twilio Account

1. Go to [Twilio.com](https://www.twilio.com/try-twilio)
2. Sign up for a free account
3. Verify your phone number

### 2. Enable WhatsApp Sandbox (Free for Testing)

1. In Twilio Console, go to **Messaging** → **Try it out** → **Send a WhatsApp message**
2. Follow the instructions to join the sandbox:
   - Send WhatsApp message to the sandbox number (e.g., +1 415 523 8886)
   - Send the code shown (e.g., "join <your-code>")

### 3. Get Your Credentials

1. Find your **Account SID** and **Auth Token** in Twilio Console dashboard
2. Note your WhatsApp sandbox number (usually `whatsapp:+14155238886`)

### 4. Add to Secrets in Hercules

Go to **Secrets** tab in Hercules App Builder and add:

```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

### 5. Production Setup (After Testing)

For production use with your own WhatsApp Business number:

1. Apply for WhatsApp Business API access through Twilio
2. Get your business verified
3. Update `TWILIO_WHATSAPP_NUMBER` to your business number

**Cost:** 
- Testing (Sandbox): FREE
- Production: ~$0.005 per message (very affordable)

## How It Works

### Phone Number Format

The system automatically formats Kenyan phone numbers:
- User enters: `0712345678`
- System converts to: `+254712345678`

### Notification Triggers

WhatsApp notifications are sent when:

1. **Vendor receives RFQ alert**
   - Triggered when: Hospital submits RFQ
   - Message includes: Product names, link to view RFQ

2. **Buyer receives quotation**
   - Triggered when: Vendor submits quotation
   - Message includes: Product name, vendor name, price, link to compare

3. **Vendor's quotation is chosen**
   - Triggered when: Hospital selects quotation
   - Message includes: Product name, buyer contact info (phone + email)

4. **Admin gets registration alert**
   - Triggered when: New user registers
   - Message includes: User name, role, email, link to admin panel

### User Control

Users can:
- Enable/disable WhatsApp notifications in [settings](link://settings/notifications)
- Enable/disable email notifications separately
- See what notifications they'll receive
- Update preferences anytime

## Testing

### Test the Flow:

1. **As Admin:**
   - Approve a vendor and buyer account
   - Both should have phone numbers added

2. **As Buyer:**
   - Go to settings → Enable WhatsApp notifications
   - Submit an RFQ

3. **As Vendor:**
   - Should receive WhatsApp notification about new RFQ
   - Submit a quotation

4. **As Buyer:**
   - Should receive WhatsApp notification about quotation
   - Choose a quotation

5. **As Vendor:**
   - Should receive WhatsApp notification that quotation was chosen

## Troubleshooting

### Messages Not Sending

**Check these:**

1. ✅ Twilio credentials are correct in Secrets tab
2. ✅ User has phone number in profile
3. ✅ User has enabled WhatsApp notifications
4. ✅ Phone number is in correct format (+254...)
5. ✅ Sandbox is active (for testing)

### Common Issues

**"No phone number provided"**
- User needs to add phone number in their profile

**"Twilio not configured"**
- Add Twilio credentials to Secrets tab
- Restart your development server

**"Failed to send WhatsApp message"**
- Check Twilio API logs in Twilio Console
- Verify sandbox is still active
- Ensure user has joined sandbox (testing only)

## Phone Number Requirements

Users MUST add their phone number to receive WhatsApp notifications:
- Format: Can be with/without country code
- System auto-adds Kenya code (+254) if missing
- Shown during registration
- Can be updated in profile

## Message Examples

### New RFQ for Vendor
```
🏥 New RFQ on supply.co.ke

Products needed: Hospital Bed, Wheelchair

Submit your quotation now to win this order!

View RFQ: https://supply.co.ke/vendor

- supply.co.ke Team
```

### New Quotation for Buyer
```
💰 New Quotation Received

Product: Hospital Bed
Vendor: ABC Medical Supplies
Price: KES 45,000

Compare prices and choose the best deal!

View quotations: https://supply.co.ke/buyer/rfq/xxxxx

- supply.co.ke Team
```

### Quotation Chosen for Vendor
```
🎉 Your Quotation Was Chosen!

Congratulations! Kenyatta Hospital selected your quotation for:
Hospital Bed

Buyer Contact:
📱 Phone: +254712345678
📧 Email: procurement@hospital.co.ke

Please contact them directly to finalize the order.

- supply.co.ke Team
```

## Benefits for Your Platform

### Increased Engagement
- Instant notifications = faster response times
- Users never miss opportunities
- Mobile-first approach for Kenya market

### Competitive Advantage
- WhatsApp is #1 business communication tool in Kenya
- More professional than SMS
- Rich formatting with emojis and links

### Better Conversion
- Real-time alerts drive immediate action
- Reduces missed RFQs for vendors
- Speeds up procurement for hospitals

## Alternative Services

If Twilio doesn't work for you, consider:

1. **WhatsApp Business API** (Official)
   - Direct integration with Meta
   - Requires business verification
   - More expensive

2. **Vonage (Nexmo)**
   - Similar to Twilio
   - Good for international messages

3. **Africa's Talking**
   - Kenya-based service
   - Specializes in African markets
   - Competitive pricing

## Costs

### Twilio Pricing (Approximate)
- **Testing:** FREE (sandbox)
- **Production:** 
  - Kenya to Kenya: ~$0.005 per message
  - 1000 messages = ~$5
  - Very affordable for most businesses

### Your Platform Economics
- Average user sends/receives ~10 notifications/month
- 100 users = 1000 notifications
- Cost: ~$5/month
- You can pass this to users or absorb it

## Next Steps

After setup:
1. ✅ Test with sandbox
2. ✅ Get user feedback
3. ✅ Apply for WhatsApp Business API (production)
4. ✅ Consider adding SMS fallback for users without WhatsApp
5. ✅ Add notification analytics to track delivery rates

## Support

Need help?
- Twilio Support: support.twilio.com
- WhatsApp API Docs: twilio.com/docs/whatsapp
- Email us: hello@hercules.app

---

**Pro Tip:** Most Kenyans check WhatsApp more frequently than email. This feature will dramatically increase user engagement!
