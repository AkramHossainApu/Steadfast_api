const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

// Hide your keys by placing them in environment variables.
// You can set them in a .env file or your deployment environment.
const API_KEY = process.env.STEADFAST_API_KEY || 'ie5o84osapva4ajzqeblfzepmkx61cmb';
const SECRET_KEY = process.env.STEADFAST_SECRET_KEY || 'hce0ol3hshrfhliqeyoxfaaf';

app.post('/create-parcel', async (req, res) => {
    try {
        const order = req.body;
        const response = await axios.post(
            'https://portal.packzy.com/api/v1/create_order',
            order,
            {
                headers: {
                    'Api-Key': API_KEY,
                    'Secret-Key': SECRET_KEY,
                    'Content-Type': 'application/json'
                }
            }
        );
        res.status(200).json(response.data);
    } catch (error) {
        const status = error.response ? error.response.status : 500;
        const data = error.response ? error.response.data : { error: 'Unknown error' };
        res.status(status).json({ error: error.message, details: data });
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
