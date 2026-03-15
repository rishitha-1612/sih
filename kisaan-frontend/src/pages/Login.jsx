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

    const [formData, setFormData] = useState({
        identifier: '',
        password: ''
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

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

        <div className="flex flex-col items-center py-16 text-white font-sans">

            {/* Logo */}
            <div className="flex items-center gap-2 text-green-400 font-bold text-2xl mb-10">
                <Leaf size={28} className="text-green-500" />
                Krishi Mitra
            </div>


            {/* Hero text */}

            <div className="text-center mb-10 max-w-2xl">

                <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
                    Unlock Your
                    <span className="block bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-emerald-500 to-green-600">
                        Farm's Potential
                    </span>
                </h1>

                <p className="text-gray-400 text-lg">
                    Log in to access real-time market trends, personalized crop advisories and smart farming insights.
                </p>

            </div>


            {/* Login Card */}

            <div className="w-full max-w-md bg-[#121418] border border-gray-800 rounded-2xl p-8 shadow-xl">

                <h2 className="text-2xl font-bold text-white mb-6 text-center">
                    Welcome Back
                </h2>


                {error && (

                    <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl mb-6 flex items-center">
                        <ShieldAlert className="mr-3" size={20} />
                        <span className="text-sm">{error}</span>
                    </div>

                )}


                <form onSubmit={handleLogin} className="space-y-5">

                    <div>

                        <label className="block text-sm text-gray-400 mb-1">
                            Email or Phone
                        </label>

                        <input
                            required
                            type="text"
                            name="identifier"
                            onChange={handleChange}
                            className="w-full rounded-xl border border-gray-700 p-3 bg-black/30 text-white focus:border-green-500 outline-none"
                            placeholder="farmer@village.in"
                        />

                    </div>


                    <div>

                        <label className="block text-sm text-gray-400 mb-1">
                            Password
                        </label>

                        <input
                            required
                            type="password"
                            name="password"
                            onChange={handleChange}
                            className="w-full rounded-xl border border-gray-700 p-3 bg-black/30 text-white focus:border-green-500 outline-none"
                            placeholder="••••••••"
                        />

                    </div>


                    <button
                        disabled={loading}
                        type="submit"
                        className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 disabled:opacity-50 transition"
                    >
                        {loading ? 'Authenticating...' : 'Access Dashboard'}
                    </button>

                </form>


                <div className="mt-6 text-center text-sm text-gray-400">

                    Don't have an account?{' '}

                    <button
                        onClick={() => navigate('/signup')}
                        className="text-green-400 font-bold hover:text-green-300"
                    >
                        Sign Up
                    </button>

                </div>

            </div>

        </div>

    );
}