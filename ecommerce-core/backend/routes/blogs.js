const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../config/db');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Helper to generate URL-friendly slug from title
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
};

// GET ALL BLOGS (Public)
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM blogs ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching blogs:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// GET SINGLE BLOG BY ID OR SLUG (Public)
router.get('/:idOrSlug', async (req, res) => {
  const { idOrSlug } = req.params;
  try {
    const result = await db.query(
      'SELECT * FROM blogs WHERE id = ? OR slug = ?',
      [idOrSlug, idOrSlug]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Artículo no encontrado.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching blog:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// CREATE BLOG (Admin Only)
router.post('/', verifyToken, isAdmin, async (req, res) => {
  const { title, excerpt, content, category, image_url } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'El título y el contenido son obligatorios.' });
  }

  let slug = slugify(title);
  
  try {
    // Ensure unique slug
    const slugExist = await db.query('SELECT id FROM blogs WHERE slug = ?', [slug]);
    if (slugExist.rows.length > 0) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const blogId = crypto.randomUUID();

    await db.query(
      `INSERT INTO blogs (id, title, slug, excerpt, content, category, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [blogId, title, slug, excerpt || '', content, category || 'General', image_url || null]
    );

    const result = await db.query('SELECT * FROM blogs WHERE id = ?', [blogId]);
    res.status(201).json({
      message: 'Artículo creado exitosamente.',
      blog: result.rows[0]
    });
  } catch (err) {
    console.error('Error creating blog:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// UPDATE BLOG (Admin Only)
router.put('/:id', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { title, excerpt, content, category, image_url } = req.body;

  try {
    const blogQuery = await db.query('SELECT * FROM blogs WHERE id = ?', [id]);
    if (blogQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Artículo no encontrado.' });
    }
    const currentBlog = blogQuery.rows[0];

    const updatedTitle = title || currentBlog.title;
    const updatedExcerpt = excerpt !== undefined ? excerpt : currentBlog.excerpt;
    const updatedContent = content || currentBlog.content;
    const updatedCategory = category || currentBlog.category;
    const updatedImageUrl = image_url !== undefined ? image_url : currentBlog.image_url;
    
    // Regenerate slug if title changed
    let updatedSlug = currentBlog.slug;
    if (title && title !== currentBlog.title) {
      updatedSlug = slugify(title);
      const slugExist = await db.query('SELECT id FROM blogs WHERE slug = ? AND id != ?', [updatedSlug, id]);
      if (slugExist.rows.length > 0) {
        updatedSlug = `${updatedSlug}-${Date.now().toString().slice(-4)}`;
      }
    }

    await db.query(
      `UPDATE blogs 
       SET title = ?, slug = ?, excerpt = ?, content = ?, category = ?, image_url = ?
       WHERE id = ?`,
      [updatedTitle, updatedSlug, updatedExcerpt, updatedContent, updatedCategory, updatedImageUrl, id]
    );

    const result = await db.query('SELECT * FROM blogs WHERE id = ?', [id]);
    res.json({
      message: 'Artículo actualizado exitosamente.',
      blog: result.rows[0]
    });
  } catch (err) {
    console.error('Error updating blog:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// DELETE BLOG (Admin Only)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const checkBlog = await db.query('SELECT id FROM blogs WHERE id = ?', [id]);
    if (checkBlog.rows.length === 0) {
      return res.status(404).json({ error: 'Artículo no encontrado.' });
    }

    await db.query('DELETE FROM blogs WHERE id = ?', [id]);
    res.json({ message: 'Artículo eliminado exitosamente.' });
  } catch (err) {
    console.error('Error deleting blog:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

module.exports = router;
