// DealEval Pro - Background Service Worker
// - Fetches the remote scrape-config from the DealEval server on startup
// - Opens listing-site tabs requested by the DealEval web app
// - Injects the generic scraper-engine with the per-site config
// - Detects bot challenges using config-driven rules
// - Merges and forwards results to the DealEval app via the bridge tab

const CONFIG_CACHE_KEY = 'dealeval_scrape_config';
const CONFIG_URL_KEY = 'dealeval_config_url';
const DEFAULT_CONFIG_URL = 'https://dealeval.projexlight.com/api/extension-config/scrape-config';
const CONFIG_REFRESH_MS = 15 * 60 * 1000; // 15 min

// ===== Config management =====

async function getConfigUrl() {
  const { [CONFIG_URL_KEY]: url } = await chrome.storage.local.get(CONFIG_URL_KEY);
  return url || DEFAULT_CONFIG_URL;
}

async function fetchConfig() {
  const url = await getConfigUrl();
  try {
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const config = await r.json();
    await chrome.storage.local.set({ [CONFIG_CACHE_KEY]: { config, at: Date.now() } });
    console.log('DealEval Pro: Fetched scrape-config v' + config.version + ' from', url);
    return config;
  } catch (err) {
    console.warn('DealEval Pro: Config fetch failed —', err.message);
    const { [CONFIG_CACHE_KEY]: cached } = await chrome.storage.local.get(CONFIG_CACHE_KEY);
    return cached ? cached.config : null;
  }
}

async function getConfig() {
  const { [CONFIG_CACHE_KEY]: cached } = await chrome.storage.local.get(CONFIG_CACHE_KEY);
  if (cached && Date.now() - cached.at < CONFIG_REFRESH_MS) return cached.config;
  return await fetchConfig();
}

function matchSiteConfig(config, url) {
  if (!config || !config.sites) return null;
  for (const [key, site] of Object.entries(config.sites)) {
    for (const pattern of site.match || []) {
      const regex = new RegExp('^' + pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$');
      if (regex.test(url)) return { key, site };
    }
  }
  return null;
}

// ===== Bot challenge detection (config-driven) =====

// Runs inside the target page (via executeScript) — must be self-contained.
// Legitimate pages often load reCAPTCHA iframes defensively for newsletter
// forms, login dialogs, etc. Treat iframe/body indicators as a block only
// when the rendered body is short enough to plausibly be a challenge page.
function detectChallenge(detectors) {
  const title = (document.title || '').toLowerCase();
  const body = (document.body ? document.body.innerText || '' : '').toLowerCase();
  const bodyShort = body.length < 2000;
  for (const d of detectors || []) {
    try {
      const requireShort = d.requireShortBody !== false; // default true
      if (d.type === 'iframe_src_contains') {
        if (!document.querySelector(`iframe[src*="${d.value}"]`)) continue;
        if (requireShort && !bodyShort) continue;
        return { blocked: true, reason: d.type, value: d.value };
      } else if (d.type === 'selector_exists') {
        if (!document.querySelector(d.value)) continue;
        // Challenge page selectors (e.g. Cloudflare #challenge-form) are
        // specific enough to trust without a body-length guard by default.
        return { blocked: true, reason: d.type, value: d.value };
      } else if (d.type === 'title_contains') {
        if (title.indexOf(d.value) !== -1) return { blocked: true, reason: d.type, value: d.value };
      } else if (d.type === 'body_contains') {
        if (body.indexOf(d.value) !== -1 && (!requireShort || bodyShort)) return { blocked: true, reason: d.type, value: d.value };
      }
    } catch (e) {}
  }
  return { blocked: false };
}

async function checkTabBlocked(tabId, detectors) {
  try {
    const r = await chrome.scripting.executeScript({ target: { tabId }, func: detectChallenge, args: [detectors] });
    return r[0]?.result || { blocked: false };
  } catch (e) {
    return { blocked: false };
  }
}

// ===== Scraper engine (config-driven) — inline to avoid dynamic import =====

function runScraperInline(siteConfig) {
  // This is a duplicate of scraper-engine.js's runScraper(), inlined here
  // because chrome.scripting.executeScript({ func }) does not support
  // importing from other files in the extension. Kept in sync with lib.
  const results = [];
  const seenAddrs = new Set();
  function compileRegex(src, flags) { try { return new RegExp(src, flags || 'i'); } catch (e) { return null; } }
  function parseValue(raw, parseKind, multiplierRaw) {
    if (raw == null) return null;
    switch (parseKind) {
      case 'int': return parseInt(String(raw).replace(/,/g, ''), 10);
      case 'float': return parseFloat(String(raw));
      case 'number_strip_commas': { const n = parseFloat(String(raw).replace(/,/g, '')); return Number.isFinite(n) ? n : null; }
      case 'abbreviated': { const n = parseFloat(String(raw)); if (!Number.isFinite(n)) return null; if (!multiplierRaw) return n; const m = String(multiplierRaw).toUpperCase(); return m === 'M' ? n * 1e6 : m === 'K' ? n * 1e3 : n; }
      case 'abbreviated_or_comma': { const cleaned = String(raw).replace(/,/g, ''); const n = parseFloat(cleaned); if (!Number.isFinite(n)) return null; if (!multiplierRaw) return n; const m = String(multiplierRaw).toUpperCase(); return m === 'M' ? n * 1e6 : m === 'K' ? n * 1e3 : n; }
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
      let els; try { els = container.querySelectorAll(sel); } catch (e) { continue; }
      for (const el of els) {
        let val;
        if (spec.attribute) {
          val = el.getAttribute(spec.attribute) || '';
          if (spec.absolute && val && !/^https?:/i.test(val)) { const prefix = typeof spec.absolute === 'string' ? spec.absolute : window.location.origin; val = prefix + val; }
        } else { val = (el.textContent || '').trim(); }
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
    if (spec.attribute && !spec.selectors) { const v = container.getAttribute && container.getAttribute(spec.attribute); return v || null; }
    let scopedEl = container;
    if (spec.within) { try { scopedEl = container.querySelector(spec.within) || container; } catch (e) { scopedEl = container; } }
    const scopedText = scopedEl === container ? cardText : (scopedEl.textContent || '').trim();
    if (spec.selectors) { const v = extractBySelectors(scopedEl, spec); if (v != null) return v; }
    if (spec.regex || spec.tryInOrder) {
      const v = extractByRegex(scopedText, spec);
      if (v != null) {
        if (spec.parts) {
          const re = compileRegex(spec.regex, spec.flags);
          const m = scopedText.match(re);
          if (m) { const out = {}; for (const [part, gIdx] of Object.entries(spec.parts)) out[part] = m[gIdx] ? m[gIdx].trim() : null; return out; }
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
  const hostname = window.location.hostname;
  const cardsEl = siteConfig.listingCardSelector ? document.querySelectorAll(siteConfig.listingCardSelector) : [];
  const selfMode = siteConfig.containerMode === 'self';
  cardsEl.forEach((el, idx) => {
    try {
      const container = selfMode ? el : findContainer(el, siteConfig.containerClimb || 5, siteConfig.containerMaxTextLength);
      if (!container) return;
      const cardText = (container.textContent || '').trim();
      if (!selfMode && cardText.length > (siteConfig.containerMaxTextLength || 1500)) return;
      const listing = { id: `${hostname}-${idx}-${Date.now()}`, source: hostname, property_type: siteConfig.propertyType || null };
      if (!selfMode && el.href) listing.source_url = el.href;
      const fields = siteConfig.fields || {};
      for (const [name, spec] of Object.entries(fields)) {
        const val = extractField(container, name, spec, cardText);
        if (val == null) continue;
        if (val && typeof val === 'object' && !Array.isArray(val)) Object.assign(listing, val); else listing[name] = val;
      }
      if (listing.propertyTypeFromAttr) { listing.property_type = listing.propertyTypeFromAttr; delete listing.propertyTypeFromAttr; }
      const addrKey = (listing.address || '').toLowerCase().trim();
      if (!addrKey || addrKey.length < 4) return;
      if (seenAddrs.has(addrKey)) return;
      seenAddrs.add(addrKey);
      results.push(listing);
    } catch (e) {}
  });
  return results;
}

async function scrapeTab(tabId, siteConfig) {
  try {
    const r = await chrome.scripting.executeScript({ target: { tabId }, func: runScraperInline, args: [siteConfig] });
    return r[0]?.result || [];
  } catch (e) {
    console.error('DealEval Pro: scrape failed', e);
    return [];
  }
}

// ===== Result forwarding =====

async function forwardResults(results, source) {
  const { siteSearchResults: existing = [] } = await chrome.storage.local.get('siteSearchResults');
  const byAddr = new Map();
  existing.forEach((r, i) => { if (r.address) byAddr.set(r.address.toLowerCase().trim(), i); });
  const merged = [...existing];
  for (const r of results) {
    const key = (r.address || '').toLowerCase().trim();
    if (!key || key.length < 4) continue;
    const existingIdx = byAddr.get(key);
    if (existingIdx !== undefined) {
      if (r.price > 0 && !(merged[existingIdx].price > 0)) merged[existingIdx] = r;
    } else {
      byAddr.set(key, merged.length);
      merged.push(r);
    }
  }
  await chrome.storage.local.set({ siteSearchResults: merged });
  chrome.action.setBadgeText({ text: String(merged.length) });
  chrome.action.setBadgeBackgroundColor({ color: '#10b981' });

  const patterns = ['http://localhost:*/*', 'https://*.projexlight.com/*', 'https://*.dealeval.com/*'];
  for (const pattern of patterns) {
    const tabs = await chrome.tabs.query({ url: pattern });
    for (const t of tabs) chrome.tabs.sendMessage(t.id, { type: 'SITE_SEARCH_RESULTS', data: merged, source }).catch(() => {});
  }
}

async function notifyBlocked(blockedSites) {
  const patterns = ['http://localhost:*/*', 'https://*.projexlight.com/*', 'https://*.dealeval.com/*'];
  for (const pattern of patterns) {
    const tabs = await chrome.tabs.query({ url: pattern });
    for (const t of tabs) chrome.tabs.sendMessage(t.id, { type: 'SITE_SEARCH_BLOCKED', data: blockedSites }).catch(() => {});
  }
}

// ===== Orchestration =====

async function runSiteSearch(urls) {
  const config = await getConfig();
  if (!config) {
    console.error('DealEval Pro: No scrape-config available');
    return;
  }

  // Clear previous results
  await chrome.storage.local.remove('siteSearchResults');
  chrome.action.setBadgeText({ text: '...' });
  chrome.action.setBadgeBackgroundColor({ color: '#f59e0b' });

  // Open all requested tabs
  const openedTabs = [];
  for (const { url, hostname } of urls) {
    try {
      const tab = await chrome.tabs.create({ url, active: false });
      openedTabs.push({ tabId: tab.id, url, hostname });
    } catch (e) {
      console.warn('DealEval Pro: Could not open tab for', url, e.message);
    }
  }

  // Wait for pages to load, then attempt scraping. Retry once for slow SPAs.
  const waits = config.waitMs || { initial: 10000, retry: 8000 };
  for (const delay of [waits.initial, waits.retry]) {
    await new Promise(r => setTimeout(r, delay));
    const blockedSites = [];
    for (const t of openedTabs) {
      const matched = matchSiteConfig(config, t.url);
      if (!matched) continue;
      const block = await checkTabBlocked(t.tabId, (config.botChallenge && config.botChallenge.detectors) || []);
      if (block.blocked) {
        blockedSites.push({ hostname: t.hostname, reason: block.reason, value: block.value, message: 'Bot challenge detected: ' + block.reason });
        if (/captcha|challenge/i.test(block.reason)) chrome.tabs.update(t.tabId, { active: true }).catch(() => {});
        continue;
      }
      const data = await scrapeTab(t.tabId, matched.site);
      if (data && data.length) await forwardResults(data, t.hostname);
    }
    if (blockedSites.length) await notifyBlocked(blockedSites);
    const { siteSearchResults: cur = [] } = await chrome.storage.local.get('siteSearchResults');
    if (cur.length) break;
  }
}

// ===== Message routing =====

// Messages from DealEval bridge tab
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'START_SITE_SEARCH') {
    runSiteSearch(msg.urls || []);
    sendResponse({ ok: true });
    return true;
  }
  if (msg.type === 'GET_CONFIG') {
    getConfig().then(c => sendResponse({ config: c })).catch(() => sendResponse({ config: null }));
    return true;
  }
  if (msg.type === 'REFRESH_CONFIG') {
    fetchConfig().then(c => sendResponse({ config: c })).catch(() => sendResponse({ config: null }));
    return true;
  }
});

// Prefetch config on install/startup
chrome.runtime.onInstalled.addListener(() => { fetchConfig(); });
chrome.runtime.onStartup.addListener(() => { fetchConfig(); });
