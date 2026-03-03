const express = require('express');
const router = express.Router();

// Mocked real-time dynamic market data generation based on location and crop
const getDynamicPrice = (crop, basePrice) => {
    // Random fluctuation between -5% and +5%
    const variation = basePrice * (Math.random() * 0.1 - 0.05);
    const finalPrice = Math.round(basePrice + variation);
    const change = Math.round(variation);

    return {
        price: `₹${finalPrice}/q`,
        trend: change >= 0 ? 'up' : 'down',
        change: change >= 0 ? `+₹${change}` : `-₹${Math.abs(change)}`
    };
};

const basePrices = {
    'Cotton': 7100,
    'Soybean': 4300,
    'Wheat': 2300,
    'Rice': 3000,
    'Sugarcane': 3200, // per ton
    'Onion': 1600,
    'Tomato': 1200,
    'Potato': 1500,
    'Maize': 2100
};

router.get('/', (req, res) => {
    const { location, crop } = req.query;

    // Generate a set of dynamic market prices
    const marketRates = Object.keys(basePrices).map((c, index) => {
        const dynamic = getDynamicPrice(c, basePrices[c]);
        // Emulate some local mandis based on location roughly
        const mandiName = location && location.length > 3
            ? `${location.split(',')[0]} AMPC`
            : `Local AMPC ${index + 1}`;

        return {
            id: index + 1,
            crop: c,
            mandi: c.toLowerCase() === (crop || '').toLowerCase() ? `${mandiName} (Your Area)` : mandiName,
            ...dynamic
        };
    });

    // Put user's crop at the top
    if (crop) {
        const userCropIdx = marketRates.findIndex(m => m.crop.toLowerCase() === crop.toLowerCase());
        if (userCropIdx > -1) {
            const userCropData = marketRates.splice(userCropIdx, 1)[0];
            marketRates.unshift(userCropData);
        } else {
            // Add it if not in default bases
            const dynamic = getDynamicPrice(crop, 5000); // generic base
            marketRates.unshift({
                id: 99,
                crop: crop,
                mandi: location ? `${location.split(',')[0]} AMPC (Your Area)` : 'Local AMPC',
                ...dynamic
            });
        }
    }

    res.json(marketRates);
});

module.exports = router;
