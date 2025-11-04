# Motion Capture Visualization App

A React + TypeScript web application for visualizing and analyzing motion capture data, featuring 3D model playback, kinematic data graphing, and AI-powered biomechanical analysis.

## Features

- **3D Motion Visualization**: Playback of FBX motion capture files in an interactive 3D scene
- **Kinematic Data Analysis**: Real-time graphing of motion data from Excel files
- **Multi-Player Support**: Organized player sessions with manifest-based file management
- **AI-Powered Analysis**: Google AI Studio (Gemini) integration for:
  - Automated biomechanical analysis
  - Natural language queries about motion data
  - Comprehensive report generation
- **Flexible Display Modes**: Docked or in-3D graph panels, multiple camera views
- **Player & Admin Modes**: Different interfaces for players vs. administrators

## Setup

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

```bash
npm install
```

### AI Features Setup

To enable AI-powered analysis features:

1. Get an OpenAI API key:
   - Visit [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
   - Sign in and create a new API key
   - Note: OpenAI provides $5 in free credits to start

2. Create a `.env` file in the project root:
   ```bash
   VITE_OPENAI_API_KEY=your_api_key_here
   ```

3. The `.env` file is already in `.gitignore` - your API key will not be committed to version control.

**Note**: AI features are optional. The app will function normally without an API key, but AI buttons will show errors when used. Uses GPT-4o-mini for cost-effective analysis.

## Development

```bash
# Start development server
npm run dev

# Type check
npm run typecheck

# Lint
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

## Usage

### Player Mode

Accessible at `/?mode=player&player=PlayerName`. Players can:
- View their motion capture sessions
- Analyze their kinematic data
- Use AI Assistant to ask questions about their data
- Generate AI reports

### Admin Mode

Accessible at `/?mode=admin`. Administrators can:
- Upload new FBX, Excel, or JSON files
- View all players and sessions
- Export data as JSON
- Use all AI features
- Access advanced visualization controls

### AI Features

**AI Assistant** (available in toolbar):
- Click "AI Assistant" button to open chat interface
- Ask natural language questions about motion data
- Click "Analyze Current Session" for automated biomechanical insights

**AI Report** (available in toolbar):
- Click "AI Report" button to generate comprehensive analysis
- Review generated report in the panel
- Copy or download report as markdown file

## Project Structure

```
src/
├── components/
│   ├── AIChatPanel.tsx      # AI chat interface
│   ├── AIReportPanel.tsx    # AI report generation
│   ├── CustomSelect.tsx     # Custom dropdown component
│   ├── FBXModel.tsx         # 3D FBX model loader
│   ├── GraphHoloPanel.tsx   # 3D holographic graph panels
│   ├── SimpleGraph.tsx      # 2D graph visualization
│   └── ThreeView.tsx        # Main 3D scene component
├── utils/
│   ├── ai.ts                # AI service functions
│   └── excel.ts             # Excel parsing utilities
└── App.tsx                  # Root component
```

## Data Format

### Player Manifests

Each player directory should contain an `index.json` file:

```json
{
  "player": "Player Name",
  "defaultSession": "2025-08-25",
  "sessions": ["2025-08-25", "2025-10-21"],
  "fbx": "EXPORT.fbx",
  "excel": "Kinematic_Data (1).xlsx",
  "files": {
    "2025-08-25": {
      "fbx": "session1.fbx",
      "excel": "session1.xlsx"
    }
  }
}
```

### Excel Data

Excel files should contain motion data with:
- Time column (`t`, `time`, or `timestamp`)
- Numeric columns for various kinematic channels
- Multiple sheets supported (e.g., joint positions, velocities)

## Technologies

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Three.js** - 3D graphics
- **React Three Fiber** - React renderer for Three.js
- **@react-three/drei** - Useful helpers for R3F
- **OpenAI** - AI-powered analysis (GPT-4o-mini)
- **xlsx** - Excel file parsing

## License

Private project
