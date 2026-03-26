import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { ShoppingCart, Leaf, FlaskConical, Bug, Droplets, Sprout, ExternalLink, Star } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// =============================================
// PRODUCT DATABASE
// =============================================

// Recommended products per crop (fallback if no advisory result)
const CROP_RECOMMENDATIONS = {
    Rice:      ['Urea', 'DAP', 'Zinc Sulphate', 'Chlorpyrifos'],
    Wheat:     ['Urea', 'DAP', 'Potash', 'Thiram'],
    Cotton:    ['NPK 20-20-0', 'Potash', 'Imidacloprid', 'Neem Oil'],
    Tomato:    ['NPK 19-19-19', 'Calcium Nitrate', 'Mancozeb', 'Neem Oil'],
    Potato:    ['Urea', 'SSP', 'Potash', 'Metalaxyl'],
    Maize:     ['Urea', 'DAP', 'Zinc Sulphate', 'Atrazine'],
    Soybean:   ['DAP', 'Potash', 'Rhizobium', 'Chlorpyrifos'],
    Sugarcane: ['Urea', 'SSP', 'Potash', 'Carbofuran'],
    Onion:     ['Urea', 'SSP', 'Potash', 'Mancozeb'],
    default:   ['Urea', 'DAP', 'Neem Oil', 'NPK 20-20-0']
};

// Full product catalog
const ALL_PRODUCTS = [
    // Fertilizers
    { id: 1,  name: 'Urea (50kg)',                  category: 'Fertilizer', price: 266,  rating: 4.5, image: '🌱', tag: 'Urea',         amazonQuery: 'urea fertilizer 50kg',          flipkartQuery: 'urea fertilizer agriculture' },
    { id: 2,  name: 'DAP Fertilizer (50kg)',         category: 'Fertilizer', price: 1350, rating: 4.7, image: '💊', tag: 'DAP',          amazonQuery: 'DAP fertilizer 50kg',           flipkartQuery: 'DAP fertilizer' },
    { id: 3,  name: 'NPK 20-20-0 (50kg)',            category: 'Fertilizer', price: 1100, rating: 4.3, image: '🧪', tag: 'NPK 20-20-0',  amazonQuery: 'NPK 20-20-0 fertilizer',        flipkartQuery: 'NPK fertilizer agriculture' },
    { id: 4,  name: 'NPK 19-19-19 (1kg)',            category: 'Fertilizer', price: 340,  rating: 4.6, image: '🧪', tag: 'NPK 19-19-19', amazonQuery: 'NPK 19-19-19 water soluble',    flipkartQuery: 'NPK 19-19-19 fertilizer' },
    { id: 5,  name: 'Potash MOP (50kg)',             category: 'Fertilizer', price: 1800, rating: 4.4, image: '🪨', tag: 'Potash',        amazonQuery: 'muriate of potash fertilizer',  flipkartQuery: 'potash fertilizer 50kg' },
    { id: 6,  name: 'SSP Fertilizer (50kg)',         category: 'Fertilizer', price: 400,  rating: 4.2, image: '⚗️', tag: 'SSP',          amazonQuery: 'single super phosphate 50kg',   flipkartQuery: 'SSP fertilizer agriculture' },
    { id: 7,  name: 'Zinc Sulphate (25kg)',          category: 'Fertilizer', price: 900,  rating: 4.5, image: '🔬', tag: 'Zinc Sulphate', amazonQuery: 'zinc sulphate fertilizer 25kg', flipkartQuery: 'zinc sulphate agriculture' },
    { id: 8,  name: 'Calcium Nitrate (25kg)',        category: 'Fertilizer', price: 1200, rating: 4.6, image: '🧊', tag: 'Calcium Nitrate',amazonQuery: 'calcium nitrate fertilizer',   flipkartQuery: 'calcium nitrate agriculture' },
    // Pesticides
    { id: 9,  name: 'Neem Oil Pesticide (500ml)',    category: 'Pesticide',  price: 299,  rating: 4.8, image: '🌿', tag: 'Neem Oil',      amazonQuery: 'neem oil pesticide 500ml',      flipkartQuery: 'neem oil pesticide agriculture' },
    { id: 10, name: 'Chlorpyrifos 20% EC (1L)',      category: 'Pesticide',  price: 450,  rating: 4.3, image: '🪲', tag: 'Chlorpyrifos',  amazonQuery: 'chlorpyrifos 20 EC insecticide',flipkartQuery: 'chlorpyrifos insecticide' },
    { id: 11, name: 'Imidacloprid 17.8% SL (250ml)',category: 'Pesticide',  price: 380,  rating: 4.4, image: '🐛', tag: 'Imidacloprid',  amazonQuery: 'imidacloprid 17.8 insecticide', flipkartQuery: 'imidacloprid insecticide' },
    { id: 12, name: 'Mancozeb 75% WP (500g)',        category: 'Fungicide',  price: 260,  rating: 4.5, image: '🍄', tag: 'Mancozeb',      amazonQuery: 'mancozeb 75 WP fungicide',      flipkartQuery: 'mancozeb fungicide agriculture' },
    { id: 13, name: 'Metalaxyl 35% WS (100g)',       category: 'Fungicide',  price: 320,  rating: 4.2, image: '🧫', tag: 'Metalaxyl',     amazonQuery: 'metalaxyl fungicide',           flipkartQuery: 'metalaxyl fungicide' },
    { id: 14, name: 'Thiram 75% WP (500g)',          category: 'Fungicide',  price: 280,  rating: 4.3, image: '🧫', tag: 'Thiram',        amazonQuery: 'thiram 75 WP fungicide',        flipkartQuery: 'thiram fungicide agriculture' },
    // Seeds
    { id: 15, name: 'Hybrid Tomato Seeds (10g)',     category: 'Seeds',      price: 150,  rating: 4.7, image: '🍅', tag: 'Tomato Seeds',  amazonQuery: 'hybrid tomato seeds',           flipkartQuery: 'hybrid tomato seeds agriculture' },
    { id: 16, name: 'BT Cotton Seeds (450g)',        category: 'Seeds',      price: 930,  rating: 4.5, image: '🌾', tag: 'Cotton Seeds',  amazonQuery: 'BT cotton seeds',               flipkartQuery: 'bt cotton seeds' },
    { id: 17, name: 'Rhizobium Biofertilizer',       category: 'Biofertilizer',price: 120,rating: 4.6, image: '🦠', tag: 'Rhizobium',     amazonQuery: 'rhizobium biofertilizer',       flipkartQuery: 'rhizobium biofertilizer soybean' },
    // Tools
    { id: 18, name: 'Hand Trowel & Pruner Set',      category: 'Tools',      price: 349,  rating: 4.4, image: '🔧', tag: 'Tools',         amazonQuery: 'hand trowel pruner set garden', flipkartQuery: 'garden trowel pruner set' },
    { id: 19, name: 'Knapsack Sprayer (16L)',         category: 'Tools',      price: 1299, rating: 4.6, image: '💧', tag: 'Sprayer',       amazonQuery: 'knapsack sprayer 16 litre',     flipkartQuery: 'knapsack sprayer agriculture' },
    { id: 20, name: 'Soil pH Testing Kit',           category: 'Tools',      price: 499,  rating: 4.5, image: '🧪', tag: 'Soil Test',     amazonQuery: 'soil pH testing kit agriculture',flipkartQuery: 'soil testing kit' },
];

const CATEGORY_ICONS = {
    Fertilizer:    <FlaskConical size={14} />,
    Pesticide:     <Bug size={14} />,
    Fungicide:     <Droplets size={14} />,
    Seeds:         <Sprout size={14} />,
    Biofertilizer: <Leaf size={14} />,
    Tools:         <ShoppingCart size={14} />
};

const CATEGORIES = ['All', 'Fertilizer', 'Pesticide', 'Fungicide', 'Seeds', 'Biofertilizer', 'Tools'];

// =============================================
// HELPERS
// =============================================
function getRecommendedProducts(advisoryFertilizer, crop) {
    const tags = advisoryFertilizer
        ? [advisoryFertilizer]
        : (CROP_RECOMMENDATIONS[crop] || CROP_RECOMMENDATIONS.default);

    return ALL_PRODUCTS.filter(p =>
        tags.some(tag => p.tag.toLowerCase().includes(tag.toLowerCase()) || tag.toLowerCase().includes(p.tag.toLowerCase()))
    ).slice(0, 4);
}

function buildAmazonUrl(query) {
    return `https://www.amazon.in/s?k=${encodeURIComponent(query)}`;
}

function buildFlipkartUrl(query) {
    return `https://www.flipkart.com/search?q=${encodeURIComponent(query)}`;
}

// =============================================
// PRODUCT CARD
// =============================================
function ProductCard({ product, highlight = false }) {
    return (
        <div className={`rounded-2xl border p-4 flex flex-col gap-3 transition-all hover:scale-[1.02] ${
            highlight
                ? 'bg-green-500/10 border-green-500/30'
                : 'bg-[#121418] border-gray-800'
        }`}>
            {/* Image / Emoji */}
            <div className={`text-4xl w-14 h-14 flex items-center justify-center rounded-xl ${
                highlight ? 'bg-green-500/20' : 'bg-gray-800'
            }`}>
                {product.image}
            </div>

            {/* Info */}
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        highlight
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-gray-700 text-gray-400'
                    }`}>
                        {CATEGORY_ICONS[product.category]}
                        {product.category}
                    </span>
                    {highlight && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">
                            ⭐ Recommended
                        </span>
                    )}
                </div>
                <h3 className="text-sm font-bold text-white leading-tight">{product.name}</h3>
                <div className="flex items-center gap-1 mt-1">
                    <Star size={11} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-xs text-gray-400">{product.rating}</span>
                </div>
            </div>

            {/* Price + Buy */}
            <div className="flex items-center justify-between">
                <span className="text-lg font-black text-white">₹{product.price}</span>
                <div className="flex gap-2">
                    <a
                        href={buildAmazonUrl(product.amazonQuery)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-[#FF9900] text-black hover:opacity-90 transition"
                    >
                        Amazon <ExternalLink size={10} />
                    </a>
                    <a
                        href={buildFlipkartUrl(product.flipkartQuery)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-[#2874F0] text-white hover:opacity-90 transition"
                    >
                        Flipkart <ExternalLink size={10} />
                    </a>
                </div>
            </div>
        </div>
    );
}

// =============================================
// MAIN PAGE
// =============================================
export default function Rewards() {
    const user = useStore(state => state.user);

    const storeAdvisory = useStore(state => state.advisoryResult);
    const [advisoryFertilizer, setAdvisoryFertilizer] = useState(storeAdvisory?.fertilizer || null);
    const [activeCategory, setActiveCategory]         = useState('All');
    const [searchQuery, setSearchQuery]               = useState('');

    const crop = user?.crop_type || user?.crop || '';

    // =============================================
    // FETCH LATEST ADVISORY RESULT
    // =============================================
    useEffect(() => {
        if (!storeAdvisory) {
            setAdvisoryFertilizer(null);
        } else {
            setAdvisoryFertilizer(storeAdvisory.fertilizer);
        }

        const fetchAdvisory = async () => {
            if (storeAdvisory) return; // Skip fetch if we already have it in store
            try {
                const userId = user?._id || user?.id;
                if (!userId) return;
                const res  = await fetch(`${API_URL}/api/advisory/latest/${userId}`);
                if (!res.ok) return;
                const data = await res.json();
                if (data?.fertilizer) setAdvisoryFertilizer(data.fertilizer);
            } catch {
                // silently fall back to crop-based
            }
        };
        if (user) fetchAdvisory();
    }, [user, storeAdvisory]); // Re-fetch or sync when store changes

    const recommendedProducts = getRecommendedProducts(advisoryFertilizer, crop);

    const allFiltered = ALL_PRODUCTS
        .filter(p => !recommendedProducts.find(r => r.id === p.id)) // exclude already recommended
        .filter(p => activeCategory === 'All' || p.category === activeCategory)
        .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                     p.category.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="min-h-screen bg-transparent pb-24 text-gray-100 font-sans">
            <div className="w-full max-w-2xl mx-auto px-4 pt-6">

                {/* Page Header */}
                <header className="mb-8">
                    <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
                        <ShoppingCart className="text-green-400" size={28} />
                        Agri Shop
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Fertilizers, pesticides, seeds & tools — buy on Amazon or Flipkart
                    </p>
                </header>

                {/* =============================================
                    SECTION 1 — RECOMMENDED
                ============================================= */}
                <section className="mb-10">
                    <div className="flex items-center gap-2 mb-4">
                        <Leaf className="text-green-400" size={18} />
                        <h2 className="text-lg font-extrabold text-white">
                            {advisoryFertilizer
                                ? `Recommended for your Advisory Based on ${advisoryFertilizer}`
                                : `Recommended for ${crop || 'your crop'}`
                            }
                        </h2>
                    </div>

                    {recommendedProducts.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {recommendedProducts.map(product => (
                                <ProductCard key={product.id} product={product} highlight />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 text-center text-gray-400 text-sm">
                            Complete the Crop Advisory to get personalized product recommendations.
                        </div>
                    )}
                </section>

                {/* =============================================
                    SECTION 2 — ALL PRODUCTS
                ============================================= */}
                <section>
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <ShoppingCart className="text-gray-400" size={18} />
                        All Agriculture Products
                    </h2>

                    {/* Search */}
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search products..."
                        className="w-full mb-4 px-4 py-3 rounded-xl bg-[#121418] border border-gray-700 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
                    />

                    {/* Category Filter */}
                    <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`whitespace-nowrap text-xs font-bold px-4 py-2 rounded-full transition-all flex-shrink-0 ${
                                    activeCategory === cat
                                        ? 'bg-green-500 text-white'
                                        : 'bg-[#121418] border border-gray-700 text-gray-400 hover:border-green-500'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Product Grid */}
                    {allFiltered.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {allFiltered.map(product => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 py-10">
                            No products found.
                        </div>
                    )}
                </section>

            </div>
        </div>
    );
}