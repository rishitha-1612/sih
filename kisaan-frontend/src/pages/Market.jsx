import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, MapPin, Search } from 'lucide-react';
import { useStore } from '../store/useStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Market() {
    const user = useStore(state => state.user);
    const [searchQuery, setSearchQuery] = useState('');
    const [prices, setPrices]           = useState([]);
    const [loading, setLoading]         = useState(true);

    useEffect(() => {
        const fetchMarket = async () => {
            try {
                // ✅ Fixed: VITE_API_URL + crop_type fallback
                const crop     = user?.crop_type || user?.crop || '';
                const location = user?.location  || '';
                const res      = await fetch(`${API_URL}/api/market?crop=${crop}&location=${location}`);
                const data     = await res.json();
                setPrices(data);
            } catch (error) {
                console.error('Failed to fetch market rates:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user) fetchMarket();
    }, [user]);

    const filteredPrices = prices.filter(item =>
        item.crop.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const topCrop = prices[0];

    return (
        <div className="p-4 bg-transparent min-h-screen">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Market Insights</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 flex items-center">
                <MapPin size={16} className="mr-1" /> Near {user?.location || 'Your area'}
            </p>

            {/* Search */}
            <div className="relative mb-6">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={18} className="text-gray-400" />
                </div>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for a crop..."
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm focus:ring-kisaan-500 focus:border-kisaan-500 shadow-sm"
                />
            </div>

            {/* Prices Table */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <h2 className="font-semibold text-gray-800 dark:text-gray-200">Today's Mandi Rates</h2>
                </div>

                {loading ? (
                    <div className="p-8">
                        <div className="animate-pulse flex flex-col space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex justify-between">
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                        {filteredPrices.length > 0 ? (
                            filteredPrices.map((item, index) => (
                                // ✅ Fixed: use index fallback for key
                                <li key={item.id ?? index} className="p-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white">{item.crop}</h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{item.mandi}</p>
                                        {item.date && (
                                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{item.date}</p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-lg text-gray-900 dark:text-white">{item.price}</p>
                                        <div className={`flex items-center justify-end text-xs font-medium ${
                                            item.trend === 'up'
                                                ? 'text-green-600 dark:text-green-400'
                                                : 'text-red-600 dark:text-red-400'
                                        }`}>
                                            {item.trend === 'up'
                                                ? <TrendingUp size={14} className="mr-1" />
                                                : <TrendingDown size={14} className="mr-1" />
                                            }
                                            {item.change}
                                        </div>
                                    </div>
                                </li>
                            ))
                        ) : (
                            <li className="p-8 text-center text-gray-500 dark:text-gray-400">
                                No matching crops found.
                            </li>
                        )}
                    </ul>
                )}
            </div>

            {/* Smart Selling Tip */}
            {topCrop?.trend === 'up' && (
                <div className="mt-6 bg-kisaan-50 dark:bg-kisaan-900/40 p-4 rounded-xl border border-kisaan-100 dark:border-kisaan-800 transition-transform hover:-translate-y-1">
                    <h3 className="text-sm font-semibold text-kisaan-800 dark:text-kisaan-300">💡 Smart Selling Tip</h3>
                    <p className="text-xs text-kisaan-700 dark:text-kisaan-400 mt-2">
                        Prices for {topCrop.crop} are trending up today in {topCrop.mandi}. Consider selling a portion now to lock in gains.
                    </p>
                </div>
            )}
        </div>
    );
}