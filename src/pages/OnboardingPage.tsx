import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { GraduationCap } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input, Label } from '@/components/ui/Input'
import { useAppStore } from '@/store/app'
import { api } from '@/lib/api'

export function OnboardingPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { setSession } = useAppStore()
  const [loginMode, setLoginMode] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignUp = async () => {
    setLoading(true)
    setError('')
    try {
      const result = await api.createOrganization({
        name: 'My Academy',
        type: 'tutor',
        userName: fullName,
        email,
        password,
        phone
      })
      setSession({
        token: result.token,
        role: result.user.role,
        orgType: 'tutor',
        orgName: 'My Academy',
        userName: result.user.name,
        email: result.user.email
      })
      useAppStore.setState({ isNewUser: true })
      navigate('/plans')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create account')
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    try {
      const result = await api.login({ email, password })
      const org = await api.getOrganization(result.token)
      setSession({ 
        token: result.token, 
        role: result.user.role, 
        orgType: 'tutor', 
        orgName: org.name, 
        userName: result.user.name, 
        email: result.user.email 
      })
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in')
    } finally { 
      setLoading(false) 
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background mesh-bg p-6 relative">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-5 shadow-lg">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            {t('onboarding.welcome', 'Welcome to Edutrack')}
          </h1>
          <p className="text-muted mt-2">{t('app.tagline', 'Manage your tutoring business efficiently')}</p>
        </div>

        {loginMode ? (
          <div className="bg-card rounded-2xl border border-border p-8 card-shadow-lg space-y-5">
            <h2 className="text-xl font-semibold">Sign in</h2>
            <div>
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button className="w-full" size="lg" disabled={!email || !password || loading} onClick={handleLogin}>
              {loading ? t('common.loading', 'Loading...') : 'Sign in'}
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => { setLoginMode(false); setError('') }}>
              Don't have an account? Sign up
            </Button>
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-border p-8 card-shadow-lg space-y-5">
            <h2 className="text-xl font-semibold">Sign up</h2>
            <div>
              <Label>Full Name</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Sarah Benali" />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
            </div>
            <div>
              <Label>Phone Number</Label>
              <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+213 555 123 456" />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button 
              className="w-full" 
              size="lg" 
              disabled={!fullName || !email || !phone || password.length < 8 || loading} 
              onClick={handleSignUp}
            >
              {loading ? t('common.loading', 'Loading...') : 'Sign up'}
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => { setLoginMode(true); setError('') }}>
              Already have an account? Sign in
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
