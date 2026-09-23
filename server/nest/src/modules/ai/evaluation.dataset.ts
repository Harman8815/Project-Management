export const aiEvaluationCases = [
  {
    name: "project status is grounded in task data",
    prompt: "Give me a status summary",
    expectedText: "completed",
  },
  {
    name: "risk answer reports overdue work",
    prompt: "What is the current risk?",
    expectedText: "overdue",
  },
];
