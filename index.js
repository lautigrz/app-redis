import express from 'express';
import axios from 'axios';
import responseTime from 'response-time';

import client, {connectClient} from './src/config/redis-client.js';
import { rateLimiter } from './src/middlewares/limit-redis.js';
const app = express();

app.use(responseTime());

app.get('/character',rateLimiter, async (req, res) => {

    try{

    const reply = await getCacheClient('characters');

    if (reply) {
        res.set('X-Cache', 'HIT');
        return res.status(200).json({data: JSON.parse(reply)});
    }

    const response = await axios.get('https://thesimpsonsapi.com/api/characters');

    await setCacheClient('characters', response.data.results, 10);
    
    res.set('X-Cache', 'MISS');
    return res.status(200).json({data: response.data.results});
    
    } catch(err){
        return res.status(500).json({error: 'Something went wrong'});
    }
    
});



app.get('/character/:id', async (req, res)  => {
    const {id} = req.params;

    if(Number.isNaN(Number(id))) {
        return res.status(400).json({error: 'Invalid character ID'});
    }

    const reply = await getCacheClient(`character:${id}`);


    if (reply) {
        res.set('X-Cache', 'HIT');
        return res.json({data: JSON.parse(reply)});
    }

    const response = await axios.get(`https://thesimpsonsapi.com/api/characters/${id}`)

    await setCacheClient(`character:${id}`, response.data);
       res.set('X-Cache', 'MISS');
    return res.json({data: response.data})
})


async function getCacheClient(key){

    if(!client.isOpen) return null;

    try{
        return await client.get(key);
    } catch(err){
        console.error('Redis error:', err.message);
        return null;
    }

}

async function setCacheClient(key, data, ttlSeconds = 60) {
    if(!client.isOpen) return null;

    try {
        return await client.set(key, JSON.stringify(data), {EX: ttlSeconds});
    }catch(err){
        console.error('Redis error:', err.message);
        return null
    }
}


const main = async () => {
  await connectClient();
  client.flushAll();
  console.log(' Connected to Redis');
  app.listen(3000);
  console.log(' Server is running on port 3000');
};

main();