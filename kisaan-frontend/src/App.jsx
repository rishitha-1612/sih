import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home                 from './pages/Home';
import Chat                 from './pages/Chat';
import Market               from './pages/Market';
import Rewards              from './pages/Rewards';
import Schemes              from './pages/Schemes';
import Onboarding           from './pages/Onboarding';
import Login                from './pages/Login';
import SignUp               from './pages/SignUp';
import CropAdvisory         from './pages/CropAdvisory';
import PlantDiseaseDetection from './pages/PlantDiseaseDetection';

import InstallButton         from './components/InstallButton';
import SplashScreen          from './components/SplashScreen';
import { AnimatePresence }   from 'framer-motion';

import { useStore }      from './store/useStore';
import StaggeredMenu     from './components/StaggeredMenu';
import ShapeGrid         from './components/ShapeGrid'; // ✅ replaced Squares

import React, { useEffect } from 'react';

// =============================================
// LOGOUT HANDLER
// =============================================
function LogoutHandler() {
    const setUser  = useStore(state => state.setUser);
    const setToken = useStore(state => state.setToken);

    useEffect(() => {
        setUser(null);
        setToken(null);
    }, [setUser, setToken]);

    return null;
}

// =============================================
// APP
// =============================================
function App() {
    const user = useStore(state => state.user);
    const [showSplash, setShowSplash] = React.useState(true);

    // ✅ Fixed: check crop_type not crop
    const requiresOnboarding = user && ((!user.crop_type && !user.crop) || !user.location);
    const showNav            = user && !requiresOnboarding;

    const menuItems = [
        { label: 'Home',            link: '/' },
        { label: 'Chat AI',         link: '/chat' },
        { label: 'Plant Disease',   link: '/plant-disease' },
        { label: 'Crop Advisory',   link: '/crop-advisory' },
        { label: 'Market',          link: '/market' },
        { label: 'Shop',            link: '/rewards' },
        { label: 'Schemes',         link: '/schemes' },
        { label: 'Select Crop',     link: '/onboarding?step=1' },
        { label: 'Select Location', link: '/onboarding?step=2' },
        { label: 'Logout',          link: '/logout' }
    ];

    return (
        <Router>
            <AnimatePresence>
                {showSplash && (
                    <SplashScreen onFinish={() => setShowSplash(false)} />
                )}
            </AnimatePresence>

            <div className="min-h-screen bg-[#121212] text-gray-100 relative w-full overflow-x-hidden">

                {/* Background animation */}
                <div className="fixed inset-0" style={{ zIndex: 0 }}>
                    <ShapeGrid
                        speed={0.5}
                        squareSize={40}
                        direction="diagonal"
                        borderColor="#271E37"
                        hoverFillColor="#1aa210"
                        shape="hexagon"
                        hoverTrailAmount={4}
                    />
                </div>

                <div className="relative z-10 flex w-full min-h-screen">

                    {/* Sidebar */}
                    {showNav && (
                        <StaggeredMenu
                            position="left"
                            items={menuItems}
                            socialItems={[]}
                            displaySocials={false}
                            displayItemNumbering={false}
                            menuButtonColor="#ffffff"
                            openMenuButtonColor="#fff"
                            changeMenuColorOnOpen={true}
                            colors={['#1a1a1a', '#0a0a0a']}
                            logoUrl="/logo.png"
                            accentColor="#5227FF"
                            isFixed={true}
                            menuFooter={<InstallButton mode="menu" />}
                        />
                    )}

                    {/* Page Container */}
                    <main className="flex-1 flex flex-col items-center px-4 py-10">
                        <div className="w-full max-w-6xl">

                            {!user ? (
                                <Routes>
                                    <Route path="/signup" element={<SignUp />} />
                                    <Route path="*"       element={<Login />} />
                                </Routes>

                            ) : requiresOnboarding ? (
                                <Routes>
                                    <Route path="/onboarding" element={<Onboarding />} />
                                    <Route path="*"           element={<Navigate to="/onboarding" />} />
                                </Routes>

                            ) : (
                                <Routes>
                                    <Route path="/"              element={<Home />} />
                                    <Route path="/chat"          element={<Chat />} />
                                    <Route path="/market"        element={<Market />} />
                                    <Route path="/rewards"       element={<Rewards />} />
                                    <Route path="/schemes"       element={<Schemes />} />
                                    <Route path="/crop-advisory" element={<CropAdvisory />} />
                                    <Route path="/plant-disease" element={<PlantDiseaseDetection />} />
                                    <Route path="/onboarding"    element={<Onboarding />} />
                                    <Route path="/logout"        element={<LogoutHandler />} />
                                    <Route path="*"              element={<Navigate to="/" />} />
                                </Routes>
                            )}
                        </div>
                    </main>
                </div>
            </div>
        </Router>
    );
}

export default App;
