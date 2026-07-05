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

const MoodboardPage: React.FC = () => {
    const { moodboardId } = useParams<{ moodboardId: string }>();
    const [moodboard, setMoodboard] = useState<Moodboard | null>(null);
    const navigate = useNavigate();

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const isAdmin = localStorage.getItem(localStorageKey) != null;

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
        return (<div className='w-full min-h-screen text-white'>
            {loading && <p className='animate-pulse'><Loader2 /></p>}
            {error && <p className='animate-pulse'><Sigma />{error}</p>}
        </div>);
    }

    return (
        <div className="bg-gray-950 text-white min-h-screen font-sans">
            <motion.header
                layoutId={`moodboard-card-${moodboard.id}`}
                className="relative w-full h-64 overflow-hidden"
                style={{ backgroundColor: moodboard.headerColor }}
            >
                <div className="absolute inset-0 bg-black/40 backdrop-blur-md flex flex-col justify-end p-6 md:p-10">
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
