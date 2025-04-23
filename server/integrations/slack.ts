import { WebClient, ChatPostMessageArguments, ConversationsHistoryResponse } from "@slack/web-api";
import { logError, logInfo } from "../utils/logger";

/**
 * Slack integration service
 * 
 * This service provides functionality to interact with Slack channels and users
 * allowing Ella to send notifications, messages, and retrieve conversation history.
 */

// Initialize the Slack client if credentials are available
let slackClient: WebClient | null = null;
let isSlackAvailable = false;

// Initialize the Slack integration
export function initializeSlackIntegration(): boolean {
  try {
    if (!process.env.SLACK_BOT_TOKEN) {
      logInfo("Slack integration disabled: No SLACK_BOT_TOKEN provided");
      return false;
    }

    slackClient = new WebClient(process.env.SLACK_BOT_TOKEN);
    isSlackAvailable = true;
    logInfo("Slack integration initialized successfully");
    return true;
  } catch (error) {
    logError("Failed to initialize Slack integration", error);
    return false;
  }
}

/**
 * Check if Slack integration is available and properly configured
 */
export function isSlackIntegrationAvailable(): boolean {
  return isSlackAvailable && slackClient !== null;
}

/**
 * Send a message to a Slack channel
 * 
 * @param channelId - The ID of the channel to send the message to
 * @param text - The text of the message to send
 * @param options - Additional options for the message
 * @returns The timestamp of the sent message, or null if sending failed
 */
export async function sendSlackMessage(
  channelId: string,
  text: string,
  options: Partial<ChatPostMessageArguments> = {}
): Promise<string | null> {
  if (!isSlackIntegrationAvailable()) {
    logError("Cannot send Slack message - integration not available");
    return null;
  }

  try {
    // Use the provided channel ID or fall back to the default from environment
    const targetChannel = channelId || process.env.SLACK_CHANNEL_ID;
    
    if (!targetChannel) {
      logError("Cannot send Slack message - no channel ID provided or configured");
      return null;
    }

    const response = await slackClient!.chat.postMessage({
      channel: targetChannel,
      text,
      ...options,
    });

    if (response.ok) {
      logInfo(`Message sent to Slack channel ${targetChannel}`);
      return response.ts || null;
    } else {
      logError(`Failed to send message to Slack: ${response.error}`);
      return null;
    }
  } catch (error) {
    logError("Error sending Slack message", error);
    return null;
  }
}

/**
 * Send a notification to a Slack channel with rich formatting
 * 
 * @param channelId - The ID of the channel to send the notification to
 * @param title - The title of the notification
 * @param body - The body text of the notification
 * @param type - The type of notification (info, success, warning, error)
 * @returns The timestamp of the sent message, or null if sending failed
 */
export async function sendSlackNotification(
  channelId: string,
  title: string,
  body: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info'
): Promise<string | null> {
  if (!isSlackIntegrationAvailable()) {
    logError("Cannot send Slack notification - integration not available");
    return null;
  }

  // Set color based on notification type
  const colorMap = {
    info: '#2196F3',    // Blue
    success: '#4CAF50', // Green
    warning: '#FF9800', // Orange
    error: '#F44336'    // Red
  };

  const color = colorMap[type];

  try {
    return await sendSlackMessage(channelId, "", {
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: title
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: body
          }
        }
      ],
      attachments: [
        {
          color: color,
          blocks: [
            {
              type: "context",
              elements: [
                {
                  type: "mrkdwn",
                  text: `*Type:* ${type.charAt(0).toUpperCase() + type.slice(1)}`
                },
                {
                  type: "mrkdwn",
                  text: `*Time:* ${new Date().toLocaleString()}`
                }
              ]
            }
          ]
        }
      ]
    });
  } catch (error) {
    logError("Error sending Slack notification", error);
    return null;
  }
}

/**
 * Send an appointment notification to Slack
 * 
 * @param channelId - The ID of the channel to send the notification to
 * @param appointment - The appointment details
 * @returns The timestamp of the sent message, or null if sending failed
 */
export async function sendAppointmentNotification(
  channelId: string,
  appointment: {
    title: string;
    date: string;
    startTime: string;
    endTime?: string;
    description?: string;
    location?: string;
    details?: string;
  }
): Promise<string | null> {
  if (!isSlackIntegrationAvailable()) {
    logError("Cannot send appointment notification - Slack integration not available");
    return null;
  }

  const { title, date, startTime, endTime, description, location, details } = appointment;
  
  // Format the time string
  const timeString = endTime 
    ? `${startTime} - ${endTime}` 
    : startTime;

  // Create blocks for the message
  const blocks: any[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "📅 New Appointment Scheduled"
      }
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${title}*\n*Date:* ${date}\n*Time:* ${timeString}`
      }
    }
  ];

  // Add optional fields if they exist
  if (location) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Location:* ${location}`
      }
    });
  }

  if (description) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Description:*\n${description}`
      }
    });
  }

  if (details) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Items to Bring:*\n${details}`
      }
    });
  }

  // Add divider and context
  blocks.push(
    {
      type: "divider"
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: "Scheduled by Ella (YoBot Assistant)"
        }
      ]
    }
  );

  try {
    return await sendSlackMessage(channelId, `New appointment: ${title} on ${date} at ${timeString}`, {
      blocks
    });
  } catch (error) {
    logError("Error sending appointment notification to Slack", error);
    return null;
  }
}

/**
 * Get conversation history from a Slack channel
 * 
 * @param channelId - The ID of the channel to get history from
 * @param limit - Maximum number of messages to retrieve (default: 100)
 * @returns The conversation history or null if retrieval failed
 */
export async function getSlackConversationHistory(
  channelId: string,
  limit: number = 100
): Promise<ConversationsHistoryResponse | null> {
  if (!isSlackIntegrationAvailable()) {
    logError("Cannot get conversation history - Slack integration not available");
    return null;
  }

  try {
    const response = await slackClient!.conversations.history({
      channel: channelId,
      limit
    });

    if (response.ok) {
      return response;
    } else {
      logError(`Failed to get conversation history: ${response.error}`);
      return null;
    }
  } catch (error) {
    logError("Error getting Slack conversation history", error);
    return null;
  }
}

/**
 * Format conversation history into a structured format for AI processing
 * 
 * @param history - The raw conversation history from Slack
 * @returns Formatted conversation history with user information
 */
export function formatSlackConversationForAI(
  history: ConversationsHistoryResponse
): Array<{ user: string; text: string; timestamp: string }> {
  if (!history || !history.messages || !Array.isArray(history.messages)) {
    return [];
  }

  return history.messages.map(message => ({
    user: message.user || 'unknown',
    text: message.text || '',
    timestamp: message.ts || ''
  })).reverse(); // Oldest first for proper conversation flow
}