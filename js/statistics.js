/* ==========================================================================
   EchoLife User Statistics & Analytics Controller

   Database-backed version

   DESIGN PATTERN:
   Builder Pattern

   StatisticsReportBuilder incrementally constructs a complete
   StatisticsReport from the current user's memories.

   Existing functionality preserved:
   - User-specific database loading
   - Longest archiving streak
   - Dominant emotion
   - Most active month
   - Total media
   - Monthly Chart
   - Emotion Chart
   - Category Chart
   - Storage / Media Chart
   - Empty-state handling
   ========================================================================== */


/* =========================================================
   GLOBAL STATE
   ========================================================= */

let statisticsMemories = [];

let statisticsReport = null;


/* =========================================================
   BUILDER PATTERN
   ========================================================= */


/* =========================================================
   PRODUCT
   ========================================================= */

/*
 * StatisticsReport is the final product constructed
 * by StatisticsReportBuilder.
 */

class StatisticsReport {

    constructor() {

        /* Basic summary */

        this.totalMedia =
            0;

        this.longestStreak =
            0;

        this.dominantEmotion =
            null;

        this.dominantEmotionCount =
            0;

        this.dominantEmotionPercentage =
            0;

        this.activeMonth =
            null;


        /* Monthly statistics */

        this.monthLabels =
            [];

        this.monthlyCounts =
            [];


        /* Emotion statistics */

        this.emotionLabels =
            [];

        this.emotionValues =
            [];


        /* Category statistics */

        this.categoryLabels =
            [];

        this.categoryValues =
            [];


        /* Media statistics */

        this.mediaLabels =
            [];

        this.mediaValues =
            [];


        /* Additional summary */

        this.totalCategories =
            0;

        this.totalPeople =
            0;

        this.totalLocations =
            0;

        this.favoriteCount =
            0;

        this.photoCount =
            0;

        this.videoCount =
            0;

        this.audioCount =
            0;

        this.textCount =
            0;

    }

}


/* =========================================================
   BUILDER
   ========================================================= */

/*
 * StatisticsReportBuilder
 *
 * Each build method constructs one part of the final
 * statistics report and returns "this" so methods can
 * be chained.
 */

class StatisticsReportBuilder {

    constructor(
        memories
    ) {

        this.memories =
            Array.isArray(
                memories
            )
                ? memories
                : [];


        this.report =
            new StatisticsReport();

    }


    /* -------------------------------------------------------
       TOTAL MEDIA
       ------------------------------------------------------- */

    buildTotalMedia() {

        this.report.totalMedia =
            this.memories.length;


        return this;

    }


    /* -------------------------------------------------------
       LONGEST ARCHIVING STREAK
       ------------------------------------------------------- */

    buildLongestStreak() {

        const uniqueDates = [

            ...new Set(

                this.memories

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
                new Date(a) -
                new Date(b)
        );


        if (
            uniqueDates.length ===
            0
        ) {

            this.report.longestStreak =
                0;


            return this;

        }


        let longestStreak =
            1;


        let currentStreak =
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


            if (
                difference ===
                1
            ) {

                currentStreak++;


                longestStreak =
                    Math.max(
                        longestStreak,
                        currentStreak
                    );

            } else {

                currentStreak =
                    1;

            }

        }


        this.report.longestStreak =
            longestStreak;


        return this;

    }


    /* -------------------------------------------------------
       EMOTION STATISTICS
       ------------------------------------------------------- */

    buildEmotionStatistics() {

        const counts = {};


        this.memories.forEach(
            memory => {

                const emotion =
                    String(
                        memory.emotion ||
                        "Unspecified"
                    )
                        .trim();


                counts[emotion] =
                    (
                        counts[emotion] ||
                        0
                    ) + 1;

            }
        );


        const entries =
            Object.entries(
                counts
            )
            .sort(
                (a, b) =>
                    b[1] -
                    a[1]
            );


        this.report.emotionLabels =
            entries.map(
                entry =>
                    entry[0]
            );


        this.report.emotionValues =
            entries.map(
                entry =>
                    entry[1]
            );


        if (
            entries.length >
            0
        ) {

            const dominantEmotion =
                entries[0][0];


            const dominantCount =
                entries[0][1];


            this.report.dominantEmotion =
                dominantEmotion;


            this.report.dominantEmotionCount =
                dominantCount;


            this.report.dominantEmotionPercentage =
                this.memories.length
                    ? Math.round(
                        (
                            dominantCount /
                            this.memories.length
                        ) *
                        100
                    )
                    : 0;

        }


        return this;

    }


    /* -------------------------------------------------------
       MOST ACTIVE MONTH
       ------------------------------------------------------- */

    buildActiveMonth() {

        const monthCounts =
            new Array(
                12
            ).fill(
                0
            );


        this.memories.forEach(
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
            (
                count,
                index
            ) => {

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


        this.report.activeMonth =
            mostActiveMonthIndex >= 0
                ? monthNames[
                    mostActiveMonthIndex
                ]
                : null;


        return this;

    }


    /* -------------------------------------------------------
       MONTHLY STATISTICS
       ------------------------------------------------------- */

    buildMonthlyStatistics() {

        const monthlyCounts =
            new Array(
                12
            ).fill(
                0
            );


        this.memories.forEach(
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


                monthlyCounts[
                    date.getMonth()
                ]++;

            }
        );


        this.report.monthLabels = [

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

        ];


        this.report.monthlyCounts =
            monthlyCounts;


        return this;

    }


    /* -------------------------------------------------------
       CATEGORY STATISTICS
       ------------------------------------------------------- */

    buildCategoryStatistics() {

        const categoryCounts =
            {};


        this.memories.forEach(
            memory => {

                const category =
                    String(
                        memory.category ||
                        "Uncategorized"
                    )
                        .trim();


                categoryCounts[
                    category
                ] =
                    (
                        categoryCounts[
                            category
                        ] ||
                        0
                    ) + 1;

            }
        );


        const entries =
            Object.entries(
                categoryCounts
            )
            .sort(
                (a, b) =>
                    b[1] -
                    a[1]
            );


        this.report.categoryLabels =
            entries.map(
                entry =>
                    entry[0]
            );


        this.report.categoryValues =
            entries.map(
                entry =>
                    entry[1]
            );


        this.report.totalCategories =
            entries.length;


        return this;

    }


    /* -------------------------------------------------------
       MEDIA / STORAGE STATISTICS
       ------------------------------------------------------- */

    buildMediaStatistics() {

        const photoCount =
            this.memories.filter(
                memory =>
                    String(
                        memory.type ||
                        ""
                    )
                        .toLowerCase() ===
                    "photo"
            ).length;


        const videoCount =
            this.memories.filter(
                memory =>
                    String(
                        memory.type ||
                        ""
                    )
                        .toLowerCase() ===
                    "video"
            ).length;


        const audioCount =
            this.memories.filter(
                memory =>
                    Boolean(
                        memory.audioNote
                    )
            ).length;


        const textCount =
            this.memories.filter(
                memory =>
                    Boolean(
                        memory.description
                    )
            ).length;


        this.report.photoCount =
            photoCount;


        this.report.videoCount =
            videoCount;


        this.report.audioCount =
            audioCount;


        this.report.textCount =
            textCount;


        const labels =
            [];


        const values =
            [];


        if (
            photoCount >
            0
        ) {

            labels.push(
                "Photos"
            );


            values.push(
                photoCount
            );

        }


        if (
            videoCount >
            0
        ) {

            labels.push(
                "Videos"
            );


            values.push(
                videoCount
            );

        }


        if (
            audioCount >
            0
        ) {

            labels.push(
                "Audio Notes"
            );


            values.push(
                audioCount
            );

        }


        if (
            textCount >
            0
        ) {

            labels.push(
                "Journal / Text"
            );


            values.push(
                textCount
            );

        }


        this.report.mediaLabels =
            labels;


        this.report.mediaValues =
            values;


        return this;

    }


    /* -------------------------------------------------------
       FAVORITES
       ------------------------------------------------------- */

    buildFavorites() {

        this.report.favoriteCount =
            this.memories.filter(
                memory =>
                    Boolean(
                        memory.isFavorite
                    )
            ).length;


        return this;

    }


    /* -------------------------------------------------------
       PEOPLE
       ------------------------------------------------------- */

    buildPeopleStatistics() {

        const people =
            new Set();


        this.memories.forEach(
            memory => {

                if (
                    !Array.isArray(
                        memory.people
                    )
                ) {

                    return;

                }


                memory.people.forEach(
                    person => {

                        const value =
                            String(
                                person ||
                                ""
                            ).trim();


                        if (
                            value
                        ) {

                            people.add(
                                value
                            );

                        }

                    }
                );

            }
        );


        this.report.totalPeople =
            people.size;


        return this;

    }


    /* -------------------------------------------------------
       LOCATIONS
       ------------------------------------------------------- */

    buildLocationStatistics() {

        const locations =
            new Set();


        this.memories.forEach(
            memory => {

                const location =
                    String(
                        memory.location ||
                        ""
                    ).trim();


                if (
                    location
                ) {

                    locations.add(
                        location
                    );

                }

            }
        );


        this.report.totalLocations =
            locations.size;


        return this;

    }


    /* -------------------------------------------------------
       FINAL PRODUCT
       ------------------------------------------------------- */

    build() {

        return this.report;

    }

}


/* =========================================================
   INITIALIZE PAGE
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        if (
            typeof Chart ===
            "undefined"
        ) {

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


        /* ---------------------------------------------------
           NOT LOGGED IN
           --------------------------------------------------- */

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


        /* ---------------------------------------------------
           API ERROR
           --------------------------------------------------- */

        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Unable to load statistics."
            );

        }


        /* ---------------------------------------------------
           SAVE USER MEMORIES
           --------------------------------------------------- */

        statisticsMemories =
            Array.isArray(
                data.memories
            )
                ? data.memories
                : [];


        /* ===================================================
           BUILDER PATTERN
           ===================================================
           
           Build one complete StatisticsReport step by step.
        */

        statisticsReport =
            new StatisticsReportBuilder(
                statisticsMemories
            )

                .buildTotalMedia()

                .buildLongestStreak()

                .buildEmotionStatistics()

                .buildActiveMonth()

                .buildMonthlyStatistics()

                .buildCategoryStatistics()

                .buildMediaStatistics()

                .buildFavorites()

                .buildPeopleStatistics()

                .buildLocationStatistics()

                .build();


        /* ---------------------------------------------------
           RENDER EVERYTHING
           --------------------------------------------------- */

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

    renderBuilderSummary();

    renderMonthlyChart();

    renderEmotionChart();

    renderCategoryChart();

    renderStorageChart();

}


/* =========================================================
   SUMMARY CARDS
   ========================================================= */

function renderSummaryCards() {

    if (
        !statisticsReport
    ) {

        return;

    }


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

    if (
        totalElement
    ) {

        totalElement.innerHTML = `

            <i
                class="bi bi-file-earmark-image text-info me-2">
            </i>

            ${statisticsReport.totalMedia}

            File${
                statisticsReport.totalMedia ===
                1
                    ? ""
                    : "s"
            }

        `;

    }


    /* =====================================================
       EMPTY ACCOUNT
       ===================================================== */

    if (
        statisticsReport.totalMedia ===
        0
    ) {

        if (
            streakElement
        ) {

            streakElement.innerHTML = `

                <i
                    class="bi bi-fire text-danger me-2">
                </i>

                0 Days

            `;

        }


        if (
            emotionElement
        ) {

            emotionElement.innerHTML = `

                <i
                    class="bi bi-sun text-warning me-2">
                </i>

                No Data

            `;

        }


        if (
            monthElement
        ) {

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
       LONGEST STREAK
       ===================================================== */

    if (
        streakElement
    ) {

        streakElement.innerHTML = `

            <i
                class="bi bi-fire text-danger me-2">
            </i>

            ${statisticsReport.longestStreak}

            Day${
                statisticsReport.longestStreak ===
                1
                    ? ""
                    : "s"
            }

        `;

    }


    /* =====================================================
       DOMINANT EMOTION
       ===================================================== */

    if (
        emotionElement
    ) {

        if (
            statisticsReport.dominantEmotion
        ) {

            emotionElement.innerHTML = `

                <i
                    class="bi bi-sun text-warning me-2">
                </i>

                ${escapeHtml(
                    statisticsReport.dominantEmotion
                )}

                (
                    ${statisticsReport.dominantEmotionPercentage}%
                )

            `;

        } else {

            emotionElement.innerHTML = `

                <i
                    class="bi bi-sun text-warning me-2">
                </i>

                No Data

            `;

        }

    }


    /* =====================================================
       MOST ACTIVE MONTH
       ===================================================== */

    if (
        monthElement
    ) {

        monthElement.innerHTML = `

            <i
                class="bi bi-calendar2-check text-primary me-2">
            </i>

            ${
                escapeHtml(
                    statisticsReport.activeMonth ||
                    "No Data"
                )
            }

        `;

    }

}


/* =========================================================
   BUILDER SUMMARY
   ========================================================= */

function renderBuilderSummary() {

    if (
        !statisticsReport
    ) {

        return;

    }


    const categoryElement =
        document.getElementById(
            "statsTotalCategories"
        );


    const peopleElement =
        document.getElementById(
            "statsTotalPeople"
        );


    const locationElement =
        document.getElementById(
            "statsTotalLocations"
        );


    const favoriteElement =
        document.getElementById(
            "statsFavoriteCount"
        );


    if (
        categoryElement
    ) {

        categoryElement.textContent =
            statisticsReport.totalCategories;

    }


    if (
        peopleElement
    ) {

        peopleElement.textContent =
            statisticsReport.totalPeople;

    }


    if (
        locationElement
    ) {

        locationElement.textContent =
            statisticsReport.totalLocations;

    }


    if (
        favoriteElement
    ) {

        favoriteElement.textContent =
            statisticsReport.favoriteCount;

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


    if (
        !canvas ||
        !statisticsReport
    ) {

        return;

    }


    const parent =
        canvas.parentElement;


    /*
     * Restore canvas if a previous empty state
     * had hidden it.
     */

    canvas.style.display =
        "";


    if (
        parent
    ) {

        const oldMessage =
            parent.querySelector(
                ".statistics-empty-message"
            );


        if (
            oldMessage
        ) {

            oldMessage.remove();

        }

    }


    /*
     * Prevent duplicate Chart.js instances.
     */

    if (
        typeof Chart.getChart ===
        "function"
    ) {

        const existingChart =
            Chart.getChart(
                canvas
            );


        if (
            existingChart
        ) {

            existingChart.destroy();

        }

    }


    new Chart(
        canvas,
        {

            type:
                "line",


            data: {

                labels:
                    statisticsReport.monthLabels,


                datasets: [

                    {

                        label:
                            "Your Memories",


                        data:
                            statisticsReport.monthlyCounts,


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
                    false,


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


    if (
        !canvas ||
        !statisticsReport
    ) {

        return;

    }


    if (
        typeof Chart.getChart ===
        "function"
    ) {

        const existingChart =
            Chart.getChart(
                canvas
            );


        if (
            existingChart
        ) {

            existingChart.destroy();

        }

    }


    if (
        !statisticsReport.emotionLabels.length
    ) {

        showEmptyChartMessage(
            canvas,
            "No emotion data yet."
        );


        return;

    }


    canvas.style.display =
        "";


    new Chart(
        canvas,
        {

            type:
                "doughnut",


            data: {

                labels:
                    statisticsReport.emotionLabels,


                datasets: [

                    {

                        data:
                            statisticsReport.emotionValues,


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


    if (
        !canvas ||
        !statisticsReport
    ) {

        return;

    }


    if (
        typeof Chart.getChart ===
        "function"
    ) {

        const existingChart =
            Chart.getChart(
                canvas
            );


        if (
            existingChart
        ) {

            existingChart.destroy();

        }

    }


    if (
        !statisticsReport.categoryLabels.length
    ) {

        showEmptyChartMessage(
            canvas,
            "No category data yet."
        );


        return;

    }


    canvas.style.display =
        "";


    new Chart(
        canvas,
        {

            type:
                "bar",


            data: {

                labels:
                    statisticsReport.categoryLabels,


                datasets: [

                    {

                        label:
                            "Your Memories",


                        data:
                            statisticsReport.categoryValues,


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
   MEDIA / STORAGE BREAKDOWN
   ========================================================= */

function renderStorageChart() {

    const canvas =
        document.getElementById(
            "statsStoragePieChart"
        );


    if (
        !canvas ||
        !statisticsReport
    ) {

        return;

    }


    if (
        typeof Chart.getChart ===
        "function"
    ) {

        const existingChart =
            Chart.getChart(
                canvas
            );


        if (
            existingChart
        ) {

            existingChart.destroy();

        }

    }


    if (
        !statisticsReport.mediaLabels.length
    ) {

        showEmptyChartMessage(
            canvas,
            "No storage data yet."
        );


        return;

    }


    canvas.style.display =
        "";


    new Chart(
        canvas,
        {

            type:
                "pie",


            data: {

                labels:
                    statisticsReport.mediaLabels,


                datasets: [

                    {

                        data:
                            statisticsReport.mediaValues,


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


            if (
                !canvas
            ) {

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


    if (
        !parent
    ) {

        return;

    }


    /*
     * Destroy an existing Chart.js instance
     * before replacing it with the empty message.
     */

    if (
        typeof Chart.getChart ===
        "function"
    ) {

        const existingChart =
            Chart.getChart(
                canvas
            );


        if (
            existingChart
        ) {

            existingChart.destroy();

        }

    }


    canvas.style.display =
        "none";


    /*
     * Prevent duplicate messages.
     */

    const existing =
        parent.querySelector(
            ".statistics-empty-message"
        );


    if (
        existing
    ) {

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
            class="bi bi-bar-chart fs-1 text-muted-custom d-block mb-3"
        ></i>

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