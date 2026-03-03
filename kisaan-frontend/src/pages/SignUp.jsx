import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Leaf, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SignUp() {
    const setUser = useStore(state => state.setUser);
    const setToken = useStore(state => state.setToken);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', password: ''
    });

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSignUp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('http://localhost:5000/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Signup failed');
            }

            setToken(data.token);
            setUser({ ...data.user, user_id: data.user.id });

            navigate('/onboarding');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12 bg-kisaan-50 dark:bg-gray-900 overflow-y-auto">
            <Leaf className="w-16 h-16 text-kisaan-600 mb-6 mt-10 md:mt-0" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Join KisaanKonnect</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8 text-center">Your Smart Farming Companion</p>

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 flex items-center w-full max-w-sm">
                    <ShieldAlert className="mr-2" size={20} />
                    <span className="text-sm">{error}</span>
                </div>
            )}

            <form onSubmit={handleSignUp} className="w-full max-w-sm space-y-4 mb-8">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                    <input required type="text" name="name" onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-kisaan-500 focus:ring-kisaan-500 p-3 bg-white dark:bg-gray-800" placeholder="Ramesh" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email ID</label>
                    <input required type="email" name="email" onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-kisaan-500 focus:ring-kisaan-500 p-3 bg-white dark:bg-gray-800" placeholder="ramesh@gmail.com" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</label>
                    <input required type="tel" name="phone" pattern="[0-9]{10}" onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-kisaan-500 focus:ring-kisaan-500 p-3 bg-white dark:bg-gray-800" placeholder="9876543210" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                    <input required type="password" name="password" minLength="6" onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-kisaan-500 focus:ring-kisaan-500 p-3 bg-white dark:bg-gray-800" placeholder="Min 6 characters" />
                </div>

                <button disabled={loading} type="submit" className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-kisaan-600 hover:bg-kisaan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-kisaan-500 mt-6 text-lg disabled:opacity-50 transition-colors">
                    {loading ? 'Registering...' : 'Sign Up'}
                </button>
            </form>

            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Already have an account? <span className="text-kisaan-600 font-bold cursor-pointer hover:underline" onClick={() => navigate('/login')}>Login</span>
            </p>
        </div>
    );
}
