import {createClient} from 'redis';

const client = createClient({
  url: 'redis://127.0.0.1:6379'
});


client.on('error', (err) => {
  console.error('Redis error:', err.message);

});

let isConnected = false;

export async function connectClient(){

    if(!isConnected){
        await client.connect();
        isConnected = true;
    }
}

export default client;