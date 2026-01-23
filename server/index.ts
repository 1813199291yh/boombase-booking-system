
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { router } from './routes.ts';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// Webhook handling needs raw body, but for now we'll stick to JSON for API
// If we implement Stripe webhooks, we'll need raw parser for that specific route
app.use(express.json());

app.use('/api', router);

app.get('/', (req, res) => {
    res.send('Boombase API is running');
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
