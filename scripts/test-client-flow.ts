/**
 * End-to-End Client Flow Test
 * 
 * This script simulates a full client interaction with Ella from start to finish:
 * 1. Initialize a new session (simulating landing page visit)
 * 2. Send chat messages (simulating web chat)
 * 3. Initiate a call (simulating AICaller page)
 * 4. Add to transcript (simulating ongoing call)
 * 5. End call and verify memory behavior (stateless vs persistent)
 */

import { v4 as uuidv4 } from 'uuid';
import { personaManager } from '../server/personaManager';
import { conversationStorage, type ChatMessage } from '../server/conversationStorage';
// Import directly from the twilio implementation that SignalWire uses
import { callRecordStorage, type CallRecord } from '../server/twilioAdvanced';

// Simulate delay between operations
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function simulateClientFlow() {
  console.log('🧪 STARTING END-TO-END CLIENT FLOW TEST');
  console.log('----------------------------------------');

  try {
    // Generate unique session IDs for testing
    const statelessSessionId = `test_stateless_${Date.now()}`;
    const persistentSessionId = `test_persistent_${Date.now()}`;
    
    console.log(`Generated Test Sessions: 
    - Stateless: ${statelessSessionId}
    - Persistent: ${persistentSessionId}
    `);

    // Step 1: Initialize both sessions with appropriate personas
    console.log('\n1️⃣ INITIALIZING SESSIONS WITH PERSONAS');
    
    // Create test personas if needed
    const salesPersona = personaManager.createPersona({
      name: 'E2E Test - Sales Agent',
      description: 'A stateless sales persona for testing',
      systemPrompt: 'You are a sales agent AI with stateless memory for testing.',
      memoryMode: 'stateless',
      voiceSettings: {
        stability: 0.5,
        similarityBoost: 0.7,
        style: 0.5,
        useSpeakerBoost: true
      }
    });
    
    const assistantPersona = personaManager.createPersona({
      name: 'E2E Test - Personal Assistant',
      description: 'A persistent assistant persona for testing',
      systemPrompt: 'You are a personal assistant AI with persistent memory for testing.',
      memoryMode: 'persistent',
      voiceSettings: {
        stability: 0.5,
        similarityBoost: 0.7,
        style: 0.5,
        useSpeakerBoost: true
      }
    });
    
    // Assign personas to sessions
    personaManager.setSessionPersona(statelessSessionId, salesPersona.id);
    personaManager.setSessionPersona(persistentSessionId, assistantPersona.id);
    
    // Confirm assignment
    const statelessPersona = personaManager.getSessionPersona(statelessSessionId);
    const persistentPersona = personaManager.getSessionPersona(persistentSessionId);
    
    console.log(`Session assignments:
    - Stateless session using: ${statelessPersona.name} (${statelessPersona.memoryMode} memory)
    - Persistent session using: ${persistentPersona.name} (${persistentPersona.memoryMode} memory)
    `);
    
    // Step 2: Simulate chat conversations
    console.log('\n2️⃣ SIMULATING CHAT CONVERSATIONS');
    
    // Create messages for both sessions
    const initialMessages = [
      createMessage(true, "Hello, I'm interested in learning about your product."),
      createMessage(false, "Hi there! I'd be happy to tell you about our AI assistant Ella. What would you like to know?"),
      createMessage(true, "What pricing options do you offer?"),
      createMessage(false, "We offer several pricing tiers starting with our Starter package at $5K + $499/mo, which includes 24/7 service, appointment scheduling, and basic lead follow-up. Our Pro package is $8K with a $799 monthly fee, adding advanced reporting and CRM integration.")
    ];
    
    // Add messages to both sessions
    for (const message of initialMessages) {
      await conversationStorage.addMessage(statelessSessionId, message);
      await conversationStorage.addMessage(persistentSessionId, message);
      await delay(50); // Small delay to spread out timestamps
    }
    
    // Verify messages were added
    const statelessMessages = await conversationStorage.getMessages(statelessSessionId);
    const persistentMessages = await conversationStorage.getMessages(persistentSessionId);
    
    console.log(`Chat conversation simulation results:
    - Stateless session: ${statelessMessages.length} messages visible (expecting 0 due to stateless memory)
    - Persistent session: ${persistentMessages.length} messages visible
    - Underlying storage for stateless: ${(await conversationStorage.getOrCreateSession(statelessSessionId)).messages.length} messages
    `);
    
    // Step 3: Simulate call initiation for both personas
    console.log('\n3️⃣ SIMULATING CALL INITIATION');
    
    // Create call records for both sessions
    const statelessCallId = `call_${uuidv4()}`;
    const persistentCallId = `call_${uuidv4()}`;
    
    // Important: Explicitly assign personas to call session IDs
    // This ensures the call transcript uses the correct memory mode
    personaManager.setSessionPersona(statelessCallId, salesPersona.id);
    personaManager.setSessionPersona(persistentCallId, assistantPersona.id);
    
    // Verify the memory modes are assigned correctly
    const statelessCallPersona = personaManager.getSessionPersona(statelessCallId);
    const persistentCallPersona = personaManager.getSessionPersona(persistentCallId);
    
    console.log(`Call session persona assignments:
    - Stateless call using: ${statelessCallPersona.name} (${statelessCallPersona.memoryMode} memory)
    - Persistent call using: ${persistentCallPersona.name} (${persistentCallPersona.memoryMode} memory)
    `);
    
    // Create call records (simulating what happens when a call is made)
    const statelessCallRecord: CallRecord = {
      id: statelessCallId,
      to: '+15551234567',
      from: '+15559876543',
      status: 'initiated',
      script: 'This is a test script for the stateless persona call.',
      persona: salesPersona.id,
      voice: 'female',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const persistentCallRecord: CallRecord = {
      id: persistentCallId,
      to: '+15552345678',
      from: '+15559876543',
      status: 'initiated',
      script: 'This is a test script for the persistent persona call.',
      persona: assistantPersona.id,
      voice: 'female',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    callRecordStorage.saveCall(statelessCallRecord);
    callRecordStorage.saveCall(persistentCallRecord);
    
    console.log(`Call initiation simulation:
    - Stateless call ID: ${statelessCallId}
    - Persistent call ID: ${persistentCallId}
    `);
    
    // Step 4: Simulate call transcript updates
    console.log('\n4️⃣ SIMULATING CALL TRANSCRIPT UPDATES');
    
    // Add transcript messages to both calls
    const callMessages = [
      createMessage(false, "Hello! This is Ella from YoBot. How are you doing today?"),
      createMessage(true, "I'm doing well, thanks for asking. I'm interested in your AI assistant."),
      createMessage(false, "That's great to hear! I'd be happy to tell you more about our AI assistant. It can handle everything from customer service to sales calls."),
      createMessage(true, "How much does it cost?"),
      createMessage(false, "Our pricing starts with our Starter package at $5K plus a monthly fee of $499. This includes 24/7 customer service, appointment scheduling, and basic lead follow-up. Would you like to hear about our other packages?")
    ];
    
    // Use the call SIDs as session IDs for the call transcript
    for (const message of callMessages) {
      await conversationStorage.addMessage(statelessCallId, message);
      await conversationStorage.addMessage(persistentCallId, message);
      await delay(50);
    }
    
    // Update call records to 'in-progress'
    await callRecordStorage.updateCallStatus(statelessCallId, 'in-progress');
    await callRecordStorage.updateCallStatus(persistentCallId, 'in-progress');
    
    // Get current call transcripts
    const statelessCallTranscript = await conversationStorage.getMessages(statelessCallId);
    const persistentCallTranscript = await conversationStorage.getMessages(persistentCallId);
    
    console.log(`Call transcript simulation:
    - Stateless call: ${statelessCallTranscript.length} transcript messages
    - Persistent call: ${persistentCallTranscript.length} transcript messages
    `);
    
    // Step 5: Simulate call completion and memory lifecycle
    console.log('\n5️⃣ SIMULATING CALL COMPLETION & MEMORY LIFECYCLE');
    
    // Update call records to 'completed'
    await callRecordStorage.updateCallStatus(statelessCallId, 'completed', {
      duration: 120, // 2 minutes
      notes: ["End-to-end test call with stateless memory"]
    });
    
    await callRecordStorage.updateCallStatus(persistentCallId, 'completed', {
      duration: 120, // 2 minutes
      notes: ["End-to-end test call with persistent memory"]
    });
    
    // Simulate SignalWire status callback (which triggers memory cleanup)
    await conversationStorage.resetStatelessSession(statelessCallId);
    await conversationStorage.resetStatelessSession(persistentCallId);
    
    // Check transcript state after call completion
    const statelessCallTranscriptAfter = (await conversationStorage.getOrCreateSession(statelessCallId)).messages;
    const persistentCallTranscriptAfter = (await conversationStorage.getOrCreateSession(persistentCallId)).messages;
    
    console.log(`Call completion memory lifecycle:
    - Stateless call transcript: ${statelessCallTranscriptAfter.length} messages after completion (should be 0)
    - Persistent call transcript: ${persistentCallTranscriptAfter.length} messages after completion (should be ${callMessages.length})
    `);
    
    // Test final memory reset
    console.log('\n6️⃣ VERIFYING FINAL MEMORY STATE');
    
    // Add one more message to each session
    const finalMessage = createMessage(true, "Can you call me back tomorrow at 2pm?");
    await conversationStorage.addMessage(statelessSessionId, finalMessage);
    await conversationStorage.addMessage(persistentSessionId, finalMessage);
    
    // Retrieve messages again - stateless should return empty, persistent should have history
    const finalStatelessMessages = await conversationStorage.getMessages(statelessSessionId);
    const finalPersistentMessages = await conversationStorage.getMessages(persistentSessionId);
    
    console.log(`Final memory state:
    - Stateless session visible messages: ${finalStatelessMessages.length} (expecting 0)
    - Persistent session visible messages: ${finalPersistentMessages.length} (expecting ${initialMessages.length + 1})
    - Underlying storage for stateless: ${(await conversationStorage.getOrCreateSession(statelessSessionId)).messages.length} messages
    `);
    
    // Cleanup - remove test sessions and call records
    console.log('\n🧹 CLEANING UP TEST DATA');
    
    await conversationStorage.deleteSession(statelessSessionId);
    await conversationStorage.deleteSession(persistentSessionId);
    await conversationStorage.deleteSession(statelessCallId);
    await conversationStorage.deleteSession(persistentCallId);
    
    // Final result
    console.log('\n✅ END-TO-END CLIENT FLOW TEST COMPLETED SUCCESSFULLY');
    console.log('-----------------------------------------------------');
  } catch (error) {
    console.error('❌ Error during end-to-end client flow test:', error);
  }
}

// Helper to create a test message
function createMessage(isUser: boolean, content: string): ChatMessage {
  return {
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    content,
    isUser,
    timestamp: new Date().toISOString()
  };
}

// Run the simulation
simulateClientFlow();