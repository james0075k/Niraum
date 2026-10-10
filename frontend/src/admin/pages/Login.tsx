import { useNavigate, useSearchParams } from 'react-router-dom';
import { safeNext } from '../auth/safeNext';
import { AuthCard } from '../components/AuthCard';
import { LoginForm } from '../components/LoginForm';

/** Admin sign-in. `useLogin` stores the user in the `ME_KEY` cache, then we go to `?next=`. */
export default function Login() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));

  return (
    <AuthCard title="Sign in" description="Admin panel">
      <LoginForm onSuccess={() => navigate(next, { replace: true })} />
    </AuthCard>
  );
}
