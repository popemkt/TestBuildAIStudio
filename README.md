# SplitSmart AI

SplitSmart AI is an intelligent and user-friendly application designed to simplify tracking shared expenses within groups. It combines a clean, mobile-first interface with powerful AI capabilities to make logging and managing group costs effortless.

## Core Features & Functionality

- **Group Management:**
  - Users can create, view, and manage multiple groups (e.g., "Hawaii Trip," "Apartment Bills").
  - Each group has a dedicated dashboard showing total spending and a list of members.
  - Groups can be edited (name changes, member adjustments) or deleted.

- **AI-Powered Expense Creation (AI Assistant):**
  - The app features a versatile AI Assistant to automate expense entry, accessible via multiple methods:
  - **Scan Receipt:** Instantly captures expense details by uploading a photo of a receipt.
  - **Use Voice / AI Prompt:** Allows users to describe an expense in plain language (e.g., "Lunch for $50, split with Alice").
  - **Advanced AI (Image + Text):** A powerful "combo" mode where users can upload a receipt image and add a text prompt for complex scenarios (e.g., providing an image and specifying "This was for dinner, split it three ways").
  - The AI intelligently parses descriptions, amounts, currencies, dates, categories, who paid, and how the expense should be split.

- **Multi-Currency Handling:**
  - Each group has a master currency (e.g., USD) to ensure all balances are consistent and easy to understand.
  - Expenses can be added in any major world currency.
  - The app automatically converts the expense to the group's master currency using simulated real-time exchange rates.
  - Both the original amount (e.g., ¥10,000) and the converted amount (e.g., $63.69) are stored and displayed, providing full transparency on every transaction.

- **Flexible Expense Splitting:**
  - **Equal:** Divides the cost evenly among selected participants.
  - **Exact Amount:** Allows specifying the exact dollar amount each person owes.
  - **By Parts/Shares:** Enables splitting based on portions (e.g., one person covers 2 parts, another covers 1 part).

- **Balance Tracking and Settlement:**
  - The app automatically calculates a running balance for each group member, clearly showing who owes whom.
  - A dedicated "Balances" tab provides a final summary, making it easy to settle up.
  - The main groups list displays a high-level balance status for the current user in each group (e.g., "You are owed $25.00" or "You owe $10.50").

- **Data & Attachments:**
  - Users can manually add image attachments (like receipts or photos) to any expense.
  - Receipts scanned by the AI are automatically added as attachments.
  - Full expense history for any group can be exported to a CSV file for record-keeping.

- **UI/UX & Technology:**
  - **Modern Interface:** Built with React and styled with Tailwind CSS, the app features a clean, responsive, and mobile-first design with full dark mode support.
  - **Intuitive Navigation:** A standard bottom navigation bar provides easy access to Groups, Adding Expenses, and the Profile.
  - **Interactive Components:** The app uses clear, reusable components for forms, modals, avatars, and buttons, ensuring a consistent and pleasant user experience.
  - **AI Integration:** Leverages the Google Gemini API (`gemini-2.5-flash` model) for its AI features, using advanced prompting and JSON schema enforcement to ensure accurate and structured data extraction.

- **Pluggable Backend Architecture:**
  - The application features a decoupled data layer, allowing for interchangeable backends (e.g., Firebase, Demo Mode, Supabase) without altering the core application logic.

## Architecture: The Pluggable Data Layer

The application is architected with a clean separation between the core UI/business logic and the data persistence layer. This is achieved using a **Facade** and **Strategy** design pattern, making the backend "pluggable."

- **`IDataService.ts` (The Contract):** This TypeScript interface defines a strict contract for all data operations (authentication, CRUD for groups/expenses, etc.). Any backend must implement this interface.

- **Data Service Implementations (The Strategies):**
  - `FirebaseDataService.ts`: The implementation for our production backend, handling all interactions with Firebase Auth, Firestore, and Cloud Storage.
  - `DemoDataService.ts`: An implementation that uses the browser's `localStorage` for a fully client-side demo experience, mimicking the real backend's behavior.

- **`DataServiceFacade.ts` (The Facade):** This is the single point of contact for the application's state management layer (`appStore.ts`). It holds the currently active data service (either Firebase or Demo) and delegates all calls to it. The rest of the app is completely unaware of which backend is currently in use.

This architecture means the app's core logic is the "brain," and the data service is a swappable "memory unit."

### How to Add a New Backend (e.g., Supabase)

1.  **Create the Service:** Create a new file, e.g., `services/data/SupabaseDataService.ts`.
2.  **Implement the Contract:** Make your new `SupabaseDataService` class implement the `IDataService` interface, providing Supabase-specific logic for each required method.
3.  **Update the Facade:** Add the new service to the `DataServiceFacade.ts` to allow initialization.
4.  **Initialize:** Update the application's entry point to initialize the facade with your new service when appropriate.

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- A Firebase project (for Firebase mode)
- A Google Gemini API key

### Installation & Setup

1. **Clone and install dependencies:**

   ```bash
   git clone <repository-url>
   cd groupExGemini
   npm install
   ```

2. **Configure Firebase Client SDK (Optional):**
   - To run the app in live Firebase mode, rename `.env.example` to `.env.local`.
   - Get your Firebase project's web configuration snippet from the Firebase console.
   - Fill in the `VITE_FIREBASE_*` variables in `.env.local`. These are safe to expose on the client.
   - If you don't configure this, the app will still run perfectly in **Demo Mode**.

3. **Configure Gemini API Key (Securely):**
   - The application uses a secure serverless function (`/functions/api/parse-expense.ts`) to handle all AI requests.
   - You must set your `GEMINI_API_KEY` as a **server-side environment variable** in your hosting provider's settings (e.g., Vercel, Netlify, Google Cloud). This keeps your key secure.

4. **Start the development server:**
   ```bash
   npm run dev
   ```

## Future Enhancements

- **Real-time Collaboration & Cloud Sync:** Implement real-time listeners in the `FirebaseDataService` to allow all group members to see updates instantly.
- **Enhanced AI-Powered Insights:** Go beyond data entry and leverage Gemini for deep financial analysis.
- **Streamlined "Settle Up" Wizard:** Create a dedicated feature that calculates the _most efficient_ set of payments to clear all debts.
- **"Living" Interfaces & Micro-interactions:** Make the app feel more alive with subtle animations and feedback.
- **Richer Dashboards & Data Visualization:** Display charts and graphs to help users visualize spending.
