// Simple test script to verify the authentication system
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import crypto from 'crypto';
import util from 'util';
import cookieParser from 'cookie-parser';
import createMemoryStore from 'memorystore';

const MemoryStore = createMemoryStore(session);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// In-memory user store for testing
const users = new Map();
let nextId = 1;

// Helper functions for password hashing
const scryptAsync = util.promisify(crypto.scrypt);

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split('.');
  const hashedBuf = Buffer.from(hashed, 'hex');
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  return crypto.timingSafeEqual(hashedBuf, suppliedBuf);
}

// Session setup
app.use(session({
  secret: 'test-auth-secret',
  resave: false,
  saveUninitialized: false,
  store: new MemoryStore({
    checkPeriod: 86400000 // 24 hours
  }),
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// Passport configuration
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      // Find user by username
      const user = Array.from(users.values()).find(
        (u) => u.username === username
      );
      
      if (!user || !(await comparePasswords(password, user.password))) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    } catch (error) {
      return done(error);
    }
  })
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = users.get(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

// Authentication routes
app.post('/api/register', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    // Check if username already exists
    const existingUser = Array.from(users.values()).find(
      (u) => u.username === username
    );
    
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    // Create new user
    const id = nextId++;
    const hashedPassword = await hashPassword(password);
    const user = { id, username, password: hashedPassword };
    users.set(id, user);
    
    // Log in the user
    req.login(user, (err) => {
      if (err) return next(err);
      res.status(201).json({ id: user.id, username: user.username });
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    
    req.login(user, (loginErr) => {
      if (loginErr) return next(loginErr);
      return res.status(200).json({ id: user.id, username: user.username });
    });
  })(req, res, next);
});

app.post('/api/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.sendStatus(200);
  });
});

app.get('/api/user', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json({ id: req.user.id, username: req.user.username });
});

// Create default admin user
async function createDefaultAdmin() {
  const adminUser = Array.from(users.values()).find(
    (u) => u.username === 'admin'
  );
  
  if (!adminUser) {
    console.log('Creating default admin user...');
    const id = nextId++;
    const hashedPassword = await hashPassword('admin123');
    const user = { id, username: 'admin', password: hashedPassword };
    users.set(id, user);
    console.log('Default admin user created');
  }
}

// Create some test HTML for the auth page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Auth Test</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .card { border: 1px solid #ccc; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
        input, button { padding: 8px; margin: 5px 0; }
        button { background: #4285f4; color: white; border: none; border-radius: 4px; cursor: pointer; }
        .error { color: red; margin: 10px 0; }
        .success { color: green; margin: 10px 0; }
        .tabs { display: flex; margin-bottom: 10px; }
        .tab { padding: 10px 20px; cursor: pointer; border-bottom: 2px solid transparent; }
        .tab.active { border-bottom: 2px solid #4285f4; }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
      </style>
    </head>
    <body>
      <h1>Auth Test Page</h1>
      <div id="userInfo" class="card" style="display: none;">
        <h2>Welcome <span id="username"></span>!</h2>
        <p>You are logged in as admin.</p>
        <button id="logoutBtn">Logout</button>
      </div>
      
      <div id="authCard" class="card">
        <div class="tabs">
          <div class="tab active" data-tab="login">Login</div>
          <div class="tab" data-tab="register">Register</div>
        </div>
        
        <div id="login" class="tab-content active">
          <h2>Login</h2>
          <div id="loginError" class="error" style="display: none;"></div>
          <form id="loginForm">
            <div>
              <label for="loginUsername">Username:</label>
              <input type="text" id="loginUsername" name="username" required>
            </div>
            <div>
              <label for="loginPassword">Password:</label>
              <input type="password" id="loginPassword" name="password" required>
            </div>
            <button type="submit">Login</button>
          </form>
        </div>
        
        <div id="register" class="tab-content">
          <h2>Register</h2>
          <div id="registerError" class="error" style="display: none;"></div>
          <div id="registerSuccess" class="success" style="display: none;"></div>
          <form id="registerForm">
            <div>
              <label for="registerUsername">Username:</label>
              <input type="text" id="registerUsername" name="username" required>
            </div>
            <div>
              <label for="registerPassword">Password:</label>
              <input type="password" id="registerPassword" name="password" required>
            </div>
            <button type="submit">Register</button>
          </form>
        </div>
      </div>
      
      <script>
        // Check if user is already logged in
        async function checkAuth() {
          try {
            const response = await fetch('/api/user');
            if (response.ok) {
              const user = await response.json();
              document.getElementById('username').textContent = user.username;
              document.getElementById('userInfo').style.display = 'block';
              document.getElementById('authCard').style.display = 'none';
            }
          } catch (error) {
            console.error('Auth check failed:', error);
          }
        }
        
        // Login form submission
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          const username = document.getElementById('loginUsername').value;
          const password = document.getElementById('loginPassword').value;
          
          try {
            const response = await fetch('/api/login', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ username, password })
            });
            
            if (response.ok) {
              const user = await response.json();
              document.getElementById('username').textContent = user.username;
              document.getElementById('userInfo').style.display = 'block';
              document.getElementById('authCard').style.display = 'none';
              document.getElementById('loginError').style.display = 'none';
            } else {
              const error = await response.json();
              document.getElementById('loginError').textContent = error.error || 'Login failed';
              document.getElementById('loginError').style.display = 'block';
            }
          } catch (error) {
            document.getElementById('loginError').textContent = 'Login request failed';
            document.getElementById('loginError').style.display = 'block';
          }
        });
        
        // Register form submission
        document.getElementById('registerForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          const username = document.getElementById('registerUsername').value;
          const password = document.getElementById('registerPassword').value;
          
          try {
            const response = await fetch('/api/register', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ username, password })
            });
            
            if (response.ok) {
              const user = await response.json();
              document.getElementById('registerSuccess').textContent = 'Registration successful! You can now log in.';
              document.getElementById('registerSuccess').style.display = 'block';
              document.getElementById('registerError').style.display = 'none';
              document.getElementById('registerForm').reset();
              
              // Switch to login tab
              showTab('login');
            } else {
              const error = await response.json();
              document.getElementById('registerError').textContent = error.error || 'Registration failed';
              document.getElementById('registerError').style.display = 'block';
              document.getElementById('registerSuccess').style.display = 'none';
            }
          } catch (error) {
            document.getElementById('registerError').textContent = 'Registration request failed';
            document.getElementById('registerError').style.display = 'block';
            document.getElementById('registerSuccess').style.display = 'none';
          }
        });
        
        // Logout button
        document.getElementById('logoutBtn').addEventListener('click', async () => {
          try {
            await fetch('/api/logout', { method: 'POST' });
            document.getElementById('userInfo').style.display = 'none';
            document.getElementById('authCard').style.display = 'block';
          } catch (error) {
            console.error('Logout failed:', error);
          }
        });
        
        // Tab switching
        function showTab(tabId) {
          document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
          });
          document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
          });
          
          document.querySelector('.tab[data-tab="' + tabId + '"]').classList.add('active');
          document.getElementById(tabId).classList.add('active');
        }
        
        document.querySelectorAll('.tab').forEach(tab => {
          tab.addEventListener('click', () => {
            showTab(tab.getAttribute('data-tab'));
          });
        });
        
        // Check authentication on page load
        checkAuth();
      </script>
    </body>
    </html>
  `);
});

// Start the server
const PORT = 5000;
app.listen(PORT, '0.0.0.0', async () => {
  await createDefaultAdmin();
  console.log(`Auth test server running on port ${PORT}`);
  console.log(`Default admin credentials: username=admin, password=admin123`);
});