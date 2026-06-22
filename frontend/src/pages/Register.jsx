import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Check, Eye, EyeOff } from "lucide-react";
import Logo from "../components/Logo.jsx";
import Button from "../components/Button.jsx";
import { Input } from "../components/Field.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../components/Toast.jsx";

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const inviteToken = params.get("invite");

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    password2: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const pw = form.password;
  const pwChecks = useMemo(
    () => [
      { ok: pw.length >= 8, label: "8 characters or more" },
      {
        ok: /[A-Z]/.test(pw) && /[a-z]/.test(pw),
        label: "Upper and lower case",
      },
      { ok: /\d/.test(pw), label: "A number" },
    ],
    [pw],
  );
  const pwOk = pwChecks.every((c) => c.ok);

  const submit = async (e) => {
    e.preventDefault();
    setErrors({});

    const next = {};
    if (!form.full_name.trim()) next.full_name = "Tell us your name";
    if (!form.email.trim()) next.email = "Email is required";
    if (!form.password) next.password = "Password is required";
    if (form.password && form.password.length < 8)
      next.password = "Use at least 8 characters";
    if (form.password !== form.password2)
      next.password2 = "Passwords do not match";
    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }

    setLoading(true);
    try {
      await register({
        username: form.email.trim().toLowerCase().split("@")[0],
        first_name: form.full_name.trim().split(/\s+/)[0] ?? "",
        last_name: form.full_name.trim().trim().split(/\s+/).slice(1).join(" "),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        password2: form.password2,
        invite_token: inviteToken || undefined,
      });

      toast.success("Account created. Check your email to verify it.");
      navigate(
        inviteToken
          ? `/login?invite=${encodeURIComponent(inviteToken)}`
          : "/login",
        { replace: true },
      );
    } catch (err) {
      const data = err?.response?.data;
      if (data && typeof data === "object") {
        const fieldErrs = {};
        Object.entries(data).forEach(([k, v]) => {
          fieldErrs[k] = Array.isArray(v) ? v[0] : String(v);
        });
        setErrors(fieldErrs);
        toast.error(fieldErrs.detail || "Please check the form.");
      } else {
        toast.error("Something went wrong. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <header className="px-4 py-5 sm:px-10 flex flex-wrap items-center justify-between gap-3">
        <Link to="/">
          <Logo size={28} withWordmark wordmarkSize="lg" />
        </Link>
        <Link to="/login" className="text-sm text-ink-soft hover:text-ink">
          Already have an account?{" "}
          <span className="text-cinnabar-600 font-medium">Sign in</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:px-10 sm:py-10">
        <div className="w-full max-w-sm">
          <div className="text-center">
            <h1 className="font-display text-3xl sm:text-4xl font-medium text-ink leading-tight tracking-tight">
              Create your account
            </h1>
            <p className="mt-2 text-sm text-ink-muted">
              Set up your account to start recording expenses.
            </p>

            {inviteToken ? (
              <p className="mt-3 text-xs text-ink-muted">
                You’re registering with an invite link.
              </p>
            ) : null}
          </div>

          <form onSubmit={submit} className="mt-8 space-y-5" noValidate>
            <Input
              label="Full name"
              value={form.full_name}
              onChange={update("full_name")}
              error={errors.full_name}
              autoComplete="name"
              required
              placeholder="Your name"
            />

            <Input
              type="email"
              label="Email"
              value={form.email}
              onChange={update("email")}
              error={errors.email}
              autoComplete="email"
              required
              placeholder="you@company.com"
            />

            <Input
              type={showPw ? "text" : "password"}
              label="Password"
              value={form.password}
              onChange={update("password")}
              error={errors.password}
              autoComplete="new-password"
              required
              placeholder="At least 8 characters"
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="inline-flex items-center justify-center text-ink-muted hover:text-ink w-7 h-7 rounded-full"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? (
                    <EyeOff size={16} strokeWidth={1.8} />
                  ) : (
                    <Eye size={16} strokeWidth={1.8} />
                  )}
                </button>
              }
            />

            <Input
              type={showPw2 ? "text" : "password"}
              label="Confirm password"
              value={form.password2}
              onChange={update("password2")}
              error={errors.password2}
              autoComplete="new-password"
              required
              placeholder="Re-type your password"
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPw2((s) => !s)}
                  className="inline-flex items-center justify-center text-ink-muted hover:text-ink w-7 h-7 rounded-full"
                  aria-label={showPw2 ? "Hide password" : "Show password"}
                >
                  {showPw2 ? (
                    <EyeOff size={16} strokeWidth={1.8} />
                  ) : (
                    <Eye size={16} strokeWidth={1.8} />
                  )}
                </button>
              }
            />

            {(form.password || errors.password) && (
              <ul className="grid grid-cols-1 gap-1 text-xs text-ink-muted -mt-2">
                {pwChecks.map((c) => (
                  <li key={c.label} className="flex items-center gap-1.5">
                    <Check
                      size={12}
                      className={c.ok ? "text-moss-600" : "text-ink-faint"}
                      strokeWidth={2}
                    />
                    <span className={c.ok ? "text-ink-soft" : ""}>
                      {c.label}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={loading || !pwOk}
              iconRight={!loading && <ArrowRight size={16} />}
            >
              {loading ? "Creating account…" : "Create account"}
            </Button>

            <p className="text-xs text-ink-muted text-center">
              By creating an account you agree to keep honest records.
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}
