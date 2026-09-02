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
  { c: 'India', r: ['Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'Gujarat'] }
];
const storeNames = ['Downtown Hub', 'Mall Branch', 'Airport Store', 'Suburban Outlet', 'Mega Center'];

function randomChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

async function run() {
  console.log("Logging in as", email);
  await supabase.auth.signInWithPassword({ email, password });

  console.log("Generating sales for February & March 2026...");
  const onlinePayload = [];
  const storePayload = [];

  const febStart = new Date('2026-02-01').getTime();
  const marchEnd = new Date('2026-03-31').getTime();

  for (let i = 0; i < 500; i++) {
    const isOnline = Math.random() < 0.6;
    const category = randomChoice(categories);
    const product = randomChoice(products[category]);
    const geo = randomChoice(countriesAndRegions);
    const region = randomChoice(geo.r);
    
    const randomTime = febStart + Math.random() * (marchEnd - febStart);
    const dateStr = new Date(randomTime).toISOString().split('T')[0];

    const row = {
      product_name: product,
      category: category,
      quantity: randomInt(2, 50),
      price: randomInt(20, 800),
      country: geo.c,
      region: region,
      sale_date: dateStr,
      store_name: isOnline ? 'Website' : randomChoice(storeNames)
    };

    if (isOnline) onlinePayload.push(row);
    else storePayload.push(row);
  }

  console.log("Pushing data...");
  await supabase.from('online_sales').insert(onlinePayload);
  await supabase.from('store_sales').insert(storePayload);

  console.log("Triggering AI Engine Refresh...");
  await supabase.rpc('generate_ai_insights_engine');
  await supabase.rpc('generate_analytics_insights_engine');
  await supabase.rpc('generate_forecast_engine');
  
  console.log("Done! Feb/March 2026 data added.");
}

run();
