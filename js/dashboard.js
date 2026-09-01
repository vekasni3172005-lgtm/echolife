/* ==========================================================================
   EchoLife Dashboard Controller

   Database-backed dashboard

   Supports:
   - Current user's memories
   - Photo and video media
   - Dashboard statistics
   - Memory streak
   - Years archived
   - Throwback
   - Emotion chart
   - Monthly chart
   - Recent memories
   - Correct video rendering
   ========================================================================== */


/* =========================================================
   GLOBAL STATE
   ========================================================= */

let dashboardMemories = [];


/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        await loadDashboardMemories();

    }
);


/* =========================================================
   LOAD USER MEMORIES
   ========================================================= */

async function loadDashboardMemories() {

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


        dashboardMemories =
            Array.isArray(
                data.memories
            )
                ? data.memories
                : [];


        /*
         * Normalize memory objects.
         */

        dashboardMemories =
            dashboardMemories.map(
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

                    location:
                        memory.location ||
                        "",

                    date:
                        memory.date ||
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
                        "Private"

                })
            );


        /*
         * Render dashboard.
         */

        renderDashboardMetrics();

        renderOnThisDayWidget();

        renderRecentMemories();

        initDashboardCharts();


    } catch (error) {

        console.error(
            "Dashboard loading error:",
            error
        );


        showDashboardError(
            error.message ||
            "Unable to load dashboard."
        );

    }

}


/* =========================================================
   MEDIA TYPE
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
   BUILD DASHBOARD MEDIA
   ========================================================= */

function buildDashboardMedia(
    memory
) {

    /*
     * No media.
     */

    if (
        !memory.coverImage
    ) {

        return `

            <div
                class="dashboard-empty-media"
            >

                <i
                    class="bi bi-image fs-1 text-muted-custom"
                ></i>

            </div>

        `;

    }


    /*
     * Video.
     */

    if (
        isVideoMemory(
            memory
        )
    ) {

        return `

            <div
                class="position-relative"
            >

                <video
                    class="dashboard-memory-media dashboard-memory-video"
                    controls
                    playsinline
                    preload="metadata"
                    onclick="event.stopPropagation();"
                >

                    <source
                        src="${escapeHtml(
                            memory.coverImage
                        )}"
                    >

                    Your browser does not support
                    video playback.

                </video>


                <span
                    class="dashboard-media-badge"
                >

                    <i
                        class="bi bi-camera-video-fill me-1"
                    ></i>

                    Video

                </span>

            </div>

        `;

    }


    /*
     * Photo.
     */

    return `

        <div
            class="position-relative"
        >

            <img
                src="${escapeHtml(
                    memory.coverImage
                )}"
                class="dashboard-memory-media"
                alt="${escapeHtml(
                    memory.title
                )}"
                loading="lazy"
            >


            <span
                class="dashboard-media-badge"
            >

                <i
                    class="bi bi-image-fill me-1"
                ></i>

                Photo

            </span>

        </div>

    `;

}


/* =========================================================
   DASHBOARD METRICS
   ========================================================= */

function renderDashboardMetrics() {

    const memories =
        dashboardMemories;


    /*
     * Total memories.
     */

    const totalMemories =
        memories.length;


    /*
     * Photos.
     */

    const totalPhotos =
        memories.filter(
            memory =>
                String(
                    memory.type ||
                    ""
                )
                    .toLowerCase() ===
                "photo"
        ).length;


    /*
     * Videos.
     */

    const totalVideos =
        memories.filter(
            memory =>
                String(
                    memory.type ||
                    ""
                )
                    .toLowerCase() ===
                "video"
        ).length;


    /*
     * Journals.
     */

    const totalJournals =
        memories.filter(
            memory =>
                String(
                    memory.type ||
                    ""
                )
                    .toLowerCase() ===
                    "journal"

                ||

                String(
                    memory.category ||
                    ""
                )
                    .toLowerCase() ===
                    "journal"
        ).length;


    /*
     * Favorites.
     */

    const totalFavorites =
        memories.filter(
            memory =>
                Boolean(
                    memory.isFavorite
                )
        ).length;


    /*
     * Counters.
     */

    animateCounter(
        "statTotalMemories",
        totalMemories
    );


    animateCounter(
        "statPhotos",
        totalPhotos
    );


    animateCounter(
        "statVideos",
        totalVideos
    );


    animateCounter(
        "statJournals",
        totalJournals
    );


    animateCounter(
        "statFavorites",
        totalFavorites
    );


    /*
     * Streak.
     */

    const streakElement =
        document.getElementById(
            "statStreak"
        );


    if (
        streakElement
    ) {

        streakElement.textContent =
            calculateMemoryStreak(
                memories
            );

    }


    /*
     * Years.
     */

    const yearsElement =
        document.getElementById(
            "statYears"
        );


    if (
        yearsElement
    ) {

        yearsElement.textContent =
            calculateYearsArchived(
                memories
            );

    }


    /*
     * Storage.
     *
     * Actual file storage calculation has not been
     * implemented in the current database API.
     */

    const storageProgress =
        document.getElementById(
            "storageProgressBar"
        );


    const storageText =
        document.getElementById(
            "storageText"
        );


    if (
        storageProgress
    ) {

        storageProgress.style.width =
            "0%";

    }


    if (
        storageText
    ) {

        storageText.textContent =
            "0 GB of 10 GB (0%)";

    }

}


/* =========================================================
   MEMORY STREAK
   ========================================================= */

function calculateMemoryStreak(
    memories
) {

    if (
        !memories.length
    ) {

        return "0 Days";

    }


    const uniqueDates =
        [
            ...new Set(

                memories
                    .map(
                        memory =>
                            memory.date
                    )
                    .filter(
                        Boolean
                    )

            )
        ]
        .sort(
            (a, b) =>
                new Date(b) -
                new Date(a)
        );


    if (
        !uniqueDates.length
    ) {

        return "0 Days";

    }


    let streak =
        1;


    for (
        let index = 1;
        index <
        uniqueDates.length;
        index++
    ) {

        const previous =
            new Date(
                uniqueDates[
                    index - 1
                ]
            );


        const current =
            new Date(
                uniqueDates[
                    index
                ]
            );


        const difference =
            Math.round(

                (
                    previous -
                    current
                )
                /
                (
                    1000 *
                    60 *
                    60 *
                    24
                )

            );


        if (
            difference ===
            1
        ) {

            streak++;

        } else {

            break;

        }

    }


    return `${streak} Days`;

}


/* =========================================================
   YEARS ARCHIVED
   ========================================================= */

function calculateYearsArchived(
    memories
) {

    if (
        !memories.length
    ) {

        return "0 Yrs";

    }


    const years =
        memories
            .map(
                memory =>
                    new Date(
                        memory.date
                    ).getFullYear()
            )
            .filter(
                year =>
                    !Number.isNaN(
                        year
                    )
            );


    if (
        !years.length
    ) {

        return "0 Yrs";

    }


    const oldest =
        Math.min(
            ...years
        );


    const currentYear =
        new Date().getFullYear();


    const totalYears =
        Math.max(
            1,
            currentYear -
            oldest +
            1
        );


    return `${totalYears} Yrs`;

}


/* =========================================================
   COUNTER ANIMATION
   ========================================================= */

function animateCounter(
    elementId,
    targetValue
) {

    const element =
        document.getElementById(
            elementId
        );


    if (
        !element
    ) {

        return;

    }


    if (
        targetValue ===
        0
    ) {

        element.textContent =
            "0";


        return;

    }


    let current =
        0;


    const duration =
        700;


    const stepTime =
        30;


    const steps =
        duration /
        stepTime;


    const increment =
        targetValue /
        steps;


    const timer =
        setInterval(
            () => {

                current +=
                    increment;


                if (
                    current >=
                    targetValue
                ) {

                    element.textContent =
                        targetValue;


                    clearInterval(
                        timer
                    );

                } else {

                    element.textContent =
                        Math.floor(
                            current
                        );

                }

            },
            stepTime
        );

}


/* =========================================================
   ON THIS DAY THROWBACK
   ========================================================= */

function renderOnThisDayWidget() {

    const container =
        document.getElementById(
            "onThisDayContainer"
        );


    if (
        !container
    ) {

        return;

    }


    if (
        !dashboardMemories.length
    ) {

        container.innerHTML = `

            <div
                class="text-center py-5"
            >

                <i
                    class="bi bi-clock-history fs-1 text-muted-custom mb-3 d-block"
                ></i>


                <h6
                    class="text-white"
                >

                    No memories yet

                </h6>


                <p
                    class="text-secondary-custom small"
                >

                    Create your first memory to see
                    personal throwbacks here.

                </p>


                <a
                    href="add-memory.html"
                    class="btn btn-aurora btn-sm"
                >

                    <i
                        class="bi bi-plus-circle me-1"
                    ></i>

                    Add Your First Memory

                </a>

            </div>

        `;


        return;

    }


    const currentMonth =
        String(
            new Date()
                .getMonth() +
            1
        )
            .padStart(
                2,
                "0"
            );


    const currentDay =
        String(
            new Date()
                .getDate()
        )
            .padStart(
                2,
                "0"
            );


    /*
     * Try to find a true anniversary.
     */

    let throwback =
        dashboardMemories.find(
            memory =>
                memory.date &&
                String(
                    memory.date
                ).endsWith(
                    `-${currentMonth}-${currentDay}`
                )
        );


    /*
     * If there is no anniversary today,
     * show the newest memory so the widget is
     * still useful.
     */

    if (
        !throwback
    ) {

        throwback =
            dashboardMemories[0];

    }


    const video =
        isVideoMemory(
            throwback
        );


    const mediaHTML =
        throwback.coverImage

            ? video

                ? `

                    <video
                        class="dashboard-throwback-media"
                        controls
                        playsinline
                        preload="metadata"
                        onclick="event.stopPropagation();"
                    >

                        <source
                            src="${escapeHtml(
                                throwback.coverImage
                            )}"
                        >

                    </video>

                `

                : `

                    <img
                        src="${escapeHtml(
                            throwback.coverImage
                        )}"
                        class="dashboard-throwback-media"
                        alt="${escapeHtml(
                            throwback.title
                        )}"
                    >

                `

            : `

                <div
                    class="dashboard-throwback-media d-flex align-items-center justify-content-center"
                >

                    <i
                        class="bi bi-image fs-1 text-muted-custom"
                    ></i>

                </div>

            `;


    container.innerHTML = `

        <div
            class="position-relative rounded-4 overflow-hidden border border-glass"
        >

            ${mediaHTML}


            <div
                class="position-absolute top-0 start-0 end-0 bottom-0 p-4 d-flex flex-column justify-content-between"
                style="
                    background:
                        linear-gradient(
                            to top,
                            rgba(11,15,25,.95),
                            rgba(0,0,0,.15)
                        );
                    pointer-events:none;
                "
            >

                <div>

                    <span
                        class="badge bg-danger rounded-pill"
                    >

                        <i
                            class="bi bi-clock-history me-1"
                        ></i>

                        ${
                            String(
                                throwback.date
                            ).endsWith(
                                `-${currentMonth}-${currentDay}`
                            )
                                ? "Your Throwback"
                                : "Featured Memory"
                        }

                    </span>

                </div>


                <div>

                    <h5
                        class="text-white mb-1"
                    >

                        ${escapeHtml(
                            throwback.title
                        )}

                    </h5>


                    <p
                        class="text-secondary-custom small mb-2"
                    >

                        ${escapeHtml(
                            throwback.location ||
                            ""
                        )}

                        •

                        ${escapeHtml(
                            throwback.date ||
                            ""
                        )}

                    </p>


                    <span
                        class="badge bg-dark bg-opacity-75 text-white"
                    >

                        <i
                            class="bi ${
                                video
                                    ? "bi-camera-video-fill"
                                    : "bi-image-fill"
                            } me-1"
                        ></i>

                        ${
                            video
                                ? "Video"
                                : "Photo"
                        }

                    </span>

                </div>

            </div>

        </div>

    `;

}


/* =========================================================
   RECENT MEMORIES
   ========================================================= */

function renderRecentMemories() {

    const container =
        document.getElementById(
            "recentMemoriesContainer"
        );


    if (
        !container
    ) {

        return;

    }


    /*
     * Newest first.
     */

    const memories =
        [
            ...dashboardMemories
        ]
        .sort(
            (a, b) =>
                new Date(
                    b.date
                ) -
                new Date(
                    a.date
                )
        )
        .slice(
            0,
            4
        );


    if (
        !memories.length
    ) {

        container.innerHTML = `

            <div
                class="col-12"
            >

                <div
                    class="glass-card p-5 text-center"
                >

                    <i
                        class="bi bi-journal-x fs-1 text-muted-custom mb-3 d-block"
                    ></i>


                    <h5
                        class="text-white"
                    >

                        Your archive is empty

                    </h5>


                    <p
                        class="text-secondary-custom"
                    >

                        Your memories will appear here
                        after you create them.

                    </p>


                    <a
                        href="add-memory.html"
                        class="btn btn-aurora"
                    >

                        <i
                            class="bi bi-plus-circle me-1"
                        ></i>

                        Create Memory

                    </a>

                </div>

            </div>

        `;


        return;

    }


    container.innerHTML =
        memories
            .map(
                memory => `

                    <div
                        class="col-md-6 col-lg-3 mb-4"
                    >

                        <div
                            class="glass-card glass-card-hover h-100 d-flex flex-column overflow-hidden dashboard-memory-clickable"
                            onclick="openDashboardMemory('${escapeHtml(
                                memory.id
                            )}')"
                        >

                            ${
                                buildDashboardMedia(
                                    memory
                                )
                            }


                            <div
                                class="p-3 d-flex flex-column flex-grow-1"
                            >


                                <!-- TITLE -->

                                <h6
                                    class="text-white mb-1 text-truncate"
                                >

                                    ${escapeHtml(
                                        memory.title
                                    )}

                                </h6>


                                <!-- LOCATION -->

                                <p
                                    class="text-secondary-custom small mb-2"
                                >

                                    <i
                                        class="bi bi-geo-alt me-1"
                                    ></i>

                                    ${escapeHtml(
                                        memory.location ||
                                        ""
                                    )}

                                </p>


                                <!-- DESCRIPTION -->

                                <p
                                    class="text-muted-custom small mb-3"
                                    style="
                                        display:-webkit-box;
                                        -webkit-line-clamp:2;
                                        -webkit-box-orient:vertical;
                                        overflow:hidden;
                                    "
                                >

                                    ${escapeHtml(
                                        memory.description ||
                                        ""
                                    )}

                                </p>


                                <!-- FOOTER -->

                                <div
                                    class="mt-auto border-top border-glass pt-2 d-flex justify-content-between align-items-center"
                                >

                                    <span
                                        class="small text-muted-custom"
                                    >

                                        ${escapeHtml(
                                            memory.date ||
                                            ""
                                        )}

                                    </span>


                                    <span
                                        class="small text-secondary-custom"
                                    >

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

                    </div>

                `
            )
            .join("");

}


/* =========================================================
   OPEN DASHBOARD MEMORY
   ========================================================= */

function openDashboardMemory(
    id
) {

    /*
     * Open Timeline details because Timeline already
     * contains the full memory modal and EchoNarrate.
     */

    window.location.href =
        `timeline.html?id=${encodeURIComponent(
            id
        )}`;

}


/* =========================================================
   DASHBOARD CHARTS
   ========================================================= */

function initDashboardCharts() {

    if (
        typeof Chart ===
        "undefined"
    ) {

        console.error(
            "Chart.js is not loaded."
        );


        return;

    }


    renderEmotionChart();

    renderMonthlyChart();

}


/* =========================================================
   EMOTION CHART
   ========================================================= */

function renderEmotionChart() {

    const canvas =
        document.getElementById(
            "dashboardEmotionChart"
        );


    if (
        !canvas
    ) {

        return;

    }


    /*
     * Destroy old chart.
     */

    if (
        typeof Chart.getChart ===
        "function"
    ) {

        const existing =
            Chart.getChart(
                canvas
            );


        if (
            existing
        ) {

            existing.destroy();

        }

    }


    const counts =
        {};


    dashboardMemories.forEach(
        memory => {

            const emotion =
                memory.emotion ||
                "Other";


            counts[
                emotion
            ] =
                (
                    counts[
                        emotion
                    ] ||
                    0
                ) + 1;

        }
    );


    const labels =
        Object.keys(
            counts
        );


    const values =
        Object.values(
            counts
        );


    if (
        !labels.length
    ) {

        canvas.parentElement.innerHTML = `

            <div
                class="text-center py-4"
            >

                <i
                    class="bi bi-pie-chart fs-1 text-muted-custom"
                ></i>


                <p
                    class="text-secondary-custom small mt-2 mb-0"
                >

                    Emotion analytics will appear
                    after you add memories.

                </p>

            </div>

        `;


        return;

    }


    new Chart(
        canvas,
        {

            type:
                "doughnut",


            data: {

                labels:


                    labels,


                datasets: [

                    {

                        data:
                            values,


                        backgroundColor: [

                            "#f59e0b",
                            "#c084fc",
                            "#34d399",
                            "#f472b6",
                            "#22d3ee",
                            "#818cf8",
                            "#fb7185",
                            "#a3e635"

                        ],


                        borderWidth:
                            0

                    }

                ]

            },


            options: {

                responsive:
                    true,


                maintainAspectRatio:
                    false,


                cutout:
                    "70%",


                plugins: {

                    legend: {

                        position:
                            "bottom",


                        labels: {

                            color:
                                "#94a3b8"

                        }

                    }

                }

            }

        }
    );

}


/* =========================================================
   MONTHLY CHART
   ========================================================= */

function renderMonthlyChart() {

    const canvas =
        document.getElementById(
            "dashboardUploadChart"
        );


    if (
        !canvas
    ) {

        return;

    }


    /*
     * Destroy previous chart.
     */

    if (
        typeof Chart.getChart ===
        "function"
    ) {

        const existing =
            Chart.getChart(
                canvas
            );


        if (
            existing
        ) {

            existing.destroy();

        }

    }


    const monthlyCounts =
        new Array(
            12
        ).fill(
            0
        );


    dashboardMemories.forEach(
        memory => {

            if (
                !memory.date
            ) {

                return;

            }


            const date =
                new Date(
                    memory.date
                );


            if (
                Number.isNaN(
                    date.getTime()
                )
            ) {

                return;

            }


            const month =
                date.getMonth();


            if (
                month >= 0 &&
                month <
                12
            ) {

                monthlyCounts[
                    month
                ]++;

            }

        }
    );


    new Chart(
        canvas,
        {

            type:
                "bar",


            data: {

                labels: [

                    "Jan",
                    "Feb",
                    "Mar",
                    "Apr",
                    "May",
                    "Jun",
                    "Jul",
                    "Aug",
                    "Sep",
                    "Oct",
                    "Nov",
                    "Dec"

                ],


                datasets: [

                    {

                        label:
                            "Your Memories",


                        data:
                            monthlyCounts,


                        backgroundColor:
                            "rgba(99,102,241,.75)",


                        borderRadius:
                            8

                    }

                ]

            },


            options: {

                responsive:
                    true,


                maintainAspectRatio:
                    false,


                plugins: {

                    legend: {

                        display:
                            false

                    }

                },


                scales: {

                    x: {

                        ticks: {

                            color:
                                "#94a3b8"

                        },


                        grid: {

                            color:
                                "rgba(255,255,255,.05)"

                        }

                    },


                    y: {

                        beginAtZero:
                            true,


                        ticks: {

                            color:
                                "#94a3b8",

                            precision:
                                0

                        },


                        grid: {

                            color:
                                "rgba(255,255,255,.05)"

                        }

                    }

                }

            }

        }
    );

}


/* =========================================================
   ERROR
   ========================================================= */

function showDashboardError(
    message
) {

    const recent =
        document.getElementById(
            "recentMemoriesContainer"
        );


    if (
        recent
    ) {

        recent.innerHTML = `

            <div
                class="col-12"
            >

                <div
                    class="glass-card p-5 text-center"
                >

                    <i
                        class="bi bi-exclamation-circle fs-1 text-danger mb-3 d-block"
                    ></i>


                    <h5
                        class="text-white"
                    >

                        Unable to Load Dashboard

                    </h5>


                    <p
                        class="text-secondary-custom"
                    >

                        ${escapeHtml(
                            message
                        )}

                    </p>


                    <button
                        type="button"
                        class="btn btn-aurora"
                        onclick="loadDashboardMemories()"
                    >

                        <i
                            class="bi bi-arrow-clockwise me-1"
                        ></i>

                        Try Again

                    </button>

                </div>

            </div>

        `;

    }

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