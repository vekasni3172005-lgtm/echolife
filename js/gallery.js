/* ==========================================================================
   EchoLife User Gallery Controller
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


        if (response.status === 401) {

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
            Array.isArray(data.memories)
                ? data.memories
                : [];


        renderGallery("all");


    } catch (error) {

        console.error(
            "Gallery loading error:",
            error
        );


        const container =
            document.getElementById(
                "galleryMasonryGrid"
            );


        if (container) {

            container.innerHTML = `

                <div
                    class="col-12 text-center py-5 glass-card">

                    <i
                        class="bi bi-exclamation-circle fs-1 text-danger mb-3 d-block">
                    </i>

                    <h5 class="text-white">
                        Unable to Load Gallery
                    </h5>

                    <p class="text-secondary-custom">
                        ${escapeHtml(
                            error.message ||
                            "Please try again."
                        )}
                    </p>

                    <button
                        class="btn btn-aurora mt-2"
                        onclick="loadGalleryMemories()">

                        <i
                            class="bi bi-arrow-clockwise me-1">
                        </i>

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
                        category || "all"
                    );

                }
            );

        }
    );

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


    if (!container) {
        return;
    }


    let filtered =
        [...galleryMemories];


    /* ---------------------------------------------
       Category filter
       --------------------------------------------- */

    if (category !== "all") {

        filtered =
            filtered.filter(
                memory =>
                    String(
                        memory.category || ""
                    ).toLowerCase() ===
                    category.toLowerCase()
            );

    }


    /* ---------------------------------------------
       Only display memories that have images
       --------------------------------------------- */

    filtered =
        filtered.filter(
            memory =>
                memory.coverImage
        );


    /* ---------------------------------------------
       Empty gallery
       --------------------------------------------- */

    if (!filtered.length) {

        container.innerHTML = `

            <div
                class="col-12 text-center py-5 glass-card">

                <i
                    class="bi bi-images fs-1 text-muted-custom mb-3 d-block">
                </i>

                <h5 class="text-white">
                    No Photos or Videos Found
                </h5>

                <p class="text-secondary-custom">
                    ${
                        galleryMemories.length === 0
                            ? "Your personal gallery is empty."
                            : "No media matches this album category."
                    }
                </p>

                <a
                    href="add-memory.html"
                    class="btn btn-aurora">

                    <i
                        class="bi bi-cloud-arrow-up me-1">
                    </i>

                    Upload Media

                </a>

            </div>

        `;

        return;

    }


    /* ---------------------------------------------
       Render masonry
       --------------------------------------------- */

    container.innerHTML =
        filtered
            .map(
                memory => `

                    <div
                        class="masonry-item"
                        onclick="openLightbox(${memory.id})">

                        <img
                            src="${escapeHtml(
                                memory.coverImage
                            )}"
                            class="masonry-img"
                            alt="${escapeHtml(
                                memory.title
                            )}"
                            loading="lazy"
                        >


                        <div
                            class="masonry-overlay">

                            <span
                                class="badge-emotion badge-${escapeHtml(
                                    String(
                                        memory.emotion || "Memory"
                                    ).toLowerCase()
                                )} align-self-start mb-2">

                                ${escapeHtml(
                                    memory.emotion || "Memory"
                                )}

                            </span>


                            <h6
                                class="text-white mb-1 font-heading">

                                ${escapeHtml(
                                    memory.title || ""
                                )}

                            </h6>


                            <div
                                class="d-flex justify-content-between align-items-center small text-secondary-custom">

                                <span>

                                    <i
                                        class="bi bi-geo-alt me-1">
                                    </i>

                                    ${escapeHtml(
                                        memory.location || ""
                                    )}

                                </span>


                                <span>

                                    <i
                                        class="bi bi-heart-fill text-danger me-1">
                                    </i>

                                    ${Number(
                                        memory.likes || 0
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
                String(item.id) ===
                String(id)
        );


    if (!memory) {
        return;
    }


    let modalEl =
        document.getElementById(
            "galleryLightboxModal"
        );


    /* ---------------------------------------------
       Create modal once
       --------------------------------------------- */

    if (!modalEl) {

        const modalHTML = `

            <div
                class="modal fade"
                id="galleryLightboxModal"
                tabindex="-1">

                <div
                    class="modal-dialog modal-dialog-centered modal-xl">

                    <div
                        class="modal-content glass-modal p-0 overflow-hidden">

                        <div
                            class="row g-0">


                            <!-- Image -->
                            <div
                                class="col-lg-8 bg-black d-flex align-items-center justify-content-center p-2 position-relative"
                                style="min-height:450px;">

                                <img
                                    id="lightboxImg"
                                    src=""
                                    class="img-fluid rounded-3"
                                    style="max-height:80vh;object-fit:contain;"
                                >


                                <button
                                    type="button"
                                    class="btn-close btn-close-white position-absolute top-0 start-0 m-3 p-2 bg-dark rounded-circle"
                                    data-bs-dismiss="modal">
                                </button>

                            </div>


                            <!-- Details -->
                            <div
                                class="col-lg-4 p-4 d-flex flex-column justify-content-between">

                                <div>

                                    <div
                                        class="d-flex align-items-center justify-content-between mb-3">

                                        <span
                                            id="lightboxEmotion"
                                            class="badge-emotion">
                                        </span>


                                        <span
                                            id="lightboxDate"
                                            class="small text-muted-custom">
                                        </span>

                                    </div>


                                    <h4
                                        id="lightboxTitle"
                                        class="text-white font-heading mb-2">
                                    </h4>


                                    <p
                                        id="lightboxLocation"
                                        class="text-secondary-custom small mb-3">

                                        <i
                                            class="bi bi-geo-alt me-1 text-gradient">
                                        </i>

                                    </p>


                                    <p
                                        id="lightboxDesc"
                                        class="text-secondary-custom small leading-relaxed mb-4">
                                    </p>


                                    <div
                                        class="mb-3">

                                        <h6
                                            class="text-white small mb-2">

                                            Tags

                                        </h6>


                                        <div
                                            id="lightboxTags"
                                            class="d-flex flex-wrap gap-1">
                                        </div>

                                    </div>

                                </div>


                                <div
                                    class="d-flex align-items-center justify-content-between border-top border-glass pt-3">

                                    <button
                                        id="lightboxLikeBtn"
                                        class="btn btn-glass btn-sm"
                                        type="button">

                                        <i
                                            class="bi bi-heart-fill text-danger me-1">
                                        </i>

                                        Liked

                                    </button>


                                    <a
                                        id="lightboxDetailBtn"
                                        href=""
                                        class="btn btn-aurora btn-sm">

                                        Full Memory Details

                                        <i
                                            class="bi bi-arrow-right">
                                        </i>

                                    </a>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>

            </div>

        `;


        document.body.insertAdjacentHTML(
            "beforeend",
            modalHTML
        );


        modalEl =
            document.getElementById(
                "galleryLightboxModal"
            );

    }


    /* ---------------------------------------------
       Fill modal
       --------------------------------------------- */

    const lightboxImg =
        document.getElementById(
            "lightboxImg"
        );


    const lightboxEmotion =
        document.getElementById(
            "lightboxEmotion"
        );


    const lightboxDate =
        document.getElementById(
            "lightboxDate"
        );


    const lightboxTitle =
        document.getElementById(
            "lightboxTitle"
        );


    const lightboxLocation =
        document.getElementById(
            "lightboxLocation"
        );


    const lightboxDesc =
        document.getElementById(
            "lightboxDesc"
        );


    const lightboxTags =
        document.getElementById(
            "lightboxTags"
        );


    const lightboxDetailBtn =
        document.getElementById(
            "lightboxDetailBtn"
        );


    lightboxImg.src =
        memory.coverImage;


    lightboxImg.alt =
        memory.title || "Memory";


    lightboxEmotion.textContent =
        memory.emotion || "Memory";


    lightboxEmotion.className =
        `badge-emotion badge-${String(
            memory.emotion || "Memory"
        ).toLowerCase()}`;


    lightboxDate.textContent =
        memory.date || "";


    lightboxTitle.textContent =
        memory.title || "";


    lightboxLocation.innerHTML =
        `
        <i
            class="bi bi-geo-alt me-1 text-gradient">
        </i>

        ${escapeHtml(
            memory.location || ""
        )}
        `;


    lightboxDesc.textContent =
        memory.description || "";


    const tags =
        Array.isArray(
            memory.tags
        )
            ? memory.tags
            : [];


    lightboxTags.innerHTML =
        tags.length
            ? tags
                .map(
                    tag =>
                        `
                        <span
                            class="badge bg-secondary text-secondary-custom">

                            #${escapeHtml(
                                tag
                            )}

                        </span>
                        `
                )
                .join("")
            : `
                <span
                    class="small text-muted-custom">

                    No tags

                </span>
            `;


    lightboxDetailBtn.href =
        `memory-details.html?id=${memory.id}`;


    /* ---------------------------------------------
       Open
       --------------------------------------------- */

    const modal =
        new bootstrap.Modal(
            modalEl
        );


    modal.show();

}


/* =========================================================
   ESCAPE HTML
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