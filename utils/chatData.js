const { totalIncomeFunction, totalExpenseFunction } = require("./totals");

const getIncomeExpenseChartData = async (email, collection, type) => {
  const query = {
    email: email,
    type: type,
  };
  // Find all data that a user has
  const singlePersonData = await collection.find(query).toArray();

  if (type === "INCOME") {
    //Allowance
    //Salary
    //pettyCash
    //Bonus
    //Others
    /***************  Allowance ***************/
    const allowances = singlePersonData.filter(
      (allowance) => allowance.category === "Allowance"
    );

    /***************  Salary ***************/
    const salaries = singlePersonData.filter(
      (salary) => salary.category === "Salary"
    );

    /***************  pettyCash ***************/
    const pettyCashes = singlePersonData.filter(
      (pettyCash) => pettyCash.category === "pettyCash"
    );
    /***************  Bonus ***************/
    const bonuses = singlePersonData.filter(
      (bonus) => bonus.category === "Bonus"
    );
    /***************  Others ***************/
    const others = singlePersonData.filter(
      (other) => other.category === "Others"
    );

    const incomeData = await totalIncomeFunction(
      allowances,
      salaries,
      pettyCashes,
      bonuses,
      others
    );
    return incomeData;
  } else if (type === "EXPENSE") {
    // Food
    // Cloth
    // Education
    // Social
    // Regular
    // Health
    /***************  Food ***************/
    const foods = singlePersonData.filter((food) => food.category === "Food");

    /***************  Cloth ***************/
    const clothes = singlePersonData.filter(
      (cloth) => cloth.category === "Cloth"
    );

    /***************  Education ***************/
    const educations = singlePersonData.filter(
      (education) => education.category === "Education"
    );

    /***************  Social ***************/
    const socials = singlePersonData.filter(
      (social) => social.category === "Social"
    );

    /***************  Regular ***************/
    const regulars = singlePersonData.filter(
      (regular) => regular.category === "Regular"
    );

    /***************  Health ***************/
    const health = singlePersonData.filter((hlt) => hlt.category === "Health");

    const expenseData = await totalExpenseFunction(
      foods,
      clothes,
      educations,
      socials,
      regulars,
      health
    );
    return expenseData;
  }
};

module.exports = {
  getIncomeExpenseChartData,
};
