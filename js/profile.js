/* ==========================================================================
   EchoLife User Profile Controller
   ========================================================================== */

let currentProfile = null;


/* =========================================================
   INITIALIZE
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        await loadProfile();

        setupProfileActions();

    }
);


/* =========================================================
   LOAD PROFILE
   ========================================================= */

async function loadProfile() {

    try {

        const response =
            await fetch(
                "/api/profile",
                {
                    method: "GET",
                    credentials: "include"
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
                "Unable to load profile."
            );

        }


        currentProfile =
            data.profile;


        renderProfile(
            currentProfile
        );


    } catch (error) {

        console.error(
            "Profile loading error:",
            error
        );


        showProfileError(
            "Unable to load your profile."
        );

    }

}


/* =========================================================
   RENDER PROFILE
   ========================================================= */

function renderProfile(
    profile
) {

    setText(
        "profileFullName",
        profile.fullName ||
        profile.username ||
        "User"
    );


    setText(
        "profileUsername",
        profile.username
            ? `@${profile.username}`
            : ""
    );


    setText(
        "profileEmail",
        profile.email ||
        ""
    );


    setText(
        "profileBio",
        profile.bio ||
        "Your EchoLife story starts here."
    );


    setText(
        "profileLocation",
        profile.location ||
        "Not specified"
    );


    setText(
        "profileMemoryCount",
        profile.totalMemories ||
        0
    );


    setText(
        "profileFavoriteCount",
        profile.favoriteCount ||
        0
    );


    const avatar =
        document.getElementById(
            "profileAvatar"
        );


    if (
        avatar &&
        profile.profileImage
    ) {

        avatar.src =
            profile.profileImage;

    }


    updateAchievements(
        profile
    );

}


/* =========================================================
   ACHIEVEMENTS
   ========================================================= */

function updateAchievements(
    profile
) {

    const memoryCount =
        Number(
            profile.totalMemories ||
            0
        );


    setText(
        "achievementTimeTraveler",
        memoryCount >= 5
            ? "5+ memories archived"
            : "Keep building your archive"
    );


    setText(
        "achievementCurator",
        memoryCount >= 20
            ? "20+ memory cards created"
            : `${memoryCount} memory cards created`
    );


    setText(
        "achievementGlobe",
        profile.location
            ? `Memories from ${profile.location}`
            : "Personal memory collection"
    );


    setText(
        "achievementStreak",
        memoryCount > 0
            ? "Active archiving journey"
            : "Create your first memory"
    );

}


/* =========================================================
   PROFILE ACTIONS
   ========================================================= */

function setupProfileActions() {

    const editButtons =
        document.querySelectorAll(
            ".edit-profile-btn"
        );


    editButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                openEditProfileModal
            );

        }
    );


    const logoutButton =
        document.getElementById(
            "logoutButton"
        );


    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            logoutUser
        );

    }

}


/* =========================================================
   OPEN EDIT MODAL
   ========================================================= */

function openEditProfileModal(
    event
) {

    if (event) {

        event.preventDefault();

    }


    if (!currentProfile) {

        return;

    }


    const modalElement =
        document.getElementById(
            "editProfileModal"
        );


    if (!modalElement) {

        console.error(
            "Edit profile modal not found."
        );

        return;

    }


    const fullName =
        document.getElementById(
            "editFullName"
        );


    const bio =
        document.getElementById(
            "editBio"
        );


    const location =
        document.getElementById(
            "editLocation"
        );


    const profileImage =
        document.getElementById(
            "editProfileImage"
        );


    if (fullName) {

        fullName.value =
            currentProfile.fullName ||
            "";

    }


    if (bio) {

        bio.value =
            currentProfile.bio ||
            "";

    }


    if (location) {

        location.value =
            currentProfile.location ||
            "";

    }


    if (profileImage) {

        profileImage.value =
            currentProfile.profileImage ||
            "";

    }


    clearEditMessages();


    const modal =
        bootstrap.Modal.getOrCreateInstance(
            modalElement
        );


    modal.show();

}


/* =========================================================
   SAVE PROFILE
   ========================================================= */

async function saveProfileChanges() {

    const fullName =
        document.getElementById(
            "editFullName"
        ).value.trim();


    const bio =
        document.getElementById(
            "editBio"
        ).value.trim();


    const location =
        document.getElementById(
            "editLocation"
        ).value.trim();


    const profileImage =
        document.getElementById(
            "editProfileImage"
        ).value.trim();


    const saveButton =
        document.getElementById(
            "saveProfileButton"
        );


    clearEditMessages();


    /* ---------------------------------------------
       Validation
       --------------------------------------------- */

    if (!fullName) {

        showEditError(
            "Full name is required."
        );

        return;

    }


    if (
        fullName.length > 100
    ) {

        showEditError(
            "Full name is too long."
        );

        return;

    }


    if (
        bio.length > 500
    ) {

        showEditError(
            "Bio must be 500 characters or less."
        );

        return;

    }


    if (
        location.length > 100
    ) {

        showEditError(
            "Location is too long."
        );

        return;

    }


    /* ---------------------------------------------
       Loading
       --------------------------------------------- */

    saveButton.disabled =
        true;


    saveButton.innerHTML = `

        <span
            class="spinner-border spinner-border-sm me-1">
        </span>

        Saving...

    `;


    try {

        const response =
            await fetch(
                "/api/profile",
                {

                    method:
                        "PUT",

                    credentials:
                        "include",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            fullName,

                            bio,

                            location,

                            profileImage

                        })

                }
            );


        let data = {};


        try {

            data =
                await response.json();

        } catch {

            data = {};

        }


        if (
            response.status ===
            401
        ) {

            window.location.href =
                "login.html";

            return;

        }


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Unable to update profile."
            );

        }


        currentProfile = {

            ...currentProfile,

            ...data.profile

        };


        renderProfile(
            currentProfile
        );


        showEditSuccess(
            "Profile updated successfully."
        );


        if (
            typeof showToast ===
            "function"
        ) {

            showToast(
                "Profile Updated",
                "Your profile changes were saved.",
                "success"
            );

        }


        setTimeout(
            () => {

                const modalElement =
                    document.getElementById(
                        "editProfileModal"
                    );


                if (!modalElement) {

                    return;

                }


                const modal =
                    bootstrap.Modal.getInstance(
                        modalElement
                    );


                if (modal) {

                    modal.hide();

                }

            },
            1000
        );


    } catch (error) {

        console.error(
            "Profile update error:",
            error
        );


        showEditError(
            error.message ||
            "Unable to update profile."
        );


    } finally {

        saveButton.disabled =
            false;


        saveButton.innerHTML = `

            <i
                class="bi bi-check-circle me-1">
            </i>

            Save Changes

        `;

    }

}


/* =========================================================
   LOGOUT
   ========================================================= */

async function logoutUser(
    event
) {

    if (event) {

        event.preventDefault();

    }


    try {

        const response =
            await fetch(
                "/api/auth/logout",
                {

                    method:
                        "POST",

                    credentials:
                        "include"

                }
            );


        if (response.ok) {

            window.location.href =
                "login.html";

        } else {

            alert(
                "Logout failed."
            );

        }


    } catch (error) {

        console.error(
            "Logout error:",
            error
        );


        alert(
            "Unable to log out."
        );

    }

}


/* =========================================================
   EDIT MESSAGES
   ========================================================= */

function clearEditMessages() {

    const errorBox =
        document.getElementById(
            "editProfileError"
        );


    const successBox =
        document.getElementById(
            "editProfileSuccess"
        );


    if (errorBox) {

        errorBox.textContent =
            "";

        errorBox.classList.add(
            "d-none"
        );

    }


    if (successBox) {

        successBox.textContent =
            "";

        successBox.classList.add(
            "d-none"
        );

    }

}


/* =========================================================
   SHOW EDIT ERROR
   ========================================================= */

function showEditError(
    message
) {

    const errorBox =
        document.getElementById(
            "editProfileError"
        );


    if (!errorBox) {

        return;

    }


    errorBox.textContent =
        message;


    errorBox.classList.remove(
        "d-none"
    );

}


/* =========================================================
   SHOW EDIT SUCCESS
   ========================================================= */

function showEditSuccess(
    message
) {

    const successBox =
        document.getElementById(
            "editProfileSuccess"
        );


    if (!successBox) {

        return;

    }


    successBox.textContent =
        message;


    successBox.classList.remove(
        "d-none"
    );

}


/* =========================================================
   ERROR
   ========================================================= */

function showProfileError(
    message
) {

    const nameElement =
        document.getElementById(
            "profileFullName"
        );


    if (nameElement) {

        nameElement.textContent =
            "Unable to load profile.";

    }


    const bioElement =
        document.getElementById(
            "profileBio"
        );


    if (bioElement) {

        bioElement.textContent =
            message;

    }

}


/* =========================================================
   HELPER
   ========================================================= */

function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            value ?? "";

    }

}