const redis = require('redis');

const client = redis.createClient();

client.on('error', (err) => {
    console.error('Redis Client Error', err);
});

const connectRedis = async () => {
    try {
        await client.connect();
        console.log('Connected to Redis');
    } catch (err) {
        console.error('Could not connect to Redis', err);
    }
};

module.exports = { client, connectRedis };
