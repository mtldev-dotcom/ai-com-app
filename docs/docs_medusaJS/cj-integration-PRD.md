# **0\) What you’re building (mental model)**

* A Medusa service (e.g., medusa-backend/src/services/cj-fulfillment.ts) that extends AbstractFulfillmentService and implements:

  * getFulfillmentOptions → show CJ shipping tiers at checkout

  * validateFulfillmentData → store CJ refs/order IDs for later

  * calculatePrice → (optional) call CJ for live shipping rates

  * createFulfillment → place the order at CJ and capture a CJ order ID

  * plus webhooks/polling to pull back tracking + status

     These are the exact building blocks Medusa expects.   

---

# **1\) CJ side — authorize & get API access (mobile → web)**

Your screenshot shows Store Authorization options (Shopify/Woo/eBay) and an “Others” section with CJ API. Medusa isn’t a listed platform, so you’ll authorize via CJ API:

Tasks

1. Log in to CJ Dashboard (use desktop web if mobile blocks it).

2. Go to Store Authorization → Others → CJ API (or "Developers/API"). See [CJ Developers API Introduction](https://developers.cjdropshipping.com/en/api/introduction.html).

3. Create an API App (or "Authorize" a custom store):

   * App/Store name: Nick-a-Deal (Medusa)

   * Generate API Key (no secret). Use it with your account email to obtain an accessToken via [CJ Authentication API](https://developers.cjdropshipping.com/en/api/api2/api/auth.html). Access tokens expire in 15 days; refresh tokens last 180 days.

   * Set Callback/Webhook URLs (we’ll create them in step 6).

   * If CJ requires, whitelist your server’s IP/domain.

4. Note any CJ environment base URLs and scope/permissions required for:

   * Product/variant lookup

   * Shipping/rate quote (if available)

   * Order create / cancel / refund

   * Tracking retrieval

5. Create a CJ “Store/Shop” object if required by their API (some APIs need a store binding first).

You’ll use these credentials to call CJ from your Medusa service. Medusa has no native app for CJ—this API path is the intended route.   
---

# **2\) Medusa project — config & env**

Tasks

1. Add env vars (e.g., in .env):

CJ_API_BASE_URL=...  
CJ_API_KEY=...              # used with account email to fetch tokens  
CJ_ACCOUNT_EMAIL=...        # CJ account email for token fetch  
CJ_ACCESS_TOKEN=...         # bearer for API calls (15-day TTL)  
CJ_REFRESH_TOKEN=...        # used to refresh access token (180-day TTL)  
CJ_TIMEOUT_MS=5000          # HTTP client timeout  
CJ_WEBHOOK_SECRET=...       # generate yourself  
CJ_STORE_ID=...             # if CJ requires a store binding

1. 

2. Register your provider in medusa-backend/medusa-config.ts regions so the shipping option is selectable.

---

# **3\) Create the provider service file**

Path: medusa-backend/src/services/cj-fulfillment.ts

Tasks

1. Extend AbstractFulfillmentService and set a static ID, e.g. "cj-dropshipping".

2. In the constructor(container, options), initialize a small CJ client with your credentials.

3. Implement the core methods below (what each must do is defined by Medusa):

   * getFulfillmentOptions() → return displayable options like “US 5–7 Day Standard”, “US 3–4 Day Express” (names map to CJ services you’ll support). 

   * validateFulfillmentData() → attach the CJ references you need later (e.g., selected shipping tier, or pre-created quote IDs). 

   * canCalculate() → true if you’ll call CJ for live rates; otherwise false.

   * calculatePrice() → call [CJ Logistics/Shipping API](https://developers.cjdropshipping.com/en/api/api2/api/logistic.html) for live rates and return the price (fallback with static tables if CJ is down—avoid blocking checkout).   

   * createFulfillment() → build the CJ order payload (recipient, lines, SKU/variant, chosen shipping tier), POST to [CJ Shopping/Orders API](https://developers.cjdropshipping.com/en/api/api2/api/shopping.html), store the CJ Order ID on the fulfillment. 

The doc’s “Implementation Roadmap” lists these same steps and where they live in your code.         
---

# **4\) Product & SKU mapping (two workable models)**

A) Medusa-first catalog (recommended to start)

* Create products in Medusa with your own SKUs; store the linked CJ SKU (and optional variant code) in product metadata.

* At order time, the provider maps Medusa SKUs → CJ SKUs for the API order.

B) CJ-first import

* Build a one-time job to pull listings from CJ and create Medusa products with pricing/images and link metadata.

* Useful if you want to manage the catalog directly from CJ.

Whichever you choose, keep a single source of truth and store the CJ SKU/variant IDs in Medusa metadata for deterministic ordering.  
---

# **5\) Shipping options & rate strategy**

Tasks

1. Decide which CJ shipping services you will expose:

   * Example: "US Standard (5–7d)", "US Expedited (3–4d)", "Canada Standard (7–12d)".

2. Implement live rates (preferred) via calculatePrice() or static tables (fallback).

3. Add graceful timeouts and fallbacks—don’t block checkout if CJ is slow. 

Reality check: CJ’s fastest US delivery only applies if the SKU is stocked in a US warehouse; otherwise times stretch and are inconsistent. Communicate ETAs on PDP/checkout and prefer US-stock SKUs when possible. 
---

# **6\) Webhooks (or polling) for tracking sync**

Tasks

1. Create webhook endpoints in your Medusa server (e.g., medusa-backend/src/api/webhooks/cj/order-updated):

   * Validate signature with CJ_WEBHOOK_SECRET using HMAC verification as per [CJ Webhook API](https://developers.cjdropshipping.com/en/api/api2/api/webhook.html).

   * Update Medusa fulfillment status + tracking numbers.

2. If webhooks aren't available, poll [CJ Logistics API](https://developers.cjdropshipping.com/en/api/api2/api/logistic.html) "order status/track" endpoints on a schedule.

3. Surface tracking in Admin + Storefront.

Incoming updates are part of the blueprint—don’t forget this piece.   
---

# **7\) Region & shipping profile wiring in Medusa**

Tasks

1. In Medusa Admin, ensure the Region used by your store includes "cj-dropshipping" in its fulfillment providers.

2. Ensure products use shipping profiles that route to your provider.

---

# **8\) Error-handling, retries, and observability**

Tasks

1. Wrap all CJ calls with:

   * Timeouts (e.g., 3–5s)

   * Retries (e.g., 2 attempts with backoff)

   * Circuit breaker/fallback to static rates during outage

2. Log request/response (without secrets); tag orders with CJ status for support.

3. Add alerts for order create failures or rate failures (n8n/Discord/Telegram).

External API latency and failures will otherwise hurt checkout conversion.   
---

# **9\) QA plan (use this checklist)**

* ✅ Sandbox orders: create 3 test orders (US Standard, US Expedited, Canada Standard).

* ✅ Verify CJ Order ID is stored on the fulfillment.

* ✅ Confirm rates match CJ.

* ✅ Webhook delivers tracking; Medusa shows tracking on the order.

* ✅ Cancel/Refund flows behave (what’s supported via CJ).

* ✅ PDP/checkout copy shows realistic ETAs (esp. for non-US stock). 
---

# **10\) Go-live rules (North America focus)**

* Prefer US-stock SKUs for 3–7 day delivery; clearly label. 

* For non-US stock, set expectations (10–15+ days).

* Start with 3–5 products, order samples to verify quality + shipping times before launch. 

* Re-evaluate CJ vs a domestic supplier if you need consistent <7-day delivery at scale. 
---

## **Minimal code scaffold (TypeScript)**

// medusa-backend/src/services/cj-fulfillment.ts  
import { AbstractFulfillmentService, Cart, ShippingOption } from "@medusajs/medusa";

type CJClientDeps = { baseUrl: string; accessToken: string };  
class CJClient {  
  constructor(private deps: CJClientDeps) {}  
  async getRates(payload: any) { /* call CJ, return cents */ }  
  async createOrder(payload: any) { /* returns { cjOrderId, tracking? } */ }  
  async getTracking(cjOrderId: string) { /* ... */ }  
}

export default class CJFulfillmentService extends AbstractFulfillmentService {  
  static identifier = "cj-dropshipping";  
  protected cj: CJClient;  
  constructor(container, options) {  
    super(container, options);  
    this.cj = new CJClient({  
      baseUrl: process.env.CJ_API_BASE_URL!,  
      accessToken: process.env.CJ_ACCESS_TOKEN!,  
    });  
  }

  async getFulfillmentOptions(): Promise<ShippingOption[]> {  
    return [  
      { id: "us-standard", name: "US Standard (5–7d)" } as any,  
      { id: "us-expedited", name: "US Expedited (3–4d)" } as any,  
      { id: "ca-standard", name: "Canada Standard (7–12d)" } as any,  
    ];  
  }

  async validateFulfillmentData(_, data: any) {  
    // attach CJ-specific data like selected tier or quote refs  
    return { ...data, provider: CJFulfillmentService.identifier };  
  }

  async canCalculate() { return true; }

  async calculatePrice(_, data) {  
    // build CJ rate payload from cart/address  
    const cents = await this.cj.getRates({ /* cart, destination */ });  
    return cents;  
  }

  async createFulfillment(order, items, fromOrder = false) {  
    const res = await this.cj.createOrder({ order, items });  
    return {  
      id: res.cjOrderId,  
      data: { cjOrderId: res.cjOrderId },  
    } as any;  
  }  
}  
The specific CJ endpoints/fields come from their API docs—plug them into the CJClient methods. The method list and where they fit in Medusa match the blueprint above.     
---

## **Product/price playbook (operational tips)**

* Map each Medusa variant → one CJ SKU; store it in product metadata.

* Prefer SKUs with US warehouse inventory for NA speed. 

* If you must pre-stock CJ’s US warehouses for speed, watch storage fees (they can add up). 
---

## **If you only need “manual first, API later”**

* Launch with manual order placement in CJ (copy order data from Medusa).

* Add the provider later to automate. This de-risks launch while you learn.

---


