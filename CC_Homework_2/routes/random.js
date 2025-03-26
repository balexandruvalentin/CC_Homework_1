const express = require('express');
const axios = require('axios');
const router = express.Router();

router.get('/', async (req, res) => {
    const min = parseInt(req.query.min, 10);
    const max = parseInt(req.query.max, 10);

    if (isNaN(min) || isNaN(max)) {
        return res.status(400).json({ error: "Min and max must be valid numbers." });
    }
    if (min >= max) {
        return res.status(400).json({ error: "Min must be less than Max." });
    }

    try {
        const response = await axios.post('https://api.random.org/json-rpc/4/invoke', {
            jsonrpc: "2.0",
            method: "generateIntegers",
            params: {
                apiKey: process.env.RANDOM_API_KEY,
                n: 1,
                min: min,
                max: max,
                replacement: true
            },
            id: 1
        });

        res.json({ randomNumber: response.data.result.random.data[0] });

    } catch (error) {
        if (error.response) {
            res.status(error.response.status).json({ error: error.response.data.message });
        } else {
            res.status(500).json({ error: "Failed to fetch random number" });
        }
    }
});

module.exports = router;
