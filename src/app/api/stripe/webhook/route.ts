// src/app/api/stripe/webhook/route.ts

import { NextRequest, NextResponse } from 'next/server'
// import Stripe from 'stripe'
// import { createClient } from '@/supabase/server'

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
//  apiVersion: '2023-10-16',
// })

export async function POST(req: NextRequest) {
    try {
        const body = await req.text()
        const signature = req.headers.get('stripe-signature') as string

        // Validate signature (Requires STRIPE_WEBHOOK_SECRET)
        // let event: Stripe.Event
        // try {
        //   event = stripe.webhooks.constructEvent(
        //     body,
        //     signature,
        //     process.env.STRIPE_WEBHOOK_SECRET as string
        //   )
        // } catch (err: any) {
        //   return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
        // }

        // Parse the event body manually for now since we don't have stripe installed
        const event = JSON.parse(body)

        // Handle the event
        switch (event.type) {
            case 'checkout.session.completed':
                // const session = event.data.object as Stripe.Checkout.Session
                // TODO: Map to supabase customer & fullfill access using session.client_reference_id
                console.log('Payment checkout completed:', event.data.object.id)
                break
            case 'customer.subscription.created':
            case 'customer.subscription.updated':
            case 'customer.subscription.deleted':
                // const subscription = event.data.object as Stripe.Subscription
                // TODO: Update subscription status in Supabase `subscriptions` table
                console.log(`Subscription ${event.type} for customer:`, event.data.object.customer)
                break
            default:
                console.log(`Unhandled event type ${event.type}`)
        }

        return NextResponse.json({ received: true }, { status: 200 })
    } catch (error) {
        console.error('Stripe webhook error:', error)
        return NextResponse.json(
            { error: 'Internal server error processing webhook' },
            { status: 500 }
        )
    }
}
