## CSonic WhatsApp Cloud Webhook

- `npm install` then `npm start`
- Deploy to Render: create Web Service, build command `npm install`, start `npm start`; set env `PORT`
- Webhook URL: `<render-url>/webhook`, verify token `csonic123`
# CSonic WhatsApp Cloud API Webhook

Minimal Express server with `/webhook` GET/POST handlers, ready for Render or Railway deployment.

## Features
- GET `/webhook` verifies Meta challenge with `VERIFY_TOKEN=csonic123`
- POST `/webhook` logs incoming WhatsApp messages and status updates
- Health endpoint at `/` for uptime checks

## Local Development
```bash
cd whatsapp-render
npm install
npm start
```
Then expose the port via ngrok and set Meta's webhook URL to `https://<ngrok>/webhook`.

## Deploy to Render
1. Push this folder to a Git repo (see repo instructions below).
2. In Render, create a new **Web Service**, connect the repo, and point to `whatsapp-render`.
3. Render automatically uses `render.yaml` to run `npm install` and `npm start`.
4. After deploy, note the public URL (e.g., `https://csonic-whatsapp-bot.onrender.com`).
5. In Meta Developer → WhatsApp → Configuration, set:
   - Webhook URL: `https://<render-app>.onrender.com/webhook`
   - Verify token: `csonic123`

## Environment Variables
- `PORT` (set by hosting; default `3000` locally)
- `VERIFY_TOKEN` (optional override of the fixed token)

## Repository & Deployment
- Initialize git at the workspace root.
- `git add whatsapp-render` (and any other needed files).
- Create a new GitHub repo named `csonic-whatsapp-bot` and push.
- Connect Render/Railway to that repository for automatic deploys.

