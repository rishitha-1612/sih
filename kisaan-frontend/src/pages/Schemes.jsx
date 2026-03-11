import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { ShieldAlert, ChevronLeft, Search, Activity, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Schemes() {
    const user = useStore(state => state.user);
    const navigate = useNavigate();
    const [schemes, setSchemes] = useState([]);
    const [loading, setLoading] = useState(true);

    const getSchemeTheme = (index, fallbackType) => {
        const type = fallbackType || (index % 3 === 0 ? 'green' : index % 3 === 1 ? 'blue' : 'orange');
        if (type === 'green') return { border: 'border-l-green-500', icon: <ShieldAlert className="text-green-500" size={24} />, btn: 'from-green-600 to-green-400', glow: 'shadow-[0_0_15px_rgba(34,197,94,0.1)]' };
        if (type === 'blue') return { border: 'border-l-blue-500', icon: <Activity className="text-blue-500" size={24} />, btn: 'from-blue-600 to-blue-400', glow: 'shadow-[0_0_15px_rgba(59,130,246,0.1)]' };
        return { border: 'border-l-orange-500', icon: <Wallet className="text-orange-500" size={24} />, btn: 'from-orange-600 to-orange-400', glow: 'shadow-[0_0_15px_rgba(249,115,22,0.1)]' };
    };

    useEffect(() => {
        const fetchSchemes = async () => {
            try {
                const res = await fetch(`http://localhost:5000/api/schemes?crop=${user?.crop}&location=${user?.location}`);
                const data = await res.json();
                setSchemes(data);
            } catch (error) {
                // Expanding the fallback data for demonstration purposes on the standalone page
                setSchemes([
                    { id: 1, title: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)', description: 'Crop insurance scheme providing financial support in case of crop failure.', tags: ['Insurance', user?.crop || 'Cotton'], type: 'green', link: 'https://pmfby.gov.in/' },
                    { id: 2, title: 'National Mission on Micro Irrigation', description: 'Subsidies for drip & sprinkler systems.', tags: ['Irrigation', 'Water Savings'], type: 'blue', link: 'https://pmksy.gov.in/mis/mi/' },
                    { id: 3, title: 'PM-Kisan Samman Nidhi', description: '₹6,000/year Income Support.', tags: ['Government', 'Income'], type: 'orange', link: 'https://pmkisan.gov.in' },
                    { id: 4, title: 'Soil Health Card Scheme', description: 'Helps farmers understand soil health and improve crop yield through optimized nutrient use.', tags: ['Soil', 'Sustainability'], type: 'green', link: 'https://soilhealth.dac.gov.in/' },
                    { id: 5, title: 'Kisan Credit Card (KCC)', description: 'Access adequate and timely credit support from the banking system.', tags: ['Finance', 'Credit'], type: 'blue', link: 'https://www.india.gov.in/spotlight/kisan-credit-card' },
                    { id: 6, title: 'Paramparagat Krishi Vikas Yojana', description: 'Promotes organic farming to improve soil health and increase agricultural sustainability.', tags: ['Organic', 'Eco-friendly'], type: 'orange', link: 'https://pgsindia-ncof.gov.in/pkvy/index.aspx' },
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchSchemes();
    }, [user]);

    return (
        <div className="min-h-screen bg-[#121212] flex flex-col font-sans">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-[#121212]/90 backdrop-blur-md border-b border-gray-800 p-4 flex items-center shadow-md">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 mr-3 bg-gray-800/50 rounded-full text-gray-300 hover:text-white hover:bg-gray-700 transition"
                >
                    <ChevronLeft size={20} />
                </button>
                <div className="flex-1">
                    <h1 className="text-xl font-bold text-white">Recommended Schemes</h1>
                    <p className="text-xs text-gray-400">Tailored for {user?.crop || 'your farm'} in {user?.location ? user.location.split(',')[0] : 'your area'}</p>
                </div>
            </header>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                {loading ? (
                    Array(5).fill(0).map((_, i) => (
                        <div key={i} className="animate-pulse bg-[#121418] rounded-2xl border border-gray-800 h-28 w-full"></div>
                    ))
                ) : schemes.length > 0 ? (
                    schemes.map((scheme, idx) => {
                        const theme = getSchemeTheme(idx, scheme.type);
                        return (
                            <div
                                key={scheme.id || idx}
                                className={`group relative bg-[#121418]/80 backdrop-blur-md rounded-2xl border border-gray-800/60 p-5 ${theme.border} border-l-[4px] flex flex-col md:flex-row md:items-center justify-between gap-5 transition-all hover:bg-[#1a1d24] hover:${theme.glow}`}
                            >
                                <div className="flex items-start">
                                    <div className="mt-1 mr-4 flex-shrink-0 bg-gray-800/50 p-3 rounded-xl hidden sm:block">
                                        {theme.icon}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-base md:text-lg text-gray-100 mb-1">{scheme.title}</h3>
                                        <p className="text-sm text-gray-400 mb-3">{scheme.description}</p>
                                        <div className="flex flex-wrap gap-2">
                                            {scheme.tags && scheme.tags.map(t => (
                                                <span key={t} className="text-xs bg-gray-800/80 text-gray-300 px-3 py-1 rounded-full border border-gray-700 font-medium tracking-wide">
                                                    {t}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-2 md:mt-0 flex w-full md:w-auto">
                                    <button
                                        onClick={() => {
                                            if (scheme.link && scheme.link !== '#') {
                                                window.open(scheme.link, '_blank', 'noopener,noreferrer');
                                            }
                                        }}
                                        disabled={!scheme.link || scheme.link === '#'}
                                        className={`w-full text-sm font-bold text-white bg-gradient-to-r ${theme.btn} px-6 py-3 rounded-xl shadow-lg transition-transform hover:scale-105 active:scale-95 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        Apply Now
                                    </button>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center text-gray-500 py-10">
                        No schemes found matching your profile.
                    </div>
                )}
            </div>
        </div>
    );
}
