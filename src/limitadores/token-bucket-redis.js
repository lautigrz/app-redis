import client from "../config/redis-client.js";

export async function allowRequest(id,rate,capacity){
    const key = `bucket:${id}`;

    const now = Date.now() / 1000;

    while(true){
        await client.watch(key);

        const data = await client.hGetAll(key);

        let tokens = parseFloat(data.tokens)
        let lastRefill = parseFloat(data.lastRefill);


        if(isNaN(tokens) || isNaN(lastRefill)){
            
            console.log("Inicializando bucket ahora para,", id);
            
            tokens = capacity;
            lastRefill = now;
        }

        console.log("Tokens disponibles para ", id, ":", tokens);

        const elapsed = now - lastRefill;
        tokens = Math.min(capacity, tokens + elapsed * rate);

        console.log("Tokens despues de refill para ", id, ":", tokens);

        let allowed = false;

        if(tokens >= 1){
            tokens -= 1;
            allowed = true;
        }

        const multi = client.multi();

        multi.hSet(key, {
            tokens: tokens,
            lastRefill: now
        })

        console.log('TTL actual:', await client.ttl(key));


        multi.expire(key, Math.ceil(capacity / rate) * 2);

        const result = await multi.exec();

        if(result !== null){
            return {allowed, tokensLeft: tokens};
        }
    }
} 