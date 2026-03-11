---
name: start-server
description: 'Start the Node.js server for the game hub application. Use when: launching the local development server, running the backend locally.'
---

# Start Server Skill

This skill helps start the Node.js server for the game hub application.

## Workflow

1. **Check dependencies**: Ensure node_modules are installed.
   - If not, run `npm install`

2. **Start the server**: Run `npm start` to launch the server on port 3000.

3. **Verify**: Check that the server is running by visiting http://localhost:3000

## Commands

- Install dependencies: `npm install`
- Start server: `npm start`

The server uses SQLite database and will create gamehub.db if it doesn't exist.