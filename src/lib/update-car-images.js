const fs = require('fs');
const { Client } = require('pg');

const envPath = '/Users/sangeethps/toyota/.env';

console.log("Reading env file from:", envPath);
const envContent = fs.readFileSync(envPath, 'utf8');

const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL\s*=\s*(.+)/);
if (!urlMatch) {
  console.error("Error: Could not find NEXT_PUBLIC_SUPABASE_URL in .env file.");
  process.exit(1);
}

const connectionString = urlMatch[1].trim();
console.log("Connecting to PostgreSQL database...");

const client = new Client({
  connectionString: connectionString,
  ssl: { rejectUnauthorized: false }
});

const carImages = {
  'Fortuner': 'https://static3.toyotabharat.com/images/showroom/fortuner/fortuner-mmc/experience-legender-car.webp',
  'Innova HyCross': 'https://static3.toyotabharat.com/images/showroom/innova-hycross/hy-concept-img.webp',
  'Camry': 'https://static3.toyotabharat.com/images/showroom/new-camry/sport.webp',
  'Hilux': 'https://static.toyotabharat.com/images/showroom/hilux/hilux-emi-calculator-1370x965.webp',
  'Urban Cruiser Taisor': 'https://static3.toyotabharat.com/images/showroom/d27/introduction/D27_Make_Your_freedom_red_1200x400px.webp',
  'Glanza': 'https://static3.toyotabharat.com/images/showroom/glanza/color/insta-blue.webp'
};

async function run() {
  try {
    await client.connect();
    console.log("Connection established.");

    for (const [name, imageUrl] of Object.entries(carImages)) {
      console.log(`Updating ${name} image URL to: ${imageUrl}`);
      const res = await client.query(
        'UPDATE public.car_models SET image_url = $1 WHERE name = $2',
        [imageUrl, name]
      );
      console.log(`Rows affected: ${res.rowCount}`);
    }

    console.log("All car images updated successfully in database.");
  } catch (err) {
    console.error("Database update error:", err);
  } finally {
    await client.end();
    console.log("Database connection closed.");
  }
}

run();
