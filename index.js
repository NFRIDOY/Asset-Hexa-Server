//npm i express cors dotenv
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const app = express();
const port = process.env.PORT || 5000;
const { getIncomeExpenseChartData } = require("./utils/chatData");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { verifyToken } = require("./utils/jwt");

// req
app.use(express.json());
app.use(cookieParser());
// app.use(cors())
app.use(
  cors({
    origin: [
      "https://asset-hexa.web.app",
      "https://asset-hexa.firebaseapp.com",
      "http://localhost:5173",
      "http://localhost:5174",
    ],
    credentials: true,
  })
);

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster1.mq17fxg.mongodb.net/?retryWrites=true&w=majority`;
const uri = process.env.URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const database = client.db("assethexadb");
    const usersCollection = database.collection("users");
    const transectionsCollection = database.collection("transections");
    const accountsCollection = database.collection("accounts");
    const categoryCollection = database.collection("categoris");
    const blogCollection = database.collection("blogs");
    const bookmarkCollection = database.collection("bookmark");
    const newsLetterSubscriptionCollection = database.collection(
      "newsLetterSubscription"
    );
    const businessesCollection = database.collection("businesses");
    const investmentsCollection = database.collection("investments");
    const paymentCollection = database.collection("payments");
    const notificationCollection = database.collection("notification");
    const unseenNotificationPerUser = database.collection(
      "unseenNotificationPerUser"
    );
    const budgetCollection = database.collection("budget");

    /************************ JSON WEB TOKEN (JWT) ********************************/
    app.post("/api/v1/jwt", async (req, res) => {
      const user = req?.body;
      // console.log(user);
      if (!user) return res.status(404).json({ message: "user not found!" });
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "365d",
      });
      res.send({ token });
    });
    // use verify admin after verify token
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded?.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const isAdmin = user?.role === "admin";
      if (!isAdmin) {
        return res.status(403).send({ message: "forbidden access" });
      }
      next();
    };

    /************************ JSON WEB TOKEN (JWT) END ********************************/

    // Save or modify user email, status in DB
    app.put("/users/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const query = { email: email };
      const options = { upsert: true };
      const isExist = await usersCollection.findOne(query);
      // console.log("User found?----->", isExist);
      if (isExist) return res.send(isExist);
      const result = await usersCollection.updateOne(
        query,
        {
          $set: { ...user, timestamp: Date.now() },
        },
        options
      );
      res.send(result);
    });

    // Get all users
    app.get("/users", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    app.get("/users/:id", async (req, res) => {
      // console.log(req.query);
      const { id } = req.params;
      const query = { _id: new ObjectId(id) };
      const result = await usersCollection.findOne(query);
      res.send(result);
    });

    // Get single  user

    app.get("/user/:email", async (req, res) => {
      const email = req.params.email;
      const result = await usersCollection.findOne({ email });
      res.send(result);
    });

    app.put("/users/update/:id", async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      // console.log(data);
      const filter = { _id: new ObjectId(id) };
      const option = { upsert: true };

      const updateDoc = {
        $set: {
          displayName: data.displayName,

          photoURL: data.photoURL,
        },
      };
      const result = await usersCollection.updateOne(filter, updateDoc, option);
      res.send(result);
    });

    app.post("/transections", verifyToken, async (req, res) => {
      try {
        // const id = req.params.id;
        const account = req.body?.account;
        const newTransections = req.body;
        const newTransectionsEmail = req.body?.email;
        // const newTransectionsAmount = req.body.amount;
        const typeTransec = req.body?.type;

        const options = { upsert: false };

        // fixt from bug
        if (typeTransec === "INCOME") {
          const filter = { account: account, email: newTransectionsEmail };

          const queryAccount = {
            account: account,
            email: newTransectionsEmail,
          };
          // find the account
          const accountfindOne = await accountsCollection.findOne(queryAccount);

          // init amount of that account
          let AmountOnAccount = accountfindOne?.amount;

          AmountOnAccount = AmountOnAccount + newTransections?.amount;

          const transectionsUpdateAccount = {
            $set: {
              // TODO: update property
              amount: AmountOnAccount,
            },
          };

          // insertOne into transections collection
          const resultTransec = await transectionsCollection.insertOne(
            newTransections
          );

          // update on account
          const resultAccount = await accountsCollection.updateOne(
            filter,
            transectionsUpdateAccount,
            options
          );

          // respose
          const result = {
            resultTransec,
            resultAccount,
          };
          return res.send(result);
        }

        // rean
        else if (typeTransec === "EXPENSE") {
          const filter = { account: account, email: newTransectionsEmail };
          // const options = { upsert: true };

          const queryAccount = {
            account: account,
            email: newTransectionsEmail,
          };

          // find the account
          const accountfindOne = await accountsCollection.findOne(queryAccount);

          let AmountOnAccount = accountfindOne?.amount;
          AmountOnAccount = AmountOnAccount - newTransections?.amount;

          const transectionsUpdateAccount = {
            $set: {
              // TODO: update property
              amount: AmountOnAccount,
            },
          };

          // insertOne into transections collection
          const resultTransec = await transectionsCollection.insertOne(
            newTransections
          );

          // update on account
          const resultAccount = await accountsCollection.updateOne(
            filter,
            transectionsUpdateAccount,
            options
          );

          // respose
          const result = {
            resultTransec,
            resultAccount,
          };
          return res.send(result);
        } else if (typeTransec === "TRANSFER") {
          const fiterFrom = {
            account: req.body?.from,
            email: newTransectionsEmail,
          };

          const filterTo = {
            account: req.body?.to,
            email: newTransectionsEmail,
          };

          // find the account
          const AccountFrom = await accountsCollection.findOne(fiterFrom);
          const accountfindOneTo = await accountsCollection.findOne(filterTo);

          // output
          // console.log("acc From", AccountFrom);
          // console.log("acc To", accountfindOneTo);

          //set the account amount
          let AmountOnAccountForm = AccountFrom?.amount;

          let AmountOnAccountTo = accountfindOneTo?.amount;
          AmountOnAccountForm = AmountOnAccountForm - newTransections?.amount;
          AmountOnAccountTo = AmountOnAccountTo + newTransections?.amount;

          const transectionsUpdateAccFrom = {
            $set: {
              // TODO: update property
              amount: AmountOnAccountForm,
            },
          };
          const transectionsUpdateAccTo = {
            $set: {
              // TODO: update property
              amount: AmountOnAccountTo,
            },
          };

          // insertOne into transections collection
          const resultTransec = await transectionsCollection.insertOne(
            newTransections
          );

          // update on account Form
          const resultAccountForm = await accountsCollection.updateOne(
            fiterFrom,
            transectionsUpdateAccFrom,
            options
          );

          // update on account to
          const resultAccountTo = await accountsCollection.updateOne(
            filterTo,
            transectionsUpdateAccTo,
            options
          );

          res.send({ resultTransec, resultAccountForm, resultAccountTo });
        } else {
          // AmountOnAccount = AmountOnAccount
          res.status(400).json({ error: "Error" });
        }
      } catch (error) {
        res.send(error.message);
      }
    });

    // read
    // DEMO /transections?type=INCOME
    // DEMO /transections?type=EXPENSE
    // Example: https://asset-hexa-server.vercel.app/transections?type=INCOME&email=backend@example.com)
    // Example: https://asset-hexa-server.vercel.app/transections?type=EXPENSE&email=backend@example.com)
    // Example: https://asset-hexa-server.vercel.app/transections?type=TRANSFER&email=backend@example.com)
    // Example: https://asset-hexa-server.vercel.app/transections?&email=backend@example.com) => all translations
    app.get("/transections", verifyToken, async (req, res) => {
      try {
        const transQuery = req.query.type;
        const emailQuery = req.query.email;
        let query = {};
        // console.log(transQuery);
        // console.log(emailQuery);
        if (transQuery) {
          query = { type: transQuery, email: emailQuery };
        } else {
          query = { email: emailQuery };
        }
        const cursor = transectionsCollection.find(query);
        const result = await cursor.toArray();
        res.send(result);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    });
    app.get("/transections", async (req, res) => {
      try {
        const transQuery = req.query.type;
        const emailQuery = req.query.email;
        let query = {};
        // console.log(transQuery);
        // console.log(emailQuery);
        if (transQuery) {
          query = { type: transQuery, email: emailQuery };
        } else {
          query = { email: emailQuery };
        }
        const cursor = transectionsCollection.find(query);
        const result = await cursor.toArray();
        res.send(result);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    });

    // delete

    app.delete("/transections/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await transectionsCollection.deleteOne(query);
        res.send(result);
      } catch (error) {
        res.send(error.message);
      }
    });

    // find one

    app.get("/transections/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await transectionsCollection.findOne(query);
        res.send(result);
      } catch (error) {
        res.send(error.message);
      }
    });

    // update

    app.put("/transections/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const options = { upsert: true };
        const updateTransections = req.body;
        const transections = {
          $set: {
            // TODO: update property
          },
        };

        const result = await transectionsCollection.updateOne(
          filter,
          transections,
          options
        );
        res.send(result);
      } catch (error) {
        res.send(error.message);
      }
    });

    app.get("/totalInExp", verifyToken, async (req, res) => {
      const userQueryEmail = req.query.email;

      const queryIncome = { type: "INCOME", email: userQueryEmail };
      const queryExpense = { type: "EXPENSE", email: userQueryEmail };

      // Execute query
      const cursorIncome = await transectionsCollection
        .find(queryIncome)
        .toArray();
      const cursorExpense = await transectionsCollection
        .find(queryExpense)
        .toArray();

      // console.log("cursorIncome",cursorIncome);
      // console.log("cursorExpense",cursorExpense);
      const allTrasIncome = cursorIncome?.map((tr) => parseFloat(tr?.amount));
      const allTrasExpense = cursorExpense?.map((tr) => parseFloat(tr?.amount));

      const totalIncome = allTrasIncome?.reduce((obj1, obj2) => {
        return obj1 + obj2;
      }, 0);
      const totalExpense = allTrasExpense?.reduce((obj1, obj2) => {
        return obj1 + obj2;
      }, 0);

      res.send({ totalIncome, totalExpense });
    });

    // Save or modify user email, status in DB
    app.put("/users/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const query = { email: email };
      const options = { upsert: true };
      const isExist = await usersCollection.findOne(query);
      // console.log("User found?----->", isExist);
      if (isExist) return res.send(isExist);
      const result = await usersCollection.updateOne(
        query,
        {
          $set: { ...user, timestamp: Date.now() },
        },
        options
      );
      res.send(result);
    });

    //todo Income Expense chart data
    // Chart data for accounts
    app.get("/chartData/:email", verifyToken, async (req, res) => {
      const { email } = req.params;
      const query = { email: email };

      try {
        // Find all data that a user has
        const singlePersonData = await accountsCollection.find(query).toArray();

        /***************  CASH ***************/
        const cashes = singlePersonData.filter(
          (account) => account.group === "Cash"
        );

        /***************  ACCOUNT ***************/
        const accounts = singlePersonData.filter(
          (account) => account.group === "Account"
        );

        /***************  LOAN ***************/
        const loans = singlePersonData.filter(
          (account) => account.group === "Loan"
        );

        /***************  Saving ***************/
        const savings = singlePersonData.filter(
          (account) => account.group === "Saving"
        );

        const totalFunction = async (cashes, accounts, loans, savings) => {
          const cashTotal = cashes.reduce(
            (acc, cash) => acc + parseFloat(cash?.amount),
            0
          );
          const accountTotal = accounts.reduce(
            (acc, account) => acc + parseFloat(account?.amount),
            0
          );
          const loanTotal = loans.reduce(
            (acc, Loan) => acc + parseFloat(Loan?.amount),
            0
          );
          const savingTotal = savings.reduce(
            (acc, Saving) => acc + parseFloat(Saving?.amount),
            0
          );
          const data = [
            { name: "Cash", value: cashTotal },
            { name: "Account", value: accountTotal },
            { name: "Loan", value: loanTotal },
            { name: "Saving", value: savingTotal },
          ];
          return data;
        };
        const accountData = await totalFunction(
          cashes,
          accounts,
          loans,
          savings
        );
        const incomeData = await getIncomeExpenseChartData(
          email,
          transectionsCollection,
          "INCOME"
        );
        const expenseData = await getIncomeExpenseChartData(
          email,
          transectionsCollection,
          "EXPENSE"
        );

        res.send({ accountData, incomeData, expenseData });
      } catch (error) {
        // console.error(error);
        res.status(500).send("Internal Server Error");
      }
    });

    // Get all users
    app.get("/users", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    // read
    // DEMO /transections?type=INCOME
    // DEMO /transections?type=EXPENSE
    // Example: https://asset-hexa-server.vercel.app/transections?type=INCOME&email=backend@example.com)
    // Example: https://asset-hexa-server.vercel.app/transections?type=EXPENSE&email=backend@example.com)
    // app.get("/transections", async (req, res) => {
    //   try {
    //     const transQuery = req.query?.type;
    //     const emailQuery = req.query?.email;
    //     const query = { type: transQuery, email: emailQuery };
    //     const cursor = transectionsCollection.find(query);
    //     const result = await cursor.toArray();
    //     res.send(result);
    //   } catch (error) {
    //     res.status(500).json({ message: error.message });
    //   }
    // });

    // // delete

    // app.delete("/transections/:id", async (req, res) => {
    //   try {
    //     const id = req.params.id;
    //     const query = { _id: new ObjectId(id) };
    //     const result = await transectionsCollection.deleteOne(query);
    //     res.send(result);
    //   } catch (error) {
    //     res.send(error.message);
    //   }
    // });

    // // find one

    // app.get("/transections/:id", async (req, res) => {
    //   try {
    //     const id = req.params.id;
    //     const query = { _id: new ObjectId(id) };
    //     const result = await transectionsCollection.findOne(query);
    //     res.send(result);
    //   } catch (error) {
    //     res.send(error.message);
    //   }
    // });

    // // update

    // app.put("/transections/:id", async (req, res) => {
    //   try {
    //     const id = req.params.id;
    //     const filter = { _id: new ObjectId(id) };
    //     const options = { upsert: true };
    //     const updateTransections = req.body;
    //     const transections = {
    //       $set: {
    //         // TODO: update property
    //       },
    //     };

    //     const result = await transectionsCollection.updateOne(
    //       filter,
    //       transections,
    //       options
    //     );
    //     res.send(result);
    //   } catch (error) {
    //     res.send(error.message);
    //   }
    // });

    // for accounts
    // create

    app.post("/accounts", verifyToken, async (req, res) => {
      try {
        const newAccounts = req.body;

        const result = await accountsCollection.insertOne(newAccounts);
        res.send(result);
      } catch (error) {}
    });

    // read
    app.get("/accounts", verifyToken, async (req, res) => {
      try {
        const emailQuery = req?.query?.email;
        const query = { email: emailQuery };
        const cursor = accountsCollection.find(query);
        const result = await cursor.toArray();
        res.send(result);
      } catch (error) {
        res.send(error.message);
      }
    });

    // delete account
    app.delete("/accounts/:id", verifyToken, async (req, res) => {
      try {
        const id = req.params?.id;
        const query = { _id: new ObjectId(id) };
        const result = await accountsCollection.deleteOne(query);
        res.send(result);
      } catch (error) {
        res.send(error.message);
      }
    });

    // update account
    app.put("/accounts/:id", verifyToken, async (req, res) => {
      const id = req.params?.id;
      const data = req.body;
      // console.log("id", id, data);
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const addBalance = {
        $set: {
          group: data.group,
          account: data.account,
          amount: data.amount,
          description: data.description,
        },
      };
      const result = await accountsCollection.updateOne(
        filter,
        addBalance,
        options
      );
      res.send(result);
    });

    app.get("/accounts/:id", verifyToken, async (req, res) => {
      try {
        const id = req.params?.id;
        const query = { _id: new ObjectId(id) };
        const result = await accountsCollection.findOne(query);
        res.send(result);
      } catch (error) {
        res.send(error.message);
      }
    });

    /***Total balance***/

    app.get("/totalBalance/:email", async (req, res) => {
      const email = req?.params?.email;

      try {
        const totalBalance = await getTotalBalance(email);
        res.json({ totalBalance });
      } catch (error) {
        // console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });

    async function getTotalBalance(email) {
      const pipeline = [
        {
          $match: { email: email },
        },
        {
          $group: {
            _id: null,
            totalBalance: { $sum: "$balance" },
          },
        },
      ];

      const result = await accountsCollection.aggregate(pipeline).toArray();

      return result.length > 0 ? result[0].totalBalance : 0;
    }

    // update accounts
    // delete account

    // add categories
    app.post("/categories", async (req, res) => {
      try {
        const catReq = req.body;
        const result = await categoryCollection.insertOne(catReq);
        res.send(result);
      } catch (error) {
        res.send(error.message);
      }
    });

    // DEMO /categories?type=INCOME
    // DEMO /categories?type=EXPENSE&email=backend@example.com
    app.get("/categories", async (req, res) => {
      try {
        // const catReq = req.body;
        const catQuery = req.query.type;
        const query = { type: catQuery };
        const result = await categoryCollection.find(query).toArray();
        res.send(result);
        // if (catQuery === "INCOME") {
        //     const query = { type: catQuery };
        //     const result = await categoryCollection.find().toArray();
        //     res.send(result)
        // }
        // else if (catQuery === "EXPENSE") {
        //     const query = { type: catQuery };
        //     const result = await categoryCollection.find().toArray();
        //     res.send(result)
        // }
      } catch (error) {
        res.send(error.message);
      }
    });

    // DEMO /catPi?type=INCOME&email=backend@example.com
    // DEMO /catPi?type=EXPENSE&email=backend@example.com
    app.get("/catPi", async (req, res) => {
      try {
        const transQuery = req.query.type;
        const emailQuery = req.query.email;
        const query = { type: transQuery, email: emailQuery };

        const cursor = await transectionsCollection.find(query).toArray();

        const catPiData = cursor?.map((cat) => cat?.amount);
        const catPiLebel = cursor?.map((cat) => cat?.category);
        // console.log(catPiData);
        res.send({ catPiData, catPiLebel });
      } catch (error) {
        res.send(error);
      }
    });

    //// TODO: Ridoy Vai
    // DEMO /accountPi?email=backend@example.com
    // DEMO /accountPi?email=backend@example.com
    app.get("/accountPi", async (req, res) => {
      try {
        const emailQuery = req.query.email;
        const query = { email: emailQuery };

        const cursor = await accountsCollection.find(query).toArray();
        // console.log(cursor);

        const accPiData = cursor?.map((accAmount) => accAmount?.amount);
        const accPiLebel = cursor?.map((accName) => accName?.account);
        // console.log(catPiData);
        res.send({ accPiData: accPiData, accPiLebel: accPiLebel, cursor });
      } catch (error) {
        res.send(error);
      }
    });

    //********************************** Blog related API's *******************************/
    // POST
    app.post("/blogs", verifyToken, async (req, res) => {
      try {
        const newBlogs = req.body;
        // console.log(newBlogs)
        const result = await blogCollection.insertOne(newBlogs);
        // console.log(result);
        const notificationData = {
          userName: newBlogs.author,
          date: new Date(),
          photoURL: newBlogs.authorImage,
          title: newBlogs.title,
          type: "blog",
        };

        const notificationResult = await notificationCollection.insertOne(
          notificationData
        );

        const updateDoc = { $inc: { unseenNotification: 1 } };
        const updateResult = await unseenNotificationPerUser.updateMany(
          {},
          updateDoc
        );

        res.send(result);
      } catch (error) {
        res.send(error);
      }
    });

    // GET
    app.get("/blogs", async (req, res) => {
      try {
        const page = parseInt(req?.query?.page);
        const size = parseInt(req?.query?.size);
        // console.log('pagination quary', page, size);
        const result = await blogCollection
          .find()
          // .sort({ time: -1 })
          .skip(page * size)
          .limit(size)
          .toArray();
        res.send(result);
      } catch (error) {
        res.send(error.message);
      }
    });

    //* GET by email Blog Data *//
    app.get("/blogs/byemail/:email", verifyToken, async (req, res) => {
      // console.log(req.query);
      const email = req?.params?.email;
      const query = { authorEmail: email };
      const result = await blogCollection.find(query).toArray();
      res.send(result);
    });

    //* GET single Blog Data *//
    app.get("/blogs/:id", async (req, res) => {
      // console.log(req.query);
      const { id } = req.params;
      const query = { _id: new ObjectId(id) };
      const result = await blogCollection.findOne(query);
      res.send(result);
    });

    app.get("/blogsCount", async (req, res) => {
      const count = await blogCollection.estimatedDocumentCount();
      res.send({ count });
    });

    //* patch Like or Dislike or Comment  data *//
    app.patch("/blogs/:id", async (req, res) => {
      const { id } = req.params;
      const { likeORdislike } = req.query;
      // console.log(likeORdislike);
      const data = req.body;
      const query = {
        _id: new ObjectId(id),
      };
      let updatedDoc;
      if (likeORdislike === "like") {
        updatedDoc = {
          $push: {
            likes: data,
          },
        };
      } else if (likeORdislike === "dislike") {
        updatedDoc = {
          $push: {
            dislikes: data,
          },
        };
      } else {
        updatedDoc = {
          $push: {
            comments: data,
          },
        };
      }

      const result = await blogCollection.updateOne(query, updatedDoc);
      res.send(result);
    });

    // Delete blogs
    app.delete("/blogs/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await blogCollection.deleteOne(query);
      res.send(result);
    });

    app.put("/blogs/:id", async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      // console.log(data);
      const filter = { _id: new ObjectId(id) };
      const option = { upsert: true };

      const updateDoc = {
        $set: {
          title: data.title,
          description: data.description,
          image: data.image,
        },
      };
      const result = await blogCollection.updateOne(filter, updateDoc, option);
      res.send(result);
    });

    app.get("/blog/:email", async (req, res) => {
      // console.log(req.query);
      const email = req.params?.email;
      const query = { authorEmail: email };
      const result = await blogCollection.find(query).toArray();
      res.send(result);
      // console.log(result);
    });

    //Delete Comment
    app.patch("/blog/deleteComment/:id", async (req, res) => {
      try {
        const id = req?.params?.id;
        const email = req?.query?.email;
        const commentId = req?.query?.commentID;

        const result = await blogCollection.updateOne(
          { _id: new ObjectId(id) },
          {
            $pull: {
              comments: {
                commenterEmail: email,
                commentId: parseInt(commentId),
              },
            },
          }
        );

        return res.send(result);
      } catch (err) {
        return res.send({ message: err.message });
      }
    });

    // delete like or dislike
    // http://localhost:5000/blog/deleteLD/65c245ffd4be3bbc893bd93a?email=ariful2634@gmail.com&queryArray=dislike
    app.delete("/blog/deleteLD/:id", async (req, res) => {
      const id = req?.params?.id;
      const email = req?.query?.email;
      const query = req?.query?.queryArray;
      // console.log(id, email, query);
      try {
        if (query === "like") {
          const result = await blogCollection.updateOne(
            { _id: new ObjectId(id) },
            { $pull: { likes: { personEmail: email } } }
          );
          return res.send(result);
        } else {
          const result = await blogCollection.updateOne(
            { _id: new ObjectId(id) },
            { $pull: { dislikes: { personEmail: email } } }
          );
          return res.send(result);
        }
        // else {
        //   const result = await blogCollection.updateOne(
        //     { _id: new ObjectId(id) },
        //     { $pull: { comments: { commenterEmail: email, text: comment } } }
        //   );
        //   return res.send(result);
        // }
      } catch (error) {
        res.send({ error: error.message });
      }
    });

    //************************************ END of Blog realated API  ***************************//

    //************************************ Bookmark realated API  ***************************//

    //* Add to Bookmark:- post blog data to a collection,users to read later   *//
    app.post("/bookmark", verifyToken, async (req, res) => {
      const bookmarkedBlogData = req.body;

      const result = await bookmarkCollection.insertOne(bookmarkedBlogData);
      res.send(result);
    });

    //* Get Bookmark data:-  get bookmark data base on users  *//
    app.get("/bookmark/:email", verifyToken, async (req, res) => {
      const email = req.params?.email;
      const query = { user: email };
      const result = await bookmarkCollection.find(query).toArray();
      res.send(result);
    });

    app.delete("/bookmark/:id", verifyToken, async (req, res) => {
      try {
        const id = req?.params?.id;
        const result = await bookmarkCollection.deleteOne({
          blogID: id,
        });
        res.send(result);
      } catch (err) {
        res.send({ message: err?.message });
      }
    });
    //************************************ END of Bookmark realated API  ***************************//
    // for newsletter subscription
    // create
    // Priching
    app.post("/price", async (req, res) => {
      try {
        const newPricing = req.body;
        // console.log(newAccounts)
        const result = await PricingCollection.insertOne(newPricing);
        res.send(result);
      } catch (error) {}
    });

    app.post("/newsLetterSubscription", async (req, res) => {
      try {
        const newNewsLetterSubscription = req.body;
        // console.log(newBlogs)
        const result = await newsLetterSubscriptionCollection.insertOne(
          newNewsLetterSubscription
        );
        res.send(result);
      } catch (error) {}
    });

    // read

    app.get("/newsLetterSubscription", async (req, res) => {
      try {
        const cursor = newsLetterSubscriptionCollection.find();
        const result = await cursor.toArray();
        res.send(result);
      } catch (error) {
        res.send(error.message);
      }
    });

    // delete

    app.delete("/newsLetterSubscription/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await newsLetterSubscriptionCollection.deleteOne(query);

        res.send(result);
      } catch (error) {
        res.send(error.message);
      }
    });
    // <<<<<<<<< Temporary merge branch 1=========

    // >>>>>>>>> Temporary merge branch 2
    // Post ~~~~~~~~~~~Business Form submission
    app.post("/bussiness", async (req, res) => {
      try {
        const newBusiness = req.body;
        // console.log(newBusiness);
        // console.log(newBlogs)
        const result = await businessesCollection.insertOne(newBusiness);
        res.send(result);

        const notificationData = {
          userName: newBusiness.userName,
          company: newBusiness.CompanyName,
          date: new Date(),
          photoURL: newBusiness.photoURL,
          type: "business",
        };
        // console.log(notificationData);
        const notification = await notificationCollection.insertOne(
          notificationData
        );

        const updateDoc = { $inc: { unseenNotification: 1 } };
        const updateResult = await unseenNotificationPerUser.updateMany(
          {},
          updateDoc
        );
      } catch (error) {
        // console.log("error on POST /bussiness");
      }
    });

    // GET ~~~~~~~~~~~Business
    // Demo: /bussiness?email=income@gmail.com
    // app.get("/bussiness", async (req, res) => {
    //   try {
    //     const cursor = businessesCollection.find();
    //     const result = await cursor.toArray();
    //     res.send(result);
    //   } catch (error) {
    //     res.send(error.message);
    //   }
    // });

    // Demo: /bussiness?email=income@gmail.com
    // GET ~~~~~~~~~~~Business
    // pagination

    // app.get("/bussiness", async (req, res) => {
    //   try {
    //     const queryEmail = req.query.email;
    //     const filter = { email: queryEmail };
    //     let result;
    //     if (queryEmail) {
    //       result = await businessesCollection.find(filter).toArray();
    //     } else {
    //       result = await businessesCollection.find().toArray();
    //     }
    //     res.send(result);
    //   } catch (error) {
    //     res.send(error.message);
    //   }
    // });

    app.get("/business", async (req, res) => {
      try {
        const page = parseInt(req?.query?.page);
        const size = parseInt(req?.query?.size);
        const result = await businessesCollection
          .find()
          .skip(page * size)
          .limit(size)
          .toArray();

        res.send(result);
      } catch (error) {
        res.send(error.message);
      }
    });
    app.get("/business/query/:email", verifyToken, async (req, res) => {
      try {
        const email = req?.params?.email;
        const result = await businessesCollection
          .find({
            userEmail: email,
          })
          .toArray();
        res.send(result);
      } catch (error) {
        res.send(error.message);
      }
    });

    // app.get("/blogs", async (req, res) => {
    //   try {
    //     const page = parseInt(req?.query?.page);
    //     const size = parseInt(req?.query?.size);
    //     console.log('pagination quary', page, size);
    //     const result = await blogCollection.find()
    //       // .sort({ time: -1 })
    //       .skip(page * size)
    //       .limit(size)
    //       .toArray();
    //     res.send(result);

    //   } catch (error) {
    //     res.send(error.message);
    //   }
    // });

    app.get("/bussinessCount", async (req, res) => {
      const count = await businessesCollection.estimatedDocumentCount();
      res.send({ count });
    });

    // GET by is [dynamic ~~~~~~~~~~~Business]
    app.get("/bussiness/:id", async (req, res) => {
      try {
        const id = req.params.id;
        // const queryEmail = req?.query?.email;
        const query = { _id: new ObjectId(id) };
        const result = await businessesCollection.findOne(query);
        res.send(result);
      } catch (error) {
        // console.log("Error On get Business id");
        res.send(error.message);
      }
    });

    //--------------------------- Admin Dashboard Api -------------------------

    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      // const updateUser = {isVerified : "true"}
      // console.log(email ,updateUser)

      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          isVerified: "true",
        },
      };

      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
      // console.log(result);
    });

    app.put("/blog/:id", async (req, res) => {
      const id = req?.params.id;
      // console.log(id);

      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          isVerified: "true",
        },
      };

      const result = await blogCollection.updateOne(filter, updateDoc, options);
      res.send(result);
      // console.log(result);
    });

    app.put("/business/:id", async (req, res) => {
      const id = req?.params.id;
      // console.log(id);

      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          isVerified: "true",
        },
      };

      const result = await businessesCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
      // console.log(result);
    });

    app.put("/businessInvest/:id", async (req, res) => {
      try {
        const id = req?.params.id;
        const InvestmentObj = req?.body;
        const newInvestment = InvestmentObj?.invest;

        // get the business with id.
        const query = { _id: new ObjectId(id) };
        const thisBusiness = await businessesCollection.findOne(query);

        // adding the investment money with old total investment
        const totalInvestment = thisBusiness?.totalInvestment + newInvestment;
        // console.log(id);

        // investmentOwner is an array of business owners
        const investors = thisBusiness?.investmentOwner;

        investors.push(InvestmentObj);

        // const filter = { _id: new ObjectId(id) };
        const options = { upsert: true };
        const updateDoc = {
          $set: {
            totalInvestment: totalInvestment,
            // add investor
            investmentOwner: investors,
          },
          // $push: {
          //   investmentOwner: InvestmentObj?.investor
          // }
        };

        const result = await businessesCollection.updateOne(
          query,
          updateDoc,
          options
        );

        const newInvestmentObj = {
          CompanyName: thisBusiness?.CompanyName,
          CompanyEmail: thisBusiness?.CompanyEmail,
          BrandImage: thisBusiness?.BrandImage,
          BannerImage: thisBusiness?.BannerImage,
          Designation: thisBusiness?.Designation,
          userEmail: thisBusiness?.userEmail,
          CompanyDescription: thisBusiness?.CompanyDescription,
          Minimum: thisBusiness?.Minimum,
          Maximum: thisBusiness?.Maximum,
          Profit: thisBusiness?.Profit,
          postTime: thisBusiness?.time,
          userName: thisBusiness?.userName,
          photoURL: thisBusiness?.photoURL,
          companyVarification: thisBusiness?.companyVarification,
          totalInvestment: totalInvestment,
          investor: InvestmentObj?.investor,
          investment: InvestmentObj?.invest,
        };
        const addToInvestments = await investmentsCollection.insertOne(
          newInvestmentObj
        );

        res.send({ result, addToInvestments });
        // console.log(result)
      } catch (error) {
        // console.log(error);
        res.send({ error: error.message });
      }
    });

    app.get("/investments", verifyToken, async (req, res) => {
      try {
        const queryEmail = req.query.email;
        const filter = { investor: queryEmail };
        let result;
        if (queryEmail) {
          result = await investmentsCollection.find(filter).toArray();
        } else {
          result = await investmentsCollection.find().toArray();
        }
        res.send(result);
      } catch (error) {
        res.send(error.message);
      }
    });

    app.get("/adminState", async (req, res) => {
      const blogCount = await blogCollection.estimatedDocumentCount();
      const userCount = await usersCollection.estimatedDocumentCount();
      const transectionsCount =
        await transectionsCollection.estimatedDocumentCount();
      const businessCount = await businessesCollection.estimatedDocumentCount();
      const newsLetterSubscriptionCount =
        await newsLetterSubscriptionCollection.estimatedDocumentCount();

      res.json({
        userCount,
        blogCount,
        businessCount,
        transectionsCount,
        newsLetterSubscriptionCount,
      });
    });

    // payment intent for stripe
    app.post("/create-payment-intent", async (req, res) => {
      const { price } = req.body;
      if (isNaN(price) || price <= 0) {
        return res
          .status(400)
          .json({ error: "Invalid or missing price value." });
      }
      const amount = parseInt(price * 100);
      // console.log(amount);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });

      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    // save payment
    app.post("/payments", async (req, res) => {
      const payment = req.body;
      const paymentResult = await paymentCollection.insertOne(payment);
      res.send({ paymentResult });
    });

    // -------------------notification related api----------------------------

    app.get("/notifications", async (req, res) => {
      const cursor = await notificationCollection
        .find()
        .sort({ date: -1 })
        .toArray();
      const result = cursor.sort((a, b) => b.date - a.date);
      res.send(result);
    });

    app.put("/notificationsCount/:email", async (req, res) => {
      const email = req.params.email;
      const notifications = req.body;

      // console.log(email);
      // console.log(notifications);

      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          unseenNotification: notifications?.unseenNotification,
        },
      };
      const result = await unseenNotificationPerUser.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    app.get("/notificationsCount/:email", async (req, res) => {
      const email = req.params.email;

      const query = { email: email };
      const result = await unseenNotificationPerUser.findOne(query);

      res.send(result);
    });

    app.get("/payments", async (req, res) => {
      const result = await paymentCollection.find().toArray();
      res.send(result);
    });

    //***********************************Budget Related API ******************************************/
    app.post("/budget", verifyToken, async (req, res) => {
      const budget = req?.body;
      const result = await budgetCollection.insertOne(budget);
      res.send(result);
    });

    app.get("/budget/:email", verifyToken, async (req, res) => {
      const email = { email: req?.params?.email };
      const result = await budgetCollection.find(email).toArray();
      res.send(result);
    });

    app.put("/budget/:id", verifyToken, async (req, res) => {
      try {
        const id = req?.params?.id;
        if (id == "undefined") {
          return res.send({ error: "id not found" });
        }
        const updateBudget = req.body;
        const filter = { _id: new ObjectId(id) };
        const options = { upsert: true };
        const updateDoc = {
          $set: {
            budgetAmount: updateBudget.budgetAmount,
            budgetName: updateBudget.budgetName,
            date: updateBudget.date,
          },
        };
        const result = await budgetCollection.updateOne(
          filter,
          updateDoc,
          options
        );
        res.send(result);
      } catch (error) {
        // console.error("Error updating budget:", error);
        res.status(500).send({ error: "Internal Server Error" });
      }
    });

    app.delete("/budget/:id", verifyToken, async (req, res) => {
      const id = req.params.id;

      if (id == "undefined") {
        return res.send({ error: "id not found" });
      }

      const query = { _id: new ObjectId(id) };
      const result = await budgetCollection.deleteOne(query);
      res.send(result);
    });

    app.delete("/budget", verifyToken, async (req, res) => {
      const result = await budgetCollection.deleteMany();
      res.send(result);
    });

    app.get("/ExpanseThisMonth/:email", verifyToken, async (req, res) => {
      try {
        const userEmail = req.params.email;
        const date = new Date();
        const firstDayOfMonth = new Date(
          date.getFullYear(),
          date.getMonth(),
          1
        );
        const lastDayOfMonth = new Date(
          date.getFullYear(),
          date.getMonth() + 1,
          0
        );

        const firstDateString = firstDayOfMonth.toISOString();
        const secondeDateString = lastDayOfMonth.toISOString();

        const filter = {
          email: userEmail,
          date: { $gte: firstDateString, $lte: secondeDateString },
        };

        const BudgetFilter = {
          email: userEmail,
        };

        const totalExpanse = await transectionsCollection
          .find(filter)
          .toArray();
        const totalBudget = await budgetCollection.find(BudgetFilter).toArray();

        const totalExpanseAmount = totalExpanse.reduce(
          (accumulator, transaction) => {
            return accumulator + transaction.amount;
          },
          0
        );
        const totalBudgetAmount = totalBudget.reduce(
          (accumulator, transaction) => {
            return accumulator + parseInt(transaction.budgetAmount);
          },
          0
        );

        const obj = {
          totalExpenseInThisMonth: totalExpanseAmount,
          totalBudgetInThisMonth: totalBudgetAmount,
        };

        res.send(obj);
      } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
      }
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Asset Hexa Server is Running.");
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}!`);
});
