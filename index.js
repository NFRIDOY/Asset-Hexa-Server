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

        const database = client.db("assethexadb");

        const transectionsCollection = database.collection('transections')
        const accountsCollection = database.collection('accounts')
        const categoryCollection = database.collection('categoris')

        // for transection
        // create

        app.post('/transections', async (req, res) => {
            const newTransections = req.body;
            // console.log(newTransections)
            const result = await transectionsCollection.insertOne(newTransections);
            res.send(result)
        })

        // read

        app.get('/transections', async (req, res) => {
            const cursor = transectionsCollection.find()
            const result = await cursor.toArray()
            res.send(result)
        })

        // delete

        app.delete('/transections/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await transectionsCollection.deleteOne(query);
            res.send(result)
        })

        // find

        app.get('/transections/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await transectionsCollection.findOne(query);
            res.send(result)
        })

        // update

        app.put('/transections/:id', async (req, res) => {
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
        })


        // for accounts
        // create

        app.post('/accounts', async (req, res) => {
            const newAccounts = req.body;
            // console.log(newAccounts)
            const result = await accountsCollection.insertOne(newAccounts);
            res.send(result)
        })

        // read

        app.get('/accounts', async (req, res) => {
            const cursor = accountsCollection.find()
            const result = await cursor.toArray()
            res.send(result)
        })

        // update accounts
        // delete account

        // add categories
        app.post('/categories', async (req, res) => {
            const catReq = req.body;

            const result = await categoryCollection.insertOne(catReq);
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