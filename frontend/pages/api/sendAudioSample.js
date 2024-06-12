export default async function handler(req, res) {
    const { method, body } = req;

    if (method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }

    const audioName = req.query.audio_name || null;
    const formData = await req.formData();
    const audioBlob = formData.get('file');
    console.log(audioBlob);

    let url = "http://localhost:8000/embed-audio";
    if (audioName !== null) {
        url += `?audio_name=${audioName}`;
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Failed to get response from API: ' + response.statusText);
        }

        // Return success response if request is successful
        res.status(200).json({ success: true });
    } catch (error) {
        // Return error response if request fails
        res.status(500).json({ success: false, error: error.message });
    }
}
