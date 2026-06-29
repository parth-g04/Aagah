function generateWeeklySummary(blocks, interventions) {
  let crossedCount = 0;
  for (const block of blocks) {
    let history = [];
    if (typeof block.stress_history === 'string') {
      try {
        history = JSON.parse(block.stress_history);
      } catch (e) {
        history = [];
      }
    } else if (Array.isArray(block.stress_history)) {
      history = block.stress_history;
    }

    const secondToLast = history.length >= 2 ? history[history.length - 2] : 0;
    if (block.stress_index >= 75 && secondToLast < 75) {
      crossedCount++;
    }
  }

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const activeInterventionsCount = interventions.filter(i => 
    (i.status === 'active' || i.status === 'scheduled') && 
    i.created_at >= sevenDaysAgo
  ).length;

  if (crossedCount === 0) {
    if (activeInterventionsCount > 0) {
      return `No blocks have crossed the stress threshold this week, and ${activeInterventionsCount} active intervention${activeInterventionsCount > 1 ? 's are' : ' is'} underway.`;
    }
    return "No blocks have crossed the stress threshold this week.";
  }

  const blockText = crossedCount === 1 ? "1 block" : `${crossedCount} blocks`;
  const interventionText = activeInterventionsCount === 1 ? "1 intervention is" : `${activeInterventionsCount} interventions are`;

  return `${blockText} crossed the stress threshold this week. ${interventionText} already moving.`;
}

module.exports = { generateWeeklySummary };
