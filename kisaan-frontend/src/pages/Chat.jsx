import { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { Mic, Send, Bot, MicOff, Loader2, Camera, Image as ImageIcon, Globe } from 'lucide-react';

export default function Chat() {
    const { chats, addChat, addPoints, user, setUser } = useStore();
    const [input, setInput] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const [imageFile, setImageFile] = useState(null);

    const recognitionRef = useRef(null);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    // Auto-scroll to the bottom when new chats arrive or loading state changes
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [chats, isLoading]);

    // Handle Language Change
    const handleLanguageChange = async (e) => {
        const newLang = e.target.value;
        try {
            const res = await fetch('http://localhost:5000/api/users/language', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user?.userId || user?.id, language: newLang })
            });
            if (res.ok) {
                setUser({ ...user, language: newLang });
                addChat({ id: Date.now(), text: `Language changed to ${newLang}. I will reply in this language now!`, isBot: true });
            } else {
                alert('Failed to update language');
            }
        } catch (err) {
            console.error('Error updating language', err);
        }
    };

    // Initialize Web Speech API
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.lang = 'en-IN'; // Indian English for local agriculture context

            recognition.onresult = (event) => {
                let currentTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    currentTranscript += event.results[i][0].transcript;
                }
                setInput(currentTranscript);
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                setIsListening(false);
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current = recognition;
        } else {
            console.warn('SpeechRecognition API not supported in this browser.');
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
        };
    }, []);

    const toggleListening = () => {
        if (!recognitionRef.current) {
            alert("Voice input is not supported in your current browser. Please use Chrome or Edge.");
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            setInput(''); // Clear input for fresh speech
            try {
                recognitionRef.current.start();
                setIsListening(true);
            } catch (err) {
                console.error('Failed to start speech recognition:', err);
                setIsListening(false);
            }
        }
    };

    const handleSend = async (e) => {
        e?.preventDefault();

        const userText = input.trim();
        if ((!userText && !imageFile) || isLoading) return;

        // Stop listening if user manually sends message
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        }

        setInput('');
        setImagePreview(null);

        // Optimistically add user message to UI
        if (imageFile) {
            addChat({ id: Date.now(), text: userText || "Uploaded an image for analysis.", isImage: true, imagePreview: imagePreview, isBot: false });
        } else {
            addChat({ id: Date.now(), text: userText, isBot: false });
        }

        setIsLoading(true);

        try {
            if (imageFile) {
                // Handle Image Upload Scan
                const formData = new FormData();
                formData.append('user_id', user?.user_id || user?.id || 1);
                formData.append('image', imageFile);

                const response = await fetch('http://localhost:5000/api/upload-image', {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    throw new Error(errData.error || `Server responded with status: ${response.status}`);
                }
                const data = await response.json();

                addChat({
                    id: Date.now() + 1,
                    text: `Based on the image, I detect ${data.diseasePredicted} (${data.confidence} confidence). Recommendation: ${data.treatment}`,
                    isBot: true
                });

                if (data.points_earned) addPoints(data.points_earned);
                setImageFile(null);
            } else {
                // Regular Text/Voice Chat
                const payload = {
                    user_id: user?.user_id || user?.id || 1,
                    message: userText
                };

                const response = await fetch('http://localhost:5000/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) throw new Error(`Server responded with status: ${response.status}`);

                const data = await response.json();

                addChat({
                    id: Date.now() + 1,
                    text: data.reply,
                    isBot: true
                });

                if (data.points_earned) addPoints(data.points_earned);
            }
        } catch (error) {
            console.error('Chat API Error:', error);

            addChat({
                id: Date.now() + 1,
                text: "⚠️ Connection error. Please make sure the backend server is running and you are online.",
                isBot: true
            });
        } finally {
            setIsLoading(false);
            setImageFile(null);
            setImagePreview(null);
        }
    };

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
            {/* Header Area */}
            <header className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between shrink-0">
                <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-kisaan-100 flex items-center justify-center mr-3">
                        <Bot className="text-kisaan-600" size={24} />
                    </div>
                    <div>
                        <h1 className="font-bold text-gray-900 dark:text-white">Kisaan Mitra AI</h1>
                        <p className="text-xs text-green-600 font-medium tracking-wide">● Online</p>
                    </div>
                </div>

                {/* Language Selector */}
                <div className="flex items-center bg-gray-50 dark:bg-gray-700 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-600">
                    <Globe size={14} className="text-gray-500 mr-2" />
                    <select
                        value={user?.language || 'English'}
                        onChange={handleLanguageChange}
                        className="bg-transparent text-xs font-medium text-gray-700 dark:text-gray-300 outline-none cursor-pointer"
                    >
                        <option value="English">English</option>
                        <option value="Hindi">हिंदी (Hindi)</option>
                        <option value="Marathi">मराठी (Marathi)</option>
                        <option value="Telugu">తెలుగు (Telugu)</option>
                        <option value="Tamil">தமிழ் (Tamil)</option>
                        <option value="Gujarati">ગુજરાતી (Gujarati)</option>
                        <option value="Punjabi">ਪੰਜਾਬੀ (Punjabi)</option>
                        <option value="Kannada">ಕನ್ನಡ (Kannada)</option>
                    </select>
                </div>
            </header>

            {/* Chat Messages Area */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4 scroll-smooth">
                {chats.length === 0 && !isLoading && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-70">
                        <Bot size={56} className="mb-3 text-gray-400" />
                        <p className="font-medium">Ask me about crops, weather, or pests!</p>
                        <p className="text-xs mt-1">Tap the mic to use voice</p>
                    </div>
                )}

                {chats.map(msg => (
                    <div key={msg.id} className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}>
                        <div
                            className={`max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed shadow-sm flex flex-col ${msg.isBot
                                ? 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-tl-sm'
                                : 'bg-kisaan-600 text-white rounded-tr-sm'
                                }`}
                        >
                            {msg.isImage && msg.imagePreview && (
                                <img src={msg.imagePreview} alt="User Upload" className="w-full max-w-[200px] rounded-xl mb-2 border border-white/20 shadow-sm" />
                            )}
                            <span>{msg.text}</span>
                        </div>
                    </div>
                ))}

                {/* Loading State Indicator */}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-tl-sm p-3 text-sm flex items-center shadow-sm">
                            <Loader2 className="animate-spin text-kisaan-600 mr-2" size={16} />
                            Thinking...
                        </div>
                    </div>
                )}

                {/* Empty div acting as the scroll target at the bottom */}
                <div ref={messagesEndRef} />
            </div>

            {/* User Input Area */}
            <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shrink-0">
                {imagePreview && (
                    <div className="mb-3 relative inline-block">
                        <img src={imagePreview} alt="Preview" className="h-16 w-16 object-cover rounded-xl border-2 border-kisaan-500 shadow-sm" />
                        <button
                            onClick={() => { setImagePreview(null); setImageFile(null); }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm hover:bg-red-600"
                        >
                            &times;
                        </button>
                    </div>
                )}
                <form onSubmit={handleSend} className="flex relative items-center gap-2">
                    <button
                        type="button"
                        onClick={toggleListening}
                        disabled={isLoading}
                        className={`p-3 rounded-full transition-all flex-shrink-0 disabled:opacity-50 ${isListening

                            ? 'bg-red-500 text-white shadow-lg animate-pulse ring-4 ring-red-500/30'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                        aria-label="Toggle voice input"
                    >
                        {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                    </button>

                    <div className="relative flex-grow">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={isLoading}
                            className={`w-full p-3 pr-10 rounded-full bg-gray-100 dark:bg-gray-700 border-none focus:ring-2 focus:ring-kisaan-500 text-sm transition-all outline-none disabled:opacity-50 ${isListening ? 'ring-2 ring-red-400 placeholder-red-400 text-red-700' : ''
                                }`}
                            placeholder={imagePreview ? "Add a description..." : (isListening ? "Listening..." : "Type or upload photo...")}
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isLoading}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-500 hover:text-kisaan-600 disabled:opacity-50"
                        >
                            <Camera size={18} />
                        </button>
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleImageSelect}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={(!input.trim() && !imageFile) || isLoading}
                        className="p-3 rounded-full bg-kisaan-600 hover:bg-kisaan-700 text-white flex-shrink-0 disabled:opacity-50 transition-colors shadow-sm disabled:cursor-not-allowed"
                        aria-label="Send message"
                    >
                        {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                    </button>
                </form>
            </div>
        </div>
    );
}
