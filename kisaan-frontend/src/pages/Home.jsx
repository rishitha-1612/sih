import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { CloudSun, Sprout, TrendingUp, ShieldAlert, LogOut, ChevronRight, MapPin, Droplets, Wind, CloudRain, Leaf, ArrowRight, Activity, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
    const navigate = useNavigate();
    const user = useStore(state => state.user);
    const clearUser = useStore(state => state.clearUser);
    const [weather, setWeather] = useState({ temp: '..°C', condition: 'Fetching...' });
    const [schemes, setSchemes] = useState([]);
    const [loadingSchemes, setLoadingSchemes] = useState(true);

    useEffect(() => {
        const fetchWeather = async () => {
            const loc = user?.location || 'Arehalli, Karnataka'; // Default fallback
            try {
                const res = await fetch(`https://wttr.in/${encodeURIComponent(loc)}?format=j1`);
                if (!res.ok) throw new Error('Weather fetch failed');
                const data = await res.json();
                const current = data.current_condition[0];
                setWeather({
                    temp: `${current.temp_C}°C`,
                    condition: current.weatherDesc[0].value
                });
            } catch (error) {
                console.error("Failed to fetch weather", error);
                setWeather({ temp: '28.5°C', condition: 'Partly Cloudy' }); // Mock Fallback matching mockup
            }
        };

        const fetchSchemes = async () => {
            try {
                const res = await fetch(`http://localhost:5000/api/schemes?crop=${user?.crop}&location=${user?.location}`);
                const data = await res.json();
                setSchemes(data.slice(0, 3)); // display top 3 active
            } catch (error) {
                console.error("Failed to fetch schemes", error);
                // Fallback UI data if backend unavail
                setSchemes([
                    { id: 1, title: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)', description: 'Crop insurance scheme providing financial support in case of crop failure.', tags: ['Insurance', user?.crop || 'Cotton'], type: 'green' },
                    { id: 2, title: 'National Mission on Micro Irrigation', description: 'Subsidies for drip & sprinkler systems.', tags: ['Irrigation', 'Sugarcane'], type: 'blue' },
                    { id: 3, title: 'PM-Kisan Samman Nidhi', description: '₹6,000/year Income Support.', tags: ['Government', 'Income'], type: 'orange' }
                ]);
            } finally {
                setLoadingSchemes(false);
            }
        };

        if (user) {
            fetchWeather();
            fetchSchemes();
        }
    }, [user]);

    // Map theme colors for scheme cards
    const getSchemeTheme = (index, fallbackType) => {
        const type = fallbackType || (index % 3 === 0 ? 'green' : index % 3 === 1 ? 'blue' : 'orange');
        if (type === 'green') return { border: 'border-l-green-500', icon: <ShieldAlert className="text-green-500" size={20} />, btn: 'from-green-600 to-green-400', glow: 'shadow-[0_0_15px_rgba(34,197,94,0.1)]' };
        if (type === 'blue') return { border: 'border-l-blue-500', icon: <Activity className="text-blue-500" size={20} />, btn: 'from-blue-600 to-blue-400', glow: 'shadow-[0_0_15px_rgba(59,130,246,0.1)]' };
        return { border: 'border-l-orange-500', icon: <Wallet className="text-orange-500" size={20} />, btn: 'from-orange-600 to-orange-400', glow: 'shadow-[0_0_15px_rgba(249,115,22,0.1)]' };
    };

    return (
        <div className="min-h-screen bg-transparent pb-24 text-gray-100 flex flex-col font-sans">
            {/* Mobile Constraints Container */}
            <div className="w-full max-w-md mx-auto flex-1 flex flex-col px-4 pt-6 md:pt-10">

                {/* Header */}
                <header className="mb-6 bg-black/20 backdrop-blur-md border border-white/5 rounded-3xl p-6 shadow-2xl">
                    <div className="flex justify-between items-center mb-1">
                        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center">
                            Namaste, {user?.name ? user.name.split(' ')[0] : 'Farmer'}! <span className="ml-2 animate-pulse">👋</span>
                        </h1>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400">
                        <span>Here's your smart farm summary for</span>
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 font-medium">
                            <Leaf size={14} />
                            <span>{user?.crop || 'Cotton Crop'}</span>
                            <ChevronRight size={14} className="opacity-70" />
                        </div>
                    </div>
                </header>

                {/* Weather Card */}
                <section className="relative overflow-hidden rounded-2xl p-5 mb-5 shadow-[0_8px_30px_rgba(14,165,233,0.15)] bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 border border-blue-400/20">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

                    <div className="relative z-10">
                        <div className="flex items-center text-blue-50 mb-3 font-medium">
                            <MapPin size={16} className="mr-1.5" />
                            {user?.location || 'Arehalli, Karnataka'}
                        </div>

                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-5xl font-black text-white tracking-tighter shadow-sm">{weather.temp}</h2>
                            </div>
                            <div className="flex items-center bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-sm">
                                <CloudSun size={20} className="text-yellow-300 mr-2" />
                                <span className="text-sm font-semibold text-white">{weather.condition}</span>
                            </div>
                        </div>

                        {/* Weather Stats Row */}
                        <div className="flex items-center justify-between text-xs text-blue-50/90 font-medium bg-black/10 rounded-xl p-3 border border-white/10">
                            <div className="flex items-center gap-1.5"><Droplets size={14} /> Humidity: 62%</div>
                            <div className="w-px h-4 bg-white/20"></div>
                            <div className="flex items-center gap-1.5"><Wind size={14} /> Wind: 12 km/h</div>
                            <div className="w-px h-4 bg-white/20"></div>
                            <div className="flex items-center gap-1.5"><CloudRain size={14} /> Rain: 60%</div>
                        </div>
                    </div>
                </section>

                {/* Quick Info Grid (Advisory & Market) */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    {/* Advisory Card */}
                    <div className="relative bg-[#0d1512] rounded-2xl p-4 border border-green-500/20 shadow-[0_0_20px_rgba(34,197,94,0.05)] overflow-hidden flex flex-col justify-between group">
                        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-green-500/10 to-transparent"></div>
                        <div className="relative z-10">
                            <div className="flex items-center text-green-400 mb-2 font-semibold text-sm">
                                <Sprout size={16} className="mr-2" />
                                Crop Advisory
                            </div>
                            <p className="text-xs text-gray-300 leading-relaxed mb-4">
                                Apply Urea in <span className="text-green-400 font-bold">3 days</span> - Light rain expected.
                            </p>
                        </div>
                        <div className="relative z-10 flex items-center justify-between mt-auto">
                            <button className="text-[11px] font-bold text-white bg-green-500/20 px-3 py-1.5 rounded-full border border-green-500/30 flex items-center transition-all hover:bg-green-500/30">
                                View Details <ArrowRight size={12} className="ml-1" />
                            </button>
                        </div>
                    </div>

                    {/* Market Card */}
                    <div className="relative bg-[#1a120b] rounded-2xl p-4 border border-orange-500/20 shadow-[0_0_20px_rgba(249,115,22,0.05)] overflow-hidden flex flex-col justify-between group">
                        <div className="absolute bottom-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl"></div>
                        <div className="relative z-10">
                            <div className="flex items-center text-orange-400 mb-2 font-semibold text-sm">
                                <TrendingUp size={16} className="mr-2" />
                                Market Trend
                            </div>
                            <p className="text-xs text-gray-300 leading-relaxed mb-3">
                                {user?.crop || 'Cotton'} prices <span className="text-orange-400 font-bold">↑ by 5%</span> in nearby Mandi
                            </p>
                            <span className="inline-block text-[10px] bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded pl-1">
                                ✓ Good Time to Sell
                            </span>
                        </div>
                        <div className="relative z-10 flex justify-end mt-4">
                            <button className="text-[11px] font-bold text-gray-300 hover:text-white flex items-center">
                                View Trends <ArrowRight size={12} className="ml-1" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Schemes Section */}
                <section className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold text-white">Recommended Schemes</h2>
                        <button
                            onClick={() => navigate('/schemes')}
                            className="text-xs font-semibold text-green-400 hover:text-green-300 flex items-center transition-colors"
                        >
                            View All <ChevronRight size={14} />
                        </button>
                    </div>

                    <div className="space-y-3">
                        {loadingSchemes ? (
                            <div className="animate-pulse bg-[#121418] rounded-2xl border border-gray-800 h-24 w-full"></div>
                        ) : schemes.length > 0 ? (
                            schemes.map((scheme, idx) => {
                                const theme = getSchemeTheme(idx, scheme.type);
                                return (
                                    <div
                                        key={scheme.id || idx}
                                        className={`group relative bg-[#121418]/80 backdrop-blur-md rounded-2xl border border-gray-800/60 p-4 ${theme.border} border-l-[3px] flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:bg-[#1a1d24] hover:${theme.glow}`}
                                    >
                                        <div className="flex items-start">
                                            <div className="mt-1 mr-3 flex-shrink-0 bg-gray-800/50 p-2 rounded-xl">
                                                {theme.icon}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm text-gray-100 mb-1">{scheme.title}</h4>
                                                <p className="text-xs text-gray-400 mb-2 line-clamp-1">{scheme.description}</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {scheme.tags && scheme.tags.map(t => (
                                                        <span key={t} className="text-[10px] bg-gray-800/80 text-gray-300 px-2 py-0.5 rounded-full border border-gray-700 font-medium">
                                                            {t}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <button className={`w-full sm:w-auto text-xs font-bold text-white bg-gradient-to-r ${theme.btn} px-5 py-2 rounded-xl shadow-lg transition-transform active:scale-95 whitespace-nowrap`}>
                                            Apply Now
                                        </button>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="bg-[#121418] rounded-2xl border border-gray-800 p-6 text-center text-sm text-gray-400">
                                No specific schemes found right now.
                            </div>
                        )}
                    </div>
                </section>

            </div>
        </div>
    );
}
