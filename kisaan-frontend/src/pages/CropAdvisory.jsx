import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';

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


// section card
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

                {open
                    ? <ChevronUp size={16} className="text-gray-500" />
                    : <ChevronDown size={16} className="text-gray-500" />
                }

            </button>

            {open && <div className="px-5 pb-5">{children}</div>}

        </div>
    );
}



// main page
export default function CropAdvisory() {

    const navigate = useNavigate();
    const user = useStore(state => state.user);

    const [weather, setWeather] = useState({
        temp: '28',
        condition: 'Partly Cloudy',
        rainChance: 60,
        windSpeed: 12
    });

    const [soilMoisture] = useState(55);
    const [loading, setLoading] = useState(true);
    const [advisoryLoading, setAdvisoryLoading] = useState(false);

    const [soilParams, setSoilParams] = useState({
        n: '',
        p: '',
        k: '',
        ph: '',
        rainfall: ''
    });

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
                    humidity: 50
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
                    windSpeed: cur.windspeedKmph
                });

            } catch {

                // keep default weather

            } finally {

                setLoading(false);

            }

        };

        fetchWeather();

    }, [location]);


    const tempC = parseFloat(weather.temp);

    const data = getCropData(
        crop,
        tempC,
        weather.rainChance,
        soilMoisture
    );

    const col = colorMap[data.color] || colorMap.green;



    return (

        <div className="min-h-screen bg-[#0a0d0b] text-gray-100 font-sans pb-16">

            {/* HEADER */}

            <div className="sticky top-0 z-20 bg-[#0a0d0b]/90 backdrop-blur-md border-b border-white/5 px-4 py-3 flex items-center gap-3">

                <button
                    onClick={() => navigate('/')}
                    className="p-2 rounded-full hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                >
                    <ArrowLeft size={18} />
                </button>

                <div>

                    <h1 className="font-extrabold text-white text-base leading-tight">
                        Crop Advisory
                    </h1>

                    <p className="text-xs text-gray-400 flex items-center gap-1">
                        <MapPin size={11} /> {location} · {crop} {data.emoji}
                    </p>

                </div>

                <span className="ml-auto text-[10px] font-semibold bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-1 rounded-full animate-pulse">
                    ● Live
                </span>

            </div>



            <div className="max-w-lg mx-auto px-4 pt-5">


                {/* WEATHER */}

                <div className="relative overflow-hidden rounded-2xl mb-5 p-5 bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 shadow-[0_8px_30px_rgba(14,165,233,0.2)]">

                    <p className="text-blue-100 text-xs font-medium mb-1 flex items-center gap-1">
                        <MapPin size={11}/> {location}
                    </p>

                    <div className="flex items-end justify-between">

                        <div>

                            <h2 className="text-5xl font-black text-white">
                                {loading ? '...' : `${weather.temp}°C`}
                            </h2>

                            <p className="text-blue-100 text-sm mt-1">
                                {weather.condition} · {tempLabel(weather.temp)}
                            </p>

                        </div>

                        <div className="text-right">

                            <div className="inline-flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-full text-white text-xs font-semibold mb-1">
                                <CloudRain size={13}/> Rain: {weather.rainChance}%
                            </div>

                            <br/>

                            <div className="inline-flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-full text-white text-xs font-semibold">
                                <Wind size={13}/> {weather.windSpeed} km/h
                            </div>

                        </div>

                    </div>

                </div>



                {/* SOIL FORM */}

                <SectionCard
                    title="Get Personalized Advisory"
                    icon={<FlaskConical size={16}/>}
                >

                    <form onSubmit={handleAdvisorySubmit} className="space-y-4">

                        <div className="grid grid-cols-2 gap-3">

                            <input
                                type="number"
                                placeholder="Nitrogen"
                                required
                                value={soilParams.n}
                                onChange={e => setSoilParams({ ...soilParams, n: e.target.value })}
                                className="bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm"
                            />

                            <input
                                type="number"
                                placeholder="Phosphorus"
                                required
                                value={soilParams.p}
                                onChange={e => setSoilParams({ ...soilParams, p: e.target.value })}
                                className="bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm"
                            />

                            <input
                                type="number"
                                placeholder="Potassium"
                                required
                                value={soilParams.k}
                                onChange={e => setSoilParams({ ...soilParams, k: e.target.value })}
                                className="bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm"
                            />

                            <input
                                type="number"
                                placeholder="Soil pH"
                                step="0.1"
                                required
                                value={soilParams.ph}
                                onChange={e => setSoilParams({ ...soilParams, ph: e.target.value })}
                                className="bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm"
                            />

                        </div>

                        <input
                            type="number"
                            placeholder="Expected Rainfall"
                            required
                            value={soilParams.rainfall}
                            onChange={e => setSoilParams({ ...soilParams, rainfall: e.target.value })}
                            className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm"
                        />

                        <button
                            type="submit"
                            disabled={advisoryLoading}
                            className="w-full py-3 rounded-xl font-bold text-sm bg-green-600 hover:bg-green-500"
                        >
                            {advisoryLoading ? 'Analyzing Soil...' : 'Generate New Advisory'}
                        </button>

                    </form>


                    {advisoryResult && (

                        <div className="mt-5 p-4 rounded-2xl bg-green-500/10 border border-green-500/30">

                            <p className="text-xs text-green-400 font-bold mb-2">
                                Recommended Crop
                            </p>

                            <h3 className="text-xl font-black text-white capitalize">
                                {advisoryResult.crop}
                            </h3>

                            <p
                                className="text-sm text-gray-200 mt-3"
                                dangerouslySetInnerHTML={{
                                    __html: advisoryResult.fertilizer
                                }}
                            />

                        </div>

                    )}

                </SectionCard>


                {/* PRIORITY ALERT */}

                <div className={`flex items-start gap-3 rounded-2xl p-4 mb-5 border ${col.border} ${col.bg}`}>

                    <AlertTriangle size={20} className={`${col.text} mt-0.5`} />

                    <p className="text-xs text-gray-300 leading-relaxed">
                        At <span className="text-white font-semibold">{weather.temp}°C</span>
                        and <span className="text-white font-semibold">{soilMoisture}% soil moisture</span>,
                        applying <span className="text-white font-semibold">
                        {data.fertilizers[0].dose} of Urea
                        </span> within the next
                        <span className="text-white font-semibold"> 3 days</span>
                        is recommended.
                    </p>

                </div>


                {/* DISCLAIMER */}

                <div className="flex items-start gap-2 text-[10px] text-gray-500 mt-2 mb-6">

                    <Info size={12}/>

                    <p>
                        Recommendations are generated based on weather, crop type ({crop}),
                        and location ({location}). For precise soil analysis consult
                        your local Krishi Vigyan Kendra (KVK).
                    </p>

                </div>

            </div>

        </div>
    );
}