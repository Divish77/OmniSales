const https = require('https');
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJubWZobXNpZHFmcWhrdmNhcXBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4NzQyMzMsImV4cCI6MjA4ODQ1MDIzM30.S9y-jDPaW0QNneKpCxNh3ce4terJQ54njvGms7i52LY';
const SUPABASE = 'bnmfhmsidqfqhkvcaqpp.supabase.co';

function post(path, body) {
  return new Promise((resolve, reject) => {
    const b = JSON.stringify(body);
    const req = https.request({
      hostname: SUPABASE, path, method: 'POST',
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(b) }
    }, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => resolve({ s: res.statusCode, b: d.substring(0, 200) })); });
    req.on('error', reject); req.write(b); req.end();
  });
}

const rpcs = [
  ['get_forecasts_v2',        {}],
  ['get_dynamic_ml_insights', {}],
  ['get_basket_analysis',     {}],
  ['get_loyalty_signals',     {}],
  ['get_channel_kpis',        {}],
  ['get_ai_insights_v2',      {}],
  ['get_repeat_products',     {}],
  ['get_ai_recommendations',  {}],
  ['get_strategic_briefing',  {}],
  ['get_analytics_insights',  {}],
  ['get_sales_kpis',          {}],
  ['get_mom_growth',          {}],
  ['get_top_regions',         {}],
  ['get_channel_trend',       {}],
];

(async () => {
  for (const [fn, params] of rpcs) {
    const r = await post(`/rest/v1/rpc/${fn}`, params);
    const status = r.s === 200 ? '✅' : r.s === 404 ? '❌ NOT FOUND' : `⚠️  ${r.s}`;
    console.log(`${status}  ${fn}  →  ${r.b.substring(0, 120)}`);
  }
})();
