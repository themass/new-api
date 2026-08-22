/*
Copyright (C) 2023-2026 QuantumNous
*/
import { createFileRoute, redirect } from '@tanstack/react-router'
import { z } from 'zod'

const searchSchema = z.object({
  redirect_uri: z.string().optional(),
  client: z.string().optional(),
  state: z.string().optional(),
  redirect: z.string().optional(),
})

/** Alias for extension docs: /login?redirect_uri=chrome-extension://... */
export const Route = createFileRoute('/(auth)/login')({
  beforeLoad: ({ search }) => {
    throw redirect({
      to: '/sign-in',
      search: {
        redirect: search.redirect,
        redirect_uri: search.redirect_uri,
        client: search.client,
        state: search.state,
      },
      replace: true,
    })
  },
})
