/* ==========================================================================
   EchoLife User Backup & Restore
   ========================================================================== */

let backupMemories = [];


/* =========================================================
   INITIALIZE
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        await loadBackupData();

    }
);


/* =========================================================
   LOAD CURRENT USER DATA
   ========================================================= */

async function loadBackupData() {

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
                "Unable to load backup data."
            );

        }


        backupMemories =
            Array.isArray(
                data.memories
            )
                ? data.memories
                : [];


        updateBackupSummary();


    } catch (error) {

        console.error(
            "Backup loading error:",
            error
        );


        const status =
            document.getElementById(
                "backupStatus"
            );


        if (status) {

            status.textContent =
                "Unable to load archive.";

        }


        showToast(
            "Backup Error",
            error.message ||
            "Unable to load your archive.",
            "danger"
        );

    }

}


/* =========================================================
   UPDATE SUMMARY
   ========================================================= */

function updateBackupSummary() {

    const memoryCount =
        document.getElementById(
            "backupMemoryCount"
        );


    const mediaCount =
        document.getElementById(
            "backupMediaCount"
        );


    const status =
        document.getElementById(
            "backupStatus"
        );


    if (memoryCount) {

        memoryCount.textContent =
            backupMemories.length;

    }


    const media =
        backupMemories.filter(
            memory =>
                Boolean(
                    memory.coverImage
                )
        );


    if (mediaCount) {

        mediaCount.textContent =
            media.length;

    }


    if (status) {

        status.textContent =
            `${backupMemories.length} personal memor${
                backupMemories.length === 1
                    ? "y"
                    : "ies"
            } available`;

    }

}


/* =========================================================
   EXPORT
   ========================================================= */

function exportArchive() {

    if (
        !Array.isArray(
            backupMemories
        )
    ) {

        showToast(
            "Export Failed",
            "Your archive has not finished loading.",
            "danger"
        );

        return;

    }


    const exportData = {

        app:
            "EchoLife",

        version:
            "2.0.0",

        exportedAt:
            new Date()
                .toISOString(),

        dataScope:
            "Current authenticated user",

        memories:
            backupMemories

    };


    try {

        const jsonString =
            JSON.stringify(
                exportData,
                null,
                2
            );


        const blob =
            new Blob(
                [jsonString],
                {
                    type:
                        "application/json"
                }
            );


        const url =
            URL.createObjectURL(
                blob
            );


        const anchor =
            document.createElement(
                "a"
            );


        const date =
            new Date()
                .toISOString()
                .split("T")[0];


        anchor.href =
            url;


        anchor.download =
            `echolife_archive_backup_${date}.json`;


        document.body.appendChild(
            anchor
        );


        anchor.click();


        anchor.remove();


        URL.revokeObjectURL(
            url
        );


        showToast(
            "Export Complete",
            `${backupMemories.length} ${
                backupMemories.length === 1
                    ? "memory"
                    : "memories"
            } exported successfully.`,
            "success"
        );


    } catch (error) {

        console.error(
            "Export error:",
            error
        );


        showToast(
            "Export Failed",
            "Unable to create the backup file.",
            "danger"
        );

    }

}


/* =========================================================
   IMPORT
   ========================================================= */

async function importArchive(
    input
) {

    if (
        !input ||
        !input.files ||
        !input.files[0]
    ) {

        return;

    }


    const file =
        input.files[0];


    if (
        !file.name
            .toLowerCase()
            .endsWith(".json")
    ) {

        showToast(
            "Invalid File",
            "Please select an EchoLife JSON backup.",
            "danger"
        );


        input.value =
            "";


        return;

    }


    try {

        const text =
            await file.text();


        const parsed =
            JSON.parse(
                text
            );


        if (
            !parsed ||
            !Array.isArray(
                parsed.memories
            )
        ) {

            throw new Error(
                "The selected file does not contain a valid EchoLife memory archive."
            );

        }


        const memories =
            parsed.memories;


        if (!memories.length) {

            showToast(
                "Nothing to Import",
                "The backup file does not contain any memories.",
                "info"
            );


            input.value =
                "";


            return;

        }


        const confirmed =
            confirm(
                `Import ${memories.length} ${
                    memories.length === 1
                        ? "memory"
                        : "memories"
                } into your current account?`
            );


        if (!confirmed) {

            input.value =
                "";


            return;

        }


        let imported =
            0;


        let failed =
            0;


        /*
         * Send each memory through the authenticated API.
         *
         * The server assigns the current user's user_id.
         */

        for (
            const memory of memories
        ) {

            try {

                const response =
                    await fetch(
                        "/api/memories",
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

                                    title:
                                        memory.title ||
                                        "Imported Memory",

                                    description:
                                        memory.description ||
                                        "",

                                    date:
                                        memory.date ||
                                        new Date()
                                            .toISOString()
                                            .split("T")[0],

                                    location:
                                        memory.location ||
                                        "",

                                    emotion:
                                        memory.emotion ||
                                        "",

                                    category:
                                        memory.category ||
                                        "",

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
                                        0,

                                    privacy:
                                        memory.privacy ||
                                        "Private",

                                    audioNote:
                                        memory.audioNote ||
                                        ""

                                })

                        }
                    );


                if (
                    response.ok
                ) {

                    imported++;

                } else {

                    failed++;

                }


            } catch (error) {

                console.error(
                    "Import memory error:",
                    error
                );


                failed++;

            }

        }


        input.value =
            "";


        if (
            imported > 0
        ) {

            showToast(
                "Import Complete",
                `${imported} ${
                    imported === 1
                        ? "memory"
                        : "memories"
                } imported successfully.${
                    failed > 0
                        ? ` ${failed} failed.`
                        : ""
                }`,
                failed > 0
                    ? "info"
                    : "success"
            );


            setTimeout(
                () => {

                    window.location.href =
                        "timeline.html";

                },
                1200
            );

        } else {

            showToast(
                "Import Failed",
                "No memories could be imported.",
                "danger"
            );

        }


    } catch (error) {

        console.error(
            "Backup import error:",
            error
        );


        input.value =
            "";


        showToast(
            "Invalid Backup",
            error.message ||
            "The selected JSON file could not be imported.",
            "danger"
        );

    }

}