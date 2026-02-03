import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const { login } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await login(email, password)
      navigate('/')
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      setError(error.response?.data?.message || t.login.error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-purple-50 p-4">
      {/* Language switcher */}
      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher />
      </div>

      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-violet-400/20 to-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-purple-400/20 to-violet-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-violet-200/30 to-purple-200/30 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-2 pt-8">
          <div className="mx-auto mb-6">
            <img
              src="/logo/kaif-logo.jpg"
              alt="KAIF"
              className="w-20 h-20 rounded-3xl object-cover shadow-xl shadow-violet-500/20 ring-4 ring-white"
            />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
            {t.login.title}
          </CardTitle>
          <CardDescription className="text-slate-500 mt-2">
            {t.login.subtitle}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 pb-8 px-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">{t.login.email}</label>
              <Input
                type="email"
                placeholder="email@example.com"
                className="h-12 bg-white/70 border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">{t.login.password}</label>
              <Input
                type="password"
                placeholder="••••••••"
                className="h-12 bg-white/70 border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-100">
                <p className="text-sm text-red-600 text-center font-medium">{t.login.error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 shadow-lg shadow-violet-500/25 border-0 transition-all"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t.login.signingIn}
                </div>
              ) : (
                t.login.signIn
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
