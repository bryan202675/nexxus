import { beforeEach, describe, expect, it, vi } from "vitest";
import { crearCuentaYEmpresa, nombreEmpresaDuplicado } from "../registro";
import { registrationErrorMessage, requireRegistrationSession, SESSION_REQUIRED } from "../registroSession";

const mocks = vi.hoisted(() => ({ getSession: vi.fn(), getUser: vi.fn(), from: vi.fn() }));
vi.mock("../../supabaseClient/supabaseConfig", () => ({
  supabase: { auth: { getSession: mocks.getSession, getUser: mocks.getUser }, from: mocks.from },
}));

describe("registration session validation", () => {
  beforeEach(() => vi.resetAllMocks());

  it("blocks anonymous company reads and writes before sending a database request", async () => {
    mocks.getSession.mockResolvedValue({ data: { session: null }, error: null });
    await expect(nombreEmpresaDuplicado("Test", "owner")).rejects.toThrow(SESSION_REQUIRED);
    await expect(crearCuentaYEmpresa({ uid: "owner", correo: "", nombreAdmin: "", fotoPerfil: null, empresa: {}, prefijoSeleccionado: "", checkout: {}, logo: null })).rejects.toThrow(SESSION_REQUIRED);
    expect(mocks.from).not.toHaveBeenCalled();
    expect(mocks.getUser).not.toHaveBeenCalled();
  });

  it("rejects a session belonging to a different account", async () => {
    mocks.getSession.mockResolvedValue({ data: { session: { user: { id: "other" } } }, error: null });
    await expect(requireRegistrationSession("owner")).rejects.toThrow(SESSION_REQUIRED);
    expect(mocks.getUser).not.toHaveBeenCalled();
  });

  it("rejects sessions the auth server cannot validate", async () => {
    mocks.getSession.mockResolvedValue({ data: { session: { user: { id: "owner" } } }, error: null });
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: { message: "expired" } });
    await expect(requireRegistrationSession("owner")).rejects.toThrow(SESSION_REQUIRED);
  });

  it("accepts the verified owner", async () => {
    mocks.getSession.mockResolvedValue({ data: { session: { user: { id: "owner" } } }, error: null });
    mocks.getUser.mockResolvedValue({ data: { user: { id: "owner" } }, error: null });
    await expect(requireRegistrationSession("owner")).resolves.toBeUndefined();
  });

  it("replaces raw database errors with controlled messages", () => {
    expect(registrationErrorMessage({ code: "42501", message: "raw database details" })).toMatch(/No tienes permiso/);
    expect(registrationErrorMessage(new Error("raw database details"))).not.toContain("raw database details");
  });
});
