# User Guide – Nick a Deal AI Admin

Welcome to the **Nick a Deal AI Admin** user guide. This document explains how to use all features of the application to manage products, suppliers, and sync with your Medusa store.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard](#dashboard)
3. [Imports](#imports)
4. [Drafts Management](#drafts-management)
5. [Suppliers](#suppliers)
6. [Research Console](#research-console)
7. [Token Management](#token-management)
8. [Monitoring](#monitoring)
9. [Settings](#settings)
10. [Publishing to Medusa](#publishing-to-medusa)

---

## Getting Started

### First-Time Setup

1. **Log In / Register**
   - Navigate to the login page
   - Register a new account or log in with existing credentials
   - First user is automatically assigned the `owner` role

2. **Configure Settings** (Owner only)
   - Go to **Settings** → Connect your Medusa store:
     - Medusa Admin URL (e.g., `https://your-store.com`)
     - Medusa Admin Token
   - Configure global preferences (currency, default margin, locale)

3. **Add API Tokens**
   - Go to **Tokens** → Add tokens for:
     - OpenAI (for AI enrichment)
     - Google Gemini (optional, alternative AI provider)
     - Medusa (if using token-based auth)
   - Tokens are encrypted and stored securely

4. **Create Suppliers**
   - Go to **Suppliers** → Add your first supplier
   - Fill in contact information and ratings (optional)

---

## Dashboard

The dashboard provides an overview of your product catalog status:

- **Drafts ready**: Products ready to publish
- **Average margin**: Average margin across all products
- **Sync status**: Latest Medusa sync job status
- **Token usage**: Recent API token usage

---

## Imports

Import products from CSV files, Excel files, or product URLs.

### CSV/Excel Import

1. Navigate to **Imports**
2. Select the **CSV/Excel** tab
3. Upload your file or paste a URL (supports Google Sheets public URLs)
4. The system will detect columns and **automatically suggest mappings** based on column names
5. Review and adjust column mappings using the dropdown menus
6. Click **Import** to create drafts

**💡 Tip**: For best auto-mapping results, use recommended column names. See the [Import Column Mapping Guide](../reference/import-column-guide.md) for a complete list of recommended column names and example tables.

### URL Import

1. Select the **URL** tab
2. Paste product URLs (one per line)
3. Click **Fetch Products**
4. Review fetched data and adjust as needed
5. Click **Import** to create drafts

### Medusa Sync

1. Select the **Sync from Medusa** tab
2. Choose entity type:
   - Products
   - Categories
   - Collections
   - Product Types
   - Tags
   - Sales Channels
3. Click **Start Sync**
4. Monitor progress in the **Monitoring** page

---

## Drafts Management

### Viewing Drafts

- Navigate to **Drafts** to see all product drafts
- Filter by:
  - Status (draft, enriched, ready, published, archived)
  - Supplier
  - Date range
- Click on any draft to edit

### Editing a Draft

1. Open a draft from the list
2. **Basic Information**:
   - Title (English/French)
   - Description (English/French)
   - Supplier
   - Status
3. **Specifications**:
   - Product Type (from Medusa)
   - Collection (from Medusa)
   - Categories (from Medusa)
   - Custom specs (weight, dimensions, material, etc.)
   - Tags
4. **Pricing**:
   - Cost (supplier price)
   - Margin percentage
   - Selling price (auto-calculated)
5. **Images**:
   - Upload images via drag-and-drop
   - Or paste image URLs
   - Set alt text (bilingual)
6. **SEO**:
   - Meta title
   - Meta description

### AI Enrichment

Use AI to automatically fill product information:

- **AI Fill All**: Enriches title, description, specs, SEO in one click
- **Individual Fields**: Click AI button next to any field to enrich that specific field
- AI will generate bilingual content (English/French) where applicable

### Saving

- Click **Save** to update the draft
- Status changes:
  - **Draft**: Initial state
  - **Enriched**: After AI enrichment
  - **Ready**: Ready to publish
  - **Published**: Already published to Medusa

---

## Suppliers

### Managing Suppliers

1. **View All Suppliers**: Navigate to **Suppliers**
2. **Add Supplier**:
   - Click **Add Supplier**
   - Fill in name, contact info, website, notes
   - Set ratings (quality, speed, price, support)
3. **Edit Supplier**: Click on supplier to edit details
4. **Delete Supplier**: Click delete (only if no products reference it)

### Supplier Ratings

Rate suppliers on:
- **Quality**: Product quality (1-5)
- **Speed**: Shipping speed (1-5)
- **Price**: Competitive pricing (1-5)
- **Support**: Customer support (1-5)

Average rating is calculated automatically.

---

## Research Console

The AI Research Console helps you discover trends, find suppliers, and research competitor products.

### Trends Analysis

1. Go to **Research** → **Trends Analysis** tab
2. Enter product category or keywords (e.g., "wireless headphones")
3. Click **Analyze Trends**
4. Results include:
   - Trending keywords
   - Suggested tags for SEO
   - Market insights

### Supplier Finder

1. Go to **Research** → **Supplier Finder** tab
2. Enter search criteria (e.g., "suppliers in Canada, fast shipping, electronics")
3. Click **Find Suppliers**
4. View AI-matched suppliers with match scores and reasoning
5. Click **View** to open supplier details

### Product Research

1. Go to **Research** → **Product Research** tab
2. Paste competitor product information (description, specs, pricing, features)
3. Click **Research Product**
4. AI extracts:
   - Title and description
   - Specifications
   - Estimated price
   - Features list
   - Tags
5. Click **Create Draft** to convert research into a product draft

---

## Token Management

### Managing API Tokens

1. Navigate to **Tokens**
2. **Add Token**:
   - Provider: OpenAI, Gemini, or Medusa
   - Token Value: Paste your API key/token
   - Expiry Date: Optional
   - Click **Create**
3. **View Tokens**:
   - See all tokens with masked values
   - Active/inactive status
   - Expiry dates
4. **Toggle Active**: Click toggle to activate/deactivate tokens
5. **Delete**: Soft delete (sets active=false)

### Token Usage Logs

1. Go to **Tokens** → **Usage** tab
2. View usage history:
   - Provider (OpenAI, Gemini, Medusa)
   - Process name (e.g., "ai_enrich", "research_trends")
   - Timestamp
   - Record count
3. Filter by:
   - Provider
   - Date range

---

## Monitoring

### Sync Jobs

1. Navigate to **Monitoring** → **Sync Jobs** tab
2. View all Medusa sync operations:
   - Entity type
   - Operation (fetch, create, update, delete)
   - Status (queued, running, done, error)
   - Record count
   - Timestamps
3. Filter by entity type and status

### Price Alerts

1. Go to **Monitoring** → **Price Alerts** tab
2. View price monitoring results:
   - Product name
   - Cost vs. Selling price
   - Margin percentage
   - Delta from target margin
   - Alert indicators (red for violations)
3. Click **Run Price Check** to manually trigger monitoring
4. Alerts highlight products with:
   - Margin below minimum threshold
   - Delta > 10% from target

---

## Settings

### Medusa Connection (Owner only)

1. Navigate to **Settings**
2. **Medusa Store Connection**:
   - Medusa Admin URL: Your Medusa store URL
   - Medusa Admin Token: Your admin API token
3. Click **Save Settings**

### Price Rules (Owner only)

1. Go to **Settings** → Click **Manage Price Rules**
2. **Add Price Rule**:
   - Rule Name
   - Target Margin (%)
   - Min Margin (%) - Optional
   - Rounding Rule (.99, .95, none)
   - Currency Preference (CAD, USD, AUTO)
   - Active status
3. Price rules are used by monitoring jobs to validate margins

### Global Preferences (Owner only)

- **FX Base Currency**: CAD, USD, or AUTO
- **Default Margin %**: Default margin for price calculations
- **Default Locale**: English or French

---

## Publishing to Medusa

### From Draft Page

1. Edit a draft and ensure it's complete:
   - Title and description
   - Price (cost and selling price)
   - Product type, collection, categories
   - Images
2. Click **Publish to Medusa**
3. The system will:
   - Create product in Medusa
   - Create variants (if defined)
   - Link categories and collections
   - Upload images
   - Update draft status to "published"
4. View sync status in **Monitoring**

### Bulk Publishing

- Currently, publish one product at a time
- Future: Bulk publish multiple drafts

---

## Tips & Best Practices

### Product Workflow

1. **Import** products from CSV/URL or sync from Medusa
2. **Review** drafts and use AI enrichment to fill gaps
3. **Edit** manually to refine content
4. **Publish** to Medusa when ready

### AI Enrichment

- Use AI enrichment early in the draft lifecycle
- Review and refine AI-generated content
- AI generates bilingual content (EN/FR) simultaneously

### Price Monitoring

- Set up price rules for automatic margin validation
- Run price checks regularly to catch violations
- Adjust selling prices based on alerts

### Token Management

- Rotate tokens regularly
- Monitor usage logs to track costs
- Keep backup tokens for failover

---

## Troubleshooting

### Cannot Publish to Medusa

- Check Medusa connection in Settings
- Verify Medusa Admin Token is valid
- Check network connectivity to Medusa store

### AI Enrichment Not Working

- Verify OpenAI or Gemini token is active
- Check token usage logs for errors
- Ensure token has sufficient credits

### Sync Jobs Failing

- Verify Medusa connection settings
- Check Medusa Admin Token permissions
- Review error messages in Monitoring page

### Images Not Uploading

- Check file size limits
- Verify image URLs are accessible
- Ensure S3 credentials are configured (if using S3 storage)

---

## Support

For additional help:
- Review the [Developer Guide](./developer-guide.md) for technical details
- Check [Contributor Guide](./contributor-guide.md) for development workflows
- Contact the project owner for account/permission issues

---

**Last Updated**: After Step 14 completion (Research Console)

