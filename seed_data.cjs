const https = require('https');

const SUPABASE_URL = 'bnmfhmsidqfqhkvcaqpp.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJubWZobXNpZHFmcWhrdmNhcXBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4NzQyMzMsImV4cCI6MjA4ODQ1MDIzM30.S9y-jDPaW0QNneKpCxNh3ce4terJQ54njvGms7i52LY';
const EMAIL = 'divishbansal77@gmail.com';
const PASSWORD = '123456';

function httpsRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch(e) { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

const countries = [
  { name: 'India',          regions: ['Maharashtra','Karnataka','Delhi','Tamil Nadu','Gujarat','Rajasthan','West Bengal','Uttar Pradesh'] },
  { name: 'United States',  regions: ['California','Texas','New York','Florida','Illinois','Washington','Georgia','Arizona'] },
  { name: 'United Kingdom', regions: ['England','Scotland','Wales','Northern Ireland','London','Manchester','Birmingham','Leeds'] },
  { name: 'Germany',        regions: ['Bavaria','Berlin','Hamburg','Baden-Württemberg','Saxony','Hesse','Thuringia','Bremen'] },
  { name: 'Canada',         regions: ['Ontario','Quebec','British Columbia','Alberta','Manitoba','Nova Scotia','Saskatchewan','New Brunswick'] },
  { name: 'Australia',      regions: ['New South Wales','Victoria','Queensland','Western Australia','South Australia','Tasmania','ACT','Northern Territory'] },
  { name: 'Japan',          regions: ['Tokyo','Osaka','Kanagawa','Aichi','Fukuoka','Hokkaido','Hyogo','Kyoto'] },
  { name: 'Brazil',         regions: ['Sao Paulo','Rio de Janeiro','Minas Gerais','Bahia','Parana','Rio Grande do Sul','Pernambuco','Ceara'] },
  { name: 'France',         regions: ['Ile-de-France','Auvergne-Rhone-Alpes','Nouvelle-Aquitaine','Occitanie','Hauts-de-France','Provence-Alpes-Cote Azur','Normandy','Brittany'] },
  { name: 'Singapore',      regions: ['Central Region','East Region','North Region','North-East Region','West Region','Jurong','Tampines','Woodlands'] },
];

const products = [
  { name: 'Laptop',        normalized: 'laptop',         category: 'Electronics', min: 35000,  max: 150000 },
  { name: 'Smartphone',    normalized: 'smartphone',     category: 'Electronics', min: 15000,  max: 80000  },
  { name: 'Camera',        normalized: 'camera',         category: 'Electronics', min: 12000,  max: 60000  },
  { name: 'Headphones',    normalized: 'headphones',     category: 'Electronics', min: 2000,   max: 20000  },
  { name: 'Tablet',        normalized: 'tablet',         category: 'Electronics', min: 18000,  max: 70000  },
  { name: 'Smart Watch',   normalized: 'smart watch',    category: 'Electronics', min: 5000,   max: 30000  },
  { name: 'TV',            normalized: 'tv',             category: 'Electronics', min: 20000,  max: 100000 },
  { name: 'T-Shirt',       normalized: 't-shirt',        category: 'Clothing',    min: 500,    max: 3000   },
  { name: 'Jeans',         normalized: 'jeans',          category: 'Clothing',    min: 800,    max: 5000   },
  { name: 'Jacket',        normalized: 'jacket',         category: 'Clothing',    min: 2000,   max: 15000  },
  { name: 'Dress',         normalized: 'dress',          category: 'Clothing',    min: 1000,   max: 8000   },
  { name: 'Shoes',         normalized: 'shoes',          category: 'Clothing',    min: 1500,   max: 10000  },
  { name: 'Sneakers',      normalized: 'sneakers',       category: 'Clothing',    min: 2000,   max: 12000  },
  { name: 'Novel',         normalized: 'novel',          category: 'Books',       min: 200,    max: 800    },
  { name: 'Textbook',      normalized: 'textbook',       category: 'Books',       min: 500,    max: 2500   },
  { name: 'Comic',         normalized: 'comic',          category: 'Books',       min: 100,    max: 500    },
  { name: 'Self Help',     normalized: 'self help',      category: 'Books',       min: 300,    max: 1000   },
  { name: 'Blender',       normalized: 'blender',        category: 'Home',        min: 2000,   max: 10000  },
  { name: 'Sofa',          normalized: 'sofa',           category: 'Home',        min: 15000,  max: 60000  },
  { name: 'Table',         normalized: 'table',          category: 'Home',        min: 5000,   max: 25000  },
  { name: 'Chair',         normalized: 'chair',          category: 'Home',        min: 3000,   max: 15000  },
  { name: 'Lamp',          normalized: 'lamp',           category: 'Home',        min: 500,    max: 5000   },
  { name: 'Protein Powder',normalized: 'protein powder', category: 'Sports',      min: 2000,   max: 8000   },
  { name: 'Yoga Mat',      normalized: 'yoga mat',       category: 'Sports',      min: 500,    max: 3000   },
  { name: 'Dumbbells',     normalized: 'dumbbells',      category: 'Sports',      min: 1000,   max: 8000   },
  { name: 'Running Shoes', normalized: 'running shoes',  category: 'Sports',      min: 3000,   max: 15000  },
  { name: 'Lipstick',      normalized: 'lipstick',       category: 'Beauty',      min: 300,    max: 2000   },
  { name: 'Perfume',       normalized: 'perfume',        category: 'Beauty',      min: 1500,   max: 10000  },
  { name: 'Face Cream',    normalized: 'face cream',     category: 'Beauty',      min: 500,    max: 5000   },
  { name: 'Shampoo',       normalized: 'shampoo',        category: 'Beauty',      min: 200,    max: 1500   },
];

const channels   = ['online', 'store'];
const storeNames = ['Store A','Store B','Store C','Store D','Store E','Store F','Store G','Store H','Store Premium','Store Plus'];

function rnd(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr)      { return arr[Math.floor(Math.random() * arr.length)]; }
function randomDate()   {
  const now    = new Date();
  const past   = new Date(now); past.setMonth(past.getMonth() - 24);
  const ms     = past.getTime() + Math.random() * (now.getTime() - past.getTime());
  return new Date(ms).toISOString().split('T')[0];
}

async function main() {
  // --- Login ---
  console.log('Logging in...');
  const loginBody = JSON.stringify({ email: EMAIL, password: PASSWORD });
  const loginRes  = await httpsRequest({
    hostname: SUPABASE_URL, path: '/auth/v1/token?grant_type=password', method: 'POST',
    headers: { 'apikey': ANON_KEY, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginBody) }
  }, loginBody);

  if (!loginRes.body.access_token) {
    console.error('Login failed:', loginRes.body); process.exit(1);
  }
  const userToken = loginRes.body.access_token;
  const userId    = loginRes.body.user.id;
  console.log(`Logged in as user: ${userId}`);

  // --- Generate rows ---
  const TOTAL = 3000;
  const rows  = [];
  for (let i = 0; i < TOTAL; i++) {
    const countryObj = pick(countries);
    const prod       = pick(products);
    const price      = rnd(prod.min, prod.max);
    const quantity   = rnd(1, 15);
    rows.push({
      sale_date:          randomDate(),
      product_name:       prod.name,
      normalized_product: prod.normalized,
      category:           prod.category,
      quantity,
      price,
      region:             pick(countryObj.regions),
      channel:            pick(channels),
      country:            countryObj.name,
      store_name:         pick(storeNames),
      user_id:            userId,
    });
  }
  console.log(`Generated ${rows.length} rows. Inserting in batches of 200...`);

  // --- Insert in batches ---
  const BATCH = 200;
  let success = 0, failed = 0;
  for (let b = 0; b < Math.ceil(rows.length / BATCH); b++) {
    const batch = rows.slice(b * BATCH, (b + 1) * BATCH);
    const body  = JSON.stringify(batch);
    const res   = await httpsRequest({
      hostname: SUPABASE_URL, path: '/rest/v1/harmonized_sales', method: 'POST',
      headers: {
        'apikey': ANON_KEY, 'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json', 'Prefer': 'return=minimal',
        'Content-Length': Buffer.byteLength(body)
      }
    }, body);

    if (res.status === 201 || res.status === 200) {
      success += batch.length;
      console.log(`Batch ${b + 1} OK — Total inserted: ${success}`);
    } else {
      failed += batch.length;
      console.error(`Batch ${b + 1} FAILED (${res.status}):`, JSON.stringify(res.body));
    }
  }

  console.log(`\nDone! Inserted: ${success} | Failed: ${failed}`);
}

main().catch(console.error);
