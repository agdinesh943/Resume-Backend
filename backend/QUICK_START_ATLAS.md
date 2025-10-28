# Quick Start Guide - MongoDB Atlas Setup

Follow these steps to set up MongoDB Atlas for the Resume Tracker application.

## 🚀 Quick Setup (5 Minutes)

### 1. Create Account

- Visit: https://cloud.mongodb.com/
- Click "Try Free" and sign up

### 2. Create Free Cluster

- Click "Build a Database"
- Select **M0 Free** tier
- Choose a region (preferably closest to you)
- Click "Create Cluster"
- Wait ~2-3 minutes

### 3. Create Database User

1. Navigate to **"Database Access"** (left sidebar)
2. Click **"Add New Database User"**
3. Authentication Method: **Password**
4. Username: `resume_tracker_admin`
5. Click **"Autogenerate Secure Password"** - **COPY AND SAVE IT!**
6. User Privileges: **Atlas admin** or **Read and write to any database**
7. Click **"Add User"**

### 4. Configure Network Access

1. Navigate to **"Network Access"** (left sidebar)
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (for development)
   - Use `0.0.0.0/0` to allow all IPs
4. Click **"Confirm"**

### 5. Get Connection String

1. Navigate to **"Database"** (left sidebar)
2. Click **"Connect"** on your cluster
3. Select **"Connect your application"**
4. Copy the connection string
   - It looks like: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?...`

### 6. Configure Your App

Create/update `Backend/.env` file:

```bash
# Copy from env-template.txt first
cp env-template.txt .env
```

Edit `Backend/.env`:

```bash
MONGODB_URI=mongodb+srv://resume_tracker_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/resume-tracker?retryWrites=true&w=majority
```

**Replace:**

- `YOUR_PASSWORD` with the password you copied in step 3
- `cluster0.xxxxx` with your actual cluster address from step 5

### 7. Install and Run

```bash
cd Backend
npm install
npm start
```

You should see:

```
✅ MongoDB Connected Successfully
PDF generation server running on port 5000
```

## ✅ Testing

1. Generate a resume from the frontend
2. Check the preview page - you should see a 6-digit code
3. Visit `http://localhost:5000/admin-monitor`
   - Login with: `admin` / `admin123`
   - You should see the generated resume code in the table

## 🔒 Security for Production

Before deploying to production:

1. **Change admin credentials** in `.env`:

   ```bash
   ADMIN_USERNAME=your_secure_username
   ADMIN_PASSWORD=your_secure_password_here
   ```

2. **Restrict IP access** in MongoDB Atlas:

   - Go to "Network Access"
   - Remove `0.0.0.0/0`
   - Add your server's specific IP address

3. **Use strong session secret**:
   ```bash
   ADMIN_SESSION_SECRET=generate-a-random-strong-secret-key-here
   ```

## 🆘 Troubleshooting

### "MongoServerError: bad auth"

- Check username and password in connection string
- Verify database user was created correctly

### "MongoServerError: IP not whitelisted"

- Go to Network Access and add your IP or use `0.0.0.0/0` temporarily

### "MongooseServerSelectionError"

- Check internet connection
- Verify cluster is active (not sleeping - free tier sleeps after inactivity)
- Cluster may need a few minutes to start if it was sleeping

### Connection Timeout

- Check firewall settings
- Verify connection string is correct
- Try from a different network

## 📊 Verify Database

To check if logs are being saved:

1. Go to MongoDB Atlas Dashboard
2. Click "Browse Collections"
3. Select your database
4. You should see a `resumelogs` collection
5. Documents will show username, resumeCode, and createdAt

## 🎉 Done!

Your resume tracking system is now running on MongoDB Atlas cloud database!

---

**Need Help?**

- MongoDB Atlas Docs: https://docs.atlas.mongodb.com/
- Free tier includes: 512MB storage, shared RAM, free forever
