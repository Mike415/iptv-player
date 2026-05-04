import { useState } from 'react'
import type { FormEvent } from 'react'
import { useStore } from '../store/useStore'
import { authenticate } from '../lib/xtream'

export default function LoginScreen() {
  const { credentials, setCredentials, setAuthenticated, setAuthError, authError } = useStore()

  const [server, setServer] = useState(credentials?.server || '')
  const [username, setUsername] = useState(credentials?.username || '')
  const [password, setPassword] = useState(credentials?.password || '')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setAuthError(null)
    setLoading(true)

    // Normalize server URL
    let serverUrl = server.trim()
    if (!serverUrl.startsWith('http://') && !serverUrl.startsWith('https://')) {
      serverUrl = 'http://' + serverUrl
    }
    serverUrl = serverUrl.replace(/\/$/, '')

    const creds = { server: serverUrl, username: username.trim(), password: password.trim() }

    try {
      await authenticate(creds)
      setCredentials(creds)
      setAuthenticated(true)
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Connection failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">📺</div>
          <h1 className="text-2xl font-bold text-white">IPTV Player</h1>
          <p className="text-gray-400 text-sm mt-1">Enter your Xtream Codes credentials</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Server URL</label>
            <input
              type="text"
              value={server}
              onChange={(e) => setServer(e.target.value)}
              placeholder="http://yourprovider.com"
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              required
              autoCapitalize="none"
              autoCorrect="off"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password"
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
            />
          </div>

          {authError && (
            <div className="bg-red-900/50 border border-red-700 rounded-lg px-4 py-3 text-red-300 text-sm">
              {authError}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition"
          >
            {loading ? 'Connecting...' : 'Connect'}
          </button>
        </form>
      </div>
    </div>
  )
}
