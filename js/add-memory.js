
"use strict";

/* =========================================================
   EchoLife Add/Edit Memory
   Private Supabase Storage upload via Express backend
   ========================================================= */

let editingMemoryId = null;
let currentMediaData = "";
let selectedMediaFile = null;
let currentMediaType = "Photo";
let originalMediaType = "Photo";

document.addEventListener("DOMContentLoaded", async () => {
    initFileUpload();
    initNarrationControls();
    await checkEditMode();
    initFormSubmit();
});

function showToast(title, message, type = "info") {
    if (typeof window.showToast === "function") {
        window.showToast(title, message, type);
        return;
    }

    console.log(`[${type}] ${title}: ${message}`);
    alert(`${title}\n${message}`);
}

function getValue(id) {
    const element = document.getElementById(id);
    return element ? element.value || "" : "";
}

function setValue(id, value) {
    const element = document.getElementById(id);
    if (element) element.value = value ?? "";
}

function safeParseArray(value) {
    if (Array.isArray(value)) return value;
    if (!value) return [];

    try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed;
    } catch {
        // Support comma-separated legacy values.
    }

    return String(value)
        .split(",")
        .map(value => value.trim())
        .filter(Boolean);
}

/* =========================================================
   FILE SELECTION AND PREVIEW
   ========================================================= */

function initFileUpload() {
    const dropZone = document.getElementById("dropZone");
    const fileInput = document.getElementById("coverFileInput");

    if (!fileInput) {
        console.error("File input #coverFileInput was not found.");
        return;
    }

    fileInput.addEventListener("change", event => {
        const file = event.target.files?.[0];
        if (file) handleFileSelect(file);
    });

    if (!dropZone) return;

    dropZone.addEventListener("click", event => {
        if (event.target !== fileInput) fileInput.click();
    });

    dropZone.addEventListener("dragover", event => {
        event.preventDefault();
        dropZone.classList.add("border-primary");
    });

    dropZone.addEventListener("dragleave", () => {
        dropZone.classList.remove("border-primary");
    });

    dropZone.addEventListener("drop", event => {
        event.preventDefault();
        dropZone.classList.remove("border-primary");

        const file = event.dataTransfer?.files?.[0];
        if (!file) return;

        try {
            const transfer = new DataTransfer();
            transfer.items.add(file);
            fileInput.files = transfer.files;
        } catch (error) {
            console.warn("Could not update file input:", error);
        }

        handleFileSelect(file);
    });
}

function handleFileSelect(file) {
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
        showToast("Invalid file", "Choose an image or video.", "danger");
        return;
    }

    if (file.size > 50 * 1024 * 1024) {
        showToast("File too large", "Maximum file size is 50 MB.", "danger");
        return;
    }

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
        "video/mp4",
        "video/webm",
        "video/quicktime"
    ];

    if (!allowedTypes.includes(file.type)) {
        showToast(
            "Unsupported file",
            "Choose JPEG, PNG, WebP, GIF, MP4, WebM, or MOV.",
            "danger"
        );
        return;
    }

    // Keep the actual file for the server upload.
    selectedMediaFile = file;
    currentMediaType = isVideo ? "Video" : "Photo";

    // Data URL is used only for the local preview.
    const reader = new FileReader();

    reader.onload = () => {
        currentMediaData = String(reader.result || "");
        displayMediaPreview(currentMediaData, currentMediaType);
    };

    reader.onerror = () => {
        showToast("Preview error", "Could not read the selected file.", "danger");
    };

    reader.readAsDataURL(file);
}

function displayMediaPreview(source, type) {
    const image = document.getElementById("uploadPreviewImg");
    const video = document.getElementById("uploadPreviewVideo");

    if (image) {
        image.hidden = true;
        image.removeAttribute("src");
    }

    if (video) {
        video.pause?.();
        video.hidden = true;
        video.removeAttribute("src");
        video.load?.();
    }

    if (!source) return;

    if (type === "Video" && video) {
        video.src = source;
        video.hidden = false;
        video.load();
    } else if (image) {
        image.src = source;
        image.hidden = false;
    }
}

/* =========================================================
   LOAD EXISTING MEMORY FOR EDITING
   ========================================================= */

async function checkEditMode() {
    const params = new URLSearchParams(window.location.search);
    editingMemoryId = params.get("edit");

    const dateInput = document.getElementById("memoryDate");

    if (!editingMemoryId) {
        if (dateInput && !dateInput.value) {
            dateInput.value = new Date().toISOString().slice(0, 10);
        }
        return;
    }

    try {
        const response = await fetch("/api/memories", {
            credentials: "include"
        });

        if (response.status === 401) {
            window.location.href = "login.html";
            return;
        }

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || "Unable to load memories.");
        }

        const memory = (result.memories || []).find(
            item => String(item.id) === String(editingMemoryId)
        );

        if (!memory) {
            showToast("Not found", "Memory could not be found.", "danger");
            return;
        }

        populateEditForm(memory);
    } catch (error) {
        console.error("Load memory error:", error);
        showToast("Load failed", error.message, "danger");
    }
}

function populateEditForm(memory) {
    const title = document.getElementById("pageFormTitle");
    if (title) title.textContent = "Edit Memory";

    setValue("memoryTitle", memory.title);
    setValue("memoryDate", memory.date || memory.memory_date);
    setValue("memoryLocation", memory.location);
    setValue("memoryEmotion", memory.emotion);
    setValue("memoryCategory", memory.category);
    setValue("memoryPrivacy", memory.privacy);
    setValue("memoryDescription", memory.description);
    setValue("memoryTags", safeParseArray(memory.tags).join(", "));
    setValue("memoryPeople", safeParseArray(memory.people).join(", "));

    const favorite = document.getElementById("memoryFavorite");
    if (favorite) favorite.checked = Boolean(memory.isFavorite);

    currentMediaData = memory.coverImage || memory.cover_image || "";
    currentMediaType = memory.type || "Photo";
    originalMediaType = currentMediaType;
    selectedMediaFile = null;

    displayMediaPreview(currentMediaData, currentMediaType);
}

/* =========================================================
   CREATE OR UPDATE MEMORY
   ========================================================= */

function initFormSubmit() {
    const form = document.getElementById("addMemoryForm");

    if (!form) {
        console.error("Form #addMemoryForm was not found.");
        return;
    }

    form.addEventListener("submit", async event => {
        event.preventDefault();

        const title = getValue("memoryTitle").trim();
        const date = getValue("memoryDate");
        const location = getValue("memoryLocation").trim();
        const emotion = getValue("memoryEmotion");
        const category = getValue("memoryCategory");
        const privacy = getValue("memoryPrivacy") || "Private";
        const description = getValue("memoryDescription").trim();

        const tags = getValue("memoryTags")
            .split(",").map(value => value.trim()).filter(Boolean);

        const people = getValue("memoryPeople")
            .split(",").map(value => value.trim()).filter(Boolean);

        const favorite = document.getElementById("memoryFavorite");
        const isFavorite = favorite ? favorite.checked : false;

        if (!title || !date || !description) {
            showToast(
                "Required fields",
                "Enter a title, date, and description.",
                "warning"
            );
            return;
        }

        if (title.length > 200 || description.length > 5000) {
            showToast(
                "Text too long",
                "Keep the title under 200 characters and description under 5000.",
                "warning"
            );
            return;
        }

        // A new memory must have a selected file.
        // Editing may keep the existing media without uploading again.
        if (!editingMemoryId && !selectedMediaFile) {
            showToast(
                "Media required",
                "Select a photo or video before saving.",
                "warning"
            );
            return;
        }

        const button = form.querySelector('button[type="submit"]');
        const previousButtonText = button?.innerHTML;

        if (button) {
            button.disabled = true;
            button.textContent = "Saving...";
        }

        try {
            const formData = new FormData();

            formData.append("title", title);
            formData.append("date", date);
            formData.append("location", location);
            formData.append("emotion", emotion);
            formData.append("category", category);
            formData.append("description", description);
            formData.append("privacy", privacy);
            formData.append("type", currentMediaType);
            formData.append("tags", JSON.stringify(tags));
            formData.append("people", JSON.stringify(people));
            formData.append("isFavorite", String(isFavorite));
            formData.append("likes", "0");
            formData.append("audioNote", "");

            // Only send a file if the user selected a new one.
            if (selectedMediaFile) {
                formData.append(
                    "media",
                    selectedMediaFile,
                    selectedMediaFile.name
                );
            }

            const isEditing = Boolean(editingMemoryId);
            const url = isEditing
                ? `/api/memories/${encodeURIComponent(editingMemoryId)}`
                : "/api/memories";

            const response = await fetch(url, {
                method: isEditing ? "PUT" : "POST",
                credentials: "include",
                // Do not set Content-Type manually.
                // The browser adds the multipart boundary.
                body: formData
            });

            if (response.status === 401) {
                window.location.href = "login.html";
                return;
            }

            const result = await response.json().catch(() => ({}));

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Unable to save memory.");
            }

            showToast(
                isEditing ? "Memory updated" : "Memory saved",
                "Your memory has been saved.",
                "success"
            );

            setTimeout(() => {
                window.location.href = "timeline.html";
            }, 1000);
        } catch (error) {
            console.error("Save memory error:", error);
            showToast("Save failed", error.message, "danger");

            if (button) {
                button.disabled = false;
                button.innerHTML = previousButtonText || "Save Memory";
            }
        }
    });
}

/* =========================================================
   ECHONARRATE STRATEGY PATTERN
   ========================================================= */

class NarrationStrategy {
    narrate(memory) {
        throw new Error("narrate() must be implemented");
    }
}

class PersonalNarration extends NarrationStrategy {
    narrate(memory) {
        return `I remember ${memory.title}. It happened on ${memory.date}
        in ${memory.location || "a special place"}. It was a
        ${memory.emotion || "meaningful"} moment. ${memory.description}`
            .replace(/\s+/g, " ").trim();
    }
}

class EmotionalNarration extends NarrationStrategy {
    narrate(memory) {
        return `Some moments stay with us forever. ${memory.title} was one
        of those moments. On ${memory.date}, this memory captured
        ${memory.emotion || "a special feeling"}. ${memory.description}`
            .replace(/\s+/g, " ").trim();
    }
}

class DocumentaryNarration extends NarrationStrategy {
    narrate(memory) {
        return `On ${memory.date}, "${memory.title}" was recorded at
        ${memory.location || "an unspecified location"}.
        ${memory.description}`.replace(/\s+/g, " ").trim();
    }
}

class StorytellingNarration extends NarrationStrategy {
    narrate(memory) {
        return `It began at ${memory.location || "a special place"}.
        On ${memory.date}, ${memory.title} became a story worth remembering.
        ${memory.description}`.replace(/\s+/g, " ").trim();
    }
}

class StoryNarrator {
    constructor(strategy) {
        this.strategy = strategy;
    }

    generate(memory) {
        return this.strategy.narrate(memory);
    }
}

function initNarrationControls() {
    document.getElementById("generateNarrationButton")
        ?.addEventListener("click", generateMemoryNarration);

    document.getElementById("playNarrationButton")
        ?.addEventListener("click", playMemoryNarration);

    document.getElementById("stopNarrationButton")
        ?.addEventListener("click", stopMemoryNarration);
}

function generateMemoryNarration() {
    const memory = {
        title: getValue("memoryTitle").trim(),
        date: getValue("memoryDate"),
        location: getValue("memoryLocation").trim(),
        emotion: getValue("memoryEmotion"),
        description: getValue("memoryDescription").trim()
    };

    if (!memory.title || !memory.date || !memory.description) {
        showToast(
            "Incomplete memory",
            "Enter the title, date, and description first.",
            "warning"
        );
        return "";
    }

    const style = getValue("narrationStyle") || "personal";

    let strategy;
    switch (style) {
        case "emotional":
            strategy = new EmotionalNarration();
            break;
        case "documentary":
            strategy = new DocumentaryNarration();
            break;
        case "storytelling":
            strategy = new StorytellingNarration();
            break;
        default:
            strategy = new PersonalNarration();
    }

    const narration = new StoryNarrator(strategy).generate(memory);
    const result = document.getElementById("narrationResult");

    if (result) result.textContent = narration;

    const playButton = document.getElementById("playNarrationButton");
    if (playButton) playButton.disabled = false;

    return narration;
}

function playMemoryNarration() {
    const result = document.getElementById("narrationResult");

    if (!("speechSynthesis" in window) || !result?.textContent.trim()) {
        showToast("No narration", "Generate a story first.", "warning");
        return;
    }

    window.speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(result.textContent);
    speech.lang = "en-US";
    speech.rate = 0.95;

    speech.onend = () => {
        const button = document.getElementById("playNarrationButton");
        if (button) button.disabled = false;
    };

    window.speechSynthesis.speak(speech);
}

function stopMemoryNarration() {
    if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
    }
}
