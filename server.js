
'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const session = require('express-session');
const argon2 = require('argon2');
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
const { randomUUID } = require('crypto');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const SESSION_SECRET = process.env.SESSION_SECRET;
const DATABASE_URL = process.env.SUPABASE_DB_URL;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STORAGE_BUCKET = 'echolife';
const CERTIFICATE_PATH = path.join(__dirname, 'prod-ca-2021.crt');

if (!SESSION_SECRET || SESSION_SECRET.length < 32) {
  console.error('SESSION_SECRET is missing or too short.');
  process.exit(1);
}
if (!DATABASE_URL) {
  console.error('SUPABASE_DB_URL is missing from .env.');
  process.exit(1);
}
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing.');
  process.exit(1);
}
if (!fs.existsSync(CERTIFICATE_PATH)) {
  console.error(`SSL certificate not found: ${CERTIFICATE_PATH}`);
  console.error('Put prod-ca-2021.crt beside server.js.');
  process.exit(1);
}

const isProduction = process.env.NODE_ENV === 'production';

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

// Trust the downloaded Supabase CA certificate and verify the server certificate.
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    ca: fs.readFileSync(CERTIFICATE_PATH, 'utf8'),
    rejectUnauthorized: true
  },
  connectionTimeoutMillis: 15000,
  idleTimeoutMillis: 30000,
  max: 10
});

pool.on('error', error => {
  console.error('Unexpected PostgreSQL client error:', error.message);
});

const allowedMediaTypes = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov'
};

const mediaUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => {
    if (!allowedMediaTypes[file.mimetype]) {
      return callback(new Error('Unsupported file type. Use a supported image or video.'));
    }
    callback(null, true);
  }
});

app.disable('x-powered-by');
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

const allowedOrigin = process.env.FRONTEND_ORIGIN;
app.use(cors({
  origin: allowedOrigin || true,
  credentials: true
}));

app.use(session({
  name: 'echolife.sid',
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
}));

app.use(express.static(__dirname));

function requireLogin(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      success: false,
      message: 'You must be logged in.'
    });
  }
  next();
}

function parseJsonArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string' || !value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function formatMemory(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    date: row.memory_date,
    location: row.location || '',
    emotion: row.emotion || '',
    category: row.category || '',
    type: row.type || 'Photo',
    coverImage: row.cover_image || '',
    tags: parseJsonArray(row.tags),
    people: parseJsonArray(row.people),
    isFavorite: Boolean(row.is_favorite),
    likes: Number(row.likes || 0),
    privacy: row.privacy || 'Private',
    audioNote: row.audio_note || '',
    createdAt: row.created_at
  };
}

function memoryInput(body) {
  const title = String(body.title || '').trim();
  const description = String(body.description || '').trim();
  const date = String(body.date || '').trim();

  if (!title || !description || !date) {
    return { error: 'Title, date and description are required.' };
  }
  if (title.length > 200 || description.length > 10000) {
    return { error: 'Title or description is too long.' };
  }

  const readArray = value => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  return {
    value: {
      title,
      description,
      date,
      location: String(body.location || '').trim(),
      emotion: String(body.emotion || ''),
      category: String(body.category || ''),
      type: body.type === 'Video' ? 'Video' : 'Photo',
      coverImage: String(body.coverImage || ''),
      tags: JSON.stringify(readArray(body.tags)),
      people: JSON.stringify(readArray(body.people)),
      privacy: String(body.privacy || 'Private'),
      audioNote: String(body.audioNote || '')
    }
  };
}

async function uploadPrivateMedia(userId, file) {
  if (!file) return null;

  const extension = allowedMediaTypes[file.mimetype];
  if (!extension) throw new Error('Unsupported media type.');

  const objectPath = `${userId}/${randomUUID()}${extension}`;

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(objectPath, file.buffer, {
      contentType: file.mimetype,
      upsert: false
    });

  if (error) {
    console.error('Supabase Storage upload error:', error.message);
    throw new Error('Private media upload failed. Check the Storage bucket configuration.');
  }

  return objectPath;
}

function isLegacyBase64(value) {
  return typeof value === 'string' && value.startsWith('data:');
}

async function privateMediaUrl(objectPath, userId) {
  if (!objectPath) return '';
  if (isLegacyBase64(objectPath)) return objectPath;

  // Sign only an object belonging to the currently logged-in user.
  if (!objectPath.startsWith(`${userId}/`)) return '';

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(objectPath, 300);

  if (error) {
    console.error('Signed URL error:', error.message);
    return '';
  }

  return data.signedUrl;
}

async function removePrivateMedia(objectPath, userId) {
  if (
    !objectPath ||
    isLegacyBase64(objectPath) ||
    !objectPath.startsWith(`${userId}/`)
  ) return;

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([objectPath]);

  if (error) console.error('Storage cleanup error:', error.message);
}

app.get('/api/test', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT 1 AS connected, current_database() AS database'
    );

    return res.json({
      success: true,
      backend: 'working',
      database: result.rows[0].database
    });
  } catch (error) {
    console.error('Database test failed:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Database connection failed.'
    });
  }
});

app.post('/api/auth/register', async (req, res) => {
  const client = await pool.connect().catch(error => {
    console.error('Database connection error:', error.message);
    return null;
  });

  if (!client) {
    return res.status(503).json({
      success: false,
      message: 'Database unavailable.'
    });
  }

  try {
    const { fullName, email, username, password } = req.body || {};

    if (!fullName || !email || !username || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required.'
      });
    }

    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long.'
      });
    }

    const cleanName = String(fullName).trim();
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanUsername = String(username).trim();

    if (!/^[A-Za-z0-9_.]{3,30}$/.test(cleanUsername)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid username format.'
      });
    }

    if (cleanName.length > 100 || cleanEmail.length > 254) {
      return res.status(400).json({
        success: false,
        message: 'Name or email is too long.'
      });
    }

    const existing = await client.query(
      'SELECT id FROM users WHERE LOWER(email) = $1 OR username = $2 LIMIT 1',
      [cleanEmail, cleanUsername]
    );

    if (existing.rowCount) {
      return res.status(409).json({
        success: false,
        message: 'Email or username is already registered.'
      });
    }

    const passwordHash = await argon2.hash(password);

    await client.query('BEGIN');

    const inserted = await client.query(
      `INSERT INTO users (username, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, username, email`,
      [cleanUsername, cleanEmail, passwordHash]
    );

    const user = inserted.rows[0];

    await client.query(
      `INSERT INTO profiles (user_id, full_name)
       VALUES ($1, $2)
       ON CONFLICT (user_id)
       DO UPDATE SET full_name = EXCLUDED.full_name`,
      [user.id, cleanName]
    );

    await client.query('COMMIT');

    return res.status(201).json({
      success: true,
      message: 'EchoLife account created successfully.',
      user
    });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Registration error:', error.message);

    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Email or username is already registered.'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Unable to create your account.'
    });
  } finally {
    client.release();
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }

    const result = await pool.query(
      `SELECT id, username, email, password_hash
       FROM users
       WHERE LOWER(email) = $1
       LIMIT 1`,
      [String(email).trim().toLowerCase()]
    );

    const user = result.rows[0];

    if (
      !user ||
      !user.password_hash ||
      !(await argon2.verify(user.password_hash, password))
    ) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    req.session.regenerate(sessionError => {
      if (sessionError) {
        console.error('Session regeneration error:', sessionError.message);
        return res.status(500).json({
          success: false,
          message: 'Unable to create login session.'
        });
      }

      req.session.userId = user.id;
      req.session.username = user.username;

      req.session.save(saveError => {
        if (saveError) {
          console.error('Session save error:', saveError.message);
          return res.status(500).json({
            success: false,
            message: 'Unable to save login session.'
          });
        }

        return res.json({
          success: true,
          message: 'Login successful.',
          user: {
            id: user.id,
            username: user.username,
            email: user.email
          }
        });
      });
    });
  } catch (error) {
    console.error('Login error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Unable to log in.'
    });
  }
});

app.get('/api/auth/me', requireLogin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, email FROM users WHERE id = $1',
      [req.session.userId]
    );

    if (!result.rowCount) {
      req.session.destroy(() => {});
      return res.status(401).json({
        success: false,
        message: 'User not found.'
      });
    }

    return res.json({
      success: true,
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Current user error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Unable to retrieve current user.'
    });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(error => {
    if (error) {
      console.error('Logout error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Logout failed.'
      });
    }

    res.clearCookie('echolife.sid', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax'
    });

    return res.json({
      success: true,
      message: 'Logged out successfully.'
    });
  });
});

app.post('/api/auth/change-password', requireLogin, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current and new passwords are required.'
      });
    }

    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must contain at least 8 characters.'
      });
    }

    const result = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.session.userId]
    );

    if (!result.rowCount) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.'
      });
    }

    if (!(await argon2.verify(result.rows[0].password_hash, currentPassword))) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect.'
      });
    }

    const newHash = await argon2.hash(newPassword);

    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [newHash, req.session.userId]
    );

    return res.json({
      success: true,
      message: 'Password changed successfully.'
    });
  } catch (error) {
    console.error('Change password error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Unable to change password.'
    });
  }
});

app.get('/api/profile', requireLogin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.username, u.email, u.created_at,
              p.full_name, p.bio, p.profile_image, p.location, p.date_of_birth
       FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE u.id = $1`,
      [req.session.userId]
    );

    if (!result.rowCount) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found.'
      });
    }

    const p = result.rows[0];

    const stats = await pool.query(
      `SELECT COUNT(*)::int AS total_memories,
              COUNT(*) FILTER (WHERE type = 'Photo')::int AS photo_count,
              COUNT(*) FILTER (WHERE type = 'Video')::int AS video_count,
              COUNT(*) FILTER (WHERE is_favorite = 1)::int AS favorite_count
       FROM memories WHERE user_id = $1`,
      [req.session.userId]
    );

    const s = stats.rows[0];

    return res.json({
      success: true,
      profile: {
        id: p.id,
        username: p.username,
        email: p.email,
        fullName: p.full_name || p.username,
        bio: p.bio || '',
        profileImage: p.profile_image || '',
        location: p.location || '',
        dateOfBirth: p.date_of_birth || '',
        joinedDate: p.created_at,
        totalMemories: Number(s.total_memories || 0),
        photoCount: Number(s.photo_count || 0),
        videoCount: Number(s.video_count || 0),
        favoriteCount: Number(s.favorite_count || 0)
      }
    });
  } catch (error) {
    console.error('Profile error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Unable to load profile.'
    });
  }
});

app.put('/api/profile', requireLogin, async (req, res) => {
  const client = await pool.connect().catch(() => null);

  if (!client) {
    return res.status(503).json({
      success: false,
      message: 'Database unavailable.'
    });
  }

  try {
    const { fullName, bio, location, profileImage } = req.body || {};
    const name = String(fullName || '').trim();
    const cleanBio = String(bio || '').trim();
    const cleanLocation = String(location || '').trim();
    const cleanImage = String(profileImage || '').trim();

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Full name is required.'
      });
    }

    if (name.length > 100 || cleanBio.length > 500 || cleanLocation.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'One or more profile fields are too long.'
      });
    }

    await client.query('BEGIN');

    await client.query(
      `INSERT INTO profiles (user_id, full_name, bio, location, profile_image)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id) DO UPDATE SET
         full_name = EXCLUDED.full_name,
         bio = EXCLUDED.bio,
         location = EXCLUDED.location,
         profile_image = EXCLUDED.profile_image,
         updated_at = CURRENT_TIMESTAMP`,
      [req.session.userId, name, cleanBio, cleanLocation, cleanImage]
    );

    await client.query('COMMIT');

    return res.json({
      success: true,
      message: 'Profile updated successfully.'
    });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Update profile error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Unable to update profile.'
    });
  } finally {
    client.release();
  }
});

app.post('/api/memories', requireLogin, mediaUpload.single('media'), async (req, res) => {
  let uploadedPath = null;

  try {
    const parsed = memoryInput(req.body || {});
    if (parsed.error) {
      return res.status(400).json({
        success: false,
        message: parsed.error
      });
    }

    const m = parsed.value;
    const userId = req.session.userId;

    if (req.file) {
      uploadedPath = await uploadPrivateMedia(userId, req.file);
    }

    // Supports existing Base64 frontend data as well as new private uploads.
    const storedMedia = uploadedPath || m.coverImage || '';
    const mediaType = req.file
      ? (req.file.mimetype.startsWith('video/') ? 'Video' : 'Photo')
      : m.type;

    const result = await pool.query(
      `INSERT INTO memories
       (user_id, title, description, memory_date, location, emotion, category,
        type, cover_image, tags, people, is_favorite, likes, privacy, audio_note)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING id`,
      [
        userId, m.title, m.description, m.date, m.location, m.emotion,
        m.category, mediaType, storedMedia, m.tags, m.people,
        req.body.isFavorite === true || req.body.isFavorite === 'true' ? 1 : 0,
        Math.max(0, Number(req.body.likes) || 0),
        m.privacy, m.audioNote
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Memory saved successfully.',
      memoryId: result.rows[0].id
    });
  } catch (error) {
    if (uploadedPath) {
      await removePrivateMedia(uploadedPath, req.session.userId);
    }

    if (error instanceof multer.MulterError) {
      return res.status(400).json({
        success: false,
        message: error.code === 'LIMIT_FILE_SIZE'
          ? 'File exceeds the 50 MB limit.'
          : 'Invalid upload.'
      });
    }

    console.error('Add memory error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Unable to save memory.'
    });
  }
});

app.get('/api/memories', requireLogin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, title, description, memory_date, location, emotion, category,
              type, cover_image, tags, people, is_favorite, likes, privacy,
              audio_note, created_at
       FROM memories
       WHERE user_id = $1
       ORDER BY memory_date DESC, id DESC`,
      [req.session.userId]
    );

    const memories = await Promise.all(result.rows.map(async row => {
      const memory = formatMemory(row);
      memory.coverImage = await privateMediaUrl(
        row.cover_image || '',
        req.session.userId
      );
      return memory;
    }));

    return res.json({ success: true, memories });
  } catch (error) {
    console.error('Get memories error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Unable to load memories.'
    });
  }
});

app.put('/api/memories/:id', requireLogin, mediaUpload.single('media'), async (req, res) => {
  let uploadedPath = null;

  try {
    const memoryId = Number(req.params.id);

    if (!Number.isInteger(memoryId) || memoryId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid memory ID.'
      });
    }

    const parsed = memoryInput(req.body || {});
    if (parsed.error) {
      return res.status(400).json({
        success: false,
        message: parsed.error
      });
    }

    const m = parsed.value;
    const userId = req.session.userId;

    const current = await pool.query(
      'SELECT cover_image FROM memories WHERE id = $1 AND user_id = $2',
      [memoryId, userId]
    );

    if (!current.rowCount) {
      return res.status(404).json({
        success: false,
        message: 'Memory not found or does not belong to you.'
      });
    }

    if (req.file) {
      uploadedPath = await uploadPrivateMedia(userId, req.file);
    }

    const oldMedia = current.rows[0].cover_image || '';
    const newMedia = uploadedPath ||
      (m.coverImage && m.coverImage !== oldMedia ? m.coverImage : oldMedia);

    const mediaType = req.file
      ? (req.file.mimetype.startsWith('video/') ? 'Video' : 'Photo')
      : m.type;

    await pool.query(
      `UPDATE memories SET
         title=$1, description=$2, memory_date=$3, location=$4,
         emotion=$5, category=$6, type=$7, cover_image=$8,
         tags=$9, people=$10, privacy=$11, audio_note=$12,
         updated_at=CURRENT_TIMESTAMP
       WHERE id=$13 AND user_id=$14`,
      [
        m.title, m.description, m.date, m.location, m.emotion,
        m.category, mediaType, newMedia, m.tags, m.people,
        m.privacy, m.audioNote, memoryId, userId
      ]
    );

    if (uploadedPath && oldMedia !== uploadedPath) {
      await removePrivateMedia(oldMedia, userId);
    }

    return res.json({
      success: true,
      message: 'Memory updated successfully.'
    });
  } catch (error) {
    if (uploadedPath) {
      await removePrivateMedia(uploadedPath, req.session.userId);
    }

    if (error instanceof multer.MulterError) {
      return res.status(400).json({
        success: false,
        message: error.code === 'LIMIT_FILE_SIZE'
          ? 'File exceeds the 50 MB limit.'
          : 'Invalid upload.'
      });
    }

    console.error('Update memory error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Unable to update memory.'
    });
  }
});

app.delete('/api/memories/:id', requireLogin, async (req, res) => {
  try {
    const memoryId = Number(req.params.id);

    if (!Number.isInteger(memoryId) || memoryId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid memory ID.'
      });
    }

    const result = await pool.query(
      `DELETE FROM memories
       WHERE id = $1 AND user_id = $2
       RETURNING id, cover_image`,
      [memoryId, req.session.userId]
    );

    if (!result.rowCount) {
      return res.status(404).json({
        success: false,
        message: 'Memory not found or does not belong to you.'
      });
    }

    await removePrivateMedia(
      result.rows[0].cover_image,
      req.session.userId
    );

    return res.json({
      success: true,
      message: 'Memory deleted successfully.'
    });
  } catch (error) {
    console.error('Delete memory error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Unable to delete memory.'
    });
  }
});

app.patch('/api/memories/:id/favorite', requireLogin, async (req, res) => {
  try {
    const memoryId = Number(req.params.id);

    if (!Number.isInteger(memoryId) || memoryId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid memory ID.'
      });
    }

    const result = await pool.query(
      `UPDATE memories
       SET is_favorite = CASE
         WHEN is_favorite = 1 THEN 0 ELSE 1 END,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2
       RETURNING is_favorite`,
      [memoryId, req.session.userId]
    );

    if (!result.rowCount) {
      return res.status(404).json({
        success: false,
        message: 'Memory not found.'
      });
    }

    const isFavorite = Boolean(result.rows[0].is_favorite);

    return res.json({
      success: true,
      isFavorite,
      message: isFavorite
        ? 'Memory added to favorites.'
        : 'Memory removed from favorites.'
    });
  } catch (error) {
    console.error('Favorite error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Unable to update favorite.'
    });
  }
});

app.patch('/api/memories/:id/like', requireLogin, async (req, res) => {
  try {
    const memoryId = Number(req.params.id);

    if (!Number.isInteger(memoryId) || memoryId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid memory ID.'
      });
    }

    const result = await pool.query(
      `UPDATE memories
       SET likes = GREATEST(COALESCE(likes, 0), 0) + 1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2
       RETURNING likes`,
      [memoryId, req.session.userId]
    );

    if (!result.rowCount) {
      return res.status(404).json({
        success: false,
        message: 'Memory not found.'
      });
    }

    return res.json({
      success: true,
      likes: Number(result.rows[0].likes)
    });
  } catch (error) {
    console.error('Like error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Unable to update likes.'
    });
  }
});

// Centralized request and upload error handler.
app.use((err, req, res, next) => {
  console.error('Request error:', err.message);

  if (res.headersSent) return next(err);

  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: err.code === 'LIMIT_FILE_SIZE'
        ? 'File exceeds the 50 MB limit.'
        : 'Invalid upload.'
    });
  }

  if (err.message && err.message.startsWith('Unsupported file type')) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  return res.status(500).json({
    success: false,
    message: 'Unexpected server error.'
  });
});

const server = app.listen(PORT, () => {
  console.log(`EchoLife server running at http://localhost:${PORT}`);
  console.log('Database: Supabase PostgreSQL');
});

let isShuttingDown = false;

async function shutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`${signal} received. Shutting down EchoLife...`);

  server.close(async () => {
    try {
      await pool.end();
      console.log('EchoLife stopped successfully.');
      process.exit(0);
    } catch (error) {
      console.error('Shutdown error:', error.message);
      process.exit(1);
    }
  });
}

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));
