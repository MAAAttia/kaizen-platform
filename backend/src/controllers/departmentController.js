const prisma = require('../config/prisma');
const { isNonEmptyString } = require('../utils/validate');
const { logAction } = require('../utils/auditLog');

async function list(req, res) {
  const departments = await prisma.department.findMany({ orderBy: { name: 'asc' } });
  res.json({ departments });
}

async function create(req, res) {
  const { name } = req.body;
  if (!isNonEmptyString(name, 100)) {
    return res.status(400).json({ error: 'Please provide a department name.' });
  }
  const department = await prisma.department.create({ data: { name: name.trim() } });
  await logAction(req.user.id, 'CREATE_DEPARTMENT', 'Department', department.id, { name: department.name });
  res.status(201).json({ department });
}

async function remove(req, res) {
  const { id } = req.params;
  const department = await prisma.department.findUnique({ where: { id } });
  if (!department) return res.status(404).json({ error: 'Department not found.' });

  await prisma.department.delete({ where: { id } });
  await logAction(req.user.id, 'DELETE_DEPARTMENT', 'Department', id, { name: department.name });
  res.json({ message: 'Department deleted.' });
}

module.exports = { list, create, remove };
