# SpeechEngine — AI Text-to-Speech Studio

> A full-stack AI-powered text-to-speech platform for generating, managing, and listening to natural-sounding speech with persistent audio history.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-SpeechEngine-black?style=for-the-badge)](https://speechengine-six.vercel.app/)
[![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Backend](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Database](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Deployment](https://img.shields.io/badge/Deployment-Vercel%20%2B%20Render-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)

## 🚀 Live Demo

**[Open SpeechEngine](https://speechengine-six.vercel.app/)**

SpeechEngine is a production-deployed full-stack text-to-speech application with authentication, persistent speech history, favorites, private audio storage, and secure historical playback.

---

## 📖 Overview

SpeechEngine allows users to convert text into speech through a clean and responsive web interface.

The application provides:

- Secure user authentication
- Text-to-speech generation
- Multiple languages and voices
- Persistent speech history
- Audio playback
- Audio downloads
- Favorites management
- Private historical audio storage
- Ownership-based authorization
- Responsive SaaS-style interface

The project was built with a focus on **real backend integration, data persistence, security, and production deployment** rather than relying on frontend-only mock data.

---

## ✨ Features

### 🎙️ Text-to-Speech

- Convert text into speech using an external TTS provider
- Support for multiple languages
- Multiple voice options
- 5,000-character text limit
- Server-side validation
- Audio returned as `audio/mpeg`

### 🔐 Authentication

- User registration and login
- Password hashing with `bcrypt`
- JWT-based authentication
- HTTP-only authentication cookies
- Protected application routes
- Session persistence across page refreshes
- Secure logout
- Server-side authorization

### 📚 Speech History

- Automatically save generated speeches
- View previous generations
- Sort and search speech history
- Play historical audio
- Download historical audio
- Delete speeches
- Deleting a speech also removes its associated stored audio

### ⭐ Favorites

- Mark speeches as favorites
- Remove speeches from favorites
- Dedicated Favorites page
- Favorite state synchronized across Create, History, and Favorites

### 🔊 Persistent Audio

Generated audio is stored securely using a private Supabase Storage bucket.

Audio files follow an ownership-based structure:

```text
users/<user-id>/speeches/<speech-id>.mp3
