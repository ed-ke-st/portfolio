"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getDesignsForUser } from "@/lib/designs";
import {
  createDesign,
  updateDesign,
  deleteDesign,
  uploadFile,
  MediaAsset,
  previewPdf,
  extractPdfPages,
  DesignWork,
  PdfPage,
  FailedPage,
} from "@/lib/admin-api";
import IntegrationsRequiredModal from "@/components/IntegrationsRequiredModal";
import MediaLibraryModal from "@/components/MediaLibraryModal";

const CATEGORIES = ["logo", "branding", "ui", "print", "other"];

interface DesignFormData {
  title: string;
  description: string;
  category: string;
  images: string[];
  primary_image: number;
  videos: string[];
  client: string;
  year: string;
  featured: boolean;
  order: number;
}

const emptyForm: DesignFormData = {
  title: "",
  description: "",
  category: "logo",
  images: [],
  primary_image: 0,
  videos: [],
  client: "",
  year: new Date().getFullYear().toString(),
  featured: false,
  order: 0,
};

export default function DesignsPage() {
  const params = useParams();
  const username = params.username as string;
  const [designs, setDesigns] = useState<DesignWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<DesignFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // PDF state
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfPages, setPdfPages] = useState<PdfPage[]>([]);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [processingPdf, setProcessingPdf] = useState(false);
  const [pdfPageCount, setPdfPageCount] = useState(0);
  const [pdfPreviewTruncated, setPdfPreviewTruncated] = useState(false);
  const [showIntegrationsModal, setShowIntegrationsModal] = useState(false);
  const [integrationsModalMessage, setIntegrationsModalMessage] = useState("");
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [draggingImageIndex, setDraggingImageIndex] = useState<number | null>(null);
  const [showVideoLibrary, setShowVideoLibrary] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  const fetchDesigns = async () => {
    try {
      const data = await getDesignsForUser(username);
      setDesigns(data as unknown as DesignWork[]);
    } catch (error) {
      console.error("Failed to fetch designs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDesigns();
  }, [username]);

  const handleEdit = (design: DesignWork) => {
    setForm({
      title: design.title,
      description: design.description || "",
      category: design.category,
      images: design.images,
      primary_image: design.primary_image || 0,
      videos: design.videos || [],
      client: design.client || "",
      year: design.year?.toString() || "",
      featured: design.featured,
      order: design.order,
    });
    setEditingId(design.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this design?")) return;

    try {
      await deleteDesign(id);
      await fetchDesigns();
    } catch (error) {
      console.error("Failed to delete design:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const designData = {
      title: form.title,
      description: form.description || null,
      category: form.category,
      images: form.images,
      primary_image: form.primary_image,
      videos: form.videos.length > 0 ? form.videos : null,
      client: form.client || null,
      year: form.year ? parseInt(form.year) : null,
      featured: form.featured,
      order: form.order,
    };

    try {
      if (editingId) {
        await updateDesign(editingId, designData);
      } else {
        await createDesign(designData);
      }
      await fetchDesigns();
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
    } catch (error) {
      console.error("Failed to save design:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map((file) => uploadFile(file));
      const results = await Promise.all(uploadPromises);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const newUrls = results.map((r) =>
        r.url.startsWith("http") ? r.url : `${apiUrl}${r.url}`
      );
      setForm({ ...form, images: [...form.images, ...newUrls] });
    } catch (error) {
      console.error("Failed to upload images:", error);
      const message = error instanceof Error ? error.message : "Failed to upload images";
      if (message.toLowerCase().includes("integrations") || message.toLowerCase().includes("cloudinary")) {
        setIntegrationsModalMessage(message);
        setShowIntegrationsModal(true);
      } else {
        alert(message);
      }
    } finally {
      setUploading(false);
    }
  };

  const handlePdfSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.name.toLowerCase().endsWith(".pdf")) return;

    setPdfFile(file);
    setProcessingPdf(true);
    setShowPdfModal(true);
    setSelectedPages([]);

    try {
      const result = await previewPdf(file);
      setPdfPages(result.pages);
      setPdfPageCount(result.page_count || result.pages.length);
      setPdfPreviewTruncated(Boolean(result.truncated));
    } catch (error) {
      console.error("Failed to preview PDF:", error);
      const message = error instanceof Error ? error.message : "Failed to process PDF";
      alert(message);
      setShowPdfModal(false);
    } finally {
      setProcessingPdf(false);
    }
  };

  const togglePageSelection = (pageNum: number) => {
    setSelectedPages((prev) =>
      prev.includes(pageNum)
        ? prev.filter((p) => p !== pageNum)
        : [...prev, pageNum]
    );
  };

  const handleExtractPages = async () => {
    if (!pdfFile || selectedPages.length === 0) return;

    setProcessingPdf(true);
    try {
      const result = await extractPdfPages(pdfFile, selectedPages);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const newUrls = result.images.map((img) =>
        img.url.startsWith("http") ? img.url : `${apiUrl}${img.url}`
      );

      if (newUrls.length > 0) {
        setForm({ ...form, images: [...form.images, ...newUrls] });
      }

      if (result.failed && result.failed.length > 0) {
        const failedPageNumbers = result.failed.map((f: FailedPage) => f.page + 1).join(", ");
        if (result.images.length > 0) {
          alert(
            `Extracted ${result.images.length} of ${result.total_requested} pages.\n\n` +
            `Failed pages: ${failedPageNumbers}\n\n` +
            `This may be due to memory limits. Try extracting fewer pages at once.`
          );
        } else {
          alert(
            `Failed to extract all pages.\n\n` +
            `Failed pages: ${failedPageNumbers}\n\n` +
            `This may be due to memory limits. Try extracting fewer pages at once.`
          );
        }
      }

      setShowPdfModal(false);
      setPdfFile(null);
      setPdfPages([]);
      setSelectedPages([]);
      setPdfPageCount(0);
      setPdfPreviewTruncated(false);
    } catch (error) {
      console.error("Failed to extract pages:", error);
      const message = error instanceof Error ? error.message : "Failed to extract pages.";
      if (message.toLowerCase().includes("integrations") || message.toLowerCase().includes("cloudinary")) {
        setIntegrationsModalMessage(message);
        setShowIntegrationsModal(true);
      } else {
        alert(`${message} Try selecting fewer pages at once.`);
      }
    } finally {
      setProcessingPdf(false);
    }
  };

  const removeImage = (index: number) => {
    const newImages = form.images.filter((_, i) => i !== index);
    setForm({
      ...form,
      images: newImages,
      primary_image: form.primary_image >= newImages.length ? 0 : form.primary_image,
    });
  };

  const setPrimaryImage = (index: number) => {
    setForm({ ...form, primary_image: index });
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    setForm((prev) => {
      const images = [...prev.images];
      const [moved] = images.splice(fromIndex, 1);
      images.splice(toIndex, 0, moved);

      let nextPrimary = prev.primary_image;
      if (prev.primary_image === fromIndex) {
        nextPrimary = toIndex;
      } else if (fromIndex < prev.primary_image && toIndex >= prev.primary_image) {
        nextPrimary = prev.primary_image - 1;
      } else if (fromIndex > prev.primary_image && toIndex <= prev.primary_image) {
        nextPrimary = prev.primary_image + 1;
      }

      return {
        ...prev,
        images,
        primary_image: nextPrimary,
      };
    });
  };

  const handleSelectMediaAsset = (asset: MediaAsset) => {
    setForm((prev) => {
      if (prev.images.includes(asset.url)) return prev;
      return { ...prev, images: [...prev.images, asset.url] };
    });
  };

  const handleSelectManyMediaAssets = (assets: MediaAsset[]) => {
    if (!assets.length) return;
    setForm((prev) => {
      const existing = new Set(prev.images);
      const additions = assets.map((asset) => asset.url).filter((url) => !existing.has(url));
      if (additions.length === 0) return prev;
      return { ...prev, images: [...prev.images, ...additions] };
    });
    setShowMediaLibrary(false);
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingVideo(true);
    try {
      const result = await uploadFile(file);
      const url = result.url.startsWith("http")
        ? result.url
        : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${result.url}`;
      setForm((prev) => ({ ...prev, videos: [...prev.videos, url] }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload video";
      if (message.toLowerCase().includes("integrations") || message.toLowerCase().includes("cloudinary")) {
        setIntegrationsModalMessage(message);
        setShowIntegrationsModal(true);
      } else {
        alert(message);
      }
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleSelectVideoAsset = (asset: MediaAsset) => {
    setForm((prev) => {
      if (prev.videos.includes(asset.url)) return prev;
      return { ...prev, videos: [...prev.videos, asset.url] };
    });
    setShowVideoLibrary(false);
  };

  return (
    <div>
      <IntegrationsRequiredModal
        isOpen={showIntegrationsModal}
        username={username}
        message={integrationsModalMessage || "This feature requires Cloudinary to be configured."}
        onClose={() => setShowIntegrationsModal(false)}
      />
      <MediaLibraryModal
        isOpen={showMediaLibrary}
        onClose={() => setShowMediaLibrary(false)}
        onSelect={handleSelectMediaAsset}
        onSelectMany={handleSelectManyMediaAssets}
        multiSelect
      />
      <MediaLibraryModal
        isOpen={showVideoLibrary}
        onClose={() => setShowVideoLibrary(false)}
        onSelect={handleSelectVideoAsset}
        resourceType="video"
      />
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Design Projects</h1>
        <button
          onClick={() => {
            setForm(emptyForm);
            setEditingId(null);
            setShowForm(true);
          }}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
        >
          Add Design Project
        </button>
      </div>

      {/* PDF Modal */}
      {showPdfModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                Select Pages to Extract
              </h2>
              <button
                onClick={() => {
                  setShowPdfModal(false);
                  setPdfFile(null);
                  setPdfPages([]);
                  setSelectedPages([]);
                  setPdfPageCount(0);
                  setPdfPreviewTruncated(false);
                }}
                className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              >
                &times;
              </button>
            </div>

            {processingPdf && pdfPages.length === 0 ? (
              <p className="text-center py-8 text-zinc-500">Processing PDF...</p>
            ) : (
              <>
                {pdfPreviewTruncated && (
                  <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    Showing previews for the first {pdfPages.length} of {pdfPageCount} pages.
                    Large PDFs are limited to reduce memory usage. If you need later pages, try a smaller PDF or split the file.
                  </div>
                )}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 mb-6">
                  {pdfPages.map((page) => (
                    <button
                      key={page.page}
                      onClick={() => togglePageSelection(page.page)}
                      className={`relative aspect-[3/4] rounded-lg overflow-hidden border-2 transition-colors ${
                        selectedPages.includes(page.page)
                          ? "border-purple-500"
                          : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-400"
                      }`}
                    >
                      <img
                        src={page.preview}
                        alt={`Page ${page.page + 1}`}
                        className="w-full h-full object-contain bg-zinc-100 dark:bg-zinc-900"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs py-1 text-center">
                        Page {page.page + 1}
                      </div>
                      {selectedPages.includes(page.page) && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm">
                          ✓
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                <div className="flex justify-between items-center">
                  <p className="text-sm text-zinc-500">
                    {selectedPages.length} page(s) selected
                  </p>
                  <button
                    onClick={handleExtractPages}
                    disabled={selectedPages.length === 0 || processingPdf}
                    className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    {processingPdf ? "Extracting..." : "Extract Selected Pages"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-6">
              {editingId ? "Edit Design Project" : "New Design Project"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Year
                  </label>
                  <input
                    type="number"
                    value={form.year}
                    onChange={(e) => setForm({ ...form, year: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Client
                </label>
                <input
                  type="text"
                  value={form.client}
                  onChange={(e) => setForm({ ...form, client: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Images {form.images.length > 0 && <span className="text-zinc-500">(click to set thumbnail, drag to reorder)</span>}
                </label>

                {form.images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {form.images.map((url, index) => (
                      <div
                        key={index}
                        draggable
                        onDragStart={() => setDraggingImageIndex(index)}
                        onDragEnd={() => setDraggingImageIndex(null)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (draggingImageIndex === null) return;
                          moveImage(draggingImageIndex, index);
                          setDraggingImageIndex(null);
                        }}
                        className={`relative w-24 h-24 rounded-lg overflow-hidden group cursor-pointer border-2 ${
                          index === form.primary_image
                            ? "border-purple-500"
                            : "border-transparent"
                        } ${draggingImageIndex === index ? "opacity-60" : ""}`}
                        onClick={() => setPrimaryImage(index)}
                      >
                        <img
                          src={url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        {index === form.primary_image && (
                          <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-purple-500 text-white text-xs rounded">
                            Main
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage(index);
                          }}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <label className="px-4 py-2 bg-zinc-200 dark:bg-zinc-600 hover:bg-zinc-300 dark:hover:bg-zinc-500 text-zinc-700 dark:text-white font-medium rounded-lg cursor-pointer transition-colors">
                    {uploading ? "Uploading..." : "Upload Images"}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowMediaLibrary(true)}
                    className="px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-700 dark:text-zinc-200 font-medium"
                  >
                    Library
                  </button>
                  <label className="px-4 py-2 bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 font-medium rounded-lg cursor-pointer transition-colors">
                    Upload PDF
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handlePdfSelect}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Videos */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Videos <span className="text-zinc-400 font-normal">(optional — shown after images in the gallery)</span>
                </label>
                {form.videos.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {form.videos.map((url, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 rounded-lg border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-700/50">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 flex-shrink-0">
                          Video {index + 1}
                        </span>
                        <span className="text-xs text-zinc-500 truncate flex-1">{url}</span>
                        <button
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, videos: prev.videos.filter((_, i) => i !== index) }))}
                          className="text-zinc-400 hover:text-red-500 transition-colors flex-shrink-0"
                        >✕</button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <label className="px-4 py-2 bg-zinc-200 dark:bg-zinc-600 hover:bg-zinc-300 dark:hover:bg-zinc-500 text-zinc-700 dark:text-white font-medium rounded-lg cursor-pointer transition-colors">
                    {uploadingVideo ? "Uploading..." : "Upload Video"}
                    <input type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowVideoLibrary(true)}
                    className="px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-700 dark:text-zinc-200 font-medium"
                  >
                    Library
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                  }}
                  className="px-4 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Design Projects Grid */}
      {loading ? (
        <p className="text-zinc-500">Loading...</p>
      ) : designs.length === 0 ? (
        <p className="text-zinc-500">No designs yet. Add your first design!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {designs.map((design) => (
            <div
              key={design.id}
              className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden"
            >
              <div className="aspect-video bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                {design.images.length > 0 ? (
                  <img
                    src={design.images[design.primary_image || 0] || design.images[0]}
                    alt={design.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-zinc-400">No image</span>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-zinc-900 dark:text-white">
                      {design.title}
                    </h3>
                    <p className="text-sm text-zinc-500 capitalize">
                      {design.category} {design.year && `• ${design.year}`}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <span className="px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded">
                      {design.images.length} img
                    </span>
                    {(design.videos?.length ?? 0) > 0 && (
                      <span className="px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded">
                        {design.videos!.length} vid
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => handleEdit(design)}
                    className="text-blue-600 hover:text-blue-500 font-medium text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(design.id)}
                    className="text-red-600 hover:text-red-500 font-medium text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
