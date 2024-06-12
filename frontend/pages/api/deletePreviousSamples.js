import clientPromise from '../../lib/mongodb';

export default async function handler(req, res) {
    if (req.method === 'DELETE') {
        const { audioName } = req.query;
        if (!audioName) {
            return res.status(400).json({ error: 'Missing audioName parameter' });
        }

        const client = await clientPromise;
        const db = client.db("audio");

        try {
            await db.collection('sounds').deleteMany({ audio: audioName });
            res.status(200).end();
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete previous samples', details: error.message });
        }
    } else {
        res.status(405).end();
    }
}