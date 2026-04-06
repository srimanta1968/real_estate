# Privacy Policy for DealEval - Property Data Extractor

**Last Updated:** April 5, 2026

## Overview

DealEval - Property Data Extractor ("the Extension") is a Chrome browser extension that helps real estate professionals extract property data from listing websites for investment analysis. This privacy policy explains what data we collect, how we use it, and your rights.

## Data We Collect

### Property Data (Extracted from Websites)
When you visit a supported real estate listing site (Zillow, Realtor.com, Redfin, LoopNet, Crexi, Trulia, CommercialCafe), the Extension extracts publicly available property information including:
- Property address, city, state, zip code
- Listing price
- Number of bedrooms, bathrooms, square footage
- Year built, lot size
- Property type and listing status
- Cap rate and NOI (commercial properties)

**This data is only extracted when you are actively browsing these sites. The Extension does not extract data in the background or from sites you are not visiting.**

### User Account Data
If you log in to the Extension to connect with the DealEval web application:
- Email address
- Authentication token (stored locally)

No passwords are stored by the Extension. Authentication tokens are stored in your browser's local storage.

## How We Use Data

### Property Data
- Sent to the DealEval web application (running on your local machine or our hosted service) for investment analysis calculations
- Stored temporarily in your browser's local storage for display in the Extension popup
- Never sold to third parties
- Never used for advertising or tracking

### Account Data
- Used solely to authenticate you with the DealEval application
- Used to save your property evaluations and comparison sets

## Data Storage

- **Local Storage:** Property data and authentication tokens are stored in your browser's `chrome.storage.local` and `localStorage`. This data stays on your device.
- **Server Storage:** When you save an evaluation or generate a report, property data is sent to the DealEval server and stored in your account.
- **No Third-Party Analytics:** We do not use Google Analytics, Facebook Pixel, or any third-party tracking services in the Extension.

## Data Sharing

We do **NOT** share your data with any third parties. Property data is only transmitted between:
1. Your browser (the Extension)
2. The DealEval web application (for analysis)

## Permissions Explained

| Permission | Why We Need It |
|-----------|---------------|
| `activeTab` | To extract property data from the currently active listing page |
| `tabs` | To detect when you navigate to a supported real estate site |
| `scripting` | To inject content scripts that read property data from listing pages |
| `storage` | To save your settings and temporarily cache extracted data |
| `notifications` | To notify you when property data has been successfully extracted |

### Host Permissions
We request access to specific real estate listing websites only:
- `realtor.com` - Extract Realtor.com listings
- `zillow.com` - Extract Zillow listings
- `redfin.com` - Extract Redfin listings
- `loopnet.com` - Extract LoopNet commercial listings
- `crexi.com` - Extract Crexi commercial listings
- `trulia.com` - Extract Trulia listings
- `commercialcafe.com` - Extract CommercialCafe listings
- `localhost` - Communicate with locally-running DealEval application

## Your Rights

### Data Access
You can view all data stored by the Extension by:
1. Right-clicking the Extension icon > "Inspect popup" > Application > Storage

### Data Deletion
You can delete all Extension data at any time by:
1. Right-clicking the Extension icon > "Options" > Clear all data
2. Or removing the Extension from Chrome (Settings > Extensions)

### Opt-Out
You can disable the Extension at any time without losing your DealEval account data. Simply disable or remove the Extension from Chrome.

## Children's Privacy

The Extension is not intended for use by children under 13 years of age. We do not knowingly collect data from children.

## Changes to This Policy

We may update this privacy policy from time to time. Changes will be reflected in the "Last Updated" date above. Continued use of the Extension after changes constitutes acceptance of the updated policy.

## Contact

For questions about this privacy policy or to request data deletion:
- Email: support@projexlight.com
- Website: https://projexlight.com

## California Residents (CCPA)

If you are a California resident, you have the right to:
- Know what personal information we collect
- Request deletion of your personal information
- Opt out of the sale of personal information (we do not sell your data)

## European Residents (GDPR)

If you are in the European Economic Area, you have the right to:
- Access your personal data
- Rectify inaccurate data
- Request erasure of your data
- Object to processing of your data
- Data portability
