# DealEval Pro — Privacy Policy

DealEval Pro (the "Extension") is published by DealEval / Projexlight as a
companion to the DealEval web application.

## What we collect

- **Public listing data** scraped from supported real estate sites
  (Zillow, Realtor.com, Redfin, LoopNet, Crexi, and others declared in
  the remote scrape configuration). Data scraped is limited to fields
  the user has chosen to search for.
- **No personal data** is collected, transmitted, or stored by the
  Extension beyond what the user enters on dealeval.projexlight.com
  (or equivalent DealEval site).

## How we use it

- Listing data is transferred only to the DealEval tab the user has
  open. It is not sent to any third-party analytics or advertising
  service.
- The Extension fetches a JSON configuration file from the DealEval
  server to know how to parse each site. No user data is sent in that
  request.

## Permissions

- **activeTab, tabs, scripting**: required to open listing-site tabs
  and run the scraper.
- **storage**: caches the remote configuration and scraped results.
- **host_permissions on listing sites**: required by Chrome to allow
  the scraper to run on those domains.
- **host_permissions on dealeval.projexlight.com + localhost**:
  required to hand scraped results back to the DealEval web app.

## Contact

For questions, open an issue at https://github.com/srimanta1968/real_estate/issues
