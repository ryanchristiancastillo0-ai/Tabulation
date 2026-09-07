const bcrypt = require('bcrypt');
const pool = require('../config/db');
const HttpError = require('../utils/http-error');

// ── CREATE SCHOOL + ADMIN (atomic) ──
async function createSchool(body) {
  const {
    school_name,
    school_logo,
    school_email,
    school_phone,
    school_address,
    subscription_plan,
    judge_password,
    // admin fields
    admin_name,
    admin_email,
    admin_password,
  } = body;

  if (!school_name) {
    throw new HttpError(400, 'school_name is required.');
  }

  if (!admin_name || !admin_email || !admin_password) {
    throw new HttpError(400, 'Admin name, email, and password are required.');
  }

  if (!judge_password || judge_password.length < 8) {
    throw new HttpError(400, 'Judge password is required (minimum 8 characters).');
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // ── Pre-check duplicates, but treat an exact re-submission as success ──
    // If the very same school (same school email + admin email + name) already
    // exists, the first request likely succeeded but the client didn't get the
    // response. Return success instead of confusing the user with a 409.
    const normSchoolEmail = school_email ? String(school_email).trim() : null;
    const normAdminEmail  = String(admin_email).trim();

    if (normSchoolEmail) {
      const [existing] = await conn.execute(
        `SELECT s.id
           FROM schools s
           JOIN admins a ON a.school_id = s.id
          WHERE s.school_email = ? AND a.email = ? AND s.school_name = ?
          LIMIT 1`,
        [normSchoolEmail, normAdminEmail, school_name]
      );
      if (existing.length) {
        await conn.rollback();
        return {
          success:         true,
          message:         'This school was already created.',
          school_id:       existing[0].id,
          alreadyExists:   true,
        };
      }
    }

    // Any other conflict → specific, useful error
    if (normSchoolEmail) {
      const [schoolDup] = await conn.execute(
        'SELECT id FROM schools WHERE school_email = ? LIMIT 1',
        [normSchoolEmail]
      );
      if (schoolDup.length) {
        throw new HttpError(409, 'That school email is already registered. Please use a different one.');
      }
    }
    const [adminDup] = await conn.execute(
      'SELECT id FROM admins WHERE email = ? LIMIT 1',
      [normAdminEmail]
    );
    if (adminDup.length) {
      throw new HttpError(409, 'That admin email is already registered. Please use a different one.');
    }

    // ── Step 1: insert school ──────────────────────────────────────
    const hashedJudgePw = await bcrypt.hash(judge_password, 10);

    const [schoolResult] = await conn.execute(
      `INSERT INTO schools
          (school_name, school_logo, school_email, school_phone, school_address, judge_password, subscription_plan, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
      [
        school_name,
        school_logo        || null,
        school_email       ? String(school_email).trim() : null,
        school_phone       || null,
        school_address     || null,
        hashedJudgePw,
        subscription_plan  || 'free',
      ]
    );

    const school_id = schoolResult.insertId;

    // ── Step 2: insert admin linked to that school ─────────────────
    const hashedPassword = await bcrypt.hash(admin_password, 10);

    const [adminResult] = await conn.execute(
      `INSERT INTO admins (name, email, password, school_id)
       VALUES (?, ?, ?, ?)`,
      [admin_name, String(admin_email).trim(), hashedPassword, school_id]
    );

    // ── Step 3: seed system_config with school logo so sidebar shows it ──
    if (school_logo) {
      await conn.execute(
        `INSERT INTO system_config (school_id, school_logo, school_name)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE
           school_logo = VALUES(school_logo),
           school_name = VALUES(school_name)`,
        [school_id, school_logo, school_name]
      );
    }

    // ── Step 4: seed an empty settings row for this school ─────────
    // This is CRITICAL. Without this row, save-config's
    // INSERT ... ON DUPLICATE KEY UPDATE has no existing row to match
    // on school_id, so MySQL may update a different school's row instead.
    await conn.execute(
      `INSERT INTO settings
          (school_id, contest_name, contest_type, judge_count, ai_prompt, computation_type, is_judge_locked)
       VALUES (?, '', 'pageant', 3, 'Modern and Professional', 'average', 0)
       ON DUPLICATE KEY UPDATE school_id = school_id`,
      [school_id]
    );

    await conn.commit();

    return {
      success:  true,
      message:  'School and admin created successfully.',
      school_id,
      admin_id: adminResult.insertId,
    };
  } catch (err) {
    await conn.rollback();

    if (err instanceof HttpError) {
      throw err;
    }

    if (err.code === 'ER_DUP_ENTRY') {
      const msg = String(err.message || '');
      if (msg.includes('school_email')) {
        throw new HttpError(409, 'That school email is already registered. Please use a different one.');
      }
      if (msg.includes('admins.email') || msg.includes('admin.email')) {
        throw new HttpError(409, 'That admin email is already registered. Please use a different one.');
      }
      throw new HttpError(409, 'That school or admin email is already registered.');
    }
    console.error('Create school error:', err.message);
    throw err;
  } finally {
    conn.release();
  }
}

// ── GET ALL SCHOOLS ──
async function listSchools() {
  const [schools] = await pool.execute('SELECT * FROM schools ORDER BY created_at DESC');
  return schools;
}

// ── GET SINGLE SCHOOL ──
async function getSchoolById(id) {
  const [rows] = await pool.execute('SELECT * FROM schools WHERE id = ?', [id]);
  if (rows.length === 0) {
    throw new HttpError(404, 'School not found.');
  }
  return rows[0];
}

// ── UPDATE SCHOOL ──
async function updateSchool(id, body) {
  const {
    school_name, school_logo, school_email,
    school_phone, school_address, subscription_plan, status,
  } = body;

  try {
    await pool.execute(
      `UPDATE schools
       SET school_name       = ?,
           school_logo       = ?,
           school_email      = ?,
           school_phone      = ?,
           school_address    = ?,
           subscription_plan = ?,
           status            = ?
       WHERE id = ?`,
      [
        school_name,
        school_logo       || null,
        school_email      || null,
        school_phone      || null,
        school_address    || null,
        subscription_plan || 'free',
        status            || 'active',
        id,
      ]
    );
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      throw new HttpError(409, 'A school with this email already exists.');
    }
    console.error('Update school error:', err.message);
    throw err;
  }

  return { success: true, message: 'School updated successfully.' };
}

// ── UPDATE JUDGE PASSWORD ──
async function updateJudgePassword(id, password) {
  if (!password) {
    throw new HttpError(400, 'Judge password is required.');
  }
  if (String(password).length < 8) {
    throw new HttpError(400, 'Judge password must be at least 8 characters.');
  }

  const hashed = await bcrypt.hash(String(password), 10);
  const [result] = await pool.execute(
    'UPDATE schools SET judge_password = ? WHERE id = ?',
    [hashed, id]
  );

  if (result.affectedRows === 0) {
    throw new HttpError(404, 'School not found.');
  }
  return { success: true, message: 'Judge password updated.' };
}

// ── DELETE SCHOOL ──
async function deleteSchool(id) {
  const [result] = await pool.execute('DELETE FROM schools WHERE id = ?', [id]);
  if (result.affectedRows === 0) {
    throw new HttpError(404, 'School not found.');
  }
  return { success: true, message: 'School deleted.' };
}

module.exports = { createSchool, listSchools, getSchoolById, updateSchool, updateJudgePassword, deleteSchool };