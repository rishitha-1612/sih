import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import {
    Leaf, Droplets, CloudRain, Thermometer, Calendar, Clock,
    AlertTriangle, CheckCircle2, FlaskConical, Wind, Sun,
    MapPin, Sprout, Info, ChevronDown, ChevronUp, ArrowLeft
} from 'lucide-react';

import { tempLabel, getCropData } from '../utils/farmingUtils';


const colorMap = {
    green: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400', badge: 'bg-green-500/20 text-green-300 border-green-500/40' },
    yellow: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' },
    teal: { bg: 'bg-teal-500/10', border: 'border-teal-500/30', text: 'text-teal-400', badge: 'bg-teal-500/20 text-teal-300 border-teal-500/40' },
};

// ----------- section card -----------
function SectionCard({ title, icon, children, defaultOpen = true, accentClass = 'text-green-400' }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="bg-[#0f1510] border border-white/8 rounded-2xl overflow-hidden mb-4 shadow-xl">
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-5 py-4 text-left"
            >
                <span className={`flex items-center gap-2 font-bold text-sm ${accentClass}`}>
                    {icon}
                    {title}
                </span>
                {open ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
            </button>
            {open && <div className="px-5 pb-5">{children}</div>}
        </div>
    );
}

// ----------- main page -----------
export default function CropAdvisory() {
    const user = useStore(state => state.user);
    const [weather, setWeather] = useState({ temp: '28', condition: 'Partly Cloudy', rainChance: 60, windSpeed: 12 });
    const [soilMoisture] = useState(55); // static mock — in prod, fetch from soil API
    const [loading, setLoading] = useState(true);
    const [advisoryLoading, setAdvisoryLoading] = useState(false);
    const [soilParams, setSoilParams] = useState({ n: '', p: '', k: '', ph: '', rainfall: '' });
    const [advisoryResult, setAdvisoryResult] = useState(null);

    const handleAdvisorySubmit = async (e) => {
        e.preventDefault();
        setAdvisoryLoading(true);
        try {
            const res = await fetch('http://localhost:5000/api/advisory/recommend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...soilParams,
                    temperature: weather.temp,
                    humidity: 50 // Default humidity if not available
                })
            });
            const result = await res.json();
            setAdvisoryResult(result);
        } catch (err) {
            console.error("Advisory API Error:", err);
        } finally {
            setAdvisoryLoading(false);
        }
    };

    const crop = user?.crop || 'Cotton';
    const location = user?.location || 'Arehalli, Karnataka';

    useEffect(() => {
        const fetchWeather = async () => {
            try {
                const res = await fetch(`https://wttr.in/${encodeURIComponent(location)}?format=j1`);
                if (!res.ok) throw new Error();
                const data = await res.json();
                const cur = data.current_condition[0];
                const rain = data.weather?.[0]?.hourly?.[4]?.chanceofrain || 60;
                setWeather({
                    temp: cur.temp_C,
                    condition: cur.weatherDesc[0].value,
                    rainChance: parseInt(rain),
                    windSpeed: cur.windspeedKmph,
                });
            } catch {
                // keep defaults
            } finally {
                setLoading(false);
            }
        };
        fetchWeather();
    }, [location]);

    const tempC = parseFloat(weather.temp);
    const data = getCropData(crop, tempC, weather.rainChance, soilMoisture);
    const col = colorMap[data.color] || colorMap.green;

    return (
        <div className="min-h-screen bg-[#0a0d0b] text-gray-100 font-sans pb-16">
            {/* ──── Header ──── */}
            <div className="sticky top-0 z-20 bg-[#0a0d0b]/90 backdrop-blur-md border-b border-white/5 px-4 py-3 flex items-center gap-3">
                <button
                    onClick={() => window.close()}
                    className="p-2 rounded-full hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                    aria-label="Close tab"
                >
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <h1 className="font-extrabold text-white text-base leading-tight">Crop Advisory</h1>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                        <MapPin size={11} /> {location} · {crop} {data.emoji}
                    </p>
                </div>
                <span className="ml-auto text-[10px] font-semibold bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-1 rounded-full animate-pulse">
                    ● Live
                </span>
            </div>

            <div className="max-w-lg mx-auto px-4 pt-5">

                {/* ──── Weather Snapshot ──── */}
                <div className="relative overflow-hidden rounded-2xl mb-5 p-5 bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 shadow-[0_8px_30px_rgba(14,165,233,0.2)]">
                    <div className="absolute -top-8 -right-8 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                    <p className="text-blue-100 text-xs font-medium mb-1 flex items-center gap-1">
                        <MapPin size={11} /> {location}
                    </p>
                    <div className="flex items-end justify-between">
                        <div>
                            <h2 className="text-5xl font-black text-white tracking-tighter">
                                {loading ? '...' : `${weather.temp}°C`}
                            </h2>
                            <p className="text-blue-100 text-sm mt-1">{weather.condition} · {tempLabel(weather.temp)}</p>
                        </div>
                        <div className="text-right">
                            <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur rounded-full px-3 py-1.5 text-white text-xs font-semibold mb-1 border border-white/20">
                                <CloudRain size={13} /> Rain: {weather.rainChance}%
                            </div>
                            <br />
                            <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur rounded-full px-3 py-1.5 text-white text-xs font-semibold border border-white/20">
                                <Wind size={13} /> {weather.windSpeed} km/h
                            </div>
                        </div>
                    </div>
                    {/* Soil moisture bar */}
                    <div className="mt-4 bg-black/20 rounded-xl p-3 border border-white/10">
                        <div className="flex justify-between text-blue-100 text-xs mb-1.5">
                            <span className="flex items-center gap-1"><Droplets size={11} /> Soil Moisture</span>
                            <span className="font-bold">{soilMoisture}%</span>
                        </div>
                        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-cyan-400 to-blue-300 rounded-full transition-all"
                                style={{ width: `${soilMoisture}%` }}
                            />
                        </div>
                        <p className="text-[10px] text-blue-200 mt-1">
                            {soilMoisture > 60 ? 'High – delay next irrigation' : soilMoisture > 40 ? 'Optimal for fertilizer application' : 'Low – irrigate before applying fertilizer'}
                        </p>
                    </div>
                </div>

                {/* ──── Soil Parameters Form ──── */}
                <SectionCard
                    title="Get Personalized Advisory"
                    icon={<FlaskConical size={16} />}
                >
                    <form onSubmit={handleAdvisorySubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] text-gray-400 block mb-1 uppercase tracking-wide">Nitrogen (N)</label>
                                <input
                                    type="number"
                                    value={soilParams.n}
                                    onChange={e => setSoilParams({ ...soilParams, n: e.target.value })}
                                    className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-green-500/50 outline-none"
                                    placeholder="e.g. 80"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-400 block mb-1 uppercase tracking-wide">Phosphorus (P)</label>
                                <input
                                    type="number"
                                    value={soilParams.p}
                                    onChange={e => setSoilParams({ ...soilParams, p: e.target.value })}
                                    className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-green-500/50 outline-none"
                                    placeholder="e.g. 40"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-400 block mb-1 uppercase tracking-wide">Potassium (K)</label>
                                <input
                                    type="number"
                                    value={soilParams.k}
                                    onChange={e => setSoilParams({ ...soilParams, k: e.target.value })}
                                    className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-green-500/50 outline-none"
                                    placeholder="e.g. 40"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-400 block mb-1 uppercase tracking-wide">Soil pH</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={soilParams.ph}
                                    onChange={e => setSoilParams({ ...soilParams, ph: e.target.value })}
                                    className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-green-500/50 outline-none"
                                    placeholder="e.g. 6.5"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] text-gray-400 block mb-1 uppercase tracking-wide">Expected Rainfall (mm)</label>
                            <input
                                type="number"
                                value={soilParams.rainfall}
                                onChange={e => setSoilParams({ ...soilParams, rainfall: e.target.value })}
                                className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-green-500/50 outline-none"
                                placeholder="e.g. 100"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={advisoryLoading}
                            className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${advisoryLoading ? 'bg-gray-600' : 'bg-green-600 hover:bg-green-500 shadow-lg shadow-green-900/20'}`}
                        >
                            {advisoryLoading ? 'Analyzing Soil...' : 'Generate New Advisory'}
                        </button>
                    </form>

                    {advisoryResult && (
                        <div className="mt-6 animate-in fade-in slide-in-from-top-2 duration-500">
                            <div className="p-4 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/5 border border-green-500/30">
                                <p className="text-[10px] text-green-400 font-bold uppercase tracking-widest mb-2">Recommended Crop</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center text-2xl border border-green-500/30">
                                        🌱
                                    </div>
                                    <h3 className="text-2xl font-black text-white capitalize">{advisoryResult.crop}</h3>
                                </div>
                                <div className="mt-4 pt-4 border-t border-white/10">
                                    <p className="text-[10px] text-yellow-400 font-bold uppercase tracking-widest mb-2">Fertilizer Advice</p>
                                    <p className="text-sm text-gray-200 leading-relaxed" dangerouslySetInnerHTML={{ __html: advisoryResult.fertilizer }} />
                                </div>
                            </div>
                        </div>
                    )}
                </SectionCard>

                {/* ──── Priority Alert ──── */}
                <div className={`flex items-start gap-3 rounded-2xl p-4 mb-5 border ${col.border} ${col.bg}`}>
                    <AlertTriangle size={20} className={`${col.text} mt-0.5 flex-shrink-0`} />
                    <div>
                        <p className={`text-sm font-bold ${col.text}`}>Priority Action</p>
                        <p className="text-xs text-gray-300 leading-relaxed mt-1">
                            At <span className="text-white font-semibold">{weather.temp}°C</span> and{' '}
                            <span className="text-white font-semibold">{soilMoisture}% soil moisture</span> in{' '}
                            {location}, applying <span className="text-white font-semibold">
                                {getCropData(crop, tempC, weather.rainChance, soilMoisture).fertilizers[0].dose} of Urea
                            </span> within the next <span className="text-white font-semibold">3 days</span> is recommended — light rain expected which will aid absorption.
                        </p>
                    </div>
                </div>

                {/* ──── Fertilizer & Manure ──── */}
                <SectionCard
                    title="Fertilizer & Manure Recommendation"
                    icon={<FlaskConical size={16} />}
                    accentClass={col.text}
                >
                    <div className={`flex items-start gap-2 p-3 rounded-xl mb-4 ${col.bg} border ${col.border}`}>
                        <Sprout size={15} className={`${col.text} mt-0.5 flex-shrink-0`} />
                        <div>
                            <p className="text-xs font-semibold text-white">Recommended Manure</p>
                            <p className="text-xs text-gray-300">{data.manure}</p>
                            <p className={`text-[11px] font-medium mt-0.5 ${col.text}`}>{data.manureQty}</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {data.fertilizers.map((f, i) => (
                            <div key={i} className="flex items-start gap-3 bg-[#151a12] border border-white/8 rounded-xl p-4">
                                <span className="text-xl">{f.icon}</span>
                                <div className="flex-1">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <p className="text-sm font-bold text-white">{f.name}</p>
                                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${col.badge}`}>
                                            {f.dose}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                        <Clock size={11} className="flex-shrink-0" /> {f.timing}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </SectionCard>

                {/* ──── Water Management ──── */}
                <SectionCard
                    title="Water & Irrigation Management"
                    icon={<Droplets size={16} />}
                    accentClass="text-cyan-400"
                >
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-[#0b1418] border border-cyan-500/20 rounded-xl p-3">
                            <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-wide">Amount</p>
                            <p className="text-sm font-bold text-cyan-300">{data.waterMgmt.amount}</p>
                        </div>
                        <div className="bg-[#0b1418] border border-cyan-500/20 rounded-xl p-3">
                            <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-wide">Schedule</p>
                            <p className="text-sm font-bold text-cyan-300">{data.waterMgmt.schedule}</p>
                        </div>
                    </div>
                    <div className="bg-[#0b1418] border border-cyan-500/20 rounded-xl p-3 mb-3">
                        <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-wide flex items-center gap-1">
                            <Calendar size={11} /> Critical Stages
                        </p>
                        <p className="text-xs text-white font-medium">{data.waterMgmt.peak}</p>
                    </div>
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-500/10 border border-blue-500/30">
                        <CloudRain size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-gray-300 leading-relaxed">{data.waterMgmt.rainfallAdj}</p>
                    </div>
                </SectionCard>

                {/* ──── Weather-Based Guidance ──── */}
                <SectionCard
                    title="Weather-Based Guidance"
                    icon={<Sun size={16} />}
                    accentClass="text-orange-400"
                >
                    <div className="space-y-3">
                        <div className="flex items-start gap-3 bg-[#1a120b] border border-orange-500/20 rounded-xl p-4">
                            <Thermometer size={16} className="text-orange-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-xs font-bold text-orange-300 mb-1">Temperature: {weather.temp}°C ({tempLabel(weather.temp)})</p>
                                <p className="text-xs text-gray-400 leading-relaxed">
                                    {tempC > 32
                                        ? 'High heat increases nitrogen volatilization. Apply Urea in the evening and ensure fields are moist.'
                                        : tempC > 25
                                            ? 'Optimal temperature range. Fertilizer absorption is at its best. Apply as scheduled.'
                                            : 'Cool temperatures slow nutrient uptake. Consider delaying foliar spray by 2 days.'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 bg-[#0b1418] border border-blue-500/20 rounded-xl p-4">
                            <CloudRain size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-xs font-bold text-blue-300 mb-1">Rainfall Forecast: {weather.rainChance}% chance</p>
                                <p className="text-xs text-gray-400 leading-relaxed">
                                    {weather.rainChance > 70
                                        ? '⚠️ Heavy rain risk — delay granular fertilizer application to prevent runoff and leaching.'
                                        : weather.rainChance > 40
                                            ? '✅ Light rain expected — ideal window to apply top-dress Urea. Rain will dissolve and push nitrogen to roots.'
                                            : '🌵 Low rain probability — irrigate lightly before applying fertilizer to prevent burning.'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 bg-[#10180f] border border-green-500/20 rounded-xl p-4">
                            <Wind size={16} className="text-green-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-xs font-bold text-green-300 mb-1">Wind: {weather.windSpeed} km/h</p>
                                <p className="text-xs text-gray-400 leading-relaxed">
                                    {parseInt(weather.windSpeed) > 20
                                        ? '⚠️ High wind — avoid foliar spray applications. Granular application recommended instead.'
                                        : '✅ Low wind speed — safe for both foliar spray and granular application.'}
                                </p>
                            </div>
                        </div>
                    </div>
                </SectionCard>

                {/* ──── Actionable Tips ──── */}
                <SectionCard
                    title="Step-by-Step Actionable Tips"
                    icon={<CheckCircle2 size={16} />}
                    accentClass="text-lime-400"
                >
                    <ol className="space-y-3">
                        {data.tips.map((tip, i) => (
                            <li key={i} className="flex items-start gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-lime-500/20 border border-lime-500/40 text-lime-400 text-xs font-bold flex items-center justify-center mt-0.5">
                                    {i + 1}
                                </span>
                                <p className="text-xs text-gray-300 leading-relaxed">{tip}</p>
                            </li>
                        ))}
                    </ol>
                </SectionCard>

                {/* ──── Disclaimer ──── */}
                <div className="flex items-start gap-2 text-[10px] text-gray-500 mt-2 mb-6">
                    <Info size={12} className="flex-shrink-0 mt-0.5" />
                    <p>Recommendations are generated based on real-time weather data, your crop type ({crop}), and location ({location}). For precise soil recommendations, consult your local Krishi Vigyan Kendra (KVK).</p>
                </div>

            </div>
        </div>
    );
}
