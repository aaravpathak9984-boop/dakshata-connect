import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Alert } from "@/components/ui/alert";
import { authApi } from "@/services/authApi";
import { getApiErrorMessage } from "@/lib/apiError";
import { useAuth } from "@/context/AuthContext";
import { loginSchema, type LoginFormValues } from "./schemas";
import type { AuthenticationResponse } from "@/types/auth";

export function LoginForm() {
  const navigate = useNavigate();
  const { setSession } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const mutation = useMutation({
    mutationFn: (values: LoginFormValues) => authApi.login(values),
    onSuccess: (data: AuthenticationResponse) => {
      setSession(data.user);
      // Land on "/" so the role-aware redirect routes admins to the control center.
      navigate("/", { replace: true });
    },
  });

  const googleMutation = useMutation({
    mutationFn: () => authApi.signInWithGoogle("Trainee"),
    onSuccess: (data: AuthenticationResponse) => {
      setSession(data.user);
      navigate("/", { replace: true });
    },
  });

  const errorMsg = mutation.error || googleMutation.error;

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-4" noValidate>
        {errorMsg && <Alert>{getApiErrorMessage(errorMsg)}</Alert>}

        <FormField
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@university.edu"
          error={errors.email?.message}
          {...register("email")}
        />

        <FormField
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register("password")}
        />

        <Button type="submit" className="w-full" isLoading={mutation.isPending}>
          Sign in
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => googleMutation.mutate()}
        isLoading={googleMutation.isPending}
      >
        <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
        Google
      </Button>
    </div>
  );
}
