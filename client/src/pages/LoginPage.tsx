import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/context/AuthContext'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const { login, register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      if (isLogin) {
        await login(email, password)
      } else {
        await register(email, password, name)
      }
      navigate('/')
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      setError(error.response?.data?.message || 'Произошла ошибка')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-white to-indigo-50 p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary/20 to-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative shadow-xl border-slate-200/60">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary/30">
            <span className="text-white font-bold text-2xl">K</span>
          </div>
          <CardTitle className="text-2xl font-bold">
            {isLogin ? 'Добро пожаловать' : 'Создать аккаунт'}
          </CardTitle>
          <CardDescription className="text-slate-500">
            {isLogin
              ? 'Войдите в систему KAIF Finance'
              : 'Заполните данные для регистрации'}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Имя</label>
                <Input
                  type="text"
                  placeholder="Ваше имя"
                  className="bg-white"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <Input
                type="email"
                placeholder="email@example.com"
                className="bg-white"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Пароль</label>
              <Input
                type="password"
                placeholder="••••••••"
                className="bg-white"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-red-600 text-center">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 shadow-lg shadow-primary/25"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Загрузка...
                </div>
              ) : (
                isLogin ? 'Войти' : 'Зарегистрироваться'
              )}
            </Button>

            <p className="text-center text-sm text-slate-500 pt-2">
              {isLogin ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}{' '}
              <button
                type="button"
                className="text-primary font-medium hover:underline"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin ? 'Зарегистрироваться' : 'Войти'}
              </button>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
