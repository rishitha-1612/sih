import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { CloudSun, Sprout, TrendingUp, ShieldAlert, ChevronRight, MapPin, Droplets, Wind, CloudRain, Leaf, Activity, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Home() {
    const navigate = useNavigate();
    const user     = useStore(state => state.user);

    const [weather, setWeather] = useState({
        temp:       '28',
        condition:  'Partly Cloudy',
        rainChance: 60,
        windSpeed:  12,
        humidity:   65
    });

    const [schemes, setSchemes]               = useState([]);
    const [marketData, setMarketData]         = useState(null);
    const [loadingSchemes, setLoadingSchemes] = useState(true);
    const [loadingMarket, setLoadingMarket]   = useState(true);

    useEffect(() => {
        if (!user) return;

        // =============================================
        // WEATHER
        // =============================================
        const fetchWeather = async () => {
            const loc = user?.location || 'Bangalore, Karnataka';
            try {
                const res  = await fetch(`https://wttr.in/${encodeURIComponent(loc)}?format=j1`);
                const data = await res.json();
                const cur  = data.current_condition[0];
                const rain = data.weather?.[0]?.hourly?.[4]?.chanceofrain || 60;
                setWeather({
                    temp:       cur.temp_C,
                    condition:  cur.weatherDesc[0].value,
                    rainChance: parseInt(rain),
                    windSpeed:  cur.windspeedKmph,
                    humidity:   cur.humidity
                });
            } catch {
                // keep defaults
            }
        };

        // =============================================
        // SCHEMES — real API
        // =============================================
        const fetchSchemes = async () => {
            try {
                const res  = await fetch(`${API_URL}/api/schemes?crop=${user?.crop || ''}&location=${user?.location || ''}`);
                const data = await res.json();
                setSchemes(data.slice(0, 1));
            } catch {
                setSchemes([{
                    id:          1,
                    title:       'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
                    description: 'Crop insurance scheme providing financial support in case of crop failure.',
                    tags:        ['Insurance', user?.crop || 'Cotton'],
                    link:        'https://pmfby.gov.in/'
                }]);
            } finally {
                setLoadingSchemes(false);
            }
        };

        // =============================================
        // MARKET — real Agmarknet API
        // =============================================
        const fetchMarket = async () => {
            try {
                const res  = await fetch(`${API_URL}/api/market?crop=${user?.crop || ''}&location=${user?.location || ''}`);
                const data = await res.json();
                // Get user's crop entry (first item after sorting)
                if (data?.length > 0) setMarketData(data[0]);
            } catch {
                // keep null — shows fallback text
            } finally {
                setLoadingMarket(false);
            }
        };

        fetchWeather();
        fetchSchemes();
        fetchMarket();

    }, [user]);

    const getSchemeTheme = (index) => {
        const type = index % 3 === 0 ? 'green' : index % 3 === 1 ? 'blue' : 'orange';
        if (type === 'green') return {
            border: 'border-l-green-500',
            icon:   <ShieldAlert className="text-green-500" size={20} />,
            btn:    'from-green-600 to-green-400'
        };
        if (type === 'blue') return {
            border: 'border-l-blue-500',
            icon:   <Activity className="text-blue-500" size={20} />,
            btn:    'from-blue-600 to-blue-400'
        };
        return {
            border: 'border-l-orange-500',
            icon:   <Wallet className="text-orange-500" size={20} />,
            btn:    'from-orange-600 to-orange-400'
        };
    };

    return (
        <div className="min-h-screen bg-transparent pb-24 text-gray-100 flex flex-col font-sans">
            <div className="w-full max-w-5xl mx-auto flex-1 flex flex-col px-4 pt-6 md:pt-10">

                {/* Header */}
                <header className="mb-6 bg-black/20 backdrop-blur-md border border-white/5 rounded-3xl p-6 shadow-2xl">
                    <h1 className="text-3xl font-extrabold text-white flex items-center">
                        Namaste, {user?.name?.split(' ')[0] || 'Farmer'}!
                        <span className="ml-2">👋</span>
                    </h1>
                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-400">
                        Here's your smart farm summary for
                        <div className="relative inline-block group">
                            <select
                                value={user?.crop || 'Cotton'}
                                onChange={(e) => {
                                    const newCrop = e.target.value;
                                    useStore.getState().setUser({ ...user, crop: newCrop, crop_type: newCrop });
                                }}
                                className="appearance-none bg-green-500/10 border border-green-500/30 text-green-400 px-3 py-1 pr-8 rounded-full outline-none hover:bg-green-500/20 transition cursor-pointer font-bold"
                            >
                                {['Cotton', 'Wheat', 'Rice', 'Sugarcane', 'Maize', 'Soybean', 'Onion', 'Tomato'].map(c => (
                                    <option key={c} value={c} className="bg-[#121418] text-white">
                                        {c}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-green-400 opacity-70 group-hover:opacity-100 transition">
                                <ChevronRight size={14} className="rotate-90" />
                            </div>
                        </div>
                    </div>
                </header>

                {/* Weather Card */}
                <section className="rounded-2xl p-5 mb-5 shadow-xl bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400">
                    <div className="flex items-center text-blue-50 mb-3">
                        <MapPin size={16} className="mr-1" />
                        {user?.location || 'Bangalore'}
                    </div>
                    <div className="flex justify-between mb-5">
                        <h2 className="text-5xl font-black">{weather.temp}°C</h2>
                        <div className="flex items-center bg-white/20 px-3 py-1 rounded-full">
                            <CloudSun size={20} className="mr-2" />
                            {weather.condition}
                        </div>
                    </div>
                    <div className="flex justify-between text-xs bg-black/10 p-3 rounded-xl">
                        <div className="flex items-center gap-1">
                            <Droplets size={14} /> Humidity {weather.humidity}%
                        </div>
                        <div className="flex items-center gap-1">
                            <Wind size={14} /> {weather.windSpeed} km/h
                        </div>
                        <div className="flex items-center gap-1">
                            <CloudRain size={14} /> {weather.rainChance}%
                        </div>
                    </div>
                </section>

                {/* Quick Cards */}
                <div className="space-y-3 mb-6">

                    {/* Crop Advisory */}
                    <div className="bg-[#121418] rounded-xl p-4 border border-gray-800 flex justify-between items-center border-l-4 border-l-green-500">
                        <div className="flex items-start">
                            <div className="mr-3">
                                <Sprout className="text-green-500" size={20} />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-gray-100">Crop Advisory</h4>
                                <p className="text-xs text-gray-400">
                                    Get fertilizer recommendations for{' '}
                                    <span className="text-green-400 font-bold">{user?.crop || 'your crop'}</span>
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/crop-advisory')}
                            className="text-xs font-bold text-white bg-gradient-to-r from-green-600 to-green-400 px-4 py-2 rounded-lg"
                        >
                            View Details
                        </button>
                    </div>

                    {/* Market Trend — real data */}
                    <div className="bg-[#121418] rounded-xl p-4 border border-gray-800 flex justify-between items-center border-l-4 border-l-orange-500">
                        <div className="flex items-start">
                            <div className="mr-3">
                                <TrendingUp className="text-orange-500" size={20} />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-gray-100">Market Trend</h4>
                                <p className="text-xs text-gray-400">
                                    {loadingMarket ? (
                                        'Loading prices...'
                                    ) : marketData ? (
                                        <>
                                            {marketData.crop} at{' '}
                                            <span className={`font-bold ${marketData.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                                                {marketData.price}
                                            </span>{' '}
                                            ({marketData.change}) · {marketData.mandi}
                                        </>
                                    ) : (
                                        `${user?.crop || 'Cotton'} — check latest prices`
                                    )}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/market')}
                            className="text-xs font-bold text-white bg-gradient-to-r from-orange-600 to-orange-400 px-4 py-2 rounded-lg"
                        >
                            View Trends
                        </button>
                    </div>

                </div>

                {/* Schemes */}
                <section>
                    <div className="flex justify-between mb-4">
                        <h2 className="text-lg font-bold text-white">Recommended Schemes</h2>
                        <button
                            onClick={() => navigate('/schemes')}
                            className="text-xs text-green-400 flex items-center"
                        >
                            View All <ChevronRight size={14} />
                        </button>
                    </div>

                    {loadingSchemes ? (
                        <div className="animate-pulse bg-[#121418] rounded-xl h-20" />
                    ) : schemes.map((scheme, i) => {
                        const theme = getSchemeTheme(i);
                        return (
                            <div
                                key={scheme.id}
                                className={`bg-[#121418] rounded-xl p-4 border border-gray-800 flex justify-between items-center ${theme.border} border-l-4`}
                            >
                                <div className="flex items-start">
                                    <div className="mr-3">{theme.icon}</div>
                                    <div>
                                        <h4 className="text-sm font-bold">{scheme.title}</h4>
                                        <p className="text-xs text-gray-400">{scheme.description}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => window.open(scheme.link, '_blank')}
                                    className={`text-xs font-bold text-white bg-gradient-to-r ${theme.btn} px-4 py-2 rounded-lg`}
                                >
                                    Apply
                                </button>
                            </div>
                        );
                    })}
                </section>

            </div>
        </div>
    );
}