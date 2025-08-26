import React, { useState, useEffect, useRef } from 'react';
import { UploadCloud, X, Check, Image, AlertCircle } from 'lucide-react';
import { localStorageKey } from './ApiKeyForm';

// Define the structure for an individual file to track its state.
interface UploadFile {
  id: number;
  file: File;
  progress: number;
  status: 'idle' | 'uploading' | 'success' | 'error';
  errorMessage: string | null;
}

const ImageUploader: React.FC = () => {
  // State variables for the component.
  const [galleryId, setGalleryId] = useState<string>('');
  const [filesToUpload, setFilesToUpload] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [uploadedCount, setUploadedCount] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Automatically get gallery ID from the URL query parameter.
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('galleryid');
    if (id) {
      setGalleryId(id);
    }
  }, []);

  // Calculate the global progress for files that have finished uploading.
  const globalProgress = (uploadedCount / filesToUpload.length) * 100;

  // --- Helper Functions ---

  // Validates file types and prepares files for upload.
  const handleFiles = (newFiles: FileList) => {
    const validFiles: UploadFile[] = [];
    const invalidFiles: string[] = [];

    Array.from(newFiles).forEach(file => {
      // Check for file type (case-insensitive).
      const fileType = file.type.toLowerCase();
      if (fileType === 'image/jpeg' || fileType === 'image/jpg') {
        validFiles.push({
          id: Date.now() + Math.random(), // Unique ID for each file
          file,
          progress: 0,
          status: 'idle',
          errorMessage: null,
        });
      } else {
        invalidFiles.push(file.name);
      }
    });

    if (invalidFiles.length > 0) {
      alert(`Invalid file types: ${invalidFiles.join(', ')}. Only JPG and JPEG files are allowed.`);
    }
    
    setUploadedCount(0); // Reset uploaded count when new files are added.
    setFilesToUpload(prevFiles => [...prevFiles, ...validFiles]);
  };

  // Upload a single file to the server with progress tracking.
  const uploadSingleFile = (fileToUpload: UploadFile) => {
    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('image_file', fileToUpload.file);

      const apiKey = localStorage.getItem(localStorageKey);
      if (!apiKey) {
        setFilesToUpload(prevFiles =>
          prevFiles.map(f =>
            f.id === fileToUpload.id ? { ...f, status: 'error', errorMessage: 'API key not found in local storage.' } : f
          )
        );
        return reject(new Error('API key not found.'));
      }

      // Listen for upload progress events.
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setFilesToUpload(prevFiles =>
            prevFiles.map(f =>
              f.id === fileToUpload.id ? { ...f, progress } : f
            )
          );
        }
      });

      // Listen for the request to complete or fail.
      xhr.onreadystatechange = () => {
        if (xhr.readyState === XMLHttpRequest.DONE) {
          if (xhr.status === 201) { // Expecting 201 Created status.
            setFilesToUpload(prevFiles =>
              prevFiles.map(f =>
                f.id === fileToUpload.id ? { ...f, status: 'success' } : f
              )
            );
            setUploadedCount(prevCount => prevCount + 1);
            resolve();
          } else {
            const errorMessage = xhr.responseText || `Upload failed with status: ${xhr.status}`;
            setFilesToUpload(prevFiles =>
              prevFiles.map(f =>
                f.id === fileToUpload.id ? { ...f, status: 'error', errorMessage } : f
              )
            );
            reject(new Error(errorMessage));
          }
        }
      };

      // Open and send the request with the updated URL prefix and headers.
      xhr.open('POST', `/api/v1/uploadImageToGallery?gallery_id=${galleryId}`, true);
      xhr.setRequestHeader('X-Api-Key', apiKey);
      xhr.send(formData);
    });
  };

  // --- Event Handlers ---

  const handleGalleryIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGalleryId(e.target.value);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleSubmit = async () => {
    if (!galleryId) {
      alert('Please enter a Gallery ID.');
      return;
    }

    const apiKey = localStorage.getItem(localStorageKey);
    if (!apiKey) {
      alert('API Key is missing. Please set the API key in local storage.');
      return;
    }

    setIsUploading(true);
    try {
      // Create a copy to prevent mutation during iteration
      const filesToProcess = [...filesToUpload];
      await Promise.all(filesToProcess.map(uploadSingleFile));
    } catch (error) {
      console.error('An error occurred during upload:', error);
    } finally {
      setIsUploading(false);
    }
  };

  // Function to remove a file from the list before upload
  const removeFile = (id: number) => {
    setFilesToUpload(prevFiles => prevFiles.filter(file => file.id !== id));
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-neutral-900 text-neutral-200 p-4">
      <div className="w-full max-w-lg p-8 space-y-6 bg-neutral-800 rounded-xl shadow-2xl border border-neutral-700">
        <h2 className="text-3xl font-semibold text-center text-white flex items-center justify-center gap-2">
          <UploadCloud className="w-8 h-8 text-neutral-400" /> Upload Images
        </h2>
        
        {/* Gallery ID Input */}
        <div className="space-y-2">
          <label htmlFor="galleryId" className="block text-sm font-medium text-neutral-400">
            Gallery ID
          </label>
          <input
            id="galleryId"
            name="galleryId"
            type="text"
            value={galleryId}
            onChange={handleGalleryIdChange}
            required
            className="mt-1 block w-full px-4 py-2 bg-neutral-700 text-white rounded-md shadow-inner border border-transparent focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500 sm:text-sm transition duration-200"
            placeholder="e.g., my-travels-2024"
          />
        </div>

        {/* Drag and Drop Area */}
        <div 
          onDragEnter={handleDrag} 
          onDragLeave={handleDrag} 
          onDragOver={handleDrag} 
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl transition duration-200 
            ${dragActive ? 'border-neutral-500 bg-neutral-700' : 'border-neutral-600 bg-neutral-800'}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/jpg"
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="text-center space-y-2">
            <span className="text-neutral-400 flex items-center justify-center gap-2">
              <Image className="w-5 h-5" /> Drag & Drop images here
            </span>
            <span className="block text-neutral-500">or</span>
            <button
              type="button"
              onClick={triggerFileInput}
              className="py-2 px-4 rounded-md text-sm font-medium text-neutral-900 bg-neutral-200 hover:bg-neutral-300 transition duration-200"
            >
              Browse Files
            </button>
          </div>
        </div>

        {/* Global Progress Bar (Conditional) */}
        {filesToUpload.length > 3 && (
          <div className="space-y-2 pt-4 border-t border-neutral-700">
            <h3 className="text-lg font-medium text-white">Global Progress:</h3>
            <div className="h-2 bg-neutral-500 rounded-full overflow-hidden">
              <div
                className="h-full bg-neutral-200 transition-all duration-300"
                style={{ width: `${globalProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-neutral-400 text-right">
              {uploadedCount} of {filesToUpload.length} files uploaded
            </p>
          </div>
        )}

        {/* Upload Button */}
        <button
          onClick={handleSubmit}
          type="button"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-lg text-sm font-medium text-neutral-900 bg-neutral-200 hover:bg-neutral-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-400 disabled:opacity-50 transition duration-200"
          disabled={isUploading || !galleryId || filesToUpload.length === 0}
        >
          {isUploading ? 'Uploading...' : `Upload ${filesToUpload.length} file(s)`}
        </button>

        {/* File List and Progress Bars */}
        {filesToUpload.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-neutral-700">
            <h3 className="text-lg font-medium text-white">Files to Upload:</h3>
            <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {filesToUpload.map(fileItem => (
                <li key={fileItem.id} className="p-4 bg-neutral-700 rounded-lg flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-mono text-neutral-300 truncate">
                        {fileItem.file.name}
                      </span>
                      <button 
                        onClick={() => removeFile(fileItem.id)}
                        className="text-neutral-500 hover:text-white transition duration-200"
                        title="Remove file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    {fileItem.status === 'success' && (
                      <div className="flex items-center gap-2 text-sm text-green-500">
                        <Check className="w-4 h-4" />
                        <span>Done</span>
                      </div>
                    )}
                    {fileItem.status === 'error' && (
                      <div className="flex items-center gap-2 text-sm text-red-500">
                        <AlertCircle className="w-4 h-4" />
                        <span>Error</span>
                      </div>
                    )}
                    {fileItem.status !== 'success' && fileItem.status !== 'error' && (
                      <div className="h-1 bg-neutral-500 rounded-full overflow-hidden mt-1">
                        <div
                          className="h-full bg-neutral-200 transition-all duration-300"
                          style={{ width: `${fileItem.progress}%` }}
                        ></div>
                      </div>
                    )}
                    {fileItem.status === 'error' && fileItem.errorMessage && (
                      <p className="mt-1 text-xs text-red-400">{fileItem.errorMessage}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;
