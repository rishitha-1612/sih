import Squares from '../components/Squares';

export default function AppLayout({ children }) {
    return (
        <div className="min-h-screen bg-[#121212] text-gray-100 relative w-full overflow-x-hidden">

            {/* Background animation */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <Squares
                    speed={0.5}
                    squareSize={40}
                    direction="diagonal"
                    borderColor="#271E37"
                    hoverFillColor="#222222"
                />
            </div>

            {/* Page container */}
            <div className="relative z-10 w-full max-w-5xl mx-auto px-4 pt-10 pb-20">
                {children}
            </div>

        </div>
    );
}