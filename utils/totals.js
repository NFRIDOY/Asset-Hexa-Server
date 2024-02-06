const totalIncomeFunction = async (
  allowances,
  salaries,
  pettyCashes,
  bonuses,
  others
) => {
  // Total of Allowance
  const allowanceTotal = allowances.reduce(
    (acc, allowance) => acc + parseFloat(allowance?.amount),
    0
  );

  // Total of Salary
  const salaryTotal = salaries.reduce(
    (acc, salary) => acc + parseFloat(salary?.amount),
    0
  );

  // Total of pettyCashes
  const pettyCashTotal = pettyCashes.reduce(
    (acc, pettyCash) => acc + parseFloat(pettyCash?.amount),
    0
  );

  // Total of bonuses
  const bonusTotal = bonuses.reduce(
    (acc, bonus) => acc + parseFloat(bonus?.amount),
    0
  );
  // Total of bonuses
  const othersTotal = others.reduce(
    (acc, other) => acc + parseFloat(other?.amount),
    0
  );

  const data = [
    { name: "Allowance", value: allowanceTotal },
    { name: "Salary", value: salaryTotal },
    { name: "pettyCash", value: pettyCashTotal },
    { name: "Bonus", value: bonusTotal },
    { name: "Others", value: othersTotal },
  ];
  return data;
};

const totalExpenseFunction = async (
  foods,
  clothes,
  educations,
  socials,
  regulars,
  health
) => {
  // Total of foods
  const foodsTotal = foods.reduce(
    (acc, food) => acc + parseFloat(food?.amount),
    0
  );

  // Total of clothes
  const clothesTotal = clothes.reduce(
    (acc, cloth) => acc + parseFloat(cloth?.amount),
    0
  );

  // Total of educations
  const educationsTotal = educations.reduce(
    (acc, education) => acc + parseFloat(education?.amount),
    0
  );

  // Total of socials
  const socialsTotal = socials.reduce(
    (acc, social) => acc + parseFloat(social?.amount),
    0
  );
  // Total of regulars
  const regularsTotal = regulars.reduce(
    (acc, regular) => acc + parseFloat(regular?.amount),
    0
  );

  // Total of health
  const healthTotal = health.reduce(
    (acc, helth) => acc + parseFloat(helth?.amount),
    0
  );

  const data = [
    { name: "Food", value: foodsTotal },
    { name: "Cloth", value: clothesTotal },
    { name: "Education", value: educationsTotal },
    { name: "Social", value: socialsTotal },
    { name: "Regular", value: regularsTotal },
    { name: "Health", value: healthTotal },
  ];
  return data;
};
module.exports = {
  totalIncomeFunction,
  totalExpenseFunction,
};
