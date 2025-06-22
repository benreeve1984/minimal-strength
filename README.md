# Minimal Strength

A minimalist Progressive Web App (PWA) for tracking strength training workouts, specifically designed for pull-ups and dips progression.

## Features

- **Simple Workout Tracking**: Track pull-ups and dips with visual set progression
- **Intelligent Progression**: Automatically suggest rep increases after completing workouts  
- **Rest Timer**: Configurable timer with screen wake lock, sound alerts, and vibration
- **Mobile Optimized**: Designed for iPhone with PWA capabilities for app-like experience
- **Offline Ready**: Works without internet connection using localStorage
- **No Account Required**: All data stored locally on your device

## Workout Logic

- Start with 5 sets of 1 rep for each exercise
- Complete sets by tapping "Complete Set" 
- Rest timer automatically starts between sets
- After completing all exercises, choose to progress or repeat same level
- Progression adds one rep to the first possible set (e.g., 1-1-1-1-1 → 2-1-1-1-1)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/minimal-strength.git
cd minimal-strength
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm start
```

## Deployment

### Vercel (Recommended)

This app is optimized for Vercel deployment:

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set up the required environment variables (see CI/CD section)
4. Deploy automatically on push to main branch

### CI/CD Setup

For automated deployment via GitHub Actions, add these secrets to your repository:

- `VERCEL_TOKEN`: Your Vercel authentication token
- `VERCEL_ORG_ID`: Your Vercel organization ID  
- `VERCEL_PROJECT_ID`: Your Vercel project ID

## Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Deployment**: Vercel
- **CI/CD**: GitHub Actions

## PWA Features

- Install on home screen
- Offline functionality
- Screen wake lock during timer
- Native-like experience on mobile devices
- Dark theme optimized for iOS

## Browser Support

- Modern browsers with ES2017+ support
- iOS Safari 14+
- Chrome 90+
- Firefox 88+
- Edge 90+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly on mobile devices
5. Submit a pull request

## License

MIT License - see LICENSE file for details 