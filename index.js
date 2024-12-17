require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const app = express();
const port = process.env.PORT || 5000;

// middleware 
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

const verifyToken = (req, res, next) => {
    const token = req?.cookies?.token;
    
    if (!token) {
        return res.status(401).send({ message: 'unauthorized access' });
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded)=>{
        if(err){
            return res.status(401).send({ message: 'unauthorized access' });
        }
        req.user = decoded;
        next();
    })
}

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@jobportal.ehnzt.mongodb.net/?retryWrites=true&w=majority&appName=JobPortal`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


async function run() {
    try {
        await client.connect();
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");

        // Job related API's
        const jobCollection = client.db('JobPortal').collection('Jobs');
        const applicationCollection = client.db('JobPortal').collection('Application');

        app.get('/jobs', async (req, res) => {
            const email = req.query.email;
            let query = {};
            if (email) {
                query = { hr_email: email }
            }
            const cursor = jobCollection.find(query).limit(8);
            const result = await cursor.toArray();
            res.send(result);
        })

        app.get('/jobs/:id', async (req, res) => {
            const id = req.params.id;
            const cursor = { _id: new ObjectId(id) }
            const result = await jobCollection.findOne(cursor);
            res.send(result);
        })

        app.post('/jobs', async (req, res) => {
            const newJob = req.body;
            const result = await jobCollection.insertOne(newJob);
            res.send(result);
        })

        // job application api
        app.post('/job-applications', async (req, res) => {
            const application = req.body;
            const result = await applicationCollection.insertOne(application);

            const id = application.job_id;
            const query = { _id: new ObjectId(id) };
            const job = await jobCollection.findOne(query);
            let count;
            if (job.applicationCount) {
                count = job.applicationCount + 1;
            } else {
                count = 1;
            }
            const filter = { _id: new ObjectId(id) };
            const updatedJoob = {
                $set: {
                    applicationCount: count
                }
            }

            const updateResult = await jobCollection.updateOne(filter, updatedJoob);
            res.send(result);
        })

        app.get('/job-application', verifyToken, async (req, res) => {
            const email = req.query.email;
            const filter = { applicant_email: email };

            if(req.user.email !== req.query.email){
                console.log(req.user.email);
                return res.status(403).send({ message: 'Forbiden access' });
            }

            const result = await applicationCollection.find(filter).toArray();

            // fokira way
            for (const application of result) {
                const query1 = { _id: new ObjectId(application.job_id) }
                const job = await jobCollection.findOne(query1);

                if (job) {
                    application.title = job.title;
                    application.location = job.location;
                    application.deadline = job.applicationDeadline;
                    application.company = job.company;
                    application.company_logo = job.company_logo
                }
            }
            res.send(result)
        })

        app.delete('/job-application/delete/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const result = await applicationCollection.deleteOne(filter);
            res.send(result);
        })

        // jwt related api
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            // node then require('crypto').randomBytes(64).toString('hex') for secret;
            const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '1hr' })

            res.cookie('token', token, {
                httpOnly: true,
                secure: false
            }).send({ success: true });
        })

    }
    finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (reeq, res) => {
    res.send('Job is falling from sky')
})

app.listen(port, () => {
    console.log(`Job falling from ${port}`);
})