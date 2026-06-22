import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { AlertTriangle, ArrowRight, Building2, Loader2 } from "lucide-react";
import Logo from "../components/Logo.jsx";
import Button from "../components/Button.jsx";
import api from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../components/Toast.jsx";

export default function AcceptInvite() {
  const { token } = useParams();
  const [params] = useSearchParams();
  const inviteToken = token ?? params.get("token") ?? "";
  const { applyAuth, refreshSession, user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [info, setInfo] = useState(null);
  const [state, setState] = useState(inviteToken ? "loading" : "error");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    if (!inviteToken) {
      setState("error");
      setError(
        "Open the invitation email again or ask your team to resend it.",
      );
      return () => {
        cancelled = true;
      };
    }

    if (!user) {
      setState("form");
      setError("");
      return () => {
        cancelled = true;
      };
    }

    setState("loading");
    setError("");
    api
      .get("/invitations/pending/")
      .then((r) => {
        if (cancelled) return;
        const invitations = r.data?.results ?? r.data ?? [];
        const invitation = invitations.find(
          (i) => String(i.token) === String(inviteToken),
        );
        setInfo(invitation ?? null);
        setState(invitation ? "form" : "error");
        if (!invitation) {
          setError(
            "This invitation may have been used, expired, or is not available for this account.",
          );
        }
      })
      .catch(() => {
        if (cancelled) return;
        setInfo(null);
        setState("form");
      });

    return () => {
      cancelled = true;
    };
  }, [inviteToken, user]);

  const submit = async (e) => {
    e.preventDefault();

    if (!user) {
      navigate(`/register?invite=${encodeURIComponent(inviteToken)}`, {
        replace: true,
      });
      return;
    }

    setLoading(true);
    setError("");

    try {
      await api.post("/invitations/accept/", { token: inviteToken });
      await refreshSession();
      toast.success("Welcome to the team.");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err?.response?.data?.error || "Could not accept invite.");
      toast.error(err?.response?.data?.error || "Could not accept invite.");
    } finally {
      setLoading(false);
    }
  };

  const organizationName = info?.organization_name || "the workspace";

  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <header className="px-4 py-5 sm:px-10 flex flex-wrap items-center justify-between gap-3">
        <Link to="/">
          <Logo size={28} withWordmark wordmarkSize="lg" />
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-3 sm:gap-4">
          {user && (
            <Link
              to="/dashboard"
              className="hidden sm:inline-flex text-sm text-ink-soft hover:text-ink"
            >
              Back to dashboard
            </Link>
          )}
          <Link
            to={
              inviteToken
                ? `/login?invite=${encodeURIComponent(inviteToken)}`
                : "/login"
            }
            className="text-sm text-ink-soft hover:text-ink"
          >
            Back to sign in
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:px-10 sm:py-10">
        <div className="w-full max-w-sm">
          {state === "loading" && (
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-paper-deep text-ink-muted">
                <Loader2 size={24} strokeWidth={1.8} className="animate-spin" />
              </div>
              <div>
                <h1 className="font-display text-3xl sm:text-4xl font-medium text-ink leading-tight tracking-tight">
                  Reading invitation
                </h1>
                <p className="mt-2 text-sm text-ink-muted">
                  Please wait while we check the workspace invite.
                </p>
              </div>
            </div>
          )}

          {state === "error" && (
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-cinnabar-50 border border-cinnabar-200 text-cinnabar-600">
                <AlertTriangle size={24} strokeWidth={1.8} />
              </div>
              <div>
                <h1 className="font-display text-3xl sm:text-4xl font-medium text-ink leading-tight tracking-tight">
                  Invitation not valid
                </h1>
                <p className="mt-2 text-sm text-ink-muted">
                  {error ||
                    "It may have been used or expired. Ask your team to resend it."}
                </p>
              </div>

              <div className="pt-2 space-y-3">
                <Button
                  as={Link}
                  to={
                    inviteToken
                      ? `/login?invite=${encodeURIComponent(inviteToken)}`
                      : "/login"
                  }
                  variant="primary"
                  size="lg"
                  className="w-full"
                >
                  Back to sign in
                </Button>
                <p className="text-xs text-ink-muted">
                  Ask your team to resend the invitation if this link should
                  still work.
                </p>
              </div>
            </div>
          )}

          {state === "form" && (
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-paper-deep text-cinnabar-600">
                <Building2 size={24} strokeWidth={1.8} />
              </div>

              <p className="mt-4 text-micro uppercase tracking-eyebrow text-ink-muted">
                You have been invited
              </p>
              <h1 className="font-display text-3xl sm:text-4xl font-medium text-ink leading-tight tracking-tight">
                Join {organizationName}
              </h1>
              <p className="mt-2 text-sm text-ink-muted">
                {user ? (
                  <>
                    Continue as{" "}
                    <span className="text-ink font-medium">{user.email}</span>{" "}
                    to join this workspace.
                  </>
                ) : (
                  "Create an account with the invited email and the workspace will be linked."
                )}
              </p>

              <form onSubmit={submit} className="mt-8 space-y-3" noValidate>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  disabled={loading}
                  iconRight={
                    loading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <ArrowRight size={16} />
                    )
                  }
                >
                  {loading
                    ? user
                      ? "Accepting invite…"
                      : "Opening registration…"
                    : user
                      ? "Join the team"
                      : "Continue to register"}
                </Button>

                <div className="flex items-center justify-center pt-1">
                  {user ? (
                    <Link
                      to="/dashboard"
                      className="text-sm text-ink-muted hover:text-ink"
                    >
                      Back to dashboard
                    </Link>
                  ) : (
                    <Link
                      to={
                        inviteToken
                          ? `/login?invite=${encodeURIComponent(inviteToken)}`
                          : "/login"
                      }
                      className="text-sm text-ink-muted hover:text-ink"
                    >
                      Back to sign in
                    </Link>
                  )}
                </div>
              </form>

              {error && (
                <p className="mt-4 text-xs text-cinnabar-600">{error}</p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
