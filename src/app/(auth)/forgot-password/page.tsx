import { redirect } from 'next/navigation'

/** Password resets are handled by the workspace owner (Settings → Team) or the platform admin (Users). */
export default function ForgotPasswordPage() {
  redirect('/login')
}
