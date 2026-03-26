const express = require('express');
const router = express.Router();

// =============================================
// CACHE
// =============================================
const cache = new Map();
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes

// =============================================
// FALLBACK — shown if API is down
// =============================================
const FALLBACK_PRICES = [
    { id: 1, crop: 'Wheat',     mandi: 'Delhi APMC',   price: '₹2300/q', trend: 'up',   change: '+₹45' },
    { id: 2, crop: 'Rice',      mandi: 'Pune APMC',    price: '₹3000/q', trend: 'down', change: '-₹30' },
    { id: 3, crop: 'Cotton',    mandi: 'Nagpur APMC',  price: '₹7100/q', trend: 'up',   change: '+₹120' },
    { id: 4, crop: 'Soybean',   mandi: 'Indore APMC',  price: '₹4300/q', trend: 'up',   change: '+₹80' },
    { id: 5, crop: 'Onion',     mandi: 'Nashik APMC',  price: '₹1600/q', trend: 'down', change: '-₹60' },
    { id: 6, crop: 'Tomato',    mandi: 'Hubli APMC',   price: '₹1200/q', trend: 'up',   change: '+₹25' },
    { id: 7, crop: 'Potato',    mandi: 'Agra APMC',    price: '₹1500/q', trend: 'down', change: '-₹20' },
    { id: 8, crop: 'Maize',     mandi: 'Guntur APMC',  price: '₹2100/q', trend: 'up',   change: '+₹35' },
    { id: 9, crop: 'Sugarcane', mandi: 'Kolhapur APMC',price: '₹3200/q', trend: 'up',   change: '+₹50' },
];

// =============================================
// FETCH FROM AGMARKNET via Data.gov.in
// =============================================
async function fetchAgmarknet(crop, state) {
    try {
        const apiKey = process.env.DATA_GOV_API_KEY;
        if (!apiKey) {
            console.warn('[Market] DATA_GOV_API_KEY not set in .env, skipping Agmarknet');
            return null;
        }

        // Build filters
        let filters = '';
        if (crop)  filters += `&filters[commodity]=${encodeURIComponent(crop)}`;
        if (state) filters += `&filters[state]=${encodeURIComponent(state)}`;

        const url = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070` +
                    `?api-key=${apiKey}&format=json&limit=20${filters}`;

        const response = await fetch(url, {
            signal: AbortSignal.timeout(8000)
        });

        if (!response.ok) throw new Error(`Agmarknet API error: ${response.status}`);

        const data = await response.json();
        if (!data?.records?.length) return null;

        // Map to our format
        return data.records.map((record, index) => {
            const modalPrice = parseFloat(record.modal_price || record.max_price || 0);
            const minPrice   = parseFloat(record.min_price || modalPrice);
            const diff       = Math.round(modalPrice - minPrice);

            return {
                id:     index + 1,
                crop:   record.commodity   || crop || 'Unknown',
                mandi:  `${record.market || 'Local'} APMC, ${record.district || record.state || ''}`.trim(),
                price:  `₹${Math.round(modalPrice)}/q`,
                trend:  diff >= 0 ? 'up' : 'down',
                change: diff >= 0 ? `+₹${diff}` : `-₹${Math.abs(diff)}`,
                state:  record.state    || '',
                date:   record.arrival_date || ''
            };
        });

    } catch (err) {
        console.error('[Market] Agmarknet fetch failed:', err.message);
        return null;
    }
}

// =============================================
// MAIN ROUTE
// =============================================
router.get('/', async (req, res) => {
    const { crop, location } = req.query;

    // Extract state from location string e.g. "Nashik, Maharashtra" → "Maharashtra"
    const state = location?.includes(',')
        ? location.split(',').pop().trim()
        : location || '';

    const cacheKey = `${crop || 'all'}-${state || 'all'}`;

    try {
        // Serve from cache if fresh
        const cached = cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
            console.log('[Market] Serving from cache');
            return res.json(cached.data);
        }

        console.log(`[Market] Fetching live Agmarknet data — crop: ${crop || 'all'}, state: ${state || 'all'}`);

        let marketRates = await fetchAgmarknet(crop, state);

        // If crop-specific fetch returned nothing, try without state filter
        if (!marketRates && crop) {
            marketRates = await fetchAgmarknet(crop, '');
        }

        // If still nothing, fetch general data
        if (!marketRates) {
            marketRates = await fetchAgmarknet('', '');
        }

        // Final fallback
        if (!marketRates || marketRates.length === 0) {
            console.log('[Market] Using fallback data');
            marketRates = FALLBACK_PRICES;
        }

        // Put user's crop at the top
        if (crop) {
            const cropLower = crop.toLowerCase();
            const idx = marketRates.findIndex(m => m.crop.toLowerCase() === cropLower);
            if (idx > 0) {
                const [userCrop] = marketRates.splice(idx, 1);
                marketRates.unshift(userCrop);
            }
        }

        // Cache the result
        cache.set(cacheKey, { data: marketRates, timestamp: Date.now() });

        res.json(marketRates);

    } catch (error) {
        console.error('[Market] Unexpected error:', error);
        res.json(FALLBACK_PRICES);
    }
});

module.exports = router;