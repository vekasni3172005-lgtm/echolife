/* ==========================================================================
   EchoLife Core Application Script
   Database-backed version
   ========================================================================== */


/* =========================================================
   INITIALIZE APPLICATION
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initAppShell();

        initGlobalSearch();

        initAOS();

    }
);


/* =========================================================
   AOS
   ========================================================= */

function initAOS() {

    if (
        typeof AOS !== "undefined"
    ) {

        AOS.init({

            duration:
                800,

            once:
                true,

            easing:
                "ease-out-cubic"

        });

    }

}


/* =========================================================
   APP SHELL
   ========================================================= */

async function initAppShell() {

    const currentPath =
        window.location.pathname
            .split("/")
            .pop() ||
        "index.html";


    /* -------------------------------------------------------
       MOBILE SIDEBAR
       ------------------------------------------------------- */

    const sidebarToggleBtns =
        document.querySelectorAll(
            ".sidebar-toggle-btn"
        );


    const sidebar =
        document.querySelector(
            ".app-sidebar"
        );


    sidebarToggleBtns.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    if (sidebar) {

                        sidebar.classList.toggle(
                            "show"
                        );

                    }

                }
            );

        }
    );


    /* -------------------------------------------------------
       ACTIVE SIDEBAR LINK
       ------------------------------------------------------- */

    const navLinks =
        document.querySelectorAll(
            ".sidebar-link"
        );


    navLinks.forEach(
        link => {

            const href =
                link.getAttribute(
                    "href"
                );


            if (
                href ===
                    currentPath ||
                (
                    currentPath === "" &&
                    href === "index.html"
                )
            ) {

                link.classList.add(
                    "active"
                );

            }

        }
    );


    /* -------------------------------------------------------
       LOAD REAL LOGGED-IN USER
       ------------------------------------------------------- */

    await loadCurrentUserIntoShell();


    /* -------------------------------------------------------
       LOAD NOTIFICATION COUNT
       ------------------------------------------------------- */

    await loadNotificationCount();

}


/* =========================================================
   LOAD CURRENT USER
   ========================================================= */

async function loadCurrentUserIntoShell() {

    try {

        const response =
            await fetch(
                "/api/auth/me",
                {
                    method:
                        "GET",

                    credentials:
                        "include"
                }
            );


        /*
         * User isn't logged in.
         *
         * We don't automatically redirect here because
         * index/login/public pages may legitimately be
         * accessible without a session.
         */

        if (
            response.status ===
            401
        ) {

            return;

        }


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            return;

        }


        const user =
            data.user;


        if (!user) {

            return;

        }


        /* ---------------------------------------------------
           USER NAME
           --------------------------------------------------- */

        const userNameElements =
            document.querySelectorAll(
                ".user-display-name"
            );


        userNameElements.forEach(
            element => {

                element.textContent =
                    user.username ||
                    "User";

            }
        );


        /* ---------------------------------------------------
           AVATAR
           --------------------------------------------------- */

        /*
         * Profile data includes the real profile image.
         */

        try {

            const profileResponse =
                await fetch(
                    "/api/profile",
                    {
                        method:
                            "GET",

                        credentials:
                            "include"
                    }
                );


            if (
                profileResponse.ok
            ) {

                const profileData =
                    await profileResponse.json();


                if (
                    profileData.success &&
                    profileData.profile
                ) {

                    const profile =
                        profileData.profile;


                    const userAvatars =
                        document.querySelectorAll(
                            ".user-avatar"
                        );


                    userAvatars.forEach(
                        image => {

                            if (
                                profile.profileImage
                            ) {

                                image.src =
                                    profile.profileImage;

                            }

                        }
                    );


                    /*
                     * Display full name where requested.
                     */

                    const fullNameElements =
                        document.querySelectorAll(
                            ".user-display-full-name"
                        );


                    fullNameElements.forEach(
                        element => {

                            element.textContent =
                                profile.fullName ||
                                user.username ||
                                "User";

                        }
                    );

                }

            }

        } catch (profileError) {

            console.warn(
                "Unable to load profile image:",
                profileError
            );

        }


    } catch (error) {

        console.error(
            "Current user shell error:",
            error
        );

    }

}


/* =========================================================
   NOTIFICATION COUNT
   ========================================================= */

async function loadNotificationCount() {

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


        if (
            response.status ===
            401
        ) {

            hideNotificationBadges();

            return;

        }


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            hideNotificationBadges();

            return;

        }


        const memories =
            Array.isArray(
                data.memories
            )
                ? data.memories
                : [];


        /*
         * Generate a simple user-specific count.
         *
         * Here we count memories that have today's
         * month/day anniversary or recent memories.
         */

        const count =
            calculateNotificationCount(
                memories
            );


        updateNotificationBadges(
            count
        );


    } catch (error) {

        console.error(
            "Notification count error:",
            error
        );


        hideNotificationBadges();

    }

}


/* =========================================================
   CALCULATE NOTIFICATION COUNT
   ========================================================= */

function calculateNotificationCount(
    memories
) {

    if (
        !Array.isArray(
            memories
        )
    ) {

        return 0;

    }


    const today =
        new Date();


    const todayMonth =
        today.getMonth();


    const todayDay =
        today.getDate();


    let count = 0;


    memories.forEach(
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


            /*
             * On This Day from a previous year.
             */

            if (
                date.getMonth() ===
                    todayMonth &&
                date.getDate() ===
                    todayDay &&
                date.getFullYear() <
                    today.getFullYear()
            ) {

                count++;

            }

        }
    );


    return count;

}


/* =========================================================
   UPDATE NOTIFICATION BADGES
   ========================================================= */

function updateNotificationBadges(
    count
) {

    const badges =
        document.querySelectorAll(
            ".notif-badge-count"
        );


    badges.forEach(
        badge => {

            badge.textContent =
                count;


            if (
                count === 0
            ) {

                badge.style.display =
                    "none";

            } else {

                badge.style.display =
                    "";

            }

        }
    );

}


/* =========================================================
   HIDE NOTIFICATION BADGES
   ========================================================= */

function hideNotificationBadges() {

    const badges =
        document.querySelectorAll(
            ".notif-badge-count"
        );


    badges.forEach(
        badge => {

            badge.style.display =
                "none";

        }
    );

}


/* =========================================================
   UNIVERSAL TOAST
   ========================================================= */

function showToast(
    title,
    message,
    type = "info"
) {

    let container =
        document.querySelector(
            ".toast-container-custom"
        );


    if (
        !container
    ) {

        container =
            document.createElement(
                "div"
            );


        container.className =
            "toast-container-custom";


        document.body.appendChild(
            container
        );

    }


    const iconMap = {

        info:
            "bi-info-circle-fill text-info",

        success:
            "bi-check-circle-fill text-success",

        warning:
            "bi-exclamation-triangle-fill text-warning",

        danger:
            "bi-x-circle-fill text-danger"

    };


    const toast =
        document.createElement(
            "div"
        );


    toast.className =
        "toast-custom";


    toast.innerHTML = `

        <i
            class="bi ${
                iconMap[type] ||
                iconMap.info
            } fs-4">
        </i>

        <div>

            <div
                class="fw-bold fs-6">

                ${escapeHtml(
                    title
                )}

            </div>

            <div
                class="text-secondary-custom small">

                ${escapeHtml(
                    message
                )}

            </div>

        </div>

        <button
            type="button"
            class="btn-close ms-auto text-white"
            aria-label="Close"
            onclick="this.parentElement.remove()">
        </button>

    `;


    container.appendChild(
        toast
    );


    setTimeout(
        () => {

            if (
                toast.parentElement
            ) {

                toast.style.opacity =
                    "0";


                toast.style.transform =
                    "translateX(50px)";


                toast.style.transition =
                    "all 0.3s ease";


                setTimeout(
                    () => {

                        toast.remove();

                    },
                    300
                );

            }

        },
        4000
    );

}


/* =========================================================
   GLOBAL SEARCH
   ========================================================= */

function initGlobalSearch() {

    const searchTriggers =
        document.querySelectorAll(
            ".search-bar-trigger"
        );


    searchTriggers.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    openSearchModal();

                }
            );

        }
    );

}


/* =========================================================
   OPEN SEARCH MODAL
   ========================================================= */

function openSearchModal() {

    let searchModalEl =
        document.getElementById(
            "globalSearchModal"
        );


    if (
        !searchModalEl
    ) {

        const modalHTML = `

            <div
                class="modal fade"
                id="globalSearchModal"
                tabindex="-1"
                aria-hidden="true">

                <div
                    class="modal-dialog modal-dialog-centered modal-lg">

                    <div
                        class="modal-content glass-modal p-4">


                        <div
                            class="d-flex align-items-center gap-3 mb-3">

                            <i
                                class="bi bi-search fs-4 text-gradient">
                            </i>


                            <input
                                type="text"
                                id="globalSearchInput"
                                class="form-control form-control-custom fs-5"
                                placeholder="Search your memories..."
                                autocomplete="off">

                        </div>


                        <div
                            id="globalSearchResults"
                            class="mt-3"
                            style="
                                max-height:350px;
                                overflow-y:auto;
                            "
                        >

                            <p
                                class="text-muted-custom small text-center my-4">

                                Type something to search through
                                your EchoLife archive...

                            </p>

                        </div>


                    </div>

                </div>

            </div>

        `;


        document.body.insertAdjacentHTML(
            "beforeend",
            modalHTML
        );


        searchModalEl =
            document.getElementById(
                "globalSearchModal"
            );


        const searchInput =
            document.getElementById(
                "globalSearchInput"
            );


        searchInput.addEventListener(
            "input",
            event => {

                runGlobalSearch(
                    event.target.value
                );

            }
        );


        /*
         * Load current user's memories once
         * when the modal is opened.
         */

        searchInput.addEventListener(
            "focus",
            () => {

                if (
                    !searchInput.value.trim()
                ) {

                    const resultsContainer =
                        document.getElementById(
                            "globalSearchResults"
                        );


                    if (
                        resultsContainer
                    ) {

                        resultsContainer.innerHTML = `

                            <p
                                class="text-muted-custom small text-center my-4">

                                Type a keyword to search
                                your memories.

                            </p>

                        `;

                    }

                }

            }
        );

    }


    const bsModal =
        bootstrap.Modal.getOrCreateInstance(
            searchModalEl
        );


    bsModal.show();


    setTimeout(
        () => {

            const searchInput =
                document.getElementById(
                    "globalSearchInput"
                );


            if (
                searchInput
            ) {

                searchInput.focus();

            }

        },
        300
    );

}


/* =========================================================
   RUN GLOBAL SEARCH
   ========================================================= */

async function runGlobalSearch(
    searchText
) {

    const query =
        String(
            searchText ||
            ""
        )
            .toLowerCase()
            .trim();


    const resultsContainer =
        document.getElementById(
            "globalSearchResults"
        );


    if (
        !resultsContainer
    ) {

        return;

    }


    if (
        !query
    ) {

        resultsContainer.innerHTML = `

            <p
                class="text-muted-custom small text-center my-4">

                Type something to search...

            </p>

        `;

        return;

    }


    resultsContainer.innerHTML = `

        <div
            class="text-center py-4">

            <div
                class="spinner-border spinner-border-sm text-info"
                role="status">
            </div>

            <span
                class="text-secondary-custom small ms-2">

                Searching your archive...

            </span>

        </div>

    `;


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


        if (
            response.status ===
            401
        ) {

            resultsContainer.innerHTML = `

                <p
                    class="text-danger text-center my-4">

                    Please log in to search your memories.

                </p>

            `;

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
                "Unable to search memories."
            );

        }


        const memories =
            Array.isArray(
                data.memories
            )
                ? data.memories
                : [];


        const filtered =
            memories.filter(
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


        renderSearchResults(
            filtered
        );


    } catch (error) {

        console.error(
            "Global search error:",
            error
        );


        resultsContainer.innerHTML = `

            <div
                class="text-center my-4">

                <i
                    class="bi bi-exclamation-circle fs-3 text-danger">
                </i>

                <p
                    class="text-secondary-custom mt-2 mb-0">

                    ${escapeHtml(
                        error.message ||
                        "Unable to search your memories."
                    )}

                </p>

            </div>

        `;

    }

}


/* =========================================================
   RENDER SEARCH RESULTS
   ========================================================= */

function renderSearchResults(
    memories
) {

    const resultsContainer =
        document.getElementById(
            "globalSearchResults"
        );


    if (
        !resultsContainer
    ) {

        return;

    }


    if (
        !memories.length
    ) {

        resultsContainer.innerHTML = `

            <div
                class="text-center my-4">

                <i
                    class="bi bi-search fs-2 text-muted-custom">
                </i>

                <p
                    class="text-muted-custom mt-2 mb-0">

                    No matching memories found
                    in your timeline.

                </p>

            </div>

        `;

        return;

    }


    resultsContainer.innerHTML =
        memories
            .map(
                memory => {

                    const image =
                        memory.coverImage ||
                        "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=300&q=80";


                    return `

                        <div
                            class="p-3 mb-2 glass-card glass-card-hover rounded-3 d-flex align-items-center justify-content-between cursor-pointer"
                            onclick="openGlobalSearchMemory('${escapeAttribute(
                                memory.id
                            )}')"
                        >

                            <div
                                class="d-flex align-items-center gap-3">

                                <img
                                    src="${escapeAttribute(
                                        image
                                    )}"
                                    class="rounded-3"
                                    style="
                                        width:50px;
                                        height:50px;
                                        object-fit:cover;
                                    "
                                    alt="${escapeAttribute(
                                        memory.title ||
                                        "Memory"
                                    )}"
                                    loading="lazy"
                                >


                                <div>

                                    <h6
                                        class="mb-1 text-white">

                                        ${escapeHtml(
                                            memory.title ||
                                            "Untitled Memory"
                                        )}

                                    </h6>


                                    <span
                                        class="small text-secondary-custom">

                                        <i
                                            class="bi bi-geo-alt me-1">
                                        </i>

                                        ${escapeHtml(
                                            memory.location ||
                                            "Unknown"
                                        )}

                                        •

                                        ${escapeHtml(
                                            memory.date ||
                                            ""
                                        )}

                                    </span>

                                </div>

                            </div>


                            <span
                                class="badge-emotion badge-${escapeAttribute(
                                    String(
                                        memory.emotion ||
                                        "memory"
                                    ).toLowerCase()
                                )}"
                            >

                                ${escapeHtml(
                                    memory.emotion ||
                                    "Memory"
                                )}

                            </span>

                        </div>

                    `;

                }
            )
            .join("");

}


/* =========================================================
   OPEN MEMORY FROM SEARCH
   ========================================================= */

function openGlobalSearchMemory(
    id
) {

    window.location.href =
        `timeline.html?id=${encodeURIComponent(
            id
        )}`;

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