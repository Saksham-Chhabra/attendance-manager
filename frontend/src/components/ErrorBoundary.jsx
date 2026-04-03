import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("ErrorBoundary Caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-red-900/20 text-white min-h-screen">
          <h1 className="text-3xl font-black text-red-500 mb-4">Fatal UI Render Crash</h1>
          <p className="text-red-200 mb-6">The application failed to render this specific component tree due to a Javascript exception.</p>
          
          <div className="bg-black/50 p-6 rounded-xl overflow-x-auto font-mono text-xs border border-red-500/30">
            <div className="text-red-400 font-bold mb-4">{this.state.error && this.state.error.toString()}</div>
            <pre className="text-gray-300 leading-relaxed">
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </pre>
          </div>

          <button 
             onClick={() => window.location.href = '/'}
             className="mt-8 bg-white/10 hover:bg-white/20 py-2 px-6 rounded-lg font-bold transition-colors"
          >
             Return Home
          </button>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
