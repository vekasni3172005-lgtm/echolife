const express = require("express");
const cors = require("cors");
const session = require("express-session");
const argon2 = require("argon2");

const db = require("./database/database");

const app = express();
const PORT = 3000;


/* =========================================================
   SERVE FRONTEND
   ========================================================= */

app.use(
    express.static(__dirname)
);


/* =========================================================
   MIDDLEWARE
   ========================================================= */

/*
 * Large JSON limit is required because the current app
 * can send Base64 image data.
 */
app.use(
    express.json({
        limit: "20mb"
    })
);


/*
 * CORS
 */
app.use(
    cors({
        origin: true,
        credentials: true
    })
);


/* =========================================================
   SESSION
   ========================================================= */

app.use(
    session({

        secret:
            "echolife-development-secret-change-this",

        resave:
            false,

        saveUninitialized:
            false,

        cookie: {

            httpOnly:
                true,

            secure:
                false,

            sameSite:
                "lax",

            maxAge:
                1000 *
                60 *
                60 *
                24 *
                7

        }

    })
);


/* =========================================================
   TEST API
   ========================================================= */

app.get(
    "/api/test",
    (req, res) => {

        try {

            const result =
                db
                    .prepare(
                        "SELECT 1 AS connected"
                    )
                    .get();


            res.json({

                success:
                    true,

                backend:
                    "working",

                database:
                    result.connected === 1
                        ? "connected"
                        : "not connected"

            });


        } catch (error) {

            console.error(
                "Test route error:",
                error
            );


            res.status(500).json({

                success:
                    false,

                message:
                    "Database test failed."

            });

        }

    }
);


/* =========================================================
   REGISTER
   ========================================================= */

app.post(
    "/api/auth/register",
    async (req, res) => {

        try {

            const {
                fullName,
                email,
                username,
                password
            } = req.body;


            /* ---------------------------------------------
               Validate required fields
               --------------------------------------------- */

            if (
                !fullName ||
                !email ||
                !username ||
                !password
            ) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "All fields are required."

                });

            }


            if (
                password.length < 8
            ) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "Password must be at least 8 characters long."

                });

            }


            /* ---------------------------------------------
               Clean input
               --------------------------------------------- */

            const cleanName =
                String(
                    fullName
                ).trim();


            const cleanEmail =
                String(
                    email
                )
                    .trim()
                    .toLowerCase();


            const cleanUsername =
                String(
                    username
                ).trim();


            /* ---------------------------------------------
               Username validation
               --------------------------------------------- */

            if (
                !/^[A-Za-z0-9_.]{3,30}$/
                    .test(cleanUsername)
            ) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "Invalid username format."

                });

            }


            /* ---------------------------------------------
               Check username
               --------------------------------------------- */

            const existingUsername =
                db
                    .prepare(`
                        SELECT id
                        FROM users
                        WHERE username = ?
                    `)
                    .get(
                        cleanUsername
                    );


            if (
                existingUsername
            ) {

                return res.status(409).json({

                    success:
                        false,

                    message:
                        "Username already exists."

                });

            }


            /* ---------------------------------------------
               Check email
               --------------------------------------------- */

            const existingEmail =
                db
                    .prepare(`
                        SELECT id
                        FROM users
                        WHERE email = ?
                    `)
                    .get(
                        cleanEmail
                    );


            if (
                existingEmail
            ) {

                return res.status(409).json({

                    success:
                        false,

                    message:
                        "Email is already registered."

                });

            }


            /* ---------------------------------------------
               Hash password
               --------------------------------------------- */

            const passwordHash =
                await argon2.hash(
                    password
                );


            /* ---------------------------------------------
               Create user
               --------------------------------------------- */

            const createUser =
                db.prepare(`
                    INSERT INTO users
                    (
                        username,
                        email,
                        password_hash
                    )
                    VALUES (?, ?, ?)
                `);


            const userResult =
                createUser.run(
                    cleanUsername,
                    cleanEmail,
                    passwordHash
                );


            const userId =
                userResult.lastInsertRowid;


            /* ---------------------------------------------
               Create profile
               --------------------------------------------- */

            db.prepare(`
                INSERT INTO profiles
                (
                    user_id,
                    full_name
                )
                VALUES (?, ?)
            `).run(
                userId,
                cleanName
            );


            return res.status(201).json({

                success:
                    true,

                message:
                    "EchoLife account created successfully.",

                user: {

                    id:
                        userId,

                    username:
                        cleanUsername,

                    email:
                        cleanEmail

                }

            });


        } catch (error) {

            console.error(
                "Registration error:",
                error
            );


            return res.status(500).json({

                success:
                    false,

                message:
                    "An error occurred while creating your account."

            });

        }

    }
);


/* =========================================================
   LOGIN
   ========================================================= */

app.post(
    "/api/auth/login",
    async (req, res) => {

        try {

            const {
                email,
                password
            } = req.body;


            if (
                !email ||
                !password
            ) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "Email and password are required."

                });

            }


            const cleanEmail =
                String(
                    email
                )
                    .trim()
                    .toLowerCase();


            /* ---------------------------------------------
               Find user
               --------------------------------------------- */

            const user =
                db
                    .prepare(`
                        SELECT
                            id,
                            username,
                            email,
                            password_hash
                        FROM users
                        WHERE email = ?
                    `)
                    .get(
                        cleanEmail
                    );


            if (
                !user
            ) {

                return res.status(401).json({

                    success:
                        false,

                    message:
                        "Invalid email or password."

                });

            }


            /* ---------------------------------------------
               Verify password
               --------------------------------------------- */

            const passwordValid =
                await argon2.verify(
                    user.password_hash,
                    password
                );


            if (
                !passwordValid
            ) {

                return res.status(401).json({

                    success:
                        false,

                    message:
                        "Invalid email or password."

                });

            }


            /* ---------------------------------------------
               Create session
               --------------------------------------------- */

            req.session.userId =
                Number(
                    user.id
                );


            req.session.username =
                user.username;


            return res.json({

                success:
                    true,

                message:
                    "Login successful.",

                user: {

                    id:
                        user.id,

                    username:
                        user.username,

                    email:
                        user.email

                }

            });


        } catch (error) {

            console.error(
                "Login error:",
                error
            );


            return res.status(500).json({

                success:
                    false,

                message:
                    "An error occurred during login."

            });

        }

    }
);


/* =========================================================
   CURRENT USER
   ========================================================= */

app.get(
    "/api/auth/me",
    (req, res) => {

        try {

            if (
                !req.session.userId
            ) {

                return res.status(401).json({

                    success:
                        false,

                    message:
                        "Not authenticated."

                });

            }


            const user =
                db
                    .prepare(`
                        SELECT
                            id,
                            username,
                            email
                        FROM users
                        WHERE id = ?
                    `)
                    .get(
                        req.session.userId
                    );


            if (
                !user
            ) {

                req.session.destroy(
                    () => {}
                );


                return res.status(401).json({

                    success:
                        false,

                    message:
                        "User not found."

                });

            }


            res.json({

                success:
                    true,

                user

            });


        } catch (error) {

            console.error(
                "Current user error:",
                error
            );


            res.status(500).json({

                success:
                    false,

                message:
                    "Unable to retrieve current user."

            });

        }

    }
);


/* =========================================================
   GET CURRENT USER PROFILE
   ========================================================= */

app.get(
    "/api/profile",
    (req, res) => {

        try {

            if (
                !req.session.userId
            ) {

                return res.status(401).json({

                    success:
                        false,

                    message:
                        "Not authenticated."

                });

            }


            const profile =
                db
                    .prepare(`
                        SELECT

                            u.id,

                            u.username,

                            u.email,

                            u.created_at,

                            p.full_name,

                            p.bio,

                            p.profile_image,

                            p.location,

                            p.date_of_birth

                        FROM users u

                        LEFT JOIN profiles p
                            ON p.user_id = u.id

                        WHERE u.id = ?

                    `)
                    .get(
                        req.session.userId
                    );


            if (
                !profile
            ) {

                return res.status(404).json({

                    success:
                        false,

                    message:
                        "Profile not found."

                });

            }


            const memoryStats =
                db
                    .prepare(`
                        SELECT

                            COUNT(*) AS total_memories,

                            COALESCE(
                                SUM(
                                    CASE
                                        WHEN type = 'Photo'
                                        THEN 1
                                        ELSE 0
                                    END
                                ),
                                0
                            ) AS photo_count,

                            COALESCE(
                                SUM(
                                    CASE
                                        WHEN type = 'Video'
                                        THEN 1
                                        ELSE 0
                                    END
                                ),
                                0
                            ) AS video_count,

                            COALESCE(
                                SUM(
                                    CASE
                                        WHEN is_favorite = 1
                                        THEN 1
                                        ELSE 0
                                    END
                                ),
                                0
                            ) AS favorite_count

                        FROM memories

                        WHERE user_id = ?

                    `)
                    .get(
                        req.session.userId
                    );


            res.json({

                success:
                    true,

                profile: {

                    id:
                        profile.id,

                    username:
                        profile.username,

                    email:
                        profile.email,

                    fullName:
                        profile.full_name ||
                        profile.username,

                    bio:
                        profile.bio ||
                        "",

                    profileImage:
                        profile.profile_image ||
                        "",

                    location:
                        profile.location ||
                        "",

                    dateOfBirth:
                        profile.date_of_birth ||
                        "",

                    joinedDate:
                        profile.created_at,

                    totalMemories:
                        Number(
                            memoryStats.total_memories ||
                            0
                        ),

                    photoCount:
                        Number(
                            memoryStats.photo_count ||
                            0
                        ),

                    videoCount:
                        Number(
                            memoryStats.video_count ||
                            0
                        ),

                    favoriteCount:
                        Number(
                            memoryStats.favorite_count ||
                            0
                        )

                }

            });


        } catch (error) {

            console.error(
                "Profile error:",
                error
            );


            res.status(500).json({

                success:
                    false,

                message:
                    "Unable to load profile."

            });

        }

    }
);


/* =========================================================
   UPDATE CURRENT USER PROFILE
   ========================================================= */

app.put(
    "/api/profile",
    (req, res) => {

        try {

            if (
                !req.session.userId
            ) {

                return res.status(401).json({

                    success:
                        false,

                    message:
                        "You must be logged in."

                });

            }


            const {
                fullName,
                bio,
                location,
                profileImage
            } = req.body;


            const cleanName =
                String(
                    fullName ||
                    ""
                ).trim();


            const cleanBio =
                String(
                    bio ||
                    ""
                ).trim();


            const cleanLocation =
                String(
                    location ||
                    ""
                ).trim();


            const cleanProfileImage =
                String(
                    profileImage ||
                    ""
                ).trim();


            if (
                !cleanName
            ) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "Full name is required."

                });

            }


            if (
                cleanName.length > 100
            ) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "Full name must be 100 characters or less."

                });

            }


            if (
                cleanBio.length > 500
            ) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "Bio must be 500 characters or less."

                });

            }


            if (
                cleanLocation.length > 100
            ) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "Location must be 100 characters or less."

                });

            }


            const updateResult =
                db
                    .prepare(`
                        UPDATE profiles

                        SET
                            full_name = ?,
                            bio = ?,
                            location = ?,
                            profile_image = ?

                        WHERE user_id = ?
                    `)
                    .run(

                        cleanName,

                        cleanBio,

                        cleanLocation,

                        cleanProfileImage,

                        req.session.userId

                    );


            /*
             * Safety fallback:
             * create profile if missing.
             */

            if (
                updateResult.changes === 0
            ) {

                db.prepare(`
                    INSERT INTO profiles
                    (
                        user_id,
                        full_name,
                        bio,
                        location,
                        profile_image
                    )
                    VALUES (?, ?, ?, ?, ?)
                `).run(

                    req.session.userId,

                    cleanName,

                    cleanBio,

                    cleanLocation,

                    cleanProfileImage

                );

            }


            const updatedProfile =
                db
                    .prepare(`
                        SELECT

                            u.id,

                            u.username,

                            u.email,

                            u.created_at,

                            p.full_name,

                            p.bio,

                            p.profile_image,

                            p.location,

                            p.date_of_birth

                        FROM users u

                        LEFT JOIN profiles p
                            ON p.user_id = u.id

                        WHERE u.id = ?

                    `)
                    .get(
                        req.session.userId
                    );


            return res.json({

                success:
                    true,

                message:
                    "Profile updated successfully.",

                profile: {

                    id:
                        updatedProfile.id,

                    username:
                        updatedProfile.username,

                    email:
                        updatedProfile.email,

                    fullName:
                        updatedProfile.full_name ||
                        updatedProfile.username,

                    bio:
                        updatedProfile.bio ||
                        "",

                    profileImage:
                        updatedProfile.profile_image ||
                        "",

                    location:
                        updatedProfile.location ||
                        "",

                    dateOfBirth:
                        updatedProfile.date_of_birth ||
                        "",

                    joinedDate:
                        updatedProfile.created_at

                }

            });


        } catch (error) {

            console.error(
                "Update profile error:",
                error
            );


            return res.status(500).json({

                success:
                    false,

                message:
                    "Unable to update profile."

            });

        }

    }
);


/* =========================================================
   CHANGE PASSWORD
   ========================================================= */

app.post(
    "/api/auth/change-password",
    async (req, res) => {

        try {

            if (
                !req.session.userId
            ) {

                return res.status(401).json({

                    success:
                        false,

                    message:
                        "You must be logged in."

                });

            }


            const {
                currentPassword,
                newPassword
            } = req.body;


            if (
                !currentPassword ||
                !newPassword
            ) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "Current and new passwords are required."

                });

            }


            if (
                typeof newPassword !== "string" ||
                newPassword.length < 8
            ) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "New password must contain at least 8 characters."

                });

            }


            const user =
                db
                    .prepare(`
                        SELECT
                            id,
                            password_hash
                        FROM users
                        WHERE id = ?
                    `)
                    .get(
                        req.session.userId
                    );


            if (
                !user
            ) {

                return res.status(404).json({

                    success:
                        false,

                    message:
                        "User account not found."

                });

            }


            const passwordValid =
                await argon2.verify(
                    user.password_hash,
                    currentPassword
                );


            if (
                !passwordValid
            ) {

                return res.status(401).json({

                    success:
                        false,

                    message:
                        "Current password is incorrect."

                });

            }


            const samePassword =
                await argon2.verify(
                    user.password_hash,
                    newPassword
                );


            if (
                samePassword
            ) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "New password must be different from your current password."

                });

            }


            const newPasswordHash =
                await argon2.hash(
                    newPassword
                );


            db
                .prepare(`
                    UPDATE users

                    SET password_hash = ?

                    WHERE id = ?
                `)
                .run(

                    newPasswordHash,

                    req.session.userId

                );


            return res.json({

                success:
                    true,

                message:
                    "Password changed successfully."

            });


        } catch (error) {

            console.error(
                "Change password error:",
                error
            );


            return res.status(500).json({

                success:
                    false,

                message:
                    "Unable to change password."

            });

        }

    }
);


/* =========================================================
   LOGOUT
   ========================================================= */

app.post(
    "/api/auth/logout",
    (req, res) => {

        req.session.destroy(
            (error) => {

                if (
                    error
                ) {

                    console.error(
                        "Logout error:",
                        error
                    );


                    return res.status(500).json({

                        success:
                            false,

                        message:
                            "Logout failed."

                    });

                }


                res.clearCookie(
                    "connect.sid"
                );


                res.json({

                    success:
                        true,

                    message:
                        "Logged out successfully."

                });

            }
        );

    }
);


/* =========================================================
   ADD MEMORY
   ========================================================= */

app.post(
    "/api/memories",
    (req, res) => {

        try {

            if (
                !req.session.userId
            ) {

                return res.status(401).json({

                    success:
                        false,

                    message:
                        "You must be logged in."

                });

            }


            const {
                title,
                description,
                date,
                location,
                emotion,
                category,
                type,
                coverImage,
                tags,
                people,
                isFavorite,
                likes,
                privacy,
                audioNote
            } = req.body;


            if (
                !title ||
                !date ||
                !description
            ) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "Title, date and description are required."

                });

            }


            const safeTags =
                Array.isArray(tags)
                    ? tags
                    : [];


            const safePeople =
                Array.isArray(people)
                    ? people
                    : [];


            const result =
                db
                    .prepare(`
                        INSERT INTO memories
                        (
                            user_id,
                            title,
                            description,
                            memory_date,
                            location,
                            emotion,
                            category,
                            type,
                            cover_image,
                            tags,
                            people,
                            is_favorite,
                            likes,
                            privacy,
                            audio_note
                        )

                        VALUES
                        (
                            ?,
                            ?,
                            ?,
                            ?,
                            ?,
                            ?,
                            ?,
                            ?,
                            ?,
                            ?,
                            ?,
                            ?,
                            ?,
                            ?,
                            ?
                        )
                    `)
                    .run(

                        req.session.userId,

                        String(
                            title
                        ).trim(),

                        String(
                            description
                        ).trim(),

                        String(
                            date
                        ),

                        String(
                            location ||
                            ""
                        ).trim(),

                        String(
                            emotion ||
                            ""
                        ),

                        String(
                            category ||
                            ""
                        ),

                        String(
                            type ||
                            "Photo"
                        ),

                        String(
                            coverImage ||
                            ""
                        ),

                        JSON.stringify(
                            safeTags
                        ),

                        JSON.stringify(
                            safePeople
                        ),

                        isFavorite
                            ? 1
                            : 0,

                        Number(
                            likes
                        ) || 0,

                        String(
                            privacy ||
                            "Private"
                        ),

                        String(
                            audioNote ||
                            ""
                        )

                    );


            return res.status(201).json({

                success:
                    true,

                message:
                    "Memory saved successfully.",

                memoryId:
                    result.lastInsertRowid

            });


        } catch (error) {

            console.error(
                "Add memory error:",
                error
            );


            return res.status(500).json({

                success:
                    false,

                message:
                    "Unable to save memory."

            });

        }

    }
);


/* =========================================================
   GET CURRENT USER MEMORIES
   ========================================================= */

app.get(
    "/api/memories",
    (req, res) => {

        try {

            if (
                !req.session.userId
            ) {

                return res.status(401).json({

                    success:
                        false,

                    message:
                        "You must be logged in."

                });

            }


            /*
             * IMPORTANT:
             *
             * Always use req.session.userId.
             * Never trust a user_id sent by the browser.
             */

            const memories =
                db
                    .prepare(`
                        SELECT

                            id,

                            title,

                            description,

                            memory_date AS date,

                            location,

                            emotion,

                            category,

                            type,

                            cover_image AS coverImage,

                            tags,

                            people,

                            is_favorite AS isFavorite,

                            likes,

                            privacy,

                            audio_note AS audioNote,

                            created_at AS createdAt

                        FROM memories

                        WHERE user_id = ?

                        ORDER BY
                            memory_date DESC,
                            id DESC

                    `)
                    .all(
                        req.session.userId
                    );


            const formattedMemories =
                memories.map(
                    (memory) => {

                        let tags = [];
                        let people = [];


                        try {

                            tags =
                                memory.tags
                                    ? JSON.parse(
                                        memory.tags
                                    )
                                    : [];

                        } catch {

                            tags =
                                [];

                        }


                        try {

                            people =
                                memory.people
                                    ? JSON.parse(
                                        memory.people
                                    )
                                    : [];

                        } catch {

                            people =
                                [];

                        }


                        return {

                            ...memory,

                            isFavorite:
                                Boolean(
                                    memory.isFavorite
                                ),

                            tags,

                            people

                        };

                    }
                );


            res.json({

                success:
                    true,

                memories:
                    formattedMemories

            });


        } catch (error) {

            console.error(
                "Get memories error:",
                error
            );


            res.status(500).json({

                success:
                    false,

                message:
                    "Unable to load memories."

            });

        }

    }
);


/* =========================================================
   UPDATE MEMORY
   ========================================================= */

app.put(
    "/api/memories/:id",
    (req, res) => {

        try {

            if (
                !req.session.userId
            ) {

                return res.status(401).json({

                    success:
                        false,

                    message:
                        "You must be logged in."

                });

            }


            const memoryId =
                Number(
                    req.params.id
                );


            if (
                !Number.isInteger(
                    memoryId
                ) ||
                memoryId <= 0
            ) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "Invalid memory ID."

                });

            }


            const {
                title,
                description,
                date,
                location,
                emotion,
                category,
                type,
                coverImage,
                tags,
                people,
                privacy,
                audioNote
            } = req.body;


            if (
                !title ||
                !description ||
                !date
            ) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "Title, date and description are required."

                });

            }


            const safeTags =
                Array.isArray(
                    tags
                )
                    ? tags
                    : [];


            const safePeople =
                Array.isArray(
                    people
                )
                    ? people
                    : [];


            /*
             * Security:
             * UPDATE only occurs when both the memory ID
             * and logged-in user's ID match.
             */

            const result =
                db
                    .prepare(`
                        UPDATE memories

                        SET
                            title = ?,
                            description = ?,
                            memory_date = ?,
                            location = ?,
                            emotion = ?,
                            category = ?,
                            type = ?,
                            cover_image = ?,
                            tags = ?,
                            people = ?,
                            privacy = ?,
                            audio_note = ?

                        WHERE
                            id = ?
                            AND user_id = ?

                    `)
                    .run(

                        String(
                            title
                        ).trim(),

                        String(
                            description
                        ).trim(),

                        String(
                            date
                        ),

                        String(
                            location ||
                            ""
                        ).trim(),

                        String(
                            emotion ||
                            ""
                        ),

                        String(
                            category ||
                            ""
                        ),

                        String(
                            type ||
                            "Photo"
                        ),

                        String(
                            coverImage ||
                            ""
                        ),

                        JSON.stringify(
                            safeTags
                        ),

                        JSON.stringify(
                            safePeople
                        ),

                        String(
                            privacy ||
                            "Private"
                        ),

                        String(
                            audioNote ||
                            ""
                        ),

                        memoryId,

                        req.session.userId

                    );


            if (
                result.changes === 0
            ) {

                return res.status(404).json({

                    success:
                        false,

                    message:
                        "Memory not found or does not belong to you."

                });

            }


            return res.json({

                success:
                    true,

                message:
                    "Memory updated successfully."

            });


        } catch (error) {

            console.error(
                "Update memory error:",
                error
            );


            return res.status(500).json({

                success:
                    false,

                message:
                    "Unable to update memory."

            });

        }

    }
);


/* =========================================================
   DELETE MEMORY
   ========================================================= */

app.delete(
    "/api/memories/:id",
    (req, res) => {

        try {

            if (
                !req.session.userId
            ) {

                return res.status(401).json({

                    success:
                        false,

                    message:
                        "You must be logged in."

                });

            }


            const memoryId =
                Number(
                    req.params.id
                );


            if (
                !Number.isInteger(
                    memoryId
                ) ||
                memoryId <= 0
            ) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "Invalid memory ID."

                });

            }


            /*
             * Only delete memory belonging to
             * the authenticated user.
             */

            const result =
                db
                    .prepare(`
                        DELETE FROM memories

                        WHERE
                            id = ?
                            AND user_id = ?

                    `)
                    .run(

                        memoryId,

                        req.session.userId

                    );


            if (
                result.changes === 0
            ) {

                return res.status(404).json({

                    success:
                        false,

                    message:
                        "Memory not found or does not belong to you."

                });

            }


            return res.json({

                success:
                    true,

                message:
                    "Memory deleted successfully."

            });


        } catch (error) {

            console.error(
                "Delete memory error:",
                error
            );


            return res.status(500).json({

                success:
                    false,

                message:
                    "Unable to delete memory."

            });

        }

    }
);


/* =========================================================
   TOGGLE FAVORITE
   ========================================================= */

app.patch(
    "/api/memories/:id/favorite",
    (req, res) => {

        try {

            if (
                !req.session.userId
            ) {

                return res.status(401).json({

                    success:
                        false,

                    message:
                        "You must be logged in."

                });

            }


            const memoryId =
                Number(
                    req.params.id
                );


            if (
                !Number.isInteger(
                    memoryId
                ) ||
                memoryId <= 0
            ) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "Invalid memory ID."

                });

            }


            const memory =
                db
                    .prepare(`
                        SELECT
                            id,
                            is_favorite

                        FROM memories

                        WHERE
                            id = ?
                            AND user_id = ?

                    `)
                    .get(

                        memoryId,

                        req.session.userId

                    );


            if (
                !memory
            ) {

                return res.status(404).json({

                    success:
                        false,

                    message:
                        "Memory not found."

                });

            }


            const newFavorite =
                memory.is_favorite
                    ? 0
                    : 1;


            db
                .prepare(`
                    UPDATE memories

                    SET
                        is_favorite = ?

                    WHERE
                        id = ?
                        AND user_id = ?

                `)
                .run(

                    newFavorite,

                    memoryId,

                    req.session.userId

                );


            return res.json({

                success:
                    true,

                isFavorite:
                    Boolean(
                        newFavorite
                    ),

                message:
                    newFavorite
                        ? "Memory added to favorites."
                        : "Memory removed from favorites."

            });


        } catch (error) {

            console.error(
                "Favorite error:",
                error
            );


            return res.status(500).json({

                success:
                    false,

                message:
                    "Unable to update favorite."

            });

        }

    }
);


/* =========================================================
   TOGGLE LIKE
   ========================================================= */

app.patch(
    "/api/memories/:id/like",
    (req, res) => {

        try {

            if (
                !req.session.userId
            ) {

                return res.status(401).json({

                    success:
                        false,

                    message:
                        "You must be logged in."

                });

            }


            const memoryId =
                Number(
                    req.params.id
                );


            if (
                !Number.isInteger(
                    memoryId
                ) ||
                memoryId <= 0
            ) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "Invalid memory ID."

                });

            }


            const memory =
                db
                    .prepare(`
                        SELECT
                            id,
                            likes

                        FROM memories

                        WHERE
                            id = ?
                            AND user_id = ?

                    `)
                    .get(

                        memoryId,

                        req.session.userId

                    );


            if (
                !memory
            ) {

                return res.status(404).json({

                    success:
                        false,

                    message:
                        "Memory not found."

                });

            }


            const newLikes =
                Math.max(
                    0,
                    Number(
                        memory.likes ||
                        0
                    ) + 1
                );


            db
                .prepare(`
                    UPDATE memories

                    SET
                        likes = ?

                    WHERE
                        id = ?
                        AND user_id = ?

                `)
                .run(

                    newLikes,

                    memoryId,

                    req.session.userId

                );


            return res.json({

                success:
                    true,

                likes:
                    newLikes

            });


        } catch (error) {

            console.error(
                "Like error:",
                error
            );


            return res.status(500).json({

                success:
                    false,

                message:
                    "Unable to update likes."

            });

        }

    }
);


/* =========================================================
   START SERVER
   ========================================================= */

app.listen(
    PORT,
    () => {

        console.log(
            `EchoLife server running at http://localhost:${PORT}`
        );

    }
);