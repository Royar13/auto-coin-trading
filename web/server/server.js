const express = require('express');
const app = express();

const port = 8080;

app.use(express.json());

app.listen(port);

app.post('/test', (req, res) => {
    res.json({requestBody: req.body});
});