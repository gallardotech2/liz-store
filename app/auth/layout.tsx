import { BasicLayout } from "@/components/layout/BasicLayout"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <BasicLayout>{children}</BasicLayout>
}