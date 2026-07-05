import React, { useEffect, useState } from 'react';
import { ChevronLeft, Loader2, PencilLine, Sigma } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Moodboard } from '../Models';
import Logo from '../components/Logo';
import MoodboardViewer from '../components/MoodboardViewer';
import { useNotification } from '../contexts/NotificationContext';
import { localStorageKey } from '../components/ApiKeyForm';
import Footer from "../components/Footer";
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const MoodboardPage: React.FC = () => {
    const { moodboardId } = useParams<{ moodboardId: string }>();
    const [moodboard, setMoodboard] = useState<Moodboard | null>(null);
    const navigate = useNavigate();

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const isAdmin = localStorage.getItem(localStorageKey) != null;

    useDocumentTitle(moodboard?.name);

    const { notify } = useNotification();

    useEffect(() => {
        const fetchM = async () => {
            try {
                const response = await fetch(`/api/v1/moodboard?moodboard_id=${moodboardId}`);

                if (!response.ok) {
                    throw new Error(`Failed to fetch moodboard: ${response.status} ${response.statusText}`);
                }

                const data = await response.json();
                if (data) {
                    setMoodboard(data as Moodboard);
                } else {
                    throw new Error("Invalid data format received from server");
                }
            } catch (err: any) {
                console.error("Error fetching moodboard:", err);
                setError(err.message || "Unexpected error occurred");
                notify(err.message, 'error');
            } finally {
                setLoading(false);
            }
        };
        if (moodboardId)
            fetchM();
    }, [moodboardId, notify]);

    if (!moodboard) {
        return (<div className='w-full min-h-screen text-white font-moodboard'>
            {loading && <p className='animate-pulse'><Loader2 /></p>}
            {error && <p className='animate-pulse'><Sigma />{error}</p>}
        </div>);
    }

    const headerColor = moodboard.headerColor || '#334155';
    // A "liquid glass" gradient derived from the single header color: light and
    // dark blobs plus a diagonal sheen, all mixed off the base color.
    const liquidGlass: React.CSSProperties = {
        backgroundColor: headerColor,
        backgroundImage: [
            `radial-gradient(90% 120% at 12% 18%, color-mix(in srgb, ${headerColor} 45%, white) 0%, transparent 50%)`,
            `radial-gradient(80% 100% at 88% 12%, color-mix(in srgb, ${headerColor} 25%, white) 0%, transparent 45%)`,
            `radial-gradient(110% 120% at 80% 95%, color-mix(in srgb, ${headerColor} 55%, black) 0%, transparent 55%)`,
            `linear-gradient(135deg, color-mix(in srgb, ${headerColor} 65%, white) 0%, ${headerColor} 45%, color-mix(in srgb, ${headerColor} 60%, black) 100%)`,
        ].join(', '),
    };

    return (
        <div className="bg-gray-950 text-white min-h-screen font-moodboard overflow-x-hidden">
            <motion.header
                layoutId={`moodboard-card-${moodboard.id}`}
                className="relative w-full h-80 md:h-64 overflow-hidden"
                style={liquidGlass}
            >
                {/* Glossy diagonal sheen for the glass highlight */}
                <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                        background:
                            'linear-gradient(115deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0) 28%, rgba(255,255,255,0) 72%, rgba(255,255,255,0.10) 100%)',
                    }}
                />
                <div className="absolute inset-0 bg-black/25 backdrop-blur-xl ring-1 ring-inset ring-white/10 flex flex-col justify-end p-6 md:p-10">
                    <div className='absolute top-6 left-6 md:top-8 md:left-10 fadeInDelayed'><Logo /></div>
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                        <button
                            id="back-btn"
                            onClick={() => navigate('/moodboards')}
                            className="bg-gray-800/50 backdrop-blur-sm p-2 rounded-full hover:bg-gray-700/50 transition-colors flex-shrink-0"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <h1 className="text-2xl sm:text-4xl font-semibold min-w-0 break-words">
                            {moodboard.name}
                        </h1>
                        {isAdmin && (
                            <button
                                onClick={() => navigate(`/edit-moodboard/${moodboardId}`)}
                                id="admin-edit"
                                className="bg-gray-800/50 backdrop-blur-sm p-2 rounded-full hover:bg-gray-700/50 transition-colors"
                            >
                                <PencilLine size={24} />
                            </button>
                        )}
                        {loading && <span className='animate-spin'><Loader2 size={24} /></span>}
                    </div>
                </div>
            </motion.header>

            <main className="container mx-auto p-6 pt-10">
                {moodboard.sections.length > 0 && <MoodboardViewer moodboard={moodboard} />}
            </main>

            <Footer />
        </div>
    );
};

export default MoodboardPage;
