const DEV_URL = 'http://localhost:3000/api/extension-config/scrape-config';
const PROD_URL = 'https://dealeval.projexlight.com/api/extension-config/scrape-config';
const CONFIG_URL_KEY = 'dealeval_config_url';
const CONFIG_CACHE_KEY = 'dealeval_scrape_config';

const $ = (id) => document.getElementById(id);
const status = $('status');
const meta = $('meta');
const input = $('configUrl');

function show(msg, kind) {
  status.style.display = 'block';
  status.className = 'status ' + (kind || 'ok');
  status.textContent = msg;
}

function highlightEnv(url) {
  $('envDev').className = url === DEV_URL ? 'active' : 'inactive';
  $('envProd').className = url === PROD_URL ? 'active' : 'inactive';
}

async function load() {
  const { [CONFIG_URL_KEY]: url, [CONFIG_CACHE_KEY]: cached } = await chrome.storage.local.get([CONFIG_URL_KEY, CONFIG_CACHE_KEY]);
  const current = url || PROD_URL;
  input.value = current;
  highlightEnv(current);
  if (cached && cached.config) {
    const age = Math.round((Date.now() - cached.at) / 1000);
    const siteCount = cached.config.sites ? Object.keys(cached.config.sites).length : 0;
    meta.textContent = `Cached config v${cached.config.version || '?'} — ${siteCount} sites — fetched ${age}s ago`;
  } else {
    meta.textContent = 'No config cached yet. Click Refresh.';
  }
}

async function save() {
  const url = input.value.trim();
  if (!url) return show('URL required', 'err');
  await chrome.storage.local.set({ [CONFIG_URL_KEY]: url });
  highlightEnv(url);
  show('Saved. Click Refresh to fetch from new URL.');
}

async function refresh() {
  show('Fetching...', 'ok');
  const res = await chrome.runtime.sendMessage({ type: 'REFRESH_CONFIG' });
  if (res && res.config) {
    const siteCount = Object.keys(res.config.sites || {}).length;
    show(`OK — loaded config v${res.config.version} with ${siteCount} sites.`, 'ok');
    meta.textContent = `Fetched just now — version ${res.config.version || '?'}`;
  } else {
    show('Fetch failed. Check the URL + server.', 'err');
  }
}

$('envDev').addEventListener('click', () => { input.value = DEV_URL; save(); });
$('envProd').addEventListener('click', () => { input.value = PROD_URL; save(); });
$('saveBtn').addEventListener('click', save);
$('refreshBtn').addEventListener('click', refresh);

load();
