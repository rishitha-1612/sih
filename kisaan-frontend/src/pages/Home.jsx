import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { CloudSun, Sprout, TrendingUp, ShieldAlert, ChevronRight, MapPin, Droplets, Wind, CloudRain, Leaf, Activity, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Home() {

    const navigate = useNavigate();
    const user = useStore(state => state.user);

    const [weather, setWeather] = useState({
        temp: '28',
        condition: 'Partly Cloudy',
        rainChance: 60,
        windSpeed: 12
    });

    const [schemes, setSchemes] = useState([]);
    const [loadingSchemes, setLoadingSchemes] = useState(true);

    useEffect(() => {

        const fetchWeather = async () => {
            const loc = user?.location || 'Arehalli, Karnataka';

            try {

                const res = await fetch(`https://wttr.in/${encodeURIComponent(loc)}?format=j1`);
                const data = await res.json();

                const current = data.current_condition[0];
                const rain = data.weather?.[0]?.hourly?.[4]?.chanceofrain || 60;

                setWeather({
                    temp: current.temp_C,
                    condition: current.weatherDesc[0].value,
                    rainChance: parseInt(rain),
                    windSpeed: current.windspeedKmph
                });

            } catch {

                setWeather({
                    temp: '28',
                    condition: 'Partly Cloudy',
                    rainChance: 60,
                    windSpeed: 12
                });

            }
        };

        const fetchSchemes = async () => {

            try {

                const res = await fetch(`http://localhost:5000/api/schemes?crop=${user?.crop}&location=${user?.location}`);
                const data = await res.json();

                setSchemes(data.slice(0, 1));

            } catch {

                setSchemes([
                    {
                        id: 1,
                        title: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
                        description: 'Crop insurance scheme providing financial support in case of crop failure.',
                        tags: ['Insurance', user?.crop || 'Cotton'],
                        type: 'green',
                        link: 'https://pmfby.gov.in/'
                    }
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


    const getSchemeTheme = (index) => {

        const type = index % 3 === 0 ? 'green' : index % 3 === 1 ? 'blue' : 'orange';

        if (type === 'green')
            return {
                border: 'border-l-green-500',
                icon: <ShieldAlert className="text-green-500" size={20} />,
                btn: 'from-green-600 to-green-400'
            };

        if (type === 'blue')
            return {
                border: 'border-l-blue-500',
                icon: <Activity className="text-blue-500" size={20} />,
                btn: 'from-blue-600 to-blue-400'
            };

        return {
            border: 'border-l-orange-500',
            icon: <Wallet className="text-orange-500" size={20} />,
            btn: 'from-orange-600 to-orange-400'
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
                        <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-green-400">
                            <Leaf size={14}/>
                            {user?.crop || 'Cotton'}
                        </span>
                    </div>

                </header>


                {/* Weather Card */}

                <section className="rounded-2xl p-5 mb-5 shadow-xl bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400">

                    <div className="flex items-center text-blue-50 mb-3">
                        <MapPin size={16} className="mr-1"/>
                        {user?.location || 'Arehalli'}
                    </div>

                    <div className="flex justify-between mb-5">

                        <h2 className="text-5xl font-black">{weather.temp}°C</h2>

                        <div className="flex items-center bg-white/20 px-3 py-1 rounded-full">
                            <CloudSun size={20} className="mr-2"/>
                            {weather.condition}
                        </div>

                    </div>

                    <div className="flex justify-between text-xs bg-black/10 p-3 rounded-xl">

                        <div className="flex items-center gap-1">
                            <Droplets size={14}/> Humidity 62%
                        </div>

                        <div className="flex items-center gap-1">
                            <Wind size={14}/> {weather.windSpeed} km/h
                        </div>

                        <div className="flex items-center gap-1">
                            <CloudRain size={14}/> {weather.rainChance}%
                        </div>

                    </div>

                </section>


                {/* Crop Advisory */}

                <div className="space-y-3 mb-6">

                    <div className="bg-[#121418] rounded-xl p-4 border border-gray-800 flex justify-between items-center border-l-4 border-l-green-500">

                        <div className="flex items-start">

                            <div className="mr-3">
                                <Sprout className="text-green-500" size={20}/>
                            </div>

                            <div>
                                <h4 className="text-sm font-bold text-gray-100">
                                    Crop Advisory
                                </h4>

                                <p className="text-xs text-gray-400">
                                    Apply Urea in <span className="text-green-400 font-bold">3 days</span> – Light rain expected
                                </p>
                            </div>

                        </div>

                        <button className="text-xs font-bold text-white bg-gradient-to-r from-green-600 to-green-400 px-4 py-2 rounded-lg">
                            View Details
                        </button>

                    </div>


                    {/* Market Trend */}

                    <div className="bg-[#121418] rounded-xl p-4 border border-gray-800 flex justify-between items-center border-l-4 border-l-orange-500">

                        <div className="flex items-start">

                            <div className="mr-3">
                                <TrendingUp className="text-orange-500" size={20}/>
                            </div>

                            <div>
                                <h4 className="text-sm font-bold text-gray-100">
                                    Market Trend
                                </h4>

                                <p className="text-xs text-gray-400">
                                    {user?.crop || 'Cotton'} prices <span className="text-orange-400 font-bold">↑ by 5%</span> in nearby Mandi
                                </p>
                            </div>

                        </div>

                        <button className="text-xs font-bold text-white bg-gradient-to-r from-orange-600 to-orange-400 px-4 py-2 rounded-lg">
                            View Trends
                        </button>

                    </div>

                </div>


                {/* Schemes */}

                <section>

                    <div className="flex justify-between mb-4">

                        <h2 className="text-lg font-bold text-white">
                            Recommended Schemes
                        </h2>

                        <button
                            onClick={() => navigate('/schemes')}
                            className="text-xs text-green-400 flex items-center"
                        >
                            View All <ChevronRight size={14}/>
                        </button>

                    </div>


                    {loadingSchemes ? (

                        <div className="animate-pulse bg-[#121418] rounded-xl h-20"/>

                    ) : schemes.map((scheme, i) => {

                        const theme = getSchemeTheme(i);

                        return (

                            <div
                                key={scheme.id}
                                className={`bg-[#121418] rounded-xl p-4 border border-gray-800 flex justify-between items-center ${theme.border} border-l-4`}
                            >

                                <div className="flex items-start">

                                    <div className="mr-3">
                                        {theme.icon}
                                    </div>

                                    <div>

                                        <h4 className="text-sm font-bold">
                                            {scheme.title}
                                        </h4>

                                        <p className="text-xs text-gray-400">
                                            {scheme.description}
                                        </p>

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