// Tests select the intended option by its rendered text, just as a learner
// would. They must not submit the bank's private option IDs.
module.exports = (delivered, bank, answer) => {
  if (!bank.options.length) return answer;
  const one = (id) => {
    const text = typeof bank.options[0] === 'string' ? bank.options[Number(id)] : bank.options.find((o) => o.id === id)?.text;
    return delivered.options.find((o) => o.text === text)?.id || '';
  };
  return Array.isArray(answer) ? answer.map(one) : one(answer);
};
