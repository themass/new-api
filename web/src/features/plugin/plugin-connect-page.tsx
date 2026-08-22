/*
Copyright (C) 2023-2026 QuantumNous
*/
import { Link, useSearch } from '@tanstack/react-router'
import { ExternalLink, Loader2, Puzzle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { UserAuthForm } from '@/features/auth/sign-in/components/user-auth-form'
import {
  buildPluginCallbackUrl,
  parsePluginLoginContext,
  redirectToExternal,
} from '@/features/auth/lib/plugin-redirect'
import { fetchPluginMeta, type PluginMeta } from '@/features/plugin/api'
import { useAuthStore } from '@/stores/auth-store'

export function PluginConnectPage() {
  const { t } = useTranslation()
  const search = useSearch({ from: '/plugin/connect' })
  const pluginCtx = parsePluginLoginContext(search)
  const auth = useAuthStore((state) => state.auth)
  const [meta, setMeta] = useState<PluginMeta | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    void fetchPluginMeta().then(setMeta).catch(() => setMeta(null))
  }, [])

  const displayName =
    auth.user?.display_name?.trim() ||
    auth.user?.username?.trim() ||
    auth.user?.email?.trim() ||
    ''

  const loggedIn = Boolean(auth.user && auth.accessToken)

  function authorize() {
    if (!pluginCtx || !auth.accessToken) return
    setBusy(true)
    redirectToExternal(
      buildPluginCallbackUrl(
        pluginCtx,
        auth.accessToken,
        undefined,
        auth.accessExpiresAt ?? undefined
      )
    )
  }

  return (
    <div className='min-h-svh bg-slate-50 text-slate-900'>
      <header className='border-b border-slate-200 bg-white'>
        <div className='mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4 sm:px-6'>
          <div className='flex items-center gap-3'>
            <div className='flex size-10 items-center justify-center rounded-xl bg-blue-600 text-white'>
              <Puzzle className='size-5' />
            </div>
            <div>
              <p className='text-lg font-semibold'>NaviForge × NewAPI</p>
              <p className='text-sm text-slate-500'>{t('Extension authorization')}</p>
            </div>
          </div>
          <Link
            to='/plugin/docs'
            className='text-sm text-blue-600 underline-offset-4 hover:underline'
          >
            {t('API docs')}
          </Link>
        </div>
      </header>

      <main className='mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6'>
        {meta ? (
          <p className='rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs text-slate-500'>
            {t('Build')}: {meta.buildLabel} · {t('Version')}: {meta.version}
          </p>
        ) : null}

        {!pluginCtx ? (
          <div className='rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-950'>
            <p className='font-medium'>{t('Invalid extension authorization link')}</p>
            <p className='mt-2 text-sm'>
              {t('Open this page from the NaviForge extension, or visit the docs below.')}
            </p>
            <Button asChild className='mt-4' variant='outline'>
              <Link to='/plugin/docs'>{t('View plugin API docs')}</Link>
            </Button>
          </div>
        ) : (
          <>
            <section className='rounded-2xl border border-slate-200 bg-white p-6 shadow-sm'>
              <h1 className='text-2xl font-semibold tracking-tight'>
                {loggedIn ? t('Authorize NaviForge') : t('Sign in to authorize NaviForge')}
              </h1>
              <p className='mt-2 text-slate-600'>
                {loggedIn
                  ? t(
                      'You are signed in. Click authorize to return API access to the browser extension.'
                    )
                  : t(
                      'Use your NewAPI account below. After sign-in you will return to the extension automatically.'
                    )}
              </p>

              {loggedIn ? (
                <div className='mt-6 flex flex-col gap-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between'>
                  <div>
                    <p className='text-sm font-medium text-emerald-950'>
                      {t('Signed in as {{name}}', { name: displayName })}
                    </p>
                    <p className='text-xs text-emerald-800/80'>
                      {t('Client')}: {pluginCtx.client}
                    </p>
                  </div>
                  <Button
                    type='button'
                    size='lg'
                    className='bg-blue-600 hover:bg-blue-700'
                    disabled={busy}
                    onClick={authorize}
                  >
                    {busy ? <Loader2 className='mr-2 size-4 animate-spin' /> : null}
                    {t('Authorize extension')}
                    <ExternalLink className='ml-2 size-4' />
                  </Button>
                </div>
              ) : (
                <ol className='mt-4 list-decimal space-y-1 pl-5 text-sm text-slate-600'>
                  <li>{t('Enter your NewAPI username and password')}</li>
                  <li>{t('Click Sign in')}</li>
                  <li>{t('You will be redirected back to the extension')}</li>
                </ol>
              )}
            </section>

            {!loggedIn ? (
              <section className='rounded-2xl border border-slate-200 bg-white p-6 shadow-sm'>
                <h2 className='mb-4 text-lg font-medium'>{t('Sign in')}</h2>
                <UserAuthForm pluginSearch={search} />
              </section>
            ) : null}
          </>
        )}
      </main>
    </div>
  )
}
