import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Leaf, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const setUser = useStore(state => state.setUser);
    const setToken = useStore(state => state.setToken);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({ identifier: '', password: '' });

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Login failed');
            }

            setToken(data.token);
            setUser({ ...data.user, user_id: data.user.id });

            if (!data.user.crop || !data.user.location) {
                navigate('/onboarding');
            } else {
                navigate('/');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 py-12 bg-transparent text-white font-sans relative z-10">

            {/* Minimal Top Navbar */}
            <div className="absolute top-0 left-0 w-full p-6 flex items-center justify-start pointer-events-auto">
                <div className="flex items-center gap-2 text-green-400 font-bold text-xl tracking-tight">
                    <Leaf size={24} className="text-green-500" />
                    <span>Krishi Mitra</span>
                </div>
            </div>

            {/* Hero Section */}
            <div className="flex flex-col items-center text-center mb-10 mt-10 pointer-events-auto">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-gray-300 mb-6 backdrop-blur-md">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    AI-Powered Farm Advisor
                </div>

                <h1 className="text-5xl md:text-6xl lg:text-7xl font-black mb-4 tracking-tighter text-white">
                    Unlock Your <br className="hidden sm:block" />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-emerald-500 to-green-600">
                        Farm's Potential
                    </span>
                </h1>

                <p className="text-gray-400 text-lg md:text-xl max-w-2xl font-medium leading-relaxed">
                    Log in to access real-time market trends, personalized crop advisories, and smart farming insights.
                </p>
            </div>

            {/* Glassmorphism Form Container */}
            <div className="relative w-full max-w-md pointer-events-auto group">
                {/* Glow Effect behind form */}
                <div className="absolute -inset-1 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>

                <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                    <h2 className="text-2xl font-bold text-white mb-6 text-center">Welcome Back</h2>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl mb-6 flex items-center w-full">
                            <ShieldAlert className="mr-3 flex-shrink-0" size={20} />
                            <span className="text-sm font-medium">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-300 ml-1">Email or Phone</label>
                            <input
                                required
                                type="text"
                                name="identifier"
                                onChange={handleChange}
                                className="w-full rounded-2xl border border-white/10 shadow-sm focus:border-green-500/50 focus:ring-green-500/50 p-4 bg-white/5 text-white placeholder-gray-500 transition-colors"
                                placeholder="farmer@village.in or 9876543210"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-300 ml-1">Password</label>
                            <input
                                required
                                type="password"
                                name="password"
                                onChange={handleChange}
                                className="w-full rounded-2xl border border-white/10 shadow-sm focus:border-green-500/50 focus:ring-green-500/50 p-4 bg-white/5 text-white placeholder-gray-500 transition-colors"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            disabled={loading}
                            type="submit"
                            className="relative w-full overflow-hidden flex justify-center items-center py-4 px-4 rounded-2xl shadow-[0_0_20px_rgba(34,197,94,0.2)] text-base font-bold text-white bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 focus:ring-offset-gray-900 mt-2 disabled:opacity-50 transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(34,197,94,0.4)]"
                        >
                            {loading ? 'Authenticating...' : 'Access Dashboard'}
                        </button>
                    </form>

                    <div className="mt-8 text-center text-sm text-gray-400">
                        Don't have an account?{' '}
                        <button
                            type="button"
                            onClick={() => navigate('/signup')}
                            className="text-green-400 font-bold hover:text-green-300 transition-colors hover:underline"
                        >
                            Sign Up
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
