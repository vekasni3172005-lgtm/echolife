/* ==========================================================================
   EchoLife User Calendar Controller
   ========================================================================== */

let calendarMemories = [];

let currentDate = new Date();


/* =========================================================
   INITIALIZE
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        await loadCalendarMemories();

        initCalendarNav();

    }
);


/* =========================================================
   LOAD USER MEMORIES
   ========================================================= */

async function loadCalendarMemories() {

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
                "Unable to load calendar memories."
            );

        }


        calendarMemories =
            Array.isArray(data.memories)
                ? data.memories
                : [];


        renderCalendar(
            currentDate
        );


    } catch (error) {

        console.error(
            "Calendar loading error:",
            error
        );


        const gridContainer =
            document.getElementById(
                "calendarGridCells"
            );


        if (gridContainer) {

            gridContainer.innerHTML = `

                <div
                    class="col-12 text-center py-5">

                    <i
                        class="bi bi-exclamation-circle fs-1 text-danger mb-3 d-block">
                    </i>

                    <h5 class="text-white">
                        Unable to Load Calendar
                    </h5>

                    <p class="text-secondary-custom">
                        ${escapeHtml(
                            error.message ||
                            "Please try again."
                        )}
                    </p>

                    <button
                        class="btn btn-aurora mt-2"
                        onclick="loadCalendarMemories()">

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
   CALENDAR NAVIGATION
   ========================================================= */

function initCalendarNav() {

    const prevBtn =
        document.getElementById(
            "calPrevMonth"
        );


    const nextBtn =
        document.getElementById(
            "calNextMonth"
        );


    if (prevBtn) {

        prevBtn.addEventListener(
            "click",
            () => {

                currentDate =
                    new Date(
                        currentDate.getFullYear(),
                        currentDate.getMonth() - 1,
                        1
                    );


                renderCalendar(
                    currentDate
                );

            }
        );

    }


    if (nextBtn) {

        nextBtn.addEventListener(
            "click",
            () => {

                currentDate =
                    new Date(
                        currentDate.getFullYear(),
                        currentDate.getMonth() + 1,
                        1
                    );


                renderCalendar(
                    currentDate
                );

            }
        );

    }

}


/* =========================================================
   RENDER CALENDAR
   ========================================================= */

function renderCalendar(
    date
) {

    const monthYearLabel =
        document.getElementById(
            "calMonthYearLabel"
        );


    const gridContainer =
        document.getElementById(
            "calendarGridCells"
        );


    if (!gridContainer) {

        return;

    }


    const year =
        date.getFullYear();


    const month =
        date.getMonth();


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


    if (monthYearLabel) {

        monthYearLabel.textContent =
            `${monthNames[month]} ${year}`;

    }


    const firstDayIndex =
        new Date(
            year,
            month,
            1
        ).getDay();


    const lastDate =
        new Date(
            year,
            month + 1,
            0
        ).getDate();


    const prevLastDate =
        new Date(
            year,
            month,
            0
        ).getDate();


    let cellsHTML =
        "";


    /* =====================================================
       PREVIOUS MONTH DAYS
       ===================================================== */

    for (
        let x = firstDayIndex;
        x > 0;
        x--
    ) {

        cellsHTML += `

            <div
                class="calendar-day-cell other-month">

                <span
                    class="day-number text-muted-custom">

                    ${prevLastDate - x + 1}

                </span>

            </div>

        `;

    }


    /* =====================================================
       CURRENT MONTH DAYS
       ===================================================== */

    for (
        let i = 1;
        i <= lastDate;
        i++
    ) {

        const formattedDay =
            i < 10
                ? `0${i}`
                : `${i}`;


        const formattedMonth =
            (month + 1) < 10
                ? `0${month + 1}`
                : `${month + 1}`;


        const fullDateStr =
            `${year}-${formattedMonth}-${formattedDay}`;


        /*
         * Exact memories for this user.
         */
        const dayMemories =
            calendarMemories.filter(
                memory =>
                    memory.date ===
                    fullDateStr
            );


        /*
         * Anniversary memories.
         *
         * Example:
         *
         * Memory: 2024-08-26
         * Current date: 2026-08-26
         *
         * It will appear as a throwback.
         */
        const anniversaryMemories =
            calendarMemories.filter(
                memory =>
                    memory.date &&
                    memory.date.endsWith(
                        `-${formattedMonth}-${formattedDay}`
                    ) &&
                    memory.date !==
                        fullDateStr
            );


        const totalEvents =
            dayMemories.length +
            anniversaryMemories.length;


        /* Real today's date */
        const today =
            new Date();


        const isToday =
            i === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear();


        cellsHTML += `

            <div
                class="calendar-day-cell ${
                    isToday
                        ? "today"
                        : ""
                }"
                onclick="selectCalendarDate('${fullDateStr}')">

                <div
                    class="d-flex justify-content-between align-items-center">

                    <span
                        class="day-number text-white">

                        ${i}

                    </span>


                    ${
                        isToday
                            ? `
                                <span
                                    class="badge bg-primary rounded-pill"
                                    style="font-size:0.6rem;">

                                    Today

                                </span>
                              `
                            : ""
                    }

                </div>


                ${
                    totalEvents > 0
                        ? `

                            <div
                                class="day-memories-pill mt-2">

                                <i
                                    class="bi bi-journal-bookmark-fill">
                                </i>

                                <span>

                                    ${totalEvents}

                                    Memory${
                                        totalEvents > 1
                                            ? "ies"
                                            : ""
                                    }

                                </span>

                            </div>

                          `
                        : ""
                }

            </div>

        `;

    }


    gridContainer.innerHTML =
        cellsHTML;

}


/* =========================================================
   SELECT DATE
   ========================================================= */

function selectCalendarDate(
    dateStr
) {

    const monthDay =
        dateStr.substring(5);


    /*
     * Exact-date memories
     * plus anniversary memories.
     */
    const matched =
        calendarMemories.filter(
            memory =>
                memory.date ===
                    dateStr ||
                (
                    memory.date &&
                    memory.date.endsWith(
                        monthDay
                    )
                )
        );


    let drawerEl =
        document.getElementById(
            "calendarDateDrawer"
        );


    /* =====================================================
       CREATE DRAWER / MODAL
       ===================================================== */

    if (!drawerEl) {

        const drawerHTML = `

            <div
                class="modal fade"
                id="calendarDateDrawer"
                tabindex="-1">

                <div
                    class="modal-dialog modal-dialog-centered">

                    <div
                        class="modal-content glass-modal p-4">

                        <div
                            class="d-flex justify-content-between align-items-center mb-3">

                            <h5
                                id="drawerDateTitle"
                                class="text-white font-heading mb-0">
                            </h5>


                            <button
                                type="button"
                                class="btn-close btn-close-white"
                                data-bs-dismiss="modal">
                            </button>

                        </div>


                        <div
                            id="drawerMemoriesList"
                            class="mt-2"
                            style="max-height:400px;overflow-y:auto;">
                        </div>

                    </div>

                </div>

            </div>

        `;


        document.body.insertAdjacentHTML(
            "beforeend",
            drawerHTML
        );


        drawerEl =
            document.getElementById(
                "calendarDateDrawer"
            );

    }


    /* =====================================================
       DRAWER CONTENT
       ===================================================== */

    const drawerTitle =
        document.getElementById(
            "drawerDateTitle"
        );


    const listContainer =
        document.getElementById(
            "drawerMemoriesList"
        );


    drawerTitle.innerHTML = `

        <i
            class="bi bi-calendar-event text-gradient me-2">
        </i>

        ${escapeHtml(
            dateStr
        )}

    `;


    if (!matched.length) {

        listContainer.innerHTML = `

            <div
                class="text-center my-4">

                <i
                    class="bi bi-journal-x fs-2 text-muted-custom">
                </i>

                <p
                    class="text-muted-custom text-center mt-3 mb-2">

                    No archived memories for this date yet.

                </p>


                <a
                    href="add-memory.html"
                    class="btn btn-aurora btn-sm">

                    <i
                        class="bi bi-plus-circle me-1">
                    </i>

                    Create Memory

                </a>

            </div>

        `;

    } else {

        listContainer.innerHTML =
            matched
                .map(
                    memory => `

                        <div
                            class="glass-card glass-card-hover p-3 mb-3 rounded-3 d-flex gap-3 align-items-center cursor-pointer"
                            onclick="window.location.href='timeline.html?id=${memory.id}'">


                            ${
                                memory.coverImage
                                    ? `

                                    <img
                                        src="${escapeHtml(
                                            memory.coverImage
                                        )}"
                                        class="rounded-3"
                                        style="width:60px;height:60px;object-fit:cover;"
                                        alt="${escapeHtml(
                                            memory.title
                                        )}"
                                    >

                                    `
                                    : `

                                    <div
                                        class="rounded-3 d-flex align-items-center justify-content-center bg-secondary"
                                        style="width:60px;height:60px;">

                                        <i
                                            class="bi bi-journal-text text-white fs-4">
                                        </i>

                                    </div>

                                    `
                            }


                            <div
                                class="min-w-0">

                                <h6
                                    class="text-white mb-1">

                                    ${escapeHtml(
                                        memory.title || ""
                                    )}

                                </h6>


                                <p
                                    class="text-secondary-custom small mb-0">

                                    <i
                                        class="bi bi-geo-alt me-1">
                                    </i>

                                    ${escapeHtml(
                                        memory.location || ""
                                    )}

                                    •


                                    ${escapeHtml(
                                        memory.date || ""
                                    )}

                                </p>


                                ${
                                    memory.date &&
                                    memory.date !== dateStr
                                        ? `

                                        <span
                                            class="badge bg-primary bg-opacity-20 text-info mt-1">

                                            Throwback

                                        </span>

                                        `
                                        : ""
                                }

                            </div>

                        </div>

                    `
                )
                .join("");

    }


    /* =====================================================
       SHOW
       ===================================================== */

    const bsModal =
        new bootstrap.Modal(
            drawerEl
        );


    bsModal.show();

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