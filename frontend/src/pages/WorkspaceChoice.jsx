import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Building2, LogIn } from "lucide-react";
import Logo from "../components/Logo.jsx";
import Button from "../components/Button.jsx";
import { Input } from "../components/Field.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { getInvitePath, readPendingInviteToken, storePendingInviteToken } from "../lib/inviteFlow.js";

/**
 * Extract an invite token from either a full invite URL or a raw token string.
 * Handles: https://…/invite?token=abc, https://…/accept-invite/abc, or bare "abc".
 */
function extractToken(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  try {
    const url = new URL(trimmed);
    // ?token= query param (e.g. /invite?token=abc)
    const qp = url.searchParams.get("token");
    if (qp) return qp;
    // /accept-invite/:token path segment
    const match = url.pathname.match(/\/accept-invite\/([^/?#]+)/);
    if (match) return match[1];
  } catch {
    // Not a valid URL — treat as raw token
  }
  return trimmed;
}

export default function WorkspaceChoice() {
  const { organization, memberships, switchOrganization } = useAuth();
  const navigate = useNavigate();
  const [inviteValue, setInviteValue] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [switchingId, setSwitchingId] = useState(null);
  const [pendingInviteToken] = useState(() => readPendingInviteToken());

  useEffect(() => {
    if (pendingInviteToken) {
      navigate(getInvitePath(pendingInviteToken), { replace: true });
    }
  }, [pendingInviteToken, navigate]);

  const handleJoin = (e) => {
    e.preventDefault();
    setInviteError("");
    const token = extractToken(inviteValue);
    if (!token) {
      setInviteError("Paste a valid invite link or token.");
      return;
    }
    storePendingInviteToken(token);
    navigate(`/invite?token=${encodeURIComponent(token)}`);
  };

  const chooseWorkspace = async (membership) => {
    const orgId = membership.organization_id ?? membership.organization?.id;
    if (!orgId) return;
    if (String(orgId) === String(organization?.id)) {
      navigate("/dashboard", { replace: true });
      return;
    }
    setSwitchingId(orgId);
    try {
      await switchOrganization(orgId);
      navigate("/dashboard", { replace: true });
    } finally {
      setSwitchingId(null);
    }
  };

  const hasMemberships = Array.isArray(memberships) && memberships.length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <header className="px-4 py-5 sm:px-10">
        <Logo size={28} withWordmark wordmarkSize="lg" />
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:px-10 sm:py-10">
        <div className="w-full max-w-lg">
          {/* Heading */}
          <div className="text-center">
            <h1 className="font-display text-3xl sm:text-4xl font-medium text-ink leading-tight tracking-tight">
              {hasMemberships ? "Choose workspace" : "Start your workspace"}
            </h1>
            <p className="mt-2 text-sm text-ink-muted">
              {hasMemberships
                ? "Select the organization you want to work in now."
                : "Create a workspace for your business or join one with an invite."}
            </p>
          </div>

          <div className="mt-10 space-y-4">
            {pendingInviteToken && (
              <div className="rounded-lg border border-saffron-200 bg-saffron-50 p-5">
                <p className="text-sm font-medium text-ink">
                  Continue your invitation
                </p>
                <p className="mt-1 text-sm text-saffron-800">
                  You opened an organization invite. Continue there before creating a new workspace.
                </p>
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  className="mt-4 w-full sm:w-auto"
                  onClick={() => navigate(getInvitePath(pendingInviteToken))}
                  iconRight={<ArrowRight size={15} />}
                >
                  Continue invitation
                </Button>
              </div>
            )}

            {/* ── Create workspace card ── */}
            {hasMemberships && (
              <div className="rounded-lg border border-rule bg-paper-deep p-4">
                <div className="space-y-2">
                  {memberships.map((membership) => {
                    const org = membership.organization ?? {
                      id: membership.organization_id,
                      name: membership.organization_name,
                    };
                    const active = String(org.id) === String(organization?.id);
                    return (
                      <button
                        key={membership.id ?? org.id}
                        type="button"
                        onClick={() => chooseWorkspace(membership)}
                        className="flex w-full items-center gap-3 rounded-md border border-rule bg-paper px-3 py-3 text-left transition-colors hover:bg-paper-deep focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-paper-deep text-ink-muted border border-rule">
                          <Building2 size={18} strokeWidth={1.8} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-ink">
                            {org.name}
                          </span>
                          <span className="block text-xs text-ink-muted">
                            {membership.role}{active ? " - current workspace" : ""}
                          </span>
                        </span>
                        <span className="text-xs font-medium text-ink-muted">
                          {switchingId === org.id ? "Switching..." : "Open"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="rounded-lg border border-rule bg-paper-deep p-6 hover:shadow-sm transition-shadow duration-200">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-paper text-cinnabar-600 border border-rule">
                  <Building2 size={20} strokeWidth={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink">
                    Create a workspace
                  </p>
                  <p className="mt-0.5 text-sm text-ink-muted">
                    Set up a new workspace for your team or business.
                  </p>
                </div>
              </div>
              <div className="mt-5">
                <Button
                  as={Link}
                  to="/organization/setup"
                  variant="primary"
                  size="md"
                  className="w-full sm:w-auto"
                  iconRight={<ArrowRight size={15} />}
                >
                  Create workspace
                </Button>
              </div>
            </div>

            {/* ── Join workspace card ── */}
            <div className="rounded-lg border border-rule bg-paper-deep p-6 hover:shadow-sm transition-shadow duration-200">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-paper text-ink-muted border border-rule">
                  <LogIn size={20} strokeWidth={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink">
                    Join a workspace
                  </p>
                  <p className="mt-0.5 text-sm text-ink-muted">
                    Paste an invite link or token you received from your team.
                  </p>
                </div>
              </div>
              <form onSubmit={handleJoin} className="mt-5 space-y-3" noValidate>
                <Input
                  label="Invite link or token"
                  placeholder="https://…/invite?token=… or paste the token directly"
                  value={inviteValue}
                  onChange={(e) => setInviteValue(e.target.value)}
                  error={inviteError}
                />
                <Button
                  type="submit"
                  variant="secondary"
                  size="md"
                  className="w-full sm:w-auto"
                  iconRight={<ArrowRight size={15} />}
                >
                  Join workspace
                </Button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
