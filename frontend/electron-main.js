const { app, BrowserWindow } = require('electron')
const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')

let mainWindow = null
let backendProcess = null

// Backend is always at the original project location (venv not bundled to avoid codesign issues)
// This works for both dev mode and packaged .app on the same machine
const ORIGINAL_BACKEND_DIR = '/Users/growth_jhey/Desktop/Vibe_coding/img_to_svg/backend'

const BACKEND_DIR = ORIGINAL_BACKEND_DIR
const UVICORN_BIN = path.join(BACKEND_DIR, 'venv', 'bin', 'uvicorn')

function startBackend() {
  console.log('Starting Python backend...')
  console.log('Backend dir:', BACKEND_DIR)
  console.log('Uvicorn bin:', UVICORN_BIN)

  backendProcess = spawn(UVICORN_BIN, ['main:app', '--host', '127.0.0.1', '--port', '8000'], {
    cwd: BACKEND_DIR,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env },
  })

  backendProcess.stdout.on('data', (data) => {
    console.log('[backend]', data.toString().trim())
  })

  backendProcess.stderr.on('data', (data) => {
    console.error('[backend error]', data.toString().trim())
  })

  backendProcess.on('error', (err) => {
    console.error('Failed to start backend:', err)
  })

  backendProcess.on('exit', (code) => {
    console.log(`Backend exited with code ${code}`)
    backendProcess = null
  })
}

function stopBackend() {
  if (backendProcess) {
    console.log('Stopping backend...')
    backendProcess.kill('SIGTERM')
    backendProcess = null
  }
}

function waitForBackend(url, retries, delay) {
  return new Promise((resolve, reject) => {
    const http = require('http')
    let attempts = 0

    function attempt() {
      attempts++
      http.get(url, (res) => {
        if (res.statusCode === 200) {
          resolve()
        } else {
          retry()
        }
      }).on('error', () => {
        retry()
      })
    }

    function retry() {
      if (attempts >= retries) {
        reject(new Error(`Backend did not start after ${retries} attempts`))
      } else {
        setTimeout(attempt, delay)
      }
    }

    attempt()
  })
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: 'Image to SVG Converter',
  })

  const distIndexPath = path.join(__dirname, 'dist', 'index.html')

  if (fs.existsSync(distIndexPath)) {
    mainWindow.loadFile(distIndexPath)
  } else {
    mainWindow.loadURL('http://localhost:3000')
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(async () => {
  startBackend()

  try {
    await waitForBackend('http://127.0.0.1:8000/health', 30, 500)
    console.log('Backend is ready')
  } catch (err) {
    console.error('Backend startup timeout:', err.message)
  }

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  stopBackend()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  stopBackend()
})
