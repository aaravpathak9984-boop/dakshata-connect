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
import { registerSchema, type RegisterFormValues } from "./schemas";
import type { AuthenticationResponse } from "@/types/auth";

export function RegisterForm({
  onRegistered,
}: {
  onRegistered: (email: string, role: "Trainee" | "Trainer") => void;
}) {
  const navigate = useNavigate();
  const { setSession } = useAuth();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });

  // Watch the role input so Google Login registers under the correct selection
  const selectedRole = watch("role") || "Trainee";

  const mutation = useMutation({
    mutationFn: (values: RegisterFormValues) =>
      authApi.register({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        role: values.role,
        password: values.password,
      }),
    onSuccess: (_data, values) => onRegistered(values.email, values.role),
  });

  const googleMutation = useMutation({
    mutationFn: () => authApi.signInWithGoogle(selectedRole),
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

        <div className="grid grid-cols-2 gap-3">
          <FormField
            label="First name"
            autoComplete="given-name"
            error={errors.firstName?.message}
            {...register("firstName")}
          />
          <FormField
            label="Last name"
            autoComplete="family-name"
            error={errors.lastName?.message}
            {...register("lastName")}
          />
        </div>

        <FormField
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@university.edu"
          error={errors.email?.message}
          {...register("email")}
        />

        <div className="space-y-1.5">
          <label htmlFor="role" className="text-sm font-medium text-foreground">
            I want to join as a...
          </label>
          <select
            id="role"
            className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive"
            aria-invalid={errors.role ? "true" : undefined}
            {...register("role")}
          >
            <option value="">Select a role...</option>
            <option value="Trainee">Trainee (Student)</option>
            <option value="Trainer">Trainer (Lecturer)</option>
          </select>
          {errors.role?.message && (
            <p className="text-xs font-medium text-destructive">
              {errors.role.message}
            </p>
          )}
        </div>

        <FormField
          label="Password"
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register("password")}
        />

        <FormField
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        <Button type="submit" className="w-full" isLoading={mutation.isPending}>
          Create account
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
