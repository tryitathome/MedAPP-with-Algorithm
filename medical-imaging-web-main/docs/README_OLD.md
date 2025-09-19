# Medical Imaging Diagnosis Platform

A comprehensive AI-powered medical imaging platform for automated diagnosis of gastritis and oral mucosal diseases. This application enables healthcare professionals to upload medical images and receive AI-assisted diagnostic insights through an intuitive web interface.

## 🩺 Features

### Multi-Modal Diagnosis Support
- **Gastritis Diagnosis**: Automated analysis of gastroscopic images, pathology reports, and laboratory test results
- **Oral Diagnosis**: AI-powered detection of oral mucosal lesions and potentially malignant disorders

## 🏗️ Architecture

This is a full-stack monorepo application built with:

### Frontend
- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **UI Components**: Custom components with modern design

### Backend
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL/MongoDB (configurable)
- **File Storage**: Local storage with cloud storage options
- **AI Services**: Custom AI/ML services for image analysis

### Shared Packages
- **shared-types**: Common TypeScript definitions
- **shared-utils**: Utility functions and validations
- **shared-config**: ESLint, Prettier, and build configurations

## 🚀 Quick Start

### Prerequisites
- Node.js 18.x or higher
- Yarn or npm
- PostgreSQL (if using SQL database)
- Docker (optional, for containerized deployment)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd medical-imaging-monorepo
```

2. **Install dependencies**
```bash
yarn install
# or
npm install
```

3. **Start the development servers**
```bash
# Start both frontend and backend
yarn dev
# or
npm run dev
```

The application will be available at:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

---

**⚠️ Medical Disclaimer**: This application is designed to assist healthcare professionals and should not replace professional medical judgment. All diagnostic results should be reviewed by qualified medical personnel.