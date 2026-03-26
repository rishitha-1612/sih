import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import {
    FlaskConical, Wind, MapPin, ChevronDown, ChevronUp, ArrowLeft
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function SectionCard({ title, icon, children, defaultOpen = true }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="bg-[#0f1510] border border-white/8 rounded-2xl overflow-hidden mb-4 shadow-xl">
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-5 py-4 text-left"
            >
                <span className="flex items-center gap-2 font-bold text-sm text-green-400">
                    {icon}{title}
                </span>
                {open
                    ? <ChevronUp size={16} className="text-gray-500" />
                    : <ChevronDown size={16} className="text-gray-500" />
                }
            </button>
            {open && <div className="px-5 pb-5">{children}</div>}
        </div>
    );
}

export default function CropAdvisory() {
    const navigate = useNavigate();
    const user             = useStore(state => state.user);
    const advisoryResult   = useStore(state => state.advisoryResult);
    const setAdvisoryResult = useStore(state => state.setAdvisoryResult);
    const clearAdvisoryResult = useStore(state => state.clearAdvisoryResult);

    const crop     = user?.crop_type || user?.crop || 'Maize';
    const location = user?.location  || 'Bangalore';

    const [weather, setWeather] = useState({
        temp: '28', condition: '', rainChance: 60, windSpeed: 10, humidity: 70
    });
    const [loading, setLoading]               = useState(true);
    const [advisoryLoading, setAdvisoryLoading] = useState(false);
    const [soilParams, setSoilParams]         = useState({
        SoilType: 'Loamy', Nitrogen: '', Phosphorous: '', Potassium: ''
    });

    // Fetch weather
    useEffect(() => {
        const fetchWeather = async () => {
            try {
                const res  = await fetch(`https://wttr.in/${encodeURIComponent(location)}?format=j1`);
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
            } catch (err) {
                console.error('Weather error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchWeather();
    }, [location]);

    const handleAdvisorySubmit = async (e) => {
        e.preventDefault();
        setAdvisoryLoading(true);
        try {
            const userId = user?._id || user?.id;
            const res = await fetch(`${API_URL}/api/advisory/recommend`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id:     userId,
                    Temparature: parseFloat(weather.temp),
                    Humidity:    Number(weather.humidity),
                    Moisture:    weather.rainChance * 0.7,
                    SoilType:    soilParams.SoilType,
                    CropType:    crop,
                    Nitrogen:    Number(soilParams.Nitrogen),
                    Phosphorous: Number(soilParams.Phosphorous),
                    Potassium:   Number(soilParams.Potassium)
                })
            });
            const result = await res.json();
            setAdvisoryResult(result);
        } catch (err) {
            console.error('Advisory error:', err);
        } finally {
            setAdvisoryLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-transparent text-gray-100 pb-16">

            {/* Header */}
            <div className="sticky top-0 bg-[#0a0d0b]/80 backdrop-blur border-b border-white/5 px-4 py-3 flex items-center gap-3">
                <button onClick={() => navigate('/')}>
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <h1 className="font-bold text-white">Crop Advisory</h1>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                        <MapPin size={11} /> {location} · {crop}
                    </p>
                </div>
            </div>

            <div className="max-w-lg mx-auto px-4 pt-5">

                {/* Weather Card */}
                <div className="bg-blue-600 rounded-2xl p-5 mb-5">
                    <h2 className="text-4xl font-bold">
                        {loading ? '...' : `${weather.temp}°C`}
                    </h2>
                    <p>{weather.condition}</p>
                    <p className="text-sm mt-2">
                        💧 Humidity: {weather.humidity}% | 🌧 Rain: {weather.rainChance}%
                    </p>
                </div>

                {/* Soil Form */}
                <SectionCard title="Enter Soil Details" icon={<FlaskConical size={16} />}>
                    <form onSubmit={handleAdvisorySubmit} className="space-y-4">
                        <select
                            value={soilParams.SoilType}
                            onChange={e => setSoilParams({ ...soilParams, SoilType: e.target.value })}
                            className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-white"
                        >
                            <option>Loamy</option>
                            <option>Sandy</option>
                            <option>Clay</option>
                            <option>Black</option>
                            <option>Red</option>
                            <option>Alluvial</option>
                        </select>

                        {['Nitrogen', 'Phosphorous', 'Potassium'].map(field => (
                            <input
                                key={field}
                                type="number"
                                placeholder={field}
                                required
                                value={soilParams[field]}
                                onChange={e => setSoilParams({ ...soilParams, [field]: e.target.value })}
                                className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-gray-500"
                            />
                        ))}

                        <button
                            type="submit"
                            className="w-full bg-green-600 hover:bg-green-500 py-3 rounded-xl font-bold transition-colors"
                        >
                            {advisoryLoading ? 'Analyzing...' : 'Get Recommendation'}
                        </button>
                    </form>

                    {advisoryResult && (
                        <div className="mt-5 p-4 bg-green-500/10 border border-green-500/30 rounded-xl relative group">
                            <button
                                onClick={clearAdvisoryResult}
                                className="absolute top-2 right-2 p-1 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg transition-colors"
                                title="Clear Recommendation"
                            >
                                <ArrowLeft size={14} className="rotate-45" />
                            </button>
                            <p className="text-green-400 text-xs font-bold mb-1">
                                Recommended Fertilizer
                            </p>
                            <h3 className="text-xl font-bold text-white">
                                {advisoryResult.fertilizer}
                            </h3>
                            <p className="text-xs text-gray-500 mt-2">
                                Based on {crop} · {soilParams.SoilType} soil · {weather.temp}°C
                            </p>
                        </div>
                    )}
                </SectionCard>
            </div>
        </div>
    );
}