// This is a special script that will kill any existing vite servers and run our custom server
import { spawn, execSync } from 'child_process';
import http from 'http';

// Try to kill any existing vite servers
try {
  console.log('Attempting to kill any existing Vite processes...');
  execSync('pkill -f vite || true');
  console.log('Done');
} catch (error) {
  console.log('Note: No Vite processes found or unable to kill them');
}

// Give the system a moment to release the port
setTimeout(() => {
  // Test if port 5000 is available
  const testServer = http.createServer();
  testServer.once('error', (err) => {
    console.error('Port 5000 is still in use, trying to force it closed...');
    // Try harder to kill whatever is using the port
    try {
      execSync('fuser -k 5000/tcp || true');
      console.log('Force killed processes using port 5000');
      
      // Start our server
      console.log('Starting our custom server...');
      const serverProcess = spawn('node', ['vite-on-5000.js'], {
        stdio: 'inherit'
      });
    } catch (error) {
      console.error('Failed to start server:', error);
    }
  });
  
  testServer.once('listening', () => {
    // Port is available, close the test server and start our actual server
    testServer.close(() => {
      console.log('Port 5000 is available, starting our server...');
      const serverProcess = spawn('node', ['vite-on-5000.js'], {
        stdio: 'inherit'
      });
    });
  });
  
  // Try to listen on port 5000 to see if it's available
  testServer.listen(5000);
}, 1000);
