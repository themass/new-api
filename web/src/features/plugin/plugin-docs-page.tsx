/*
Copyright (C) 2023-2026 QuantumNous
*/
import { Link } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  fetchPluginBootstrap,
  fetchPluginMeta,
  type PluginEndpointDoc,
  type PluginMeta,
} from '@/features/plugin/api'
import { useAuthStore } from '@/stores/auth-store'

function EndpointCard({
  endpoint,
  baseUrl,
  token,
}: {
  endpoint: PluginEndpointDoc
  baseUrl: string
  token: string
}) {
  const { t } = useTranslation()
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState('')

  const curl = useMemo(() => {
    const url = `${baseUrl}${endpoint.path}`
    if (!endpoint.auth) return `curl -s "${url}"`
    return `curl -s -H "Authorization: Bearer <token>" "${url}"`
  }, [baseUrl, endpoint])

  async function tryCall() {
    setBusy(true)
    setResult('')
    try {
      if (endpoint.path === '/api/plugin/meta') {
        const data = await fetchPluginMeta()
        setResult(JSON.stringify(data, null, 2))
      } else if (endpoint.path === '/api/plugin/bootstrap') {
        if (!token) {
          setResult(t('Sign in first or paste a Bearer token below.'))
          return
        }
        const data = await fetchPluginBootstrap(token)
        setResult(JSON.stringify(data, null, 2))
      }
    } catch (error) {
      setResult(error instanceof Error ? error.message : String(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <article className='rounded-xl border border-slate-200 bg-white p-5 shadow-sm'>
      <div className='flex flex-wrap items-center gap-2'>
        <span className='rounded bg-slate-900 px-2 py-0.5 font-mono text-xs text-white'>
          {endpoint.method}
        </span>
        <code className='text-sm font-medium'>{endpoint.path}</code>
        {endpoint.auth ? (
          <span className='rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-900'>
            {t('Auth required')}
          </span>
        ) : (
          <span className='rounded bg-emerald-100 px-2 py-0.5 text-xs text-emerald-900'>
            {t('Public')}
          </span>
        )}
      </div>
      <p className='mt-2 text-sm text-slate-600'>{endpoint.description}</p>
      <pre className='mt-3 overflow-x-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-100'>
        {curl}
      </pre>
      <Button type='button' className='mt-3' variant='outline' disabled={busy} onClick={() => void tryCall()}>
        {busy ? <Loader2 className='mr-2 size-4 animate-spin' /> : null}
        {t('Try it')}
      </Button>
      {result ? (
        <Textarea readOnly className='mt-3 min-h-32 font-mono text-xs' value={result} />
      ) : null}
    </article>
  )
}

export function PluginDocsPage() {
  const { t } = useTranslation()
  const auth = useAuthStore((state) => state.auth)
  const [meta, setMeta] = useState<PluginMeta | null>(null)
  const [manualToken, setManualToken] = useState('')

  useEffect(() => {
    void fetchPluginMeta().then(setMeta).catch(() => setMeta(null))
  }, [])

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const token = manualToken.trim() || auth.accessToken || ''

  return (
    <div className='min-h-svh bg-slate-50 text-slate-900'>
      <header className='border-b border-slate-200 bg-white'>
        <div className='mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6'>
          <div>
            <h1 className='text-xl font-semibold'>{t('Plugin API')}</h1>
            <p className='text-sm text-slate-500'>NaviForge extension integration</p>
          </div>
          <Link to='/plugin/connect' className='text-sm text-blue-600 hover:underline'>
            {t('Extension connect page')}
          </Link>
        </div>
      </header>

      <main className='mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6'>
        <section className='rounded-2xl border border-slate-200 bg-white p-6 shadow-sm'>
          <h2 className='text-lg font-medium'>{t('Build info')}</h2>
          {meta ? (
            <dl className='mt-3 grid gap-2 text-sm sm:grid-cols-2'>
              <div>
                <dt className='text-slate-500'>{t('Version')}</dt>
                <dd className='font-mono'>{meta.version}</dd>
              </div>
              <div>
                <dt className='text-slate-500'>{t('Build')}</dt>
                <dd className='font-mono'>{meta.buildLabel}</dd>
              </div>
              <div>
                <dt className='text-slate-500'>{t('Client')}</dt>
                <dd className='font-mono'>{meta.client}</dd>
              </div>
              <div>
                <dt className='text-slate-500'>{t('Default chat model')}</dt>
                <dd className='font-mono'>{meta.defaults.chatModel || '—'}</dd>
              </div>
            </dl>
          ) : (
            <p className='mt-2 text-sm text-slate-500'>{t('Loading…')}</p>
          )}
        </section>

        <section className='rounded-2xl border border-slate-200 bg-white p-6 shadow-sm'>
          <h2 className='text-lg font-medium'>{t('Bearer token (optional)')}</h2>
          <p className='mt-1 text-sm text-slate-600'>
            {auth.accessToken
              ? t('Using your current session token. Override below if needed.')
              : t('Sign in on /plugin/connect or paste a token to try bootstrap.')}
          </p>
          <Textarea
            className='mt-3 font-mono text-xs'
            placeholder='sk-... or session access token'
            value={manualToken}
            onChange={(e) => setManualToken(e.target.value)}
          />
        </section>

        <section className='space-y-4'>
          <h2 className='text-lg font-medium'>{t('Endpoints')}</h2>
          {(meta?.endpoints ?? []).map((endpoint) => (
            <EndpointCard
              key={endpoint.path}
              endpoint={endpoint}
              baseUrl={baseUrl}
              token={token}
            />
          ))}
        </section>
      </main>
    </div>
  )
}
