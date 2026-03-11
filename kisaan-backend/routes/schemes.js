const express = require('express');
const router = express.Router();

const mockSchemes = [
    {
        id: 1,
        title: "PM-Kisan Samman Nidhi",
        description: "Income support of ₹6,000 per year in three equal installments.",
        tags: ["All Crops", "Financial Aid"],
        link: "https://pmkisan.gov.in"
    },
    {
        id: 2,
        title: "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
        description: "Crop insurance scheme providing financial support in case of crop failure.",
        tags: ["Insurance", "Cotton", "Soybean", "Wheat", "Rice"],
        link: "https://pmfby.gov.in/"
    },
    {
        id: 3,
        title: "Soil Health Card Scheme",
        description: "Helps farmers know the nutrient status of their soil.",
        tags: ["Soil", "All Crops"],
        link: "https://soilhealth.dac.gov.in/"
    },
    {
        id: 4,
        title: "Paramparagat Krishi Vikas Yojana (PKVY)",
        description: "Promotes organic farming practices.",
        tags: ["Organic", "Vegetables", "Tomato", "Potato"],
        link: "https://pgsindia-ncof.gov.in/pkvy/index.aspx"
    },
    {
        id: 5,
        title: "National Mission on Micro Irrigation",
        description: "Subsidies for drip and sprinkler irrigation systems.",
        tags: ["Irrigation", "Sugarcane", "Cotton", "Maize"],
        link: "https://pmksy.gov.in/mis/mi/"
    }
];

router.get('/', (req, res) => {
    const { crop, location } = req.query;

    let personalizedSchemes = [...mockSchemes];

    if (crop) {
        // Prioritize schemes that match the user's crop or are "All Crops"
        personalizedSchemes.sort((a, b) => {
            const aMatch = a.tags.some(t => t.toLowerCase() === crop.toLowerCase());
            const bMatch = b.tags.some(t => t.toLowerCase() === crop.toLowerCase());

            if (aMatch && !bMatch) return -1;
            if (!aMatch && bMatch) return 1;
            return 0;
        });

        // Ensure at least one top item explicitly mentions their crop securely if they aren't matched
        const hasMatch = personalizedSchemes.some(s => s.tags.some(t => t.toLowerCase() === crop.toLowerCase()));
        if (!hasMatch && crop.length > 2) {
            personalizedSchemes.unshift({
                id: 99,
                title: `State Subsidy for ${crop.charAt(0).toUpperCase() + crop.slice(1)} Farmers`,
                description: `Special financial assistance for ${crop} cultivation in ${location || 'your district'}.`,
                tags: [crop, "State Govt"],
                link: "https://agricoop.nic.in/"
            });
        }
    }

    res.json(personalizedSchemes);
});

module.exports = router;
