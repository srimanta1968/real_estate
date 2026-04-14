// DealEval Pro - Scraper Engine
// Generic interpreter of a site-config object. Runs inside a target page
// (injected via chrome.scripting.executeScript) and returns listings.
// The config shape is documented in server/config/scrape-config.json.
//
// IMPORTANT: This function runs in an isolated page context. It must NOT
// reference anything outside its own body (no imports, no shared vars).
// The entire config is serialized and passed in as an argument.
//
// Returns: Array of listing objects with fields per the config.

function runScraper(siteConfig) {
  const results = [];
  const seenAddrs = new Set();

  function compileRegex(src, flags) {
    try { return new RegExp(src, flags || 'i'); } catch (e) { return null; }
  }

  function parseValue(raw, parseKind, multiplierRaw) {
    if (raw == null) return null;
    switch (parseKind) {
      case 'int': return parseInt(String(raw).replace(/,/g, ''), 10);
      case 'float': return parseFloat(String(raw));
      case 'number_strip_commas': {
        const n = parseFloat(String(raw).replace(/,/g, ''));
        return Number.isFinite(n) ? n : null;
      }
      case 'abbreviated': {
        const n = parseFloat(String(raw));
        if (!Number.isFinite(n)) return null;
        if (!multiplierRaw) return n;
        const m = String(multiplierRaw).toUpperCase();
        return m === 'M' ? n * 1e6 : m === 'K' ? n * 1e3 : n;
      }
      case 'abbreviated_or_comma': {
        const cleaned = String(raw).replace(/,/g, '');
        const n = parseFloat(cleaned);
        if (!Number.isFinite(n)) return null;
        if (!multiplierRaw) return n;
        const m = String(multiplierRaw).toUpperCase();
        return m === 'M' ? n * 1e6 : m === 'K' ? n * 1e3 : n;
      }
      default: return raw;
    }
  }

  function extractByRegex(text, spec) {
    if (!text || !spec) return null;
    const variants = spec.tryInOrder || [spec];
    for (const v of variants) {
      if (!v.regex) continue;
      const re = compileRegex(v.regex, v.flags);
      if (!re) continue;
      const m = text.match(re);
      if (!m) continue;
      const rawGroup = v.group != null ? m[v.group] : m[1];
      const multGroup = v.multiplierGroup != null ? m[v.multiplierGroup] : null;
      const val = parseValue(rawGroup, v.parse, multGroup);
      if (val == null) continue;
      if (spec.min != null && val < spec.min) continue;
      if (spec.max != null && val > spec.max) continue;
      return val;
    }
    return null;
  }

  function extractBySelectors(container, spec) {
    if (!container || !spec.selectors) return null;
    for (const sel of spec.selectors) {
      let els;
      try { els = container.querySelectorAll(sel); } catch (e) { continue; }
      for (const el of els) {
        let val;
        if (spec.attribute) {
          val = el.getAttribute(spec.attribute) || '';
          if (spec.absolute && val && !/^https?:/i.test(val)) {
            const prefix = typeof spec.absolute === 'string' ? spec.absolute : window.location.origin;
            val = prefix + val;
          }
        } else {
          val = (el.textContent || '').trim();
        }
        if (!val) continue;
        if (spec.excludeContains && val.indexOf(spec.excludeContains) !== -1) continue;
        if (spec.minLength && val.length < spec.minLength) continue;
        if (spec.maxLength && val.length > spec.maxLength) continue;
        return val;
      }
    }
    return null;
  }

  function extractField(container, fieldName, spec, cardText) {
    // 1) Direct attribute on the container (e.g. GTM data-attrs)
    if (spec.attribute && !spec.selectors) {
      const v = container.getAttribute && container.getAttribute(spec.attribute);
      return v || null;
    }

    // 2) Scope text to a nested element if "within" is specified
    let scopedEl = container;
    if (spec.within) {
      try { scopedEl = container.querySelector(spec.within) || container; } catch (e) { scopedEl = container; }
    }
    const scopedText = scopedEl === container ? cardText : (scopedEl.textContent || '').trim();

    // 3) Selector-based extraction (picks the first matching element)
    if (spec.selectors) {
      const v = extractBySelectors(scopedEl, spec);
      if (v != null) return v;
    }

    // 4) Regex over the scoped text
    if (spec.regex || spec.tryInOrder) {
      const v = extractByRegex(scopedText, spec);
      if (v != null) {
        // Multi-part regex (e.g. city/state/zip in one match)
        if (spec.parts) {
          const re = compileRegex(spec.regex, spec.flags);
          const m = scopedText.match(re);
          if (m) {
            const out = {};
            for (const [part, gIdx] of Object.entries(spec.parts)) out[part] = m[gIdx] ? m[gIdx].trim() : null;
            return out;
          }
        }
        return v;
      }
    }
    return null;
  }

  function findContainer(link, climb, maxTextLen) {
    let container = link;
    for (let i = 0; i < (climb || 5); i++) {
      if (container && container.parentElement) container = container.parentElement; else break;
      const t = (container.textContent || '').length;
      if (t > 50 && t < (maxTextLen || 1500)) return container;
    }
    return container;
  }

  // --- MAIN ---
  const hostname = window.location.hostname;
  const cardsEl = siteConfig.listingCardSelector ? document.querySelectorAll(siteConfig.listingCardSelector) : [];
  const selfMode = siteConfig.containerMode === 'self';

  cardsEl.forEach((el, idx) => {
    try {
      const container = selfMode ? el : findContainer(el, siteConfig.containerClimb || 5, siteConfig.containerMaxTextLength);
      if (!container) return;
      const cardText = (container.textContent || '').trim();
      if (!selfMode && cardText.length > (siteConfig.containerMaxTextLength || 1500)) return;

      const listing = {
        id: `${hostname}-${idx}-${Date.now()}`,
        source: hostname,
        property_type: siteConfig.propertyType || null,
      };
      if (!selfMode && el.href) listing.source_url = el.href;

      const fields = siteConfig.fields || {};
      for (const [name, spec] of Object.entries(fields)) {
        const val = extractField(container, name, spec, cardText);
        if (val == null) continue;
        // Multi-part object (e.g. location → { city, state, zip })
        if (val && typeof val === 'object' && !Array.isArray(val)) {
          Object.assign(listing, val);
        } else {
          listing[name] = val;
        }
      }

      if (listing.propertyTypeFromAttr) {
        listing.property_type = listing.propertyTypeFromAttr;
        delete listing.propertyTypeFromAttr;
      }

      const addrKey = (listing.address || '').toLowerCase().trim();
      if (!addrKey || addrKey.length < 4) return;
      if (seenAddrs.has(addrKey)) return;
      seenAddrs.add(addrKey);

      results.push(listing);
    } catch (e) {
      // Swallow per-card errors, keep scraping the rest
    }
  });

  return results;
}

// Expose for the service worker to inject via executeScript
if (typeof self !== 'undefined') self.DealEvalScraperEngine = { runScraper };
