// frontend/src/hooks/useAdminAuth.js
import { useState, useEffect, useCallback } from 'react'
import { loginAdmin, saveToken, clearToken, hasToken } from '../api/adminApi'

export function useAdminAuth() {
  const [authed,  setAuthed]  = useState(() => hasToken())
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const [user,    setUser]    = useState(
    () => sessionStorage.getItem('alescan_admin_user') || null
  )

  const login = useCallback(async (username, password) => {
    setLoading(true)
    setError(null)
    try {
      const data = await loginAdmin(username, password)
      saveToken(data.access_token)
      sessionStorage.setItem('alescan_admin_user', data.username)
      setUser(data.username)
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
    clearToken()
    sessionStorage.removeItem('alescan_admin_user')
    setAuthed(false)
    setUser(null)
  }, [])

  return { authed, loading, error, user, login, logout }
}