import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Registro from "../index";

const mocks = vi.hoisted(() => ({ signUp: vi.fn(), invoke: vi.fn() }));
vi.mock("../../../../context/AuthContext", () => ({
  useAuth: () => ({ user: null, loading: false, rol: "", esSuperAdmin: false, esAdminEmpresa: false }),
}));
vi.mock("../../../../supabaseClient/supabaseConfig", () => ({
  supabase: { auth: { signUp: mocks.signUp }, functions: { invoke: mocks.invoke } },
}));

async function submitRegistration() {
  render(<MemoryRouter><Registro /></MemoryRouter>);
  fireEvent.change(screen.getByLabelText("Nombre completo*"), { target: { value: "Test Admin" } });
  fireEvent.change(screen.getByLabelText("Correo*"), { target: { value: "test@example.com" } });
  const password = crypto.randomUUID() + "Aa1!";
  fireEvent.change(screen.getByLabelText("Contraseña*"), { target: { value: password } });
  fireEvent.change(screen.getByLabelText("Confirmar contraseña*"), { target: { value: password } });
  await act(async () => {
    fireEvent.submit(screen.getByLabelText("Correo*").closest("form")!);
  });
}

describe("Registro authentication gate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.invoke.mockResolvedValue({ error: null });
  });

  it("waits for email confirmation when signUp returns a user without a session", async () => {
    mocks.signUp.mockResolvedValue({ data: { user: { id: "test-user" }, session: null }, error: null });
    await submitRegistration();
    expect(await screen.findByRole("heading", { name: "Confirma tu correo" })).toBeInTheDocument();
    expect(screen.queryByText("Elige tu plan")).not.toBeInTheDocument();
    expect(mocks.invoke).not.toHaveBeenCalled();
    expect(mocks.signUp).toHaveBeenCalledWith(expect.objectContaining({
      options: expect.objectContaining({ emailRedirectTo: `${window.location.origin}/auth/registro` }),
    }));
  });

  it("continues to checkout when signUp creates an authenticated session", async () => {
    mocks.signUp.mockResolvedValue({ data: { user: { id: "test-user", email: "test@example.com" }, session: { user: { id: "test-user" } } }, error: null });
    await submitRegistration();
    expect(await screen.findByText("Elige tu plan")).toBeInTheDocument();
    expect(mocks.invoke).toHaveBeenCalledWith("send-welcome-email");
  });
});
