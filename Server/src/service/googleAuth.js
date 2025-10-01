const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function verifyGoogleToken(token) {
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID, // client_id của bạn
    });

    const payload = ticket.getPayload(); // chứa email, name, picture,...
    return payload;
}

module.exports = { verifyGoogleToken };
