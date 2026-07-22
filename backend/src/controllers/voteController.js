const prisma = require('../config/prisma');

const VOTABLE_STATUSES = ['SUBMITTED', 'UNDER_REVIEW', 'IN_PROGRESS'];

async function voteOnIdea(req, res) {
  const { id } = req.params;
  const { value } = req.body;

  if (value !== 'UP' && value !== 'DOWN') {
    return res.status(400).json({ error: "Vote value must be 'UP' or 'DOWN'." });
  }

  const idea = await prisma.idea.findUnique({ where: { id } });
  if (!idea) return res.status(404).json({ error: 'Idea not found.' });
  if (!VOTABLE_STATUSES.includes(idea.status)) {
    return res.status(400).json({ error: 'Voting is closed for this idea.' });
  }

  const existing = await prisma.vote.findUnique({
    where: { ideaId_userId: { ideaId: id, userId: req.user.id } },
  });

  const result = await prisma.$transaction(async (tx) => {
    let myVote = value;
    let delta = 0;

    if (!existing) {
      await tx.vote.create({ data: { ideaId: id, userId: req.user.id, value } });
      delta = value === 'UP' ? 1 : -1;
    } else if (existing.value === value) {
      // Clicking the same direction again removes the vote (toggle off).
      await tx.vote.delete({ where: { id: existing.id } });
      delta = value === 'UP' ? -1 : 1;
      myVote = null;
    } else {
      // Switching direction swings the score by 2.
      await tx.vote.update({ where: { id: existing.id }, data: { value } });
      delta = value === 'UP' ? 2 : -2;
    }

    const updatedIdea = await tx.idea.update({
      where: { id },
      data: { score: { increment: delta } },
    });

    return { score: updatedIdea.score, myVote };
  });

  res.json(result);
}

module.exports = { voteOnIdea };
