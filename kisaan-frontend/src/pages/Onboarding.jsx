import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Leaf, MapPin, Search, Navigation, ChevronRight, Check } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// =============================================
// MAP HELPERS
// =============================================
function LocationPicker({ position, setPosition, setLocationName }) {
    useMapEvents({
        click(e) {
            setPosition(e.latlng);
            fetchLocationName(e.latlng.lat, e.latlng.lng);
        }
    });

    const fetchLocationName = async (lat, lng) => {
        try {
            const res  = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const data = await res.json();
            if (data?.address) {
                const name = data.address.city || data.address.state_district || data.address.county || data.address.state;
                setLocationName(name || 'Unknown Location');
            }
        } catch {
            setLocationName(`${lat.toFixed(2)}, ${lng.toFixed(2)}`);
        }
    };

    return position ? <Marker position={position} /> : null;
}

function MapUpdater({ center }) {
    const map = useMap();
    useEffect(() => { map.setView(center); }, [center, map]);
    return null;
}

// =============================================
// MAIN COMPONENT
// =============================================
export default function Onboarding() {
    const user    = useStore(state => state.user);
    const setUser = useStore(state => state.setUser);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const isUpdateMode = Boolean(user?.crop_type && user?.location);

    const [step, setStep]               = useState(parseInt(searchParams.get('step')) || 1);
    const [crop, setCrop]               = useState(user?.crop_type || '');
    const [position, setPosition]       = useState(null);
    const [locationName, setLocationName] = useState(user?.location || '');
    const [searchQuery, setSearchQuery] = useState('');
    const [mapCenter, setMapCenter]     = useState([20.5937, 78.9629]); // India center
    const [loading, setLoading]         = useState(false);

    useEffect(() => {
        setStep(parseInt(searchParams.get('step')) || 1);
    }, [searchParams]);

    // =============================================
    // LOCATION SEARCH
    // =============================================
    const handleSearchLocation = async () => {
        if (!searchQuery) return;
        try {
            const res  = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
            const data = await res.json();
            if (data?.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lon = parseFloat(data[0].lon);
                setMapCenter([lat, lon]);
                setPosition({ lat, lng: lon });
                setLocationName(data[0].display_name.split(',')[0]);
            }
        } catch (err) {
            console.error('Location search failed:', err);
        }
    };

    const handleAutoDetect = () => {
        if (!('geolocation' in navigator)) {
            alert('Geolocation not supported by this browser.');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                setMapCenter([lat, lng]);
                setPosition({ lat, lng });
                try {
                    const res  = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
                    const data = await res.json();
                    if (data?.address) {
                        const name = data.address.city || data.address.state_district || data.address.county || data.address.state;
                        setLocationName(name || 'Unknown Location');
                    }
                } catch {
                    setLocationName(`${lat.toFixed(2)}, ${lng.toFixed(2)}`);
                }
            },
            () => alert('Geolocation access denied or failed.')
        );
    };

    // =============================================
    // SAVE — fixed: use _id not id, use crop_type
    // =============================================
    const handleComplete = async () => {
        if (!crop || !locationName) return;
        setLoading(true);
        try {
            const userId = user?._id || user?.id;
            const res = await fetch(`${API_URL}/api/users/${userId}`, {
                method:  'PUT',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ crop_type: crop, location: locationName })
            });

            if (res.ok) {
                setUser({ ...user, crop_type: crop, crop: crop, location: locationName });
                navigate('/');
            } else {
                alert('Failed to save profile setup.');
            }
        } catch (err) {
            console.error('Onboarding save error:', err);
            alert('Error connecting to server.');
        } finally {
            setLoading(false);
        }
    };

    // =============================================
    // RENDER
    // =============================================
    return (
        <div className="flex flex-col h-screen bg-transparent text-gray-100 font-sans">

            {/* Header */}
            <header className="p-6 mb-4 bg-black/20 backdrop-blur-md border-b border-white/5 rounded-b-3xl shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center text-green-500">
                        <Leaf className="mr-2" size={24} />
                        <span className="font-black text-xl tracking-tight">Kisaan Konnect</span>
                    </div>
                    {!isUpdateMode && (
                        <div className="text-xs font-bold text-gray-500 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                            Step {step} of 2
                        </div>
                    )}
                </div>

                {!isUpdateMode && (
                    <div className="flex items-center mb-6 px-1">
                        <div className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${step >= 1 ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'bg-gray-800'}`}></div>
                        <div className={`flex-1 h-1.5 rounded-full ml-2 transition-all duration-500 ${step >= 2 ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'bg-gray-800'}`}></div>
                    </div>
                )}

                <h1 className="text-3xl font-extrabold text-white leading-tight">
                    {step === 1 ? 'What do you grow?' : 'Where is your farm?'}
                </h1>
                <p className="text-sm text-gray-400 mt-2 font-medium">
                    {step === 1
                        ? 'We will personalize insights for your main crop.'
                        : 'Helps us fetch local mandi prices and weather.'}
                </p>
            </header>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col">

                {/* Step 1 — Crop */}
                {step === 1 && (
                    <div className="flex-1 flex flex-col justify-center max-w-lg mx-auto w-full py-10">
                        <div className="bg-[#121418] border border-gray-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-1 h-full bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]"></div>

                            <label className="block text-xs font-black text-green-500 uppercase tracking-widest mb-4">
                                Main Crop Selection
                            </label>

                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                                <input
                                    type="text"
                                    value={crop}
                                    onChange={(e) => setCrop(e.target.value)}
                                    className="block w-full rounded-xl border border-white/5 focus:border-green-500/50 outline-none transition-all pl-12 p-4 bg-black/40 text-xl font-bold text-white placeholder-gray-600"
                                    placeholder="Search or enter crop..."
                                    autoFocus
                                />
                            </div>

                            <div className="mt-10">
                                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-5 border-b border-white/5 pb-2">
                                    Popular Options
                                </h3>
                                <div className="flex flex-wrap gap-3">
                                    {['Cotton', 'Wheat', 'Soybean', 'Rice', 'Sugarcane', 'Onion', 'Tomato'].map(preset => (
                                        <button
                                            key={preset}
                                            onClick={() => setCrop(preset)}
                                            className={`px-5 py-2.5 rounded-xl border transition-all transform hover:scale-105 ${
                                                crop === preset
                                                    ? 'bg-green-500/10 border-green-500 text-green-400 font-bold shadow-[0_0_15px_rgba(34,197,94,0.1)]'
                                                    : 'bg-white/5 border-white/5 text-gray-400 hover:border-gray-600 hover:text-white'
                                            }`}
                                        >
                                            {preset}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2 — Location */}
                {step === 2 && (
                    <div className="flex-1 flex flex-col h-full w-full max-w-2xl mx-auto py-4">
                        <div className="flex gap-3 mb-6">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearchLocation()}
                                    className="block w-full rounded-2xl border border-white/5 focus:border-green-500/30 outline-none transition-all pl-12 p-3.5 bg-[#121418] text-white text-sm shadow-xl"
                                    placeholder="Enter city, village or mandi name..."
                                />
                            </div>
                            <button
                                onClick={handleSearchLocation}
                                className="px-6 bg-green-600 hover:bg-green-500 text-white rounded-2xl text-sm font-bold transition-all shadow-lg shadow-green-900/20 active:scale-95 flex items-center gap-2"
                            >
                                <Search size={16} /> Search
                            </button>
                            <button
                                onClick={handleAutoDetect}
                                className="p-3.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-2xl hover:bg-blue-500/20 transition-all active:scale-95 shadow-xl"
                                title="Auto-detect GPS"
                            >
                                <Navigation size={20} />
                            </button>
                        </div>

                        <div className="relative flex-1 rounded-3xl overflow-hidden border border-white/10 shadow-2xl z-0 min-h-[350px] bg-black/30 group">
                            <MapContainer center={mapCenter} zoom={5} style={{ height: '100%', width: '100%', zIndex: 1 }}>
                                <TileLayer
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    attribution="&copy; OpenStreetMap"
                                />
                                <LocationPicker position={position} setPosition={setPosition} setLocationName={setLocationName} />
                                <MapUpdater center={mapCenter} />
                            </MapContainer>

                            {/* Decorative badge */}
                            <div className="absolute top-4 left-4 z-[1000] flex justify-center pointer-events-none">
                                <div className="bg-[#121418]/90 backdrop-blur-xl px-4 py-2.5 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-white/10 pointer-events-auto flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                                        <MapPin size={16} className="text-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Selected Region</p>
                                        <p className="text-sm font-bold text-white truncate max-w-[200px]">
                                            {locationName || 'Tap to select...'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-6">
                {step === 1 ? (
                    <button
                        disabled={!crop || loading}
                        onClick={isUpdateMode ? handleComplete : () => setStep(2)}
                        className="w-full max-w-lg mx-auto flex justify-center items-center py-4 px-6 rounded-2xl shadow-2xl text-xl font-black text-white bg-gradient-to-r from-green-600 to-green-400 hover:shadow-green-500/20 disabled:opacity-50 disabled:grayscale transition-all active:scale-[0.98]"
                    >
                        {loading ? 'Saving Profile...' : isUpdateMode ? 'Update Crop' : 'Continue Setting Up'}
                        {!isUpdateMode && <ChevronRight className="ml-2" size={20} />}
                    </button>
                ) : (
                    <div className="flex gap-4 max-w-2xl mx-auto w-full">
                        {!isUpdateMode && (
                            <button
                                onClick={() => setStep(1)}
                                className="px-8 py-4 rounded-2xl font-bold text-gray-300 bg-white/5 border border-white/5 hover:bg-white/10 transition-all active:scale-95"
                            >
                                Back
                            </button>
                        )}
                        <button
                            disabled={!position || !locationName || loading}
                            onClick={handleComplete}
                            className="flex-1 flex justify-center items-center py-4 px-6 rounded-2xl shadow-2xl text-xl font-black text-white bg-gradient-to-r from-green-600 to-green-400 hover:shadow-green-500/20 disabled:opacity-50 disabled:grayscale transition-all active:scale-[0.98]"
                        >
                            {loading ? 'Finalizing...' : isUpdateMode ? 'Update Farm Location' : 'Complete Onboarding'}
                            <Check className="ml-2" size={20} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}