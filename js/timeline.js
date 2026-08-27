/* ==========================================================================
   EchoLife Interactive Timeline Controller
   Database-backed version
   ========================================================================== */


let activeMemories = [];


/* =========================================================
   INITIALIZE
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

    }
);


/* =========================================================
   LOAD MEMORIES FROM DATABASE
   ========================================================= */

async function loadMemories() {

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
         * Normalize values so the frontend
         * behaves consistently.
         */

        activeMemories =
            activeMemories.map(
                memory => ({

                    ...memory,

                    id:
                        String(
                            memory.id
                        ),

                    date:
                        memory.date ||
                        "",

                    title:
                        memory.title ||
                        "Untitled Memory",

                    description:
                        memory.description ||
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


        activeMemories =
            [];


        const container =
            document.getElementById(
                "timelineList"
            );


        if (container) {

            container.innerHTML = `

                <div
                    class="text-center py-5 glass-card my-4">

                    <i
                        class="bi bi-exclamation-circle fs-1 text-danger mb-3 d-block">
                    </i>

                    <h5
                        class="text-white">

                        Unable to Load Timeline

                    </h5>

                    <p
                        class="text-secondary-custom">

                        ${escapeHtml(
                            error.message ||
                            "Unable to load your memories."
                        )}

                    </p>

                    <button
                        class="btn btn-aurora mt-2"
                        onclick="loadMemoriesAndRefresh()">

                        <i
                            class="bi bi-arrow-clockwise">
                        </i>

                        Try Again

                    </button>

                </div>

            `;

        }

    }

}


/* =========================================================
   RETRY
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

    const urlParams =
        new URLSearchParams(
            window.location.search
        );


    const memId =
        urlParams.get(
            "id"
        );


    if (
        memId
    ) {

        setTimeout(
            () => {

                openMemoryDetailsModal(
                    memId
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


    /* -------------------------------------------------------
       YEARS
       ------------------------------------------------------- */

    if (
        yearSelect
    ) {

        const years =
            [
                ...new Set(

                    activeMemories

                        .map(
                            memory =>
                                memory.date
                                    ? String(
                                        memory.date
                                    ).substring(
                                        0,
                                        4
                                    )
                                    : ""
                        )

                        .filter(
                            year =>
                                year
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
                            <option value="${escapeAttribute(year)}">
                                ${escapeHtml(year)}
                            </option>
                        `
                    )
                    .join("")
            }

        `;

    }


    /* -------------------------------------------------------
       APPLY FILTERS
       ------------------------------------------------------- */

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


            /* Year */

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


            /* Emotion */

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
                            ).toLowerCase() ===
                            String(
                                selectedEmotion
                            ).toLowerCase()
                    );

            }


            /* Type */

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
                            ).toLowerCase() ===
                            String(
                                selectedType
                            ).toLowerCase()
                    );

            }


            /* Search */

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


                            const tags =
                                Array.isArray(
                                    memory.tags
                                )
                                    ? memory.tags
                                        .map(
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


    if (
        yearSelect
    ) {

        yearSelect.addEventListener(
            "change",
            applyFilters
        );

    }


    if (
        emotionSelect
    ) {

        emotionSelect.addEventListener(
            "change",
            applyFilters
        );

    }


    if (
        typeSelect
    ) {

        typeSelect.addEventListener(
            "change",
            applyFilters
        );

    }


    if (
        searchInput
    ) {

        searchInput.addEventListener(
            "input",
            applyFilters
        );

    }

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
        memories.length === 0
    ) {

        container.innerHTML = `

            <div
                class="text-center py-5 glass-card my-4">

                <i
                    class="bi bi-journal-x fs-1 text-muted-custom mb-3 d-block">
                </i>

                <h5
                    class="text-white">

                    No Memories Found

                </h5>

                <p
                    class="text-secondary-custom">

                    Try clearing your filters
                    or add a new memory.

                </p>

                <button
                    class="btn btn-aurora mt-2"
                    onclick="window.location.href='add-memory.html'">

                    <i
                        class="bi bi-plus-circle">
                    </i>

                    Add Memory

                </button>

            </div>

        `;

        return;

    }


    /*
     * Never permanently reorder activeMemories.
     * Create a copy before sorting.
     */

    const sortedMemories =
        [
            ...memories
        ].sort(
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


                    const favoriteClass =
                        memory.isFavorite
                            ? "bi-star-fill text-warning"
                            : "bi-star";


                    const emotionClass =
                        String(
                            memory.emotion ||
                            "serenity"
                        )
                            .toLowerCase();


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
                                class="timeline-dot">
                            </div>


                            <div
                                class="glass-card glass-card-hover timeline-card rounded-4 p-0"
                            >


                                <!-- IMAGE -->

                                <div
                                    class="position-relative"
                                >

                                    ${
                                        memory.coverImage
                                            ? `

                                                <img
                                                    src="${escapeAttribute(
                                                        memory.coverImage
                                                    )}"
                                                    class="timeline-card-img"
                                                    alt="${escapeAttribute(
                                                        memory.title
                                                    )}"
                                                    loading="lazy"
                                                >

                                            `
                                            :
                                            `

                                                <div
                                                    class="timeline-card-img d-flex align-items-center justify-content-center bg-tertiary"
                                                >

                                                    <i
                                                        class="bi bi-image fs-1 text-muted-custom">
                                                    </i>

                                                </div>

                                            `
                                    }


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
                                        class="btn btn-sm btn-icon position-absolute top-0 start-0 m-3 glass-card"
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
                                            class="bi ${favoriteClass}">
                                        </i>

                                    </button>


                                </div>



                                <!-- CONTENT -->

                                <div
                                    class="p-4"
                                >


                                    <div
                                        class="d-flex align-items-center justify-content-between text-muted-custom small mb-2"
                                    >

                                        <span>

                                            <i
                                                class="bi bi-calendar3 me-1 text-gradient">
                                            </i>

                                            ${escapeHtml(
                                                memory.date
                                            )}

                                        </span>


                                        <span>

                                            <i
                                                class="bi bi-geo-alt me-1 text-gradient">
                                            </i>

                                            ${escapeHtml(
                                                memory.location
                                            )}

                                        </span>

                                    </div>



                                    <h5
                                        class="text-white font-heading mb-2"
                                    >

                                        ${escapeHtml(
                                            memory.title
                                        )}

                                    </h5>


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
                                                    tag =>
                                                        `

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



                                    <!-- AUDIO -->

                                    ${
                                        memory.audioNote
                                            ? `

                                                <div
                                                    class="p-2 rounded-3 bg-tertiary d-flex align-items-center gap-2 mb-3 border border-glass"
                                                >

                                                    <i
                                                        class="bi bi-mic-fill text-accent">
                                                    </i>

                                                    <span
                                                        class="small text-white"
                                                    >

                                                        ${escapeHtml(
                                                            memory.audioNote
                                                        )}

                                                    </span>

                                                    <i
                                                        class="bi bi-play-circle-fill ms-auto fs-5 text-gradient cursor-pointer"
                                                        onclick="event.stopPropagation(); playAudioSim()"
                                                    >
                                                    </i>

                                                </div>

                                            `
                                            : ""
                                    }



                                    <!-- ACTIONS -->

                                    <div
                                        class="d-flex align-items-center justify-content-between border-top border-glass pt-3 mt-2"
                                    >


                                        <!-- LEFT -->

                                        <div
                                            class="d-flex align-items-center gap-2"
                                        >

                                            <button
                                                class="btn btn-sm btn-glass px-3 py-1"
                                                onclick="event.stopPropagation(); handleLike('${escapeAttribute(
                                                    memory.id
                                                )}', this)"
                                            >

                                                <i
                                                    class="bi bi-heart-fill text-danger me-1">
                                                </i>

                                                <span
                                                    class="like-count"
                                                >

                                                    ${Number(
                                                        memory.likes ||
                                                        0
                                                    )}

                                                </span>

                                            </button>


                                            <button
                                                class="btn btn-sm btn-icon"
                                                title="Share"
                                                onclick="event.stopPropagation(); handleShare('${escapeAttribute(
                                                    memory.id
                                                )}')"
                                            >

                                                <i
                                                    class="bi bi-share">
                                                </i>

                                            </button>

                                        </div>



                                        <!-- RIGHT -->

                                        <div
                                            class="d-flex align-items-center gap-2"
                                        >

                                            <button
                                                class="btn btn-sm btn-icon"
                                                title="Edit"
                                                onclick="event.stopPropagation(); handleEdit('${escapeAttribute(
                                                    memory.id
                                                )}')"
                                            >

                                                <i
                                                    class="bi bi-pencil">
                                                </i>

                                            </button>


                                            <button
                                                class="btn btn-sm btn-icon text-danger"
                                                title="Delete"
                                                onclick="event.stopPropagation(); handleDelete('${escapeAttribute(
                                                    memory.id
                                                )}')"
                                            >

                                                <i
                                                    class="bi bi-trash">
                                                </i>

                                            </button>


                                            <button
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
                `/api/memories/${encodeURIComponent(id)}/favorite`,
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
            data.message,
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
                `/api/memories/${encodeURIComponent(id)}/like`,
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
                    data.likes
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
                    data.likes
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
            1000
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
        `${window.location.origin}/timeline.html?id=${encodeURIComponent(id)}`;


    try {

        await navigator.clipboard.writeText(
            url
        );


        showToast(
            "Link Copied",
            "Memory shareable link copied to your clipboard!",
            "success"
        );


    } catch (error) {

        console.error(
            "Clipboard error:",
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
        confirm(
            "Are you sure you want to delete this memory from your life archive?"
        );


    if (
        !confirmed
    ) {

        return;

    }


    try {

        const response =
            await fetch(
                `/api/memories/${encodeURIComponent(id)}`,
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
            data.message,
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

    /*
     * The add-memory page will receive the ID.
     * Its database-backed edit functionality is the next
     * step after Timeline.
     */

    window.location.href =
        `add-memory.html?edit=${encodeURIComponent(id)}`;

}


/* =========================================================
   AUDIO SIMULATION
   ========================================================= */

function playAudioSim() {

    showToast(
        "Audio Playing",
        "Playing recorded voice note simulation...",
        "info"
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

        return;

    }


    let modalEl =
        document.getElementById(
            "memoryDetailsModal"
        );


    if (
        !modalEl
    ) {

        const modalHTML = `

            <div
                class="modal fade"
                id="memoryDetailsModal"
                tabindex="-1"
                aria-hidden="true"
            >

                <div
                    class="modal-dialog modal-dialog-centered modal-lg"
                >

                    <div
                        class="modal-content glass-modal overflow-hidden p-0"
                    >

                        <div
                            id="memoryDetailsBody"
                        ></div>

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
                "memoryDetailsModal"
            );

    }


    const detailsBody =
        document.getElementById(
            "memoryDetailsBody"
        );


    detailsBody.innerHTML = `

        <!-- IMAGE -->

        <div
            class="position-relative"
        >

            ${
                memory.coverImage
                    ? `

                        <img
                            src="${escapeAttribute(
                                memory.coverImage
                            )}"
                            class="w-100"
                            style="
                                max-height:350px;
                                object-fit:cover;
                            "
                            alt="${escapeAttribute(
                                memory.title
                            )}"
                        >

                    `
                    :
                    `

                        <div
                            class="w-100 d-flex align-items-center justify-content-center bg-tertiary"
                            style="height:250px;"
                        >

                            <i
                                class="bi bi-image fs-1 text-muted-custom">
                            </i>

                        </div>

                    `
            }


            <button
                type="button"
                class="btn-close btn-close-white position-absolute top-0 end-0 m-3 p-2 bg-dark rounded-circle"
                data-bs-dismiss="modal"
                aria-label="Close"
            ></button>


            <span
                class="position-absolute bottom-0 start-0 m-3 badge-emotion badge-${escapeAttribute(
                    String(
                        memory.emotion ||
                        "serenity"
                    ).toLowerCase()
                )} fs-6"
            >

                ${escapeHtml(
                    memory.emotion
                )}

            </span>


        </div>



        <!-- BODY -->

        <div
            class="p-4"
        >


            <div
                class="d-flex align-items-center justify-content-between text-muted-custom small mb-2 flex-wrap gap-2"
            >

                <span>

                    <i
                        class="bi bi-calendar3 me-1 text-gradient">
                    </i>

                    ${escapeHtml(
                        memory.date
                    )}

                </span>


                <span>

                    <i
                        class="bi bi-geo-alt me-1 text-gradient">
                    </i>

                    ${escapeHtml(
                        memory.location
                    )}

                </span>


                <span>

                    <i
                        class="bi bi-lock me-1">
                    </i>

                    ${escapeHtml(
                        memory.privacy
                    )}
                    Scope

                </span>


            </div>


            <h3
                class="text-white font-heading mb-3"
            >

                ${escapeHtml(
                    memory.title
                )}

            </h3>


            <p
                class="text-secondary-custom fs-6 leading-relaxed mb-4"
            >

                ${escapeHtml(
                    memory.description
                )}

            </p>



            <div
                class="row g-3 mb-4"
            >


                <!-- PEOPLE -->

                <div
                    class="col-md-6"
                >

                    <div
                        class="p-3 glass-card rounded-3"
                    >

                        <h6
                            class="text-white mb-2"
                        >

                            <i
                                class="bi bi-people me-2 text-gradient">
                            </i>

                            Tagged People

                        </h6>


                        <div
                            class="d-flex flex-wrap gap-1"
                        >

                            ${
                                memory.people.length
                                    ? memory.people
                                        .map(
                                            person =>
                                                `
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
                                    `<span class="text-secondary-custom small">None</span>`
                            }

                        </div>

                    </div>

                </div>



                <!-- TAGS -->

                <div
                    class="col-md-6"
                >

                    <div
                        class="p-3 glass-card rounded-3"
                    >

                        <h6
                            class="text-white mb-2"
                        >

                            <i
                                class="bi bi-tags me-2 text-gradient">
                            </i>

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
                                            tag =>
                                                `
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
                                    `<span class="text-secondary-custom small">No tags</span>`
                            }

                        </div>

                    </div>

                </div>


            </div>



            <!-- FOOTER -->

            <div
                class="d-flex align-items-center justify-content-between border-top border-glass pt-3"
            >

                <span
                    class="small text-muted-custom"
                >

                    <i
                        class="bi bi-heart-fill text-danger me-1">
                    </i>

                    ${Number(
                        memory.likes ||
                        0
                    )}

                    Likes

                </span>


                <button
                    class="btn btn-aurora"
                    data-bs-dismiss="modal"
                >

                    Close Memory

                </button>

            </div>


        </div>

    `;


    const bsModal =
        bootstrap.Modal.getOrCreateInstance(
            modalEl
        );


    bsModal.show();

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