import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	const { name, email, subject, message, siteId } = req.body;
	if (!name || !email || !message || !siteId) {
		return res.status(400).json({ error: "Name, email, message, and site ID are required." });
	}

	const apiUrl = process.env.API_URL || "http://localhost:3000";
	const response = await fetch(`${apiUrl}/api/contact/submit`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			name,
			email,
			subject,
			message,
			siteId,
		}),
	});
	if (response.ok) {
		return res.status(200).json({ message: "Your message has been sent!" });
	} else if (response.status === 400) {
		const errorData = await response.json();
		return res.status(400).json({ error: errorData.error || "Failed to send message." });
	} else {
		const data = await response.json();
		return res.status(500).json({ error: data.error || "Failed to send message." });
	}
}
