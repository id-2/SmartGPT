import express from 'express';
import bodyParser from 'body-parser';
import { main } from './smartgpt.js';
import fs from 'fs/promises';
import path from 'path';
import session from 'express-session';
import { stringify } from 'querystring';

const app = express();
const port = 3005;

// Initialize session
app.use(session({
  secret: 'your_secret_key', // replace with a secret key of your choice
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // if you're using HTTPS, set this to true
}));

// Add this line before your routes
app.use(express.static('public')); // or wherever your static files are located

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.render('index');
});

app.post('/run', async (req, res) => {

  const { apiKey } = req.body;
  req.session.apiKey = apiKey;
  try {
    const { prompt, numAsks } = req.body;

    // Input validation
    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return res.status(400).json({ error: "Invalid 'prompt' value" });
    }
    if (!numAsks || isNaN(numAsks) || Number(numAsks) <= 0) {
      return res.status(400).json({ error: "Invalid 'numAsks' value" });
    }

    const result = await main(prompt, numAsks);
    const fileName = `${Date.now()}.txt`;
    const outputDir = path.join('output');
    const outputPath = path.join(outputDir, fileName);

    // Write output to a file
    try {
      await fs.mkdir(outputDir, { recursive: true });
      await fs.writeFile(outputPath, JSON.stringify(result));
      console.log(`Output was successfully saved to ${outputPath}`);
    } catch (err) {
      console.error("An error occurred while writing the output to a file: ", err);
    }

    // Return JSON with gptOutput field for client side
    res.json({ gptOutput: result.researcherResponse});
  } catch (err) {
    res.status(500).json({ error: "An error occurred: " + err.message });
  }
});


app.listen(port, () => {
  console.log(`App running on http://localhost:${port}`);
});

