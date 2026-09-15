import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Registro from "../index";

const mocks = vi.hoisted(() => ({ invoke: vi.fn(), verifyOtp: vi.fn() }));
vi.mock("../../../../context/AuthContext", () => ({
  useAuth: () => ({ user: null, loading: false, rol: "", esSuperAdmin: false, esAdminEmpresa: false }),
}));
vi.mock("../../../../supabaseClient/supabaseConfig", () => ({
  supabase: { auth: { verifyOtp: mocks.verifyOtp }, functions: { invoke: mocks.invoke } },
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

  it("requests a six-digit email confirmation code before continuing", async () => {
    await submitRegistration();
    expect(await screen.findByRole("heading", { name: "Confirma tu correo" })).toBeInTheDocument();
    expect(screen.queryByText("Elige tu plan")).not.toBeInTheDocument();
    expect(mocks.invoke).toHaveBeenCalledWith("registrar-cuenta-con-codigo", expect.objectContaining({
      body: expect.objectContaining({ correo: "test@example.com", nombre: "Test Admin" }),
    }));
  });
});
