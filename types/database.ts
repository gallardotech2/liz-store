export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ---------------------------------------------------------------------------
// Enums (Django TextChoices → union types)
// ---------------------------------------------------------------------------
export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'preparing'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'refunded'

export type TransactionStatus =
  | 'held'
  | 'released'
  | 'refunded'
  | 'cancelled'

export type QRType =
  | 'escudo'
  | 'direct'

export type LiveSessionStatus =
  | 'not_started'
  | 'live'
  | 'paused'
  | 'ended'

export type LiveProductStatus =
  | 'available'
  | 'requested'
  | 'reserved'
  | 'sold'

export type ProductInterestAction =
  | 'whatsapp'
  | 'view'
  | 'add_cart'
  | 'checkout'

export type WhatsappRequestStatus =
  | 'pending'
  | 'pending_payment'
  | 'payment_confirmed'
  | 'preparing'
  | 'in_package'
  | 'ready_for_pickup'
  | 'shipped'
  | 'delivered'
  | 'cancelled'

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------
export interface ProfilesTable {
  Row: {
    id: string
    phone: string
    avatar: string | null
    nombre: string
    role: string
    is_verified: boolean
    email_verified: boolean
    created_at: string
    updated_at: string
  }
  Insert: {
    id: string
    phone?: string
    avatar?: string | null
    nombre?: string
    role?: string
    is_verified?: boolean
    email_verified?: boolean
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    phone?: string
    avatar?: string | null
    nombre?: string
    role?: string
    is_verified?: boolean
    email_verified?: boolean
    created_at?: string
    updated_at?: string
  }
}

export interface AddressesTable {
  Row: {
    id: number
    user_id: string
    name: string
    phone: string
    street: string
    colony: string
    city: string
    state: string
    zip_code: string
    references: string
    is_default: boolean
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: number
    user_id: string
    name: string
    phone: string
    street: string
    colony: string
    city: string
    state: string
    zip_code: string
    references?: string
    is_default?: boolean
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: number
    user_id?: string
    name?: string
    phone?: string
    street?: string
    colony?: string
    city?: string
    state?: string
    zip_code?: string
    references?: string
    is_default?: boolean
    created_at?: string
    updated_at?: string
  }
}

export interface CategoriesTable {
  Row: {
    id: number
    name: string
    slug: string
    description: string
    image: string | null
    icon: string
    is_active: boolean
    order: number
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: number
    name: string
    slug: string
    description?: string
    image?: string | null
    icon?: string
    is_active?: boolean
    order?: number
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: number
    name?: string
    slug?: string
    description?: string
    image?: string | null
    icon?: string
    is_active?: boolean
    order?: number
    created_at?: string
    updated_at?: string
  }
}

export interface ProductsTable {
  Row: {
    id: number
    name: string
    slug: string
    sku: string
    category_id: number
    price: number
    discount_price: number | null
    stock: number
    short_description: string
    long_description: string
    specifications: Json
    is_active: boolean
    is_featured: boolean
    is_new: boolean
    rating: number
    rating_count: number
    sales_count: number
    meta_description: string
    meta_keywords: string
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: number
    name: string
    slug: string
    sku: string
    category_id: number
    price: number
    discount_price?: number | null
    stock?: number
    short_description?: string
    long_description?: string
    specifications?: Json
    is_active?: boolean
    is_featured?: boolean
    is_new?: boolean
    rating?: number
    rating_count?: number
    sales_count?: number
    meta_description?: string
    meta_keywords?: string
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: number
    name?: string
    slug?: string
    sku?: string
    category_id?: number
    price?: number
    discount_price?: number | null
    stock?: number
    short_description?: string
    long_description?: string
    specifications?: Json
    is_active?: boolean
    is_featured?: boolean
    is_new?: boolean
    rating?: number
    rating_count?: number
    sales_count?: number
    meta_description?: string
    meta_keywords?: string
    created_at?: string
    updated_at?: string
  }
}

export interface ProductImagesTable {
  Row: {
    id: number
    product_id: number
    image: string
    alt_text: string
    is_main: boolean
    order: number
    created_at: string
  }
  Insert: {
    id?: number
    product_id: number
    image: string
    alt_text?: string
    is_main?: boolean
    order?: number
    created_at?: string
  }
  Update: {
    id?: number
    product_id?: number
    image?: string
    alt_text?: string
    is_main?: boolean
    order?: number
    created_at?: string
  }
}

export interface OrdersTable {
  Row: {
    id: number
    user_id: string | null
    sessionKey: string | null
    order_number: string
    status: OrderStatus
    subtotal: number
    shipping_cost: number
    discount: number
    total: number
    shipping_address: Json | null
    notes: string
    is_paid: boolean
    paid_at: string | null
    payment_method: string
    delivery_latitude: number | null
    delivery_longitude: number | null
    delivery_address_text: string
    delivery_reference: string
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: number
    user_id?: string | null
    sessionKey?: string | null
    order_number: string
    status?: OrderStatus
    subtotal: number
    shipping_cost?: number
    discount?: number
    total: number
    shipping_address?: Json | null
    notes?: string
    is_paid?: boolean
    paid_at?: string | null
    payment_method?: string
    delivery_latitude?: number | null
    delivery_longitude?: number | null
    delivery_address_text?: string
    delivery_reference?: string
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: number
    user_id?: string | null
    sessionKey?: string | null
    order_number?: string
    status?: OrderStatus
    subtotal?: number
    shipping_cost?: number
    discount?: number
    total?: number
    shipping_address?: Json | null
    notes?: string
    is_paid?: boolean
    paid_at?: string | null
    payment_method?: string
    delivery_latitude?: number | null
    delivery_longitude?: number | null
    delivery_address_text?: string
    delivery_reference?: string
    created_at?: string
    updated_at?: string
  }
}

export interface OrderItemsTable {
  Row: {
    id: number
    order_id: number
    product_id: number | null
    product_name: string
    product_sku: string
    product_image: string
    quantity: number
    price: number
    subtotal: number
    created_at: string
  }
  Insert: {
    id?: number
    order_id: number
    product_id?: number | null
    product_name: string
    product_sku: string
    product_image?: string
    quantity: number
    price: number
    subtotal: number
    created_at?: string
  }
  Update: {
    id?: number
    order_id?: number
    product_id?: number | null
    product_name?: string
    product_sku?: string
    product_image?: string
    quantity?: number
    price?: number
    subtotal?: number
    created_at?: string
  }
}

export interface TransactionsTable {
  Row: {
    id: number
    order_id: number
    user_id: string | null
    amount: number
    status: TransactionStatus
    payment_method: string
    transaction_id: string
    held_at: string
    released_at: string | null
    notes: string
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: number
    order_id: number
    user_id?: string | null
    amount: number
    status?: TransactionStatus
    payment_method?: string
    transaction_id?: string
    held_at?: string
    released_at?: string | null
    notes?: string
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: number
    order_id?: number
    user_id?: string | null
    amount?: number
    status?: TransactionStatus
    payment_method?: string
    transaction_id?: string
    held_at?: string
    released_at?: string | null
    notes?: string
    created_at?: string
    updated_at?: string
  }
}

export interface PaymentMethodsTable {
  Row: {
    id: number
    name: string
    code: string
    description: string
    icon: string
    is_active: boolean
    order: number
    config: Json
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: number
    name: string
    code: string
    description?: string
    icon?: string
    is_active?: boolean
    order?: number
    config?: Json
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: number
    name?: string
    code?: string
    description?: string
    icon?: string
    is_active?: boolean
    order?: number
    config?: Json
    created_at?: string
    updated_at?: string
  }
}

export interface QRPaymentsTable {
  Row: {
    id: number
    payment_methodId: number
    qrType: QRType
    qrImage: string | null
    qrCode: string
    accountName: string
    accountNumber: string
    bankName: string
    is_active: boolean
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: number
    payment_methodId: number
    qrType: QRType
    qrImage?: string | null
    qrCode?: string
    accountName?: string
    accountNumber?: string
    bankName?: string
    is_active?: boolean
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: number
    payment_methodId?: number
    qrType?: QRType
    qrImage?: string | null
    qrCode?: string
    accountName?: string
    accountNumber?: string
    bankName?: string
    is_active?: boolean
    created_at?: string
    updated_at?: string
  }
}

export interface ReviewsTable {
  Row: {
    id: number
    product_id: number
    user_id: string | null
    sessionKey: string | null
    title: string
    content: string
    rating: number
    is_verified: boolean
    isApproved: boolean
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: number
    product_id: number
    user_id?: string | null
    sessionKey?: string | null
    title?: string
    content?: string
    rating: number
    is_verified?: boolean
    isApproved?: boolean
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: number
    product_id?: number
    user_id?: string | null
    sessionKey?: string | null
    title?: string
    content?: string
    rating?: number
    is_verified?: boolean
    isApproved?: boolean
    created_at?: string
    updated_at?: string
  }
}

export interface ReviewImagesTable {
  Row: {
    id: number
    reviewId: number
    image: string
    created_at: string
  }
  Insert: {
    id?: number
    reviewId: number
    image: string
    created_at?: string
  }
  Update: {
    id?: number
    reviewId?: number
    image?: string
    created_at?: string
  }
}

export interface StoreProfilesTable {
  Row: {
    id: number
    name: string
    logo: string | null
    banner: string | null
    followers: number
    likes: number
    rating: number
    reviewsCount: number
    customersServed: number
    qrCode: string | null
    accountName: string
    accountNumber: string
    bankName: string
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: number
    name?: string
    logo?: string | null
    banner?: string | null
    followers?: number
    likes?: number
    rating?: number
    reviewsCount?: number
    customersServed?: number
    qrCode?: string | null
    accountName?: string
    accountNumber?: string
    bankName?: string
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: number
    name?: string
    logo?: string | null
    banner?: string | null
    followers?: number
    likes?: number
    rating?: number
    reviewsCount?: number
    customersServed?: number
    qrCode?: string | null
    accountName?: string
    accountNumber?: string
    bankName?: string
    created_at?: string
    updated_at?: string
  }
}

export interface LiveSessionsTable {
  Row: {
    id: number
    store_id: number | null
    title: string
    status: LiveSessionStatus
    started_at: string | null
    ended_at: string | null
    duration: string | null
    current_product_id: number | null
    total_products_shown: number
    total_products_sold: number
    total_reserved: number
    total_interested: number
    total_likes: number
    total_followers: number
    notes: string
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: number
    store_id?: number | null
    title: string
    status?: LiveSessionStatus
    started_at?: string | null
    ended_at?: string | null
    duration?: string | null
    current_product_id?: number | null
    total_products_shown?: number
    total_products_sold?: number
    total_reserved?: number
    total_interested?: number
    total_likes?: number
    total_followers?: number
    notes?: string
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: number
    store_id?: number | null
    title?: string
    status?: LiveSessionStatus
    started_at?: string | null
    ended_at?: string | null
    duration?: string | null
    current_product_id?: number | null
    total_products_shown?: number
    total_products_sold?: number
    total_reserved?: number
    total_interested?: number
    total_likes?: number
    total_followers?: number
    notes?: string
    created_at?: string
    updated_at?: string
  }
}

export interface LiveSessionProductsTable {
  Row: {
    live_session_id: number
    product_id: number
  }
  Insert: {
    live_session_id: number
    product_id: number
  }
  Update: {
    live_session_id?: number
    product_id?: number
  }
}

export interface LiveProductsTable {
  Row: {
    id: number
    session_id: number
    product_id: number
    status: LiveProductStatus
    order: number
    added_at: string
    created_at: string
  }
  Insert: {
    id?: number
    session_id: number
    product_id: number
    status?: LiveProductStatus
    order?: number
    added_at?: string
    created_at?: string
  }
  Update: {
    id?: number
    session_id?: number
    product_id?: number
    status?: LiveProductStatus
    order?: number
    added_at?: string
    created_at?: string
  }
}

export interface ProductInterestsTable {
  Row: {
    id: number
    session_id: number
    product_id: number
    action: ProductInterestAction
    created_at: string
  }
  Insert: {
    id?: number
    session_id: number
    product_id: number
    action: ProductInterestAction
    created_at?: string
  }
  Update: {
    id?: number
    session_id?: number
    product_id?: number
    action?: ProductInterestAction
    created_at?: string
  }
}

export interface PickupPointsTable {
  Row: {
    id: number
    name: string
    address: string
    schedule: string
    google_maps_url: string
    is_active: boolean
    order: number
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: number
    name: string
    address?: string
    schedule?: string
    google_maps_url?: string
    is_active?: boolean
    order?: number
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: number
    name?: string
    address?: string
    schedule?: string
    google_maps_url?: string
    is_active?: boolean
    order?: number
    created_at?: string
    updated_at?: string
  }
}

export interface AdminAuthorizedTable {
  Row: {
    id: number
    user_id: string
    email: string
    role: string
    otpEnabled: boolean
    is_active: boolean
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: number
    user_id: string
    email: string
    role?: string
    otpEnabled?: boolean
    is_active?: boolean
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: number
    user_id?: string
    email?: string
    role?: string
    otpEnabled?: boolean
    is_active?: boolean
    created_at?: string
    updated_at?: string
  }
}

export interface WhatsappRequestsTable {
  Row: {
    id: number
    user_id: string
    product_id: number
    product_name: string
    product_image: string
    product_price: number | null
    reference_code: string
    status: WhatsappRequestStatus
    notes: string
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: number
    user_id: string
    product_id: number
    product_name: string
    product_image?: string
    product_price?: number | null
    reference_code: string
    status?: WhatsappRequestStatus
    notes?: string
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: number
    user_id?: string
    product_id?: number
    product_name?: string
    product_image?: string
    product_price?: number | null
    reference_code?: string
    status?: WhatsappRequestStatus
    notes?: string
    created_at?: string
    updated_at?: string
  }
}

export interface SocialLinksTable {
  Row: {
    id: number
    platform: string
    label: string
    url: string
    is_active: boolean
    updated_at: string
  }
  Insert: {
    id?: number
    platform: string
    label: string
    url?: string
    is_active?: boolean
    updated_at?: string
  }
  Update: {
    id?: number
    platform?: string
    label?: string
    url?: string
    is_active?: boolean
    updated_at?: string
  }
}

// ---------------------------------------------------------------------------
// Database interface completa (estilo Supabase)
// ---------------------------------------------------------------------------
export interface Database {
  public: {
    Tables: {
      profiles: ProfilesTable
      addresses: AddressesTable
      categories: CategoriesTable
      products: ProductsTable
      product_images: ProductImagesTable
      orders: OrdersTable
      order_items: OrderItemsTable
      transactions: TransactionsTable
      payment_methods: PaymentMethodsTable
      qr_payments: QRPaymentsTable
      reviews: ReviewsTable
      review_images: ReviewImagesTable
      store_profiles: StoreProfilesTable
      live_sessions: LiveSessionsTable
      live_session_products: LiveSessionProductsTable
      live_products: LiveProductsTable
      product_interests: ProductInterestsTable
      pickup_points: PickupPointsTable,
      admin_authorized: AdminAuthorizedTable,
      whatsapp_requests: WhatsappRequestsTable
      social_links: SocialLinksTable
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}
