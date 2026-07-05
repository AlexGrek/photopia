import React, { useEffect, useState } from 'react';
import { LoaderCircle, SquarePlus, Palette } from 'lucide-react';
import { Menu } from '@headlessui/react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { MoodboardThumbnail } from '../Models';
import Modal from '../components/Modal';
import ApiKeyForm from '../components/ApiKeyForm';
import Logo from '../components/Logo';
import PageTabs from '../components/PageTabs';
import { localStorageKey } from '../components/ApiKeyForm';
import Footer from "../components/Footer";

const MoodboardListPage: React.FC = () => {
    const [moodboards, setMoodboards] = useState<MoodboardThumbnail[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    const isAdmin = localStorage.getItem(localStorageKey) != null;

    useEffect(() => {
        const fetchM = async () => {
            try {
                const response = await fetch('/api/v1/moodboards');

                if (!response.ok) {
                    throw new Error(`Failed to fetch moodboards: ${response.status} ${response.statusText}`);
                }

                const data = await response.json();
                if (Array.isArray(data)) {
                    setMoodboards(data as MoodboardThumbnail[]);
                } else {
                    throw new Error("Invalid data format received from server");
                }
            } catch (err: any) {
                console.error("Error fetching moodboards:", err);
                setError(err.message || "Unexpected error occurred");
            } finally {
                setLoading(false);
            }
        };
        fetchM();
    }, []);

    return (
        <div className="bg-gray-950 text-white min-h-screen font-sans">
            {/* Top Navigation Bar */}
            <header className="flex justify-between items-center p-6 shadow-md sticky top-0 z-10 backdrop-blur-2xl">
                <div className="flex items-baseline gap-6">
                    <Logo/>
                    <PageTabs />
                </div>
                <Menu as="div" className="relative">
                    <button
                        id="login-btn"
                        onClick={() => setIsLoginModalOpen(true)}
                        className="bg-gray-900 hover:bg-gray-700 cursor-pointer text-white font-medium py-2 px-4 rounded-2xl transition-colors duration-200 flex items-center gap-2"
                    >
                        <SquarePlus size={20} />
                        <span className="hidden sm:inline opacity-55">Add</span>
                    </button>
                </Menu>
            </header>

            {/* Main Content Area */}
            <main className="container mx-auto p-6 pt-10 flex-grow fadeIn">
                <h1 className="text-3xl font-light mx-auto w-full mb-8 text-center sm:text-left">
                    Moodboards
                </h1>

                <Modal
                    isOpen={isLoginModalOpen}
                    onClose={() => setIsLoginModalOpen(false)}
                    title="Login"
                >
                    <ApiKeyForm />
                </Modal>

                {/* Conditional rendering */}
                {loading && (
                    <p className="text-center w-full flex-1 items-center content-center min-w-4 text-gray-400 animate-pulse"><LoaderCircle className='animate-spin'/></p>
                )}

                {error && !loading && (
                    <p className="text-center text-red-400">
                        {error}
                    </p>
                )}

                {!loading && !error && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {isAdmin && (
                            <Link
                                id="create-moodboard-card"
                                to="/create-moodboard"
                                className="relative group flex flex-col items-center justify-center overflow-hidden rounded-lg shadow-xl cursor-pointer h-64 border-2 border-dashed border-gray-700 hover:border-gray-500 transition-colors duration-300 text-gray-400 hover:text-white"
                            >
                                <SquarePlus size={40} />
                                <span className="mt-2 font-medium">Create moodboard</span>
                            </Link>
                        )}
                        {moodboards.map((moodboard) => (
                            <Link
                                key={moodboard.id}
                                to={`/m/${moodboard.id}`}
                                className="relative group block overflow-hidden rounded-lg shadow-xl cursor-pointer"
                            >
                                <motion.div
                                    layoutId={`moodboard-card-${moodboard.id}`}
                                    className="relative block overflow-hidden rounded-lg shadow-xl cursor-pointer transform transition-transform duration-300 hover:scale-105 h-64"
                                    style={{ borderTop: `4px solid ${moodboard.headerColor}` }}
                                >
                                    {moodboard.coverImageUrl ? (
                                        <img
                                            src={moodboard.coverImageUrl}
                                            alt={`Cover for ${moodboard.name}`}
                                            className="w-full h-64 object-cover object-center transition-transform duration-300 group-hover:scale-110"
                                            onError={(e) => {
                                                e.currentTarget.src = "https://placehold.co/600x600/1f2937/d1d5db?text=Image+Not+Found";
                                                e.currentTarget.onerror = null;
                                            }}
                                        />
                                    ) : (
                                        <div
                                            className="w-full h-64 flex items-center justify-center"
                                            style={{ backgroundColor: moodboard.headerColor }}
                                        >
                                            <Palette size={40} className="text-white/60" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex flex-col justify-end">
                                        <h2 className="text-xl font-semibold mb-1 truncate">
                                            {moodboard.name}
                                        </h2>
                                    </div>
                                </motion.div>
                            </Link>
                        ))}
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
};

export default MoodboardListPage;
