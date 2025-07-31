# Development Setup Guide

## Prerequisites

### Node.js
This project requires Node.js 20.0.0 or higher. We recommend using Node.js 22.17.1 (as specified in `.nvmrc`).

### Environment Variables
1. Copy `.env` to `.env.local` (or use `.env.local.example` as a template)
2. The `.env` file is already configured with your Supabase credentials

## Running the Development Server

### From Windows (CMD/PowerShell)

1. **Install dependencies:**
   ```powershell
   npm install
   ```

2. **Run the development server:**
   ```powershell
   npm run dev
   ```

3. **Alternative: Run with Turbopack (faster):**
   ```powershell
   npm run dev:turbo
   ```

### From WSL (Windows Subsystem for Linux)

1. **Navigate to the project directory:**
   ```bash
   cd /mnt/c/Users/Big\ Daddy\ Pyatt/CascadeProjects/weatherProof
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Alternative: Run with Turbopack (faster):**
   ```bash
   npm run dev:turbo
   ```

## Common Issues & Solutions

### Port Already in Use
If you get a "Port 3000 is already in use" error:
- **Windows CMD/PowerShell:**
  ```powershell
  netstat -ano | findstr :3000
  taskkill /PID <PID> /F
  ```
- **WSL/Linux:**
  ```bash
  lsof -i :3000
  kill -9 <PID>
  ```

### Node Version Issues
If you encounter Node version errors:
- **Windows:** Use nvm-windows to install Node 22.17.1
  ```powershell
  nvm install 22.17.1
  nvm use 22.17.1
  ```
- **WSL:** Use nvm
  ```bash
  nvm install 22.17.1
  nvm use 22.17.1
  ```

### File Watching Issues in WSL
If hot reload doesn't work in WSL:
1. Make sure you're working in the Windows filesystem (`/mnt/c/...`)
2. Or add this to your `.env.local`:
   ```
   WATCHPACK_POLLING=true
   ```

### Access from Other Devices
To access the dev server from other devices on your network:
```bash
npm run dev -- --hostname 0.0.0.0
```

Then access via: `http://<your-computer-ip>:3000`

## Available Scripts

- `npm run dev` - Start development server (works on Windows/Mac/Linux)
- `npm run dev:turbo` - Start development server with Turbopack (experimental, faster)
- `npm run dev:cross` - Start with cross-env (if you need explicit NODE_ENV setting)
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run seed` - Seed database with sample data
- `npm run seed:reset` - Reset and seed database
- `npm run seed:comprehensive` - Seed with comprehensive data set

## Cross-Platform Compatibility

The `npm run dev` command now works directly on Windows CMD, PowerShell, and WSL/Linux without requiring cross-env. Next.js automatically handles the environment setup.

If you need to explicitly set NODE_ENV, you can use `npm run dev:cross` which uses the cross-env package.

## Tips

1. **Performance:** If you're experiencing slow performance in WSL, consider:
   - Moving the project to the WSL filesystem (`~/projects/weatherProof`)
   - Using PowerShell or CMD instead
   - Enabling Turbopack with `npm run dev:turbo`

2. **Browser:** The dev server automatically opens in your default browser. The app works best in Chrome, Edge, or Firefox.

3. **Database:** Make sure your Supabase instance is running. Check the Supabase dashboard if you encounter connection issues.