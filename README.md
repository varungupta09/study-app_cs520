# StudySphere

## Introduction
StudySphere is an Artificial Intelligence powered web application that allows students to transform their class materials, such as note pages or slideshows, into personalized study materials. The goal of the app is to use AI for simplifying learning, enhancing knowledge retention, tailoring study methods, and tracking progress.

Features:
1. User signup and login
2. Upload notes PDF files into app
3. AI-generated quizzes from the notes
4. Shared study groups for comparing quiz scores
5. AI-generated summaries from the notes
6. AI-generated study plan from the notes

## Installation
1. Clone the app from GitHub
2. Set up and start the frontend:
```
cd frontend
npm install
npm start
```
3. Set up and start the backend
```
cd backend
npm install
cd src
node server.js
```

## Configuration
StudySphere is configured with a JSON web token for user authentication and a Google Gemini API key for interacting with AI.

## AI Models
StudySphere uses the Google Gemini 1.5 model, which is effective for generating study materials while also being fast and cost-efficient.