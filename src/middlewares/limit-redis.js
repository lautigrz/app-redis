import { allowRequest } from "../limitadores/token-bucket-redis.js";

export async function rateLimiter(req,res,next){
    const id = req.ip;

    const {allowed, tokensLeft } = await allowRequest(id,1,5);

    res.set('X-RateLimit-Remaining', tokensLeft);

      if (!allowed) {
        return res.status(429).json({ error: 'Too many requests' });
     }

    next();
}