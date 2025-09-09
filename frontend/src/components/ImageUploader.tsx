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

  // New function to handle uploads with a concurrency limit
  const uploadWithConcurrencyLimit = async (files: UploadFile[], limit: number) => {
    const queue = [...files]; // Use a copy of the files array as a queue
    const workers = new Set<Promise<void>>(); // Use a Set to track active promises

    const startNext = async () => {
      if (queue.length === 0) return;

      const fileToUpload = queue.shift();
      if (!fileToUpload) return;

      const task = uploadSingleFile(fileToUpload).finally(() => {
        workers.delete(task); // Remove the task from the set when it's done
        startNext(); // Start the next upload in the queue
      });

      workers.add(task);
      return task;
    };

    // Start the initial set of concurrent uploads
    const initialWorkers = [];
    for (let i = 0; i < Math.min(limit, files.length); i++) {
      initialWorkers.push(startNext());
    }

    // Wait for all initial workers and subsequent tasks to complete
    await Promise.all(initialWorkers);
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
      const filesToProcess = [...filesToUpload];
      // Changed to use the new concurrency limited function.
      await uploadWithConcurrencyLimit(filesToProcess, 4);
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
            className="mt-1 block w-full px-4 py-2 bg-neutral-700 text-white rounded-md shadow-inner border border-transparent focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500 sm:text-sm transition duration-150 ease-in-out"
            placeholder="e.g., my-photo-gallery"
          />
        </div>
        
        {/* Drag and Drop area */}
        <div
          className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg p-6 text-center transition duration-200 ease-in-out ${
            dragActive ? 'border-neutral-400 bg-neutral-700' : 'border-neutral-600 bg-neutral-800'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={triggerFileInput}
        >
          <input
            ref={fileInputRef}
            type="file"
            id="file-upload"
            className="hidden"
            multiple
            onChange={handleFileSelect}
            accept=".jpg, .jpeg"
          />
          <div className="flex flex-col items-center justify-center space-y-2">
            <UploadCloud className="w-12 h-12 text-neutral-400" />
            <p className="text-sm text-neutral-400">
              <span className="font-semibold text-white">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-neutral-500">Only JPG and JPEG files are allowed.</p>
          </div>
        </div>

        {/* Upload Button and Progress */}
        <div className="flex items-center justify-between">
          <button
            id="file-upload-submit"
            onClick={handleSubmit}
            className={`w-full py-2 px-4 rounded-md font-semibold transition duration-200 ease-in-out ${
              filesToUpload.length === 0 || isUploading
                ? 'bg-neutral-600 text-neutral-400 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
            disabled={filesToUpload.length === 0 || isUploading}
          >
            {isUploading ? 'Uploading...' : `Upload ${filesToUpload.length} Files`}
          </button>
        </div>

        {/* Global Progress Bar */}
        {filesToUpload.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-neutral-400">
              Overall Progress: {uploadedCount}/{filesToUpload.length} files
            </p>
            <div className="w-full bg-neutral-700 rounded-full h-2.5">
              <div
                className="bg-indigo-500 h-2.5 rounded-full transition-all duration-300 ease-in-out"
                style={{ width: `${globalProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* File List */}
        {filesToUpload.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Files to Upload</h3>
            <ul className="space-y-3 max-h-60 overflow-y-auto">
              {filesToUpload.map((fileItem) => (
                <li
                  key={fileItem.id}
                  className="flex items-center justify-between p-3 bg-neutral-700 rounded-lg shadow"
                >
                  <div className="flex items-center space-x-3 truncate">
                    <Image className="w-5 h-5 flex-shrink-0 text-neutral-400" />
                    <span className="text-sm font-medium truncate text-white">{fileItem.file.name}</span>
                  </div>
                  <div className="flex-1 min-w-0 ml-4">
                    <div className="flex justify-end items-center space-x-2">
                      <p className="text-xs font-medium text-neutral-400">
                        {fileItem.status === 'uploading' || fileItem.status === 'success' ? `${fileItem.progress}%` : ''}
                      </p>
                      <button
                        onClick={() => removeFile(fileItem.id)}
                        className="text-neutral-400 hover:text-red-500 transition-colors"
                        aria-label="Remove file"
                        title="Remove file"
                        disabled={isUploading}
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
