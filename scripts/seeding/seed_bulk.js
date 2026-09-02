import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bnmfhmsidqfqhkvcaqpp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJubWZobXNpZHFmcWhrdmNhcXBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4NzQyMzMsImV4cCI6MjA4ODQ1MDIzM30.S9y-jDPaW0QNneKpCxNh3ce4terJQ54njvGms7i52LY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const email = 'divishbansal77@gmail.com';
const password = '123456';

const categories = ['Electronics', 'Clothing', 'Furniture', 'Software', 'Accessories', 'Beauty'];
const products = {
  'Electronics': ['Wireless Earbuds', 'Smart Watch', 'Mechanical Keyboard', '4K Monitor', 'Gaming Laptop'],
  'Clothing': ['Winter Jacket', 'Running Shoes', 'Cotton T-Shirt', 'Denim Jeans'],
  'Furniture': ['Ergonomic Chair', 'Standing Desk', 'Bookshelf', 'Sofa'],
  'Software': ['Antivirus Pro', 'Design Master Suite', 'Cloud Storage 1TB'],
  'Accessories': ['Leather Wallet', 'Sunglasses', 'Silver Watch'],
  'Beauty': ['Moisturizing Cream', 'Perfume', 'Hair Dryer']
};
const countriesAndRegions = [
  { c: 'USA', r: ['California', 'New York', 'Texas', 'Florida', 'Illinois'] },
  { c: 'Canada', r: ['Ontario', 'Quebec', 'British Columbia', 'Alberta'] },
  { c: 'UK', r: ['London', 'Scotland', 'Wales', 'Northern Ireland'] },
  { c: 'Germany', r: ['Bavaria', 'Berlin', 'Hesse', 'Saxony'] },
  { c: 'Switzerland', r: ['Zurich', 'Geneva', 'Vaud'] },
  { c: 'Brazil', r: ['Sao Paulo', 'Rio de Janeiro', 'Minas Gerais'] },
  { c: 'Japan', r: ['Tokyo', 'Osaka', 'Kyoto', 'Hokkaido'] }
];
const storeNames = ['Downtown Hub', 'Mall Branch', 'Airport Store', 'Suburban Outlet', 'Mega Center'];

function randomChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

async function run() {
  console.log("Logging in as", email);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) { console.error("Login failed:", error.message); return; }
  console.log("Logged in successfully. User ID:", data.user.id);

  console.log("Generating 7500 dynamic sales records...");
  const onlinePayload = [];
  const storePayload = [];

  const startDate = new Date('2021-01-01');
  const endDate = new Date('2025-12-31');

  for (let i = 0; i < 7500; i++) {
    const isOnline = Math.random() < 0.6; // 60% online, 40% store
    const category = randomChoice(categories);
    let product = randomChoice(products[category]);
    const geo = randomChoice(countriesAndRegions);
    const region = randomChoice(geo.r);
    
    const randomTime = startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime());
    const dateStr = new Date(randomTime).toISOString().split('T')[0];

    // Artificial anomalies and trends for AI to pick up automatically
    let qty = randomInt(1, 10);
    let price = randomInt(10, 500);

    // Hardcode an anomaly!
    if (product === 'Smart Watch' && geo.c === 'Japan' && dateStr.startsWith('2025-11')) {
      qty = 1500; price = 300; 
    }

    // Hardcode a Market Concentration! Monopolized Software in UK
    if (category === 'Software' && geo.c === 'UK') {
      if (Math.random() < 0.90) { // 90% dominance
         product = 'Design Master Suite';
         qty = randomInt(50, 100);
         price = 450;
      }
    }
    
    // Hardcode a MoM High Growth trend! 
    if (product === 'Ergonomic Chair' && region === 'California') {
        if (dateStr.startsWith('2025-05')) { qty = 80; price = 250; }
        if (dateStr.startsWith('2025-06')) { qty = 200; price = 250; } // HUGE SPIKE -> Trend Acceleration
        if (dateStr.startsWith('2025-07')) { qty = 500; price = 250; } 
    }

    const row = {
      product_name: product,
      category: category,
      quantity: qty,
      price: price,
      country: geo.c,
      region: region,
      sale_date: dateStr,
      store_name: isOnline ? 'Website' : randomChoice(storeNames)
    };

    if (isOnline) onlinePayload.push(row);
    else storePayload.push(row);
  }

  console.log("Pushing payloads to database natively via RLS protected API...");
  // Bulk inserting (chunking to prevent payload limits)
  const chunkSize = 500;
  for (let i = 0; i < onlinePayload.length; i += chunkSize) {
    const chunk = onlinePayload.slice(i, i + chunkSize);
    const { error } = await supabase.from('online_sales').insert(chunk);
    if (error) console.error("Chunk Error Online:", error);
  }
  
  for (let i = 0; i < storePayload.length; i += chunkSize) {
    const chunk = storePayload.slice(i, i + chunkSize);
    const { error } = await supabase.from('store_sales').insert(chunk);
    if (error) console.error("Chunk Error Store:", error);
  }

  console.log("Triggering database AI Engines as the authenticated user...");
  const { error: aiErr } = await supabase.rpc('generate_ai_insights_engine');
  if (aiErr) console.error("AI Error:", aiErr);
  
  const { error: recErr } = await supabase.rpc('generate_recommendations');
  if (recErr) console.error("Rec Error:", recErr);

  const { error: analyticsErr } = await supabase.rpc('generate_analytics_insights_engine');
  if (analyticsErr) console.error("Analytics Insights Error:", analyticsErr);

  const { error: forecastErr } = await supabase.rpc('generate_forecast_engine');
  if (forecastErr) console.error("Forecast Error:", forecastErr);
  
  console.log("Database seeded successfully and all engines fully evaluated!");
}

run();
