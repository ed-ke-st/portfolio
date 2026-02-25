"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getProjectsForUser } from "@/lib/api";
import {
  createProject,
  updateProject,
  deleteProject,
  uploadFile,
  captureProjectScreenshot,
  MediaAsset,
} from "@/lib/admin-api";
import { Project, ProjectGalleryItem } from "@/types/project";
import Cropper, { Area } from "react-easy-crop";
import IntegrationsRequiredModal from "@/components/IntegrationsRequiredModal";
import MediaLibraryModal from "@/components/MediaLibraryModal";

interface ProjectFormData {
  title: string;
  description: string;
  tech_stack: string;
  image_url: string;
  video_url: string;
  github_link: string;
  live_url: string;
  featured: boolean;
  order: number;
}

const emptyForm: ProjectFormData = {
  title: "",
  description: "",
  tech_stack: "",
  image_url: "",
  video_url: "",
  github_link: "",
  live_url: "",
  featured: false,
  order: 0,
};

export default function ProjectsPage() {
  const params = useParams();
  const username = params.username as string;
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ProjectFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [screenshotSrc, setScreenshotSrc] = useState<string | null>(null);
  const [originalScreenshotSrc, setOriginalScreenshotSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [showIntegrationsModal, setShowIntegrationsModal] = useState(false);
  const [integrationsModalMessage, setIntegrationsModalMessage] = useState("");
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [showVideoLibrary, setShowVideoLibrary] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [galleryItems, setGalleryItems] = useState<ProjectGalleryItem[]>([]);
  const [uploadingGalleryIndex, setUploadingGalleryIndex] = useState<number | null>(null);
  const [galleryLibraryIndex, setGalleryLibraryIndex] = useState<number | null>(null);

  const fetchProjects = async () => {
    try {
      const data = await getProjectsForUser(username);
      setProjects(data);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [username]);

  const handleEdit = (project: Project) => {
    setForm({
      title: project.title,
      description: project.description,
      tech_stack: project.tech_stack.join(", "),
      image_url: project.image_url || "",
      video_url: project.video_url || "",
      github_link: project.github_link || "",
      live_url: project.live_url || "",
      featured: false,
      order: 0,
    });
    setGalleryItems(project.gallery || []);
    setEditingId(project.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this project?")) return;

    try {
      await deleteProject(id);
      await fetchProjects();
    } catch (error) {
      console.error("Failed to delete project:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const projectData = {
      title: form.title,
      description: form.description,
      tech_stack: form.tech_stack.split(",").map((s) => s.trim()).filter(Boolean),
      image_url: form.image_url || null,
      video_url: form.video_url || null,
      gallery: galleryItems.length > 0 ? galleryItems : undefined,
      github_link: form.github_link || null,
      live_url: form.live_url || null,
      featured: form.featured,
      order: form.order,
    };

    try {
      if (editingId) {
        await updateProject(editingId, projectData);
      } else {
        await createProject(projectData);
      }
      await fetchProjects();
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      setGalleryItems([]);
      cleanupScreenshot();
    } catch (error) {
      console.error("Failed to save project:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await uploadFile(file);
      const imageUrl = result.url.startsWith("http")
        ? result.url
        : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${result.url}`;
      setForm({ ...form, image_url: imageUrl });
    } catch (error) {
      console.error("Failed to upload image:", error);
      const message = error instanceof Error ? error.message : "Failed to upload image";
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

  const handleCaptureScreenshot = async () => {
    if (!form.live_url) return;
    setCapturing(true);
    try {
      const blob = await captureProjectScreenshot(form.live_url);
      const objectUrl = URL.createObjectURL(blob);
      if (originalScreenshotSrc) URL.revokeObjectURL(originalScreenshotSrc);
      setScreenshotSrc(objectUrl);
      setOriginalScreenshotSrc(objectUrl);
      setShowCropModal(true);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
    } catch (error) {
      console.error("Failed to capture screenshot:", error);
      const message = error instanceof Error ? error.message : "Failed to capture screenshot";
      if (message.toLowerCase().includes("integrations") || message.toLowerCase().includes("screenshot")) {
        setIntegrationsModalMessage(message);
        setShowIntegrationsModal(true);
      } else {
        alert(message);
      }
    } finally {
      setCapturing(false);
    }
  };

  const onCropComplete = (_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  };

  const createImage = (url: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = (err) => reject(err);
      image.src = url;
    });

  const getCroppedBlob = async (imageSrc: string, cropPixels: Area) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    canvas.width = cropPixels.width;
    canvas.height = cropPixels.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas context not available");
    ctx.drawImage(
      image,
      cropPixels.x,
      cropPixels.y,
      cropPixels.width,
      cropPixels.height,
      0,
      0,
      cropPixels.width,
      cropPixels.height
    );
    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Failed to crop image"));
          return;
        }
        resolve(blob);
      }, "image/png");
    });
  };

  const handleUseScreenshot = async () => {
    if (!screenshotSrc || !croppedAreaPixels) return;
    setUploading(true);
    try {
      const croppedBlob = await getCroppedBlob(screenshotSrc, croppedAreaPixels);
      const file = new File([croppedBlob], "project-screenshot.png", {
        type: "image/png",
      });
      const result = await uploadFile(file);
      const imageUrl = result.url.startsWith("http")
        ? result.url
        : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${result.url}`;
      setForm({ ...form, image_url: imageUrl });
      setShowCropModal(false);
      setScreenshotSrc(null);
    } catch (error) {
      console.error("Failed to upload cropped screenshot:", error);
      const message = error instanceof Error ? error.message : "Failed to upload screenshot";
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

  const cleanupScreenshot = () => {
    if (originalScreenshotSrc) URL.revokeObjectURL(originalScreenshotSrc);
    setOriginalScreenshotSrc(null);
    setScreenshotSrc(null);
  };

  const handleSelectMediaAsset = (asset: MediaAsset) => {
    setForm((prev) => ({ ...prev, image_url: asset.url }));
    setShowMediaLibrary(false);
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingVideo(true);
    try {
      const result = await uploadFile(file);
      const videoUrl = result.url.startsWith("http")
        ? result.url
        : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${result.url}`;
      setForm((prev) => ({ ...prev, video_url: videoUrl }));
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
    setForm((prev) => ({ ...prev, video_url: asset.url }));
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
      />
      <MediaLibraryModal
        isOpen={showVideoLibrary}
        onClose={() => setShowVideoLibrary(false)}
        onSelect={handleSelectVideoAsset}
        resourceType="video"
      />
      <MediaLibraryModal
        isOpen={galleryLibraryIndex !== null}
        onClose={() => setGalleryLibraryIndex(null)}
        onSelect={(asset) => {
          if (galleryLibraryIndex === null) return;
          setGalleryItems((prev) => {
            const next = [...prev];
            next[galleryLibraryIndex] = { ...next[galleryLibraryIndex], url: asset.url };
            return next;
          });
          setGalleryLibraryIndex(null);
        }}
        resourceType={galleryLibraryIndex !== null && galleryItems[galleryLibraryIndex]?.type === "video" ? "video" : "image"}
      />
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Dev Projects</h1>
        <button
          onClick={() => {
            setForm(emptyForm);
            setEditingId(null);
            setGalleryItems([]);
            setShowForm(true);
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          Add Dev Project
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-6">
              {editingId ? "Edit Dev Project" : "New Dev Project"}
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
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Tech Stack (comma-separated)
                </label>
                <input
                  type="text"
                  value={form.tech_stack}
                  onChange={(e) => setForm({ ...form, tech_stack: e.target.value })}
                  placeholder="React, TypeScript, Node.js"
                  className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Image
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.image_url}
                    onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                    placeholder="Image URL or upload"
                    className="flex-1 px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                  />
                  <label className="px-4 py-2 bg-zinc-200 dark:bg-zinc-600 hover:bg-zinc-300 dark:hover:bg-zinc-500 text-zinc-700 dark:text-white font-medium rounded-lg cursor-pointer transition-colors">
                    {uploading ? "..." : "Upload"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleCaptureScreenshot}
                    disabled={!form.live_url || capturing}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                    title={!form.live_url ? "Add a Live URL to capture a screenshot" : ""}
                  >
                    {capturing ? "Capturing..." : originalScreenshotSrc ? "Recapture" : "Capture"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowMediaLibrary(true)}
                    className="px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-700 dark:text-zinc-200 font-medium"
                  >
                    Library
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Video <span className="text-zinc-400 font-normal">(optional — adds a play button on the card)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.video_url}
                    onChange={(e) => setForm({ ...form, video_url: e.target.value })}
                    placeholder="Cloudinary video URL or upload"
                    className="flex-1 px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                  />
                  <label className="px-4 py-2 bg-zinc-200 dark:bg-zinc-600 hover:bg-zinc-300 dark:hover:bg-zinc-500 text-zinc-700 dark:text-white font-medium rounded-lg cursor-pointer transition-colors">
                    {uploadingVideo ? "..." : "Upload"}
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoUpload}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowVideoLibrary(true)}
                    className="px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-700 dark:text-zinc-200 font-medium"
                  >
                    Library
                  </button>
                  {form.video_url && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, video_url: "" })}
                      className="px-3 py-2 text-zinc-400 hover:text-red-500 transition-colors"
                      title="Remove video"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Gallery */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Gallery <span className="text-zinc-400 font-normal">(shown on the project detail page)</span>
                </label>
                <div className="space-y-3">
                  {galleryItems.map((item, index) => (
                    <div key={index} className="border border-zinc-200 dark:border-zinc-600 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${item.type === "video" ? "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300" : item.type === "model" ? "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300" : "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"}`}>
                            {item.type === "video" ? "Video" : item.type === "model" ? "3D Model" : "Image"}
                          </span>
                          {item.type !== "model" && <>
                            <div className="flex items-center rounded-lg border border-zinc-200 dark:border-zinc-600 overflow-hidden text-xs font-medium">
                              <button
                                type="button"
                                onClick={() => setGalleryItems((prev) => { const n = [...prev]; n[index] = { ...n[index], layout: "full" }; return n; })}
                                className={`px-2 py-0.5 transition-colors ${(!item.layout || item.layout === "full") ? "bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}
                                title="Full width"
                              >1 col</button>
                              <button
                                type="button"
                                onClick={() => setGalleryItems((prev) => { const n = [...prev]; n[index] = { ...n[index], layout: "side" }; return n; })}
                                className={`px-2 py-0.5 transition-colors ${item.layout === "side" ? "bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}
                                title="Image + caption side by side"
                              >2 col</button>
                            </div>
                            <div className="flex items-center rounded-lg border border-zinc-200 dark:border-zinc-600 overflow-hidden text-xs font-medium">
                              <button
                                type="button"
                                onClick={() => setGalleryItems((prev) => { const n = [...prev]; n[index] = { ...n[index], background: item.background === false ? true : false }; return n; })}
                                className={`px-2 py-0.5 transition-colors ${item.background !== false ? "bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}
                                title="Toggle border / background"
                              >bg</button>
                            </div>
                            <div className="flex items-center rounded-lg border border-zinc-200 dark:border-zinc-600 overflow-hidden text-xs font-medium">
                              <button
                                type="button"
                                onClick={() => setGalleryItems((prev) => { const n = [...prev]; n[index] = { ...n[index], rounded: item.rounded === false ? true : false }; return n; })}
                                className={`px-2 py-0.5 transition-colors ${item.rounded !== false ? "bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}
                                title="Toggle rounded corners"
                              >rnd</button>
                            </div>
                          </>}
                        </div>
                        <div className="flex items-center gap-1">
                          <button type="button" disabled={index === 0} onClick={() => setGalleryItems((prev) => { const n = [...prev]; [n[index - 1], n[index]] = [n[index], n[index - 1]]; return n; })} className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 disabled:opacity-30">↑</button>
                          <button type="button" disabled={index === galleryItems.length - 1} onClick={() => setGalleryItems((prev) => { const n = [...prev]; [n[index + 1], n[index]] = [n[index], n[index + 1]]; return n; })} className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 disabled:opacity-30">↓</button>
                          <button type="button" onClick={() => setGalleryItems((prev) => prev.filter((_, i) => i !== index))} className="p-1 text-zinc-400 hover:text-red-500 transition-colors">✕</button>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={item.url}
                          onChange={(e) => setGalleryItems((prev) => { const n = [...prev]; n[index] = { ...n[index], url: e.target.value }; return n; })}
                          placeholder={item.type === "video" ? "Video URL" : "Image URL"}
                          className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                        />
                        <label className="px-3 py-1.5 bg-zinc-200 dark:bg-zinc-600 hover:bg-zinc-300 dark:hover:bg-zinc-500 text-zinc-700 dark:text-white text-sm font-medium rounded-lg cursor-pointer transition-colors">
                          {uploadingGalleryIndex === index ? "..." : "Upload"}
                          <input type="file" accept={item.type === "video" ? "video/*" : item.type === "model" ? ".glb,.gltf" : "image/*"} className="hidden" onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setUploadingGalleryIndex(index);
                            try {
                              const resourceType = item.type === "model" ? "raw" : item.type === "video" ? "video" : "image";
                              const result = await uploadFile(file, resourceType);
                              const url = result.url.startsWith("http") ? result.url : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${result.url}`;
                              setGalleryItems((prev) => { const n = [...prev]; n[index] = { ...n[index], url }; return n; });
                            } catch (err) {
                              const message = err instanceof Error ? err.message : "Upload failed";
                              if (message.toLowerCase().includes("cloudinary")) { setIntegrationsModalMessage(message); setShowIntegrationsModal(true); } else { alert(message); }
                            } finally { setUploadingGalleryIndex(null); }
                          }} />
                        </label>
                        {item.type !== "model" && <button type="button" onClick={() => setGalleryLibraryIndex(index)} className="px-3 py-1.5 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-700 dark:text-zinc-200">Library</button>}
                      </div>
                      <input
                        type="text"
                        value={item.caption || ""}
                        onChange={(e) => setGalleryItems((prev) => { const n = [...prev]; n[index] = { ...n[index], caption: e.target.value }; return n; })}
                        placeholder="Caption (optional)"
                        className="w-full px-3 py-1.5 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                      />
                      {item.type === "model" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={item.model_orientation || ""}
                            onChange={(e) => setGalleryItems((prev) => {
                              const n = [...prev];
                              const orientation = e.target.value.trim();
                              const nextItem = { ...n[index] };
                              if (orientation) {
                                nextItem.model_orientation = orientation;
                              } else {
                                delete nextItem.model_orientation;
                              }
                              n[index] = nextItem;
                              return n;
                            })}
                            placeholder="Initial rotation (e.g. 0deg 180deg 0deg)"
                            className="w-full px-3 py-1.5 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                          />
                          <input
                            type="text"
                            value={item.model_zoom || ""}
                            onChange={(e) => setGalleryItems((prev) => {
                              const n = [...prev];
                              const zoom = e.target.value.trim();
                              const nextItem = { ...n[index] };
                              if (zoom) {
                                nextItem.model_zoom = zoom;
                              } else {
                                delete nextItem.model_zoom;
                              }
                              n[index] = nextItem;
                              return n;
                            })}
                            placeholder="Initial zoom (e.g. 100% or 2m)"
                            className="w-full px-3 py-1.5 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                          />
                        </div>
                      )}
                      {item.url && item.type === "image" && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.url} alt="preview" className="h-20 w-auto rounded object-cover border border-zinc-200 dark:border-zinc-600" />
                      )}
                      {item.url && item.type === "model" && (
                        <p className="text-xs text-zinc-400 truncate">{item.url.split("/").pop()}</p>
                      )}
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setGalleryItems((prev) => [...prev, { type: "image", url: "", caption: "" }])} className="flex-1 py-2 text-sm border border-dashed border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-500 hover:border-blue-400 hover:text-blue-500 transition-colors">
                      + Add Image
                    </button>
                    <button type="button" onClick={() => setGalleryItems((prev) => [...prev, { type: "video", url: "", caption: "" }])} className="flex-1 py-2 text-sm border border-dashed border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-500 hover:border-purple-400 hover:text-purple-500 transition-colors">
                      + Add Video
                    </button>
                    <button type="button" onClick={() => setGalleryItems((prev) => [...prev, { type: "model", url: "", caption: "" }])} className="flex-1 py-2 text-sm border border-dashed border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-500 hover:border-emerald-400 hover:text-emerald-500 transition-colors">
                      + Add 3D Model
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    GitHub Link
                  </label>
                  <input
                    type="url"
                    value={form.github_link}
                    onChange={(e) => setForm({ ...form, github_link: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Live URL
                  </label>
                  <input
                    type="url"
                    value={form.live_url}
                    onChange={(e) => setForm({ ...form, live_url: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setGalleryItems([]);
                    cleanupScreenshot();
                  }}
                  className="px-4 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Screenshot Crop Modal */}
      {showCropModal && screenshotSrc && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 w-full max-w-4xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                Crop Screenshot (16:9)
              </h2>
              <button
                onClick={() => {
                  setShowCropModal(false);
                  setScreenshotSrc(null);
                }}
                className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              >
                &times;
              </button>
            </div>

            <div className="relative w-full h-[60vh] bg-zinc-900 rounded-lg overflow-hidden">
              <Cropper
                image={screenshotSrc}
                crop={crop}
                zoom={zoom}
                aspect={16 / 9}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-3">
                <span className="text-sm text-zinc-500">Zoom</span>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-48"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCropModal(false);
                    setScreenshotSrc(null);
                  }}
                  className="px-4 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUseScreenshot}
                  disabled={uploading || !croppedAreaPixels}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {uploading ? "Uploading..." : "Use Screenshot"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dev Projects List */}
      {loading ? (
        <p className="text-zinc-500">Loading...</p>
      ) : projects.length === 0 ? (
        <p className="text-zinc-500">No projects yet. Add your first project!</p>
      ) : (
        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-zinc-50 dark:bg-zinc-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Tech Stack
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {projects.map((project) => (
                <tr key={project.id}>
                  <td className="px-6 py-4">
                    <p className="font-medium text-zinc-900 dark:text-white">
                      {project.title}
                    </p>
                    <p className="text-sm text-zinc-500 truncate max-w-xs">
                      {project.description}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {project.tech_stack.slice(0, 3).map((tech) => (
                        <span
                          key={tech}
                          className="px-2 py-0.5 text-xs bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded"
                        >
                          {tech}
                        </span>
                      ))}
                      {project.tech_stack.length > 3 && (
                        <span className="px-2 py-0.5 text-xs text-zinc-500">
                          +{project.tech_stack.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleEdit(project)}
                      className="text-blue-600 hover:text-blue-500 font-medium text-sm mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(project.id)}
                      className="text-red-600 hover:text-red-500 font-medium text-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
