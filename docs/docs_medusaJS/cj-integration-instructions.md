**Cursor Rules (read first)**

1. Environment & Safety

* Windows dev environment. Use cross-platform commands (Node/PNPM/Yarn), no && chains that break on Windows.

* Never run dev, build, migrate, or destructive commands without explicit user permission.

* Respect repo layout (example):

/docs  
/.dev  
/ai-com-app            \# (your Next.js frontend)  
/medusa-backend        \# (Medusa server)

* 

* Keep secrets strictly in .env\*. Never commit them.

2. Coding Standards

* TypeScript everywhere in Medusa ("strict": true).

* Small, named modules; no “god services”.

* Error handling: timeouts, retries, and fallbacks for all CJ API calls.

* Logging: redact secrets; include request IDs.

3. Documentation & Tests

* After every task, update /docs/integration-log.md with what changed and paste test output.

* No task is “done” until its Test section passes.

---

# **Task 0 — Project prep**

User Action

* Confirm repo layout and which folder is the Medusa backend (e.g., /medusa-backend).

* Create /docs/integration-log.md.

Cursor Agent Action

* Create /medusa-backend/src/services/ (if missing).

* Create /medusa-backend/src/utils/ (for CJ client).

* Create /medusa-backend/src/api/webhooks/cj/ (for incoming updates later).

Test (must pass)

* Tree shows the three folders.

* /docs/integration-log.md exists and is committed.

---

# **Task 1 — Get CJ API access & app**

User Action

* In CJ dashboard (desktop web), go to Store Authorization → Others → CJ API. See [CJ Developers API Introduction](https://developers.cjdropshipping.com/en/api/introduction.html).

* Create an app / authorize a custom store, generate an API Key (no secret), note base URL and any store ID required. Use the API Key with your CJ account email to obtain an accessToken via [CJ Authentication API](https://developers.cjdropshipping.com/en/api/api2/api/auth.html) (access tokens expire in 15 days; refresh tokens last 180 days).

* If asked, prepare your public Medusa URL and webhook URLs (you can enter placeholders for now).

Cursor Agent Action

* Add to /medusa-backend/.env:

CJ\_API\_BASE\_URL=  
CJ\_API\_KEY=              \# used with CJ email to fetch tokens  
CJ\_ACCOUNT\_EMAIL=        \# CJ account email  
CJ\_ACCESS\_TOKEN=         \# 15-day token for API calls  
CJ\_REFRESH\_TOKEN=        \# 180-day token for refresh  
CJ\_WEBHOOK\_SECRET=       \# generate a random string for HMAC/signature  
CJ\_STORE\_ID=             \# if CJ uses a store binding  
CJ\_TIMEOUT\_MS=5000

* 

* Add .env.example with the same keys but blank values.

Test (must pass)

* Medusa boots without dotenv errors (don’t start server if not permitted—just env-cmd/lint check).

* Secrets are not committed.

---

# **Task 2 — Decide your shipping menu (US & Canada)**

User Action

* In CJ’s product page → Shipping Calculator, check services & ETAs for US and Canada for your target SKUs (prefer SKUs with US warehouse stock for 3–7 days; Canada often 7–12 via CJPacket/USPS handoff). Record names/codes \+ average ETA \+ price hints.

Cursor Agent Action

* Create /medusa-backend/src/config/cj-shipping.ts:

export const CJ\_SHIPPING\_OPTIONS \= \[  
  { id: "us-standard",  name: "US Standard (5–7d)",  cjServiceCode: "CJPacket-US-STD", countries: \["US"\] },  
  { id: "us-expedited", name: "US Expedited (3–4d)", cjServiceCode: "CJPacket-US-EXP", countries: \["US"\] },  
  { id: "ca-standard",  name: "Canada Standard (7–12d)", cjServiceCode: "CJPacket-CA-STD", countries: \["CA"\] },  
\];

* (Replace codes/names with the exact strings you saw in CJ’s calculator.)

Test (must pass)

* Import the file in a scratch script and ensure the array is valid and contains your chosen services.

* Log the array; confirm it matches the CJ calculator.

Reminder: CJ’s domestic-speed promise is contingent on local stock; otherwise ETAs stretch. Select options accordingly.  
---

# **Task 3 — Create a tiny CJ API client**

Cursor Agent Action

* File: /medusa-backend/src/utils/cj-client.ts

  * Expose methods: getRates(payload), createOrder(payload), getTracking(cjOrderId).

  * Add Axios (or fetch) with:

    * Base URL from process.env.CJ\_API\_BASE\_URL

* Authorization: set header `CJ-Access-Token: <accessToken>` on all requests

    * Timeout from CJ\_TIMEOUT\_MS

    * Retry (x2) on 5xx \+ network

Test (must pass)

* Unit test (or simple node script) that instantiates the client and mocks a response.

* Verify timeouts and retry logic runs on simulated failure.

---

# **Task 4 — Create the Fulfillment Provider (scaffold)**

Cursor Agent Action

* File: /medusa-backend/src/services/cj-fulfillment.ts

  * export default class CJFulfillmentService extends AbstractFulfillmentService

  * static identifier \= "cj-dropshipping"

  * constructor(container, options) → initialize CJ client

  * Implement skeletons:

    * getFulfillmentOptions() → return from CJ\_SHIPPING\_OPTIONS for the cart’s country

    * validateFulfillmentData() → stash the selected service ID \+ any CJ quote refs

    * canCalculate() → initially false (we’ll wire rates later)

    * calculatePrice() → placeholder that throws “Not implemented”

    * createFulfillment() → placeholder that throws “Not implemented”

Medusa expects you to extend its AbstractFulfillmentService and wire options/validation/rates/order creation in this service.

Test (must pass)

* TypeScript builds.

* Medusa server imports the service without crashing (don’t run production commands).

---

# **Task 5 — Register provider in Region & shipping profiles**

Cursor Agent Action

* Ensure your Region configuration includes cj-dropshipping as a fulfillment provider.

* Make a Shipping Profile used by your test products that routes to this provider.

Test (must pass)

* From Admin, create a test shipping option for cj-dropshipping and see it in checkout (dev store).

* Checkout shows your US/CA option names.

---

# **Task 6 — (Optional v1) Static rate pricing**

User Action

* Provide your initial flat prices per tier (until live rates are ready).

Cursor Agent Action

* Implement canCalculate(): boolean → false

* In the shipping option config or calculatePrice fallback, return the static price based on shipping\_option.data.id.

Test (must pass)

* Cart in US/CA shows the correct flat price.

* Changing address from US ↔ CA swaps available options.

---

# **Task 7 — (Upgrade) Live rates via CJ**

Cursor Agent Action

* Switch canCalculate() → true.

* Implement calculatePrice(cart, data):

  * Build CJ rate payload from destination \+ weights \+ chosen cjServiceCode (see [CJ Logistics API](https://developers.cjdropshipping.com/en/api/api2/api/logistic.html)).

  * Call cjClient.getRates().

  * Return price in minor units (cents).

  * Add timeout \+ fallback: if CJ is down, use static price and tag the rate with data.fallback=true.

Test (must pass)

* Normal case: rate appears from CJ and differs from your static number.

* Simulated CJ outage: fallback price is used; UX still works.

External rate calls must not block checkout; timeouts/fallbacks are recommended.  
---

# **Task 8 — Product → CJ SKU mapping**

User Action

* For each Medusa variant, copy the CJ SKU/Variant and add to product metadata (e.g., product.metadata.cjSku / variant.metadata.cjVariantId).

Cursor Agent Action

* Write a helper /medusa-backend/src/utils/cj-mapping.ts that, given a Medusa line item, returns { cjSku, cjVariantId }.

Test (must pass)

* For 2–3 sample variants, the helper returns expected CJ IDs.

---

# **Task 9 — Create orders at CJ**

Cursor Agent Action

* Implement createFulfillment(order, items) in the provider:

  * Map each item via cj-mapping.

  * Build CJ order payload with recipient \+ phone \+ email \+ address \+ cjServiceCode (see [CJ Shopping/Orders API](https://developers.cjdropshipping.com/en/api/api2/api/shopping.html)).

  * const { cjOrderId, tracking } \= await cjClient.createOrder(payload)

  * Return Medusa fulfillment with { data: { cjOrderId, tracking } }.

Test (must pass)

* In a sandbox/test mode, log the payload (no secrets). Validate addresses/lines precisely.

* If CJ provides a test endpoint, verify 201 and a CJ order ID.

* On failure, provider throws a typed error; admin sees a clean message.

---

# **Task 10 — Tracking sync (webhooks or polling)**

Cursor Agent Action

* Add endpoints under /medusa-backend/src/api/webhooks/cj/:

  * POST /webhooks/cj/order-updated

  * Validate signature with CJ\_WEBHOOK\_SECRET using HMAC verification as per [CJ Webhook API](https://developers.cjdropshipping.com/en/api/api2/api/webhook.html).

  * Update fulfillment status and store tracking\_numbers on the Fulfillment.

* If CJ lacks webhooks, add a cron/poller script calling cjClient.getTracking() (see [CJ Logistics API](https://developers.cjdropshipping.com/en/api/api2/api/logistic.html) for tracking endpoints).

User Action

* In CJ, set the webhook URL(s) and secret.

Test (must pass)

* Send a signed test webhook request (via Postman) → order updates in Medusa.

* Polling mode: a known cjOrderId returns a tracking number and updates the record.

---

# **Task 11 — Admin & storefront UX**

Cursor Agent Action

* Admin: show cjOrderId, current CJ status, tracking link in the order detail.

* Storefront (Next.js): surface ETA and carrier on Order Details page; show “fallback rate used” banner if applicable.

Test (must pass)

* Place a test order → view order details, see status and tracking visible.

---

# **Task 12 — QA matrix (must all pass)**

* US address, US Standard → correct rate, order created, tracking flows in.

* US address, US Expedited → correct rate, different price/ETA.

* Canada address, CA Standard → correct rate, order created, tracking flows in.

* CJ outage → checkout still works with fallback rate; order creation waits/retries gracefully.

* Bad SKU mapping → clear admin error with SKU displayed; no silent failures.

* Refund/Cancel (if supported) → verify CJ behavior and Medusa reconciliation.

---

# **Task 13 — Launch checklist**

User Action

* Choose real shipping tiers and ETAs to display (marketing copy).

* Order samples of top 3 products to confirm quality & real transit times.

Cursor Agent Action

* Enable logging/alerts (n8n/Telegram/Discord) on:

  * Rate failures

  * Order creation failures

  * Webhook signature mismatch

Test (must pass)

* Dry run: simulate one order per tier to confirm all notifications fire and all flows complete.

---

## **What you’ll have at the end**

* A CJ Fulfillment Provider (cj-dropshipping) exposing US/CA shipping options at checkout, returning live or fallback rates, creating CJ orders, and syncing tracking back into Medusa—all with timeouts, retries, and logging.

* Clear separation of User vs Agent responsibilities, and a test gate after every step so you never ship half-baked logic.

If you want, I can now generate:

* the starter code files (cj-fulfillment.ts, cj-client.ts, cj-shipping.ts, webhook handler),

* plus a /docs/runbook.md your team can follow during go-live.
