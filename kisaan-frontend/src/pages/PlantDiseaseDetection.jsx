import { useState, useRef } from 'react';
import { Upload, Camera, Search, CheckCircle, AlertCircle, RefreshCw, ChevronLeft, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PlantDiseaseDetection() {
    const navigate = useNavigate();
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);
    const [cameraMode, setCameraMode] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setPreview(URL.createObjectURL(file));
            setResult(null);
            setError(null);
        }
    };

    const startCamera = async () => {
        setCameraMode(true);
        setResult(null);
        setError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Camera access failed", err);
            setError("Could not access camera. Please check permissions.");
            setCameraMode(false);
        }
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
            context.drawImage(videoRef.current, 0, 0);

            canvasRef.current.toBlob((blob) => {
                const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
                setImage(file);
                setPreview(URL.createObjectURL(blob));
                stopCamera();
            }, 'image/jpeg');
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setCameraMode(false);
    };

    const [trainingStatus, setTrainingStatus] = useState(null);

    // Poll training status
    useState(() => {
        const checkStatus = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/detection/status');
                const data = await response.json();
                setTrainingStatus(data);

                if (data.status === 'complete') {
                    console.log("Training complete. CNN model loaded successfully. Real predictions enabled.");
                }
            } catch (err) {
                console.error("Failed to fetch status", err);
            }
        };

        checkStatus();
        const interval = setInterval(checkStatus, 5000);
        return () => clearInterval(interval);
    }, []);

    const isHealthy = (disease) => {
        if (!disease) return false;
        return disease.toLowerCase().includes('healthy');
    };

    const detectDisease = async () => {
        if (!image) return;

        setLoading(true);
        setError(null);
        setResult(null);

        const formData = new FormData();
        formData.append('image', image);

        try {
            const response = await fetch('http://localhost:5000/api/detection/detect', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            // Catch both HTTP errors and backend-reported errors (e.g. model not found)
            if (!response.ok || data.error) {
                const msg = data.error || 'Detection failed';
                // Friendly messages for common errors
                if (msg.toLowerCase().includes('model file not found')) {
                    throw new Error('⚠️ The disease detection model is not trained yet. Please run the training script first.');
                }
                if (msg.toLowerCase().includes('tensorflow is not installed')) {
                    throw new Error('⚠️ TensorFlow is not installed on the server. Please install it to use disease detection.');
                }
                throw new Error(msg);
            }

            setResult(data);
        } catch (err) {
            console.error(err);
            setError(err.message || 'Failed to process image. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-transparent pb-24 text-gray-100 flex flex-col font-sans">
            <div className="w-full max-w-md mx-auto flex-1 flex flex-col px-4 pt-6 md:pt-10">

                {/* Header */}
                <header className="mb-6 flex items-center gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="bg-white/10 p-2 rounded-xl hover:bg-white/20 transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
                        Plant Disease Detection <Search size={22} className="text-green-400" />
                    </h1>
                </header>

                {/* Training Status Banner */}
                {trainingStatus && (
                    <div className={`mb-6 p-4 rounded-2xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-700 ${trainingStatus.status === 'complete'
                        ? 'bg-green-500/10 border-green-500/20 text-green-400'
                        : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                        }`}>
                        {trainingStatus.status === 'complete' ? (
                            <CheckCircle size={20} />
                        ) : (
                            <RefreshCw size={20} className="animate-spin" />
                        )}
                        <div className="flex-1">
                            <p className="text-sm font-bold">
                                {trainingStatus.status === 'complete'
                                    ? 'CNN Model Loaded'
                                    : `Model Training: ${trainingStatus.current_epoch}/${trainingStatus.total_epochs}`}
                            </p>
                            <p className="text-[10px] opacity-70">
                                {trainingStatus.status === 'complete'
                                    ? 'Real-time predictions from SiddharthDhirde repository enabled.'
                                    : 'Please wait until training completes for real results.'}
                            </p>
                        </div>
                    </div>
                )}

                <main className="space-y-6">
                    {/* Camera/Upload Section */}
                    {!cameraMode ? (
                        <div className="bg-black/20 backdrop-blur-md border border-white/5 rounded-3xl p-6 shadow-2xl overflow-hidden relative group">
                            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-50 pointer-events-none"></div>

                            {preview ? (
                                <div className="space-y-4">
                                    <div className="relative rounded-2xl overflow-hidden aspect-square flex items-center justify-center bg-black/40 border border-white/10">
                                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => { setPreview(null); setImage(null); setResult(null); }}
                                            className="absolute top-3 right-3 bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                                        >
                                            <RefreshCw size={16} />
                                        </button>
                                    </div>
                                    <button
                                        onClick={detectDisease}
                                        disabled={loading}
                                        className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${loading ? 'bg-gray-700 cursor-not-allowed' : 'bg-gradient-to-r from-green-600 to-emerald-500 hover:shadow-[0_0_20px_rgba(34,197,94,0.3)] active:scale-95'
                                            }`}
                                    >
                                        {loading ? <RefreshCw className="animate-spin" /> : <Search size={20} />}
                                        {loading ? 'Analyzing...' : 'Detect Disease'}
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-4">
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="border-2 border-dashed border-white/10 rounded-2xl p-10 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-green-500/30 hover:bg-white/5 transition-all"
                                    >
                                        <div className="bg-green-500/10 p-4 rounded-full">
                                            <Upload className="text-green-400" size={32} />
                                        </div>
                                        <p className="text-sm font-medium text-gray-300">Upload Leaf Image</p>
                                        <p className="text-xs text-gray-500">Tap to browse files</p>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleImageUpload}
                                            className="hidden"
                                            accept="image/*"
                                        />
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="h-px flex-1 bg-white/5"></div>
                                        <span className="text-[10px] uppercase tracking-widest text-gray-600 font-bold">OR</span>
                                        <div className="h-px flex-1 bg-white/5"></div>
                                    </div>
                                    <button
                                        onClick={startCamera}
                                        className="flex items-center justify-center gap-2 w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white hover:bg-white/10 transition-all"
                                    >
                                        <Camera size={20} className="text-blue-400" />
                                        Take a Photo
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-black rounded-3xl overflow-hidden shadow-2xl relative">
                            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover aspect-square" />
                            <canvas ref={canvasRef} className="hidden" />
                            <div className="absolute bottom-6 inset-x-0 flex justify-center items-center gap-8">
                                <button
                                    onClick={stopCamera}
                                    className="bg-white/10 backdrop-blur-md p-4 rounded-full text-white hover:bg-white/20 transition-all"
                                >
                                    <ChevronLeft size={24} />
                                </button>
                                <button
                                    onClick={capturePhoto}
                                    className="bg-white p-6 rounded-full text-black shadow-2xl active:scale-90 transition-all"
                                >
                                    <Camera size={32} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Results Section */}
                    {result && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="bg-gradient-to-br from-gray-900 to-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                                {/* Header — green if healthy, red if diseased */}
                                <div className={`border-b border-white/5 p-4 flex items-center justify-between ${isHealthy(result.disease)
                                        ? 'bg-green-500/10'
                                        : 'bg-red-500/10'
                                    }`}>
                                    <div className="flex items-center gap-2">
                                        {isHealthy(result.disease) ? (
                                            <CheckCircle className="text-green-400" size={18} />
                                        ) : (
                                            <AlertCircle className="text-red-400" size={18} />
                                        )}
                                        <span className={`text-xs font-bold uppercase tracking-wider ${isHealthy(result.disease) ? 'text-green-400' : 'text-red-400'
                                            }`}>
                                            {isHealthy(result.disease) ? '✅ Plant is Healthy' : '⚠️ Disease Detected'}
                                        </span>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isHealthy(result.disease)
                                            ? 'bg-green-500/20 text-green-400'
                                            : 'bg-red-500/20 text-red-400'
                                        }`}>
                                        {result.confidence} confidence
                                    </span>
                                </div>

                                <div className="p-6 space-y-5">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <p className="text-[10px] uppercase tracking-wide text-gray-500 font-bold">Plant</p>
                                            <p className="text-lg font-bold text-white">{result.plant}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] uppercase tracking-wide text-gray-500 font-bold">Condition</p>
                                            <p className={`text-lg font-bold ${isHealthy(result.disease) ? 'text-green-400' : 'text-orange-400'
                                                }`}>
                                                {result.disease}
                                            </p>
                                        </div>
                                    </div>

                                    <div className={`rounded-2xl p-4 border space-y-3 ${isHealthy(result.disease)
                                            ? 'bg-green-500/5 border-green-500/15'
                                            : 'bg-orange-500/5 border-orange-500/15'
                                        }`}>
                                        <div className={`flex items-center gap-2 ${isHealthy(result.disease) ? 'text-green-400' : 'text-orange-400'
                                            }`}>
                                            <Info size={16} />
                                            <span className="text-xs font-bold uppercase tracking-wider">
                                                {isHealthy(result.disease) ? 'Care Tips' : 'Treatment Recommendation'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-300 leading-relaxed font-medium">
                                            {result.treatment}
                                        </p>
                                    </div>

                                    {!isHealthy(result.disease) && (
                                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 flex gap-3">
                                            <AlertCircle className="text-yellow-400 shrink-0" size={18} />
                                            <p className="text-[11px] text-yellow-200/80 leading-snug">
                                                <b>Note:</b> These results are from the <b>CNN disease detection model</b>. For critical decisions, consult a professional agronomist.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3 animate-in shake duration-500">
                            <AlertCircle className="text-red-400" size={20} />
                            <p className="text-sm text-red-200 font-medium">{error}</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
