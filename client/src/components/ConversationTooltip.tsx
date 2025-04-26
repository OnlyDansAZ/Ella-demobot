import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConversationTooltipProps {
  stage: string;
  analysisMode: string;
  visible: boolean;
  onClose: () => void;
}

export function ConversationTooltip(props: ConversationTooltipProps) {
  const { stage, analysisMode, visible, onClose } = props;
  const [isVisible, setIsVisible] = useState(false);
  
  // Handle animation for smooth entrance/exit
  useEffect(() => {
    if (visible) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [visible]);
  
  if (!isVisible) return null;
  
  return (
    <React.Fragment>
      <div className="tooltip-backdrop" onClick={onClose}></div>
      
      <div 
        className={`fixed z-50 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
          max-w-md w-full bg-white rounded-lg shadow-xl border border-primary/10 p-5
          tooltip-entrance transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
      >
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-medium text-slate-800">Conversation Guidance</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 w-7 p-0 rounded-full"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>
        
        <div className="mb-4 p-3 bg-primary/5 rounded-md">
          {getTooltipContent(stage, analysisMode)}
        </div>
        
        <div className="flex justify-end">
          <Button 
            variant="outline" 
            size="sm"
            onClick={onClose}
          >
            Got it
          </Button>
        </div>
      </div>
    </React.Fragment>
  );
}

function getTooltipContent(stage: string, analysisMode: string) {
  // Strategic Introduction
  if (stage === 'introduction' && analysisMode === 'strategic') {
    return (
      <div className="space-y-2">
        <h4 className="font-medium text-slate-900">Strategic Introduction</h4>
        <p className="text-sm text-slate-700">
          Focus on building rapport and establishing credibility. Ask questions to understand 
          the prospect's broader business context and goals rather than immediate pain points.
        </p>
        <ul className="text-sm text-slate-700 space-y-1 list-disc pl-4 pt-1">
          <li>Introduce yourself and your company briefly, then focus on the prospect</li>
          <li>Ask about their strategic priorities and vision</li>
          <li>Listen more, speak less - gather information to personalize later stages</li>
        </ul>
      </div>
    );
  }
  
  // Tactical Introduction
  if (stage === 'introduction' && analysisMode === 'tactical') {
    return (
      <div className="space-y-2">
        <h4 className="font-medium text-slate-900">Tactical Introduction</h4>
        <p className="text-sm text-slate-700">
          Get to the point quickly and establish relevance. Demonstrate you understand 
          their industry and specific challenges to capture interest.
        </p>
        <ul className="text-sm text-slate-700 space-y-1 list-disc pl-4 pt-1">
          <li>Lead with a specific, relevant insight about their industry</li>
          <li>Reference similar clients you've helped with specific results</li>
          <li>Quickly transition to qualifying questions to assess fit</li>
        </ul>
      </div>
    );
  }
  
  // Strategic Discovery
  if (stage === 'discovery' && analysisMode === 'strategic') {
    return (
      <div className="space-y-2">
        <h4 className="font-medium text-slate-900">Strategic Discovery</h4>
        <p className="text-sm text-slate-700">
          Explore broader business goals and long-term challenges. Understand the 
          decision-making process and stakeholders involved.
        </p>
        <ul className="text-sm text-slate-700 space-y-1 list-disc pl-4 pt-1">
          <li>Ask about organizational challenges and strategic initiatives</li>
          <li>Understand their current solution landscape and gaps</li>
          <li>Explore decision criteria and buying process</li>
        </ul>
      </div>
    );
  }
  
  // Tactical Discovery
  if (stage === 'discovery' && analysisMode === 'tactical') {
    return (
      <div className="space-y-2">
        <h4 className="font-medium text-slate-900">Tactical Discovery</h4>
        <p className="text-sm text-slate-700">
          Focus on immediate pain points and specific challenges that your solution can address directly.
          Gather concrete details about current processes.
        </p>
        <ul className="text-sm text-slate-700 space-y-1 list-disc pl-4 pt-1">
          <li>Ask about specific pain points with measurable impact</li>
          <li>Quantify costs of inaction or current inefficiencies</li>
          <li>Get detailed information about current workflows</li>
        </ul>
      </div>
    );
  }
  
  // Strategic Presentation
  if (stage === 'presentation' && analysisMode === 'strategic') {
    return (
      <div className="space-y-2">
        <h4 className="font-medium text-slate-900">Strategic Presentation</h4>
        <p className="text-sm text-slate-700">
          Focus on long-term value and organizational impact. Connect your solution 
          to the prospect's strategic goals and broader business outcomes.
        </p>
        <ul className="text-sm text-slate-700 space-y-1 list-disc pl-4 pt-1">
          <li>Demonstrate understanding of their strategic vision</li>
          <li>Present solution in terms of achieving long-term objectives</li>
          <li>Include case studies with strategic impact metrics</li>
        </ul>
      </div>
    );
  }
  
  // Tactical Presentation
  if (stage === 'presentation' && analysisMode === 'tactical') {
    return (
      <div className="space-y-2">
        <h4 className="font-medium text-slate-900">Tactical Presentation</h4>
        <p className="text-sm text-slate-700">
          Emphasize immediate solutions to specific problems. Focus on features 
          and capabilities that directly address the pain points identified.
        </p>
        <ul className="text-sm text-slate-700 space-y-1 list-disc pl-4 pt-1">
          <li>Highlight specific features that solve identified problems</li>
          <li>Present direct ROI calculations and short-term gains</li>
          <li>Offer a practical implementation timeline</li>
        </ul>
      </div>
    );
  }
  
  // Strategic Objection Handling
  if (stage === 'objection' && analysisMode === 'strategic') {
    return (
      <div className="space-y-2">
        <h4 className="font-medium text-slate-900">Strategic Objection Handling</h4>
        <p className="text-sm text-slate-700">
          Address objections by connecting back to long-term vision and competitive advantage. 
          Focus on strategic risk mitigation and organizational alignment.
        </p>
        <ul className="text-sm text-slate-700 space-y-1 list-disc pl-4 pt-1">
          <li>Acknowledge concerns as valid considerations</li>
          <li>Reframe objections in the context of long-term goals</li>
          <li>Present adoption as a strategic advantage over competitors</li>
        </ul>
      </div>
    );
  }
  
  // Tactical Objection Handling
  if (stage === 'objection' && analysisMode === 'tactical') {
    return (
      <div className="space-y-2">
        <h4 className="font-medium text-slate-900">Tactical Objection Handling</h4>
        <p className="text-sm text-slate-700">
          Address objections with specific counterpoints and evidence. Provide 
          concrete examples and data to overcome concerns directly.
        </p>
        <ul className="text-sm text-slate-700 space-y-1 list-disc pl-4 pt-1">
          <li>Offer specific evidence and data to counter objections</li>
          <li>Provide concrete examples of overcoming similar concerns</li>
          <li>Suggest practical solutions or accommodations</li>
        </ul>
      </div>
    );
  }
  
  // Strategic Closing
  if (stage === 'closing' && analysisMode === 'strategic') {
    return (
      <div className="space-y-2">
        <h4 className="font-medium text-slate-900">Strategic Closing</h4>
        <p className="text-sm text-slate-700">
          Focus on partnership and long-term relationship. Present the decision 
          as an investment in future success and competitive advantage.
        </p>
        <ul className="text-sm text-slate-700 space-y-1 list-disc pl-4 pt-1">
          <li>Summarize alignment with strategic objectives</li>
          <li>Present implementation as a partnership journey</li>
          <li>Suggest a phased approach with long-term roadmap</li>
        </ul>
      </div>
    );
  }
  
  // Tactical Closing
  if (stage === 'closing' && analysisMode === 'tactical') {
    return (
      <div className="space-y-2">
        <h4 className="font-medium text-slate-900">Tactical Closing</h4>
        <p className="text-sm text-slate-700">
          Be direct about next steps and create urgency. Focus on immediate 
          benefits and quick wins from making a decision now.
        </p>
        <ul className="text-sm text-slate-700 space-y-1 list-disc pl-4 pt-1">
          <li>Present a clear, specific next action</li>
          <li>Create urgency with time-limited incentives</li>
          <li>Focus on quick implementation and immediate results</li>
        </ul>
      </div>
    );
  }
  
  // Default message
  return (
    <div className="space-y-2">
      <h4 className="font-medium text-slate-900">Sales Conversation Tips</h4>
      <p className="text-sm text-slate-700">
        Adapt your approach based on the current conversation stage and your strategic goals.
        Use the stage indicators and analysis mode toggles to guide your conversation flow.
      </p>
    </div>
  );
}