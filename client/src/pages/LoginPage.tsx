import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { AlertCircle } from 'lucide-react'
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
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Language switcher */}
      <div className="absolute top-5 right-5 z-10">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-[400px] animate-fadeUp">
        {/* Brand */}
        <div className="flex flex-col items-center text-center mb-7">
          <img
            src="/logo/kaif-logo.jpg"
            alt="KAIF"
            className="w-16 h-16 rounded-[18px] object-cover shadow-[0_8px_32px_rgba(0,0,0,0.12)] ring-1 ring-[#ebe9e3]"
          />
          <h1 className="mt-5 text-[24px] font-bold tracking-[-0.02em] text-[#0a0a0a]">
            {t.login.title}
          </h1>
          <p className="mt-1.5 text-[13.5px] text-[#9a9a98]">{t.login.subtitle}</p>
        </div>

        {/* Card */}
        <div className="card p-6 sm:p-7">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[12.5px] font-medium text-[#6b6b6b] mb-1.5">
                {t.login.email}
              </label>
              <Input
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-[12.5px] font-medium text-[#6b6b6b] mb-1.5">
                {t.login.password}
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-[12px] bg-[#fef2f2] border border-[#fee2e2]">
                <AlertCircle className="h-4 w-4 text-[#be123c] flex-shrink-0" strokeWidth={1.8} />
                <p className="text-[12.5px] text-[#be123c] font-medium">{t.login.error}</p>
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 spinner !border-white/30 !border-t-white" />
                  {t.login.signingIn}
                </span>
              ) : (
                t.login.signIn
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
