const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Email sending endpoint
app.post('/send-email', async (req, res) => {
    try {
        const {
            gmail_email,
            gmail_password,
            header_name,
            subject,
            message_body,
            recipients
        } = req.body;

        // Validate required fields
        if (!gmail_email || !gmail_password || !recipients) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields' 
            });
        }

        // Create transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: gmail_email,
                pass: gmail_password
            }
        });

        // Split and process recipients
        const recipientList = recipients.split(',').map(r => r.trim()).filter(r => r);
        
        // Send emails to each recipient
        const results = [];
        for (const recipient of recipientList) {
            try {
                const mailOptions = {
                    from: `"${header_name}" <${gmail_email}>`,
                    to: recipient,
                    subject: subject,
                    text: message_body,
                    headers: {
                        'X-Mailer': header_name
                    }
                };

                const info = await transporter.sendMail(mailOptions);
                results.push({
                    recipient,
                    success: true,
                    messageId: info.messageId
                });

                // Wait 3 seconds between emails
                await new Promise(resolve => setTimeout(resolve, 3000));
            } catch (error) {
                results.push({
                    recipient,
                    success: false,
                    error: error.message
                });
            }
        }

        res.json({
            success: true,
            message: 'Email sending process completed',
            results: results
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} in your browser`);
});
