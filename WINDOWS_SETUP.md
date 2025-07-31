# Windows Development Setup

## Quick Start (PowerShell/CMD)

If `npm run dev` doesn't work, try these alternatives:

### Option 1: Use NPX (Recommended)
```powershell
npm run dev
```
This now uses `npx` which should work on all Windows systems.

### Option 2: Direct Node Command
```powershell
node node_modules\next\dist\bin\next dev
```

### Option 3: Use the .cmd Scripts
```powershell
.\dev.cmd      # Start development server
.\build.cmd    # Build for production
```

## Troubleshooting

### If "next is not recognized" error:

1. **Check Node.js installation:**
   ```powershell
   node --version
   npm --version
   ```
   Should show v20.0.0 or higher for Node.

2. **Reinstall dependencies:**
   ```powershell
   Remove-Item -Recurse -Force node_modules
   Remove-Item package-lock.json
   npm install
   ```

3. **Check PATH environment variable:**
   ```powershell
   echo $env:PATH
   ```
   Make sure it includes npm and node paths.

4. **Use Node Version Manager for Windows (nvm-windows):**
   - Download from: https://github.com/coreybutler/nvm-windows
   - Install Node 22.17.1:
     ```powershell
     nvm install 22.17.1
     nvm use 22.17.1
     ```

### Alternative: Use WSL2

If you continue having issues with PowerShell:

1. Open WSL terminal
2. Navigate to project:
   ```bash
   cd /mnt/c/Users/Big\ Daddy\ Pyatt/CascadeProjects/weatherProof
   ```
3. Run normally:
   ```bash
   npm run dev
   ```

## Verified Working Commands

These scripts in package.json use `npx` for better Windows compatibility:
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run linter

## Environment Variables

The .env file is already set up. Next.js automatically loads it.

## Port Issues

If port 3000 is in use:
```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual number)
taskkill /PID [PID] /F
```

## Success Indicators

When running properly, you should see:
```
ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

Then open http://localhost:3000 in your browser.