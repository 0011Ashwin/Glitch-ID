# 🎫 Glitch-ID: Event ID Card Generator & Verification System

[![React](https://img.shields.io/badge/React-19.x-61DAFB.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg)](https://typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF.svg)](https://vitejs.dev)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933.svg)](https://nodejs.org)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> A full-stack **ID Card Generation and QR-based Verification System** for events, hackathons, and conferences. Generate professional ID cards, verify participants via QR scanning, and manage attendees through an admin dashboard.

![Glitch-ID Banner](https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Installation](#-installation)
- [Usage](#-usage)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Configuration](#-configuration)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🔍 Overview

**Glitch-ID** solves common event management challenges:

- 📛 **Manual ID creation** is time-consuming and error-prone
- ✅ **Attendance tracking** requires efficient verification
- 🔒 **Security concerns** at entry points need quick validation
- 📊 **Participant data** management needs centralization

This system provides an end-to-end solution from participant registration to on-site verification.

### Key Benefits

| For Organizers | For Participants |
|----------------|------------------|
| Automated ID generation | Self-service ID retrieval |
| Real-time attendance tracking | QR code for quick check-in |
| Admin dashboard for management | Professional ID card design |
| Data export capabilities | Download ID as image |

---

## ✨ Features

### 🎴 ID Card Generation

| Feature | Description |
|---------|-------------|
| **Professional Design** | Modern, customizable ID card templates |
| **QR Code Integration** | Unique QR code per participant |
| **Image Export** | Download ID cards as PNG using html2canvas |
| **Real-time Preview** | See changes instantly |

### 📱 QR Verification System

| Feature | Description |
|---------|-------------|
| **Camera Scanning** | Use device camera for QR scanning |
| **Instant Verification** | Real-time participant validation |
| **Duplicate Detection** | Alerts for already-verified attendees |
| **Verification Log** | Track all check-ins with timestamps |

### 👨‍💼 Admin Dashboard

| Feature | Description |
|---------|-------------|
| **Participant Management** | View all registered members |
| **Verification Status** | Track who has checked in |
| **Search & Filter** | Find participants quickly |
| **Data Import** | Load participants from Excel |

### 🔐 Authentication

| Feature | Description |
|---------|-------------|
| **Student Login** | Name + Enrollment number verification |
| **Admin Login** | Password-protected admin access |
| **Session Management** | Secure navigation between views |

---

## 🛠️ Tech Stack

| Category | Technologies |
|----------|--------------|
| **Frontend** | React 19, TypeScript, Vite |
| **Backend** | Node.js, Express.js |
| **Database** | SQLite (better-sqlite3) |
| **QR Code** | qrcode (generation), html5-qrcode (scanning) |
| **Export** | html2canvas |
| **AI Integration** | Gemini API (optional) |

---

## 🚀 Installation

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Quick Start

```bash
# Clone the repository
git clone https://github.com/0011Ashwin/Glitch-ID.git
cd Glitch-ID

# Install dependencies
npm install

# Start development server (frontend)
npm run dev

# In a separate terminal, start the backend
npm run start
```

### Access Points

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000 |

---

## 💻 Usage

### For Participants

1. **Open the landing page**
2. Click **"Get Your ID Card"**
3. Enter your **Name** and **Enrollment Number**
4. View and **download** your ID card
5. Use the **QR code** for event check-in

### For Admins

1. Click **"Admin Login"**
2. Enter admin password: `glitch2025`
3. Access the **Admin Dashboard**
4. View all participants and verification status
5. Use **QR Scanner** for check-in verification

### For Verification Team

1. Login as Admin
2. Navigate to **Verification Scanner**
3. Scan participant QR codes
4. System shows:
   - ✅ **Verified** - First-time check-in
   - ⚠️ **Already Verified** - Duplicate scan
   - ❌ **Not Found** - Invalid QR

---

## 📁 Project Structure

```
Glitch-ID/
├── index.html                  # HTML entry point
├── index.tsx                   # React entry point
├── App.tsx                     # Main application component
├── types.ts                    # TypeScript type definitions
├── package.json                # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── vite.config.ts              # Vite build configuration
│
├── components/                 # React components
│   ├── LandingPage.tsx         # Home page
│   ├── StudentLogin.tsx        # Participant login form
│   ├── AdminLogin.tsx          # Admin authentication
│   ├── AdminView.tsx           # Admin dashboard
│   ├── IdCard.tsx              # ID card display component
│   ├── QrCode.tsx              # QR code generator
│   ├── VerificationScanner.tsx # QR scanning component
│   └── icons.tsx               # Icon components
│
├── server/                     # Backend server
│   ├── server.mjs              # Express.js server
│   └── db.mjs                  # SQLite database operations
│
├── api/                        # API utilities
│   └── ...                     # API helper functions
│
├── utils/                      # Utility functions
│   └── ...                     # Helper utilities
│
└── data/                       # Data files (Excel imports)
    └── Final_selected_student_list.xlsx
```

---

## 🔌 API Documentation

### Endpoints

#### GET /api/members
Retrieve all registered participants.

```json
Response:
{
  "members": [
    {
      "name": "John Doe",
      "enrollmentNumber": "2024001",
      "email": "john@example.com",
      "department": "Computer Science"
    }
  ]
}
```

#### POST /api/verify
Verify a participant by enrollment number.

```json
Request:
{
  "enrollmentNumber": "2024001"
}

Response:
{
  "status": "verified",
  "member": { ... },
  "verifiedAt": "2025-01-15T10:30:00Z"
}
```

---

## ⚙️ Configuration

### Environment Variables

Create a `.env.local` file:

```env
# Gemini API (optional, for AI features)
GEMINI_API_KEY=your_gemini_api_key

# Server Port
PORT=3000
```

### Customizing ID Card Design

Edit `components/IdCard.tsx` to customize:
- Colors and branding
- Fields displayed
- QR code position
- Layout and styling

### Importing Participant Data

1. Prepare Excel file with columns: `name`, `enrollmentNumber`, `email`, `department`
2. Place in project root
3. Import via admin dashboard or directly to SQLite

---

## 🔒 Security Notes

- Change default admin password in production
- Use environment variables for sensitive data
- Implement rate limiting for API endpoints
- Add HTTPS for production deployment

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/CustomTemplate`)
3. **Commit** your changes (`git commit -m 'Add custom ID templates'`)
4. **Push** to the branch (`git push origin feature/CustomTemplate`)
5. **Open** a Pull Request

### Ideas for Contributions

- [ ] Multiple ID card templates
- [ ] Email ID cards to participants
- [ ] Batch ID generation
- [ ] Analytics dashboard
- [ ] Multi-event support
- [ ] Mobile app for verification

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **html5-qrcode** for QR scanning capabilities
- **html2canvas** for image export functionality
- **Vite** for blazing-fast development experience
- **React** team for the amazing framework

---

<p align="center">
  Made with ❤️ for event organizers
  <br>
  <a href="https://github.com/0011Ashwin">@0011Ashwin</a>
</p>
