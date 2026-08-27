/* ==========================================================================
   EchoLife User Notifications Controller
   ========================================================================== */

let userNotificationData = [];


/* =========================================================
   INITIALIZE
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        await loadUserNotifications();

    }
);


/* =========================================================
   LOAD USER MEMORIES
   ========================================================= */

async function loadUserNotifications() {

    try {

        const response =
            await fetch(
                "/api/memories",
                {
                    method: "GET",
                    credentials: "include"
                }
            );


        /* User not logged in */

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
                "Unable to load notifications."
            );

        }


        const memories =
            Array.isArray(data.memories)
                ? data.memories
                : [];


        userNotificationData =
            generateNotifications(
                memories
            );


        renderNotifications();


        updateNotificationBadge();


    } catch (error) {

        console.error(
            "Notification loading error:",
            error
        );


        const container =
            document.getElementById(
                "notificationsList"
            );


        if (container) {

            container.innerHTML = `

                <div
                    class="glass-card p-5 text-center">

                    <i
                        class="bi bi-exclamation-circle fs-1 text-danger mb-3 d-block">
                    </i>

                    <h5
                        class="text-white">

                        Unable to Load Notifications

                    </h5>


                    <p
                        class="text-secondary-custom">

                        ${escapeHtml(
                            error.message ||
                            "Please try again."
                        )}

                    </p>


                    <button
                        class="btn btn-aurora"
                        onclick="loadUserNotifications()">

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
   GENERATE NOTIFICATIONS
   ========================================================= */

function generateNotifications(
    memories
) {

    const notifications = [];

    const today =
        new Date();


    const currentMonth =
        today.getMonth() + 1;


    const currentDay =
        today.getDate();


    /* =====================================================
       ON THIS DAY THROWBACKS
       ===================================================== */

    memories.forEach(
        memory => {

            if (!memory.date) {

                return;

            }


            const memoryDate =
                new Date(
                    memory.date
                );


            if (
                Number.isNaN(
                    memoryDate.getTime()
                )
            ) {

                return;

            }


            const memoryMonth =
                memoryDate.getMonth() + 1;


            const memoryDay =
                memoryDate.getDate();


            const memoryYear =
                memoryDate.getFullYear();


            /*
             * Same month + same day,
             * but from a previous year.
             */

            if (
                memoryMonth === currentMonth &&
                memoryDay === currentDay &&
                memoryYear <
                    today.getFullYear()
            ) {

                const yearsAgo =
                    today.getFullYear() -
                    memoryYear;


                notifications.push({

                    id:
                        `throwback-${memory.id}`,

                    title:
                        "On This Day Throwback!",

                    message:
                        `${yearsAgo} year${
                            yearsAgo === 1
                                ? ""
                                : "s"
                        } ago today: ${memory.title}`,

                    time:
                        formatNotificationDate(
                            memory.date
                        ),

                    type:
                        "anniversary",

                    read:
                        false,

                    memoryId:
                        memory.id

                });

            }

        }
    );


    /* =====================================================
       RECENT MEMORIES
       ===================================================== */

    const recentMemories =
        memories
            .filter(
                memory =>
                    memory.date
            )
            .sort(
                (a, b) =>
                    new Date(b.date) -
                    new Date(a.date)
            )
            .slice(
                0,
                5
            );


    /*
     * Only create an "archived" notification
     * when the user actually has memories.
     */

    recentMemories.forEach(
        memory => {

            notifications.push({

                id:
                    `memory-${memory.id}`,

                title:
                    "Memory Archived",

                message:
                    `${memory.title} has been added to your personal memory vault.`,

                time:
                    formatNotificationDate(
                        memory.date
                    ),

                type:
                    "memory",

                read:
                    true,

                memoryId:
                    memory.id

            });

        }
    );


    /*
     * Sort newest/current events first.
     */

    return notifications;

}


/* =========================================================
   RENDER
   ========================================================= */

function renderNotifications() {

    const container =
        document.getElementById(
            "notificationsList"
        );


    if (!container) {

        return;

    }


    if (
        userNotificationData.length === 0
    ) {

        container.innerHTML = `

            <div
                class="glass-card p-5 text-center">

                <i
                    class="bi bi-bell-slash fs-1 text-muted-custom mb-3 d-block">
                </i>


                <h5
                    class="text-white">

                    No Notifications

                </h5>


                <p
                    class="text-secondary-custom mb-4">

                    You don't have any personal notifications yet.

                </p>


                <a
                    href="add-memory.html"
                    class="btn btn-aurora">

                    <i
                        class="bi bi-plus-circle me-1">
                    </i>

                    Create a Memory

                </a>

            </div>

        `;

        return;

    }


    container.innerHTML =
        userNotificationData
            .map(
                notification =>
                    createNotificationHTML(
                        notification
                    )
            )
            .join("");

}


/* =========================================================
   CREATE NOTIFICATION HTML
   ========================================================= */

function createNotificationHTML(
    notification
) {

    let icon =
        "bi-bell-fill";


    let iconColor =
        "text-primary";


    let borderColor =
        "border-primary";


    if (
        notification.type ===
        "anniversary"
    ) {

        icon =
            "bi-clock-history";

        iconColor =
            "text-warning";

        borderColor =
            "border-warning";

    }


    if (
        notification.type ===
        "memory"
    ) {

        icon =
            "bi-journal-check";

        iconColor =
            "text-success";

        borderColor =
            "border-success";

    }


    return `

        <div
            class="glass-card p-4 rounded-4 d-flex gap-3 align-items-start border-start border-4 ${borderColor}">

            <i
                class="bi ${icon} fs-3 ${iconColor}">
            </i>


            <div
                class="flex-grow-1">


                <div
                    class="d-flex justify-content-between align-items-center mb-1">

                    <h6
                        class="text-white font-heading mb-0">

                        ${escapeHtml(
                            notification.title
                        )}

                    </h6>


                    <span
                        class="small text-muted-custom">

                        ${escapeHtml(
                            notification.time
                        )}

                    </span>

                </div>


                <p
                    class="text-secondary-custom small mb-3">

                    ${escapeHtml(
                        notification.message
                    )}

                </p>


                ${
                    notification.memoryId
                        ? `

                            <a
                                href="timeline.html?id=${notification.memoryId}"
                                class="btn btn-aurora btn-sm">

                                <i
                                    class="bi bi-arrow-right-circle me-1">
                                </i>

                                Revisit Memory

                            </a>

                          `
                        : ""
                }


            </div>

        </div>

    `;

}


/* =========================================================
   MARK ALL READ
   ========================================================= */

function markAllNotificationsRead() {

    userNotificationData =
        userNotificationData.map(
            notification => ({

                ...notification,

                read:
                    true

            })
        );


    renderNotifications();

    updateNotificationBadge();


    if (
        typeof showToast ===
        "function"
    ) {

        showToast(
            "Marked Read",
            "All notifications marked as read.",
            "success"
        );

    }

}


/* =========================================================
   BADGE
   ========================================================= */

function updateNotificationBadge() {

    const unreadCount =
        userNotificationData.filter(
            notification =>
                !notification.read
        ).length;


    const badges =
        document.querySelectorAll(
            ".notif-badge-count"
        );


    badges.forEach(
        badge => {

            if (
                unreadCount ===
                0
            ) {

                badge.style.display =
                    "none";

            } else {

                badge.style.display =
                    "inline-block";


                badge.textContent =
                    unreadCount;

            }

        }
    );

}


/* =========================================================
   DATE FORMAT
   ========================================================= */

function formatNotificationDate(
    dateString
) {

    if (!dateString) {

        return "";

    }


    const date =
        new Date(
            dateString
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";

    }


    return date.toLocaleDateString(
        undefined,
        {
            year: "numeric",
            month: "short",
            day: "numeric"
        }
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