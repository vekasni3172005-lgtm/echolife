/* ==========================================================================
   EchoLife Interactive Timeline Controller

   Database-backed version

   Features:
   - User-specific memories
   - Search
   - Year filter
   - Emotion filter
   - Media type filter
   - Favorite
   - Like
   - Share
   - Edit
   - Delete
   - Memory details modal
   - Photo preview
   - Video preview
   - EchoNarrate
   - Strategy Pattern
   - Browser Text-to-Speech
   ========================================================================== */


/* =========================================================
   GLOBAL STATE
   ========================================================= */

let activeMemories = [];


/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        await loadMemories();

        initFilterControls();

        renderTimeline(
            activeMemories
        );

        checkUrlParams();

        initSpeech();

    }
);


/* =========================================================
   SPEECH INITIALIZATION
   ========================================================= */

function initSpeech() {

    if (
        !("speechSynthesis" in window)
    ) {

        return;

    }


    /*
     * Chrome can load voices asynchronously.
     */

    window.speechSynthesis.getVoices();


    window.speechSynthesis.onvoiceschanged =
        () => {

            window.speechSynthesis.getVoices();

        };

}


/* =========================================================
   LOAD MEMORIES
   ========================================================= */

async function loadMemories() {

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


        activeMemories =
            Array.isArray(
                data.memories
            )
                ? data.memories
                : [];


        /*
         * Normalize the data received from the server.
         */

        activeMemories =
            activeMemories.map(
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
                        "Unknown location",

                    emotion:
                        memory.emotion ||
                        "Serenity",

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

                    people:
                        Array.isArray(
                            memory.people
                        )
                            ? memory.people
                            : [],

                    isFavorite:
                        Boolean(
                            memory.isFavorite
                        ),

                    likes:
                        Number(
                            memory.likes ||
                            0
                        ),

                    privacy:
                        memory.privacy ||
                        "Private",

                    audioNote:
                        memory.audioNote ||
                        ""

                })
            );


    } catch (error) {

        console.error(
            "Timeline loading error:",
            error
        );


        activeMemories = [];


        const container =
            document.getElementById(
                "timelineList"
            );


        if (
            container
        ) {

            container.innerHTML = `

                <div
                    class="text-center py-5 glass-card my-4"
                >

                    <i
                        class="bi bi-exclamation-circle fs-1 text-danger mb-3 d-block"
                    ></i>


                    <h5
                        class="text-white"
                    >

                        Unable to Load Timeline

                    </h5>


                    <p
                        class="text-secondary-custom"
                    >

                        ${escapeHtml(
                            error.message ||
                            "Unable to load your memories."
                        )}

                    </p>


                    <button
                        type="button"
                        class="btn btn-aurora mt-2"
                        onclick="loadMemoriesAndRefresh()"
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
   REFRESH
   ========================================================= */

async function loadMemoriesAndRefresh() {

    await loadMemories();

    initFilterControls();

    renderTimeline(
        activeMemories
    );

}


/* =========================================================
   URL PARAMETERS
   ========================================================= */

function checkUrlParams() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const memoryId =
        params.get(
            "id"
        );


    if (
        memoryId
    ) {

        setTimeout(
            () => {

                openMemoryDetailsModal(
                    memoryId
                );

            },
            400
        );

    }

}


/* =========================================================
   FILTER CONTROLS
   ========================================================= */

function initFilterControls() {

    const yearSelect =
        document.getElementById(
            "filterYear"
        );


    const emotionSelect =
        document.getElementById(
            "filterEmotion"
        );


    const typeSelect =
        document.getElementById(
            "filterType"
        );


    const searchInput =
        document.getElementById(
            "timelineSearch"
        );


    /*
     * -------------------------------------------------------
     * YEARS
     * -------------------------------------------------------
     */

    if (
        yearSelect
    ) {

        const years =
            [
                ...new Set(

                    activeMemories
                        .map(
                            memory => {

                                if (
                                    !memory.date
                                ) {

                                    return "";

                                }


                                return String(
                                    memory.date
                                ).substring(
                                    0,
                                    4
                                );

                            }
                        )
                        .filter(
                            Boolean
                        )

                )
            ]
            .sort(
                (a, b) =>
                    Number(b) -
                    Number(a)
            );


        yearSelect.innerHTML = `

            <option value="all">
                All Years
            </option>

            ${
                years
                    .map(
                        year => `

                            <option
                                value="${escapeAttribute(
                                    year
                                )}"
                            >

                                ${escapeHtml(
                                    year
                                )}

                            </option>

                        `
                    )
                    .join("")
            }

        `;

    }


    /*
     * -------------------------------------------------------
     * APPLY FILTERS
     * -------------------------------------------------------
     */

    const applyFilters =
        () => {

            let filtered =
                [
                    ...activeMemories
                ];


            const selectedYear =
                yearSelect
                    ? yearSelect.value
                    : "all";


            const selectedEmotion =
                emotionSelect
                    ? emotionSelect.value
                    : "all";


            const selectedType =
                typeSelect
                    ? typeSelect.value
                    : "all";


            const query =
                searchInput
                    ? searchInput.value
                        .toLowerCase()
                        .trim()
                    : "";


            /*
             * YEAR
             */

            if (
                selectedYear !==
                "all"
            ) {

                filtered =
                    filtered.filter(
                        memory =>
                            String(
                                memory.date ||
                                ""
                            ).startsWith(
                                selectedYear
                            )
                    );

            }


            /*
             * EMOTION
             */

            if (
                selectedEmotion !==
                "all"
            ) {

                filtered =
                    filtered.filter(
                        memory =>
                            String(
                                memory.emotion ||
                                ""
                            )
                                .toLowerCase() ===
                            String(
                                selectedEmotion
                            )
                                .toLowerCase()
                    );

            }


            /*
             * MEDIA TYPE
             */

            if (
                selectedType !==
                "all"
            ) {

                filtered =
                    filtered.filter(
                        memory =>
                            String(
                                memory.type ||
                                ""
                            )
                                .toLowerCase() ===
                            String(
                                selectedType
                            )
                                .toLowerCase()
                    );

            }


            /*
             * SEARCH
             */

            if (
                query
            ) {

                filtered =
                    filtered.filter(
                        memory => {

                            const title =
                                String(
                                    memory.title ||
                                    ""
                                ).toLowerCase();


                            const description =
                                String(
                                    memory.description ||
                                    ""
                                ).toLowerCase();


                            const location =
                                String(
                                    memory.location ||
                                    ""
                                ).toLowerCase();


                            const emotion =
                                String(
                                    memory.emotion ||
                                    ""
                                ).toLowerCase();


                            const category =
                                String(
                                    memory.category ||
                                    ""
                                ).toLowerCase();


                            const tags =
                                Array.isArray(
                                    memory.tags
                                )
                                    ? memory.tags.map(
                                        tag =>
                                            String(
                                                tag
                                            ).toLowerCase()
                                    )
                                    : [];


                            return (

                                title.includes(
                                    query
                                ) ||

                                description.includes(
                                    query
                                ) ||

                                location.includes(
                                    query
                                ) ||

                                emotion.includes(
                                    query
                                ) ||

                                category.includes(
                                    query
                                ) ||

                                tags.some(
                                    tag =>
                                        tag.includes(
                                            query
                                        )
                                )

                            );

                        }
                    );

            }


            renderTimeline(
                filtered
            );

        };


    /*
     * Avoid duplicate listeners when refreshing.
     */

    if (
        yearSelect
    ) {

        yearSelect.onchange =
            applyFilters;

    }


    if (
        emotionSelect
    ) {

        emotionSelect.onchange =
            applyFilters;

    }


    if (
        typeSelect
    ) {

        typeSelect.onchange =
            applyFilters;

    }


    if (
        searchInput
    ) {

        searchInput.oninput =
            applyFilters;

    }

}


/* =========================================================
   MEDIA HELPERS
   ========================================================= */


/*
 * Return true when the memory is a video.
 */

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


/*
 * Build Timeline media.
 */

function buildTimelineMedia(
    memory
) {

    if (
        !memory.coverImage
    ) {

        return `

            <div
                class="timeline-card-img d-flex align-items-center justify-content-center bg-tertiary"
                style="
                    height:250px;
                "
            >

                <i
                    class="bi bi-image fs-1 text-muted-custom"
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
                class="timeline-card-img"
                controls
                playsinline
                preload="metadata"
                style="
                    width:100%;
                    height:250px;
                    object-fit:cover;
                    background:#000;
                    display:block;
                "
                onclick="event.stopPropagation();"
            >

                <source
                    src="${escapeAttribute(
                        memory.coverImage
                    )}"
                >

                Your browser does not support
                video playback.

            </video>

        `;

    }


    return `

        <img
            src="${escapeAttribute(
                memory.coverImage
            )}"
            class="timeline-card-img"
            alt="${escapeAttribute(
                memory.title
            )}"
            loading="lazy"
            style="
                width:100%;
                height:250px;
                object-fit:cover;
                display:block;
            "
        >

    `;

}


/*
 * Build Modal media.
 */

function buildModalMedia(
    memory
) {

    if (
        !memory.coverImage
    ) {

        return `

            <div
                class="w-100 d-flex align-items-center justify-content-center bg-tertiary"
                style="
                    height:300px;
                "
            >

                <i
                    class="bi bi-image fs-1 text-muted-custom"
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
                class="w-100"
                controls
                playsinline
                preload="metadata"
                style="
                    max-height:450px;
                    min-height:250px;
                    object-fit:contain;
                    background:#000;
                    display:block;
                "
            >

                <source
                    src="${escapeAttribute(
                        memory.coverImage
                    )}"
                >

                Your browser does not support
                video playback.

            </video>

        `;

    }


    return `

        <img
            src="${escapeAttribute(
                memory.coverImage
            )}"
            class="w-100"
            style="
                max-height:450px;
                object-fit:cover;
                display:block;
            "
            alt="${escapeAttribute(
                memory.title
            )}"
        >

    `;

}


/* =========================================================
   RENDER TIMELINE
   ========================================================= */

function renderTimeline(
    memories
) {

    const container =
        document.getElementById(
            "timelineList"
        );


    if (
        !container
    ) {

        return;

    }


    if (
        !memories ||
        memories.length ===
            0
    ) {

        container.innerHTML = `

            <div
                class="text-center py-5 glass-card my-4"
            >

                <i
                    class="bi bi-journal-x fs-1 text-muted-custom mb-3 d-block"
                ></i>


                <h5
                    class="text-white"
                >

                    No Memories Found

                </h5>


                <p
                    class="text-secondary-custom"
                >

                    Try clearing your filters
                    or add a new memory.

                </p>


                <button
                    type="button"
                    class="btn btn-aurora mt-2"
                    onclick="window.location.href='add-memory.html'"
                >

                    <i
                        class="bi bi-plus-circle me-1"
                    ></i>

                    Add Memory

                </button>

            </div>

        `;


        return;

    }


    /*
     * Sort a copy.
     */

    const sortedMemories =
        [
            ...memories
        ]
        .sort(
            (a, b) =>
                new Date(
                    b.date
                ) -
                new Date(
                    a.date
                )
        );


    container.innerHTML =
        sortedMemories
            .map(
                (
                    memory,
                    index
                ) => {

                    const isLeft =
                        index %
                        2 ===
                        0;


                    const emotionClass =
                        String(
                            memory.emotion ||
                            "serenity"
                        )
                            .toLowerCase()
                            .replace(
                                /\s+/g,
                                "-"
                            );


                    const isVideo =
                        isVideoMemory(
                            memory
                        );


                    return `

                        <div
                            class="timeline-item ${
                                isLeft
                                    ? "left"
                                    : "right"
                            }"
                            data-aos="${
                                isLeft
                                    ? "fade-right"
                                    : "fade-left"
                            }"
                        >

                            <div
                                class="timeline-dot"
                            ></div>


                            <div
                                class="glass-card glass-card-hover timeline-card rounded-4 p-0"
                            >


                                <!-- =================================================
                                     MEDIA
                                     ================================================= -->

                                <div
                                    class="position-relative"
                                >

                                    ${buildTimelineMedia(
                                        memory
                                    )}


                                    <!-- MEDIA TYPE -->

                                    <span
                                        class="position-absolute top-0 start-50 translate-middle-x mt-3 badge bg-dark bg-opacity-75 text-white"
                                    >

                                        <i
                                            class="bi ${
                                                isVideo
                                                    ? "bi-camera-video-fill"
                                                    : "bi-image-fill"
                                            } me-1"
                                        ></i>

                                        ${
                                            isVideo
                                                ? "Video"
                                                : "Photo"
                                        }

                                    </span>


                                    <!-- EMOTION -->

                                    <span
                                        class="position-absolute top-0 end-0 m-3 badge-emotion badge-${escapeAttribute(
                                            emotionClass
                                        )}"
                                    >

                                        ${escapeHtml(
                                            memory.emotion
                                        )}

                                    </span>


                                    <!-- FAVORITE -->

                                    <button
                                        type="button"
                                        class="btn btn-sm btn-icon position-absolute bottom-0 start-0 m-3 glass-card"
                                        title="${
                                            memory.isFavorite
                                                ? "Remove from favorites"
                                                : "Add to favorites"
                                        }"
                                        onclick="event.stopPropagation(); toggleFavorite('${escapeAttribute(
                                            memory.id
                                        )}', this)"
                                    >

                                        <i
                                            class="bi ${
                                                memory.isFavorite
                                                    ? "bi-star-fill text-warning"
                                                    : "bi-star"
                                            }"
                                        ></i>

                                    </button>

                                </div>



                                <!-- =================================================
                                     CONTENT
                                     ================================================= -->

                                <div
                                    class="p-4"
                                >


                                    <!-- DATE + LOCATION -->

                                    <div
                                        class="d-flex align-items-center justify-content-between text-muted-custom small mb-2 flex-wrap gap-2"
                                    >

                                        <span>

                                            <i
                                                class="bi bi-calendar3 me-1 text-gradient"
                                            ></i>

                                            ${escapeHtml(
                                                memory.date
                                            )}

                                        </span>


                                        <span>

                                            <i
                                                class="bi bi-geo-alt me-1 text-gradient"
                                            ></i>

                                            ${escapeHtml(
                                                memory.location
                                            )}

                                        </span>

                                    </div>



                                    <!-- TITLE -->

                                    <h5
                                        class="text-white font-heading mb-2"
                                    >

                                        ${escapeHtml(
                                            memory.title
                                        )}

                                    </h5>



                                    <!-- DESCRIPTION -->

                                    <p
                                        class="text-secondary-custom small mb-3"
                                        style="
                                            display:-webkit-box;
                                            -webkit-line-clamp:3;
                                            -webkit-box-orient:vertical;
                                            overflow:hidden;
                                        "
                                    >

                                        ${escapeHtml(
                                            memory.description
                                        )}

                                    </p>



                                    <!-- TAGS -->

                                    <div
                                        class="d-flex flex-wrap gap-1 mb-3"
                                    >

                                        ${
                                            memory.tags
                                                .map(
                                                    tag => `

                                                        <span
                                                            class="badge bg-secondary bg-opacity-20 text-secondary-custom rounded-pill"
                                                        >

                                                            #${escapeHtml(
                                                                tag
                                                            )}

                                                        </span>

                                                    `
                                                )
                                                .join("")
                                        }

                                    </div>



                                    <!-- AUDIO NOTE -->

                                    ${
                                        memory.audioNote
                                            ? `

                                                <div
                                                    class="p-2 rounded-3 bg-tertiary d-flex align-items-center gap-2 mb-3 border border-glass"
                                                >

                                                    <i
                                                        class="bi bi-mic-fill text-accent"
                                                    ></i>


                                                    <span
                                                        class="small text-white text-truncate"
                                                    >

                                                        ${escapeHtml(
                                                            memory.audioNote
                                                        )}

                                                    </span>

                                                </div>

                                            `
                                            : ""
                                    }



                                    <!-- ACTIONS -->

                                    <div
                                        class="d-flex align-items-center justify-content-between border-top border-glass pt-3 mt-2"
                                    >


                                        <!-- LEFT ACTIONS -->

                                        <div
                                            class="d-flex align-items-center gap-2"
                                        >

                                            <!-- LIKE -->

                                            <button
                                                type="button"
                                                class="btn btn-sm btn-glass px-3 py-1"
                                                onclick="event.stopPropagation(); handleLike('${escapeAttribute(
                                                    memory.id
                                                )}', this)"
                                            >

                                                <i
                                                    class="bi bi-heart-fill text-danger me-1"
                                                ></i>


                                                <span
                                                    class="like-count"
                                                >

                                                    ${Number(
                                                        memory.likes ||
                                                        0
                                                    )}

                                                </span>

                                            </button>


                                            <!-- SHARE -->

                                            <button
                                                type="button"
                                                class="btn btn-sm btn-icon"
                                                title="Share"
                                                onclick="event.stopPropagation(); handleShare('${escapeAttribute(
                                                    memory.id
                                                )}')"
                                            >

                                                <i
                                                    class="bi bi-share"
                                                ></i>

                                            </button>

                                        </div>



                                        <!-- RIGHT ACTIONS -->

                                        <div
                                            class="d-flex align-items-center gap-2"
                                        >

                                            <!-- EDIT -->

                                            <button
                                                type="button"
                                                class="btn btn-sm btn-icon"
                                                title="Edit"
                                                onclick="event.stopPropagation(); handleEdit('${escapeAttribute(
                                                    memory.id
                                                )}')"
                                            >

                                                <i
                                                    class="bi bi-pencil"
                                                ></i>

                                            </button>


                                            <!-- DELETE -->

                                            <button
                                                type="button"
                                                class="btn btn-sm btn-icon text-danger"
                                                title="Delete"
                                                onclick="event.stopPropagation(); handleDelete('${escapeAttribute(
                                                    memory.id
                                                )}')"
                                            >

                                                <i
                                                    class="bi bi-trash"
                                                ></i>

                                            </button>


                                            <!-- VIEW -->

                                            <button
                                                type="button"
                                                class="btn btn-sm btn-aurora py-1 px-3"
                                                onclick="openMemoryDetailsModal('${escapeAttribute(
                                                    memory.id
                                                )}')"
                                            >

                                                View

                                            </button>

                                        </div>


                                    </div>


                                </div>


                            </div>


                        </div>

                    `;

                }
            )
            .join("");


    /*
     * Refresh AOS if available.
     */

    if (
        typeof AOS !==
        "undefined"
    ) {

        AOS.refresh();

    }

}


/* =========================================================
   FAVORITE
   ========================================================= */

async function toggleFavorite(
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
                )}/favorite`,
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
                "Unable to update favorite."
            );

        }


        const memory =
            activeMemories.find(
                item =>
                    String(
                        item.id
                    ) ===
                    String(id)
            );


        if (
            memory
        ) {

            memory.isFavorite =
                Boolean(
                    data.isFavorite
                );

        }


        const icon =
            button.querySelector(
                "i"
            );


        if (
            icon
        ) {

            icon.className =
                data.isFavorite
                    ? "bi bi-star-fill text-warning"
                    : "bi bi-star";

        }


        button.title =
            data.isFavorite
                ? "Remove from favorites"
                : "Add to favorites";


        showToast(
            "Favorite Updated",
            data.message ||
            "Favorite updated successfully.",
            data.isFavorite
                ? "success"
                : "info"
        );


    } catch (error) {

        console.error(
            "Favorite error:",
            error
        );


        showToast(
            "Favorite Failed",
            error.message ||
            "Unable to update favorite.",
            "danger"
        );


    } finally {

        button.disabled =
            false;

    }

}


/* =========================================================
   LIKE
   ========================================================= */

async function handleLike(
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
            activeMemories.find(
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


        const count =
            button.querySelector(
                ".like-count"
            );


        if (
            count
        ) {

            count.textContent =
                Number(
                    data.likes ||
                    0
                );

        }


        button.classList.add(
            "animated-pulse"
        );


        setTimeout(
            () => {

                button.classList.remove(
                    "animated-pulse"
                );

            },
            800
        );


    } catch (error) {

        console.error(
            "Like error:",
            error
        );


        showToast(
            "Like Failed",
            error.message ||
            "Unable to update likes.",
            "danger"
        );


    } finally {

        button.disabled =
            false;

    }

}


/* =========================================================
   SHARE
   ========================================================= */

async function handleShare(
    id
) {

    const url =
        `${window.location.origin}/timeline.html?id=${encodeURIComponent(
            id
        )}`;


    try {

        if (
            navigator.clipboard
        ) {

            await navigator.clipboard.writeText(
                url
            );


            showToast(
                "Link Copied",
                "Memory link copied to your clipboard.",
                "success"
            );

        } else {

            showToast(
                "Share Link",
                url,
                "info"
            );

        }

    } catch (error) {

        console.error(
            "Share error:",
            error
        );


        showToast(
            "Share Link",
            url,
            "info"
        );

    }

}


/* =========================================================
   DELETE
   ========================================================= */

async function handleDelete(
    id
) {

    const confirmed =
        window.confirm(
            "Are you sure you want to delete this memory?"
        );


    if (
        !confirmed
    ) {

        return;

    }


    try {

        const response =
            await fetch(
                `/api/memories/${encodeURIComponent(
                    id
                )}`,
                {

                    method:
                        "DELETE",

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
                "Unable to delete memory."
            );

        }


        activeMemories =
            activeMemories.filter(
                memory =>
                    String(
                        memory.id
                    ) !==
                    String(id)
            );


        renderTimeline(
            activeMemories
        );


        showToast(
            "Memory Deleted",
            data.message ||
            "Memory deleted successfully.",
            "warning"
        );


    } catch (error) {

        console.error(
            "Delete error:",
            error
        );


        showToast(
            "Delete Failed",
            error.message ||
            "Unable to delete memory.",
            "danger"
        );

    }

}


/* =========================================================
   EDIT
   ========================================================= */

function handleEdit(
    id
) {

    window.location.href =
        `add-memory.html?edit=${encodeURIComponent(
            id
        )}`;

}


/* =========================================================
   ECHONARRATE
   STRATEGY PATTERN
   ========================================================= */


/*
 * ---------------------------------------------------------
 * Strategy Interface
 * ---------------------------------------------------------
 */

class NarrationStrategy {

    narrate(
        memory
    ) {

        throw new Error(
            "narrate() must be implemented."
        );

    }

}


/*
 * ---------------------------------------------------------
 * Personal Strategy
 * ---------------------------------------------------------
 */

class PersonalNarration
    extends NarrationStrategy {

    narrate(
        memory
    ) {

        return `

            I remember ${memory.title}.
            It happened on ${memory.date}
            in ${memory.location || "a special place"}.
            It was a ${memory.emotion || "meaningful"}
            moment for me.
            ${memory.description || ""}

        `
            .replace(
                /\s+/g,
                " "
            )
            .trim();

    }

}


/*
 * ---------------------------------------------------------
 * Emotional Strategy
 * ---------------------------------------------------------
 */

class EmotionalNarration
    extends NarrationStrategy {

    narrate(
        memory
    ) {

        return `

            Some moments stay with us forever.
            ${memory.title} was one of those moments.
            On ${memory.date}, in
            ${memory.location || "a special place"},
            this memory captured a feeling of
            ${memory.emotion || "emotion"}.
            ${memory.description || ""}

        `
            .replace(
                /\s+/g,
                " "
            )
            .trim();

    }

}


/*
 * ---------------------------------------------------------
 * Documentary Strategy
 * ---------------------------------------------------------
 */

class DocumentaryNarration
    extends NarrationStrategy {

    narrate(
        memory
    ) {

        return `

            On ${memory.date},
            the memory "${memory.title}"
            was recorded at
            ${memory.location || "an unspecified location"}.
            The associated emotion was
            ${memory.emotion || "not specified"}.
            The recorded description states:
            ${memory.description || "No description was provided."}

        `
            .replace(
                /\s+/g,
                " "
            )
            .trim();

    }

}


/*
 * ---------------------------------------------------------
 * Storytelling Strategy
 * ---------------------------------------------------------
 */

class StorytellingNarration
    extends NarrationStrategy {

    narrate(
        memory
    ) {

        return `

            It began with a moment at
            ${memory.location || "a special place"}.
            On ${memory.date},
            ${memory.title}
            became a story worth remembering.
            The feeling of
            ${memory.emotion || "a powerful emotion"}
            became part of that story.
            ${memory.description || ""}

        `
            .replace(
                /\s+/g,
                " "
            )
            .trim();

    }

}


/*
 * ---------------------------------------------------------
 * Context
 * ---------------------------------------------------------
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
 * ---------------------------------------------------------
 * Strategy Factory
 * ---------------------------------------------------------
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
   GENERATE NARRATION
   ========================================================= */

function generateTimelineNarration(
    id
) {

    const memory =
        activeMemories.find(
            item =>
                String(
                    item.id
                ) ===
                String(id)
        );


    if (
        !memory
    ) {

        showToast(
            "Memory Not Found",
            "Unable to generate narration.",
            "danger"
        );


        return "";

    }


    const styleSelect =
        document.getElementById(
            `timelineNarrationStyle-${id}`
        );


    const result =
        document.getElementById(
            `timelineNarrationResult-${id}`
        );


    const playButton =
        document.getElementById(
            `timelinePlayNarration-${id}`
        );


    const style =
        styleSelect
            ? styleSelect.value
            : "personal";


    /*
     * Create selected Strategy.
     */

    const strategy =
        createNarrationStrategy(
            style
        );


    /*
     * Give Strategy to Context.
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


    if (
        result
    ) {

        result.textContent =
            narration;

    }


    if (
        playButton
    ) {

        playButton.disabled =
            false;

    }


    showToast(
        "Story Generated",
        `${formatNarrationStyle(
            style
        )} narration generated.`,
        "success"
    );


    return narration;

}


/* =========================================================
   PLAY NARRATION
   ========================================================= */

function playTimelineNarration(
    id
) {

    if (
        !(
            "speechSynthesis"
            in window
        ) ||
        !(
            "SpeechSynthesisUtterance"
            in window
        )
    ) {

        showToast(
            "Not Supported",
            "Your browser does not support text-to-speech.",
            "danger"
        );


        return;

    }


    const result =
        document.getElementById(
            `timelineNarrationResult-${id}`
        );


    if (
        !result
    ) {

        showToast(
            "Narration Error",
            "Narration area was not found.",
            "danger"
        );


        return;

    }


    const text =
        result.textContent.trim();


    if (
        !text ||
        text.includes(
            "Choose a narration style"
        )
    ) {

        showToast(
            "No Narration",
            "Click Generate Story first.",
            "warning"
        );


        return;

    }


    /*
     * Stop anything already speaking.
     */

    window.speechSynthesis.cancel();


    const speech =
        new SpeechSynthesisUtterance(
            text
        );


    speech.lang =
        "en-US";


    speech.rate =
        0.9;


    speech.pitch =
        1;


    speech.volume =
        1;


    /*
     * Select a voice.
     */

    const voices =
        window.speechSynthesis.getVoices();


    if (
        voices.length >
        0
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
            `timelinePlayNarration-${id}`
        );


    if (
        playButton
    ) {

        playButton.disabled =
            true;


        playButton.innerHTML = `

            <i
                class="bi bi-pause-circle me-1"
            ></i>

            Playing...

        `;

    }


    speech.onstart =
        () => {

            showToast(
                "EchoNarrate",
                "Narration started.",
                "success"
            );

        };


    speech.onend =
        () => {

            resetTimelineNarrationButton(
                id
            );

        };


    speech.onerror =
        error => {

            console.error(
                "Speech error:",
                error
            );


            resetTimelineNarrationButton(
                id
            );


            showToast(
                "Narration Error",
                "Unable to play narration.",
                "danger"
            );

        };


    window.speechSynthesis.speak(
        speech
    );

}


/* =========================================================
   RESET PLAY BUTTON
   ========================================================= */

function resetTimelineNarrationButton(
    id
) {

    const button =
        document.getElementById(
            `timelinePlayNarration-${id}`
        );


    if (
        !button
    ) {

        return;

    }


    button.disabled =
        false;


    button.innerHTML = `

        <i
            class="bi bi-volume-up me-1"
        ></i>

        Play Narration

    `;

}


/* =========================================================
   STOP NARRATION
   ========================================================= */

function stopTimelineNarration() {

    if (
        "speechSynthesis"
        in window
    ) {

        window.speechSynthesis.cancel();

    }


    document
        .querySelectorAll(
            '[id^="timelinePlayNarration-"]'
        )
        .forEach(
            button => {

                button.disabled =
                    false;


                button.innerHTML = `

                    <i
                        class="bi bi-volume-up me-1"
                    ></i>

                    Play Narration

                `;

            }
        );

}


/* =========================================================
   NARRATION STYLE LABEL
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
   MEMORY DETAILS MODAL
   ========================================================= */

function openMemoryDetailsModal(
    id
) {

    const memory =
        activeMemories.find(
            item =>
                String(
                    item.id
                ) ===
                String(id)
        );


    if (
        !memory
    ) {

        showToast(
            "Memory Not Found",
            "Unable to open this memory.",
            "danger"
        );


        return;

    }


    let modalEl =
        document.getElementById(
            "memoryDetailsModal"
        );


    /*
     * Create modal if it doesn't exist.
     */

    if (
        !modalEl
    ) {

        document.body.insertAdjacentHTML(
            "beforeend",
            `

                <div
                    class="modal fade"
                    id="memoryDetailsModal"
                    tabindex="-1"
                    aria-hidden="true"
                >

                    <div
                        class="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable"
                        style="
                            max-height:95vh;
                        "
                    >

                        <div
                            class="modal-content glass-modal p-0"
                            style="
                                max-height:95vh;
                                overflow:hidden;
                            "
                        >

                            <div
                                id="memoryDetailsBody"
                                style="
                                    max-height:95vh;
                                    overflow-y:auto;
                                    overflow-x:hidden;
                                "
                            ></div>

                        </div>

                    </div>

                </div>

            `
        );


        modalEl =
            document.getElementById(
                "memoryDetailsModal"
            );

    }


    const detailsBody =
        document.getElementById(
            "memoryDetailsBody"
        );


    if (
        !detailsBody
    ) {

        return;

    }


    /*
     * Stop previous narration.
     */

    stopTimelineNarration();


    const emotionClass =
        String(
            memory.emotion ||
            "serenity"
        )
            .toLowerCase()
            .replace(
                /\s+/g,
                "-"
            );


    const isVideo =
        isVideoMemory(
            memory
        );


    detailsBody.innerHTML = `

        <!-- =================================================
             MEDIA
             ================================================= -->

        <div
            class="position-relative"
        >

            ${buildModalMedia(
                memory
            )}


            <!-- CLOSE BUTTON -->

            <button
                type="button"
                class="btn-close btn-close-white position-absolute top-0 end-0 m-3 p-2 bg-dark rounded-circle"
                data-bs-dismiss="modal"
                aria-label="Close"
                onclick="stopTimelineNarration()"
            ></button>


            <!-- MEDIA TYPE -->

            <span
                class="position-absolute top-0 start-0 m-3 badge bg-dark bg-opacity-75 text-white"
            >

                <i
                    class="bi ${
                        isVideo
                            ? "bi-camera-video-fill"
                            : "bi-image-fill"
                    } me-1"
                ></i>

                ${
                    isVideo
                        ? "Video"
                        : "Photo"
                }

            </span>


            <!-- EMOTION -->

            <span
                class="position-absolute bottom-0 start-0 m-3 badge-emotion badge-${escapeAttribute(
                    emotionClass
                )}"
            >

                ${escapeHtml(
                    memory.emotion
                )}

            </span>

        </div>



        <!-- =================================================
             BODY
             ================================================= -->

        <div
            class="p-4"
        >


            <!-- META -->

            <div
                class="d-flex align-items-center justify-content-between text-muted-custom small mb-3 flex-wrap gap-2"
            >

                <span>

                    <i
                        class="bi bi-calendar3 me-1 text-gradient"
                    ></i>

                    ${escapeHtml(
                        memory.date
                    )}

                </span>


                <span>

                    <i
                        class="bi bi-geo-alt me-1 text-gradient"
                    ></i>

                    ${escapeHtml(
                        memory.location
                    )}

                </span>


                <span>

                    <i
                        class="bi bi-lock me-1"
                    ></i>

                    ${escapeHtml(
                        memory.privacy
                    )}

                </span>

            </div>



            <!-- TITLE -->

            <h3
                class="text-white font-heading mb-3"
            >

                ${escapeHtml(
                    memory.title
                )}

            </h3>



            <!-- ORIGINAL STORY -->

            <div
                class="mb-4"
            >

                <h6
                    class="text-white mb-2"
                >

                    <i
                        class="bi bi-journal-text me-2 text-gradient"
                    ></i>

                    Original Memory Story

                </h6>


                <p
                    class="text-secondary-custom fs-6 mb-0"
                >

                    ${escapeHtml(
                        memory.description
                    )}

                </p>

            </div>



            <!-- =================================================
                 PEOPLE + TAGS
                 ================================================= -->

            <div
                class="row g-3 mb-4"
            >


                <!-- PEOPLE -->

                <div
                    class="col-md-6"
                >

                    <div
                        class="p-3 glass-card rounded-3 h-100"
                    >

                        <h6
                            class="text-white mb-2"
                        >

                            <i
                                class="bi bi-people me-2 text-gradient"
                            ></i>

                            Tagged People

                        </h6>


                        <div
                            class="d-flex flex-wrap gap-1"
                        >

                            ${
                                memory.people.length
                                    ? memory.people
                                        .map(
                                            person => `

                                                <span
                                                    class="badge bg-primary bg-opacity-20 text-white"
                                                >

                                                    ${escapeHtml(
                                                        person
                                                    )}

                                                </span>

                                            `
                                        )
                                        .join("")

                                    :

                                    `
                                        <span
                                            class="text-secondary-custom small"
                                        >
                                            None
                                        </span>
                                    `
                            }

                        </div>

                    </div>

                </div>



                <!-- CATEGORY + TAGS -->

                <div
                    class="col-md-6"
                >

                    <div
                        class="p-3 glass-card rounded-3 h-100"
                    >

                        <h6
                            class="text-white mb-2"
                        >

                            <i
                                class="bi bi-tags me-2 text-gradient"
                            ></i>

                            Category & Tags

                        </h6>


                        <div
                            class="d-flex flex-wrap gap-1"
                        >

                            ${
                                memory.category
                                    ? `

                                        <span
                                            class="badge bg-danger bg-opacity-20 text-danger"
                                        >

                                            ${escapeHtml(
                                                memory.category
                                            )}

                                        </span>

                                    `
                                    : ""
                            }


                            ${
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

                                    :

                                    `
                                        <span
                                            class="text-secondary-custom small"
                                        >
                                            No tags
                                        </span>
                                    `
                            }

                        </div>

                    </div>

                </div>


            </div>



            <!-- =================================================
                 ECHONARRATE
                 ================================================= -->

            <div
                class="glass-card p-4 rounded-4 mb-4 border border-glass"
                style="
                    background:rgba(255,255,255,0.04);
                "
            >


                <!-- HEADER -->

                <div
                    class="d-flex align-items-center gap-3 mb-3"
                >

                    <div
                        class="d-flex align-items-center justify-content-center rounded-3 border border-primary"
                        style="
                            width:52px;
                            height:52px;
                            flex-shrink:0;
                        "
                    >

                        <i
                            class="bi bi-mic-fill text-primary fs-4"
                        ></i>

                    </div>


                    <div>

                        <h5
                            class="text-white font-heading mb-1"
                        >

                            EchoNarrate

                        </h5>


                        <p
                            class="text-secondary-custom small mb-0"
                        >

                            Turn this memory into a narrated story.

                        </p>

                    </div>

                </div>



                <!-- NARRATION STYLE -->

                <label
                    for="timelineNarrationStyle-${escapeAttribute(
                        id
                    )}"
                    class="form-label text-white small"
                >

                    Narration Style

                </label>


                <select
                    id="timelineNarrationStyle-${escapeAttribute(
                        id
                    )}"
                    class="form-select form-control-custom mb-3"
                >

                    <option value="personal">
                        Personal
                    </option>

                    <option value="emotional">
                        Emotional
                    </option>

                    <option value="documentary">
                        Documentary
                    </option>

                    <option value="storytelling">
                        Storytelling
                    </option>

                </select>



                <!-- BUTTONS -->

                <div
                    class="d-flex gap-2 flex-wrap"
                >

                    <button
                        type="button"
                        class="btn btn-aurora"
                        onclick="generateTimelineNarration('${escapeAttribute(
                            id
                        )}')"
                    >

                        <i
                            class="bi bi-stars me-1"
                        ></i>

                        Generate Story

                    </button>


                    <button
                        type="button"
                        id="timelinePlayNarration-${escapeAttribute(
                            id
                        )}"
                        class="btn btn-glass"
                        onclick="playTimelineNarration('${escapeAttribute(
                            id
                        )}')"
                        disabled
                    >

                        <i
                            class="bi bi-volume-up me-1"
                        ></i>

                        Play Narration

                    </button>


                    <button
                        type="button"
                        class="btn btn-glass"
                        onclick="stopTimelineNarration()"
                    >

                        <i
                            class="bi bi-stop-circle me-1"
                        ></i>

                        Stop

                    </button>

                </div>



                <!-- RESULT -->

                <div
                    id="timelineNarrationResult-${escapeAttribute(
                        id
                    )}"
                    class="glass-card p-3 mt-3"
                    style="
                        min-height:110px;
                        line-height:1.7;
                        white-space:normal;
                    "
                    aria-live="polite"
                >

                    <span
                        class="text-secondary-custom small"
                    >

                        Choose a narration style and click
                        <strong
                            class="text-white"
                        >
                            Generate Story
                        </strong>
                        to create the narration.

                    </span>

                </div>


                <small
                    class="text-muted-custom d-block mt-2"
                >

                    The narration is created from the
                    information stored in this memory.

                </small>

            </div>



            <!-- =================================================
                 FOOTER
                 ================================================= -->

            <div
                class="d-flex align-items-center justify-content-between border-top border-glass pt-3"
            >

                <span
                    class="small text-muted-custom"
                >

                    <i
                        class="bi bi-heart-fill text-danger me-1"
                    ></i>

                    ${Number(
                        memory.likes ||
                        0
                    )}

                    Likes

                </span>


                <button
                    type="button"
                    class="btn btn-aurora"
                    data-bs-dismiss="modal"
                    onclick="stopTimelineNarration()"
                >

                    Close Memory

                </button>

            </div>


        </div>

    `;


    /*
     * Bootstrap modal.
     */

    const bsModal =
        bootstrap.Modal.getOrCreateInstance(
            modalEl
        );


    bsModal.show();

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
            "memoryDetailsModal"
        ) {

            const videos =
                event.target.querySelectorAll(
                    "video"
                );


            videos.forEach(
                video => {

                    video.pause();

                    video.currentTime =
                        0;

                }
            );


            stopTimelineNarration();

        }

    }
);


/* =========================================================
   TOAST
   ========================================================= */

function showToast(
    title,
    message,
    type = "info"
) {

    /*
     * Use application-level Toast if it already exists.
     */

    if (
        window.showToast &&
        window.showToast !==
            showToast
    ) {

        window.showToast(
            title,
            message,
            type
        );

        return;

    }


    let container =
        document.querySelector(
            ".echolife-toast-container"
        );


    if (
        !container
    ) {

        container =
            document.createElement(
                "div"
            );


        container.className =
            "echolife-toast-container";


        container.style.position =
            "fixed";


        container.style.right =
            "20px";


        container.style.bottom =
            "20px";


        container.style.zIndex =
            "99999";


        container.style.width =
            "320px";


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


    toast.style.border =
        "1px solid rgba(255,255,255,0.15)";


    toast.innerHTML = `

        <div
            class="d-flex align-items-start gap-2"
        >

            <i
                class="bi bi-info-circle-fill text-primary fs-5"
            ></i>


            <div>

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
                        message
                    )}

                </span>

            </div>

        </div>

    `;


    container.appendChild(
        toast
    );


    setTimeout(
        () => {

            toast.remove();

        },
        3500
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
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
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