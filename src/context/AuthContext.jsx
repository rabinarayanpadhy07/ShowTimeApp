import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import * as authApi from '../api/authApi'
import { onSessionExpired, setAccessToken } from '../api/session'

const AuthContext = createContext(null)

/**
 * Session state. On load it tries to restore a session from the HttpOnly refresh cookie.
 * The user's role here only drives what the UI shows; every protected API call is
 * authorized by the server from the signed access token.
 */
export function AuthProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', user: null, expired: false })

  const applySession = useCallback((session) => {
    setAccessToken(session.accessToken)
    setState({ status: 'authenticated', user: session.user, expired: false })
    return session.user
  }, [])

  useEffect(() => {
    let active = true
    authApi
      .refresh()
      .then((session) => active && applySession(session))
      .catch(() => active && setState({ status: 'anonymous', user: null, expired: false }))
    return () => {
      active = false
    }
  }, [applySession])

  useEffect(
    () =>
      onSessionExpired(() => {
        setAccessToken(null)
        setState({ status: 'anonymous', user: null, expired: true })
      }),
    [],
  )

  const login = useCallback(async (credentials) => applySession(await authApi.login(credentials)), [applySession])

  const loginWithGoogle = useCallback(
    async (credential) => applySession(await authApi.loginWithGoogle(credential)),
    [applySession],
  )

  const register = useCallback(async (details) => applySession(await authApi.register(details)), [applySession])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } finally {
      setAccessToken(null)
      setState({ status: 'anonymous', user: null, expired: false })
    }
  }, [])

  const updateUser = useCallback((user) => setState((current) => ({ ...current, user })), [])

  const value = useMemo(
    () => ({
      status: state.status,
      user: state.user,
      sessionExpired: state.expired,
      isAuthenticated: state.status === 'authenticated',
      isAdmin: state.user?.role === 'ADMIN',
      login,
      loginWithGoogle,
      register,
      logout,
      applySession,
      updateUser,
    }),
    [state, login, loginWithGoogle, register, logout, applySession, updateUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}
