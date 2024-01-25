//npm i express cors dotenv
const express = require('express')
const cors = require('cors')
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000;

// req 
app.use(express.json());
// app.use(cors())
app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true
}));



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster1.mq17fxg.mongodb.net/?retryWrites=true&w=majority`;
const uri = process.env.URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {

        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        client.connect();
        // Send a ping to confirm a successful connection

        const usersCollection = client.db('assethexadb').collection('users')



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


        const database = client.db("assethexadb");

        const transectionsCollection = database.collection('transections')
        const accountsCollection = database.collection('accounts')
        const categoryCollection = database.collection('categoris')

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

        app.post('/transections', async (req, res) => {
            try {
                // const id = req.params.id;
                const account = req.body.account;
                const typeTransec = req.query.type;
                const filter = { account: account }
                const options = { upsert: true };
                const newTransections = req.body;

                const queryAccount = { account: account };
                // find the account
                const accountfindOne = await accountsCollection.findOne(query);
                let AmountOnAccount = accountfindOne?.accountAmount;

                if (typeTransec === 'INCOME') {
                    AmountOnAccount = AmountOnAccount + newTransections?.amount;
                }
                else if (typeTransec === 'EXPENSE') {
                    AmountOnAccount = AmountOnAccount + newTransections?.amount;
                }
                else {
                    AmountOnAccount = AmountOnAccount
                }

                const transectionsUpdateAccount = {
                    $set: {
                        // TODO: update property
                        AmountAccount: AmountOnAccount


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
                res.send(result)
            } catch (error) {
                res.send(error.message);
            }
        })

        // read
        // DEMO /transections?type=INCOME
        // DEMO /transections?type=EXPENSE
        app.get('/transections', async (req, res) => {
            try {
                const transQuery = req.query.type;
                const query = { type: transQuery };
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
                const cursor = accountsCollection.find()
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
        // DEMO /categories?type=EXPENSE
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

        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Asset Hexa Server is Running.')
})

app.listen(port, () => {
    console.log(`Server listening on port ${port}!`)
})





