/* ==========================================================================
   EchoLife User Statistics & Analytics Controller
   ========================================================================== */

let statisticsMemories = [];


/* =========================================================
   INITIALIZE
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        if (typeof Chart === "undefined") {

            console.error(
                "Chart.js is not loaded."
            );

            return;
        }

        await loadStatisticsMemories();

    }
);


/* =========================================================
   LOAD CURRENT USER MEMORIES
   ========================================================= */

async function loadStatisticsMemories() {

    try {

        const response = await fetch(
            "/api/memories",
            {
                method: "GET",
                credentials: "include"
            }
        );


        /* ---------------------------------------------
           Not logged in
           --------------------------------------------- */

        if (response.status === 401) {

            window.location.href =
                "login.html";

            return;

        }


        const data =
            await response.json();


        /* ---------------------------------------------
           API error
           --------------------------------------------- */

        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Unable to load statistics."
            );

        }


        /* ---------------------------------------------
           Save user's memories
           --------------------------------------------- */

        statisticsMemories =
            Array.isArray(data.memories)
                ? data.memories
                : [];


        /* ---------------------------------------------
           Render everything
           --------------------------------------------- */

        initStatisticsCharts();


    } catch (error) {

        console.error(
            "Statistics loading error:",
            error
        );


        showStatisticsError(
            error.message ||
            "Unable to load your statistics."
        );

    }

}


/* =========================================================
   INITIALIZE ALL STATISTICS
   ========================================================= */

function initStatisticsCharts() {

    renderSummaryCards();

    renderMonthlyChart();

    renderEmotionChart();

    renderCategoryChart();

    renderStorageChart();

}


/* =========================================================
   SUMMARY CARDS
   ========================================================= */

function renderSummaryCards() {

    const streakElement =
        document.getElementById(
            "statsLongestStreak"
        );


    const emotionElement =
        document.getElementById(
            "statsDominantEmotion"
        );


    const monthElement =
        document.getElementById(
            "statsActiveMonth"
        );


    const totalElement =
        document.getElementById(
            "statsTotalMedia"
        );


    /* =====================================================
       TOTAL MEDIA
       ===================================================== */

    if (totalElement) {

        totalElement.innerHTML = `

            <i
                class="bi bi-file-earmark-image text-info me-2">
            </i>

            ${statisticsMemories.length}
            File${statisticsMemories.length === 1 ? "" : "s"}

        `;

    }


    /* =====================================================
       EMPTY ACCOUNT
       ===================================================== */

    if (!statisticsMemories.length) {

        if (streakElement) {

            streakElement.innerHTML = `

                <i
                    class="bi bi-fire text-danger me-2">
                </i>

                0 Days

            `;

        }


        if (emotionElement) {

            emotionElement.innerHTML = `

                <i
                    class="bi bi-sun text-warning me-2">
                </i>

                No Data

            `;

        }


        if (monthElement) {

            monthElement.innerHTML = `

                <i
                    class="bi bi-calendar2-check text-primary me-2">
                </i>

                No Data

            `;

        }


        return;

    }


    /* =====================================================
       LONGEST ARCHIVING STREAK
       ===================================================== */

    const uniqueDates = [
        ...new Set(

            statisticsMemories
                .map(
                    memory =>
                        memory.date
                )
                .filter(Boolean)

        )
    ]
    .sort(
        (a, b) =>
            new Date(a) -
            new Date(b)
    );


    let longestStreak = 1;

    let currentStreak = 1;


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
                    current -
                    previous
                )
                /
                (
                    1000 *
                    60 *
                    60 *
                    24
                )

            );


        if (difference === 1) {

            currentStreak++;


            longestStreak =
                Math.max(
                    longestStreak,
                    currentStreak
                );

        } else {

            currentStreak = 1;

        }

    }


    if (streakElement) {

        streakElement.innerHTML = `

            <i
                class="bi bi-fire text-danger me-2">
            </i>

            ${longestStreak}
            Day${longestStreak === 1 ? "" : "s"}

        `;

    }


    /* =====================================================
       DOMINANT EMOTION
       ===================================================== */

    const emotionCounts = {};


    statisticsMemories.forEach(
        memory => {

            const emotion =
                String(
                    memory.emotion ||
                    "Unspecified"
                ).trim();


            emotionCounts[emotion] =
                (
                    emotionCounts[emotion] ||
                    0
                ) + 1;

        }
    );


    const emotionEntries =
        Object.entries(
            emotionCounts
        )
        .sort(
            (a, b) =>
                b[1] - a[1]
        );


    if (
        emotionElement &&
        emotionEntries.length
    ) {

        const dominantEmotion =
            emotionEntries[0][0];


        const dominantCount =
            emotionEntries[0][1];


        const percentage =
            Math.round(

                (
                    dominantCount /
                    statisticsMemories.length
                ) * 100

            );


        emotionElement.innerHTML = `

            <i
                class="bi bi-sun text-warning me-2">
            </i>

            ${escapeHtml(
                dominantEmotion
            )}

            (${percentage}%)

        `;

    }


    /* =====================================================
       MOST ACTIVE MONTH
       ===================================================== */

    const monthCounts =
        new Array(12).fill(0);


    statisticsMemories.forEach(
        memory => {

            if (!memory.date) {

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


            monthCounts[
                date.getMonth()
            ]++;

        }
    );


    const monthNames = [

        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"

    ];


    let mostActiveMonthIndex =
        -1;


    let highestMonthCount =
        0;


    monthCounts.forEach(
        (count, index) => {

            if (
                count >
                highestMonthCount
            ) {

                highestMonthCount =
                    count;


                mostActiveMonthIndex =
                    index;

            }

        }
    );


    if (
        monthElement &&
        mostActiveMonthIndex >= 0
    ) {

        monthElement.innerHTML = `

            <i
                class="bi bi-calendar2-check text-primary me-2">
            </i>

            ${monthNames[
                mostActiveMonthIndex
            ]}

        `;

    }

}


/* =========================================================
   MONTHLY MEMORY UPLOAD GROWTH
   ========================================================= */

function renderMonthlyChart() {

    const canvas =
        document.getElementById(
            "statsMonthlyLineChart"
        );


    if (!canvas) {

        return;

    }


    const monthlyCounts =
        new Array(12).fill(0);


    statisticsMemories.forEach(
        memory => {

            if (!memory.date) {

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


            monthlyCounts[month]++;

        }
    );


    new Chart(
        canvas,
        {

            type: "line",

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

                        borderColor:
                            "#6366f1",

                        backgroundColor:
                            "rgba(99, 102, 241, 0.15)",

                        fill:
                            true,

                        tension:
                            0.4,

                        pointBackgroundColor:
                            "#ec4899",

                        pointRadius:
                            5

                    }

                ]

            },

            options: {

                responsive:
                    true,

                maintainAspectRatio:
                    true,

                plugins: {

                    legend: {

                        labels: {

                            color:
                                "#94a3b8"

                        }

                    }

                },

                scales: {

                    x: {

                        grid: {

                            color:
                                "rgba(255,255,255,0.05)"

                        },

                        ticks: {

                            color:
                                "#94a3b8"

                        }

                    },

                    y: {

                        beginAtZero:
                            true,

                        grid: {

                            color:
                                "rgba(255,255,255,0.05)"

                        },

                        ticks: {

                            color:
                                "#94a3b8",

                            precision:
                                0

                        }

                    }

                }

            }

        }
    );

}


/* =========================================================
   EMOTION BREAKDOWN
   ========================================================= */

function renderEmotionChart() {

    const canvas =
        document.getElementById(
            "statsEmotionDoughnutChart"
        );


    if (!canvas) {

        return;

    }


    const counts = {};


    statisticsMemories.forEach(
        memory => {

            const emotion =
                String(
                    memory.emotion ||
                    "Unspecified"
                ).trim();


            counts[emotion] =
                (
                    counts[emotion] ||
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


    if (!labels.length) {

        showEmptyChartMessage(
            canvas,
            "No emotion data yet."
        );

        return;

    }


    new Chart(
        canvas,
        {

            type: "doughnut",

            data: {

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

                plugins: {

                    legend: {

                        position:
                            "right",

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
   CATEGORY DISTRIBUTION
   ========================================================= */

function renderCategoryChart() {

    const canvas =
        document.getElementById(
            "statsCategoryBarChart"
        );


    if (!canvas) {

        return;

    }


    const categoryCounts =
        {};


    statisticsMemories.forEach(
        memory => {

            const category =
                String(
                    memory.category ||
                    "Uncategorized"
                ).trim();


            categoryCounts[category] =
                (
                    categoryCounts[category] ||
                    0
                ) + 1;

        }
    );


    const labels =
        Object.keys(
            categoryCounts
        );


    const values =
        Object.values(
            categoryCounts
        );


    if (!labels.length) {

        showEmptyChartMessage(
            canvas,
            "No category data yet."
        );

        return;

    }


    new Chart(
        canvas,
        {

            type: "bar",

            data: {

                labels,

                datasets: [

                    {

                        label:
                            "Your Memories",

                        data:
                            values,

                        backgroundColor:
                            "#06b6d4",

                        borderRadius:
                            6

                    }

                ]

            },

            options: {

                indexAxis:
                    "y",

                responsive:
                    true,

                plugins: {

                    legend: {

                        display:
                            false

                    }

                },

                scales: {

                    x: {

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
                                "rgba(255,255,255,0.05)"

                        }

                    },

                    y: {

                        ticks: {

                            color:
                                "#94a3b8"

                        },

                        grid: {

                            display:
                                false

                        }

                    }

                }

            }

        }
    );

}


/* =========================================================
   STORAGE BREAKDOWN
   ========================================================= */

function renderStorageChart() {

    const canvas =
        document.getElementById(
            "statsStoragePieChart"
        );


    if (!canvas) {

        return;

    }


    if (!statisticsMemories.length) {

        showEmptyChartMessage(
            canvas,
            "No storage data yet."
        );

        return;

    }


    /*
     * We currently know the number of
     * memory/media types, but we do not
     * calculate actual disk usage yet.
     *
     * Therefore this chart shows
     * media distribution by count,
     * not fake GB values.
     */


    const photoCount =
        statisticsMemories.filter(
            memory =>
                String(
                    memory.type || ""
                ).toLowerCase() ===
                "photo"
        ).length;


    const videoCount =
        statisticsMemories.filter(
            memory =>
                String(
                    memory.type || ""
                ).toLowerCase() ===
                "video"
        ).length;


    const audioCount =
        statisticsMemories.filter(
            memory =>
                Boolean(
                    memory.audioNote
                )
        ).length;


    const textCount =
        statisticsMemories.filter(
            memory =>
                Boolean(
                    memory.description
                )
        ).length;


    const labels = [];

    const values = [];


    if (photoCount > 0) {

        labels.push(
            "Photos"
        );

        values.push(
            photoCount
        );

    }


    if (videoCount > 0) {

        labels.push(
            "Videos"
        );

        values.push(
            videoCount
        );

    }


    if (audioCount > 0) {

        labels.push(
            "Audio Notes"
        );

        values.push(
            audioCount
        );

    }


    if (textCount > 0) {

        labels.push(
            "Journal / Text"
        );

        values.push(
            textCount
        );

    }


    if (!labels.length) {

        showEmptyChartMessage(
            canvas,
            "No media data yet."
        );

        return;

    }


    new Chart(
        canvas,
        {

            type: "pie",

            data: {

                labels,

                datasets: [

                    {

                        data:
                            values,

                        backgroundColor: [

                            "#6366f1",
                            "#ec4899",
                            "#f59e0b",
                            "#10b981"

                        ],

                        borderWidth:
                            0

                    }

                ]

            },

            options: {

                responsive:
                    true,

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
   ERROR MESSAGE
   ========================================================= */

function showStatisticsError(
    message
) {

    const containers = [
        "statsMonthlyLineChart",
        "statsEmotionDoughnutChart",
        "statsCategoryBarChart",
        "statsStoragePieChart"
    ];


    containers.forEach(
        id => {

            const canvas =
                document.getElementById(
                    id
                );


            if (!canvas) {

                return;

            }


            showEmptyChartMessage(
                canvas,
                message
            );

        }
    );

}


/* =========================================================
   EMPTY CHART MESSAGE
   ========================================================= */

function showEmptyChartMessage(
    canvas,
    message
) {

    const parent =
        canvas.parentElement;


    if (!parent) {

        return;

    }


    canvas.style.display =
        "none";


    /*
     * Prevent duplicate messages
     */

    const existing =
        parent.querySelector(
            ".statistics-empty-message"
        );


    if (existing) {

        existing.remove();

    }


    const messageElement =
        document.createElement(
            "div"
        );


    messageElement.className =
        "statistics-empty-message text-center py-5 text-secondary-custom";


    messageElement.innerHTML = `

        <i
            class="bi bi-bar-chart fs-1 text-muted-custom d-block mb-3">
        </i>

        <p class="mb-0">

            ${escapeHtml(
                message
            )}

        </p>

    `;


    parent.appendChild(
        messageElement
    );

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