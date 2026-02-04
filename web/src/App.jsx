import { useState, useEffect } from 'react'

const API_URL = import.meta.env.VITE_API_URL || '/api'

function App() {
  const [chainStatus, setChainStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const testChain = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_URL}/test-chain`)
      const data = await response.json()
      setChainStatus(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>🎓 CommitEd</h1>
        <p style={styles.subtitle}>Code Submission & Analysis Platform</p>
      </header>

      <main style={styles.main}>
        <section style={styles.section}>
          <h2>Service Status</h2>
          <button 
            onClick={testChain} 
            disabled={loading}
            style={styles.button}
          >
            {loading ? 'Testing...' : 'Test Service Chain'}
          </button>

          {error && (
            <div style={styles.error}>
              <strong>Error:</strong> {error}
            </div>
          )}

          {chainStatus && (
            <div style={styles.statusCard}>
              <h3>Chain Test Result</h3>
              <p><strong>Status:</strong> {chainStatus.status}</p>
              <p><strong>Message:</strong> {chainStatus.message}</p>
              
              {chainStatus.chain && (
                <div style={styles.chainStatus}>
                  <h4>Service Chain:</h4>
                  <ul>
                    {Object.entries(chainStatus.chain).map(([service, status]) => (
                      <li key={service} style={styles.serviceItem}>
                        <span style={styles.serviceName}>{service}:</span>
                        <span style={{
                          ...styles.serviceStatus,
                          color: status === 'connected' ? '#28a745' : '#dc3545'
                        }}>
                          {status}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <p style={styles.timestamp}>
                <small>Timestamp: {chainStatus.timestamp}</small>
              </p>
            </div>
          )}
        </section>

        <section style={styles.section}>
          <h2>Architecture</h2>
          <div style={styles.architecture}>
            <div style={styles.serviceBox}>Nginx (Port 80)</div>
            <div style={styles.arrow}>↓</div>
            <div style={styles.serviceBox}>Gateway - Java Spring Boot (Port 8080)</div>
            <div style={styles.arrow}>↓</div>
            <div style={styles.serviceRow}>
              <div style={styles.serviceBoxSmall}>Core - PHP Symfony (8000)</div>
              <div style={styles.serviceBoxSmall}>Analyzer - Python Flask (5000)</div>
              <div style={styles.serviceBoxSmall}>Notifications - .NET Core (5001)</div>
            </div>
            <div style={styles.arrow}>↓</div>
            <div style={styles.serviceBox}>Oracle Database (Port 1521)</div>
          </div>
        </section>
      </main>

      <footer style={styles.footer}>
        <p>CommitEd Platform - Educational Code Analysis System</p>
      </footer>
    </div>
  )
}

const styles = {
  container: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    textAlign: 'center',
    marginBottom: '40px',
    padding: '20px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '10px',
    color: 'white',
  },
  title: {
    margin: '0',
    fontSize: '2.5rem',
  },
  subtitle: {
    margin: '10px 0 0',
    opacity: 0.9,
  },
  main: {
    flex: 1,
  },
  section: {
    marginBottom: '40px',
    padding: '20px',
    background: '#f8f9fa',
    borderRadius: '10px',
  },
  button: {
    padding: '12px 24px',
    fontSize: '16px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'background 0.3s',
  },
  error: {
    marginTop: '20px',
    padding: '15px',
    background: '#f8d7da',
    color: '#721c24',
    borderRadius: '5px',
  },
  statusCard: {
    marginTop: '20px',
    padding: '20px',
    background: 'white',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  },
  chainStatus: {
    marginTop: '15px',
  },
  serviceItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #eee',
  },
  serviceName: {
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  serviceStatus: {
    fontWeight: 'bold',
  },
  timestamp: {
    marginTop: '15px',
    color: '#666',
  },
  architecture: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
  },
  serviceBox: {
    padding: '15px 30px',
    background: '#667eea',
    color: 'white',
    borderRadius: '5px',
    textAlign: 'center',
  },
  serviceBoxSmall: {
    padding: '10px 15px',
    background: '#764ba2',
    color: 'white',
    borderRadius: '5px',
    textAlign: 'center',
    fontSize: '14px',
  },
  serviceRow: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  arrow: {
    fontSize: '24px',
    color: '#667eea',
  },
  footer: {
    textAlign: 'center',
    padding: '20px',
    color: '#666',
    borderTop: '1px solid #eee',
    marginTop: '40px',
  },
}

export default App
