/* ==========================================================================
   EchoLife Add / Edit Memory Controller
   Database-backed version + Strategy Pattern (EchoNarrate)
   ========================================================================== */


/* =========================================================
   GLOBAL STATE
   ========================================================= */

let editingMemoryId = null;


/*
 * Default image used when the user has not selected one.
 */
let currentPreviewImage =
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80";


/* =========================================================
   STRATEGY PATTERN - ECHONARRATE
   ========================================================= */

/*
 * Strategy interface.
 *
 * Every narration strategy must implement narrate().
 */
class NarrationStrategy {

    narrate(memory) {

        throw new Error(
            "narrate() must be implemented"
        );

    }

}


/* =========================================================
   PERSONAL NARRATION STRATEGY
   ========================================================= */

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


/* =========================================================
   EMOTIONAL NARRATION STRATEGY
   ========================================================= */

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


/* =========================================================
   DOCUMENTARY NARRATION STRATEGY
   ========================================================= */

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


/* =========================================================
   STORYTELLING NARRATION STRATEGY
   ========================================================= */

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


/* =========================================================
   STORY NARRATOR - STRATEGY CONTEXT
   ========================================================= */

class StoryNarrator {

    constructor(
        strategy
    ) {

        this.strategy =
            strategy;

    }


    /*
     * Change narration behavior at runtime.
     */
    setStrategy(
        strategy
    ) {

        this.strategy =
            strategy;

    }


    /*
     * Generate the story using the selected strategy.
     */
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


/* =========================================================
   NARRATION STRATEGY CREATION
   ========================================================= */

/*
 * This function creates the appropriate strategy.
 *
 * It keeps the UI independent from the concrete
 * narration classes.
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
   INITIALIZE
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


    /* -------------------------------------------------------
       NEW MEMORY
       ------------------------------------------------------- */

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


    /* -------------------------------------------------------
       EDIT MEMORY
       ------------------------------------------------------- */

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


        /*
         * Session expired
         */

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


    /*
     * Existing favorite state.
     */

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
     * Existing image.
     */

    if (
        memory.coverImage
    ) {

        currentPreviewImage =
            memory.coverImage;


        const previewImg =
            document.getElementById(
                "uploadPreviewImg"
            );


        if (
            previewImg
        ) {

            previewImg.src =
                memory.coverImage;


            previewImg.style.display =
                "block";

        }

    }


    /*
     * Existing audio note, if the form has
     * an audio-note input.
     */

    if (
        typeof memory.audioNote !==
        "undefined"
    ) {

        setValue(
            "memoryAudioNote",
            memory.audioNote
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


    if (
        !dropZone ||
        !fileInput
    ) {

        return;

    }


    /* -------------------------------------------------------
       CLICK UPLOAD AREA
       ------------------------------------------------------- */

    dropZone.addEventListener(
        "click",
        event => {

            /*
             * Prevent nested buttons/inputs from triggering
             * the file dialog twice.
             */

            if (
                event.target ===
                    fileInput ||
                event.target.closest(
                    "button"
                )
            ) {

                return;

            }


            fileInput.click();

        }
    );


    /* -------------------------------------------------------
       DRAG OVER
       ------------------------------------------------------- */

    dropZone.addEventListener(
        "dragover",
        event => {

            event.preventDefault();


            dropZone.classList.add(
                "border-primary"
            );

        }
    );


    /* -------------------------------------------------------
       DRAG LEAVE
       ------------------------------------------------------- */

    dropZone.addEventListener(
        "dragleave",
        () => {

            dropZone.classList.remove(
                "border-primary"
            );

        }
    );


    /* -------------------------------------------------------
       DROP
       ------------------------------------------------------- */

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


    /* -------------------------------------------------------
       NORMAL FILE INPUT
       ------------------------------------------------------- */

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


    /* -------------------------------------------------------
       PROCESS FILE
       ------------------------------------------------------- */

    function handleFileSelect(
        file
    ) {

        if (
            !file
        ) {

            return;

        }


        /*
         * Only images are accepted.
         */

        if (
            !file.type ||
            !file.type.startsWith(
                "image/"
            )
        ) {

            showToast(
                "Invalid File",
                "Please select an image file.",
                "danger"
            );


            return;

        }


        /*
         * Maximum size: 10 MB.
         */

        const maxSize =
            10 *
            1024 *
            1024;


        if (
            file.size >
            maxSize
        ) {

            showToast(
                "Image Too Large",
                "Please choose an image smaller than 10 MB.",
                "danger"
            );


            return;

        }


        const reader =
            new FileReader();


        reader.onload =
            event => {

                currentPreviewImage =
                    event.target.result;


                if (
                    previewImg
                ) {

                    previewImg.src =
                        currentPreviewImage;


                    previewImg.style.display =
                        "block";

                }


                showToast(
                    "File Uploaded",
                    "Image preview generated successfully.",
                    "success"
                );

            };


        reader.onerror =
            () => {

                showToast(
                    "Upload Failed",
                    "Unable to read the selected image.",
                    "danger"
                );

            };


        reader.readAsDataURL(
            file
        );

    }

}


/* =========================================================
   ECHONARRATE CONTROLS
   ========================================================= */

function initNarrationControls() {

    /*
     * The HTML controls are optional.
     *
     * This means the Add/Edit Memory page will
     * continue working even before EchoNarrate UI
     * is added to add-memory.html.
     */

    const generateButton =
        document.getElementById(
            "generateNarrationButton"
        );


    const playButton =
        document.getElementById(
            "playNarrationButton"
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


}


/* =========================================================
   GENERATE MEMORY NARRATION
   ========================================================= */

function generateMemoryNarration() {

    /*
     * Read memory information directly from the
     * current Add/Edit Memory form.
     */

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


    const description =
        getValue(
            "memoryDescription"
        ).trim();


    /*
     * Minimum data required.
     */

    if (
        !title ||
        !date ||
        !description
    ) {

        showToast(
            "Incomplete Memory",
            "Add the title, date and description before generating narration.",
            "warning"
        );


        return "";

    }


    /*
     * Read selected strategy.
     */

    const styleElement =
        document.getElementById(
            "narrationStyle"
        );


    const selectedStyle =
        styleElement
            ? styleElement.value
            : "personal";


    /*
     * Create concrete Strategy.
     */

    const strategy =
        createNarrationStrategy(
            selectedStyle
        );


    /*
     * Create Strategy Context.
     */

    const narrator =
        new StoryNarrator(
            strategy
        );


    /*
     * Create temporary memory object.
     */

    const memory = {

        title,

        date,

        location,

        emotion,

        description

    };


    /*
     * Generate narration.
     */

    const narration =
        narrator.generate(
            memory
        );


    /*
     * Display generated story.
     */

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


    /*
     * Enable Play button.
     */

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


    return narration;

}


/* =========================================================
   PLAY GENERATED NARRATION
   ========================================================= */

function playMemoryNarration() {

    /*
     * Browser must support Speech Synthesis.
     */

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
        !result.textContent.trim()
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


    speech.rate =
        0.95;


    speech.pitch =
        1;


    speech.volume =
        1;


    speech.onstart =
        () => {

            const playButton =
                document.getElementById(
                    "playNarrationButton"
                );


            if (
                playButton
            ) {

                playButton.classList.add(
                    "active"
                );

            }

        };


    speech.onend =
        () => {

            const playButton =
                document.getElementById(
                    "playNarrationButton"
                );


            if (
                playButton
            ) {

                playButton.classList.remove(
                    "active"
                );

            }

        };


    speech.onerror =
        error => {

            console.error(
                "Speech synthesis error:",
                error
            );


            const playButton =
                document.getElementById(
                    "playNarrationButton"
                );


            if (
                playButton
            ) {

                playButton.classList.remove(
                    "active"
                );

            }


            showToast(
                "Narration Error",
                "Unable to play the generated narration.",
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
        "speechSynthesis"
        in window
    ) {

        window.speechSynthesis.cancel();

    }


    const playButton =
        document.getElementById(
            "playNarrationButton"
        );


    if (
        playButton
    ) {

        playButton.classList.remove(
            "active"
        );

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


            /* ------------------------------------------------
               FORM VALUES
               ------------------------------------------------ */

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


            const audioNote =
                getValue(
                    "memoryAudioNote"
                ).trim();


            const favorite =
                document.getElementById(
                    "memoryFavorite"
                );


            const isFavorite =
                favorite
                    ? favorite.checked
                    : false;


            /* ------------------------------------------------
               VALIDATION
               ------------------------------------------------ */

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


            /*
             * Title length.
             */

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


            /*
             * Description length.
             */

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


            /* ------------------------------------------------
               TAGS
               ------------------------------------------------ */

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


            /* ------------------------------------------------
               PEOPLE
               ------------------------------------------------ */

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


            /* ------------------------------------------------
               SUBMIT BUTTON
               ------------------------------------------------ */

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
                                            "Photo",

                                        coverImage:
                                            currentPreviewImage,

                                        tags,

                                        people,

                                        privacy,

                                        audioNote

                                    })

                            }
                        );


                    /*
                     * Session expired.
                     */

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


                    /*
                     * Return to Timeline.
                     */

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
                                        "Photo",

                                    coverImage:
                                        currentPreviewImage,

                                    tags,

                                    people,

                                    isFavorite,

                                    likes:
                                        0,

                                    privacy,

                                    audioNote

                                })

                        }
                    );


                /*
                 * Session expired.
                 */

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
                    "Memory Archived",
                    "Your memory was saved to your personal archive.",
                    "success"
                );


                /*
                 * Return to Timeline after saving.
                 */

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