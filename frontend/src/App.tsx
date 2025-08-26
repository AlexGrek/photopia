import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import './App.css';

const GalleryListPage = lazy(() => import('./pages/GalleryListPage'));
const GalleryPage = lazy(() => import('./pages/GalleryPage'));
const CreateGalleryPage = lazy(() => import('./pages/CreateGalleryPage'));
const ImageUploaderPage = lazy(() => import('./pages/ImageUploaderPage'));

const LoadingSpinner: React.FC = () => (
  <div className="bg-gray-950 min-h-screen flex items-center justify-center">
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      <p className="text-gray-400 text-sm">Loading...</p>
    </div>
  </div>
);


// Main routing component to wrap the App.
const RootApp: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="bg-gray-950 min-h-screen">
        <Suspense fallback={<LoadingSpinner />}>
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<GalleryListPage />} />
              <Route path="/g/:galleryId" element={<GalleryPage />} />
              <Route path="/create-gallery" element={<CreateGalleryPage />} />
              <Route path="/upload-images" element={<ImageUploaderPage />} />
            </Routes>
          </AnimatePresence>
        </Suspense>
      </div>
    </BrowserRouter>
  );
};

export default RootApp;
