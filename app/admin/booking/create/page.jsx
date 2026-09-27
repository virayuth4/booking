"use client";

import authenticatedFetch from "@/app/auth/authenticatedFetch";
import { useAuth } from "@/app/auth/authContext";
import { useState, useRef, useEffect } from "react";
import { CATEGORIES } from "@/lib/constants";
import { useSearchParams } from "next/navigation";

const MAX_IMAGES = 10;

const DAYS = [
  { key: "mon", label: "Monday" },
  { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" },
  { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" },
  { key: "sat", label: "Saturday" },
  { key: "sun", label: "Sunday" },
];



const DEFAULT_HOURS = {
  open: "09:00",
  close: "22:00",
};

const initialHours = () =>
  Object.fromEntries(DAYS.map(({ key }) => [key, { closed: false, ...DEFAULT_HOURS }]));

const inputClass =
  "w-full rounded-md border border-[#D1D5DB] px-3 py-2 text-sm outline-none focus:border-[#15803D] focus:ring-1 focus:ring-[#15803D]";

function slugify(text) {
  return (text || "")
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function BookingSettings() {
  const { currentUser, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const isEdit = searchParams.get("edit") === "true";
  const pageId = searchParams.get("id");

  const [business, setBusiness] = useState({
    name: "",
    phone: "",
    telegram: "",
    map: "",
  });
  const [slug, setSlug] = useState("");
  const [isSlugCustomized, setIsSlugCustomized] = useState(false);

  // Category & Services
  const [category, setCategory] = useState("restaurant");
  const [serviceTypes, setServiceTypes] = useState(["Indoor seating", "Outdoor patio"]);
  const [customServiceInput, setCustomServiceInput] = useState("");

  // Telegram verification states
  const [telegramChatId, setTelegramChatId] = useState(null);
  const [telegramStatus, setTelegramStatus] = useState("idle"); // "idle" | "linking" | "connected" | "timed_out"
  const [telegramDeepLink, setTelegramDeepLink] = useState("");
  const pollTimerRef = useRef(null);
  const currentSessionTokenRef = useRef(null);

  // Hours & Schedule
  const [hours, setHours] = useState(initialHours);
  const [closedDates, setClosedDates] = useState([]);
  const [newClosedDate, setNewClosedDate] = useState("");

  // Images
  const [images, setImages] = useState([]); // { id, file, previewUrl, existing }
  const fileInputRef = useRef(null);
  const [imagesError, setImagesError] = useState("");

  // Page lifecycle
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [pageLoading, setPageLoading] = useState(isEdit);

  // Revoke preview URLs only on unmount
  const imagesRef = useRef(images);
  imagesRef.current = images;
  useEffect(() => {
    return () =>
      imagesRef.current.forEach((img) => {
        if (!img.existing) URL.revokeObjectURL(img.previewUrl);
      });
  }, []);

  // Safe polling cleanup
  const stopPollingOnly = () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => stopPollingOnly();
  }, []);

  // ---------------------------------------------------------------------------
  // Load existing page (Edit mode)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (authLoading) return;
    if (!isEdit || !pageId) {
      setPageLoading(false);
      return;
    }
    if (!currentUser) {
      setPageLoading(false);
      return;
    }

    let cancelled = false;

    async function loadBookingSettings() {
      try {
        const res = await authenticatedFetch(
          `${process.env.NEXT_PUBLIC_BACKEND}/api/booking-link/booking-settings/id/${pageId}`,
          { method: "GET", credentials: "include", cache: "no-store" }
        );
        console.log("res", res)
        if (!res.ok) throw new Error("Failed to load booking settings.");
        const { data } = await res.json();
        if (cancelled || !data) return;

        setBusiness({
          name: data.name ?? "",
          phone: data.phone ?? "",
          telegram: data.telegram ?? "",
          map: data.map ?? "",
        });
        if (data.slug) {
          setSlug(data.slug);
          setIsSlugCustomized(true);
        }
        if (data.category) setCategory(data.category);
        if (Array.isArray(data.service_types)) setServiceTypes(data.service_types);
        if (data.telegram_chat_id) {
          setTelegramChatId(String(data.telegram_chat_id));
          setTelegramStatus("connected");
        }
        if (data.opening_hours) setHours(data.opening_hours);
        if (Array.isArray(data.closed_dates)) setClosedDates(data.closed_dates);
        if (Array.isArray(data.image_paths)) {
          setImages(
            data.image_paths.map((url) => ({
              id: crypto.randomUUID(),
              file: null,
              previewUrl: url,
              existing: true,
            }))
          );
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) setError("Couldn't load your saved booking page.");
      } finally {
        if (!cancelled) setPageLoading(false);
      }
    }

    loadBookingSettings();
    return () => {
      cancelled = true;
    };
  }, [authLoading, currentUser, isEdit, pageId]);

  // ---------------------------------------------------------------------------
  // Business Name & Slug Handlers
  // ---------------------------------------------------------------------------
  const handleNameChange = (name) => {
    setBusiness((prev) => ({ ...prev, name }));
    if (!isSlugCustomized) {
      setSlug(slugify(name));
    }
  };

  const handleSlugChange = (rawVal) => {
    setIsSlugCustomized(true);
    setSlug(rawVal.toLowerCase().replace(/[^a-z0-9-]/g, ""));
  };

  const updateBusiness = (field, value) =>
    setBusiness((prev) => ({ ...prev, [field]: value }));

  // ---------------------------------------------------------------------------
  // Category & Custom Services Handlers
  // ---------------------------------------------------------------------------
  const handleCategoryChange = (newCat) => {
    setCategory(newCat);
    const catConfig = CATEGORIES.find((c) => c.key === newCat);
    setServiceTypes(catConfig ? catConfig.suggestedServices.slice(0, 2) : []);
  };

  const toggleSuggestedService = (service) => {
    setServiceTypes((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
    );
  };

  const handleAddCustomService = (e) => {
    if (e) e.preventDefault();
    const clean = customServiceInput.trim();
    if (!clean) return;
    if (serviceTypes.some((s) => s.toLowerCase() === clean.toLowerCase())) {
      setCustomServiceInput("");
      return;
    }
    setServiceTypes((prev) => [...prev, clean]);
    setCustomServiceInput("");
  };

  const removeService = (serviceToRemove) => {
    setServiceTypes((prev) => prev.filter((s) => s !== serviceToRemove));
  };

  // ---------------------------------------------------------------------------
  // Telegram Session Polling & Handlers
  // ---------------------------------------------------------------------------
  const checkSessionStatus = async (token) => {
    if (!token) return false;
    try {
      const res = await authenticatedFetch(
        `${process.env.NEXT_PUBLIC_BACKEND}/api/booking-link/booking-settings/telegram-session/${token}`,
        { method: "GET", credentials: "include", cache: "no-store" }
      );
      if (!res.ok) return false;
      const data = await res.json();

      if (data.connected && data.chatId) {
        setTelegramChatId(String(data.chatId));
        setTelegramStatus("connected");
        stopPollingOnly();
        return true;
      }
    } catch (err) {
      console.error("Session polling failed:", err);
    }
    return false;
  };

  // Check immediately if window refocusses from Telegram
  useEffect(() => {
    const onFocus = () => {
      if (currentSessionTokenRef.current && telegramStatus === "linking") {
        checkSessionStatus(currentSessionTokenRef.current);
      }
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [telegramStatus]);

  const handleVerifyTelegram = async (e) => {
    if (e) e.preventDefault();
    setError("");

    stopPollingOnly();
    setTelegramStatus("linking");

    try {
      const res = await authenticatedFetch(
        `${process.env.NEXT_PUBLIC_BACKEND}/api/booking-link/booking-settings/telegram-session`,
        { method: "POST", credentials: "include" }
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to create connection session.");
      }

      const data = await res.json();
      setTelegramDeepLink(data.deepLink);
      currentSessionTokenRef.current = data.token;

      // Open Telegram in a new window/app
      window.open(data.deepLink, "_blank", "noopener,noreferrer");

      // Poll every 2.5 seconds for up to ~65 seconds
      let attempts = 0;
      pollTimerRef.current = setInterval(async () => {
        attempts += 1;
        const isConnected = await checkSessionStatus(data.token);

        if (isConnected) {
          stopPollingOnly();
        } else if (attempts >= 26) {
          stopPollingOnly();
          setTelegramStatus("timed_out");
        }
      }, 2500);
    } catch (err) {
      console.error("Telegram verify error:", err);
      setError(err.message || "Failed to initiate Telegram link.");
      stopPollingOnly();
      setTelegramStatus("idle");
    }
  };

  const handleReopenTelegram = (e) => {
    if (e) e.preventDefault();
    if (telegramDeepLink) {
      window.open(telegramDeepLink, "_blank", "noopener,noreferrer");
    }
  };

  const handleCancelLinking = (e) => {
    if (e) e.preventDefault();
    stopPollingOnly();
    setTelegramStatus("idle");
  };

  const handleDisconnectTelegram = async (e) => {
    if (e) e.preventDefault();
    if (!confirm("Are you sure you want to stop receiving booking notifications on Telegram?")) return;

    if (pageId && isEdit) {
      try {
        await authenticatedFetch(
          `${process.env.NEXT_PUBLIC_BACKEND}/api/booking-link/booking-settings/${pageId}/telegram-disconnect`,
          { method: "POST", credentials: "include" }
        );
      } catch (err) {
        console.error("Disconnect error:", err);
      }
    }

    setTelegramChatId(null);
    setTelegramStatus("idle");
    currentSessionTokenRef.current = null;
  };

  // ---------------------------------------------------------------------------
  // Hours & Image Handlers
  // ---------------------------------------------------------------------------
  const updateDay = (key, patch) =>
    setHours((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));

  const copyMondayToAll = () =>
    setHours((prev) => {
      const next = {};
      DAYS.forEach(({ key }) => (next[key] = { ...prev.mon }));
      return next;
    });

  const addClosedDate = () => {
    if (!newClosedDate || closedDates.includes(newClosedDate)) return;
    setClosedDates((prev) => [...prev, newClosedDate].sort());
    setNewClosedDate("");
  };

  const removeClosedDate = (date) =>
    setClosedDates((prev) => prev.filter((d) => d !== date));

  const addImageFiles = (fileList) => {
    const incoming = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (!incoming.length) return;
    const slots = MAX_IMAGES - images.length;
    if (slots <= 0) {
      setImagesError(`You can upload up to ${MAX_IMAGES} photos.`);
      return;
    }
    const accepted = incoming.slice(0, slots);
    setImagesError(
      incoming.length > accepted.length
        ? `Only ${slots} more photo${slots === 1 ? "" : "s"} can be added (max ${MAX_IMAGES}).`
        : ""
    );
    setImages((prev) => [
      ...prev,
      ...accepted.map((file) => ({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        existing: false,
      })),
    ]);
  };

  const removeImage = (id) => {
    setImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target && !target.existing) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((img) => img.id !== id);
    });
    setImagesError("");
  };

  // ---------------------------------------------------------------------------
  // Form Save
  // ---------------------------------------------------------------------------
  async function handleSave() {
    setError("");
    if (!currentUser) {
      setError("You need to be signed in to save your booking page.");
      return;
    }
    if (!business.name.trim()) {
      setError("Please enter your business name.");
      return;
    }

    
    if (!telegramChatId) {
      setError("Please connect Telegram before saving your booking page.");
      return;
    }

    const cleanSlug = slugify(slug || business.name);
    if (!cleanSlug || cleanSlug.length < 3) {
      setError("Booking URL handle must be at least 3 characters long.");
      return;
    }

    if (serviceTypes.length === 0) {
      setError("Please add or select at least one service/option for guests to book.");
      return;
    }

    const invalidDay = DAYS.find(
      ({ key }) => !hours[key].closed && (!hours[key].open || !hours[key].close)
    );
    if (invalidDay) {
      setError(`Set opening and closing times for ${invalidDay.label}, or mark it closed.`);
      return;
    }

    const existingImagePaths = images.filter((img) => img.existing).map((img) => img.previewUrl);
    const newImageFiles = images.filter((img) => !img.existing);

    const form = new FormData();
    if (isEdit && pageId) form.append("id", pageId);
    form.append("name", business.name.trim());
    form.append("slug", cleanSlug);
    form.append("phone", business.phone.trim());
    form.append("telegram", business.telegram.trim());
    form.append("map", business.map.trim());
    form.append("category", category);
    form.append("service_types", JSON.stringify(serviceTypes));
    form.append("hours", JSON.stringify(hours));
    form.append("closedDates", JSON.stringify(closedDates));
    form.append("existing_image_paths", JSON.stringify(existingImagePaths));
    if (telegramChatId) {
      form.append("telegram_chat_id", telegramChatId);
    }
    newImageFiles.forEach((img) => form.append("images", img.file));

    setStatus("saving");
    try {
      const url =
        isEdit && pageId
          ? `${process.env.NEXT_PUBLIC_BACKEND}/api/booking-link/booking-settings/${pageId}`
          : `${process.env.NEXT_PUBLIC_BACKEND}/api/booking-link/booking-settings`;

      const res = await authenticatedFetch(url, {
        method: isEdit ? "PUT" : "POST",
        credentials: "include",
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
      setStatus("saved");
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
      setStatus("idle");
    }
  }

  if (authLoading || pageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-[#9CA3AF]">
        Loading…
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-[#4B5563]">
        Please sign in to set up your booking page.
      </div>
    );
  }

  const currentCategoryObj = CATEGORIES.find((c) => c.key === category);

return (
  <div className="min-h-screen bg-white font-sans text-[#171717] antialiased">
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Booking page</h1>
      <p className="mt-1.5 text-sm text-[#6B7280]">
        Guests send a request. You accept or decline it in Telegram.
      </p>

      {/* Business Details */}
      <section className="mt-10 space-y-5">
        <h2 className="text-sm font-semibold text-[#374151]">Your business</h2>

        <label className="block">
          <span className="text-sm text-[#4B5563]">Name</span>
          <input
            value={business.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="e.g. Cotter & Sons Barbershop"
            className={`mt-1.5 ${inputClass}`}
          />
        </label>

        {/* URL Handle */}
        <label className="block">
          <span className="text-sm text-[#4B5563]">Booking URL link</span>
          <div className="mt-1.5 flex items-center overflow-hidden rounded-md border border-[#D1D5DB] focus-within:border-[#15803D] focus-within:ring-1 focus-within:ring-[#15803D]">
            <span className="select-none bg-[#F9FAFB] px-3 py-2 text-sm text-[#9CA3AF] border-r border-[#E5E7EB]">
              eatdoko.com/
            </span>
            <input
              type="text"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="your-page-link"
              className="w-full px-3 py-2 text-sm font-mono text-[#171717] outline-none"
            />
          </div>
          <p className="mt-1 text-xs text-[#9CA3AF]">
            Auto-generated from your business name. You can customize it anytime.
          </p>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm text-[#4B5563]">Phone</span>
            <input
              type="tel"
              value={business.phone}
              onChange={(e) => updateBusiness("phone", e.target.value)}
              placeholder="+855 12 345 678"
              className={`mt-1.5 ${inputClass}`}
            />
          </label>
          <label className="block">
            <span className="text-sm text-[#4B5563]">Telegram Handle (Public)</span>
            <input
              value={business.telegram}
              onChange={(e) => updateBusiness("telegram", e.target.value)}
              placeholder="https://t.me/yourbusiness"
              className={`mt-1.5 ${inputClass}`}
            />
          </label>
        </div>

        <label className="block">
          <span className="text-sm text-[#4B5563]">Map link</span>
          <input
            type="url"
            value={business.map}
            onChange={(e) => updateBusiness("map", e.target.value)}
            placeholder="https://maps.app.goo.gl/..."
            className={`mt-1.5 ${inputClass}`}
          />
        </label>
      </section>

      {/* Telegram Bot Connection Card */}
      <section className="mt-10">
        <div className="rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[#374151]">Telegram Notifications</span>

                {telegramChatId ? (
                  <span className="inline-flex items-center rounded-full bg-[#15803D]/10 px-2.5 py-0.5 text-xs font-semibold text-[#15803D]">
                    ● Connected
                  </span>
                ) : telegramStatus === "linking" ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 animate-pulse">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                    Waiting for confirmation…
                  </span>
                ) : telegramStatus === "timed_out" ? (
                  <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-600">
                    ✕ Connection timed out
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-[#6B7280]">
                    ○ Not Connected
                  </span>
                )}
              </div>

              <p className="mt-1 text-xs text-[#6B7280]">
                {telegramChatId
                  ? "Your Telegram account is linked. New bookings will alert this chat directly."
                  : telegramStatus === "linking"
                  ? "Tap 'Confirm & Connect' inside the Telegram bot. Waiting for update..."
                  : telegramStatus === "timed_out"
                  ? "Didn't receive confirmation in time. Tap Retry to start again."
                  : "Connect your Telegram bot to approve or decline guest booking requests."}
              </p>
            </div>

            {/* Telegram Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {telegramChatId ? (
                <button
                  type="button"
                  onClick={handleDisconnectTelegram}
                  className="rounded-md border border-[#D1D5DB] bg-white px-3.5 py-1.5 text-xs font-medium text-[#6B7280] hover:border-red-300 hover:text-red-600 transition"
                >
                  Disconnect
                </button>
              ) : telegramStatus === "linking" ? (
                <>
                  <button
                    type="button"
                    onClick={handleReopenTelegram}
                    className="rounded-md border border-[#D1D5DB] bg-white px-3 py-1.5 text-xs font-medium text-[#374151] hover:border-[#15803D] hover:text-[#15803D] transition"
                  >
                    Reopen Telegram
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelLinking}
                    className="rounded-md border border-transparent px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition"
                  >
                    Cancel
                  </button>
                </>
              ) : telegramStatus === "timed_out" ? (
                <>
                  {/* <button
                    type="button"
                    onClick={handleContactSupport}
                    className="rounded-md border border-[#D1D5DB] bg-white px-3 py-1.5 text-xs font-medium text-[#374151] hover:border-gray-400 hover:text-gray-900 transition"
                  >
                    Contact Support
                  </button> */}
                  <button
                    type="button"
                    onClick={handleVerifyTelegram}
                    className="inline-flex items-center gap-1.5 rounded-md bg-[#15803D] px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-[#166534] transition"
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Retry Connection
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleVerifyTelegram}
                  className="inline-flex items-center gap-2 rounded-md bg-[#15803D] px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-[#166534] transition"
                >
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .36z" />
                  </svg>
                  Verify & Connect Telegram
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Category & Services */}
      <section className="mt-10 space-y-5">
        <div>
          <h2 className="text-sm font-semibold text-[#374151]">Category & Services</h2>
          <p className="mt-0.5 text-xs text-[#6B7280]">
            Specify the booking experiences, seating areas, or services guests can choose.
          </p>
        </div>

        <label className="block">
          <span className="text-sm text-[#4B5563]">Category</span>
          <select
            value={category}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className={`mt-1.5 ${inputClass} bg-white`}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.key} value={cat.key}>
                {cat.label}
              </option>
            ))}
          </select>
        </label>

        {/* Services & Options */}
        <div>
          <span className="block text-sm text-[#4B5563]">Services & Options</span>
          <p className="mt-0.5 text-xs text-[#9CA3AF]">
            Tap to select what guests can choose when booking.
          </p>

          {(() => {
            const suggested = currentCategoryObj?.suggestedServices ?? [];
            const allServices = [...new Set([...suggested, ...serviceTypes])];

            if (allServices.length === 0) {
              return (
                <p className="mt-2.5 text-xs italic text-[#9CA3AF]">
                  No services yet. Add one below.
                </p>
              );
            }

            return (
              <div className="mt-2.5 flex flex-wrap gap-2">
                {allServices.map((service) => {
                  const isSelected = serviceTypes.includes(service);
                  return (
                    <button
                      key={service}
                      type="button"
                      onClick={() => toggleSuggestedService(service)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                        isSelected
                          ? "border-[#15803D] bg-[#15803D]/10 text-[#15803D]"
                          : "border-[#E5E7EB] text-[#6B7280] hover:border-[#9CA3AF] hover:text-[#374151]"
                      }`}
                    >
                      {isSelected ? "✓ " : "+ "}
                      {service}
                    </button>
                  );
                })}
              </div>
            );
          })()}
        </div>

        {/* Add Custom Service Input */}
        <div>
          <span className="block text-xs font-medium text-[#4B5563]">Add custom service</span>
          <div className="mt-1.5 flex gap-2">
            <input
              type="text"
              value={customServiceInput}
              onChange={(e) => setCustomServiceInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddCustomService();
                }
              }}
              placeholder="e.g. VIP Booth, Hair Coloring, Balcony"
              className={inputClass}
            />
            <button
              type="button"
              onClick={handleAddCustomService}
              className="shrink-0 rounded-md border border-[#D1D5DB] px-4 text-sm font-medium text-[#374151] hover:border-[#15803D] hover:text-[#15803D]"
            >
              Add
            </button>
          </div>
        </div>
      </section>

      {/* Opening Hours */}
      <section className="mt-10">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-[#374151]">Opening hours</h2>
          <button
            type="button"
            onClick={copyMondayToAll}
            className="text-xs font-medium text-[#6B7280] hover:text-[#15803D]"
          >
            Copy Monday to all
          </button>
        </div>

        <div className="mt-3 divide-y divide-[#F0F0F1] rounded-md border border-[#E5E7EB]">
          {DAYS.map(({ key, label }) => {
            const day = hours[key];
            return (
              <div key={key} className="flex items-center gap-3 px-4 py-3">
                <span className="w-24 shrink-0 text-sm text-[#374151]">{label}</span>

                {day.closed ? (
                  <span className="flex-1 text-sm text-[#9CA3AF]">Closed</span>
                ) : (
                  <div className="flex flex-1 items-center gap-2">
                    <input
                      type="time"
                      value={day.open}
                      onChange={(e) => updateDay(key, { open: e.target.value })}
                      aria-label={`${label} opens`}
                      className="rounded-md border border-[#D1D5DB] px-2 py-1 text-sm outline-none focus:border-[#15803D]"
                    />
                    <span className="text-[#9CA3AF]">–</span>
                    <input
                      type="time"
                      value={day.close}
                      onChange={(e) => updateDay(key, { close: e.target.value })}
                      aria-label={`${label} closes`}
                      className="rounded-md border border-[#D1D5DB] px-2 py-1 text-sm outline-none focus:border-[#15803D]"
                    />
                  </div>
                )}

                <label className="flex shrink-0 items-center gap-2 text-xs text-[#4B5563]">
                  <input
                    type="checkbox"
                    checked={day.closed}
                    onChange={(e) => updateDay(key, { closed: e.target.checked })}
                    className="h-4 w-4 accent-[#15803D]"
                  />
                  Closed
                </label>
              </div>
            );
          })}
        </div>
      </section>

      {/* Closed Dates */}
      <section className="mt-10">
        <h2 className="text-sm font-semibold text-[#374151]">Closed dates</h2>
        <p className="mt-1 text-xs text-[#9CA3AF]">Holidays or specific days you will not accept bookings.</p>

        <div className="mt-3 flex gap-2">
          <input
            type="date"
            value={newClosedDate}
            onChange={(e) => setNewClosedDate(e.target.value)}
            className="rounded-md border border-[#D1D5DB] px-3 py-2 text-sm outline-none focus:border-[#15803D]"
          />
          <button
            type="button"
            onClick={addClosedDate}
            className="rounded-md border border-[#D1D5DB] px-4 text-sm font-medium text-[#374151] hover:border-[#9CA3AF]"
          >
            Add
          </button>
        </div>

        {closedDates.length > 0 && (
          <ul className="mt-3 divide-y divide-[#F0F0F1] rounded-md border border-[#E5E7EB]">
            {closedDates.map((date) => (
              <li key={date} className="flex items-center justify-between px-4 py-2 text-sm">
                <span className="font-mono text-[#4B5563]">{date}</span>
                <button
                  type="button"
                  onClick={() => removeClosedDate(date)}
                  className="text-xs text-[#9CA3AF] hover:text-[#15803D]"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Gallery Photos */}
      <section className="mt-10">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-[#374151]">Photos</h2>
          <span className="text-xs text-[#9CA3AF]">
            {images.length}/{MAX_IMAGES}
          </span>
        </div>

        <div
          onClick={() => images.length < MAX_IMAGES && fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            addImageFiles(e.dataTransfer.files);
          }}
          className={`mt-3 flex flex-col items-center justify-center rounded-md border-2 border-dashed px-4 py-8 text-center text-sm transition ${
            images.length >= MAX_IMAGES
              ? "cursor-not-allowed border-[#E5E7EB] text-[#9CA3AF]"
              : "cursor-pointer border-[#D1D5DB] text-[#4B5563] hover:border-[#9CA3AF]"
          }`}
        >
          {images.length >= MAX_IMAGES ? (
            <span>Maximum of {MAX_IMAGES} photos reached</span>
          ) : (
            <>
              <span className="font-medium text-[#171717]">Click to upload</span>
              <span className="mt-1 text-xs text-[#9CA3AF]">or drag and drop · PNG, JPG, WEBP</span>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              if (e.target.files?.length) addImageFiles(e.target.files);
              e.target.value = "";
            }}
            className="hidden"
          />
        </div>

        {imagesError && <p className="mt-2 text-xs text-red-600">{imagesError}</p>}

        {images.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {images.map((img) => (
              <div key={img.id} className="group relative aspect-square overflow-hidden rounded-md border border-[#E5E7EB]">
                <img src={img.previewUrl} alt="Upload preview" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(img.id)}
                  aria-label="Remove photo"
                  className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs text-white opacity-0 transition group-hover:opacity-100"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Save Bar */}
      <div className="mt-12 flex items-center justify-between border-t border-[#E5E7EB] pt-6">
        <p className="text-sm text-red-600">{error}</p>
        <button
          type="button"
          onClick={handleSave}
          disabled={status === "saving"}
          className="rounded-md bg-[#15803D] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#166534] disabled:opacity-50"
        >
          {status === "saving" ? "Saving…" : "Save"}
        </button>
      </div>

      {status === "saved" && (
        <p className="mt-3 text-right text-sm text-[#15803D]">Saved successfully.</p>
      )}
    </div>
  </div>
);
}