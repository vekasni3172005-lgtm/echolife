/* ==========================================================================
   EchoLife Memory Gallery Controller
   Database-backed Gallery

   Features:
   - Loads current user's memories
   - Photo gallery
   - Video gallery
   - Album/category filtering
   - Lightbox
   - Video playback
   - Memory details
   ========================================================================== */


let galleryMemories = [];


/* =========================================================
   INITIALIZE
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        await loadGalleryMemories();

        initGalleryTabs();

    }
);


/* =========================================================
   LOAD USER MEMORIES
   ========================================================= */

async function loadGalleryMemories() {

    try {

        const response =
            await fetch(
                "/api/memories",
                {
                    method: "GET",
                    credentials: "include"
                }
            );


        if (
            response.status === 401
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
                "Unable to load gallery."
            );

        }


        galleryMemories =
            Array.isArray(
                data.memories
            )
                ? data.memories
                : [];


        galleryMemories =
            galleryMemories.map(
                memory => ({

                    ...memory,

                    id:
                        String(
                            memory.id
                        ),

                    title:
                        memory.title ||
                        "Untitled Memory",

                    description:
                        memory.description ||
                        "",

                    date:
                        memory.date ||
                        "",

                    location:
                        memory.location ||
                        "",

                    emotion:
                        memory.emotion ||
                        "Memory",

                    category:
                        memory.category ||
                        "General",

                    type:
                        memory.type ||
                        "Photo",

                    coverImage:
                        memory.coverImage ||
                        "",

                    tags:
                        Array.isArray(
                            memory.tags
                        )
                            ? memory.tags
                            : [],

                    likes:
                        Number(
                            memory.likes ||
                            0
                        )

                })
            );


        renderGallery(
            "all"
        );


    } catch (error) {

        console.error(
            "Gallery loading error:",
            error
        );


        const container =
            document.getElementById(
                "galleryMasonryGrid"
            );


        if (
            container
        ) {

            container.innerHTML = `

                <div
                    class="col-12 text-center py-5 glass-card"
                >

                    <i
                        class="bi bi-exclamation-circle fs-1 text-danger mb-3 d-block"
                    ></i>

                    <h5
                        class="text-white"
                    >

                        Unable to Load Gallery

                    </h5>

                    <p
                        class="text-secondary-custom"
                    >

                        ${escapeHtml(
                            error.message ||
                            "Please try again."
                        )}

                    </p>


                    <button
                        type="button"
                        class="btn btn-aurora mt-2"
                        onclick="loadGalleryMemories()"
                    >

                        <i
                            class="bi bi-arrow-clockwise me-1"
                        ></i>

                        Try Again

                    </button>

                </div>

            `;

        }

    }

}


/* =========================================================
   GALLERY TABS
   ========================================================= */

function initGalleryTabs() {

    const tabs =
        document.querySelectorAll(
            ".gallery-tab-btn"
        );


    tabs.forEach(
        tab => {

            tab.addEventListener(
                "click",
                event => {

                    event.preventDefault();


                    tabs.forEach(
                        item => {

                            item.classList.remove(
                                "active",
                                "btn-aurora"
                            );


                            item.classList.add(
                                "btn-glass"
                            );

                        }
                    );


                    tab.classList.remove(
                        "btn-glass"
                    );


                    tab.classList.add(
                        "active",
                        "btn-aurora"
                    );


                    const category =
                        tab.getAttribute(
                            "data-category"
                        );


                    renderGallery(
                        category ||
                        "all"
                    );

                }
            );

        }
    );

}


/* =========================================================
   CHECK VIDEO
   ========================================================= */

function isVideoMemory(
    memory
) {

    return (
        String(
            memory.type ||
            ""
        )
            .toLowerCase()
            .trim() ===
        "video"
    );

}


/* =========================================================
   BUILD GALLERY MEDIA
   ========================================================= */

function buildGalleryMedia(
    memory
) {

    if (
        !memory.coverImage
    ) {

        return `

            <div
                class="w-100 h-100 d-flex align-items-center justify-content-center bg-dark"
                style="min-height:250px;"
            >

                <i
                    class="bi bi-image fs-1 text-muted"
                ></i>

            </div>

        `;

    }


    if (
        isVideoMemory(
            memory
        )
    ) {

        return `

            <video
                class="masonry-img gallery-video"
                muted
                playsinline
                preload="metadata"
                onclick="event.stopPropagation();"
            >

                <source
                    src="${escapeAttribute(
                        memory.coverImage
                    )}"
                >

                Your browser does not support
                this video.

            </video>

            <div
                class="gallery-video-icon"
            >

                <i
                    class="bi bi-play-circle-fill"
                ></i>

            </div>

        `;

    }


    return `

        <img
            src="${escapeAttribute(
                memory.coverImage
            )}"
            class="masonry-img"
            alt="${escapeAttribute(
                memory.title
            )}"
            loading="lazy"
        >

    `;

}


/* =========================================================
   RENDER GALLERY
   ========================================================= */

function renderGallery(
    category = "all"
) {

    const container =
        document.getElementById(
            "galleryMasonryGrid"
        );


    if (
        !container
    ) {

        return;

    }


    let filtered =
        [
            ...galleryMemories
        ];


    /* -------------------------------------------------------
       CATEGORY
       ------------------------------------------------------- */

    if (
        category !==
        "all"
    ) {

        filtered =
            filtered.filter(
                memory =>
                    String(
                        memory.category ||
                        ""
                    )
                        .toLowerCase() ===
                    String(
                        category
                    )
                        .toLowerCase()
            );

    }


    /* -------------------------------------------------------
       ONLY MEDIA
       ------------------------------------------------------- */

    filtered =
        filtered.filter(
            memory =>
                Boolean(
                    memory.coverImage
                )
        );


    /* -------------------------------------------------------
       EMPTY
       ------------------------------------------------------- */

    if (
        filtered.length ===
        0
    ) {

        container.innerHTML = `

            <div
                class="col-12 text-center py-5 glass-card"
            >

                <i
                    class="bi bi-images fs-1 text-muted-custom mb-3 d-block"
                ></i>


                <h5
                    class="text-white"
                >

                    No Photos or Videos Found

                </h5>


                <p
                    class="text-secondary-custom"
                >

                    ${
                        galleryMemories.length ===
                        0

                            ? "Your personal gallery is empty."

                            : "No media matches this album category."

                    }

                </p>


                <a
                    href="add-memory.html"
                    class="btn btn-aurora"
                >

                    <i
                        class="bi bi-cloud-arrow-up me-1"
                    ></i>

                    Upload Media

                </a>

            </div>

        `;


        return;

    }


    /* -------------------------------------------------------
       RENDER
       ------------------------------------------------------- */

    container.innerHTML =
        filtered
            .map(
                memory => `

                    <div
                        class="masonry-item"
                        onclick="openLightbox('${escapeAttribute(
                            memory.id
                        )}')"
                    >

                        ${buildGalleryMedia(
                            memory
                        )}


                        <!-- VIDEO INDICATOR -->

                        ${
                            isVideoMemory(
                                memory
                            )

                                ? `

                                    <span
                                        class="position-absolute top-0 start-0 m-2 badge bg-dark bg-opacity-75 text-white"
                                        style="z-index:5;"
                                    >

                                        <i
                                            class="bi bi-camera-video-fill me-1"
                                        ></i>

                                        Video

                                    </span>

                                `

                                : ""

                        }


                        <!-- OVERLAY -->

                        <div
                            class="masonry-overlay"
                        >


                            <span
                                class="badge-emotion badge-${escapeAttribute(
                                    String(
                                        memory.emotion ||
                                        "Memory"
                                    )
                                        .toLowerCase()
                                        .replace(
                                            /\s+/g,
                                            "-"
                                        )
                                )} align-self-start mb-2"
                            >

                                ${escapeHtml(
                                    memory.emotion
                                )}

                            </span>


                            <h6
                                class="text-white mb-1 font-heading"
                            >

                                ${escapeHtml(
                                    memory.title
                                )}

                            </h6>


                            <div
                                class="d-flex justify-content-between align-items-center small text-secondary-custom"
                            >

                                <span>

                                    <i
                                        class="bi bi-geo-alt me-1"
                                    ></i>

                                    ${escapeHtml(
                                        memory.location
                                    )}

                                </span>


                                <span>

                                    <i
                                        class="bi bi-heart-fill text-danger me-1"
                                    ></i>

                                    ${Number(
                                        memory.likes ||
                                        0
                                    )}

                                </span>

                            </div>


                        </div>

                    </div>

                `
            )
            .join("");

}


/* =========================================================
   LIGHTBOX
   ========================================================= */

function openLightbox(
    id
) {

    const memory =
        galleryMemories.find(
            item =>
                String(
                    item.id
                ) ===
                String(id)
        );


    if (
        !memory
    ) {

        return;

    }


    let modalEl =
        document.getElementById(
            "galleryLightboxModal"
        );


    /*
     * Create modal once.
     */

    if (
        !modalEl
    ) {

        document.body.insertAdjacentHTML(
            "beforeend",
            `

                <div
                    class="modal fade"
                    id="galleryLightboxModal"
                    tabindex="-1"
                    aria-hidden="true"
                >

                    <div
                        class="modal-dialog modal-dialog-centered modal-xl"
                    >

                        <div
                            class="modal-content glass-modal p-0 overflow-hidden"
                        >

                            <div
                                class="row g-0"
                            >


                                <!-- MEDIA -->

                                <div
                                    class="col-lg-8 bg-black d-flex align-items-center justify-content-center p-2 position-relative"
                                    style="min-height:450px;"
                                >

                                    <div
                                        id="galleryLightboxMedia"
                                        class="w-100 h-100 d-flex align-items-center justify-content-center"
                                    ></div>


                                    <button
                                        type="button"
                                        class="btn-close btn-close-white position-absolute top-0 start-0 m-3 p-2 bg-dark rounded-circle"
                                        data-bs-dismiss="modal"
                                        onclick="stopGalleryMedia()"
                                    ></button>

                                </div>


                                <!-- DETAILS -->

                                <div
                                    class="col-lg-4 p-4 d-flex flex-column justify-content-between"
                                >

                                    <div>


                                        <div
                                            class="d-flex align-items-center justify-content-between mb-3"
                                        >

                                            <span
                                                id="lightboxEmotion"
                                                class="badge-emotion"
                                            ></span>


                                            <span
                                                id="lightboxDate"
                                                class="small text-muted-custom"
                                            ></span>

                                        </div>


                                        <h4
                                            id="lightboxTitle"
                                            class="text-white font-heading mb-2"
                                        ></h4>


                                        <p
                                            id="lightboxLocation"
                                            class="text-secondary-custom small mb-3"
                                        ></p>


                                        <p
                                            id="lightboxDesc"
                                            class="text-secondary-custom small leading-relaxed mb-4"
                                        ></p>


                                        <div
                                            class="mb-3"
                                        >

                                            <h6
                                                class="text-white small mb-2"
                                            >

                                                Tags

                                            </h6>


                                            <div
                                                id="lightboxTags"
                                                class="d-flex flex-wrap gap-1"
                                            ></div>

                                        </div>

                                    </div>



                                    <div
                                        class="d-flex align-items-center justify-content-between border-top border-glass pt-3"
                                    >

                                        <button
                                            id="lightboxLikeBtn"
                                            class="btn btn-glass btn-sm"
                                            type="button"
                                        >

                                            <i
                                                class="bi bi-heart-fill text-danger me-1"
                                            ></i>

                                            <span
                                                id="lightboxLikeText"
                                            >
                                                Like
                                            </span>

                                        </button>


                                        <a
                                            id="lightboxDetailBtn"
                                            href=""
                                            class="btn btn-aurora btn-sm"
                                        >

                                            Full Memory Details

                                            <i
                                                class="bi bi-arrow-right ms-1"
                                            ></i>

                                        </a>

                                    </div>


                                </div>

                            </div>

                        </div>

                    </div>

                </div>

            `
        );


        modalEl =
            document.getElementById(
                "galleryLightboxModal"
            );

    }


    /* -------------------------------------------------------
       ELEMENTS
       ------------------------------------------------------- */

    const mediaContainer =
        document.getElementById(
            "galleryLightboxMedia"
        );


    const emotion =
        document.getElementById(
            "lightboxEmotion"
        );


    const date =
        document.getElementById(
            "lightboxDate"
        );


    const title =
        document.getElementById(
            "lightboxTitle"
        );


    const location =
        document.getElementById(
            "lightboxLocation"
        );


    const description =
        document.getElementById(
            "lightboxDesc"
        );


    const tagsContainer =
        document.getElementById(
            "lightboxTags"
        );


    const detailButton =
        document.getElementById(
            "lightboxDetailBtn"
        );


    const likeButton =
        document.getElementById(
            "lightboxLikeBtn"
        );


    /* -------------------------------------------------------
       MEDIA
       ------------------------------------------------------- */

    if (
        isVideoMemory(
            memory
        )
    ) {

        mediaContainer.innerHTML = `

            <video
                id="galleryLightboxVideo"
                class="w-100"
                controls
                autoplay
                playsinline
                preload="metadata"
                style="
                    max-height:80vh;
                    object-fit:contain;
                    background:#000;
                "
            >

                <source
                    src="${escapeAttribute(
                        memory.coverImage
                    )}"
                >

                Your browser does not support
                this video.

            </video>

        `;

    } else {

        mediaContainer.innerHTML = `

            <img
                src="${escapeAttribute(
                    memory.coverImage
                )}"
                class="img-fluid rounded-3"
                style="
                    max-height:80vh;
                    object-fit:contain;
                "
                alt="${escapeAttribute(
                    memory.title
                )}"
            >

        `;

    }


    /* -------------------------------------------------------
       DETAILS
       ------------------------------------------------------- */

    emotion.textContent =
        memory.emotion ||
        "Memory";


    emotion.className =
        `badge-emotion badge-${String(
            memory.emotion ||
            "Memory"
        )
            .toLowerCase()
            .replace(
                /\s+/g,
                "-"
            )}`;


    date.textContent =
        memory.date ||
        "";


    title.textContent =
        memory.title ||
        "";


    location.innerHTML = `

        <i
            class="bi bi-geo-alt me-1 text-gradient"
        ></i>

        ${escapeHtml(
            memory.location ||
            ""
        )}

    `;


    description.textContent =
        memory.description ||
        "";


    tagsContainer.innerHTML =
        Array.isArray(
            memory.tags
        ) &&
        memory.tags.length

            ? memory.tags
                .map(
                    tag => `

                        <span
                            class="badge bg-secondary text-secondary-custom"
                        >

                            #${escapeHtml(
                                tag
                            )}

                        </span>

                    `
                )
                .join("")

            : `

                <span
                    class="small text-muted-custom"
                >

                    No tags

                </span>

            `;


    detailButton.href =
        `timeline.html?id=${encodeURIComponent(
            memory.id
        )}`;


    /*
     * LIKE BUTTON
     */

    likeButton.onclick =
        () => {

            handleGalleryLike(
                memory.id,
                likeButton
            );

        };


    /*
     * Show modal.
     */

    const modal =
        bootstrap.Modal.getOrCreateInstance(
            modalEl
        );


    modal.show();

}


/* =========================================================
   LIKE FROM GALLERY
   ========================================================= */

async function handleGalleryLike(
    id,
    button
) {

    try {

        button.disabled =
            true;


        const response =
            await fetch(
                `/api/memories/${encodeURIComponent(
                    id
                )}/like`,
                {

                    method:
                        "PATCH",

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
                "Unable to update likes."
            );

        }


        const memory =
            galleryMemories.find(
                item =>
                    String(
                        item.id
                    ) ===
                    String(id)
            );


        if (
            memory
        ) {

            memory.likes =
                Number(
                    data.likes ||
                    0
                );

        }


        const likeText =
            document.getElementById(
                "lightboxLikeText"
            );


        if (
            likeText
        ) {

            likeText.textContent =
                `${Number(
                    data.likes ||
                    0
                )} Likes`;

        }


        renderGallery(
            "all"
        );


    } catch (error) {

        console.error(
            "Gallery like error:",
            error
        );


        showGalleryToast(
            "Like Failed",
            error.message,
            "danger"
        );


    } finally {

        button.disabled =
            false;

    }

}


/* =========================================================
   STOP GALLERY VIDEO
   ========================================================= */

function stopGalleryMedia() {

    const video =
        document.getElementById(
            "galleryLightboxVideo"
        );


    if (
        video
    ) {

        video.pause();

        video.currentTime =
            0;

    }

}


/* =========================================================
   STOP VIDEO WHEN MODAL CLOSES
   ========================================================= */

document.addEventListener(
    "hidden.bs.modal",
    event => {

        if (
            event.target &&
            event.target.id ===
            "galleryLightboxModal"
        ) {

            stopGalleryMedia();

        }

    }
);


/* =========================================================
   TOAST
   ========================================================= */

function showGalleryToast(
    title,
    message,
    type = "info"
) {

    let container =
        document.querySelector(
            ".gallery-toast-container"
        );


    if (
        !container
    ) {

        container =
            document.createElement(
                "div"
            );


        container.className =
            "gallery-toast-container";


        container.style.position =
            "fixed";


        container.style.right =
            "20px";


        container.style.bottom =
            "20px";


        container.style.zIndex =
            "99999";


        document.body.appendChild(
            container
        );

    }


    const toast =
        document.createElement(
            "div"
        );


    toast.className =
        "glass-card p-3 mb-2";


    toast.innerHTML = `

        <strong
            class="text-white d-block"
        >

            ${escapeHtml(
                title
            )}

        </strong>


        <span
            class="text-secondary-custom small"
        >

            ${escapeHtml(
                message ||
                ""
            )}

        </span>

    `;


    container.appendChild(
        toast
    );


    setTimeout(
        () => {

            toast.remove();

        },
        3000
    );

}


/* =========================================================
   HTML SAFETY
   ========================================================= */

function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}


function escapeAttribute(
    value
) {

    return escapeHtml(
        value
    );

}