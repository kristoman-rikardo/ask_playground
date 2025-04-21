import './index.css'
/**
 * Chat Widget
 * Dette er hoved-scriptet for chat-widgeten som injiseres på eksterne nettsider.
 */

// Importér nødvendige avhengigheter
import React from 'react';
import ReactDOM from 'react-dom';
import { App } from './App';
import { createRoot } from 'react-dom/client';

// Definér typer
interface ChatWidgetConfig {
  containerId: string;
  apiEndpoint: string;
  apiKey: string;
  projectID: string;
  launchConfig?: {
    event: {
      type: string;
      payload: Record<string, any>;
    }
  };
  disableAutoScroll?: boolean;
}

// Definer ChatWidget-grensesnittet for window
interface ChatWidgetInterface {
  init: (config: Partial<ChatWidgetConfig>) => void;
  maximizeChat: () => void;
  minimizeChat: () => void;
}

// Utvid Window-typen for TypeScript
declare global {
  interface Window {
    ChatWidget: ChatWidgetInterface;
    VOICEFLOW_API_KEY: string;
    VOICEFLOW_PROJECT_ID: string;
  }
}

// Eksportér API-konstanter for bruk i injeksjonsscript
export let API_KEY = '';
export let PROJECT_ID = '';

// Klasse for ChatWidget
class ChatWidgetClass {
  private config: ChatWidgetConfig;
  private container: HTMLElement | null = null;
  private launchConfig: any = null;

  constructor() {
    this.config = {
      containerId: 'chat-widget-container',
      apiEndpoint: 'https://general-runtime.voiceflow.com',
      apiKey: '',
      projectID: '',
      disableAutoScroll: true,
    };
  }

  /**
   * Initialiserer chat-widgeten med tilpasset konfigurasjon
   */
  public init(userConfig: Partial<ChatWidgetConfig>) {
    // First, combine user config with defaults
    this.config = { ...this.config, ...userConfig };
    
    // Store the launch configuration separately if provided
    this.launchConfig = userConfig.launchConfig;
    
    // Then check if the required properties exist
    const { apiKey, projectID } = this.config;
    
    if (!apiKey || !projectID) {
      console.error(`[ChatWidget] Api key was not found.`);
      return;
    }
    
    // Oppdater eksporterte API-konstanter
    API_KEY = apiKey;
    PROJECT_ID = projectID;
    
    // Legg til disse variablene på window-objektet for bruk i injeksjonsscript
    window.VOICEFLOW_API_KEY = apiKey;
    window.VOICEFLOW_PROJECT_ID = projectID;
    
    // Finn container-elementet
    this.container = document.getElementById(this.config.containerId);
    
    if (!this.container) {
      console.error(`[ChatWidget] Container med ID '${this.config.containerId}' ble ikke funnet.`);
      return;
    }
    
    // Render React-applikasjonen i containeren
    this.render();
  }

  /**
   * Renderer chat-komponenten
   */
  private render() {
    if (!this.container) return;
    const root = createRoot(this.container);
    root.render(
      React.createElement(App, { 
        apiEndpoint: this.config.apiEndpoint,
        apiKey: this.config.apiKey,
        projectID: this.config.projectID,
        launchConfig: this.launchConfig,
        onClose: () => this.minimizeChat(),
        onMaximize: () => this.maximizeChat(),
        isEmbedded: true,
        disableGlobalAutoScroll: this.config.disableAutoScroll
      }),
    );
  }

  /**
   * Minimerer chat-widgeten
   */
  public minimizeChat() {
    if (this.container) {
      this.container.classList.add('minimized');
    }
  }

  /**
   * Maksimerer chat-widgeten
   */
  public maximizeChat() {
    if (this.container) {
      this.container.classList.remove('minimized');
    }
  }
}

// Opprett en instans av ChatWidgetClass
const chatWidgetInstance = new ChatWidgetClass();

// Eksportér metodene direkte til window.ChatWidget som et objekt med ChatWidgetInterface
window.ChatWidget = {
  init: chatWidgetInstance.init.bind(chatWidgetInstance),
  maximizeChat: chatWidgetInstance.maximizeChat.bind(chatWidgetInstance),
  minimizeChat: chatWidgetInstance.minimizeChat.bind(chatWidgetInstance)
};

// Eksportér chatWidgetInstance for bruk i andre moduler
export default chatWidgetInstance; 