require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'travelcopilot_secret';
const USERS_FILE = path.join(__dirname, 'users.json');
const TRIPS_FILE = path.join(__dirname, 'trips.json');

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

// ─── Middleware ────────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'https://promptwars-git-main-shrihasini-s-projects.vercel.app',
  'https://promptwars-ten-self.vercel.app',
  'http://localhost:5173',
];
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Multer Config ────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, 'uploads', 'receipts');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + ext);
  }
});
const upload = multer({ storage: storage });

// ─── Helper: Read / Write JSON files ──────────────────────────────────────────
function readJSON(file) {
  try {
    const data = fs.readFileSync(file, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}
function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// ─── Auth middleware ──────────────────────────────────────────────────────────
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided.' });
  }
  try {
    const token = authHeader.split(' ')[1];
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token.' });
  }
}

// ─── POST /api/register ────────────────────────────────────────────────────────
app.post('/api/register', async (req, res) => {
  try {
    const { identifier, password, name } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ message: 'Email/phone and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }
    const users = readJSON(USERS_FILE);
    const exists = users.find(u => u.identifier === identifier.toLowerCase().trim());
    if (exists) {
      return res.status(409).json({ message: 'An account with this email/phone already exists.' });
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = {
      id: Date.now().toString(),
      name: name || 'Traveler',
      identifier: identifier.toLowerCase().trim(),
      password: hashedPassword,
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    writeJSON(USERS_FILE, users);
    const token = jwt.sign({ id: newUser.id, name: newUser.name }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({
      message: 'Account created successfully!',
      token,
      user: { id: newUser.id, name: newUser.name, identifier: newUser.identifier },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// ─── POST /api/login ───────────────────────────────────────────────────────────
app.post('/api/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ message: 'Email/phone and password are required.' });
    }
    const users = readJSON(USERS_FILE);
    const user = users.find(u => u.identifier === identifier.toLowerCase().trim());
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials. Please check your email/phone.' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password. Please try again.' });
    }
    const token = jwt.sign({ id: user.id, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      message: 'Welcome back!',
      token,
      user: { id: user.id, name: user.name, identifier: user.identifier },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// ─── POST /api/login-google ──────────────────────────────────────────────────
app.post('/api/login-google', async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required for Google Sign-In.' });
    }

    const users = readJSON(USERS_FILE);
    let user = users.find(u => u.identifier === email.toLowerCase().trim());
    if (!user) {
      // Auto-register Google user
      const hashedPassword = await bcrypt.hash('google-auth-random-pass-' + Math.random(), 12);
      user = {
        id: Date.now().toString(),
        name: name || 'Google Traveler',
        identifier: email.toLowerCase().trim(),
        password: hashedPassword,
        createdAt: new Date().toISOString(),
      };
      users.push(user);
      writeJSON(USERS_FILE, users);
    }

    const token = jwt.sign({ id: user.id, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      message: 'Logged in with Google! ✈️',
      token,
      user: { id: user.id, name: user.name, identifier: user.identifier },
    });
  } catch (err) {
    console.error('Google login error:', err);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// ─── GET /api/me ──────────────────────────────────────────────────────────────
app.get('/api/me', authMiddleware, (req, res) => {
  const users = readJSON(USERS_FILE);
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found.' });
  res.json({ id: user.id, name: user.name, identifier: user.identifier });
});

// ══════════════════════════════════════════════════════════════════════════════
// ─── AI ITINERARY GENERATION ────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

const DESTINATION_DATA = {
  paris: {
    country: 'France', emoji: '🇫🇷', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800',
    activities: ['Visit the Eiffel Tower & take elevator to the top','Walk through the Louvre Museum','Stroll along the Champs-Élysées','Explore Montmartre & Sacré-Cœur','Take a Seine River cruise at sunset','Visit Notre-Dame Cathedral area','Shop at Le Marais district','Explore the Palace of Versailles','Enjoy pastries at a local boulangerie','Visit Musée d\'Orsay','Walk through Luxembourg Gardens','Try escargot at a traditional bistro','Visit the Arc de Triomphe','Explore Saint-Germain-des-Prés','Take a cooking class in French cuisine'],
    hotels: ['Hôtel Plaza Athénée','Le Meurice','Hôtel de Crillon','The Ritz Paris'],
    food: ['Croissants at Du Pain et des Idées','Steak frites at Le Relais de l\'Entrecôte','Crêpes in Montmartre','Fine dining at Le Jules Verne'],
    budget: { flight: 850, hotel: 220, food: 65, activities: 45 }
  },
  tokyo: {
    country: 'Japan', emoji: '🇯🇵', image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800',
    activities: ['Visit Senso-ji Temple in Asakusa','Explore Shibuya Crossing & Hachiko statue','Walk through Meiji Shrine & Yoyogi Park','Experience Tsukiji Outer Fish Market','Visit teamLab Borderless digital art museum','Explore Akihabara electric town','Take a day trip to Mount Fuji','Walk through Shinjuku Gyoen Garden','Visit Tokyo Skytree observation deck','Explore Harajuku & Takeshita Street','Try authentic ramen at Ichiran','Visit the Imperial Palace East Gardens','Explore Odaiba entertainment district','Take a sushi-making class','Visit Ueno Park & museums'],
    hotels: ['Park Hyatt Tokyo','Aman Tokyo','The Peninsula Tokyo','Mandarin Oriental Tokyo'],
    food: ['Sushi at Sukiyabashi Jiro','Ramen at Fuunji','Tempura at Tsunahachi','Wagyu beef at Aragawa'],
    budget: { flight: 1100, hotel: 180, food: 55, activities: 40 }
  },
  santorini: {
    country: 'Greece', emoji: '🇬🇷', image: 'https://images.unsplash.com/photo-1533154683836-84ea7a0bc310?w=800',
    activities: ['Watch sunset from Oia village','Visit the Red Beach','Explore Ancient Akrotiri ruins','Take a catamaran sailing tour','Visit the volcanic hot springs','Wine tasting at Santo Wines','Hike from Fira to Oia','Visit the Archaeological Museum','Swim at Perissa Black Sand Beach','Explore Pyrgos village','Visit Amoudi Bay for seafood','Photography tour of blue domes','Take a cooking class','Visit Kamari Beach','Explore the caldera views from Fira'],
    hotels: ['Canaves Oia Luxury Suites','Grace Hotel Santorini','Mystique Hotel','Katikies Hotel'],
    food: ['Fresh seafood at Ammoudi Fish Tavern','Traditional Greek meze','Fava beans at Oia\'s tavernas','Wine and cheese sunset dinner'],
    budget: { flight: 750, hotel: 280, food: 50, activities: 35 }
  },
  bali: {
    country: 'Indonesia', emoji: '🇮🇩', image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800',
    activities: ['Visit Tegallalang Rice Terraces','Explore Ubud Monkey Forest','Visit Tanah Lot Temple at sunset','Take a surf lesson at Kuta Beach','Explore Tirta Empul Water Temple','Hike Mount Batur for sunrise','Visit Uluwatu Temple & Kecak dance','Explore Seminyak art galleries','Take a Balinese cooking class','Visit Tirta Gangga Water Palace','Snorkeling at Nusa Penida','Spa day with traditional Balinese massage','Visit Besakih Mother Temple','Explore Ubud Art Market','Go white water rafting on Ayung River'],
    hotels: ['Four Seasons Resort Bali at Sayan','COMO Shambhala Estate','The Mulia Bali','Hanging Gardens of Bali'],
    food: ['Nasi Goreng at a local warung','Suckling pig at Ibu Oka','Smoothie bowls in Canggu','Seafood BBQ at Jimbaran Bay'],
    budget: { flight: 650, hotel: 120, food: 25, activities: 30 }
  },
  dubai: {
    country: 'UAE', emoji: '🇦🇪', image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800',
    activities: ['Visit Burj Khalifa observation deck','Explore Dubai Mall & Aquarium','Desert safari with dune bashing','Visit the Palm Jumeirah','Tour the Gold Souk & Spice Souk','Visit Dubai Marina & JBR Walk','Explore the Dubai Museum at Al Fahidi','Visit Miracle Garden','Take an abra ride on Dubai Creek','Visit the Museum of the Future','Skydive over Palm Jumeirah','Visit Global Village','Explore La Mer beachfront','Visit Dubai Frame','Take a dhow dinner cruise'],
    hotels: ['Burj Al Arab','Atlantis The Royal','Armani Hotel Dubai','One&Only The Palm'],
    food: ['Arabic mezze at Al Fanar','Brunch at Atlantis','Street food at Al Dhiyafah Road','Fine dining at At.mosphere'],
    budget: { flight: 700, hotel: 200, food: 60, activities: 50 }
  },
  newyork: {
    country: 'USA', emoji: '🇺🇸', image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800',
    activities: ['Visit the Statue of Liberty & Ellis Island','Walk through Central Park','See a Broadway show','Visit the Metropolitan Museum of Art','Walk across Brooklyn Bridge','Explore Times Square at night','Visit the 9/11 Memorial & Museum','Walk along the High Line','Explore Greenwich Village','Visit Top of the Rock observation deck','Shop on Fifth Avenue','Visit MoMA','Explore Chinatown & Little Italy','Take a food tour of Williamsburg','Visit the Empire State Building'],
    hotels: ['The Plaza Hotel','The St. Regis New York','Mandarin Oriental New York','The Langham New York'],
    food: ['Pizza at Joe\'s Pizza','Bagels at Russ & Daughters','Pastrami at Katz\'s Deli','Fine dining at Le Bernardin'],
    budget: { flight: 500, hotel: 250, food: 70, activities: 55 }
  },
  london: {
    country: 'England', emoji: '🇬🇧', image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800',
    activities: ['Visit the Tower of London','See Big Ben & Houses of Parliament','Explore the British Museum','Walk through Hyde Park','Visit Buckingham Palace for Changing of Guard','Explore Borough Market','Take a Thames River cruise','Visit the Tate Modern','Explore Camden Town market','Visit the Natural History Museum','Walk through Covent Garden','Explore Notting Hill & Portobello Road','Visit St. Paul\'s Cathedral','Explore Shoreditch street art','See a West End show'],
    hotels: ['The Savoy','Claridge\'s','The Ritz London','Shangri-La The Shard'],
    food: ['Fish & chips at Poppies','Sunday roast at a pub','Afternoon tea at The Ritz','Curry on Brick Lane'],
    budget: { flight: 600, hotel: 230, food: 60, activities: 40 }
  },
};

// Fallback for unknown destinations
const DEFAULT_DATA = {
  country: 'Unknown', emoji: '🌍', image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800',
  activities: ['Explore the city center & main attractions','Visit local museums and galleries','Try traditional local cuisine','Walk through popular markets','Visit historical landmarks','Take a guided city tour','Explore local parks and gardens','Try street food','Visit religious or cultural sites','Take a day trip to nearby attractions','Enjoy nightlife and entertainment','Shop for local souvenirs','Visit viewpoints for panoramic views','Try a local cooking class','Explore the waterfront or beach area'],
  hotels: ['Grand Hotel','City Center Luxury Resort','Boutique Heritage Hotel','Waterfront Palace Hotel'],
  food: ['Traditional local cuisine','Street food tour','Fine dining experience','Market fresh breakfast'],
  budget: { flight: 700, hotel: 150, food: 45, activities: 35 }
};

function parsePrompt(prompt) {
  const lower = prompt.toLowerCase();

  // Extract days
  let days = 5;
  const dayMatch = lower.match(/(\d+)\s*(?:day|night)/);
  if (dayMatch) days = Math.min(parseInt(dayMatch[1]), 14);

  // Extract travelers
  let travelers = 2;
  const travMatch = lower.match(/(\d+)\s*(?:people|person|traveler|pax|adult|friend|couple)/);
  if (travMatch) travelers = parseInt(travMatch[1]);
  if (lower.includes('solo')) travelers = 1;
  if (lower.includes('couple') || lower.includes('romantic')) travelers = 2;
  if (lower.includes('family')) travelers = 4;

  // Extract trip type
  let tripType = 'adventure';
  if (lower.includes('romantic') || lower.includes('honeymoon') || lower.includes('couple')) tripType = 'romantic';
  else if (lower.includes('family') || lower.includes('kid')) tripType = 'family';
  else if (lower.includes('adventure') || lower.includes('trek') || lower.includes('hike')) tripType = 'adventure';
  else if (lower.includes('relax') || lower.includes('beach') || lower.includes('spa')) tripType = 'relaxation';
  else if (lower.includes('culture') || lower.includes('history') || lower.includes('museum')) tripType = 'cultural';
  else if (lower.includes('food') || lower.includes('culinary') || lower.includes('eat')) tripType = 'culinary';

  // Extract destination
  let destination = null;
  let destKey = null;
  for (const [key, data] of Object.entries(DESTINATION_DATA)) {
    if (lower.includes(key) || lower.includes(key.replace('newyork', 'new york'))) {
      destination = data;
      destKey = key;
      break;
    }
  }
  // Handle "new york" specially
  if (!destination && lower.includes('new york')) {
    destination = DESTINATION_DATA.newyork;
    destKey = 'newyork';
  }

  // Extract destination name from prompt if not matched
  let destName = destKey ? destKey.charAt(0).toUpperCase() + destKey.slice(1) : null;
  if (destKey === 'newyork') destName = 'New York';
  if (!destName) {
    // Try to extract a capitalized word as destination
    const words = prompt.split(/\s+/);
    for (const w of words) {
      if (w.length > 2 && w[0] === w[0].toUpperCase() && !['Day', 'The', 'And', 'For', 'With', 'Trip', 'Plan', 'Create'].includes(w)) {
        destName = w;
        break;
      }
    }
    if (!destName) destName = 'Your Destination';
  }

  if (!destination) destination = DEFAULT_DATA;

  return { days, travelers, tripType, destination, destName };
}

function generateItinerary(prompt) {
  const { days, travelers, tripType, destination, destName } = parsePrompt(prompt);

  const tripTypeLabels = {
    romantic: '💕 Romantic Getaway',
    family: '👨‍👩‍👧‍👦 Family Adventure',
    adventure: '🏔️ Adventure Trip',
    relaxation: '🏖️ Relaxation Retreat',
    cultural: '🏛️ Cultural Exploration',
    culinary: '🍽️ Culinary Journey',
  };

  // Generate day-by-day itinerary
  const itineraryDays = [];
  const shuffled = [...destination.activities].sort(() => Math.random() - 0.5);
  for (let d = 1; d <= days; d++) {
    const dayActivities = [];
    const startIdx = ((d - 1) * 3) % shuffled.length;
    for (let a = 0; a < 3; a++) {
      dayActivities.push({
        time: a === 0 ? 'Morning' : a === 1 ? 'Afternoon' : 'Evening',
        activity: shuffled[(startIdx + a) % shuffled.length],
        done: false,
      });
    }
    const foodItem = destination.food[(d - 1) % destination.food.length];
    itineraryDays.push({
      day: d,
      title: d === 1 ? 'Arrival & Explore' : d === days ? 'Final Day & Departure' : `Day ${d} — Discover`,
      activities: dayActivities,
      meal: foodItem,
    });
  }

  // Generate checklist
  const baseChecklist = [
    { text: 'Book round-trip flights', done: false, category: 'booking' },
    { text: `Reserve hotel (${destination.hotels[0]})`, done: false, category: 'booking' },
    { text: 'Get travel insurance', done: false, category: 'booking' },
    { text: 'Check passport validity', done: false, category: 'documents' },
    { text: 'Apply for visa (if required)', done: false, category: 'documents' },
    { text: 'Print/save booking confirmations', done: false, category: 'documents' },
    { text: 'Download offline maps', done: false, category: 'packing' },
    { text: 'Pack comfortable walking shoes', done: false, category: 'packing' },
    { text: 'Pack weather-appropriate clothing', done: false, category: 'packing' },
    { text: 'Bring universal power adapter', done: false, category: 'packing' },
    { text: 'Pack sunscreen & toiletries', done: false, category: 'packing' },
    { text: 'Arrange airport transfer', done: false, category: 'transport' },
    { text: 'Research local transport options', done: false, category: 'transport' },
    { text: 'Exchange currency or get travel card', done: false, category: 'finance' },
    { text: 'Set travel budget and daily limits', done: false, category: 'finance' },
    { text: 'Inform bank about travel dates', done: false, category: 'finance' },
  ];

  // Generate estimated receipts/budget
  const b = destination.budget;
  const receipts = [
    { item: `✈️ Round-trip flights (×${travelers})`, amount: b.flight * travelers, category: 'flights', paid: false },
    { item: `🏨 Hotel — ${days} nights`, amount: b.hotel * days, category: 'accommodation', paid: false },
    { item: `🍽️ Food & dining — ${days} days`, amount: b.food * days * travelers, category: 'food', paid: false },
    { item: `🎯 Activities & tours — ${days} days`, amount: b.activities * days * travelers, category: 'activities', paid: false },
    { item: '🚕 Local transport', amount: Math.round(15 * days * travelers), category: 'transport', paid: false },
    { item: '🛡️ Travel insurance', amount: Math.round(50 * travelers), category: 'insurance', paid: false },
  ];
  const totalBudget = receipts.reduce((s, r) => s + r.amount, 0);

  return {
    id: Date.now().toString(),
    title: `${destination.emoji} ${destName} — ${tripTypeLabels[tripType] || tripType}`,
    destination: destName,
    country: destination.country,
    emoji: destination.emoji,
    image: destination.image,
    days,
    travelers,
    tripType,
    tripTypeLabel: tripTypeLabels[tripType] || tripType,
    prompt,
    itinerary: itineraryDays,
    checklist: baseChecklist,
    receipts,
    totalBudget,
    hotel: destination.hotels[0],
    createdAt: new Date().toISOString(),
    status: 'planned',
  };
}

// ─── POST /api/generate-itinerary ─────────────────────────────────────────────
app.post('/api/generate-itinerary', authMiddleware, async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || prompt.trim().length < 5) {
      return res.status(400).json({ message: 'Please describe your trip (e.g., "5-day romantic trip to Paris")' });
    }

    let trip;
    let usingRealAI = false;

    // Try OpenAI if configured
    if (openai) {
      try {
        console.log("Calling OpenAI for:", prompt);
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `You are a travel itinerary generator. You MUST respond with ONLY valid JSON and no markdown formatting or other text.
              Generate a realistic travel itinerary based on the user's prompt.
              Extract the destination, number of days (default 5, max 14), number of travelers (default 2), and trip type (romantic, family, adventure, relaxation, cultural, culinary).
              Generate a checklist array with items categorized as booking, documents, packing, transport, or finance.
              Generate a receipts array with estimated costs categorized as flights, accommodation, food, activities, transport, or insurance.
              The JSON schema must exactly match this structure:
              {
                "destination": "City Name",
                "country": "Country Name",
                "emoji": "🇺🇸",
                "image": "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800",
                "days": 5,
                "travelers": 2,
                "tripType": "romantic",
                "tripTypeLabel": "💕 Romantic Getaway",
                "hotel": "Example Luxury Hotel",
                "itinerary": [
                  { "day": 1, "title": "Arrival", "activities": [{ "time": "Morning", "activity": "Arrive", "done": false }], "meal": "Dinner at X" }
                ],
                "checklist": [
                  { "text": "Book flights", "done": false, "category": "booking" }
                ],
                "receipts": [
                  { "item": "Flights", "amount": 1000, "category": "flights", "paid": false }
                ]
              }
              Ensure realistic budget amounts based on the destination.`
            },
            {
              role: "user",
              content: prompt
            }
          ],
          response_format: { type: "json_object" }
        });

        const content = completion.choices[0].message.content;
        const aiData = JSON.parse(content);
        
        // Calculate total budget
        const totalBudget = aiData.receipts.reduce((s, r) => s + r.amount, 0);

        trip = {
          ...aiData,
          id: Date.now().toString(),
          prompt,
          totalBudget,
          createdAt: new Date().toISOString(),
          status: 'planned'
        };
        usingRealAI = true;

      } catch (aiError) {
        console.error("OpenAI Error, falling back to mock:", aiError.message);
        // Fallback happens below
      }
    }

    // Fallback to built-in generator
    if (!usingRealAI) {
      trip = generateItinerary(prompt);
    }

    trip.userId = req.user.id;
    trip.isAI = usingRealAI;

    // Save to trips.json
    const trips = readJSON(TRIPS_FILE);
    trips.push(trip);
    writeJSON(TRIPS_FILE, trips);

    res.json({ message: 'Itinerary generated successfully! ✈️', trip });
  } catch (err) {
    console.error('Generate error:', err);
    res.status(500).json({ message: 'Failed to generate itinerary.' });
  }
});

// ─── GET /api/trips ───────────────────────────────────────────────────────────
app.get('/api/trips', authMiddleware, (req, res) => {
  const trips = readJSON(TRIPS_FILE).filter(t => t.userId === req.user.id);
  res.json(trips);
});

// ─── PUT /api/trips/:id ── update trip (checklist toggles, receipt toggles) ──
app.put('/api/trips/:id', authMiddleware, (req, res) => {
  const trips = readJSON(TRIPS_FILE);
  const idx = trips.findIndex(t => t.id === req.params.id && t.userId === req.user.id);
  if (idx === -1) return res.status(404).json({ message: 'Trip not found.' });
  trips[idx] = { ...trips[idx], ...req.body, id: trips[idx].id, userId: trips[idx].userId };
  writeJSON(TRIPS_FILE, trips);
  res.json({ message: 'Trip updated!', trip: trips[idx] });
});

// ─── POST /api/trips/:id/receipts ── upload receipt file ──────────────────────
app.post('/api/trips/:id/receipts', authMiddleware, upload.single('receiptImage'), (req, res) => {
  try {
    const trips = readJSON(TRIPS_FILE);
    const idx = trips.findIndex(t => t.id === req.params.id && t.userId === req.user.id);
    if (idx === -1) return res.status(404).json({ message: 'Trip not found.' });

    const { item, amount } = req.body;
    if (!item || !amount) return res.status(400).json({ message: 'Item name and amount required.' });

    const newReceipt = {
      item,
      amount: Number(amount),
      paid: false,
      category: 'other',
      imageUrl: req.file ? `/uploads/receipts/${req.file.filename}` : null
    };

    trips[idx].receipts.push(newReceipt);
    trips[idx].totalBudget = trips[idx].receipts.reduce((s, r) => s + r.amount, 0);

    writeJSON(TRIPS_FILE, trips);
    res.json({ message: 'Receipt added successfully!', trip: trips[idx] });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ message: 'Failed to upload receipt.' });
  }
});

// ─── DELETE /api/trips/:id ────────────────────────────────────────────────────
app.delete('/api/trips/:id', authMiddleware, (req, res) => {
  let trips = readJSON(TRIPS_FILE);
  const before = trips.length;
  trips = trips.filter(t => !(t.id === req.params.id && t.userId === req.user.id));
  if (trips.length === before) return res.status(404).json({ message: 'Trip not found.' });
  writeJSON(TRIPS_FILE, trips);
  res.json({ message: 'Trip deleted.' });
});

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_, res) => res.json({ status: 'ok', message: 'TravelCopilot API is running ✈️' }));

// ─── Export for Vercel Serverless + Local Dev ─────────────────────────────────
module.exports = app;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n✈️  TravelCopilot Backend running on http://localhost:${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/api/health\n`);
  });
}

