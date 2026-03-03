import { useState, useRef, useEffect } from "react";
import { useStore } from "../store/useStore";
import {
  Leaf,
  MapPin,
  Search,
  Navigation,
  ChevronRight,
  Check,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function LocationPicker({ position, setPosition, setLocationName }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      fetchLocationName(e.latlng.lat, e.latlng.lng);
    },
  });

  const fetchLocationName = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      );
      const data = await res.json();
      if (data && data.address) {
        const cityOrDistrict =
          data.address.city ||
          data.address.state_district ||
          data.address.county ||
          data.address.state;
        setLocationName(cityOrDistrict || "Unknown Location");
      }
    } catch (error) {
      console.error("Failed to fetch location name", error);
      setLocationName(`${lat.toFixed(2)}, ${lng.toFixed(2)}`);
    }
  };

  return position === null ? null : <Marker position={position} />;
}

function MapUpdater({ center }) {
  const map = useMap();
  map.setView(center);
  return null;
}

export default function Onboarding() {
  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const isUpdateMode = Boolean(user?.crop && user?.location);

  // Dynamically retrieve initial step and default to 1, listening to param changes
  const initialStep = parseInt(searchParams.get("step")) || 1;
  const [step, setStep] = useState(initialStep);

  useEffect(() => {
    const stepFromUrl = parseInt(searchParams.get("step")) || 1;
    setStep(stepFromUrl);
  }, [searchParams]);

  const [crop, setCrop] = useState(user?.crop || "");
  const [position, setPosition] = useState(null); // {lat, lng}
  const [locationName, setLocationName] = useState(user?.location || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]); // Default India
  const [loading, setLoading] = useState(false);

  const handleSearchLocation = async () => {
    if (!searchQuery) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`,
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        setMapCenter([lat, lon]);
        setPosition({ lat, lng: lon });
        setLocationName(data[0].display_name.split(",")[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAutoDetect = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setMapCenter([lat, lng]);
          setPosition({ lat, lng });

          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
            );
            const data = await res.json();
            if (data && data.address) {
              const cityOrDistrict =
                data.address.city ||
                data.address.state_district ||
                data.address.county ||
                data.address.state;
              setLocationName(cityOrDistrict || "Unknown Location");
            }
          } catch (e) {
            setLocationName(`${lat.toFixed(2)}, ${lng.toFixed(2)}`);
          }
        },
        (err) => {
          alert("Geolocation access denied or failed.");
        },
      );
    } else {
      alert("Geolocation not supported by this browser.");
    }
  };

  const handleComplete = async () => {
    if (!crop || !locationName) return;
    setLoading(true);
    try {
      const payload = { userId: user.id, crop, location: locationName };
      const res = await fetch("http://localhost:5000/api/users/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setUser({ ...user, crop, location: locationName });
        navigate("/");
      } else {
        alert("Failed to save profile setup.");
      }
    } catch (err) {
      console.error(err);
      alert("Error connecting to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="p-6 pb-2 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center text-kisaan-600 mb-2">
          <Leaf className="mr-2" />
          <span className="font-bold text-lg text-gray-900 dark:text-white">
            KisaanKonnect
          </span>
        </div>
        {!isUpdateMode && (
          <div className="flex items-center mb-4">
            <div
              className={`flex-1 h-1.5 rounded-l-full ${step >= 1 ? "bg-kisaan-500" : "bg-gray-200 dark:bg-gray-700"}`}
            ></div>
            <div
              className={`flex-1 h-1.5 rounded-r-full ml-1 ${step >= 2 ? "bg-kisaan-500" : "bg-gray-200 dark:bg-gray-700"}`}
            ></div>
          </div>
        )}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {step === 1 ? "What do you grow?" : "Where is your farm?"}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {step === 1
            ? "We will personalize insights for your main crop."
            : "Helps us fetch local mandi prices and weather."}
        </p>
      </header>

      {/* Content Body */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col">
        {step === 1 && (
          <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Main Crop
            </label>
            <input
              type="text"
              value={crop}
              onChange={(e) => setCrop(e.target.value)}
              className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-kisaan-500 focus:ring-kisaan-500 p-4 bg-gray-50 dark:bg-gray-800 text-lg"
              placeholder="e.g. Cotton, Wheat, Sugarcane"
              autoFocus
            />

            {/* Quick Picks */}
            <div className="mt-8">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Popular Options
              </h3>
              <div className="flex flex-wrap gap-2">
                {[
                  "Cotton",
                  "Wheat",
                  "Soybean",
                  "Rice",
                  "Sugarcane",
                  "Onion",
                  "Tomato",
                ].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setCrop(preset)}
                    className={`px-4 py-2 rounded-full border text-sm transition-colors ${crop === preset ? "bg-kisaan-50 border-kisaan-500 text-kisaan-700 font-medium" : "bg-white border-gray-200 text-gray-600 hover:border-kisaan-300 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"}`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex-1 flex flex-col h-full w-full">
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search
                  className="absolute left-3 top-3.5 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full rounded-xl border-gray-200 shadow-sm pl-10 p-3 bg-gray-50 dark:bg-gray-800 focus:ring-kisaan-500 text-sm"
                  placeholder="Search city or district..."
                  onKeyDown={(e) => e.key === "Enter" && handleSearchLocation()}
                />
              </div>
              <button
                onClick={handleSearchLocation}
                className="px-4 bg-kisaan-600 text-white rounded-xl text-sm font-medium hover:bg-kisaan-700"
              >
                Search
              </button>
              <button
                onClick={handleAutoDetect}
                className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100"
                title="Auto-detect GPS"
              >
                <Navigation size={20} />
              </button>
            </div>

            <div className="relative flex-1 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-inner z-0 min-h-[300px]">
              <MapContainer
                center={mapCenter}
                zoom={5}
                style={{ height: "100%", width: "100%", zIndex: 1 }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OpenStreetMap"
                />
                <LocationPicker
                  position={position}
                  setPosition={setPosition}
                  setLocationName={setLocationName}
                />
                <MapUpdater center={mapCenter} />
              </MapContainer>
              <div className="absolute bottom-4 left-0 right-0 z-[1000] flex justify-center pointer-events-none">
                <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur px-4 py-2 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 pointer-events-auto">
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center">
                    <MapPin size={14} className="mr-1 text-kisaan-600" />
                    {locationName || "Tap the map to select location"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-gray-100 dark:border-gray-800">
        {step === 1 ? (
          <button
            disabled={!crop || loading}
            onClick={isUpdateMode ? handleComplete : () => setStep(2)}
            className="w-full flex justify-center items-center py-4 px-4 rounded-xl shadow-sm text-lg font-bold text-white bg-kisaan-600 hover:bg-kisaan-700 disabled:opacity-50 transition-all"
          >
            {loading ? "Saving..." : isUpdateMode ? "Save Crop" : "Continue"}{" "}
            {!isUpdateMode && <ChevronRight className="ml-2" />}
          </button>
        ) : (
          <div className="flex gap-3">
            {!isUpdateMode && (
              <button
                onClick={() => setStep(1)}
                className="px-6 py-4 rounded-xl font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
              >
                Back
              </button>
            )}
            <button
              disabled={!position || !locationName || loading}
              onClick={handleComplete}
              className="flex-1 flex justify-center items-center py-4 px-4 rounded-xl shadow-sm text-lg font-bold text-white bg-kisaan-600 hover:bg-kisaan-700 disabled:opacity-50 transition-all"
            >
              {loading
                ? "Saving..."
                : isUpdateMode
                  ? "Save Location"
                  : "Finish Setup"}{" "}
              <Check className="ml-2" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
