import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Chat from './pages/Chat';
import Market from './pages/Market';
import Rewards from './pages/Rewards';
import Schemes from './pages/Schemes';
import Onboarding from './pages/Onboarding';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import CropAdvisory from './pages/CropAdvisory';
import PlantDiseaseDetection from './pages/PlantDiseaseDetection';
import { useStore } from './store/useStore';
import StaggeredMenu from './components/StaggeredMenu';
import Squares from './components/Squares';
import React, { useEffect } from 'react';

function LogoutHandler() {
  const setUser = useStore(state => state.setUser);
  const setToken = useStore(state => state.setToken);

  useEffect(() => {
    setUser(null);
    setToken(null);
  }, [setUser, setToken]);

  return null;
}

function App() {
  const user = useStore(state => state.user);

  // Requires onboarding if logged in but missing critical setup flags
  const requiresOnboarding = user && (!user.crop || !user.location);
  // Show nav only if fully logged in and onboarded
  const showNav = user && !requiresOnboarding;

  const menuItems = [
    { label: 'Home', ariaLabel: 'Go to home page', link: '/' },
    { label: 'Chat AI', ariaLabel: 'Go to Chat AI', link: '/chat' },
    { label: 'Plant Disease', ariaLabel: 'Detect Plant Disease', link: '/plant-disease' },
    { label: 'Market', ariaLabel: 'Go to Market', link: '/market' },
    { label: 'Rewards', ariaLabel: 'Go to Rewards', link: '/rewards' },
    { label: 'Select Crop', ariaLabel: 'Select Crop', link: '/onboarding?step=1' },
    { label: 'Select Location', ariaLabel: 'Select Location', link: '/onboarding?step=2' },
    { label: 'Logout', ariaLabel: 'Log out', link: '/logout' }
  ];

  return (
    <Router>
      <div className="flex flex-col md:flex-row h-screen bg-[#121212] text-gray-900 dark:text-gray-100 overflow-hidden relative w-full">
        {/* Global Background Layer */}
        <div className="fixed inset-0 z-[0] pointer-events-none">
          <Squares
            speed={0.5}
            squareSize={40}
            direction="diagonal"
            borderColor="#271E37"
            hoverFillColor="#222222"
          />
        </div>

        {/* Foreground Content */}
        <div className="relative z-[10] flex flex-col md:flex-row w-full h-full pointer-events-none">
          {showNav && (
            <div className="pointer-events-auto">
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
                logoUrl=""
                accentColor="#5227FF"
                isFixed={true}
              />
            </div>
          )}
          {/* Adjusting padding since BottomNav is removed. Providing top padding for the mobile hamburger icon */}
          <main className={`flex-1 w-full flex flex-col overflow-hidden pointer-events-auto ${showNav ? 'pt-16 md:p-6' : ''}`}>
            {/* 
               Lower opacity for the background here so the Squares animation can be seen 
               on both desktop and mobile while preserving readability 
            */}
            <div className={`mx-auto w-full h-full bg-transparent overflow-y-auto no-scrollbar flex flex-col relative ${showNav ? 'max-w-4xl md:rounded-2xl shadow-sm md:shadow-xl border border-transparent dark:md:border-gray-800' : ''}`}>
              {!user ? (
                <Routes>
                  <Route path="/signup" element={<SignUp />} />
                  <Route path="*" element={<Login />} />
                </Routes>
              ) : requiresOnboarding ? (
                <Routes>
                  <Route path="/onboarding" element={<Onboarding />} />
                  <Route path="*" element={<Navigate to="/onboarding" />} />
                </Routes>
              ) : (
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/chat" element={<Chat />} />
                  <Route path="/market" element={<Market />} />
                  <Route path="/rewards" element={<Rewards />} />
                  <Route path="/schemes" element={<Schemes />} />
                  <Route path="/crop-advisory" element={<CropAdvisory />} />
                  <Route path="/plant-disease" element={<PlantDiseaseDetection />} />
                  <Route path="/onboarding" element={<Onboarding />} />
                  <Route path="/logout" element={<LogoutHandler />} />
                  <Route path="*" element={<Navigate to="/" />} />
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
