/* ==========================================================================
   EchoLife Dashboard Controller
   Uses the logged-in user's database memories
   ========================================================================== */

let dashboardMemories = [];


document.addEventListener("DOMContentLoaded", async () => {

    await loadDashboardMemories();

});


/* =========================================================
   LOAD USER MEMORIES
   ========================================================= */

async function loadDashboardMemories() {

    try {

        const response = await fetch(
            "/api/memories",
            {
                method: "GET",
                credentials: "include"
            }
        );


        if (response.status === 401) {

            window.location.href = "login.html";
            return;

        }


        const data = await response.json();


        if (!response.ok || !data.success) {

            throw new Error(
                data.message || "Unable to load memories."
            );

        }


        dashboardMemories =
            Array.isArray(data.memories)
                ? data.memories
                : [];


        renderDashboardMetrics();

        renderOnThisDayWidget();

        renderRecentMemories();

        initDashboardCharts();


    } catch (error) {

        console.error(
            "Dashboard loading error:",
            error
        );

    }

}


/* =========================================================
   METRICS
   ========================================================= */

function renderDashboardMetrics() {

    const memories =
        dashboardMemories;


    const totalMemories =
        memories.length;


    const totalPhotos =
        memories.filter(
            memory =>
                memory.type === "Photo" ||
                memory.coverImage
        ).length;


    const totalVideos =
        memories.filter(
            memory =>
                memory.type === "Video"
        ).length;


    const totalJournals =
        memories.filter(
            memory =>
                memory.type === "Journal" ||
                memory.category === "Journal"
        ).length;


    const totalFavorites =
        memories.filter(
            memory =>
                memory.isFavorite
        ).length;


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
     * No demo streak or years data.
     * Show values based on the user's actual memories.
     */

    const streakElement =
        document.getElementById("statStreak");


    if (streakElement) {

        streakElement.textContent =
            calculateMemoryStreak(memories);

    }


    const yearsElement =
        document.getElementById("statYears");


    if (yearsElement) {

        yearsElement.textContent =
            calculateYearsArchived(memories);

    }


    /*
     * We don't yet have real file-storage
     * measurement, so show 0 GB until it
     * is implemented.
     */

    const storageProgress =
        document.getElementById(
            "storageProgressBar"
        );


    const storageText =
        document.getElementById(
            "storageText"
        );


    if (storageProgress) {

        storageProgress.style.width =
            "0%";

    }


    if (storageText) {

        storageText.textContent =
            "0 GB of 10 GB (0%)";

    }

}


/* =========================================================
   STREAK
   ========================================================= */

function calculateMemoryStreak(memories) {

    if (!memories.length) {
        return "0 Days";
    }


    const uniqueDates =
        [
            ...new Set(
                memories
                    .map(memory => memory.date)
                    .filter(Boolean)
            )
        ]
        .sort(
            (a, b) =>
                new Date(b) - new Date(a)
        );


    if (!uniqueDates.length) {
        return "0 Days";
    }


    let streak = 1;


    for (
        let i = 1;
        i < uniqueDates.length;
        i++
    ) {

        const previous =
            new Date(
                uniqueDates[i - 1]
            );


        const current =
            new Date(
                uniqueDates[i]
            );


        const difference =
            Math.round(
                (
                    previous - current
                ) /
                (
                    1000 * 60 * 60 * 24
                )
            );


        if (difference === 1) {

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

function calculateYearsArchived(memories) {

    if (!memories.length) {
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
                    !Number.isNaN(year)
            );


    if (!years.length) {
        return "0 Yrs";
    }


    const oldest =
        Math.min(...years);


    const currentYear =
        new Date().getFullYear();


    const totalYears =
        Math.max(
            1,
            currentYear - oldest + 1
        );


    return `${totalYears} Yrs`;

}


/* =========================================================
   COUNTER
   ========================================================= */

function animateCounter(
    elementId,
    targetValue
) {

    const element =
        document.getElementById(
            elementId
        );


    if (!element) {
        return;
    }


    if (targetValue === 0) {

        element.textContent = "0";

        return;

    }


    let current = 0;

    const duration = 700;

    const stepTime = 30;

    const steps =
        duration / stepTime;

    const increment =
        targetValue / steps;


    const timer =
        setInterval(() => {

            current += increment;


            if (current >= targetValue) {

                element.textContent =
                    targetValue;

                clearInterval(timer);

            } else {

                element.textContent =
                    Math.floor(current);

            }

        }, stepTime);

}


/* =========================================================
   THROWBACK
   ========================================================= */

function renderOnThisDayWidget() {

    const container =
        document.getElementById(
            "onThisDayContainer"
        );


    if (!container) {
        return;
    }


    if (!dashboardMemories.length) {

        container.innerHTML = `
            <div class="text-center py-5">

                <i
                    class="bi bi-clock-history fs-1 text-muted-custom mb-3 d-block">
                </i>

                <h6 class="text-white">
                    No memories yet
                </h6>

                <p class="text-secondary-custom small">
                    Create your first memory to see your personal throwbacks here.
                </p>

                <a
                    href="add-memory.html"
                    class="btn btn-aurora btn-sm">

                    <i class="bi bi-plus-circle me-1"></i>
                    Add Your First Memory

                </a>

            </div>
        `;

        return;

    }


    const currentMonth =
        String(
            new Date().getMonth() + 1
        ).padStart(2, "0");


    const currentDay =
        String(
            new Date().getDate()
        ).padStart(2, "0");


    const throwback =
        dashboardMemories.find(
            memory =>
                memory.date &&
                memory.date.endsWith(
                    `-${currentMonth}-${currentDay}`
                )
        );


    if (!throwback) {

        container.innerHTML = `
            <div class="text-center py-5">

                <i
                    class="bi bi-calendar-heart fs-1 text-muted-custom mb-3 d-block">
                </i>

                <h6 class="text-white">
                    No throwbacks for today
                </h6>

                <p class="text-secondary-custom small">
                    Your future memories will appear here on their anniversaries.
                </p>

            </div>
        `;

        return;

    }


    container.innerHTML = `

        <div
            class="position-relative rounded-4 overflow-hidden border border-glass">

            <img
                src="${escapeHtml(
                    throwback.coverImage || ""
                )}"
                class="w-100"
                style="height: 220px; object-fit: cover;"
                alt="${escapeHtml(
                    throwback.title
                )}"
            >

            <div
                class="position-absolute top-0 start-0 end-0 bottom-0 p-4 d-flex flex-column justify-content-between"
                style="background: linear-gradient(to top, rgba(11,15,25,.95), rgba(0,0,0,.15));">

                <div>

                    <span
                        class="badge bg-danger rounded-pill">

                        <i
                            class="bi bi-clock-history me-1">
                        </i>

                        Your Throwback

                    </span>

                </div>

                <div>

                    <h5 class="text-white mb-1">

                        ${escapeHtml(
                            throwback.title
                        )}

                    </h5>

                    <p
                        class="text-secondary-custom small mb-2">

                        ${escapeHtml(
                            throwback.location || ""
                        )}

                        •

                        ${escapeHtml(
                            throwback.date || ""
                        )}

                    </p>

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


    if (!container) {
        return;
    }


    const memories =
        dashboardMemories.slice(0, 4);


    if (!memories.length) {

        container.innerHTML = `
            <div class="col-12">

                <div
                    class="glass-card p-5 text-center">

                    <i
                        class="bi bi-journal-x fs-1 text-muted-custom mb-3 d-block">
                    </i>

                    <h5 class="text-white">
                        Your archive is empty
                    </h5>

                    <p class="text-secondary-custom">
                        Your memories will appear here after you create them.
                    </p>

                    <a
                        href="add-memory.html"
                        class="btn btn-aurora">

                        <i class="bi bi-plus-circle me-1"></i>

                        Create Memory

                    </a>

                </div>

            </div>
        `;

        return;

    }


    container.innerHTML =
        memories.map(memory => `

            <div
                class="col-md-6 col-lg-3 mb-4">

                <div
                    class="glass-card glass-card-hover h-100 d-flex flex-column overflow-hidden">

                    ${
                        memory.coverImage
                        ? `
                        <img
                            src="${escapeHtml(
                                memory.coverImage
                            )}"
                            class="w-100"
                            style="height:160px; object-fit:cover;"
                            alt="${escapeHtml(
                                memory.title
                            )}">
                        `
                        : ""
                    }

                    <div
                        class="p-3 d-flex flex-column flex-grow-1">

                        <h6
                            class="text-white mb-1 text-truncate">

                            ${escapeHtml(
                                memory.title
                            )}

                        </h6>

                        <p
                            class="text-secondary-custom small mb-2">

                            ${escapeHtml(
                                memory.location || ""
                            )}

                        </p>

                        <p
                            class="text-muted-custom small mb-3">

                            ${escapeHtml(
                                memory.description || ""
                            )}

                        </p>

                        <div
                            class="mt-auto border-top border-glass pt-2">

                            <span
                                class="small text-muted-custom">

                                ${escapeHtml(
                                    memory.date || ""
                                )}

                            </span>

                        </div>

                    </div>

                </div>

            </div>

        `).join("");

}


/* =========================================================
   CHARTS
   ========================================================= */

function initDashboardCharts() {

    if (
        typeof Chart === "undefined"
    ) {

        return;

    }


    /*
     * Emotion chart
     */

    const emotionCanvas =
        document.getElementById(
            "dashboardEmotionChart"
        );


    if (emotionCanvas) {

        const counts = {};


        dashboardMemories.forEach(
            memory => {

                const emotion =
                    memory.emotion ||
                    "Other";

                counts[emotion] =
                    (
                        counts[emotion] ||
                        0
                    ) + 1;

            }
        );


        const labels =
            Object.keys(counts);


        const values =
            Object.values(counts);


        if (!labels.length) {

            emotionCanvas.parentElement.innerHTML = `
                <div class="text-center py-4">
                    <i class="bi bi-pie-chart fs-1 text-muted-custom"></i>
                    <p class="text-secondary-custom small mt-2 mb-0">
                        Emotion analytics will appear after you add memories.
                    </p>
                </div>
            `;

        } else {

            new Chart(
                emotionCanvas,
                {
                    type: "doughnut",

                    data: {

                        labels,

                        datasets: [
                            {
                                data: values,

                                backgroundColor: [
                                    "#f59e0b",
                                    "#c084fc",
                                    "#34d399",
                                    "#f472b6",
                                    "#22d3ee",
                                    "#818cf8"
                                ],

                                borderWidth: 0
                            }
                        ]

                    },

                    options: {

                        responsive: true,

                        plugins: {

                            legend: {
                                position: "bottom"
                            }

                        },

                        cutout: "70%"

                    }

                }
            );

        }

    }


    /*
     * Monthly chart
     */

    const uploadCanvas =
        document.getElementById(
            "dashboardUploadChart"
        );


    if (uploadCanvas) {

        const monthlyCounts =
            new Array(12).fill(0);


        dashboardMemories.forEach(
            memory => {

                if (!memory.date) {
                    return;
                }


                const month =
                    new Date(
                        memory.date
                    ).getMonth();


                if (
                    month >= 0 &&
                    month < 12
                ) {

                    monthlyCounts[month]++;

                }

            }
        );


        new Chart(
            uploadCanvas,
            {
                type: "bar",

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
                                "rgba(99, 102, 241, 0.75)",

                            borderRadius: 8

                        }
                    ]

                },

                options: {

                    responsive: true,

                    plugins: {

                        legend: {
                            display: false
                        }

                    }

                }

            }
        );

    }

}


/* =========================================================
   HTML ESCAPING
   ========================================================= */

function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}