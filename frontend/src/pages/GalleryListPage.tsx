import React, { useEffect, useState } from 'react';
import { LoaderCircle, SquarePlus } from 'lucide-react';
import { Menu } from '@headlessui/react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { GalleryThumbnail } from '../Models';
import Modal from '../components/Modal';
import ApiKeyForm from '../components/ApiKeyForm';
import Logo from '../components/Logo';

const GalleryListPage: React.FC = () => {
    const [galleries, setGalleries] = useState<GalleryThumbnail[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    useEffect(() => {
        const fetchG = async () => {
            try {
                const response = await fetch('/api/v1/galleries');

                if (!response.ok) {
                    throw new Error(`Failed to fetch galleries: ${response.status} ${response.statusText}`);
                }

                const data = await response.json();
                if (Array.isArray(data)) {
                    setGalleries(data as GalleryThumbnail[]);
                } else {
                    throw new Error("Invalid data format received from server");
                }
            } catch (err: any) {
                console.error("Error fetching galleries:", err);
                setError(err.message || "Unexpected error occurred");
            } finally {
                setLoading(false);
            }
        };
        fetchG();
    }, []);

    return (
        <div className="bg-gray-950 text-white min-h-screen font-sans">
            {/* Top Navigation Bar */}
            <header className="flex justify-between items-center p-6 shadow-md sticky top-0 z-10 backdrop-blur-2xl">
                <Logo/>
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
                    Galleries
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
                        {galleries.map((gallery) => (
                            <Link
                                key={gallery.id}
                                to={`/g/${gallery.id}`}
                                state={{"gallery": gallery}}
                                className="relative group block overflow-hidden rounded-lg shadow-xl cursor-pointer"
                            >
                                <motion.div
                                    layoutId={`gallery-card-${gallery.id}`}
                                    className="relative block overflow-hidden rounded-lg shadow-xl cursor-pointer transform transition-transform duration-300 hover:scale-105"
                                >
                                    <motion.img
                                        layout="position"
                                        src={gallery.coverImageUrl}
                                        alt={`Cover for ${gallery.name}`}
                                        className="w-full h-64 object-cover object-center transition-transform duration-300 group-hover:scale-110"
                                        onError={(e) => {
                                            e.currentTarget.src = "https://placehold.co/600x600/1f2937/d1d5db?text=Image+Not+Found";
                                            e.currentTarget.onerror = null;
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex flex-col justify-end">
                                        <h2 className="text-xl font-semibold mb-1 truncate">
                                            {gallery.name}
                                        </h2>
                                        <p className="text-sm text-gray-300 truncate">
                                            by {gallery.author}
                                        </p>
                                    </div>
                                </motion.div>
                            </Link>
                        ))}
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="py-4 text-center text-gray-500 text-sm mt-10">
                <p>by Unknown Desires, 2025</p>
            </footer>
        </div>
    );
};

export default GalleryListPage;
