# Yo Payments Uganda (POS collections)

Kiosk POS collects customer payments through **Yo Payments** for:

- MTN Mobile Money
- Airtel Money
- Visa
- Mastercard

## Environment variables

```bash
YO_PAYMENTS_API_USERNAME=your_yo_api_username
YO_PAYMENTS_API_PASSWORD=your_yo_api_password
YO_PAYMENTS_SANDBOX=true   # use sandbox until go-live

# Registered in Yo portal → Instant Payment Notifications
YO_PAYMENTS_IPN_URL=https://your-domain.com/api/payments/yo/webhook

# Card rail: URL template from Yo when card acquiring is enabled on your account
YO_CARD_CHECKOUT_URL=https://your-yo-card-host/pay?amount={amount}&reference={reference}&return={returnUrl}
```

## Database

Apply migration:

```bash
supabase db push
```

Creates `payment_collections` to track pending/completed Yo collections before checkout finalizes.

## POS flow

1. Cashier opens **Payment** on POS.
2. Chooses **MTN MoMo**, **Airtel Money**, **Visa**, or **Mastercard** (shown when Yo credentials are set).
3. **Mobile money**: enter customer number → Yo sends phone approval prompt (`acdepositfunds`).
4. **Cards**: open Yo card checkout URL → cashier confirms when paid.
5. Successful collection is added to the sale tender list → **Complete sale** runs `process_checkout` as usual.

## API routes

| Route | Purpose |
|-------|---------|
| `GET /api/payments/yo/config` | Whether Yo is enabled + methods |
| `POST /api/payments/yo/initiate` | Start a collection |
| `GET /api/payments/yo/status/:id` | Poll / refresh status |
| `POST /api/payments/yo/webhook` | Yo IPN callback |

## Yo portal setup

1. Create a **Business** account at [Yo Payments](https://paymentsweb.yo.co.ug/).
2. Request API credentials and (if needed) **Visa/Mastercard** enablement from Yo support.
3. Set **Instant Payment Notification** URL to your `YO_PAYMENTS_IPN_URL`.
4. Test in sandbox, then set `YO_PAYMENTS_SANDBOX=false` for production.

## Notes

- Mobile money uses Yo `acdepositfunds` (customer approves on phone).
- Card support requires `YO_CARD_CHECKOUT_URL` from your Yo merchant card product.
- SaaS subscription billing remains on Stripe; Yo is for **in-store customer collections**.
