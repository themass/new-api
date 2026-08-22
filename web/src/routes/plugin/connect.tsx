/*
Copyright (C) 2023-2026 QuantumNous
*/
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { PluginConnectPage } from '@/features/plugin/plugin-connect-page'

const searchSchema = z.object({
  redirect_uri: z.string().optional(),
  extension_id: z.string().optional(),
  client: z.string().optional(),
  state: z.string().optional(),
})

export const Route = createFileRoute('/plugin/connect')({
  validateSearch: searchSchema,
  component: PluginConnectPage,
})
