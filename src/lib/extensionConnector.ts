/**
 * Extension Connector - Handles communication with the browser extension
 */

import { GoogleMeetSession } from "./googleMeetApi";

interface ExtensionMessage {
  type: string;
  [key: string]: any;
}

type MessageHandler = (message: ExtensionMessage) => void;

export class ExtensionConnector {
  private static instance: ExtensionConnector;
  private port: chrome.runtime.Port | null = null;
  private connected = false;
  private messageHandlers: MessageHandler[] = [];
  private meetingStartHandlers: ((meeting: GoogleMeetSession) => void)[] = [];
  private meetingEndHandlers: ((meetingId: string) => void)[] = [];
  private recordingHandlers: ((recording: any) => void)[] = [];

  private constructor() {
    // Private constructor for singleton pattern
  }

  public static getInstance(): ExtensionConnector {
    if (!ExtensionConnector.instance) {
      ExtensionConnector.instance = new ExtensionConnector();
    }
    return ExtensionConnector.instance;
  }

  /**
   * Connect to the browser extension
   */
  public connect(): boolean {
    try {
      // Check if the Chrome runtime is available (we're in a browser with the extension)
      if (
        typeof chrome !== "undefined" &&
        chrome.runtime &&
        chrome.runtime.connect
      ) {
        // Connect to the extension
        this.port = chrome.runtime.connect("EXTENSION_ID_HERE", {
          name: "meet-enhancer-app",
        });

        // Set up message listener
        this.port.onMessage.addListener((message: ExtensionMessage) => {
          this.handleMessage(message);
        });

        // Set up disconnect listener
        this.port.onDisconnect.addListener(() => {
          console.log("Disconnected from extension");
          this.connected = false;
          this.port = null;
        });

        this.connected = true;
        console.log("Connected to Google Meet Enhancement extension");
        return true;
      } else {
        console.log("Chrome extension API not available");
        return false;
      }
    } catch (error) {
      console.error("Error connecting to extension:", error);
      return false;
    }
  }

  /**
   * Check if connected to the extension
   */
  public isConnected(): boolean {
    return this.connected && this.port !== null;
  }

  /**
   * Send a message to the extension
   */
  public sendMessage(message: ExtensionMessage): boolean {
    if (!this.isConnected()) {
      console.error("Cannot send message: not connected to extension");
      return false;
    }

    try {
      this.port!.postMessage(message);
      return true;
    } catch (error) {
      console.error("Error sending message to extension:", error);
      return false;
    }
  }

  /**
   * Start recording via the extension
   */
  public startRecording(): boolean {
    return this.sendMessage({ type: "START_RECORDING" });
  }

  /**
   * Stop recording via the extension
   */
  public stopRecording(): boolean {
    return this.sendMessage({ type: "STOP_RECORDING" });
  }

  /**
   * Register a handler for extension messages
   */
  public onMessage(handler: MessageHandler): void {
    this.messageHandlers.push(handler);
  }

  /**
   * Register a handler for meeting start events
   */
  public onMeetingStart(handler: (meeting: GoogleMeetSession) => void): void {
    this.meetingStartHandlers.push(handler);
  }

  /**
   * Register a handler for meeting end events
   */
  public onMeetingEnd(handler: (meetingId: string) => void): void {
    this.meetingEndHandlers.push(handler);
  }

  /**
   * Register a handler for recording completion events
   */
  public onRecordingCompleted(handler: (recording: any) => void): void {
    this.recordingHandlers.push(handler);
  }

  /**
   * Handle incoming messages from the extension
   */
  private handleMessage(message: ExtensionMessage): void {
    console.log("Received message from extension:", message);

    // Notify all message handlers
    this.messageHandlers.forEach((handler) => {
      try {
        handler(message);
      } catch (error) {
        console.error("Error in message handler:", error);
      }
    });

    // Handle specific message types
    if (message.type === "MEETING_STARTED" && message.meeting) {
      const meetingData: GoogleMeetSession = {
        meetingId: message.meeting.meetingId,
        meetingCode: message.meeting.meetingCode,
        title: message.meeting.title,
        startTime: new Date(message.meeting.startTime),
        isRecording: false,
        participants: message.meeting.participants || [],
        hostEmail: message.meeting.hostEmail,
      };

      this.meetingStartHandlers.forEach((handler) => {
        try {
          handler(meetingData);
        } catch (error) {
          console.error("Error in meeting start handler:", error);
        }
      });
    }

    if (message.type === "MEETING_ENDED" && message.meetingId) {
      this.meetingEndHandlers.forEach((handler) => {
        try {
          handler(message.meetingId);
        } catch (error) {
          console.error("Error in meeting end handler:", error);
        }
      });
    }

    if (message.type === "RECORDING_COMPLETED") {
      this.recordingHandlers.forEach((handler) => {
        try {
          handler({
            meetingId: message.meetingId,
            title: message.title,
            recording: message.recording,
            duration: message.duration,
            mimeType: message.mimeType,
          });
        } catch (error) {
          console.error("Error in recording handler:", error);
        }
      });
    }
  }

  /**
   * Disconnect from the extension
   */
  public disconnect(): void {
    if (this.port) {
      try {
        this.port.disconnect();
      } catch (error) {
        console.error("Error disconnecting from extension:", error);
      }
      this.port = null;
    }
    this.connected = false;
  }
}

// Helper function to get the extension connector instance
export function getExtensionConnector(): ExtensionConnector {
  return ExtensionConnector.getInstance();
}
