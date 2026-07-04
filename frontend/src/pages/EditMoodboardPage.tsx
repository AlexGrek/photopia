import React, { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  Loader2,
  Sigma,
  Trash2,
  Plus,
  ArrowUp,
  ArrowDown,
  ImagePlus,
  Save,
  Type,
  Images,
  X,
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import type {
  Moodboard,
  MoodboardImage,
  MoodboardImageView,
  MoodboardSection,
  MoodboardSectionType,
} from "../Models";
import Logo from "../components/Logo";
import { useNotification } from "../contexts/NotificationContext";
import { localStorageKey } from "../components/ApiKeyForm";
import ConfirmationModal from "../components/ConfirmationModal";

const IMAGE_PLACEHOLDER =
  "https://placehold.co/600x600/1f2937/d1d5db?text=Image+Not+Found";

const viewOptions: MoodboardImageView[] = [
  "grid",
  "list",
  "horizontalScroller",
];

const EditMoodboardPage: React.FC = () => {
  const { moodboardId } = useParams<{ moodboardId: string }>();
  const [moodboard, setMoodboard] = useState<Moodboard | null>(null);
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [uploadingSection, setUploadingSection] = useState<number | null>(null);

  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const { notify } = useNotification();

  useEffect(() => {
    const fetchM = async () => {
      try {
        const response = await fetch(
          `/api/v1/moodboard?moodboard_id=${moodboardId}`,
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch moodboard: ${response.status} ${response.statusText}`,
          );
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
        notify(err.message, "error");
      } finally {
        setLoading(false);
      }
    };
    if (moodboardId) fetchM();
  }, [moodboardId]);

  const updateSections = (sections: MoodboardSection[]) => {
    if (!moodboard) return;
    setMoodboard({ ...moodboard, sections });
  };

  const handleAddSection = (type: MoodboardSectionType) => {
    if (!moodboard) return;
    const newSection: MoodboardSection =
      type === "text"
        ? { type: "text", text: "" }
        : { type: "images", view: "grid", images: [] };
    updateSections([...moodboard.sections, newSection]);
  };

  const handleDeleteSection = (index: number) => {
    if (!moodboard) return;
    updateSections(moodboard.sections.filter((_, i) => i !== index));
  };

  const handleMoveSection = (index: number, direction: -1 | 1) => {
    if (!moodboard) return;
    const target = index + direction;
    if (target < 0 || target >= moodboard.sections.length) return;
    const sections = [...moodboard.sections];
    [sections[index], sections[target]] = [sections[target], sections[index]];
    updateSections(sections);
  };

  const handleSectionTextChange = (index: number, text: string) => {
    if (!moodboard) return;
    const sections = [...moodboard.sections];
    sections[index] = { ...sections[index], text };
    updateSections(sections);
  };

  const handleSectionViewChange = (index: number, view: MoodboardImageView) => {
    if (!moodboard) return;
    const sections = [...moodboard.sections];
    sections[index] = { ...sections[index], view };
    updateSections(sections);
  };

  const handleImageDescriptionChange = (
    sectionIndex: number,
    imageId: string,
    description: string,
  ) => {
    if (!moodboard) return;
    const sections = [...moodboard.sections];
    const section = sections[sectionIndex];
    const images = (section.images || []).map((img) =>
      img.id === imageId ? { ...img, description } : img,
    );
    sections[sectionIndex] = { ...section, images };
    updateSections(sections);
  };

  const handleRemoveImage = async (
    sectionIndex: number,
    image: MoodboardImage,
  ) => {
    if (!moodboard) return;

    // Optimistically update local state.
    const sections = [...moodboard.sections];
    const section = sections[sectionIndex];
    sections[sectionIndex] = {
      ...section,
      images: (section.images || []).filter((img) => img.id !== image.id),
    };
    updateSections(sections);

    try {
      const response = await fetch(
        `/api/v1/moodboardImage?moodboard_id=${moodboardId}&url=${encodeURIComponent(image.url)}`,
        {
          method: "DELETE",
          headers: {
            "X-Api-Key": String(localStorage.getItem(localStorageKey)),
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      notify("Image removed.");
    } catch (err: unknown) {
      if (err instanceof Error) {
        notify(`Failed to remove image: ${err.message}`, "error");
      } else {
        notify("An unknown error occurred while removing the image.", "error");
      }
    }
  };

  const handleUploadImages = async (
    sectionIndex: number,
    files: FileList | null,
  ) => {
    if (!files || files.length === 0 || !moodboard) return;

    const apiKey = localStorage.getItem(localStorageKey);
    if (!apiKey) {
      notify("API key is missing.", "error");
      return;
    }

    setUploadingSection(sectionIndex);
    let uploadedCount = 0;

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("image_file", file);

        const response = await fetch(
          `/api/v1/uploadMoodboardImage?moodboard_id=${moodboardId}`,
          {
            method: "POST",
            headers: {
              "X-Api-Key": apiKey,
            },
            body: formData,
          },
        );

        if (!response.ok) {
          throw new Error(
            `Failed to upload ${file.name}: HTTP ${response.status}`,
          );
        }

        const uploaded = (await response.json()) as {
          id: string;
          url: string;
          width?: number;
          height?: number;
        };

        setMoodboard((prev) => {
          if (!prev) return prev;
          const sections = [...prev.sections];
          const section = sections[sectionIndex];
          const newImage: MoodboardImage = {
            id: uploaded.id,
            url: uploaded.url,
            width: uploaded.width,
            height: uploaded.height,
            description: "",
          };
          sections[sectionIndex] = {
            ...section,
            images: [...(section.images || []), newImage],
          };
          return { ...prev, sections };
        });

        uploadedCount += 1;
      }
      notify(
        `Uploaded ${uploadedCount} image${uploadedCount === 1 ? "" : "s"}.`,
      );
    } catch (err: unknown) {
      if (err instanceof Error) {
        notify(`Upload failed: ${err.message}`, "error");
      } else {
        notify("An unknown error occurred during upload.", "error");
      }
    } finally {
      setUploadingSection(null);
    }
  };

  const handleSave = async () => {
    if (!moodboard) return;
    setSaving(true);
    try {
      const response = await fetch(
        `/api/v1/updateMoodboard?moodboard_id=${moodboardId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Api-Key": String(localStorage.getItem(localStorageKey)),
          },
          body: JSON.stringify(moodboard),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setMoodboard(data as Moodboard);
      notify("Moodboard saved.");
    } catch (err: unknown) {
      if (err instanceof Error) {
        notify(`Failed to save moodboard: ${err.message}`, "error");
      } else {
        notify("An unknown error occurred while saving.", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMoodboard = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/v1/moodboard?moodboard_id=${moodboardId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "X-Api-Key": String(localStorage.getItem(localStorageKey)),
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      notify("Moodboard deleted.");
      navigate("/moodboards");
    } catch (err: unknown) {
      if (err instanceof Error) {
        notify(`Failed to delete moodboard: ${err.message}`, "error");
      } else {
        notify("An unknown error occurred.", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!moodboard) {
    return (
      <div className="w-full min-h-screen text-white">
        {loading && (
          <p className="animate-pulse">
            <Loader2 />
          </p>
        )}
        {error && (
          <p className="animate-pulse">
            <Sigma />
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gray-950 text-white min-h-screen font-sans">
      <ConfirmationModal
        isVisible={deleteOpen}
        onConfirm={handleDeleteMoodboard}
        onCancel={() => setDeleteOpen(false)}
        title={`Delete "${moodboard.name}"?`}
        confirmText="Delete"
        cancelText="Cancel"
        message="This action cannot be undone. Are you sure you want to delete this whole moodboard?"
      />

      <motion.header
        layoutId={`moodboard-card-${moodboard.id}`}
        className="relative w-full h-64 overflow-hidden"
        style={{ backgroundColor: moodboard.headerColor }}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-md flex flex-col justify-end p-6 md:p-10">
          <div
            className="absolute"
            style={{ transform: "translate(-1em, -9.5em)" }}
          >
            <Logo />
          </div>
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <button
              id="back-btn"
              onClick={() => navigate(`/m/${moodboardId}`)}
              className="bg-gray-800/50 backdrop-blur-sm p-2 rounded-full hover:bg-gray-700/50 transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
            <input
              id="moodboard-name-inp"
              className="text-4xl font-semibold bg-transparent border-b border-transparent hover:border-white/30 focus:border-white/60 focus:outline-none"
              value={moodboard.name}
              onChange={(e) =>
                setMoodboard({ ...moodboard, name: e.target.value })
              }
            />
            <input
              id="moodboard-color-inp"
              type="color"
              value={moodboard.headerColor}
              onChange={(e) =>
                setMoodboard({ ...moodboard, headerColor: e.target.value })
              }
              className="h-10 w-14 rounded-md border border-white/30 bg-transparent cursor-pointer"
              title="Header color"
            />
            <button
              id="save-btn"
              onClick={handleSave}
              disabled={saving}
              className="bg-gray-800/50 backdrop-blur-sm p-2 rounded-full hover:bg-gray-700/50 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                <Save size={24} />
              )}
            </button>
            <button
              id="del-btn"
              onClick={() => setDeleteOpen(true)}
              className="bg-gray-800/50 backdrop-blur-sm p-2 rounded-full hover:bg-gray-700/50 transition-colors"
            >
              <Trash2 size={24} />
            </button>
            {loading && (
              <span className="animate-spin">
                <Loader2 size={24} />
              </span>
            )}
          </div>
        </div>
      </motion.header>

      <main className="container mx-auto p-6 pt-10 fadeIn space-y-8">
        {moodboard.sections.map((section, index) => (
          <div
            key={index}
            className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-400 text-sm uppercase tracking-wide">
                {section.type === "text" ? (
                  <Type size={16} />
                ) : (
                  <Images size={16} />
                )}
                <span>{section.type} section</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleMoveSection(index, -1)}
                  disabled={index === 0}
                  className="p-1.5 rounded-full bg-gray-800 hover:bg-gray-700 disabled:opacity-30 transition-colors"
                  title="Move up"
                >
                  <ArrowUp size={16} />
                </button>
                <button
                  onClick={() => handleMoveSection(index, 1)}
                  disabled={index === moodboard.sections.length - 1}
                  className="p-1.5 rounded-full bg-gray-800 hover:bg-gray-700 disabled:opacity-30 transition-colors"
                  title="Move down"
                >
                  <ArrowDown size={16} />
                </button>
                <button
                  onClick={() => handleDeleteSection(index)}
                  className="p-1.5 rounded-full bg-gray-800 hover:bg-red-700 transition-colors"
                  title="Delete section"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {section.type === "text" && (
              <textarea
                value={section.text || ""}
                onChange={(e) => handleSectionTextChange(index, e.target.value)}
                rows={6}
                placeholder="Write something..."
                className="w-full bg-gray-950 text-gray-100 rounded-lg p-4 border border-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-600 resize-y"
              />
            )}

            {section.type === "images" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <label className="text-sm text-gray-400">View:</label>
                  <select
                    value={section.view || "grid"}
                    onChange={(e) =>
                      handleSectionViewChange(
                        index,
                        e.target.value as MoodboardImageView,
                      )
                    }
                    className="bg-gray-950 text-gray-100 rounded-md border border-gray-800 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-600"
                  >
                    {viewOptions.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => fileInputRefs.current[index]?.click()}
                    disabled={uploadingSection === index}
                    className="ml-auto flex items-center gap-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-sm py-1.5 px-3 rounded-md transition-colors"
                  >
                    {uploadingSection === index ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <ImagePlus size={16} />
                    )}
                    Add image(s)
                  </button>
                  <input
                    ref={(el) => {
                      fileInputRefs.current[index] = el;
                    }}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      handleUploadImages(index, e.target.files);
                      e.target.value = "";
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {(section.images || []).map((image) => (
                    <div
                      key={image.id}
                      className="relative bg-gray-950 rounded-lg border border-gray-800 p-2 flex flex-col gap-2"
                    >
                      <div className="relative">
                        <img
                          src={image.url}
                          alt={image.description || ""}
                          onError={(e) => {
                            e.currentTarget.src = IMAGE_PLACEHOLDER;
                            e.currentTarget.onerror = null;
                          }}
                          className="w-full h-32 object-cover rounded-md"
                        />
                        <button
                          onClick={() => handleRemoveImage(index, image)}
                          className="absolute top-1 right-1 bg-black/60 hover:bg-red-700 rounded-full p-1 transition-colors"
                          title="Remove image"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={image.description || ""}
                        onChange={(e) =>
                          handleImageDescriptionChange(
                            index,
                            image.id,
                            e.target.value,
                          )
                        }
                        placeholder="Description"
                        className="w-full bg-gray-900 text-gray-100 text-xs rounded-md px-2 py-1 border border-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-600"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleAddSection("text")}
            className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 py-2 px-4 rounded-lg transition-colors"
          >
            <Plus size={18} /> <Type size={18} /> Text section
          </button>
          <button
            onClick={() => handleAddSection("images")}
            className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 py-2 px-4 rounded-lg transition-colors"
          >
            <Plus size={18} /> <Images size={18} /> Images section
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-gray-500 text-sm mt-10">
        <p>by Unknown Desires, 2025</p>
      </footer>
    </div>
  );
};

export default EditMoodboardPage;
