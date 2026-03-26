import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Leaf, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function SignUp() {
    const setUser  = useStore(state => state.setUser);
    const setToken = useStore(state => state.setToken);
    const navigate = useNavigate();

    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState('');
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '' });

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSignUp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res  = await fetch(`${API_URL}/api/auth/signup`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify(formData)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Signup failed');

            setToken(data.token);
            // ✅ Fixed: use _id from MongoDB, not id
            setUser({ ...data.user, _id: data.user._id });

            navigate('/onboarding');

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center py-16 text-white font-sans">

            {/* Logo */}
            <div className="flex items-center gap-2 text-green-400 font-bold text-2xl mb-10">
                <Leaf size={28} className="text-green-500" />
                Kisaan Konnect
            </div>

            {/* Title */}
            <div className="text-center mb-10 max-w-2xl">
                <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
                    Start Your
                    <span className="block bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-emerald-500 to-green-600">
                        Smart Farming Journey
                    </span>
                </h1>
                <p className="text-gray-400 text-lg">
                    Create your account to access crop advisory, market insights and AI-powered farming tools.
                </p>
            </div>

            {/* Card */}
            <div className="w-full max-w-md bg-[#121418] border border-gray-800 rounded-2xl p-8 shadow-xl">
                <h2 className="text-2xl font-bold text-white mb-6 text-center">Create Account</h2>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl mb-6 flex items-center">
                        <ShieldAlert className="mr-3" size={20} />
                        <span className="text-sm">{error}</span>
                    </div>
                )}

                <form onSubmit={handleSignUp} className="space-y-5">
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Name</label>
                        <input
                            required
                            type="text"
                            name="name"
                            onChange={handleChange}
                            className="w-full rounded-xl border border-gray-700 p-3 bg-black/30 text-white focus:border-green-500 outline-none"
                            placeholder="Ramesh"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Email</label>
                        <input
                            required
                            type="email"
                            name="email"
                            onChange={handleChange}
                            className="w-full rounded-xl border border-gray-700 p-3 bg-black/30 text-white focus:border-green-500 outline-none"
                            placeholder="ramesh@gmail.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Phone Number</label>
                        <input
                            required
                            type="tel"
                            name="phone"
                            pattern="[0-9]{10}"
                            onChange={handleChange}
                            className="w-full rounded-xl border border-gray-700 p-3 bg-black/30 text-white focus:border-green-500 outline-none"
                            placeholder="9876543210"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Password</label>
                        <input
                            required
                            type="password"
                            name="password"
                            minLength="6"
                            onChange={handleChange}
                            className="w-full rounded-xl border border-gray-700 p-3 bg-black/30 text-white focus:border-green-500 outline-none"
                            placeholder="Min 6 characters"
                        />
                    </div>

                    <button
                        disabled={loading}
                        type="submit"
                        className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 disabled:opacity-50 transition"
                    >
                        {loading ? 'Registering...' : 'Create Account'}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-400">
                    Already have an account?{' '}
                    <button onClick={() => navigate('/login')} className="text-green-400 font-bold hover:text-green-300">
                        Login
                    </button>
                </div>
            </div>
        </div>
    );
}