import React from 'react'

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error }
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo)
    }

    handleReset = () => {
        localStorage.clear()
        window.location.href = '/'
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100vh',
                    padding: '20px',
                    textAlign: 'center',
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                }}>
                    <h1 style={{ color: '#dc2626', marginBottom: '10px' }}>Something went wrong</h1>
                    <p style={{ color: '#4b5563', marginBottom: '20px', maxWidth: '500px' }}>
                        The application encountered an unexpected error. This might be due to corrupted data.
                    </p>
                    <div style={{
                        padding: '15px',
                        backgroundColor: '#f3f4f6',
                        borderRadius: '8px',
                        marginBottom: '20px',
                        textAlign: 'left',
                        maxWidth: '600px',
                        overflow: 'auto'
                    }}>
                        <code style={{ fontSize: '0.9em', color: '#dc2626' }}>
                            {this.state.error && this.state.error.toString()}
                        </code>
                    </div>
                    <button
                        onClick={this.handleReset}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#2563eb',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '16px',
                            cursor: 'pointer',
                            fontWeight: '500'
                        }}
                    >
                        Reset Application (Clear Data)
                    </button>
                </div>
            )
        }

        return this.props.children
    }
}

export default ErrorBoundary
