import { google } from "googleapis";
import { User } from "../models/user.model.js";

// Rate limiting configuration to avoid API limits
const RATE_LIMITS = {
    GMAIL_MAX_RESULTS: 50,
    DRIVE_MAX_RESULTS: 100,
    CALENDAR_MAX_RESULTS: 250,
    REQUEST_DELAY: 100, // milliseconds between requests
};

// Helper function to add delay between API calls
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Initialize Google OAuth client
const initializeGoogleClient = async (userId) => {
    const client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        "http://localhost:3000/api/v1/users/auth/oauth/google/callback"
    );

    const user = await User.findById(userId).select("oauth.providers");
    if (!user) throw new Error("User not found");

    const googleProvider = user.oauth.providers.find(p => p.providerName === "google");
    if (!googleProvider) throw new Error("Google OAuth not connected");

    client.setCredentials({
        access_token: googleProvider.accessToken,
        refresh_token: googleProvider.refreshToken || googleProvider.accessToken
    });

    return client;
};

// Gmail integration function
const getGmailData = async (authClient) => {
    try {
        const gmail = google.gmail({ version: "v1", auth: authClient });
        
        // Get list of messages with pagination support
        const result = await gmail.users.messages.list({
            userId: "me",
            maxResults: RATE_LIMITS.GMAIL_MAX_RESULTS
        });

        if (!result.data.messages) {
            return [];
        }

        const mails = [];
        const messages = result.data.messages.slice(0, RATE_LIMITS.GMAIL_MAX_RESULTS);

        for (let i = 0; i < messages.length; i++) {
            try {
                const msg = messages[i];
                const fullMsg = await gmail.users.messages.get({
                    userId: "me",
                    id: msg.id,
                    format: 'metadata',
                    metadataHeaders: ['Subject', 'From', 'Date']
                });

                const headers = fullMsg.data.payload?.headers || [];
                const subject = headers.find(h => h.name === "Subject")?.value || "No Subject";
                const from = headers.find(h => h.name === "From")?.value || "Unknown";
                const date = headers.find(h => h.name === "Date")?.value || fullMsg.data.internalDate;

                mails.push({
                    id: msg.id,
                    source: "gmail",
                    title: subject,
                    content: fullMsg.data.snippet || "",
                    date: date,
                    from: from,
                    threadId: fullMsg.data.threadId
                });

                // Add delay to respect rate limits
                if (i < messages.length - 1) {
                    await delay(RATE_LIMITS.REQUEST_DELAY);
                }
            } catch (error) {
                console.error(`Error fetching email ${messages[i].id}:`, error.message);
                continue;
            }
        }

        return mails;
    } catch (error) {
        console.error("Error fetching Gmail data:", error.message);
        return [];
    }
};

// Google Drive integration function
const getDriveData = async (authClient) => {
    try {
        const drive = google.drive({ version: "v3", auth: authClient });
        
        const result = await drive.files.list({
            pageSize: RATE_LIMITS.DRIVE_MAX_RESULTS,
            fields: 'nextPageToken, files(id, name, mimeType, createdTime, modifiedTime, size, webViewLink, owners)',
            orderBy: 'modifiedTime desc'
        });

        const files = result.data.files || [];
        
        return files.map(file => ({
            id: file.id,
            source: "drive",
            title: file.name,
            content: `File type: ${file.mimeType}`,
            date: file.modifiedTime,
            createdDate: file.createdTime,
            size: file.size,
            webViewLink: file.webViewLink,
            owners: file.owners?.map(owner => owner.emailAddress) || []
        }));
    } catch (error) {
        console.error("Error fetching Drive data:", error.message);
        return [];
    }
};

// Google Calendar integration function
const getCalendarData = async (authClient) => {
    try {
        const calendar = google.calendar({ version: "v3", auth: authClient });
        
        // Get primary calendar events for the next 30 days
        const timeMin = new Date().toISOString();
        const timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        
        const result = await calendar.events.list({
            calendarId: 'primary',
            timeMin: timeMin,
            timeMax: timeMax,
            maxResults: RATE_LIMITS.CALENDAR_MAX_RESULTS,
            singleEvents: true,
            orderBy: 'startTime'
        });

        const events = result.data.items || [];
        
        return events.map(event => ({
            id: event.id,
            source: "calendar",
            title: event.summary || "No Title",
            content: event.description || "",
            date: event.start?.dateTime || event.start?.date,
            endDate: event.end?.dateTime || event.end?.date,
            location: event.location || "",
            attendees: event.attendees?.map(attendee => attendee.email) || [],
            organizer: event.organizer?.email || "",
            status: event.status,
            webLink: event.htmlLink
        }));
    } catch (error) {
        console.error("Error fetching Calendar data:", error.message);
        return [];
    }
};

// Main connector function - orchestrates all Google services
export const connector = async (req, res) => {
    try {
        // Initialize Google client
        const authClient = await initializeGoogleClient(req.user._id);
        
        // Fetch data from all services concurrently with error handling
        const [gmailData, driveData, calendarData] = await Promise.allSettled([
            getGmailData(authClient),
            getDriveData(authClient),
            getCalendarData(authClient)
        ]);

        // Process results and handle any failures
        const results = {
            gmail: gmailData.status === 'fulfilled' ? gmailData.value : [],
            drive: driveData.status === 'fulfilled' ? driveData.value : [],
            calendar: calendarData.status === 'fulfilled' ? calendarData.value : [],
            errors: []
        };

        // Collect any errors
        if (gmailData.status === 'rejected') {
            results.errors.push({ service: 'gmail', error: gmailData.reason.message });
        }
        if (driveData.status === 'rejected') {
            results.errors.push({ service: 'drive', error: driveData.reason.message });
        }
        if (calendarData.status === 'rejected') {
            results.errors.push({ service: 'calendar', error: calendarData.reason.message });
        }

        // Combine all data
        const allData = [
            ...results.gmail,
            ...results.drive,
            ...results.calendar
        ];

        // Return response with summary
        res.json({
            success: true,
            totalItems: allData.length,
            summary: {
                gmail: results.gmail.length,
                drive: results.drive.length,
                calendar: results.calendar.length
            },
            data: allData,
            errors: results.errors.length > 0 ? results.errors : undefined
        });

    } catch (error) {
        console.error("Connector error:", error.message);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch data from Google services",
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// Individual service endpoints for granular access
export const getGmailOnly = async (req, res) => {
    try {
        const authClient = await initializeGoogleClient(req.user._id);
        const gmailData = await getGmailData(authClient);
        
        res.json({
            success: true,
            service: 'gmail',
            count: gmailData.length,
            data: gmailData
        });
    } catch (error) {
        console.error("Gmail error:", error.message);
        res.status(500).json({
            success: false,
            service: 'gmail',
            message: error.message
        });
    }
};

export const getDriveOnly = async (req, res) => {
    try {
        const authClient = await initializeGoogleClient(req.user._id);
        const driveData = await getDriveData(authClient);
        
        res.json({
            success: true,
            service: 'drive',
            count: driveData.length,
            data: driveData
        });
    } catch (error) {
        console.error("Drive error:", error.message);
        res.status(500).json({
            success: false,
            service: 'drive',
            message: error.message
        });
    }
};

export const getCalendarOnly = async (req, res) => {
    try {
        const authClient = await initializeGoogleClient(req.user._id);
        const calendarData = await getCalendarData(authClient);
        
        res.json({
            success: true,
            service: 'calendar',
            count: calendarData.length,
            data: calendarData
        });
    } catch (error) {
        console.error("Calendar error:", error.message);
        res.status(500).json({
            success: false,
            service: 'calendar',
            message: error.message
        });
    }
};









