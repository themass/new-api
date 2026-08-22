/*
Copyright (C) 2023-2026 QuantumNous
*/
import { api } from '@/lib/api'

export type PluginEndpointDoc = {
  method: string
  path: string
  auth: boolean
  description: string
}

export type PluginMeta = {
  version: string
  buildLabel: string
  client: string
  pages: { connect: string; docs: string }
  endpoints: PluginEndpointDoc[]
  defaults: { chatModel: string; ocrModel: string }
}

export async function fetchPluginMeta(): Promise<PluginMeta> {
  const res = await api.get<PluginMeta>('/api/plugin/meta')
  return res.data
}

export async function fetchPluginBootstrap(token: string): Promise<unknown> {
  const res = await api.get('/api/plugin/bootstrap', {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.data
}
