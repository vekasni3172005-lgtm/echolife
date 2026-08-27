/* ==========================================================================
   EchoLife Add / Edit Memory Controller
   Database-backed version
   ========================================================================== */


let editingMemoryId = null;


/*
 * Default image used when the user has not selected one.
 */
let currentPreviewImage =
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80";


/* =========================================================
   INITIALIZE
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        initFileUpload();

        await checkEditMode();

        initFormSubmit();

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
     * -------------------------------------------------------
     * NEW MEMORY
     * -------------------------------------------------------
     */

    if (!editingMemoryId) {

        const dateInput =
            document.getElementById(
                "memoryDate"
            );


        if (dateInput) {

            dateInput.value =
                new Date()
                    .toISOString()
                    .split("T")[0];

        }


        return;

    }


    /*
     * -------------------------------------------------------
     * EDIT MEMORY
     * -------------------------------------------------------
     */

    try {

        const response =
            await fetch(
                "/api/memories",
                {
                    method: "GET",
                    credentials: "include"
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


        const memory =
            data.memories.find(
                item =>
                    String(
                        item.id
                    ) ===
                    String(
                        editingMemoryId
                    )
            );


        if (!memory) {

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


    if (pageTitle) {

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


    if (favorite) {

        favorite.checked =
            Boolean(
                memory.isFavorite
            );

    }


    /*
     * Existing image
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


        if (previewImg) {

            previewImg.src =
                memory.coverImage;

            previewImg.style.display =
                "block";

        }

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


    /*
     * Click upload area
     */

    dropZone.addEventListener(
        "click",
        () => {

            fileInput.click();

        }
    );


    /*
     * Drag over
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
     * Drag leave
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
     * Drop
     */

    dropZone.addEventListener(
        "drop",
        event => {

            event.preventDefault();


            dropZone.classList.remove(
                "border-primary"
            );


            if (
                event.dataTransfer.files &&
                event.dataTransfer.files[0]
            ) {

                handleFileSelect(
                    event.dataTransfer.files[0]
                );

            }

        }
    );


    /*
     * Normal file input
     */

    fileInput.addEventListener(
        "change",
        event => {

            if (
                event.target.files &&
                event.target.files[0]
            ) {

                handleFileSelect(
                    event.target.files[0]
                );

            }

        }
    );


    /*
     * Convert selected file to Base64
     */

    function handleFileSelect(
        file
    ) {

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
         * Limit extremely large images.
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
   FORM SUBMISSION
   ========================================================= */

function initFormSubmit() {

    const form =
        document.getElementById(
            "addMemoryForm"
        );


    if (!form) {

        return;

    }


    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            /*
             * ---------------------------------------------------
             * FORM VALUES
             * ---------------------------------------------------
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


            /*
             * ---------------------------------------------------
             * VALIDATION
             * ---------------------------------------------------
             */

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
             * Comma-separated fields
             */

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


            /*
             * ---------------------------------------------------
             * BUTTON
             * ---------------------------------------------------
             */

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
                        class="spinner-border spinner-border-sm me-1">
                    </span>

                    Saving...

                `;

            }


            /*
             * ---------------------------------------------------
             * EDIT EXISTING MEMORY
             * ---------------------------------------------------
             */

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

                                        audioNote:
                                            ""

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

                        data = {};

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


            /*
             * ---------------------------------------------------
             * CREATE NEW MEMORY
             * ---------------------------------------------------
             */

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

                                    audioNote:
                                        ""

                                })

                        }
                    );


                /*
                 * Session expired
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


                    return;

                }


                let data = {};


                try {

                    data =
                        await response.json();

                } catch {

                    data = {};

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


    return element
        ? element.value || ""
        : "";

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