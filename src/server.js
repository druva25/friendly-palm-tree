import express from 'express';
import bodyParser from 'body-parser';
import { MongoClient } from 'mongodb';
import path from 'path';
import { withDB } from './withDB';

// const articleInfo = {
//     'learn-react': { upvotes: 0, comments: [] },
//     'learn-node': { upvotes: 0, comments: [] },
//     'my-thoughts-on-resume': { upvotes: 0, comments: [] },

// }
const app = express();

app.use(bodyParser.json());

app.use(express.static(path.join(__dirname,'/build')))

app.get('/api/article/:name', async (req, res) => {
    const {name} = req.params;
    const results = await withDB(async db => {
        return await db.collection('articles').findOne({ name }); 
    });
    res.status(200).json(results);
});

app.get('/hello', (req, res) => {
    res.send("Hello!");
})

app.post('/hello', (req, res) => {
    const {name} = req.body;
    res.send(`Hello ${name} !`);
})

app.get('/hello/:name', (req, res) => {
    const {name} = req.params;
    res.send(`Hello ${name}`);
});

app.post('/api/articles/:name/upvote', async (req, res) => {
    const { name }= req.params;
    try{
        const client = await MongoClient.connect(
            'mongodb://localhost:27017',
            { useNewUrlParser:true, useUnifiedTopology: true },
        );
        const db = client.db('react-blog-db');
        const articleInfo = await db.collection('articles').findOne({ name });
        await db.collection('articles').updateOne({ name }, {
            '$set': { upvotes: articleInfo.upvotes + 1 } 
        });
        const updateArticleInfo = await db.collection('articles').findOne({ name });
        res.status(200).json(updateArticleInfo);
        client.close();
    } catch (err){
        res.status(500).send({ message: 'DataBase Error', err});
    }

    
})

app.post('/api/articles/:name/add-comment', async (req,res) => {
    const { name }= req.params;
    const { postedBy, text } = req.body;
    try{
        const client = await MongoClient.connect(
            'mongodb://localhost:27017',
            { useNewUrlParser:true, useUnifiedTopology: true },
        );
        const db = client.db('react-blog-db');
        const articleInfo = await db.collection('articles').findOne({ name });
        await db.collection('articles').updateOne({ name }, {
            '$set': { comments: articleInfo.comments.concat({ postedBy, text}) } 
        });
        const updateArticleInfo = await db.collection('articles').findOne({ name });
        res.status(200).json(updateArticleInfo);
        client.close();
    } catch (err){
        res.status(500).send({ message: 'DataBase Error', err});
    }
});

app.get('*',(req, res) => {
    res.sendFile(path.join(__dirname,'/build/index.html'))
})

app.listen(8000, () => console.log("Server is listening...") );