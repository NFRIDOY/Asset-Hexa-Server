//npm i express cors dotenv
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// req
app.use(express.json());
// app.use(cors())
app.use(
  cors({
    origin: ["https://asset-hexa.web.app", "http://localhost:5173", "http://localhost:5174"],
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




        const usersCollection = database.collection('users')

        const transectionsCollection = database.collection('transections')
        const accountsCollection = database.collection('accounts')
        const categoryCollection = database.collection('categoris')
        const blogCollection = database.collection('blogs')




        // Save or modify user email, status in DB
        app.put('/users/:email', async (req, res) => {
            const email = req.params.email
            const user = req.body
            const query = { email: email }
            const options = { upsert: true }
            const isExist = await usersCollection.findOne(query)
            console.log('User found?----->', isExist)
            if (isExist) return res.send(isExist)
            const result = await usersCollection.updateOne(
                query,
                {
                    $set: { ...user, timestamp: Date.now() },
                },
                options
            )
            res.send(result)
        })


        // Get all users
        app.get('/users', async (req, res) => {
            const result = await usersCollection.find().toArray()
            res.send(result)
        })




        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        // client.connect();
        // Send a ping to confirm a successful connection



        // for transection
        // create

        // app.post('/transections', async (req, res) => {
        //     try {
        //         const newTransections = req.body;
        //         // console.log(newTransections)
        //         const result = await transectionsCollection.insertOne(newTransections);
        //         res.send(result)
        //     } catch (error) {
        //         res.send(error.message);
        //     }
        // })
        // DEMO: /transections?type=INCOME
        // DEMO: /transections?type=EXPENSE&email
        app.post('/transections', async (req, res) => {
            try {
                // const id = req.params.id;
                const account = req.body?.account;
                const newTransections = req.body;
                const newTransectionsEmail = req.body?.email;
                // const newTransectionsAmount = req.body.amount;
                const typeTransec = req.body?.type;





                if (typeTransec === 'INCOME') {
                    const filter = { account: account }
                    const options = { upsert: true };

                    const queryAccount = { account: account, email: newTransectionsEmail };
                    // find the account
                    const accountfindOne = await accountsCollection.findOne(queryAccount);

                    // init amount of that account
                    let AmountOnAccount = accountfindOne?.amount;

                    AmountOnAccount = AmountOnAccount + newTransections?.amount;

                    const transectionsUpdateAccount = {
                        $set: {
                            // TODO: update property
                            amount: AmountOnAccount


                        }
                    }

                    // insertOne into transections collection
                    const resultTransec = await transectionsCollection.insertOne(newTransections);

                    // update on account
                    const resultAccount = await accountsCollection.updateOne(filter, transectionsUpdateAccount, options);

                    // respose
                    const result = {
                        resultTransec,
                        resultAccount
                    }
                    return res.send(result)
                }
                else if (typeTransec === 'EXPENSE') {
                    const filter = { account: account }
                    const options = { upsert: true };

                    const queryAccount = { account: account, email: newTransectionsEmail };

                    // find the account
                    const accountfindOne = await accountsCollection.findOne(queryAccount);
                    
                    let AmountOnAccount = accountfindOne?.amount;
                    AmountOnAccount = AmountOnAccount - newTransections?.amount;

                    const transectionsUpdateAccount = {
                        $set: {
                            // TODO: update property
                            amount: AmountOnAccount


                        }
                    }

                    // insertOne into transections collection
                    const resultTransec = await transectionsCollection.insertOne(newTransections);

                    // update on account
                    const resultAccount = await accountsCollection.updateOne(filter, transectionsUpdateAccount, options);

                    // respose
                    const result = {
                        resultTransec,
                        resultAccount
                    }
                    return res.send(result)
                }
                else if (typeTransec === 'TRANSFAR') {
                    const filterTo = { account: account }
                    const accountfindOneTo = await accountsCollection.findOne(queryAccount);
                    let AmountOnAccountTo = accountfindOneTo?.amount;
                    AmountOnAccount = AmountOnAccount - newTransections?.amount;
                    AmountOnAccountTo = AmountOnAccountTo + newTransections?.amount;
                }
                else {
                    AmountOnAccount = AmountOnAccount
                    res.status(400).json({ error: "Error"});
                }






            } catch (error) {
                res.send(error.message);
            }
        })

        // read
        // DEMO /transections?type=INCOME
        // DEMO /transections?type=EXPENSE
        // Example: https://asset-hexa-server.vercel.app/transections?type=INCOME&email=backend@example.com)
        // Example: https://asset-hexa-server.vercel.app/transections?type=EXPENSE&email=backend@example.com)
        app.get('/transections', async (req, res) => {
            try {
                const transQuery = req.query.type;
                const emailQuery = req.query.email;
                const query = { type: transQuery, email: emailQuery };
                const cursor = transectionsCollection.find(query)
                const result = await cursor.toArray()
                res.send(result)
            } catch (error) {
                res.status(500).json({ message: error.message });
            }
        })

        // delete

        app.delete('/transections/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const query = { _id: new ObjectId(id) }
                const result = await transectionsCollection.deleteOne(query);
                res.send(result)
            } catch (error) {
                res.send(error.message);
            }
        })

        // find one

        app.get('/transections/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const query = { _id: new ObjectId(id) }
                const result = await transectionsCollection.findOne(query);
                res.send(result)
            } catch (error) {
                res.send(error.message);
            }
        })

        // update

        app.put('/transections/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const filter = { _id: new ObjectId(id) }
                const options = { upsert: true };
                const updateTransections = req.body
                const transections = {
                    $set: {
                        // TODO: update property

                    }
                }

                const result = await transectionsCollection.updateOne(filter, transections, options);
                res.send(result)
            } catch (error) {
                res.send(error.message);
            }
        })


        // for accounts
        // create

        app.post('/accounts', async (req, res) => {
            try {
                const newAccounts = req.body;
                // console.log(newAccounts)
                const result = await accountsCollection.insertOne(newAccounts);
                res.send(result)
            } catch (error) {

            }
        })

        // read

        app.get('/accounts', async (req, res) => {
            try {
                const emailQuery = req.query.email;
                const query = { email: emailQuery };
                const cursor = accountsCollection.find(query)
                const result = await cursor.toArray()
                res.send(result)
            } catch (error) {
                res.send(error.message);
            }
        })

        // update accounts
        // delete account

        // add categories
        app.post('/categories', async (req, res) => {
            try {
                const catReq = req.body;
                const result = await categoryCollection.insertOne(catReq);
                res.send(result);
            } catch (error) {
                res.send(error.message);
            }
        })

        // DEMO /categories?type=INCOME
        // DEMO /categories?type=EXPENSE&email=backend@example.com
        app.get('/categories', async (req, res) => {
            try {
                // const catReq = req.body;
                const catQuery = req.query.type;
                const query = { type: catQuery };
                const result = await categoryCollection.find(query).toArray();
                res.send(result)
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
        })

        // DEMO /catPi?type=INCOME&email=backend@example.com
        // DEMO /catPi?type=EXPENSE&email=backend@example.com
        app.get('/catPi', async (req, res) => {
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
        })

        // DEMO /catPi?type=INCOME&email=backend@example.com
        // DEMO /catPi?type=EXPENSE&email=backend@example.com
        // app.get('/accountPi', async (req, res) => {
        //     try {
        //         const transQuery = req.query.type;
        //         const emailQuery = req.query.email;
        //         const query = { type: transQuery, email: emailQuery };

        //         const cursor = await transectionsCollection.find(query).toArray();

        //         const accPiData = cursor?.map((acc) => acc?.amount);
        //         const catPiLebel = cursor?.map((acc) => acc?.category);
        //         // console.log(catPiData);
        //         res.send({ catPiData: accPiData, catPiLebel });
        //     } catch (error) {
        //         res.send(error);

        //     }
        // })

        //// TODO: Ridoy Vai 
        // DEMO /accountPi?email=backend@example.com
        // DEMO /accountPi?email=backend@example.com
        app.get('/accountPi', async (req, res) => {
            try {
                const emailQuery = req.query.email;
                const query = { email: emailQuery };

                const cursor = await accountsCollection.find(query).toArray();

                const accPiData = cursor?.map((accAmount) => accAmount?.amount);
                const accPiLebel = cursor?.map((accName) => accName?.account);
                // console.log(catPiData);
                res.send({ accPiData: accPiData, accPiLebel: accPiLebel });
            } catch (error) {
                res.send(error);

            }
        })

        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }

  try {
    const database = client.db("assethexadb");

    const usersCollection = database.collection("users");

    const transectionsCollection = database.collection("transections");
    const accountsCollection = database.collection("accounts");
    const categoryCollection = database.collection("categoris");
    const blogCollection = database.collection("blogs");

    // Save or modify user email, status in DB
    app.put("/users/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const query = { email: email };
      const options = { upsert: true };
      const isExist = await usersCollection.findOne(query);
      console.log("User found?----->", isExist);
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

    app.get("/chartData/:email", async (req, res) => {
      const { email } = req.params;
      // console.log(email);
      const query = { email: email };

      // Find all data that a user has
      const singlePersonData = await accountsCollection.find(query).toArray();

      /***************  CASH ***************/
      // Filter by group name "Cash"
      const cashes = singlePersonData.filter(
        (account) => account.group === "Cash"
      );
      // Cash total
      const cashTotal = cashes.reduce((acc, cash) => {
        return acc + parseFloat(cash?.amount);
      }, 0);

      /***************  ACCOUNT ***************/
      // Filter by group name "Account"
      const accounts = singlePersonData.filter(
        (account) => account.group === "Account"
      );
      // Cash Account
      const accountTotal = accounts.reduce((acc, account) => {
        return acc + parseFloat(account?.amount);
      }, 0);

      /***************  LOAN ***************/
      // Filter by group name "Loan"
      const loans = singlePersonData.filter(
        (account) => account.group === "Loan"
      );
      // Loan total
      const loanTotal = loans.reduce((acc, Loan) => {
        return acc + parseFloat(Loan?.amount);
      }, 0);

      /***************  Saving ***************/
      // Filter by group name "Saving"
      const Savings = singlePersonData.filter(
        (account) => account.group === "Saving"
      );
      // Savings total
      const SavingTotal = Savings.reduce((acc, Saving) => {
        return acc + parseFloat(Saving?.amount);
      }, 0);

      res.send([
        { Cash: cashTotal },
        { Account: accountTotal },
        { Loan: loanTotal },
        { Saving: SavingTotal },
      ]);
    });

    // Get all users
    app.get("/users", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // client.connect();
    // Send a ping to confirm a successful connection

    // for transection
    // create

    // app.post('/transections', async (req, res) => {
    //     try {
    //         const newTransections = req.body;
    //         // console.log(newTransections)
    //         const result = await transectionsCollection.insertOne(newTransections);
    //         res.send(result)
    //     } catch (error) {
    //         res.send(error.message);
    //     }
    // })
    // DEMO: /transections?type=INCOME
    // DEMO: /transections?type=EXPENSE
    app.post("/transections", async (req, res) => {
      try {
        // const id = req.params.id;
        const account = req.body.account;
        const newTransections = req.body;
        const newTransectionsEmail = req.body?.email;
        // const newTransectionsAmount = req.body.amount;
        const typeTransec = req.body?.type;
        const filter = { account: account };
        const options = { upsert: true };

        const queryAccount = { account: account, email: newTransectionsEmail };
        // find the account
        const accountfindOne = await accountsCollection.findOne(queryAccount);
        const filterTo = { account: account };
        // init amount of that account
        let AmountOnAccount = accountfindOne?.amount;

        if (typeTransec === "INCOME") {
          AmountOnAccount = AmountOnAccount + newTransections?.amount;
        } else if (typeTransec === "EXPENSE") {
          AmountOnAccount = AmountOnAccount - newTransections?.amount;
        } else if (typeTransec === "TRANSFAR") {
          AmountOnAccount = AmountOnAccount - newTransections?.amount;
        } else {
          AmountOnAccount = AmountOnAccount;
        }

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
        res.send(result);
      } catch (error) {
        res.send(error.message);
      }
    });

    // read
    // DEMO /transections?type=INCOME
    // DEMO /transections?type=EXPENSE
    // Example: https://asset-hexa-server.vercel.app/transections?type=INCOME&email=backend@example.com)
    // Example: https://asset-hexa-server.vercel.app/transections?type=EXPENSE&email=backend@example.com)
    app.get("/transections", async (req, res) => {
      try {
        const transQuery = req.query.type;
        const emailQuery = req.query.email;
        const query = { type: transQuery, email: emailQuery };
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

    // for accounts
    // create

    app.post("/accounts", async (req, res) => {
      try {
        const newAccounts = req.body;
        // console.log(newAccounts)
        const result = await accountsCollection.insertOne(newAccounts);
        res.send(result);
      } catch (error) {}
    });

    // read

    app.get("/accounts", async (req, res) => {
      try {
        const emailQuery = req.query.email;
        const query = { email: emailQuery };
        const cursor = accountsCollection.find(query);
        const result = await cursor.toArray();
        res.send(result);
      } catch (error) {
        res.send(error.message);
      }
    });

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

    // DEMO /catPi?type=INCOME&email=backend@example.com
    // DEMO /catPi?type=EXPENSE&email=backend@example.com
    // app.get('/accountPi', async (req, res) => {
    //     try {
    //         const transQuery = req.query.type;
    //         const emailQuery = req.query.email;
    //         const query = { type: transQuery, email: emailQuery };

    //         const cursor = await transectionsCollection.find(query).toArray();

    //         const accPiData = cursor?.map((acc) => acc?.amount);
    //         const catPiLebel = cursor?.map((acc) => acc?.category);
    //         // console.log(catPiData);
    //         res.send({ catPiData: accPiData, catPiLebel });
    //     } catch (error) {
    //         res.send(error);

    //     }
    // })

    //// TODO: Ridoy Vai
    // DEMO /accountPi?email=backend@example.com
    // DEMO /accountPi?email=backend@example.com
    app.get("/accountPi", async (req, res) => {
      try {
        const emailQuery = req.query.email;
        const query = { email: emailQuery };

        const cursor = await accountsCollection.find(query).toArray();
        console.log(cursor);

        const accPiData = cursor?.map((accAmount) => accAmount?.amount);
        const accPiLebel = cursor?.map((accName) => accName?.account);
        // console.log(catPiData);
        res.send({ accPiData: accPiData, accPiLebel: accPiLebel, cursor });
      } catch (error) {
        res.send(error);
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
