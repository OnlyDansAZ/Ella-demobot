// Basic Express server for testing authentication and API functionality
// Run with: node basic-server.js

import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);
const app = express();
const PORT = process.env.PORT || 5000;

// Get the directory name using ES modules approach
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session setup
const sessionSettings = {
  secret: 'ella-ai-secret-key',
  resave: false,
  saveUninitialized: false,
  store: new MemoryStore({
    checkPeriod: 86400000 // 24 hours
  }),
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    secure: false,
  }
};

app.use(session(sessionSettings));
app.use(passport.initialize());
app.use(passport.session());

// In-memory user storage for testing
const users = [
  {
    id: 1,
    username: 'admin',
    // This is 'admin123' hashed
    password: 'c7ad44cbad762a5da0a452f9e854fdc1e0e7a52a38015f23f3eab1d80b931dd472634dfac71cd34ebc35d16ab7fb8a90c81f975113d6c7538dc69dd8de9077ec.d3eb9a9e33e7ca48259c5f5dae154a9d',
  }
];

// Password utilities
const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64));
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64));
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Configure passport
passport.use(
  new LocalStrategy(async (username, password, done) => {
    const user = users.find(u => u.username === username);
    if (!user || !(await comparePasswords(password, user.password))) {
      return done(null, false);
    } else {
      return done(null, user);
    }
  }),
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  const user = users.find(u => u.id === id);
  done(null, user);
});

// Auth routes
app.post("/api/register", async (req, res, next) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }
    
    const existingUser = users.find(u => u.username === username);
    if (existingUser) {
      return res.status(400).json({ error: "Username already exists" });
    }

    const hashedPassword = await hashPassword(password);
    const newUser = {
      id: users.length + 1,
      username,
      password: hashedPassword
    };
    
    users.push(newUser);

    req.login(newUser, (err) => {
      if (err) return next(err);
      // Don't send the password in the response
      const { password, ...userWithoutPassword } = newUser;
      res.status(201).json(userWithoutPassword);
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: "Registration failed" });
  }
});

app.post("/api/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    
    req.login(user, (loginErr) => {
      if (loginErr) return next(loginErr);
      // Don't send the password in the response
      const { password, ...userWithoutPassword } = user;
      return res.status(200).json(userWithoutPassword);
    });
  })(req, res, next);
});

app.post("/api/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.sendStatus(200);
  });
});

app.get("/api/user", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  // Don't send the password in the response
  const { password, ...userWithoutPassword } = req.user;
  res.json(userWithoutPassword);
});

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", message: "YoBot Auth API is running" });
});

// Simple HTML for testing the auth API
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Ella AI Auth Test</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #333; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; }
        input { padding: 8px; width: 300px; }
        button { padding: 8px 15px; background: #4CAF50; color: white; border: none; cursor: pointer; }
        button:hover { background: #45a049; }
        pre { background: #f4f4f4; padding: 10px; border-radius: 4px; overflow: auto; }
      </style>
    </head>
    <body>
      <h1>Ella AI Auth Testing</h1>
      
      <div id="auth-status">Checking authentication status...</div>
      
      <div id="login-section">
        <h2>Login</h2>
        <div class="form-group">
          <label for="login-username">Username</label>
          <input type="text" id="login-username" value="admin">
        </div>
        <div class="form-group">
          <label for="login-password">Password</label>
          <input type="password" id="login-password" value="admin123">
        </div>
        <button id="login-button">Login</button>
      </div>
      
      <div id="register-section">
        <h2>Register</h2>
        <div class="form-group">
          <label for="register-username">Username</label>
          <input type="text" id="register-username">
        </div>
        <div class="form-group">
          <label for="register-password">Password</label>
          <input type="password" id="register-password">
        </div>
        <button id="register-button">Register</button>
      </div>
      
      <div id="logout-section" style="display: none;">
        <h2>User Actions</h2>
        <button id="logout-button">Logout</button>
      </div>
      
      <h3>API Response</h3>
      <pre id="response"></pre>
      
      <script>
        // Check if user is logged in
        async function checkAuthStatus() {
          try {
            const response = await fetch('/api/user');
            
            if (response.ok) {
              const user = await response.json();
              document.getElementById('auth-status').innerHTML = 
                \`<div style="color:green">Logged in as: <strong>\${user.username}</strong></div>\`;
              document.getElementById('login-section').style.display = 'none';
              document.getElementById('register-section').style.display = 'none';
              document.getElementById('logout-section').style.display = 'block';
            } else {
              document.getElementById('auth-status').innerHTML = 
                '<div style="color:red">Not logged in</div>';
              document.getElementById('login-section').style.display = 'block';
              document.getElementById('register-section').style.display = 'block';
              document.getElementById('logout-section').style.display = 'none';
            }
          } catch (error) {
            document.getElementById('auth-status').innerHTML = 
              \`<div style="color:red">Error checking auth status: \${error.message}</div>\`;
          }
        }
        
        // Handle login
        document.getElementById('login-button').addEventListener('click', async () => {
          const username = document.getElementById('login-username').value;
          const password = document.getElementById('login-password').value;
          
          try {
            const response = await fetch('/api/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            document.getElementById('response').textContent = JSON.stringify(data, null, 2);
            
            if (response.ok) {
              checkAuthStatus();
            }
          } catch (error) {
            document.getElementById('response').textContent = \`Error: \${error.message}\`;
          }
        });
        
        // Handle register
        document.getElementById('register-button').addEventListener('click', async () => {
          const username = document.getElementById('register-username').value;
          const password = document.getElementById('register-password').value;
          
          try {
            const response = await fetch('/api/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            document.getElementById('response').textContent = JSON.stringify(data, null, 2);
            
            if (response.ok) {
              checkAuthStatus();
            }
          } catch (error) {
            document.getElementById('response').textContent = \`Error: \${error.message}\`;
          }
        });
        
        // Handle logout
        document.getElementById('logout-button').addEventListener('click', async () => {
          try {
            const response = await fetch('/api/logout', {
              method: 'POST'
            });
            
            document.getElementById('response').textContent = 
              response.ok ? 'Logout successful' : 'Logout failed';
            
            checkAuthStatus();
          } catch (error) {
            document.getElementById('response').textContent = \`Error: \${error.message}\`;
          }
        });
        
        // Check status when page loads
        checkAuthStatus();
      </script>
    </body>
    </html>
  `);
});

// Start the server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Auth test server running at http://0.0.0.0:${PORT}`);
});

// Handle termination signals
process.on('SIGINT', () => {
  console.log('Shutting down server gracefully...');
  server.close(() => {
    console.log('Server terminated');
    process.exit(0);
  });
});