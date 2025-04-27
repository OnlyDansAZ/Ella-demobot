import React, { useState } from 'react';

const TestSpeech: React.FC = () => {
  const [text, setText] = useState('Hello, this is a test of the speech synthesis API.');
  
  const speak = () => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser');
      return;
    }
    
    // Create a new utterance
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Speak
    window.speechSynthesis.speak(utterance);
  };
  
  return (
    <div className="p-6 max-w-lg mx-auto bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Speech Synthesis Test</h2>
      
      <div className="mb-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded h-24"
        />
      </div>
      
      <button
        onClick={speak}
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
      >
        Speak Text
      </button>
    </div>
  );
};

export default TestSpeech;