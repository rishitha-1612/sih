export const tempLabel = (t) => {
    const n = parseFloat(t);
    if (isNaN(n)) return 'Moderate';
    if (n < 15) return 'Cold';
    if (n < 25) return 'Cool';
    if (n < 33) return 'Warm';
    return 'Hot';
};

export const getCropData = (crop = 'Cotton', tempC = 28, rainChance = 60, soilMoisture = 55) => {
    const c = crop.toLowerCase();
    const isHot = tempC > 32;
    const isRainy = rainChance > 50;
    const isDry = soilMoisture < 40;

    // fertilizer quantity adjusts for temperature & moisture
    const ureaDose = isDry ? 35 : isHot ? 38 : 40;         // kg/acre
    const dapDose = isDry ? 20 : 25;
    const waterPerIrrigation = isHot ? 45 : isDry ? 40 : 35; // mm
    const irrigationInterval = isRainy ? 10 : isDry ? 5 : 7;  // days

    const crops = {
        cotton: {
            emoji: '🌿',
            color: 'green',
            manure: 'FYM (Farm Yard Manure)',
            manureQty: '5 tonnes/acre before sowing',
            fertilizers: [
                { name: 'Urea (N)', dose: `${ureaDose} kg/acre`, timing: 'Apply within 3 days before light rain', icon: '🧪' },
                { name: 'DAP (P₂O₅)', dose: `${dapDose} kg/acre`, timing: 'Basal dose at sowing', icon: '🧫' },
                { name: 'MOP (K₂O)', dose: '20 kg/acre', timing: 'Split – 50% basal, 50% at boll formation', icon: '⚗️' },
            ],
            waterMgmt: {
                amount: `${waterPerIrrigation} mm per irrigation`,
                schedule: `Irrigate every ${irrigationInterval} days`,
                peak: 'Critical stages: Squaring & Boll formation',
                rainfallAdj: isRainy
                    ? 'Rain expected – skip next irrigation if > 20 mm received.'
                    : 'No significant rain – maintain schedule strictly.',
            },
            tips: [
                `At ${tempC}°C and ${soilMoisture}% soil moisture in your area, applying ${ureaDose} kg/acre of Urea within 3 days is recommended.`,
                isRainy
                    ? 'Light rain within 3 days — ideal timing for top-dressing Urea as moisture helps absorption.'
                    : 'Dry spell ahead — irrigate lightly before applying Urea to prevent volatilization.',
                isHot
                    ? 'High temperature detected — irrigate in the early morning (5–7 AM) to reduce evaporation.'
                    : 'Mild temperature — evening irrigation (4–6 PM) is effective.',
                'Avoid fertilizer application if wind speed > 20 km/h to prevent drift.',
                'Monitor for bollworm after rainfall — inspect fields every 3 days.',
            ],
        },
        wheat: {
            emoji: '🌾',
            color: 'yellow',
            manure: 'Compost / FYM',
            manureQty: '4 tonnes/acre before sowing',
            fertilizers: [
                { name: 'Urea (N)', dose: `${ureaDose} kg/acre`, timing: 'Apply within 3 days before rain', icon: '🧪' },
                { name: 'DAP (P₂O₅)', dose: `${dapDose} kg/acre`, timing: 'Basal at sowing', icon: '🧫' },
                { name: 'Zinc Sulphate', dose: '10 kg/acre', timing: 'Basal if soil is deficient', icon: '⚗️' },
            ],
            waterMgmt: {
                amount: `${waterPerIrrigation} mm per irrigation`,
                schedule: `Irrigate every ${irrigationInterval} days`,
                peak: 'Critical stages: Crown-root initiation & Flowering',
                rainfallAdj: isRainy
                    ? 'Rain forecast – delay irrigation if soil moisture is sufficient.'
                    : 'Dry conditions – ensure CRI (21 days after sowing) irrigation is not missed.',
            },
            tips: [
                `Apply ${ureaDose} kg/acre Urea now while soil moisture at ${soilMoisture}% is optimal for nitrogen uptake.`,
                'Split Urea in 2 doses: basal + tillering for best yield.',
                isHot ? 'Avoid irrigation between 10 AM – 4 PM to minimize evaporation.' : 'Morning irrigation advised.',
                'If rain exceeds 25 mm, skip the scheduled irrigation cycle.',
                'Spray 2% DAP solution at flag-leaf stage if crop shows pale color.',
            ],
        },
        rice: {
            emoji: '🌾',
            color: 'teal',
            manure: 'Green Manure / FYM',
            manureQty: '6 tonnes/acre – incorporate 2 weeks before transplanting',
            fertilizers: [
                { name: 'Urea (N)', dose: `${ureaDose} kg/acre`, timing: '3 splits: Basal, Tillering, Panicle Initiation', icon: '🧪' },
                { name: 'Single Super Allocation', dose: '20 kg/acre', timing: 'Basal at transplanting', icon: '🧫' },
                { name: 'MOP', dose: '15 kg/acre', timing: 'At tillering stage', icon: '⚗️' },
            ],
            waterMgmt: {
                amount: `Maintain 5 cm standing water`,
                schedule: 'Drain field for 5 days at tillering, then re-flood',
                peak: 'Critical: Tillering, Panicle Initiation, Flowering',
                rainfallAdj: isRainy
                    ? 'Rain expected – monitor bund height to prevent overflow.'
                    : 'Maintain 5 cm water level; irrigate if water drops below 2 cm.',
            },
            tips: [
                `Soil moisture at ${soilMoisture}% — optimal for Urea application this week.`,
                'Apply Urea when standing water is present to reduce ammonia volatilization.',
                `Temperature at ${tempC}°C — warm conditions favor quick nitrogen uptake.`,
                'Avoid Urea application if heavy rain (>40 mm) is forecast within 24 hours.',
                'Use Neem-Coated Urea if available — reduces losses by 15–20%.',
            ],
        },
    };

    // default fallback
    return crops[c] || crops.cotton;
};
