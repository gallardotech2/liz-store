import type { SupabaseClient } from "@supabase/supabase-js"

export async function holdPayment(
  supabase: SupabaseClient,
  input: {
    orderId: number
    userId: string | null
    amount: number
    paymentMethod: string
  },
) {
  const transactionId = `TXN-${input.orderId}-${Date.now().toString(36).toUpperCase()}`

  const { data: transaction, error } = await supabase
    .from("transactions")
    .insert({
      order_id: input.orderId,
      user_id: input.userId,
      amount: input.amount,
      status: "held",
      payment_method: input.paymentMethod,
      transaction_id: transactionId,
      held_at: new Date().toISOString(),
    })
    .select("id, transaction_id, status, amount")
    .single()

  if (error) throw error

  await supabase
    .from("orders")
    .update({
      status: "paid",
      is_paid: true,
      paid_at: new Date().toISOString(),
      payment_method: input.paymentMethod,
    })
    .eq("id", input.orderId)

  return transaction
}

export async function releasePayment(
  supabase: SupabaseClient,
  transactionId: number,
) {
  const { data: transaction, error: fetchError } = await supabase
    .from("transactions")
    .update({
      status: "released",
      released_at: new Date().toISOString(),
    })
    .eq("id", transactionId)
    .eq("status", "held")
    .select("id, order_id, status")
    .single()

  if (fetchError) throw fetchError
  if (!transaction) throw new Error("Transacción no encontrada o ya procesada")

  await supabase
    .from("orders")
    .update({ status: "completed" })
    .eq("id", transaction.order_id)

  return transaction
}

export async function refundPayment(
  supabase: SupabaseClient,
  transactionId: number,
) {
  const { data: transaction, error: fetchError } = await supabase
    .from("transactions")
    .update({
      status: "refunded",
      released_at: new Date().toISOString(),
    })
    .eq("id", transactionId)
    .eq("status", "released")
    .select("id, order_id, status")
    .single()

  if (fetchError) throw fetchError
  if (!transaction) throw new Error("Transacción no encontrada o no liberada")

  await supabase
    .from("orders")
    .update({ status: "refunded" })
    .eq("id", transaction.order_id)

  return transaction
}

export async function getTransactionStatus(
  supabase: SupabaseClient,
  transactionId: number,
) {
  const { data, error } = await supabase
    .from("transactions")
    .select("id, transaction_id, status, amount, held_at, released_at, payment_method")
    .eq("id", transactionId)
    .single()

  if (error) throw error
  return data
}
