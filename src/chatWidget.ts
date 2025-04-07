/**
 * Chat Widget
 * Dette er hoved-scriptet for chat-widgeten som injiseres på eksterne nettsider.
 */

// Importér nødvendige avhengigheter
import React from 'react';
import ReactDOM from 'react-dom';
import { App } from './App';

// Definér typer
interface ChatWidgetConfig {
  containerId: string;
  apiEndpoint: string;
}

// Klasse for ChatWidget
class ChatWidget {
  private config: ChatWidgetConfig;
  private container: HTMLElement | null = null;

  constructor() {
    this.config = {
      containerId: 'chat-widget-container',
      apiEndpoint: '',
    };
  }

  /**
   * Initialiserer chat-widgeten med tilpasset konfigurasjon
   */
  public init(userConfig: Partial<ChatWidgetConfig>) {
    // Kombiner brukerens konfigurasjon med standardverdier
    this.config = { ...this.config, ...userConfig };
    
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
    
    ReactDOM.render(
      React.createElement(App, { 
        apiEndpoint: this.config.apiEndpoint,
        onClose: () => this.minimizeChat(),
        onMaximize: () => this.maximizeChat() 
      }),
      this.container
    );
  }

  /**
   * Minimerer chat-widgeten
   */
  private minimizeChat() {
    if (this.container) {
      this.container.classList.add('minimized');
    }
  }

  /**
   * Maksimerer chat-widgeten
   */
  private maximizeChat() {
    if (this.container) {
      this.container.classList.remove('minimized');
    }
  }
}

// Eksportér en instans av ChatWidget til window-objektet
const chatWidgetInstance = new ChatWidget();

// Legg til instansen på window-objektet
window.ChatWidget = chatWidgetInstance;

// Export for bruk i andre moduler
export default chatWidgetInstance; 