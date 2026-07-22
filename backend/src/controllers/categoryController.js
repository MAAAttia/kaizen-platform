const prisma = require('../config/prisma');
const { isNonEmptyString } = require('../utils/validate');
const { logAction } = require('../utils/auditLog');

async function list(req, res) {
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
  res.json({ categories });
}

async function create(req, res) {
  const { name } = req.body;
  if (!isNonEmptyString(name, 100)) {
    return res.status(400).json({ error: 'Please provide a category name.' });
  }
  const category = await prisma.category.create({ data: { name: name.trim() } });
  await logAction(req.user.id, 'CREATE_CATEGORY', 'Category', category.id, { name: category.name });
  res.status(201).json({ category });
}

async function remove(req, res) {
  const { id } = req.params;
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) return res.status(404).json({ error: 'Category not found.' });

  await prisma.category.delete({ where: { id } });
  await logAction(req.user.id, 'DELETE_CATEGORY', 'Category', id, { name: category.name });
  res.json({ message: 'Category deleted.' });
}

module.exports = { list, create, remove };
