/*
Copyright (C) 2023-2026 QuantumNous
*/
import { createFileRoute } from '@tanstack/react-router'

import { PluginDocsPage } from '@/features/plugin/plugin-docs-page'

export const Route = createFileRoute('/plugin/docs')({
  component: PluginDocsPage,
})
