/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.
*/

export type PluginLoginContext = {
  redirectUri: string
  client: string
  state?: string
}

const PLUGIN_CLIENT = 'naviforge-extension'

export function parsePluginLoginContext(search: Record<string, unknown>): PluginLoginContext | null {
  const redirectUri =
    typeof search.redirect_uri === 'string'
      ? search.redirect_uri.trim()
      : typeof search.redirectUri === 'string'
        ? search.redirectUri.trim()
        : ''
  const client =
    typeof search.client === 'string' ? search.client.trim() : ''
  if (!redirectUri || client !== PLUGIN_CLIENT) return null
  if (!isAllowedPluginRedirectUri(redirectUri)) return null
  const state = typeof search.state === 'string' ? search.state : undefined
  return { redirectUri, client, state }
}

export function isAllowedPluginRedirectUri(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'chrome-extension:' && Boolean(url.hostname)
  } catch {
    return false
  }
}

export function buildPluginCallbackUrl(
  ctx: PluginLoginContext,
  accessToken: string,
  refreshToken?: string,
  expiresAt?: number
): string {
  const target = new URL(ctx.redirectUri)
  target.searchParams.set('token', accessToken)
  if (refreshToken) target.searchParams.set('refresh', refreshToken)
  if (ctx.state) target.searchParams.set('state', ctx.state)
  if (expiresAt && expiresAt > 0) {
    const expiresIn = Math.max(60, Math.floor((expiresAt - Date.now()) / 1000))
    target.searchParams.set('expires_in', String(expiresIn))
  }
  return target.toString()
}

/** Navigate to chrome-extension:// or other external callback (never use router redirect). */
export function redirectToExternal(url: string): void {
  window.location.assign(url)
}
