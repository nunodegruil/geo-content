# Geo Content

A web platform for creating, exploring and managing georeferenced content based on geographic location.

Developed as the Final Project of my Bachelor's Degree in Computer Engineering at Universidade Aberta.

**Final Project Grade: 18/20**

## About the Project

Geo Content is a full-stack web application that allows users to create and explore content associated with geographic locations.

The project combines an interactive map-based interface with a REST API and a geospatial database, allowing content to be stored, searched and displayed according to its location.

## Features

- User registration and authentication using JWT
- Creation and visualization of georeferenced content
- Interactive map interface
- Search and filtering of content
- Search for nearby content based on geographic coordinates and radius
- Content moderation
- Metadata extraction from external URLs
- Geospatial data storage and queries

## Technologies

### Frontend

- React
- TypeScript
- Vite
- Leaflet / React Leaflet

### Backend

- Node.js
- Express
- TypeScript
- JWT
- bcrypt

### Database

- PostgreSQL
- PostGIS

## Project Structure

```text
geo-content/
├── backend/      # REST API and backend logic
├── frontend/     # React web application
├── database/     # Database schema
├── docs/         # Project documentation and tests
└── README.md
```

## Architecture

The application follows a client-server architecture:

- The **frontend** provides the user interface and interactive map.
- The **backend** exposes a REST API responsible for authentication, content management, moderation and metadata extraction.
- **PostgreSQL with PostGIS** provides persistent storage and geospatial functionality.

## Running the Project Locally

### Requirements

- Node.js
- PostgreSQL
- PostGIS

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Environment variables containing database credentials and authentication secrets are not included in the repository.

## Screenshots

Screenshots of the application will be added here.

## Academic Context

This project was developed as the Final Project of the Bachelor's Degree in Computer Engineering at Universidade Aberta.

**Final Project Grade: 18/20**