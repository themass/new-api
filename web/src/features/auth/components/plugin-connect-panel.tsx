/*
Copyright (C) 2023-2026 QuantumNous
*/
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import {
  buildPluginCallbackUrl,
  redirectToExternal,
  type PluginLoginContext,
} from '@/features/auth/lib/plugin-redirect'
import { useAuthStore } from '@/stores/auth-store'

type PluginConnectPanelProps = {
  pluginCtx: PluginLoginContext
}

export function PluginConnectPanel({ pluginCtx }: PluginConnectPanelProps) {
  const { t } = useTranslation()
  const auth = useAuthStore((state) => state.auth)
  const [busy, setBusy] = useState(false)

  const displayName =
    auth.user?.display_name?.trim() ||
    auth.user?.username?.trim() ||
    auth.user?.email?.trim() ||
    ''

  function completeAuthorization() {
    if (!auth.accessToken) return
    setBusy(true)
    const callback = buildPluginCallbackUrl(
      pluginCtx,
      auth.accessToken,
      undefined,
      auth.accessExpiresAt ?? undefined
    )
    redirectToExternal(callback)
  }

  const loggedIn = Boolean(auth.user && auth.accessToken)

  return (
    <div className='border-primary/30 bg-primary/5 mb-6 space-y-3 rounded-xl border p-4'>
      <div className='space-y-1'>
        <p className='text-primary text-sm font-semibold'>
          {t('NaviForge extension authorization')}
        </p>
        <p className='text-muted-foreground text-sm'>
          {loggedIn
            ? t(
                'You are signed in. Complete authorization to return API access to the extension.'
              )
            : t(
                'Sign in below to authorize the browser extension. We will redirect you back automatically.'
              )}
        </p>
      </div>

      {loggedIn ? (
        <div className='bg-background/80 flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between'>
          <div className='text-sm'>
            <p className='font-medium'>{t('Signed in as {{name}}', { name: displayName })}</p>
            <p className='text-muted-foreground text-xs'>
              {t('Client')}: {pluginCtx.client}
            </p>
          </div>
          <Button type='button' disabled={busy} onClick={completeAuthorization}>
            {busy ? <Loader2 className='mr-2 size-4 animate-spin' /> : null}
            {t('Authorize extension')}
          </Button>
        </div>
      ) : (
        <p className='text-muted-foreground text-xs'>
          {t('Use your NewAPI account credentials in the form below.')}
        </p>
      )}
    </div>
  )
}
