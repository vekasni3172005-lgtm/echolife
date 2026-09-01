/* ==========================================================================
   EchoLife Add / Edit Memory Controller

   Features:
   - Create memory
   - Edit memory
   - Photo upload
   - Video upload
   - Photo preview
   - Video preview
   - EchoNarrate
   - Strategy Pattern
   - Browser Text-to-Speech
   ========================================================================== */


/* =========================================================
   GLOBAL STATE
   ========================================================= */

let editingMemoryId = null;


/*
 * Data URL of selected photo/video.
 */
let currentMediaData = "";


/*
 * Memory media type.
 *
 * Possible values:
 * Photo
 * Video
 */
let currentMediaType = "Photo";


/* =========================================================
   STRATEGY PATTERN - ECHONARRATE
   ========================================================= */


/*
 * Strategy interface.
 */

class NarrationStrategy {

    narrate(memory) {

        throw new Error(
            "narrate() must be implemented"
        );

    }

}


/*
 * Personal narration.
 */

class PersonalNarration
    extends NarrationStrategy {

    narrate(memory) {

        const title =
            memory.title ||
            "this memory";


        const date =
            memory.date ||
            "that day";


        const location =
            memory.location ||
            "a special place";


        const emotion =
            memory.emotion ||
            "meaningful";


        const description =
            memory.description ||
            "";


        return `
            I remember ${title}.
            It happened on ${date}
            in ${location}.
            It was a ${emotion}
            moment for me.
            ${description}
        `
            .replace(
                /\s+/g,
                " "
            )
            .trim();

    }

}


/*
 * Emotional narration.
 */

class EmotionalNarration
    extends NarrationStrategy {

    narrate(memory) {

        const title =
            memory.title ||
            "This memory";


        const date =
            memory.date ||
            "that day";


        const location =
            memory.location ||
            "a special place";


        const emotion =
            memory.emotion ||
            "emotion";


        const description =
            memory.description ||
            "";


        return `
            Some moments stay with us forever.
            ${title} was one of those moments.
            On ${date}, in ${location},
            this memory captured a feeling of
            ${emotion}.
            ${description}
        `
            .replace(
                /\s+/g,
                " "
            )
            .trim();

    }

}


/*
 * Documentary narration.
 */

class DocumentaryNarration
    extends NarrationStrategy {

    narrate(memory) {

        const title =
            memory.title ||
            "Untitled memory";


        const date =
            memory.date ||
            "an unspecified date";


        const location =
            memory.location ||
            "an unspecified location";


        const emotion =
            memory.emotion ||
            "not specified";


        const description =
            memory.description ||
            "No description was provided.";


        return `
            On ${date},
            the memory "${title}"
            was recorded at ${location}.
            The associated emotion was
            ${emotion}.
            The memory description states:
            ${description}
        `
            .replace(
                /\s+/g,
                " "
            )
            .trim();

    }

}


/*
 * Storytelling narration.
 */

class StorytellingNarration
    extends NarrationStrategy {

    narrate(memory) {

        const title =
            memory.title ||
            "this moment";


        const date =
            memory.date ||
            "one memorable day";


        const location =
            memory.location ||
            "a special place";


        const emotion =
            memory.emotion ||
            "a powerful feeling";


        const description =
            memory.description ||
            "";


        return `
            It began with a moment at ${location}.
            On ${date}, ${title}
            became a story worth remembering.
            The feeling of ${emotion}
            became part of that story.
            ${description}
        `
            .replace(
                /\s+/g,
                " "
            )
            .trim();

    }

}


/*
 * Strategy Context.
 */

class StoryNarrator {

    constructor(
        strategy
    ) {

        this.strategy =
            strategy;

    }


    setStrategy(
        strategy
    ) {

        this.strategy =
            strategy;

    }


    generate(
        memory
    ) {

        if (
            !this.strategy
        ) {

            throw new Error(
                "No narration strategy selected."
            );

        }


        return this.strategy.narrate(
            memory
        );

    }

}


/*
 * Strategy creator.
 */

function createNarrationStrategy(
    type
) {

    switch (
        String(
            type ||
            "personal"
        )
            .toLowerCase()
            .trim()
    ) {

        case "personal":

            return new PersonalNarration();


        case "emotional":

            return new EmotionalNarration();


        case "documentary":

            return new DocumentaryNarration();


        case "storytelling":

            return new StorytellingNarration();


        default:

            return new PersonalNarration();

    }

}


/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        initFileUpload();

        await checkEditMode();

        initFormSubmit();

        initNarrationControls();

    }
);


/* =========================================================
   CHECK EDIT MODE
   ========================================================= */

async function checkEditMode() {

    const urlParams =
        new URLSearchParams(
            window.location.search
        );


    editingMemoryId =
        urlParams.get(
            "edit"
        );


    /*
     * New memory.
     */

    if (
        !editingMemoryId
    ) {

        const dateInput =
            document.getElementById(
                "memoryDate"
            );


        if (
            dateInput &&
            !dateInput.value
        ) {

            dateInput.value =
                new Date()
                    .toISOString()
                    .split("T")[0];

        }


        return;

    }


    /*
     * Edit mode.
     */

    try {

        const response =
            await fetch(
                "/api/memories",
                {
                    method:
                        "GET",

                    credentials:
                        "include"
                }
            );


        if (
            response.status ===
            401
        ) {

            window.location.href =
                "login.html";

            return;

        }


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Unable to load memories."
            );

        }


        const memories =
            Array.isArray(
                data.memories
            )
                ? data.memories
                : [];


        const memory =
            memories.find(
                item =>
                    String(
                        item.id
                    ) ===
                    String(
                        editingMemoryId
                    )
            );


        if (
            !memory
        ) {

            showToast(
                "Memory Not Found",
                "The selected memory could not be found.",
                "danger"
            );


            setTimeout(
                () => {

                    window.location.href =
                        "timeline.html";

                },
                1200
            );


            return;

        }


        populateEditForm(
            memory
        );


    } catch (error) {

        console.error(
            "Edit mode loading error:",
            error
        );


        showToast(
            "Load Failed",
            error.message ||
            "Unable to load the memory.",
            "danger"
        );

    }

}


/* =========================================================
   POPULATE EDIT FORM
   ========================================================= */

function populateEditForm(
    memory
) {

    const pageTitle =
        document.getElementById(
            "pageFormTitle"
        );


    if (
        pageTitle
    ) {

        pageTitle.textContent =
            "Edit Memory";

    }


    setValue(
        "memoryTitle",
        memory.title
    );


    setValue(
        "memoryDate",
        memory.date
    );


    setValue(
        "memoryLocation",
        memory.location
    );


    setValue(
        "memoryEmotion",
        memory.emotion
    );


    setValue(
        "memoryCategory",
        memory.category
    );


    setValue(
        "memoryPrivacy",
        memory.privacy
    );


    setValue(
        "memoryDescription",
        memory.description
    );


    setValue(
        "memoryTags",
        Array.isArray(
            memory.tags
        )
            ? memory.tags.join(
                ", "
            )
            : ""
    );


    setValue(
        "memoryPeople",
        Array.isArray(
            memory.people
        )
            ? memory.people.join(
                ", "
            )
            : ""
    );


    const favorite =
        document.getElementById(
            "memoryFavorite"
        );


    if (
        favorite
    ) {

        favorite.checked =
            Boolean(
                memory.isFavorite
            );

    }


    /*
     * Load existing media.
     */

    if (
        memory.coverImage
    ) {

        currentMediaData =
            memory.coverImage;


        currentMediaType =
            String(
                memory.type ||
                "Photo"
            );


        displayMediaPreview(
            currentMediaData,
            currentMediaType
        );

    }

}


/* =========================================================
   FILE UPLOAD
   ========================================================= */

function initFileUpload() {

    const dropZone =
        document.getElementById(
            "dropZone"
        );


    const fileInput =
        document.getElementById(
            "coverFileInput"
        );


    const previewImg =
        document.getElementById(
            "uploadPreviewImg"
        );


    const previewVideo =
        document.getElementById(
            "uploadPreviewVideo"
        );


    if (
        !dropZone ||
        !fileInput
    ) {

        return;

    }


    /*
     * Clicking the drop zone opens the file selector.
     */

    dropZone.addEventListener(
        "click",
        event => {

            /*
             * Don't reopen the selector if the input
             * itself is clicked.
             */

            if (
                event.target ===
                fileInput
            ) {

                return;

            }


            fileInput.click();

        }
    );


    /*
     * Drag over.
     */

    dropZone.addEventListener(
        "dragover",
        event => {

            event.preventDefault();


            dropZone.classList.add(
                "border-primary"
            );

        }
    );


    /*
     * Drag leave.
     */

    dropZone.addEventListener(
        "dragleave",
        () => {

            dropZone.classList.remove(
                "border-primary"
            );

        }
    );


    /*
     * Drop file.
     */

    dropZone.addEventListener(
        "drop",
        event => {

            event.preventDefault();


            dropZone.classList.remove(
                "border-primary"
            );


            const files =
                event.dataTransfer &&
                event.dataTransfer.files;


            if (
                files &&
                files.length > 0
            ) {

                handleFileSelect(
                    files[0]
                );

            }

        }
    );


    /*
     * Normal file selection.
     */

    fileInput.addEventListener(
        "change",
        event => {

            const files =
                event.target.files;


            if (
                files &&
                files.length > 0
            ) {

                handleFileSelect(
                    files[0]
                );

            }

        }
    );


    /*
     * Handle selected media.
     */

    function handleFileSelect(
        file
    ) {

        if (
            !file
        ) {

            return;

        }


        /*
         * Supported types.
         */

        const isImage =
            file.type &&
            file.type.startsWith(
                "image/"
            );


        const isVideo =
            file.type &&
            file.type.startsWith(
                "video/"
            );


        if (
            !isImage &&
            !isVideo
        ) {

            showToast(
                "Invalid File",
                "Please select a photo or video file.",
                "danger"
            );


            return;

        }


        /*
         * Maximum size: 50 MB.
         *
         * Base64/data URLs are used by the current
         * application architecture, so video files
         * should remain reasonably small.
         */

        const maxSize =
            50 *
            1024 *
            1024;


        if (
            file.size >
            maxSize
        ) {

            showToast(
                "File Too Large",
                "Please choose a photo or video smaller than 50 MB.",
                "danger"
            );


            return;

        }


        /*
         * Save type.
         */

        currentMediaType =
            isVideo
                ? "Video"
                : "Photo";


        /*
         * Read file as Data URL.
         */

        const reader =
            new FileReader();


        reader.onload =
            event => {

                currentMediaData =
                    event.target.result;


                displayMediaPreview(
                    currentMediaData,
                    currentMediaType,
                    file.name
                );


                showToast(
                    currentMediaType ===
                        "Video"
                        ? "Video Uploaded"
                        : "Photo Uploaded",
                    `${file.name} is ready to be saved.`,
                    "success"
                );

            };


        reader.onerror =
            () => {

                showToast(
                    "Upload Failed",
                    "Unable to read the selected file.",
                    "danger"
                );

            };


        reader.readAsDataURL(
            file
        );

    }


    /*
     * Display image/video preview.
     */

    function displayMediaPreview(
        data,
        type,
        fileName = ""
    ) {

        const selectedInfo =
            document.getElementById(
                "selectedMediaInfo"
            );


        const selectedType =
            document.getElementById(
                "selectedMediaType"
            );


        const selectedName =
            document.getElementById(
                "selectedMediaName"
            );


        const uploadIcon =
            document.getElementById(
                "uploadIcon"
            );


        const uploadTitle =
            document.getElementById(
                "uploadTitle"
            );


        /*
         * Hide both previews first.
         */

        if (
            previewImg
        ) {

            previewImg.style.display =
                "none";

            previewImg.removeAttribute(
                "src"
            );

        }


        if (
            previewVideo
        ) {

            previewVideo.pause();

            previewVideo.style.display =
                "none";

            previewVideo.removeAttribute(
                "src"
            );

            previewVideo.load();

        }


        /*
         * Display selected media.
         */

        if (
            type ===
            "Video"
        ) {

            if (
                previewVideo
            ) {

                previewVideo.src =
                    data;


                previewVideo.style.display =
                    "block";


                previewVideo.load();

            }


            if (
                uploadIcon
            ) {

                uploadIcon.className =
                    "bi bi-camera-video-fill display-4 text-gradient mb-2 d-block";

            }


            if (
                uploadTitle
            ) {

                uploadTitle.textContent =
                    "Video selected successfully";

            }

        } else {

            if (
                previewImg
            ) {

                previewImg.src =
                    data;


                previewImg.style.display =
                    "block";

            }


            if (
                uploadIcon
            ) {

                uploadIcon.className =
                    "bi bi-image-fill display-4 text-gradient mb-2 d-block";

            }


            if (
                uploadTitle
            ) {

                uploadTitle.textContent =
                    "Photo selected successfully";

            }

        }


        /*
         * Show selected information.
         */

        if (
            selectedInfo
        ) {

            selectedInfo.style.display =
                "block";

        }


        if (
            selectedType
        ) {

            selectedType.textContent =
                type === "Video"
                    ? "🎥 Video"
                    : "📷 Photo";

        }


        if (
            selectedName
        ) {

            selectedName.textContent =
                fileName
                    ? fileName
                    : type;

        }

    }

}


/* =========================================================
   ECHONARRATE CONTROLS
   ========================================================= */

function initNarrationControls() {

    const generateButton =
        document.getElementById(
            "generateNarrationButton"
        );


    const playButton =
        document.getElementById(
            "playNarrationButton"
        );


    const stopButton =
        document.getElementById(
            "stopNarrationButton"
        );


    if (
        generateButton
    ) {

        generateButton.addEventListener(
            "click",
            generateMemoryNarration
        );

    }


    if (
        playButton
    ) {

        playButton.addEventListener(
            "click",
            playMemoryNarration
        );


        playButton.disabled =
            true;

    }


    if (
        stopButton
    ) {

        stopButton.addEventListener(
            "click",
            stopMemoryNarration
        );

    }

}


/* =========================================================
   GENERATE MEMORY NARRATION
   ========================================================= */

function generateMemoryNarration() {

    const memory =
        readMemoryForNarration();


    if (
        !memory.title ||
        !memory.date ||
        !memory.description
    ) {

        showToast(
            "Incomplete Memory",
            "Add the title, date and description before generating narration.",
            "warning"
        );


        return "";

    }


    const styleElement =
        document.getElementById(
            "narrationStyle"
        );


    const selectedStyle =
        styleElement
            ? styleElement.value
            : "personal";


    /*
     * Strategy Pattern:
     * create the selected strategy.
     */

    const strategy =
        createNarrationStrategy(
            selectedStyle
        );


    /*
     * Context.
     */

    const narrator =
        new StoryNarrator(
            strategy
        );


    /*
     * Generate story.
     */

    const narration =
        narrator.generate(
            memory
        );


    const result =
        document.getElementById(
            "narrationResult"
        );


    if (
        result
    ) {

        result.textContent =
            narration;

    }


    const playButton =
        document.getElementById(
            "playNarrationButton"
        );


    if (
        playButton
    ) {

        playButton.disabled =
            false;

    }


    showToast(
        "Story Generated",
        `${formatNarrationStyle(
            selectedStyle
        )} narration generated successfully.`,
        "success"
    );


    return narration;

}


/* =========================================================
   READ MEMORY FOR NARRATION
   ========================================================= */

function readMemoryForNarration() {

    return {

        title:
            getValue(
                "memoryTitle"
            ).trim(),

        date:
            getValue(
                "memoryDate"
            ),

        location:
            getValue(
                "memoryLocation"
            ).trim(),

        emotion:
            getValue(
                "memoryEmotion"
            ),

        description:
            getValue(
                "memoryDescription"
            ).trim()

    };

}


/* =========================================================
   FORMAT STYLE
   ========================================================= */

function formatNarrationStyle(
    style
) {

    const labels = {

        personal:
            "Personal",

        emotional:
            "Emotional",

        documentary:
            "Documentary",

        storytelling:
            "Storytelling"

    };


    return (
        labels[
            style
        ] ||
        "Personal"
    );

}


/* =========================================================
   PLAY NARRATION
   ========================================================= */

function playMemoryNarration() {

    if (
        !(
            "speechSynthesis"
            in window
        )
    ) {

        showToast(
            "Not Supported",
            "Text-to-speech is not supported by this browser.",
            "danger"
        );


        return;

    }


    const result =
        document.getElementById(
            "narrationResult"
        );


    if (
        !result ||
        !result.textContent.trim() ||
        result.textContent.includes(
            "Your generated memory story"
        )
    ) {

        showToast(
            "No Narration",
            "Generate the memory story first.",
            "warning"
        );


        return;

    }


    /*
     * Stop previous narration.
     */

    window.speechSynthesis.cancel();


    const speech =
        new SpeechSynthesisUtterance(
            result.textContent
        );


    speech.lang =
        "en-US";


    speech.rate =
        0.95;


    speech.pitch =
        1;


    speech.volume =
        1;


    /*
     * Pick English voice if available.
     */

    const voices =
        window.speechSynthesis.getVoices();


    if (
        voices.length
    ) {

        const selectedVoice =
            voices.find(
                voice =>
                    voice.lang ===
                    "en-US"
            ) ||

            voices.find(
                voice =>
                    voice.lang.startsWith(
                        "en"
                    )
            ) ||

            voices[0];


        speech.voice =
            selectedVoice;

    }


    const playButton =
        document.getElementById(
            "playNarrationButton"
        );


    if (
        playButton
    ) {

        playButton.disabled =
            true;


        playButton.innerHTML = `

            <i
                class="bi bi-pause-circle me-1">
            </i>

            Playing...

        `;

    }


    speech.onend =
        () => {

            resetNarrationButton();

        };


    speech.onerror =
        error => {

            console.error(
                "Speech synthesis error:",
                error
            );


            resetNarrationButton();


            showToast(
                "Narration Error",
                "Unable to play the narration.",
                "danger"
            );

        };


    window.speechSynthesis.speak(
        speech
    );

}


/* =========================================================
   STOP NARRATION
   ========================================================= */

function stopMemoryNarration() {

    if (
        "speechSynthesis" in window
    ) {

        window.speechSynthesis.cancel();

    }


    resetNarrationButton();

}


/* =========================================================
   RESET NARRATION BUTTON
   ========================================================= */

function resetNarrationButton() {

    const button =
        document.getElementById(
            "playNarrationButton"
        );


    if (
        button
    ) {

        button.disabled =
            false;


        button.innerHTML = `

            <i
                class="bi bi-volume-up me-1">
            </i>

            Play Narration

        `;

    }

}


/* =========================================================
   FORM SUBMISSION
   ========================================================= */

function initFormSubmit() {

    const form =
        document.getElementById(
            "addMemoryForm"
        );


    if (
        !form
    ) {

        console.warn(
            "addMemoryForm was not found."
        );


        return;

    }


    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            /* ---------------------------------------------
               FORM VALUES
               --------------------------------------------- */

            const title =
                getValue(
                    "memoryTitle"
                ).trim();


            const date =
                getValue(
                    "memoryDate"
                );


            const location =
                getValue(
                    "memoryLocation"
                ).trim();


            const emotion =
                getValue(
                    "memoryEmotion"
                );


            const category =
                getValue(
                    "memoryCategory"
                );


            const privacy =
                getValue(
                    "memoryPrivacy"
                );


            const description =
                getValue(
                    "memoryDescription"
                ).trim();


            const tagsRaw =
                getValue(
                    "memoryTags"
                );


            const peopleRaw =
                getValue(
                    "memoryPeople"
                );


            const favorite =
                document.getElementById(
                    "memoryFavorite"
                );


            const isFavorite =
                favorite
                    ? favorite.checked
                    : false;


            /* ---------------------------------------------
               REQUIRED VALIDATION
               --------------------------------------------- */

            if (
                !title ||
                !date ||
                !description
            ) {

                showToast(
                    "Validation Error",
                    "Please fill in the title, date, and description.",
                    "danger"
                );


                return;

            }


            if (
                title.length >
                200
            ) {

                showToast(
                    "Title Too Long",
                    "Please keep the title under 200 characters.",
                    "danger"
                );


                return;

            }


            if (
                description.length >
                5000
            ) {

                showToast(
                    "Description Too Long",
                    "Please keep the description under 5000 characters.",
                    "danger"
                );


                return;

            }


            /*
             * Require media.
             *
             * This preserves the original Cover Media behavior.
             */

            if (
                !currentMediaData
            ) {

                showToast(
                    "Media Required",
                    "Please select a photo or video for this memory.",
                    "warning"
                );


                return;

            }


            /* ---------------------------------------------
               TAGS
               --------------------------------------------- */

            const tags =
                tagsRaw
                    ? tagsRaw
                        .split(",")
                        .map(
                            tag =>
                                tag.trim()
                        )
                        .filter(
                            Boolean
                        )
                    : [];


            /* ---------------------------------------------
               PEOPLE
               --------------------------------------------- */

            const people =
                peopleRaw
                    ? peopleRaw
                        .split(",")
                        .map(
                            person =>
                                person.trim()
                        )
                        .filter(
                            Boolean
                        )
                    : [];


            /* ---------------------------------------------
               SUBMIT BUTTON
               --------------------------------------------- */

            const submitButton =
                form.querySelector(
                    'button[type="submit"]'
                );


            if (
                submitButton
            ) {

                submitButton.disabled =
                    true;


                submitButton.dataset.originalText =
                    submitButton.innerHTML;


                submitButton.innerHTML = `

                    <span
                        class="spinner-border spinner-border-sm me-1"
                        role="status"
                        aria-hidden="true">
                    </span>

                    Saving...

                `;

            }


            /* =================================================
               EDIT EXISTING MEMORY
               ================================================= */

            if (
                editingMemoryId
            ) {

                try {

                    const response =
                        await fetch(
                            `/api/memories/${encodeURIComponent(
                                editingMemoryId
                            )}`,
                            {

                                method:
                                    "PUT",

                                credentials:
                                    "include",

                                headers: {

                                    "Content-Type":
                                        "application/json"

                                },

                                body:
                                    JSON.stringify({

                                        title,

                                        description,

                                        date,

                                        location,

                                        emotion,

                                        category,

                                        type:
                                            currentMediaType,

                                        coverImage:
                                            currentMediaData,

                                        tags,

                                        people,

                                        privacy,

                                        isFavorite

                                    })

                            }
                        );


                    if (
                        response.status ===
                        401
                    ) {

                        window.location.href =
                            "login.html";


                        return;

                    }


                    let data = {};


                    try {

                        data =
                            await response.json();

                    } catch {

                        data =
                            {};

                    }


                    if (
                        !response.ok ||
                        !data.success
                    ) {

                        throw new Error(
                            data.message ||
                            "Unable to update memory."
                        );

                    }


                    showToast(
                        "Memory Updated",
                        "Your changes have been saved to your personal archive.",
                        "success"
                    );


                    setTimeout(
                        () => {

                            window.location.href =
                                "timeline.html";

                        },
                        1000
                    );


                } catch (error) {

                    console.error(
                        "Memory update error:",
                        error
                    );


                    showToast(
                        "Update Failed",
                        error.message ||
                        "Unable to update memory.",
                        "danger"
                    );


                    restoreSubmitButton(
                        submitButton
                    );

                }


                return;

            }


            /* =================================================
               CREATE NEW MEMORY
               ================================================= */

            try {

                const response =
                    await fetch(
                        "/api/memories",
                        {

                            method:
                                "POST",

                            credentials:
                                "include",

                            headers: {

                                "Content-Type":
                                    "application/json"

                            },

                            body:
                                JSON.stringify({

                                    title,

                                    description,

                                    date,

                                    location,

                                    emotion,

                                    category,

                                    type:
                                        currentMediaType,

                                    coverImage:
                                        currentMediaData,

                                    media:
                                        [
                                            currentMediaData
                                        ],

                                    tags,

                                    people,

                                    isFavorite,

                                    likes:
                                        0,

                                    privacy,

                                    audioNote:
                                        ""

                                })

                        }
                    );


                if (
                    response.status ===
                    401
                ) {

                    showToast(
                        "Login Required",
                        "Please log in before creating a memory.",
                        "danger"
                    );


                    setTimeout(
                        () => {

                            window.location.href =
                                "login.html";

                        },
                        1000
                    );


                    restoreSubmitButton(
                        submitButton
                    );


                    return;

                }


                let data = {};


                try {

                    data =
                        await response.json();

                } catch {

                    data =
                        {};

                }


                if (
                    !response.ok ||
                    !data.success
                ) {

                    throw new Error(
                        data.message ||
                        "Unable to save memory."
                    );

                }


                showToast(
                    currentMediaType ===
                        "Video"
                        ? "Video Memory Archived"
                        : "Memory Archived",
                    "Your memory was saved to your personal archive.",
                    "success"
                );


                setTimeout(
                    () => {

                        window.location.href =
                            "timeline.html";

                    },
                    1000
                );


            } catch (error) {

                console.error(
                    "Memory save error:",
                    error
                );


                showToast(
                    "Save Failed",
                    error.message ||
                    "Unable to save memory.",
                    "danger"
                );


                restoreSubmitButton(
                    submitButton
                );

            }

        }
    );

}


/* =========================================================
   RESTORE SUBMIT BUTTON
   ========================================================= */

function restoreSubmitButton(
    button
) {

    if (
        !button
    ) {

        return;

    }


    button.disabled =
        false;


    if (
        button.dataset.originalText
    ) {

        button.innerHTML =
            button.dataset.originalText;

    }

}


/* =========================================================
   VALUE HELPERS
   ========================================================= */

function getValue(
    id
) {

    const element =
        document.getElementById(
            id
        );


    if (
        !element
    ) {

        return "";

    }


    return element.value ||
        "";

}


function setValue(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (
        element
    ) {

        element.value =
            value ?? "";

    }

}