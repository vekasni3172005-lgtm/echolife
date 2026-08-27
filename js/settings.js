/* ==========================================================================
   EchoLife User Settings
   ========================================================================== */


/* =========================================================
   SETTINGS STORAGE
   ========================================================= */

const SETTINGS_KEY =
    "echolife_user_settings";


/* =========================================================
   DEFAULT SETTINGS
   ========================================================= */

let currentSettings = {

    theme:
        "dark",

    anniversaryNotifications:
        true,

    backupNotifications:
        true,

    securityLevel:
        "high"

};


/* =========================================================
   INITIALIZE
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadUserSettings();

    }
);


/* =========================================================
   LOAD SETTINGS
   ========================================================= */

function loadUserSettings() {

    try {

        const saved =
            localStorage.getItem(
                SETTINGS_KEY
            );


        if (saved) {

            const parsed =
                JSON.parse(
                    saved
                );


            if (
                parsed &&
                typeof parsed === "object"
            ) {

                currentSettings = {

                    ...currentSettings,
                    ...parsed

                };

            }

        }


        applySettingsToPage();


    } catch (error) {

        console.error(
            "Settings loading error:",
            error
        );


        applySettingsToPage();

    }

}


/* =========================================================
   APPLY SETTINGS TO PAGE
   ========================================================= */

function applySettingsToPage() {

    const themeSelect =
        document.getElementById(
            "themePreference"
        );


    const anniversary =
        document.getElementById(
            "notifAnniversary"
        );


    const backup =
        document.getElementById(
            "notifBackup"
        );


    const security =
        document.getElementById(
            "securityLevel"
        );


    if (themeSelect) {

        themeSelect.value =
            currentSettings.theme;

    }


    if (anniversary) {

        anniversary.checked =
            Boolean(
                currentSettings
                    .anniversaryNotifications
            );

    }


    if (backup) {

        backup.checked =
            Boolean(
                currentSettings
                    .backupNotifications
            );

    }


    if (security) {

        security.value =
            currentSettings.securityLevel;

    }


    applyThemePreference();

}


/* =========================================================
   SAVE SETTINGS
   ========================================================= */

function saveUserSettings() {

    const themeSelect =
        document.getElementById(
            "themePreference"
        );


    const anniversary =
        document.getElementById(
            "notifAnniversary"
        );


    const backup =
        document.getElementById(
            "notifBackup"
        );


    const security =
        document.getElementById(
            "securityLevel"
        );


    currentSettings = {

        theme:
            themeSelect
                ? themeSelect.value
                : "dark",

        anniversaryNotifications:
            anniversary
                ? anniversary.checked
                : true,

        backupNotifications:
            backup
                ? backup.checked
                : true,

        securityLevel:
            security
                ? security.value
                : "high"

    };


    try {

        localStorage.setItem(
            SETTINGS_KEY,
            JSON.stringify(
                currentSettings
            )
        );


        applyThemePreference();


        if (
            typeof showToast ===
            "function"
        ) {

            showToast(
                "Saved",
                "Your preferences have been saved.",
                "success"
            );

        }


    } catch (error) {

        console.error(
            "Save settings error:",
            error
        );


        if (
            typeof showToast ===
            "function"
        ) {

            showToast(
                "Save Failed",
                "Unable to save your preferences.",
                "danger"
            );

        }

    }

}


/* =========================================================
   APPLY THEME
   ========================================================= */

function applyThemePreference() {

    const theme =
        currentSettings.theme === "light"
            ? "light"
            : "dark";


    document.documentElement
        .setAttribute(
            "data-theme",
            theme
        );


    /*
     * Keep existing theme.js/localStorage
     * state synchronized.
     */

    try {

        localStorage.setItem(
            "echolife_theme",
            theme
        );

    } catch (error) {

        console.warn(
            "Unable to save theme:",
            error
        );

    }


    /*
     * Update top theme button icon.
     */

    const icons =
        document.querySelectorAll(
            ".theme-toggle-icon"
        );


    icons.forEach(
        icon => {

            icon.classList.remove(
                "bi-moon-stars-fill",
                "bi-sun-fill"
            );


            if (theme === "light") {

                icon.classList.add(
                    "bi-sun-fill"
                );

            } else {

                icon.classList.add(
                    "bi-moon-stars-fill"
                );

            }

        }
    );

}


/* =========================================================
   OPEN CHANGE PASSWORD MODAL
   ========================================================= */

function openPasswordModal() {

    const modalElement =
        document.getElementById(
            "changePasswordModal"
        );


    if (!modalElement) {

        console.error(
            "Change password modal was not found."
        );

        return;

    }


    /*
     * Clear previous values.
     */

    const currentPassword =
        document.getElementById(
            "currentPassword"
        );


    const newPassword =
        document.getElementById(
            "newPassword"
        );


    const confirmNewPassword =
        document.getElementById(
            "confirmNewPassword"
        );


    const errorBox =
        document.getElementById(
            "passwordChangeError"
        );


    const successBox =
        document.getElementById(
            "passwordChangeSuccess"
        );


    if (currentPassword) {

        currentPassword.value =
            "";

    }


    if (newPassword) {

        newPassword.value =
            "";

    }


    if (confirmNewPassword) {

        confirmNewPassword.value =
            "";

    }


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


    const modal =
        bootstrap.Modal.getOrCreateInstance(
            modalElement
        );


    modal.show();

}


/* =========================================================
   CHANGE PASSWORD
   ========================================================= */

async function changePassword() {

    const currentPasswordInput =
        document.getElementById(
            "currentPassword"
        );


    const newPasswordInput =
        document.getElementById(
            "newPassword"
        );


    const confirmPasswordInput =
        document.getElementById(
            "confirmNewPassword"
        );


    const errorBox =
        document.getElementById(
            "passwordChangeError"
        );


    const successBox =
        document.getElementById(
            "passwordChangeSuccess"
        );


    const button =
        document.getElementById(
            "changePasswordButton"
        );


    if (
        !currentPasswordInput ||
        !newPasswordInput ||
        !confirmPasswordInput ||
        !errorBox ||
        !successBox ||
        !button
    ) {

        console.error(
            "Password change elements are missing."
        );

        return;

    }


    const currentPassword =
        currentPasswordInput.value;


    const newPassword =
        newPasswordInput.value;


    const confirmPassword =
        confirmPasswordInput.value;


    /*
     * Clear old messages.
     */

    errorBox.textContent =
        "";

    errorBox.classList.add(
        "d-none"
    );


    successBox.textContent =
        "";

    successBox.classList.add(
        "d-none"
    );


    /* =====================================================
       VALIDATION
       ===================================================== */

    if (
        !currentPassword ||
        !newPassword ||
        !confirmPassword
    ) {

        showPasswordError(
            "Please fill in all password fields."
        );

        return;

    }


    if (
        newPassword.length < 8
    ) {

        showPasswordError(
            "New password must contain at least 8 characters."
        );

        return;

    }


    if (
        newPassword !==
        confirmPassword
    ) {

        showPasswordError(
            "New passwords do not match."
        );

        return;

    }


    if (
        currentPassword ===
        newPassword
    ) {

        showPasswordError(
            "New password must be different from your current password."
        );

        return;

    }


    /* =====================================================
       DISABLE BUTTON
       ===================================================== */

    button.disabled =
        true;


    button.innerHTML = `

        <span
            class="spinner-border spinner-border-sm me-1">
        </span>

        Updating...

    `;


    try {

        const response =
            await fetch(
                "/api/auth/change-password",
                {

                    method:
                        "POST",

                    credentials:
                        "include",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            currentPassword:
                                currentPassword,

                            newPassword:
                                newPassword

                        })

                }
            );


        /*
         * Try to read JSON.
         */

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

            throw new Error(
                "Your session has expired. Please log in again."
            );

        }


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Unable to change password."
            );

        }


        /* =================================================
           SUCCESS
           ================================================= */

        successBox.textContent =
            data.message ||
            "Password changed successfully.";


        successBox.classList.remove(
            "d-none"
        );


        /*
         * Clear password fields.
         */

        currentPasswordInput.value =
            "";

        newPasswordInput.value =
            "";

        confirmPasswordInput.value =
            "";


        if (
            typeof showToast ===
            "function"
        ) {

            showToast(
                "Password Updated",
                "Your password was changed successfully.",
                "success"
            );

        }


        /*
         * Close modal after a short delay.
         */

        setTimeout(
            () => {

                const modalElement =
                    document.getElementById(
                        "changePasswordModal"
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
            1200
        );


    } catch (error) {

        console.error(
            "Password change error:",
            error
        );


        showPasswordError(
            error.message ||
            "Unable to change password."
        );

    } finally {

        button.disabled =
            false;


        button.innerHTML = `

            <i
                class="bi bi-check-circle me-1">
            </i>

            Update Password

        `;

    }

}


/* =========================================================
   PASSWORD ERROR
   ========================================================= */

function showPasswordError(
    message
) {

    const errorBox =
        document.getElementById(
            "passwordChangeError"
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
   OPTIONAL: ENTER KEY SUPPORT
   ========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key !== "Enter"
        ) {

            return;

        }


        const modalElement =
            document.getElementById(
                "changePasswordModal"
            );


        if (
            !modalElement ||
            !modalElement.classList.contains(
                "show"
            )
        ) {

            return;

        }


        /*
         * Avoid triggering when focus
         * is on a button.
         */

        if (
            event.target.tagName ===
            "BUTTON"
        ) {

            return;

        }


        changePassword();

    }
);