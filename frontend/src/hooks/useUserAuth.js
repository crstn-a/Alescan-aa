// frontend/src/hooks/useUserAuth.js
// Auth hook for public users (consumers). Mirrors useAdminAuth pattern
// but uses public_users endpoints and localStorage for persistence.

import { useState, useCallback } from 'react'
import {
  registerUser, loginUser,
  saveUserToken, clearUserToken, hasUserToken,
  saveUserData, getUserData,
} from '../api/reportApi'

export function useUserAuth() {
  const [authed,  setAuthed]  = useState(() => hasUserToken())
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const [user,    setUser]    = useState(() => getUserData())

  const login = useCallback(async (email, password) => {
    setLoading(true)
    setError(null)
    try {
      const data = await loginUser(email, password)
      saveUserToken(data.access_token)
      saveUserData(data.user)
      setUser(data.user)
      setAuthed(true)
      return true
    } catch (e) {
      setError(e.message)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const register = useCallback(async (formData) => {
    setLoading(true)
    setError(null)
    try {
      const data = await registerUser(formData)
      // Auto-login after registration
      saveUserToken(data.access_token)
      saveUserData(data.user)
      setUser(data.user)
      setAuthed(true)
      return true
    } catch (e) {
      setError(e.message)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    clearUserToken()
    setAuthed(false)
    setUser(null)
  }, [])

  return { authed, loading, error, user, login, register, logout }
}
