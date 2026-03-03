import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Award, Gift, ChevronRight, Zap, CheckCircle2 } from 'lucide-react';

export default function Rewards() {
    const { points, addPoints } = useStore();
    const [redeemedMsg, setRedeemedMsg] = useState(false);
    const [redeemedItems, setRedeemedItems] = useState([]);

    const rewards = [
        { icon: <Award className="text-amber-500" size={24} />, title: "Ask Kisaan AI", pts: "+20 pts" },
        { icon: <Zap className="text-blue-500" size={24} />, title: "Daily Login", pts: "+1 pt" },
        { icon: <Award className="text-green-500" size={24} />, title: "Crop Scan", pts: "+10 pts" },
    ]

    const catalog = [
        { id: 1, name: "Urea Fertilizer (10kg)", price: 300, pointsReq: 200 },
        { id: 2, name: "Hybrid Tomato Seeds", price: 150, pointsReq: 100 },
        { id: 3, name: "Organic Neem Oil (500ml)", price: 450, pointsReq: 300 },
        { id: 4, name: "Hand Trowel & Pruner", price: 800, pointsReq: 500 },
    ];

    const getDiscountedPrice = (price) => {
        // Give them a random-looking discount but consistently less than 20%
        // E.g., 15% discount
        const discountPercentage = 0.15;
        return Math.floor(price * (1 - discountPercentage));
    };

    const handleRedeemItem = (item) => {
        if (points >= item.pointsReq) {
            addPoints(-item.pointsReq);
            setRedeemedItems([...redeemedItems, item.id]);
            setRedeemedMsg(`Successfully redeemed a coupon for ${item.name}! (Offline mode)`);
            setTimeout(() => setRedeemedMsg(false), 3000);
        } else {
            alert(`Not enough points! You need ${item.pointsReq} points for ${item.name}.`);
        }
    };

    return (
        <div className="py-6 px-4 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="flex flex-col items-center mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
                <div className="w-24 h-24 bg-gradient-to-br from-yellow-300 to-amber-500 rounded-full flex items-center justify-center shadow-lg mb-4 ring-4 ring-amber-100 dark:ring-amber-900/50">
                    <Gift size={48} className="text-white" />
                </div>
                <h1 className="text-4xl font-black text-gray-900 dark:text-white drop-shadow-sm">{points}</h1>
                <p className="font-semibold text-gray-600 dark:text-gray-400 mt-1 uppercase tracking-widest text-sm">Total Kisaan Points</p>
            </div>

            <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">How to earn points</h2>
                <div className="space-y-3">
                    {rewards.map((reward, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center">
                                <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded-lg mr-3">
                                    {reward.icon}
                                </div>
                                <h3 className="font-medium text-gray-900 dark:text-white">{reward.title}</h3>
                            </div>
                            <span className="font-bold text-kisaan-600 dark:text-kisaan-400 bg-kisaan-50 dark:bg-kisaan-900/50 px-3 py-1 rounded-full text-sm">
                                {reward.pts}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {redeemedMsg && (
                <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative flex items-center" role="alert">
                    <CheckCircle2 className="mr-2 flex-shrink-0" size={20} />
                    <span className="block sm:inline">{redeemedMsg}</span>
                </div>
            )}

            <div className="mb-4">
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Redeem Rewards</h2>
                <div className="grid grid-cols-1 gap-4">
                    {catalog.map((item) => {
                        const discountedPrice = getDiscountedPrice(item.price);
                        const canAfford = points >= item.pointsReq;
                        const hasRedeemed = redeemedItems.includes(item.id);
                        return (
                            <div key={item.id} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex-1 pr-4">
                                        <h3 className="font-bold text-gray-900 dark:text-white text-sm">{item.name}</h3>
                                        <div className="mt-1 flex items-baseline gap-2">
                                            <span className="text-lg font-black text-kisaan-600 dark:text-kisaan-400">₹{discountedPrice}</span>
                                            <span className="text-xs text-gray-400 line-through">₹{item.price}</span>
                                        </div>
                                    </div>
                                    <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold px-2 py-1 rounded-lg">
                                        {item.pointsReq} Pts
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {hasRedeemed ? (
                                        <button
                                            onClick={() => {
                                                setRedeemedMsg(`Redirecting to payment gateway to buy ${item.name} for ₹${discountedPrice}...`);
                                                setTimeout(() => setRedeemedMsg(false), 3000);
                                            }}
                                            className="flex-1 py-2 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
                                        >
                                            Buy for ₹{discountedPrice}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleRedeemItem(item)}
                                            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm ${canAfford ? 'bg-kisaan-600 text-white hover:bg-kisaan-700' : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed'}`}
                                        >
                                            Redeem (Pts)
                                        </button>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
}
