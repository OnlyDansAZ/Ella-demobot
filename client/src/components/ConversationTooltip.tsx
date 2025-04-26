import React, { useEffect, useState } from 'react';
import { X, Copy, Check, Mail, Brain, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ConversationTooltipProps {
  stage: string;
  analysisMode: string;
  visible: boolean;
  onClose: () => void;
}

export function ConversationTooltip(props: ConversationTooltipProps) {
  const { stage, analysisMode, visible, onClose } = props;
  const [isVisible, setIsVisible] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showPsychology, setShowPsychology] = useState(false);
  const { toast } = useToast();
  
  // Handle animation for smooth entrance/exit
  useEffect(() => {
    if (visible) {
      setIsVisible(true);
      setIsCopied(false); // Reset copy state when tooltip appears
    } else {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [visible]);
  
  // Function to get plain text content from the tooltip
  const getPlainTextContent = () => {
    let title = getStageName(stage) + " - " + (analysisMode === 'strategic' ? 'Strategic Approach' : 'Tactical Approach');
    let content = getTooltipText(stage, analysisMode);
    return `${title}\n\n${content}`;
  };
  
  // Handle copy to clipboard
  const handleCopy = () => {
    const text = getPlainTextContent();
    navigator.clipboard.writeText(text)
      .then(() => {
        setIsCopied(true);
        toast({
          title: "Copied to clipboard",
          description: "Guidance tips have been copied to your clipboard",
        });
        
        // Reset the copied state after 2 seconds
        setTimeout(() => {
          setIsCopied(false);
        }, 2000);
      })
      .catch(err => {
        toast({
          title: "Failed to copy",
          description: "Could not copy to clipboard. Please try again.",
          variant: "destructive"
        });
      });
  };
  
  if (!isVisible) return null;
  
  return (
    <>
      <div className="tooltip-backdrop" onClick={onClose}></div>
      
      <div 
        className={`fixed z-50 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
          max-w-md w-full bg-white rounded-lg shadow-xl border border-primary/10 p-5
          tooltip-entrance transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
      >
        {!showPsychology ? (
          // Standard tooltip content view
          <>
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
            
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 mb-4 text-primary hover:text-primary/80 group w-full justify-center border border-dashed border-primary/20 hover:border-primary/40 py-2"
              onClick={() => setShowPsychology(true)}
            >
              <Brain className="h-4 w-4 group-hover:animate-pulse" />
              <span>Why this approach works (Sales Psychology)</span>
            </Button>

            <div className="flex items-center gap-2 mb-4 pt-2 border-t">
              <span className="text-sm text-muted-foreground mr-auto">Find this useful?</span>
              <Button 
                variant="outline" 
                size="sm"
                className="gap-1.5"
                onClick={handleCopy}
              >
                {isCopied ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy to clipboard</span>
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  const subject = `Sales Tips: ${getStageName(stage)} - ${analysisMode === 'strategic' ? 'Strategic' : 'Tactical'} Approach`;
                  const body = encodeURIComponent(getTooltipText(stage, analysisMode));
                  window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${body}`, '_blank');
                  toast({
                    title: "Email client opened",
                    description: "Tips have been prepared for sending via email",
                  });
                }}
              >
                <Mail className="h-3.5 w-3.5" />
                <span>Email tips</span>
              </Button>
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
          </>
        ) : (
          // Psychology explanation view
          <>
            <div className="flex justify-between items-start mb-3">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-primary"
                onClick={() => setShowPsychology(false)}
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to tips</span>
              </Button>
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
            
            <div className="mb-4">
              <h3 className="text-lg font-medium text-slate-800 mb-2">
                <span className="text-primary">Why This Approach Works</span>
              </h3>
              <div className="text-sm text-slate-700 space-y-4 p-3 bg-primary/5 rounded-md">
                {getPsychologyExplanation(stage, analysisMode)}
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowPsychology(false)}
              >
                Return to tips
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

// Helper functions
function getStageName(stage: string): string {
  switch(stage) {
    case 'introduction': return 'Introduction';
    case 'discovery': return 'Discovery';
    case 'presentation': return 'Presentation';
    case 'objection': return 'Objection Handling';
    case 'closing': return 'Closing';
    default: return 'Conversation Guidance';
  }
}

// Convert tooltip content to plain text
function getTooltipText(stage: string, analysisMode: string): string {
  // Introduction
  if (stage === 'introduction' && analysisMode === 'strategic') {
    return `Focus on building rapport and establishing credibility. Ask questions to understand the prospect's broader business context and goals rather than immediate pain points.

Key tips:
• Introduce yourself and your company briefly, then focus on the prospect
• Ask about their strategic priorities and vision
• Listen more, speak less - gather information to personalize later stages`;
  }
  
  if (stage === 'introduction' && analysisMode === 'tactical') {
    return `Get to the point quickly and establish relevance. Demonstrate you understand their industry and specific challenges to capture interest.

Key tips:
• Lead with a specific, relevant insight about their industry
• Reference similar clients you've helped with specific results
• Quickly transition to qualifying questions to assess fit`;
  }
  
  // Discovery
  if (stage === 'discovery' && analysisMode === 'strategic') {
    return `Explore broader business goals and long-term challenges. Understand the decision-making process and stakeholders involved.

Key tips:
• Ask about organizational challenges and strategic initiatives
• Understand their current solution landscape and gaps
• Explore decision criteria and buying process`;
  }
  
  if (stage === 'discovery' && analysisMode === 'tactical') {
    return `Focus on immediate pain points and specific challenges that your solution can address directly. Gather concrete details about current processes.

Key tips:
• Ask about specific pain points with measurable impact
• Quantify costs of inaction or current inefficiencies
• Get detailed information about current workflows`;
  }
  
  // Presentation
  if (stage === 'presentation' && analysisMode === 'strategic') {
    return `Focus on long-term value and organizational impact. Connect your solution to the prospect's strategic goals and broader business outcomes.

Key tips:
• Demonstrate understanding of their strategic vision
• Present solution in terms of achieving long-term objectives
• Include case studies with strategic impact metrics`;
  }
  
  if (stage === 'presentation' && analysisMode === 'tactical') {
    return `Emphasize immediate solutions to specific problems. Focus on features and capabilities that directly address the pain points identified.

Key tips:
• Highlight specific features that solve identified problems
• Present direct ROI calculations and short-term gains
• Offer a practical implementation timeline`;
  }
  
  // Objection Handling
  if (stage === 'objection' && analysisMode === 'strategic') {
    return `Address objections by connecting back to long-term vision and competitive advantage. Focus on strategic risk mitigation and organizational alignment.

Key tips:
• Acknowledge concerns as valid considerations
• Reframe objections in the context of long-term goals
• Present adoption as a strategic advantage over competitors`;
  }
  
  if (stage === 'objection' && analysisMode === 'tactical') {
    return `Address objections with specific counterpoints and evidence. Provide concrete examples and data to overcome concerns directly.

Key tips:
• Offer specific evidence and data to counter objections
• Provide concrete examples of overcoming similar concerns
• Suggest practical solutions or accommodations`;
  }
  
  // Closing
  if (stage === 'closing' && analysisMode === 'strategic') {
    return `Focus on partnership and long-term relationship. Present the decision as an investment in future success and competitive advantage.

Key tips:
• Summarize alignment with strategic objectives
• Present implementation as a partnership journey
• Suggest a phased approach with long-term roadmap`;
  }
  
  if (stage === 'closing' && analysisMode === 'tactical') {
    return `Be direct about next steps and create urgency. Focus on immediate benefits and quick wins from making a decision now.

Key tips:
• Present a clear, specific next action
• Create urgency with time-limited incentives
• Focus on quick implementation and immediate results`;
  }
  
  // Default
  return `Adapt your approach based on the current conversation stage and your strategic goals. Use the stage indicators and analysis mode toggles to guide your conversation flow.`;
}

// Psychology explanations for each approach
function getPsychologyExplanation(stage: string, analysisMode: string) {
  // Strategic Introduction
  if (stage === 'introduction' && analysisMode === 'strategic') {
    return (
      <>
        <p>
          <strong>The psychology:</strong> The strategic introduction leverages the <em>primacy effect</em> by 
          focusing first on building trust rather than pitching. This creates psychological safety that leads 
          to more openness. 
        </p>
        <p>
          When you focus on the prospect's broader business context, you tap into their need to be understood 
          at a deeper level than just as a sales target. Senior executives respond well to this approach because 
          it mirrors how they think—holistically and strategically.
        </p>
        <p>
          <strong>Key psychological principles:</strong>
        </p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Reciprocity - When you show genuine interest in their goals, they're more likely to reciprocate with interest in your solution</li>
          <li>Authority positioning - Demonstrating strategic understanding positions you as a peer rather than just a vendor</li>
          <li>Active listening demonstrates emotional intelligence, which builds rapport more effectively than talking</li>
        </ul>
      </>
    );
  }
  
  // Tactical Introduction
  if (stage === 'introduction' && analysisMode === 'tactical') {
    return (
      <>
        <p>
          <strong>The psychology:</strong> The tactical introduction leverages the <em>cognitive ease principle</em>—people 
          prefer information that's easy to process. By quickly establishing relevance and showing industry knowledge, 
          you reduce the mental effort needed to evaluate whether the conversation is worth continuing.
        </p>
        <p>
          This approach works particularly well with busy decision-makers and technical evaluators who appreciate 
          efficiency and evidence. It shows respect for their time and creates immediate credibility.
        </p>
        <p>
          <strong>Key psychological principles:</strong>
        </p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Pattern recognition - Industry-specific insights trigger recognition that you understand their world</li>
          <li>Social proof - Referencing similar clients taps into the power of "others like me" thinking</li>
          <li>Selective attention - People pay more attention when they hear information directly relevant to their situation</li>
        </ul>
      </>
    );
  }
  
  // Strategic Discovery
  if (stage === 'discovery' && analysisMode === 'strategic') {
    return (
      <>
        <p>
          <strong>The psychology:</strong> Strategic discovery taps into the <em>status principle</em> by focusing 
          on higher-level business concerns that executives and decision-makers care about, showing you understand 
          their organizational perspective and priorities.
        </p>
        <p>
          By exploring decision-making processes and stakeholders, you're mapping the psychology of the buying 
          committee, which allows you to identify champions, blockers, and influencers. This creates a psychological 
          advantage when planning your approach.
        </p>
        <p>
          <strong>Key psychological principles:</strong>
        </p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Confirmation bias - When you ask about strategic initiatives, people naturally connect your solution to those priorities</li>
          <li>Endowment effect - Understanding existing solutions helps you position yours not as a replacement but as an enhancement of their prior investments</li>
          <li>Group dynamics - Uncovering the decision process helps you navigate the social psychology of organizational buying</li>
        </ul>
      </>
    );
  }
  
  // Tactical Discovery
  if (stage === 'discovery' && analysisMode === 'tactical') {
    return (
      <>
        <p>
          <strong>The psychology:</strong> Tactical discovery leverages the <em>loss aversion principle</em>—the 
          psychological tendency for people to feel losses more strongly than equivalent gains. By focusing on 
          specific pain points and quantifying costs of inaction, you create urgency.
        </p>
        <p>
          This approach works particularly well with practical problem-solvers and those who need to justify purchase 
          decisions to others. It provides concrete evidence they can use in internal discussions.
        </p>
        <p>
          <strong>Key psychological principles:</strong>
        </p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Pain focus - The brain pays more attention to solving problems than seeking opportunities</li>
          <li>Concrete thinking - Specific details about workflows create clearer mental pictures than abstract concepts</li>
          <li>Quantification effect - Putting numbers to problems makes them seem more real and actionable</li>
        </ul>
      </>
    );
  }
  
  // Strategic Presentation
  if (stage === 'presentation' && analysisMode === 'strategic') {
    return (
      <>
        <p>
          <strong>The psychology:</strong> Strategic presentation uses the <em>construal level theory</em>—when 
          people think about the future, they focus on abstract benefits rather than concrete features. By 
          connecting to long-term goals, you tap into this psychological distance.
        </p>
        <p>
          This approach resonates with visionary leaders and those who make decisions based on strategic fit rather than 
          just specifications. It aligns your solution with their aspirational self-image.
        </p>
        <p>
          <strong>Key psychological principles:</strong>
        </p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Vision alignment - People are more motivated by a compelling vision than by tactical benefits</li>
          <li>Strategic validation - Case studies with impact metrics provide evidence that supports their strategic thinking</li>
          <li>Identity appeal - Framing your solution as part of their strategic identity ("forward-thinking companies like yours") creates deeper resonance</li>
        </ul>
      </>
    );
  }
  
  // Tactical Presentation
  if (stage === 'presentation' && analysisMode === 'tactical') {
    return (
      <>
        <p>
          <strong>The psychology:</strong> Tactical presentation leverages the <em>specificity principle</em>—concrete, 
          specific claims are psychologically more persuasive than generalized benefits. By focusing on features that 
          solve identified problems, you create clear cause-effect connections.
        </p>
        <p>
          This approach appeals to analytical thinkers and practical implementers who need to understand exactly how 
          something works. It reduces perceived risk by showing a clear path to results.
        </p>
        <p>
          <strong>Key psychological principles:</strong>
        </p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Feature-benefit linking - Directly connecting features to specific problems creates stronger mental associations</li>
          <li>ROI focus - Concrete calculations tap into the rational decision-making system</li>
          <li>Implementation clarity - Specific timelines reduce uncertainty, which lowers psychological resistance</li>
        </ul>
      </>
    );
  }
  
  // Strategic Objection Handling
  if (stage === 'objection' && analysisMode === 'strategic') {
    return (
      <>
        <p>
          <strong>The psychology:</strong> Strategic objection handling uses <em>reframing techniques</em> to shift 
          perception from immediate concerns to long-term advantages. This cognitive restructuring helps prospects 
          see objections as less significant within the bigger picture.
        </p>
        <p>
          By connecting back to their vision, you're activating their aspirational thinking which can override 
          immediate objections. This works especially well for strategic decision-makers.
        </p>
        <p>
          <strong>Key psychological principles:</strong>
        </p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Validation before reframing - Acknowledging concerns as valid satisfies the need to be heard and understood</li>
          <li>Goal hierarchy - Connecting to higher-level goals puts smaller concerns in perspective</li>
          <li>Competitive psychology - Framing adoption as a strategic advantage triggers fear of missing out (FOMO)</li>
        </ul>
      </>
    );
  }
  
  // Tactical Objection Handling
  if (stage === 'objection' && analysisMode === 'tactical') {
    return (
      <>
        <p>
          <strong>The psychology:</strong> Tactical objection handling leverages the <em>evidence principle</em>—specific, 
          concrete evidence is more persuasive than general reassurances. By providing data and examples, you reduce 
          the cognitive dissonance that objections create.
        </p>
        <p>
          This approach works well with skeptical prospects and those who need factual validation. It satisfies their 
          need for certainty and proof before moving forward.
        </p>
        <p>
          <strong>Key psychological principles:</strong>
        </p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Confirmation through specificity - Precise data points are psychologically more convincing than general statements</li>
          <li>Counterexample effect - Specific examples of overcoming similar concerns create mental models of success</li>
          <li>Problem-solution pairing - Directly addressing specific concerns with specific solutions creates cognitive closure</li>
        </ul>
      </>
    );
  }
  
  // Strategic Closing
  if (stage === 'closing' && analysisMode === 'strategic') {
    return (
      <>
        <p>
          <strong>The psychology:</strong> Strategic closing uses the <em>commitment and consistency principle</em>—people 
          tend to act in ways that align with their previous statements and values. By summarizing alignment with their 
          strategic objectives, you remind them of the congruence between their goals and your solution.
        </p>
        <p>
          Framing implementation as a partnership activates the psychology of relationship rather than transaction, which 
          is particularly effective with long-term thinkers and relationship-oriented buyers.
        </p>
        <p>
          <strong>Key psychological principles:</strong>
        </p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Future pacing - Visualizing successful implementation triggers anticipation of positive outcomes</li>
          <li>Alignment reinforcement - Reminding them of how the solution connects to their stated objectives strengthens commitment</li>
          <li>Reduced risk perception - A phased approach with a roadmap decreases the psychological magnitude of the decision</li>
        </ul>
      </>
    );
  }
  
  // Tactical Closing
  if (stage === 'closing' && analysisMode === 'tactical') {
    return (
      <>
        <p>
          <strong>The psychology:</strong> Tactical closing leverages the <em>scarcity principle</em> and <em>action bias</em>—people 
          value things more when they might miss out, and they prefer clear, specific actions over ambiguity.
        </p>
        <p>
          This approach works particularly well with decisive prospects and those motivated by immediate results. It reduces 
          decision paralysis by providing a clear, concrete next step.
        </p>
        <p>
          <strong>Key psychological principles:</strong>
        </p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Clarity reduces resistance - A specific next action eliminates confusion about how to proceed</li>
          <li>Time-limited incentives create urgency through loss aversion (fear of missing out)</li>
          <li>Immediate gratification - Emphasizing quick implementation appeals to the psychological desire for fast results</li>
        </ul>
      </>
    );
  }
  
  // Default
  return (
    <p>
      Select a specific conversation stage and analysis mode to see detailed psychological insights behind these sales strategies.
    </p>
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