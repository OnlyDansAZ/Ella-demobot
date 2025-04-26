import React, { useState, useEffect } from "react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";

interface ConversationTooltipProps {
  stage: string;
  analysisMode: string;
  visible: boolean;
  onClose: () => void;
}

export function ConversationTooltip({
  stage,
  analysisMode,
  visible,
  onClose,
}: ConversationTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipContent, setTooltipContent] = useState({
    title: "",
    content: "",
    examples: [""],
  });

  useEffect(() => {
    // Delay appearance for subtle effect
    if (visible) {
      const timer = setTimeout(() => setIsVisible(true), 300);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [visible]);

  useEffect(() => {
    // Set content based on stage and analysis mode
    setTooltipContent(getTooltipContent(stage, analysisMode));
  }, [stage, analysisMode]);

  if (!isVisible) return null;

  return (
    <div className="absolute bottom-20 right-4 z-10 animate-fadeIn">
      <HoverCard defaultOpen openDelay={100} closeDelay={100}>
        <HoverCardTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="group rounded-full h-10 w-10 p-0 bg-primary text-primary-foreground shadow-md border-primary-foreground/10"
          >
            <Info className="h-5 w-5" />
            <span className="sr-only">Conversation Guidance</span>
          </Button>
        </HoverCardTrigger>
        <HoverCardContent 
          align="end" 
          className="w-80 p-0 shadow-lg border-primary/20"
          onMouseLeave={() => onClose()}
        >
          <div className="p-4 border-b">
            <h4 className="font-medium">{tooltipContent.title}</h4>
            <p className="text-sm text-muted-foreground mt-1">{tooltipContent.content}</p>
          </div>
          {tooltipContent.examples.length > 0 && (
            <div className="p-4 bg-slate-50">
              <h5 className="text-xs font-medium mb-2 text-slate-500">EXAMPLE APPROACHES</h5>
              <ul className="space-y-2">
                {tooltipContent.examples.map((example, index) => (
                  <li key={index} className="text-sm flex">
                    <span className="text-primary mr-2">•</span>
                    {example}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </HoverCardContent>
      </HoverCard>
    </div>
  );
}

function getTooltipContent(stage: string, analysisMode: string) {
  // Default content
  let content = {
    title: "Conversation Guidance",
    content: "Tips for this stage of the conversation.",
    examples: [""],
  };

  // Strategic mode tooltips
  if (analysisMode === "strategic") {
    switch (stage) {
      case "introduction":
        content = {
          title: "Introduction Strategy",
          content: "Focus on building rapport and establishing a connection. Ask open-ended questions that invite conversation.",
          examples: [
            "Share a relevant insight about their industry",
            "Ask about their business challenges first before mentioning solutions",
            "Acknowledge something positive about their company or approach"
          ],
        };
        break;
      case "discovery":
        content = {
          title: "Strategic Discovery",
          content: "Dig deeper into their needs and pain points. Use this information to customize your future messaging.",
          examples: [
            "Ask 'What would success look like for you?'",
            "Explore the implications of their current approach",
            "Investigate the root causes of their challenges"
          ],
        };
        break;
      case "presentation":
        content = {
          title: "Value-Focused Presentation",
          content: "Emphasize long-term benefits and outcomes rather than features. Connect your solution to their specific goals.",
          examples: [
            "Highlight ROI and long-term value over immediate results",
            "Share relevant case studies from similar organizations",
            "Frame capabilities in terms of their strategic priorities"
          ],
        };
        break;
      case "objection":
        content = {
          title: "Addressing Concerns Strategically",
          content: "View objections as opportunities to educate and build trust. Focus on understanding the underlying concern.",
          examples: [
            "Ask clarifying questions before responding",
            "Acknowledge the validity of their concern",
            "Provide third-party validation when addressing major concerns"
          ],
        };
        break;
      case "closing":
        content = {
          title: "Partnership-Focused Closing",
          content: "Position next steps as a partnership opportunity rather than a transaction. Emphasize mutual success.",
          examples: [
            "Suggest a small initial engagement to demonstrate value",
            "Outline what ongoing support and resources they'll receive",
            "Discuss implementation timeline and success metrics"
          ],
        };
        break;
    }
  } 
  // Tactical mode tooltips
  else {
    switch (stage) {
      case "introduction":
        content = {
          title: "Direct Introduction",
          content: "Make a clear value proposition early. Demonstrate knowledge of their situation to establish credibility quickly.",
          examples: [
            "Reference a specific challenge their industry is facing",
            "Share a surprising statistic relevant to their business",
            "Ask a thought-provoking question about their current approach"
          ],
        };
        break;
      case "discovery":
        content = {
          title: "Tactical Discovery",
          content: "Identify immediate pain points and opportunities. Ask direct questions to qualify their needs and timeline.",
          examples: [
            "Inquire about specific metrics they're trying to improve",
            "Ask about their current timeline for implementing solutions",
            "Determine who else is involved in the decision-making process"
          ],
        };
        break;
      case "presentation":
        content = {
          title: "Results-Focused Presentation",
          content: "Emphasize immediate impact and specific features that address their stated needs. Use concrete examples.",
          examples: [
            "Demonstrate quick implementation timeframes",
            "Show specific features that solve their immediate problems",
            "Present clear before-and-after scenarios"
          ],
        };
        break;
      case "objection":
        content = {
          title: "Direct Objection Handling",
          content: "Address concerns promptly with evidence and clear explanations. Focus on eliminating barriers to moving forward.",
          examples: [
            "Provide specific data points or guarantees",
            "Contrast your solution with alternatives they're considering",
            "Offer flexible terms to overcome immediate concerns"
          ],
        };
        break;
      case "closing":
        content = {
          title: "Action-Oriented Closing",
          content: "Create urgency and focus on immediate next steps. Make the decision process simple and straightforward.",
          examples: [
            "Offer a time-limited incentive for acting now",
            "Suggest a simple starter package with quick implementation",
            "Provide a clear, step-by-step roadmap for getting started"
          ],
        };
        break;
    }
  }

  return content;
}