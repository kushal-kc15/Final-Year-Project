import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Building2, Loader2 } from "lucide-react";
import Logo from "../components/Logo.jsx";
import Button from "../components/Button.jsx";
import { Input, Select } from "../components/Field.jsx";
import api from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../components/Toast.jsx";

const CURRENCIES = [
  { value: "NPR", label: "NPR — Nepali Rupee" },
  { value: "INR", label: "INR — Indian Rupee" },
  { value: "USD", label: "USD — US Dollar" },
  { value: "EUR", label: "EUR — Euro" },
];

export default function OrgSetup() {
  const { applyAuth, organization, token } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    industry: "",
    size: "SOLO",
    country: "NP",
    currency: "NPR",
  });
  const [err, setErr] = useState({});
  const [loading, setLoading] = useState(false);

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    if (organization) navigate("/dashboard", { replace: true });
  }, [navigate, organization]);

  const submit = async (e) => {
    e.preventDefault();
    setErr({});

    if (!form.name.trim()) {
      setErr({ name: "Workspace name is required." });
      return;
    }

    setLoading(true);
    try {
      // 1. Create the organisation.
      const res = await api.post("/organizations/", {
        name: form.name.trim(),
        description: form.industry.trim(),
      });
      // 2. Activate it — not silenced; a failed switch is a real error.
      await api.post(`/organizations/${res.data.id}/switch/`);
      // 3. Fetch fresh session now that active_organization is set.
      const me = await api.get("/auth/me/");
      applyAuth({
        user: me.data,
        organization:
          me.data.active_organization ?? me.data.organization ?? res.data,
        token,
        role: me.data.role ?? "OWNER",
        currency: form.currency || "NPR",
      });
      toast.success("Your workspace is ready.");
      navigate("/dashboard", { replace: true });
    } catch (e2) {
      const data = e2?.response?.data;
      if (data && typeof data === "object") {
        const fieldErrs = {};
        Object.entries(data).forEach(([k, v]) => {
          fieldErrs[k] = Array.isArray(v) ? v[0] : String(v);
        });
        setErr(fieldErrs);
        // Surface errors that have no inline form field (detail, error, non_field_errors).
        const nonFieldMsg =
          fieldErrs.detail ||
          fieldErrs.error ||
          fieldErrs.non_field_errors ||
          null;
        if (nonFieldMsg) toast.error(nonFieldMsg);
      } else {
        toast.error("Could not create workspace.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (organization) {
    return (
      <div className="min-h-screen flex flex-col bg-paper">
        <header className="px-4 py-5 sm:px-10">
          <Logo size={28} withWordmark wordmarkSize="lg" />
        </header>
        <main className="flex-1 flex items-center justify-center px-4 py-8 sm:px-10 sm:py-10">
          <div className="w-full max-w-sm text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-paper-deep text-ink-muted">
              <Building2 size={24} strokeWidth={1.8} />
            </div>
            <h1 className="mt-4 font-display text-3xl sm:text-4xl font-medium text-ink leading-tight tracking-tight">
              Workspace already set up
            </h1>
            <p className="mt-2 text-sm text-ink-muted">
              You already have a workspace. Taking you to the dashboard…
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <header className="px-4 py-5 sm:px-10 flex flex-wrap items-center justify-between gap-3">
        <Logo size={28} withWordmark wordmarkSize="lg" />
        <div className="flex items-center gap-4">
          <Link
            to="/workspace/start"
            className="text-sm text-ink-muted hover:text-ink"
          >
            ← Back
          </Link>
          <p className="text-xs text-ink-muted">
            Step 1 of 1 — set up your workspace
          </p>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:px-10 sm:py-10">
        <div className="w-full max-w-lg">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-paper-deep text-cinnabar-600">
              <Building2 size={24} strokeWidth={1.8} />
            </div>
            <h1 className="mt-4 font-display text-3xl sm:text-4xl font-medium text-ink leading-tight tracking-tight">
              Name your workspace
            </h1>
            <p className="mt-2 text-sm text-ink-muted">
              This workspace will hold your books. The workspace name and
              optional industry description are saved now. Team size, country,
              and currency are local setup preferences for your first view.
            </p>
          </div>

          <form onSubmit={submit} className="mt-8 space-y-5" noValidate>
            <Input
              label="Workspace name"
              value={form.name}
              onChange={update("name")}
              error={err.name}
              required
              placeholder="e.g. Mero Pasal, Patan"
            />

            <Input
              label="Industry or description (optional)"
              value={form.industry}
              onChange={update("industry")}
              error={err.description}
              placeholder="Retail, services, consulting…"
            />

            <div>
              <p className="mb-3 text-xs uppercase tracking-eyebrow text-ink-muted">
                Local setup preferences
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Select
                  label="Team size"
                  value={form.size}
                  onChange={update("size")}
                >
                  <option value="SOLO">Just me</option>
                  <option value="SMALL">2 – 10</option>
                  <option value="MEDIUM">11 – 50</option>
                  <option value="LARGE">50+</option>
                </Select>
                <Select
                  label="Default currency"
                  value={form.currency}
                  onChange={update("currency")}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label="Country"
                value={form.country}
                onChange={update("country")}
              >
                <option value="NP">Nepal</option>
                <option value="IN">India</option>
                <option value="US">United States</option>
                <option value="GB">United Kingdom</option>
                <option value="AU">Australia</option>
                <option value="OTHER">Other</option>
              </Select>
              <div className="hidden sm:block" />
            </div>

            <div className="pt-4">
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
                {loading ? "Creating workspace…" : "Open workspace"}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
