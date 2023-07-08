import React, { useEffect, useState } from "react"
import {
  PaymentElement,
  LinkAuthenticationElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js"

import { StripePaymentElementOptions } from "@stripe/stripe-js"
import Button from "./button"
import useGlobalStore from "../store"

export default function CheckoutForm() {
  const stripe = useStripe()
  const elements = useElements()

  const [email, setEmail] = useState("")
  const [message, setMessage] = useState<string | null | undefined>(null)
  const [isLoading, setIsLoading] = useState(false)

  const { cart, emptyCart } = useGlobalStore()

  useEffect(() => {
    if (!stripe) {
      return
    }

    const clientSecret = new URLSearchParams(window.location.search).get(
      "payment_intent_client_secret"
    )

    if (!clientSecret) {
      return
    }

    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      if (!paymentIntent) return
      switch (paymentIntent.status) {
        case "succeeded":
          setMessage("Payment succeeded!")
          break
        case "processing":
          setMessage("Your payment is processing.")
          break
        case "requires_payment_method":
          setMessage("Your payment was not successful, please try again.")
          break
        default:
          setMessage("Something went wrong.")
          break
      }
    })
  }, [stripe])

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsLoading(true)

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: "http://localhost:5173/success",
      },
    })

    emptyCart()

    if (error.type === "card_error" || error.type === "validation_error") {
      setMessage(error.message)
    } else {
      setMessage("An unexpected error occurred.")
    }

    setIsLoading(false)
  }

  const paymentElementOptions: StripePaymentElementOptions = {
    layout: "tabs",
  }

  return (
        // @ts-ignore
    <form id="payment-form" onSubmit={handleSubmit}>
      <LinkAuthenticationElement
        id="link-authentication-element"
        // @ts-ignore
        onChange={(e) => setEmail(e.target.value)}
      />
      <PaymentElement id="payment-element" options={paymentElementOptions} />
    
      <div className="flex justify-end">
        <Button
          id="submit"
          disabled={isLoading || !stripe || !elements}
          className="mt-7"
        >
          <span id="button-text">
            {isLoading ? (
              <div className="spinner" id="spinner">
                Processing
              </div>
            ) : (
              "Pay now"
            )}
          </span>
        </Button>
      </div>
      {message && <div id="payment-message">{message}</div>}
    </form>
  )
}
