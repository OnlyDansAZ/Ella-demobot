/**
 * Test script for memory modes
 * This script tests both stateless and persistent memory modes
 */

import { personaManager } from '../server/personaManager';
import { conversationStorage, ChatMessage } from '../server/conversationStorage';

async function testMemoryModes() {
  // Create unique session IDs for testing
  const statelessSessionId = `test_stateless_${Date.now()}`;
  const persistentSessionId = `test_persistent_${Date.now()}`;
  
  console.log('Testing Memory Modes...');
  console.log('--------------------------');
  console.log(`Stateless Session ID: ${statelessSessionId}`);
  console.log(`Persistent Session ID: ${persistentSessionId}`);
  console.log('--------------------------');

  try {
    // 1. Set up different personas for each session
    // Use 'sales' for stateless (should reset after use)
    // Use 'default' for persistent (should keep memory)
    console.log('\nStep 1: Setting up test personas...');
    
    personaManager.setSessionPersona(statelessSessionId, 'sales');
    personaManager.setSessionPersona(persistentSessionId, 'default');
    
    // Verify personas are set correctly
    const statelessPersona = personaManager.getSessionPersona(statelessSessionId);
    const persistentPersona = personaManager.getSessionPersona(persistentSessionId);
    
    console.log(`Stateless persona: ${statelessPersona.name} (Memory mode: ${statelessPersona.memoryMode})`);
    console.log(`Persistent persona: ${persistentPersona.name} (Memory mode: ${persistentPersona.memoryMode})`);
    
    if (statelessPersona.memoryMode !== 'stateless') {
      throw new Error(`Expected 'stateless' memory mode, got '${statelessPersona.memoryMode}'`);
    }
    
    if (persistentPersona.memoryMode !== 'persistent') {
      throw new Error(`Expected 'persistent' memory mode, got '${persistentPersona.memoryMode}'`);
    }
    
    // 2. Add messages to both sessions
    console.log('\nStep 2: Adding messages to both sessions...');
    
    // Create test messages
    const message1: ChatMessage = {
      id: `msg1_${Date.now()}`,
      content: 'Hello, this is a test message',
      isUser: true,
      timestamp: new Date().toISOString()
    };
    
    const message2: ChatMessage = {
      id: `msg2_${Date.now()}`,
      content: 'This is a response from the AI',
      isUser: false,
      timestamp: new Date().toISOString()
    };
    
    // Add messages to both sessions
    await conversationStorage.addMessage(statelessSessionId, message1);
    await conversationStorage.addMessage(statelessSessionId, message2);
    await conversationStorage.addMessage(persistentSessionId, message1);
    await conversationStorage.addMessage(persistentSessionId, message2);
    
    // Verify messages were added
    const statelessSession = await conversationStorage.getOrCreateSession(statelessSessionId);
    const persistentSession = await conversationStorage.getOrCreateSession(persistentSessionId);
    
    console.log(`Added ${statelessSession.messages.length} messages to stateless session`);
    console.log(`Added ${persistentSession.messages.length} messages to persistent session`);
    
    // 3. Get messages from both sessions - stateless should return empty array
    console.log('\nStep 3: Retrieving messages from both sessions...');
    
    const statelessMessages = await conversationStorage.getMessages(statelessSessionId);
    const persistentMessages = await conversationStorage.getMessages(persistentSessionId);
    
    console.log(`Retrieved ${statelessMessages.length} messages from stateless session (should be 0)`);
    console.log(`Retrieved ${persistentMessages.length} messages from persistent session (should be 2)`);
    
    // Verify expected results
    if (statelessMessages.length !== 0) {
      console.warn(`WARNING: Expected 0 messages from stateless session, got ${statelessMessages.length}`);
    } else {
      console.log('✓ Success! Stateless session correctly returned no message history.');
    }
    
    if (persistentMessages.length !== 2) {
      console.warn(`WARNING: Expected 2 messages from persistent session, got ${persistentMessages.length}`);
    } else {
      console.log('✓ Success! Persistent session correctly maintained message history.');
    }
    
    // 4. Reset both sessions and check again
    console.log('\nStep 4: Simulating call end by resetting both sessions...');
    
    await conversationStorage.resetStatelessSession(statelessSessionId);
    await conversationStorage.resetStatelessSession(persistentSessionId);
    
    // Check internal message storage directly after reset
    const statelessSessionAfterReset = await conversationStorage.getOrCreateSession(statelessSessionId);
    const persistentSessionAfterReset = await conversationStorage.getOrCreateSession(persistentSessionId);
    
    console.log(`After reset, stateless session has ${statelessSessionAfterReset.messages.length} messages in storage (should be 0)`);
    console.log(`After reset, persistent session has ${persistentSessionAfterReset.messages.length} messages in storage (should be 2)`);
    
    // Check messages via getMessages (which applies memory mode)
    const statelessMessagesAfterReset = await conversationStorage.getMessages(statelessSessionId);
    const persistentMessagesAfterReset = await conversationStorage.getMessages(persistentSessionId);
    
    console.log(`After reset, getMessages returns ${statelessMessagesAfterReset.length} messages from stateless session (should be 0)`);
    console.log(`After reset, getMessages returns ${persistentMessagesAfterReset.length} messages from persistent session (should be 2)`);
    
    // Verify final results
    if (statelessSessionAfterReset.messages.length === 0) {
      console.log('✓ Success! Stateless session memory was wiped on reset.');
    } else {
      console.warn(`WARNING: Expected 0 messages in stateless storage after reset, found ${statelessSessionAfterReset.messages.length}`);
    }
    
    if (persistentSessionAfterReset.messages.length === 2) {
      console.log('✓ Success! Persistent session memory was preserved after reset.');
    } else {
      console.warn(`WARNING: Expected 2 messages in persistent storage after reset, found ${persistentSessionAfterReset.messages.length}`);
    }
    
    console.log('\n--------------------------');
    console.log('Memory mode tests completed!\n');
    
  } catch (error) {
    console.error('Error during memory mode test:', error);
  }
}

// Run the tests
testMemoryModes();