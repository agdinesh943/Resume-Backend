const express = require('express');
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongo');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Import ResumeLog model
const ResumeLog = require('./models/ResumeLog');

const app = express();
const PORT = process.env.PORT || 5000;

// MongoDB Connection
const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/resume-tracker';
        await mongoose.connect(mongoURI);
        console.log('✅ MongoDB Connected Successfully');
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error.message);
        console.error('Continuing without database. Some features may not work.');
    }
};

// Connect to MongoDB
connectDB();

// Session configuration for admin authentication
// Use MongoDB for session storage instead of MemoryStore (production-ready)
app.use(session({
    secret: process.env.ADMIN_SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    store: MongoDBStore.create({
        mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/resume-tracker',
        touchAfter: 24 * 3600, // lazy session update (in seconds)
        ttl: 24 * 60 * 60 // session time-to-live in seconds (24 hours)
    }),
    cookie: {
        secure: false, // Set to false to allow cookies on HTTP (needed for cross-origin)
        httpOnly: true, // Protect against XSS attacks
        sameSite: 'lax', // Allow cross-origin cookies
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Function to generate a unique 6-digit code with AU prefix
async function generateResumeCode() {
    const maxAttempts = 10; // Prevent infinite loops
    let attempts = 0;

    while (attempts < maxAttempts) {
        const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
        const code = `AU${randomCode}`;

        try {
            // Check if code already exists in database
            if (mongoose.connection.readyState === 1) {
                const existingCode = await ResumeLog.findOne({ resumeCode: code });
                if (!existingCode) {
                    console.log(`✅ Generated unique resume code: ${code}`);
                    return code;
                } else {
                    console.log(`⚠️  Code ${code} already exists, generating new one...`);
                }
            } else {
                // If database not connected, return the code anyway
                console.log(`⚠️  Database not connected, using code: ${code}`);
                return code;
            }
        } catch (error) {
            console.error(`Error checking code ${code}:`, error);
            // If there's an error checking, return the code to avoid blocking
            return code;
        }

        attempts++;
    }

    // Fallback: if we can't generate a unique code after max attempts
    const fallbackCode = `AU${Date.now().toString().slice(-6)}`;
    console.error(`⚠️  Could not generate unique code after ${maxAttempts} attempts, using timestamp-based code: ${fallbackCode}`);
    return fallbackCode;
}




app.use(cors({
    origin: true, // Allow all origins temporarily
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Admin-Token'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// Additional CORS handling for preflight requests
app.options('*', (req, res) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Admin-Token');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.sendStatus(200);
});
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from frontend directory (only in development)
// In production, frontend is served separately by Netlify
if (process.env.NODE_ENV !== 'production') {
    app.use(express.static(path.join(__dirname, 'frontend')));
}

// JWT Secret for admin authentication
const JWT_SECRET = process.env.JWT_SECRET || process.env.ADMIN_SESSION_SECRET || 'your-secret-key-change-in-production';

// Middleware to check admin authentication using JWT
const requireAdmin = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.headers['x-admin-token'];

    if (!token) {
        return res.status(401).json({ success: false, message: 'Unauthorized: No token provided' });
    }

    try {
        // Verify JWT token
        const decoded = jwt.verify(token, JWT_SECRET);
        // Attach decoded token info to request for use in routes if needed
        req.admin = decoded;
        return next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Unauthorized: Token expired' });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token' });
        }
        return res.status(401).json({ success: false, message: 'Unauthorized: Token verification failed' });
    }
};

app.post('/generate-pdf', async (req, res) => {
    // Add CORS headers manually as backup
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');

    console.log('PDF generation request received from origin:', req.headers.origin);

    let browser;
    let resumeCode = null;
    try {
        const { html, username = 'Resume' } = req.body;

        // Generate a unique 6-digit code for this resume
        resumeCode = await generateResumeCode();
        console.log(`Generated resume code: ${resumeCode} for username: ${username}`);

        if (!html) {
            return res.status(400).json({ error: 'HTML content is required' });
        }

        // Launch Puppeteer with high DPI settings
        const isProduction = process.env.NODE_ENV === 'production' || process.env.PORT;
        const puppeteerArgs = [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--font-render-hinting=none',
            '--disable-font-subpixel-positioning',
            '--memory-pressure-off',
            '--max_old_space_size=4096'
        ];

        // Add production-specific args
        if (isProduction) {
            puppeteerArgs.push('--disable-web-security');
            puppeteerArgs.push('--disable-features=VizDisplayCompositor');
            puppeteerArgs.push('--disable-background-timer-throttling');
            puppeteerArgs.push('--disable-backgrounding-occluded-windows');
            puppeteerArgs.push('--disable-renderer-backgrounding');
        }

        browser = await puppeteer.launch({
            headless: 'new',
            args: puppeteerArgs
        });

        const page = await browser.newPage();

        // Set request interception for better performance
        await page.setRequestInterception(true);
        page.on('request', (request) => {
            const resourceType = request.resourceType();
            if (resourceType === 'image' || resourceType === 'font' || resourceType === 'stylesheet') {
                // Allow images and fonts but block other resources
                request.continue();
            } else {
                request.continue();
            }
        });

        // Set viewport for exact A4 dimensions - no gaps
        await page.setViewport({
            width: 794, // A4 width in pixels at 96 DPI (210mm)
            height: 1123, // A4 height in pixels at 96 DPI (297mm)
            deviceScaleFactor: 1, // Use 1x to match exact A4 size
            isMobile: false,
            hasTouch: false
        });

        // Read the template and inject the HTML content
        const templatePath = path.join(__dirname, 'templates', 'resume.html');

        // Check if template file exists
        if (!fs.existsSync(templatePath)) {
            console.error('Template file not found:', templatePath);
            return res.status(500).json({ error: 'Template file not found' });
        }

        let templateHtml = fs.readFileSync(templatePath, 'utf8');

        // Read the CSS file and inject it directly
        const cssPath = path.join(__dirname, 'frontend', 'index.css');

        // Check if CSS file exists
        if (!fs.existsSync(cssPath)) {
            console.error('CSS file not found:', cssPath);
            return res.status(500).json({ error: 'CSS file not found' });
        }

        // Use production URL if not on localhost, otherwise use localhost
        const baseUrl = isProduction
            ? 'https://resume-backend-kzg9.onrender.com'
            // ? 'https://test-resume-1akf.onrender.com'
            : 'http://localhost:5000';

        let cssContent = fs.readFileSync(cssPath, 'utf8');

        // Fix image paths in CSS content as well
        const originalCssImages = cssContent.match(/url\(['"]?[^'"]*images[^'"]*['"]?\)/g) || [];

        cssContent = cssContent.replace(/url\(['"]?\.\/images\//g, `url('${baseUrl}/images/`);
        cssContent = cssContent.replace(/url\(['"]?images\//g, `url('${baseUrl}/images/`);

        const processedCssImages = cssContent.match(/url\(['"]?[^'"]*images[^'"]*['"]?\)/g) || [];

        // Inject CSS content at the end of body to ensure it overrides template styles
        templateHtml = templateHtml.replace('<!-- CSS will be injected by server -->', '');
        templateHtml = templateHtml.replace('</body>', `<style>${cssContent}</style></body>`);

        // Fix image paths to use absolute URLs for proper loading
        let processedHtml = html;

        // Fix image paths to use absolute URLs for proper loading
        console.log('Base URL for images:', baseUrl);
        const originalImagePaths = processedHtml.match(/src="[^"]*images[^"]*"/g) || [];
        console.log('Original image paths found:', originalImagePaths.length);
        console.log('Sample original paths:', originalImagePaths.slice(0, 3));

        // Replace various image path patterns with absolute URLs for local file access
        // This doesn't affect base64 images (which start with 'data:')
        // Replace src="/images/..." (frontend absolute paths)
        processedHtml = processedHtml.replace(/src="\/images\/([^"]+)"/g, `src="${baseUrl}/images/$1"`);
        processedHtml = processedHtml.replace(/src='\/images\/([^']+)'/g, `src='${baseUrl}/images/$1'`);
        // Replace src="./images/..." (relative paths)
        processedHtml = processedHtml.replace(/src="\.\/images\//g, `src="${baseUrl}/images/`);
        processedHtml = processedHtml.replace(/src="images\//g, `src="${baseUrl}/images/`);
        processedHtml = processedHtml.replace(/src='\.\/images\//g, `src='${baseUrl}/images/`);
        processedHtml = processedHtml.replace(/src='images\//g, `src='${baseUrl}/images/`);

        const processedImagePaths = processedHtml.match(/src="[^"]*images[^"]*"/g) || [];
        console.log('Processed image paths:', processedImagePaths.length);
        console.log('Sample processed paths:', processedImagePaths.slice(0, 3));

        // Replace the placeholder with actual resume content
        templateHtml = templateHtml.replace('<!-- Resume content will be injected here -->', processedHtml);

        // Replace username placeholder in title
        templateHtml = templateHtml.replace('{{username}}', username);
        console.log('Username replacement:', username);

        // Debug: Log the HTML length to ensure content is being injected
        console.log('HTML content length:', html.length);
        console.log('Processed HTML length:', processedHtml.length);
        console.log('Template HTML length:', templateHtml.length);

        // Set content with optimized loading strategy
        await page.setContent(templateHtml, {
            waitUntil: 'domcontentloaded',
            timeout: 60000
        });

        // Wait for images with timeout and fallback
        try {
            const imageResults = await page.evaluate(() => {
                return Promise.all(
                    Array.from(document.images).map(img => {
                        if (img.complete) return Promise.resolve({ src: img.src, loaded: true });
                        return new Promise((resolve) => {
                            const timeout = setTimeout(() => {
                                console.warn('Image load timeout:', img.src);
                                resolve({ src: img.src, loaded: false, error: 'timeout' }); // Continue even if timeout
                            }, 10000); // 10 second timeout per image

                            img.onload = () => {
                                clearTimeout(timeout);
                                resolve({ src: img.src, loaded: true });
                            };
                            img.onerror = (error) => {
                                clearTimeout(timeout);
                                console.warn('Image failed to load:', img.src, error);
                                resolve({ src: img.src, loaded: false, error: 'load_error' }); // Continue even if some images fail
                            };
                        });
                    })
                );
            });

            console.log('Image loading results:');
            imageResults.forEach((result, index) => {
                console.log(`Image ${index + 1}: ${result.loaded ? '✅' : '❌'} ${result.src}`);
                if (!result.loaded) {
                    console.log(`  Error: ${result.error}`);
                }
            });

        } catch (error) {
            console.warn('Image loading error, continuing:', error);
        }

        // Wait for fonts to load with timeout
        try {
            await Promise.race([
                page.evaluateHandle('document.fonts.ready'),
                new Promise((resolve) => setTimeout(resolve, 5000)) // 5 second timeout
            ]);
        } catch (error) {
            console.warn('Font loading timeout, continuing:', error);
        }

        // Generate PDF with exact A4 dimensions - no gaps
        console.log('Starting PDF generation...');
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '0mm',
                right: '0mm',
                bottom: '0mm',
                left: '0mm'
            },
            preferCSSPageSize: true,
            displayHeaderFooter: false,
            scale: 1,
            width: '210mm',
            height: '297mm'
        });
        console.log('PDF generated successfully, buffer size:', pdfBuffer.length);

        // Save the resume log to database BEFORE sending PDF response
        if (mongoose.connection.readyState === 1) {
            try {
                const logEntry = new ResumeLog({
                    username: username,
                    resumeCode: resumeCode,
                    createdAt: new Date()
                });

                await logEntry.save();
                console.log(`✅ Resume log saved: ${username} - Code: ${resumeCode}`);
            } catch (err) {
                console.error('Error saving resume log:', err);
            }
        } else {
            console.log('⚠️  Database not connected. Resume log not saved.');
        }

        // Set all headers BEFORE sending response
        const filename = `resume_${username.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

        // MUST set custom headers BEFORE Content-Type when sending binary
        res.setHeader('X-Resume-Code', resumeCode);
        res.setHeader('Access-Control-Expose-Headers', 'X-Resume-Code');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Pragma', 'no-cache');

        console.log(`✅ Setting resume code header: ${resumeCode}`);

        // Send PDF
        res.write(pdfBuffer);
        res.end();

    } catch (error) {
        console.error('PDF generation error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            error: 'Failed to generate PDF',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    } finally {
        if (browser) {
            await browser.close();
        }
    }
});


// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve frontend routes (only in development)
// In production, frontend is served separately by Netlify
if (process.env.NODE_ENV !== 'production') {
    // Serve the main landing page at /landing
    app.get('/landing-page', (req, res) => {
        res.sendFile(path.resolve(__dirname, 'frontend', 'index.html'));
    });

    // Serve root/index page
    app.get('/', (req, res) => {
        res.sendFile(path.resolve(__dirname, 'frontend', 'index.html'));
    });

    // Resume form endpoint
    app.get('/resume-form', (req, res) => {
        res.sendFile(path.resolve(__dirname, 'frontend', 'resume-form.html'));
    });

    // Resume preview endpoint
    app.get('/preview', (req, res) => {
        res.sendFile(path.resolve(__dirname, 'frontend', 'preview.html'));
    });
}

app.get('/api/test', (req, res) => {
    res.json({ status: "Backend is live!" });
});

// Admin routes removed - now handled by frontend React pages

// Admin Login API
app.post('/api/admin-login', (req, res) => {
    // Set CORS headers for credentials
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Token');

    const { username, password } = req.body;
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (username === adminUsername && password === adminPassword) {
        // Generate JWT token with 24 hour expiration
        const token = jwt.sign(
            {
                username: adminUsername,
                type: 'admin'
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log('✅ Admin login successful, JWT token issued');
        res.json({ success: true, token });
    } else {
        console.log('❌ Admin login failed:', username);
        res.json({ success: false, message: 'Invalid credentials' });
    }
});

// Admin Logout
// Note: With JWT, logout is typically handled client-side by removing the token
// This endpoint is kept for consistency and can be used to invalidate tokens if needed
app.post('/api/admin-logout', (req, res) => {
    // With stateless JWT, we don't need to track tokens server-side
    // The client should remove the token from localStorage
    console.log('✅ Admin logged out (client should remove token)');
    res.json({ success: true, message: 'Logged out successfully' });
});

// API endpoint to get logs as JSON (alternative to HTML view)
app.get('/api/admin-logs', requireAdmin, async (req, res) => {
    try {
        console.log('📋 Admin logs requested');
        let logs = [];
        if (mongoose.connection.readyState === 1) {
            logs = await ResumeLog.find().sort({ createdAt: -1 });
        }
        res.json({ success: true, logs, count: logs.length });
    } catch (error) {
        console.error('❌ Error in admin-logs:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// API endpoint to get aggregated user stats
app.get('/api/admin-user-stats', requireAdmin, async (req, res) => {
    try {
        console.log('📊 Admin user stats requested');
        let userStats = [];

        if (mongoose.connection.readyState === 1) {
            // Aggregate data by username
            const stats = await ResumeLog.aggregate([
                {
                    $group: {
                        _id: '$username',
                        resumeCodes: { $push: '$resumeCode' },
                        count: { $sum: 1 },
                        firstGenerated: { $min: '$createdAt' },
                        lastGenerated: { $max: '$createdAt' }
                    }
                },
                {
                    $sort: { count: -1 } // Sort by count (descending)
                }
            ]);

            userStats = stats.map(stat => ({
                username: stat._id,
                totalResumes: stat.count,
                resumeCodes: stat.resumeCodes,
                firstGenerated: stat.firstGenerated,
                lastGenerated: stat.lastGenerated
            }));

        }

        res.json({ success: true, userStats, count: userStats.length });
    } catch (error) {
        console.error('❌ Error in admin-user-stats:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// API endpoint to validate a resume code
app.post('/api/admin-validate-code', requireAdmin, async (req, res) => {
    try {
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({ success: false, error: 'Code is required' });
        }

        let result = null;
        if (mongoose.connection.readyState === 1) {
            // Find all logs with matching code (should be one, but just in case)
            const logs = await ResumeLog.find({ resumeCode: code }).sort({ createdAt: -1 });

            if (logs.length > 0) {
                // Get the most recent log
                const log = logs[0];

                // Find all codes for this user
                const userLogs = await ResumeLog.find({ username: log.username }).sort({ createdAt: -1 });

                result = {
                    username: log.username,
                    code: log.resumeCode,
                    generatedAt: log.createdAt,
                    totalResumes: userLogs.length,
                    allCodes: userLogs.map(l => ({
                        code: l.resumeCode,
                        generatedAt: l.createdAt
                    })),
                    firstGenerated: userLogs[userLogs.length - 1].createdAt,
                    lastGenerated: userLogs[0].createdAt
                };
            }
        }

        res.json({ success: true, result, found: result !== null });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Debug endpoint to check file structure (DISABLED IN PRODUCTION)
if (process.env.NODE_ENV !== 'production') {
    app.get('/api/debug', (req, res) => {
        const fs = require('fs');
        const path = require('path');

        const debugInfo = {
            cwd: process.cwd(),
            __dirname: __dirname,
            nodeEnv: process.env.NODE_ENV,
            baseUrl: process.env.NODE_ENV === 'production'
                ? 'https://resume-backend-kzg9.onrender.com'
                // ? 'https://test-resume-1akf.onrender.com'
                : 'http://localhost:5000',
            files: {
                template: {
                    path: path.join(__dirname, 'templates', 'resume.html'),
                    exists: fs.existsSync(path.join(__dirname, 'templates', 'resume.html'))
                },
                css: {
                    path: path.join(__dirname, 'frontend', 'index.css'),
                    exists: fs.existsSync(path.join(__dirname, 'frontend', 'index.css'))
                },
                frontendDir: {
                    path: path.join(__dirname, 'frontend'),
                    exists: fs.existsSync(path.join(__dirname, 'frontend'))
                },
                imagesDir: {
                    path: path.join(__dirname, 'frontend', 'images'),
                    exists: fs.existsSync(path.join(__dirname, 'frontend', 'images'))
                }
            }
        };

        // Try to list directory contents
        try {
            debugInfo.frontendContents = fs.readdirSync(path.join(__dirname, 'frontend'));
        } catch (e) {
            debugInfo.frontendContents = `Error: ${e.message}`;
        }

        try {
            debugInfo.templatesContents = fs.readdirSync(path.join(__dirname, 'templates'));
        } catch (e) {
            debugInfo.templatesContents = `Error: ${e.message}`;
        }

        try {
            debugInfo.imagesContents = fs.readdirSync(path.join(__dirname, 'frontend', 'images'));
        } catch (e) {
            debugInfo.imagesContents = `Error: ${e.message}`;
        }

        res.json(debugInfo);
    });
}
// Catch-all handler: send back index.html for any non-API routes (SPA behavior)
// Only in development - in production, frontend is served separately by Netlify
if (process.env.NODE_ENV !== 'production') {
    app.get('*', (req, res) => {
        // Skip API routes
        if (req.path.startsWith('/api/') || req.path.startsWith('/generate-pdf')) {
            return res.status(404).json({ error: 'API endpoint not found' });
        }

        // Serve index.html for all other routes
        res.sendFile(path.resolve(__dirname, 'frontend', 'index.html'));
    });
} else {
    // In production, only handle API routes - return 404 for everything else
    app.get('*', (req, res) => {
        // Skip API routes - they're handled above
        if (!req.path.startsWith('/api/') && !req.path.startsWith('/generate-pdf') && req.path !== '/health') {
            return res.status(404).json({
                error: 'Not found',
                message: 'This is an API server. Please access the frontend at your Netlify URL.'
            });
        }
        return res.status(404).json({ error: 'API endpoint not found' });
    });
}


app.listen(PORT, () => {
    console.log('=================================');
    console.log(`PORT from process.env: ${process.env.PORT || 'not set'}`);
    console.log(`PORT being used: ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('=================================');
    console.log(`PDF generation server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`API Test: http://localhost:${PORT}/api/test`);
});
