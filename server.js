require('dotenv').config();
const express = require('express');
const {OAuth2Client} = require('google-auth-library');

const app = express();
const PORT = process.env.PORT || 3000;
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID; // Ensure this is set in your .env file
const client = new OAuth2Client(CLIENT_ID);

app.use(express.json());

app.post('/verify-token', async (req, res) => {
    const {idToken} = req.body;
    try {
        const ticket = await client.verifyIdToken({
            idToken,
            audience: CLIENT_ID,
        });
        const payload = ticket.getPayload();
        // At this point, the token is verified and you have user data in 'payload'.
        // You would typically:
        // 1. Check if the user exists in your database based on payload.email or payload.sub (Google ID).
        // 2. If new user, create a new user record.
        // 3. If existing user, log them in.
        // 4. Generate your own session token (e.g., JWT) for your application and send it back to the client.
        res.status(200).json({user: payload}); //
    } catch (error) {
        console.error('Token verification failed:', error); // Log the detailed error on the server side
        res.status(400).json({error: 'Invalid token or verification failed'}); //
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});