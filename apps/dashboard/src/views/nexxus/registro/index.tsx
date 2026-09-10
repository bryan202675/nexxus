import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import {
  MdCreditCard,
  MdOutlineAccountBalance,
  MdOutlinePhoneIphone,
  MdLink,
  MdCheckCircle,
} from "react-icons/md";
import InputField from "components/fields/InputField";
import { supabase } from "supabaseClient/supabaseConfig";
import { useAuth } from "context/AuthContext";
import {
  PLAN_CATALOG,
  PLAN_NAMES,
  priceFor,
  money,
  purchaseId as generarPurchaseId,
  formatCard,
  formatExpiry,
  validarCheckout,
} from "services/checkout";
import {
  FALLBACK_COUNTRIES,
  formatPhoneNumber,
  limpiarTexto,
  nombreEmpresaDuplicado,
  reglasPassword,
  seguridadPassword,
  traducirErrorAuth,
  validarCorreo,
  validarEmpresaForm,
  crearCuentaYEmpresa,
} from "services/registro";
import { validarLogoEmpresa } from "services/companyLogoUpload";
import { routeUrl } from "utils/routePath";
import { registrationErrorMessage } from "services/registroSession";
import ConfirmarCorreo from "./ConfirmarCorreo";

const estadoEmpresaInicial = {
  nombre: "",
  pais: "",
  ciudad: "",
  direccion: "",
  sedePrincipal: "Sede central",
  telefono: "",
};

const estadoCheckoutInicial = {
  email: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  province: "",
  postal: "",
  country: "El Salvador",
  cardName: "",
  card: "",
  expiry: "",
  cvc: "",
  bankOwner: "",
  bankName: "",
  bankAccount: "",
  terms: false,
};

const METODOS = [
  { id: "card", label: "Tarjeta", icon: MdCreditCard },
  { id: "bank", label: "Transferencia", icon: MdOutlineAccountBalance },
  { id: "apple", label: "Apple Pay", icon: MdOutlinePhoneIphone },
  { id: "link", label: "Link", icon: MdLink },
];

export default function Registro() {
  const navigate = useNavigate();
  const { user, loading: authLoading, rol, esSuperAdmin, esAdminEmpresa } = useAuth();
  const [paso, setPaso] = useState(1);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [requiereConfirmacion, setRequiereConfirmacion] = useState(false);

  const [cuenta, setCuenta] = useState({ nombre: "", correo: "", password: "", confirmar: "" });
  const [usuarioPendiente, setUsuarioPendiente] = useState(null);
  const [errores, setErrores] = useState<Record<string, string>>({});

  // Paso 2: checkout simulado (ver services/checkout.js — mismas validaciones y cálculos que
  // CheckoutPage.tsx de la landing, sin pasarela de pago real ni cobro real).
  const [planSeleccionado, setPlanSeleccionado] = useState("Business");
  const [billing, setBilling] = useState("monthly");
  const [automaticBilling, setAutomaticBilling] = useState(true);
  const [promotionInput, setPromotionInput] = useState("");
  const [promotionCode, setPromotionCode] = useState("");
  const [promotionMessage, setPromotionMessage] = useState("");
  const [metodo, setMetodo] = useState("card");
  const [checkoutForm, setCheckoutForm] = useState(estadoCheckoutInicial);
  const [erroresCheckout, setErroresCheckout] = useState<Record<string, string>>({});
  const [procesandoPago, setProcesandoPago] = useState(false);
  const [checkoutInfo, setCheckoutInfo] = useState(null);

  const [empresa, setEmpresa] = useState(estadoEmpresaInicial);
  const [prefijo, setPrefijo] = useState("+503");
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");

  const planConfig = PLAN_CATALOG[planSeleccionado];
  const subtotal = priceFor(planConfig.monthly, billing);
  const descuento = promotionCode === "FR33" ? subtotal : 0;
  const total = Math.max(0, subtotal - descuento);
  const ahorroAnual = planConfig.monthly * 12 - priceFor(planConfig.monthly, "annual");

  useEffect(() => {
    if (authLoading || !user) return;

    if (esSuperAdmin) {
      navigate(routeUrl("/admin", "nexxus-superadmin"), { replace: true });
      return;
    }
    if (esAdminEmpresa) {
      navigate(routeUrl("/admin", "empresa-resumen"), { replace: true });
      return;
    }

    if (paso === 1) {
      const correo = user.email || "";
      const nombre =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.user_metadata?.displayName ||
        (correo ? correo.split("@")[0] : "") ||
        "Usuario";
      const fotoPerfil =
        user.user_metadata?.avatar_url || user.user_metadata?.picture || null;

      // Cubre el registro con Google: este efecto es el único punto donde detectamos que un
      // usuario recién autenticado todavía no tiene empresa. send-welcome-email es idempotente
      // (marca user_metadata.welcomeEmailSentAt), así que no reenvía el correo en cada remount.
      void supabase.functions.invoke("send-welcome-email").catch(() => {});

      setUsuarioPendiente({
        uid: user.id,
        correo,
        nombre,
        fotoPerfil,
      });
      setCuenta((prev) => ({
        ...prev,
        nombre: prev.nombre || nombre,
        correo: prev.correo || correo,
      }));
      setCheckoutForm((prev) => ({ ...prev, email: prev.email || correo }));
      setPaso(2);
    }
  }, [user, authLoading, rol, esSuperAdmin, esAdminEmpresa, paso, navigate]);

  const validarPaso1 = () => {
    const nuevos: Record<string, string> = {};
    if (limpiarTexto(cuenta.nombre).length < 2) nuevos.nombre = "Ingresa tu nombre completo.";
    const errorCorreo = validarCorreo(cuenta.correo);
    if (errorCorreo) nuevos.correo = errorCorreo;
    if (seguridadPassword(cuenta.password) < 5) nuevos.password = "La contraseña no cumple todos los requisitos.";
    if (cuenta.confirmar !== cuenta.password) nuevos.confirmar = "Las contraseñas no coinciden.";
    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  };

  const crearCuenta = async (event) => {
    event.preventDefault();
    if (!validarPaso1()) return;
    setCargando(true);
    setError("");
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: cuenta.correo.trim().toLowerCase(),
        password: cuenta.password,
        options: {
          data: { displayName: limpiarTexto(cuenta.nombre) },
          emailRedirectTo: `${window.location.origin}/auth/registro`,
        },
      });
      if (signUpError) throw signUpError;
      if (!data.session || !data.user) {
        setUsuarioPendiente(null);
        setCuenta((prev) => ({ ...prev, password: "", confirmar: "" }));
        setRequiereConfirmacion(true);
        return;
      }
      // Fire-and-forget: un correo de bienvenida lento o caído no debe bloquear el registro.
      void supabase.functions.invoke("send-welcome-email").catch(() => {});
      setUsuarioPendiente({
        uid: data.user.id,
        correo: data.user.email,
        nombre: limpiarTexto(cuenta.nombre),
      });
      setCheckoutForm((a) => ({ ...a, email: data.user.email || "" }));
      setPaso(2);
    } catch (err) {
      setError(traducirErrorAuth(err.message));
    } finally {
      setCargando(false);
    }
  };

  const crearCuentaGoogle = async () => {
    setCargando(true);
    setError("");
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          // Mismo motivo que en sa-login/index.tsx: el dashboard vive bajo /workspace,
          // hay que incluir el prefijo o la vuelta de Google queda en blanco.
          redirectTo: `${window.location.origin}/auth/registro`,
        },
      });
      if (oauthError) throw oauthError;
    } catch (err) {
      setError(traducirErrorAuth(err.message));
      setCargando(false);
    }
  };

  const cambiarCampoCheckout = (campo, valor) => {
    setCheckoutForm((a) => ({ ...a, [campo]: valor }));
    setErroresCheckout((a) => ({ ...a, [campo]: undefined }));
  };

  const aplicarCodigoPromo = () => {
    const codigo = promotionInput.trim().toUpperCase();
    if (codigo === "FR33") {
      setPromotionCode(codigo);
      setPromotionMessage("Código aplicado: 100% de descuento.");
      return;
    }
    setPromotionCode("");
    setPromotionMessage("Código no válido.");
  };

  const confirmarPago = async (event) => {
    event.preventDefault();
    const errs = validarCheckout(checkoutForm, { method: metodo, total });
    setErroresCheckout(errs);
    if (Object.keys(errs).length > 0) return;
    setProcesandoPago(true);
    setError("");
    try {
      // Simulación: ninguna tarjeta/cuenta real se cobra (igual que el checkout de la landing,
      // que tampoco tenía una pasarela de pago real conectada). El plan se activa hasta el paso 3,
      // como parte del mismo batch que crea la empresa — ver crearCuentaYEmpresa.
      await new Promise((resolve) => window.setTimeout(resolve, 900));
      setCheckoutInfo({
        plan: planSeleccionado,
        billing,
        automaticBilling,
        promotionCode: promotionCode || null,
        purchaseId: generarPurchaseId(),
      });
      setPaso(3);
    } finally {
      setProcesandoPago(false);
    }
  };

  // Libera el object URL anterior cada vez que cambia el logo (o al desmontar), para no
  // acumular memoria mientras el usuario prueba distintas imágenes.
  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
    };
  }, [logoPreview]);

  const seleccionarLogo = (archivo?: File | null) => {
    if (!archivo) return;
    const errorLogo = validarLogoEmpresa(archivo);
    setErrores((prev) => ({ ...prev, logo: errorLogo || undefined }));
    if (errorLogo) return;
    setLogo(archivo);
    setLogoPreview((actual) => {
      if (actual) URL.revokeObjectURL(actual);
      return URL.createObjectURL(archivo);
    });
  };

  const validarPaso3 = () => {
    const nuevos = validarEmpresaForm(empresa, prefijo);
    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  };

  const enviarEmpresa = async (event) => {
    event.preventDefault();
    if (!usuarioPendiente || !checkoutInfo) {
      setError("Tu sesión expiró. Inicia sesión para continuar.");
      setPaso(1);
      return;
    }
    if (!validarPaso3()) return;
    setCargando(true);
    setError("");
    try {
      const duplicado = await nombreEmpresaDuplicado(empresa.nombre, usuarioPendiente.uid);
      if (duplicado) {
        setErrores({ nombre: "Ya existe una empresa registrada con ese nombre." });
        return;
      }
      await crearCuentaYEmpresa({
        uid: usuarioPendiente.uid,
        correo: usuarioPendiente.correo,
        nombreAdmin: usuarioPendiente.nombre,
        fotoPerfil: usuarioPendiente.fotoPerfil,
        empresa,
        prefijoSeleccionado: prefijo,
        checkout: checkoutInfo,
        logo,
      });
      // Fire-and-forget: la fila de usuarios ya existe en este punto, así que
      // send-company-created-email puede leer caller/empresa por sí solo.
      void supabase.functions.invoke("send-company-created-email").catch(() => {});
      navigate(routeUrl("/admin", "empresa-resumen"), { replace: true });
    } catch (err) {
      setError(registrationErrorMessage(err));
    } finally {
      setCargando(false);
    }
  };

  if (paso === 2) {
    return (
      <div className="mt-6 mb-16 flex h-full w-full items-start justify-center px-2 md:mx-0 md:px-0 lg:mb-10 lg:items-start lg:justify-start">
        <form onSubmit={confirmarPago} className="w-full max-w-full md:pl-4 lg:pl-0 xl:max-w-[460px]">
          <h4 className="mb-1.5 text-3xl font-bold text-navy-700 dark:text-white">Elige tu plan</h4>
          <p className="mb-5 text-base text-gray-600 dark:text-white/70">
            Simulación de pago — no se realiza ningún cobro real.
          </p>

          <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {PLAN_NAMES.map((nombre) => (
              <button
                key={nombre}
                type="button"
                onClick={() => setPlanSeleccionado(nombre)}
                className={`rounded-xl border p-3 text-left transition ${
                  planSeleccionado === nombre
                    ? "border-brand-500 bg-brand-500/5 dark:border-brand-400"
                    : "border-gray-200 dark:border-white/10"
                }`}
              >
                <p className="text-sm font-bold text-navy-700 dark:text-white">{nombre}</p>
                <p className="text-xs text-gray-500 dark:text-white/50">{money(PLAN_CATALOG[nombre].monthly)}/mes</p>
              </button>
            ))}
          </div>

          <div className="mb-4 flex items-center justify-between rounded-xl border border-gray-200 p-3 dark:border-white/10">
            <div>
              <p className="text-sm font-bold text-navy-700 dark:text-white">Facturación anual</p>
              <p className="text-xs text-gray-500 dark:text-white/50">Ahorra {money(ahorroAnual)} al año</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={billing === "annual"}
              onClick={() => setBilling((b) => (b === "annual" ? "monthly" : "annual"))}
              className={`h-6 w-11 rounded-full transition ${billing === "annual" ? "bg-brand-500" : "bg-gray-300 dark:bg-white/20"}`}
            >
              <span className={`block h-5 w-5 translate-x-0.5 rounded-full bg-white transition ${billing === "annual" ? "translate-x-5" : ""}`} />
            </button>
          </div>

          <div className="mb-4 flex items-center justify-between rounded-xl border border-gray-200 p-3 dark:border-white/10">
            <p className="text-sm font-bold text-navy-700 dark:text-white">Renovación automática</p>
            <button
              type="button"
              role="switch"
              aria-checked={automaticBilling}
              onClick={() => setAutomaticBilling((a) => !a)}
              className={`h-6 w-11 rounded-full transition ${automaticBilling ? "bg-brand-500" : "bg-gray-300 dark:bg-white/20"}`}
            >
              <span className={`block h-5 w-5 translate-x-0.5 rounded-full bg-white transition ${automaticBilling ? "translate-x-5" : ""}`} />
            </button>
          </div>

          <div className="mb-4">
            <label htmlFor="promo" className="ml-1.5 text-sm font-medium text-navy-700 dark:text-white">Código de promoción</label>
            <div className="mt-2 flex gap-2">
              <input
                id="promo"
                value={promotionInput}
                onChange={(e) => setPromotionInput(e.target.value)}
                placeholder="Ej. FR33"
                className="h-11 flex-1 rounded-xl border border-gray-200 bg-white/0 px-3 text-sm outline-none dark:!border-white/10 dark:text-white"
              />
              <button type="button" onClick={aplicarCodigoPromo} className="rounded-xl bg-lightPrimary px-4 text-sm font-medium text-navy-700 dark:bg-navy-800 dark:text-white">
                Aplicar
              </button>
            </div>
            {promotionMessage ? (
              <p className={`mt-1 text-xs font-medium ${promotionCode ? "text-green-500" : "text-red-500"}`}>{promotionMessage}</p>
            ) : null}
          </div>

          <div className="mb-4 grid grid-cols-4 gap-2">
            {METODOS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setMetodo(id)}
                className={`flex flex-col items-center gap-1 rounded-xl border p-2 text-xs font-medium transition ${
                  metodo === id ? "border-brand-500 bg-brand-500/5 dark:border-brand-400" : "border-gray-200 dark:border-white/10"
                }`}
              >
                <Icon className="h-5 w-5 text-navy-700 dark:text-white" />
                <span className="text-navy-700 dark:text-white">{label}</span>
              </button>
            ))}
          </div>

          <InputField
            variant="auth"
            extra="mb-3"
            label="Correo de facturación*"
            placeholder="tu@empresa.com"
            id="checkout-email"
            type="email"
            value={checkoutForm.email}
            state={erroresCheckout.email ? "error" : undefined}
            onChange={(e) => cambiarCampoCheckout("email", e.target.value)}
          />
          {erroresCheckout.email ? <p className="mb-3 -mt-2 text-xs font-medium text-red-500">{erroresCheckout.email}</p> : null}

          {total > 0 && metodo === "card" ? (
            <>
              <InputField
                variant="auth"
                extra="mb-3"
                label="Nombre en la tarjeta*"
                placeholder="Como aparece en la tarjeta"
                id="checkout-card-name"
                value={checkoutForm.cardName}
                state={erroresCheckout.cardName ? "error" : undefined}
                onChange={(e) => cambiarCampoCheckout("cardName", e.target.value)}
              />
              {erroresCheckout.cardName ? <p className="mb-3 -mt-2 text-xs font-medium text-red-500">{erroresCheckout.cardName}</p> : null}

              <InputField
                variant="auth"
                extra="mb-3"
                label="Número de tarjeta* (de prueba)"
                placeholder="4242 4242 4242 4242"
                id="checkout-card"
                value={checkoutForm.card}
                state={erroresCheckout.card ? "error" : undefined}
                onChange={(e) => cambiarCampoCheckout("card", formatCard(e.target.value))}
              />
              {erroresCheckout.card ? <p className="mb-3 -mt-2 text-xs font-medium text-red-500">{erroresCheckout.card}</p> : null}

              <div className="mb-3 flex gap-2">
                <div className="flex-1">
                  <InputField
                    variant="auth"
                    label="Vencimiento*"
                    placeholder="MM/AA"
                    id="checkout-expiry"
                    value={checkoutForm.expiry}
                    state={erroresCheckout.expiry ? "error" : undefined}
                    onChange={(e) => cambiarCampoCheckout("expiry", formatExpiry(e.target.value))}
                  />
                </div>
                <div className="flex-1">
                  <InputField
                    variant="auth"
                    label="CVC*"
                    placeholder="123"
                    id="checkout-cvc"
                    value={checkoutForm.cvc}
                    state={erroresCheckout.cvc ? "error" : undefined}
                    onChange={(e) => cambiarCampoCheckout("cvc", e.target.value.replace(/\D/g, "").slice(0, 4))}
                  />
                </div>
              </div>
              {erroresCheckout.expiry ? <p className="mb-3 -mt-2 text-xs font-medium text-red-500">{erroresCheckout.expiry}</p> : null}
              {erroresCheckout.cvc ? <p className="mb-3 -mt-2 text-xs font-medium text-red-500">{erroresCheckout.cvc}</p> : null}
            </>
          ) : null}

          {total > 0 && metodo === "bank" ? (
            <>
              <InputField
                variant="auth"
                extra="mb-3"
                label="Titular de la cuenta*"
                placeholder="Nombre completo"
                id="checkout-bank-owner"
                value={checkoutForm.bankOwner}
                state={erroresCheckout.bankOwner ? "error" : undefined}
                onChange={(e) => cambiarCampoCheckout("bankOwner", e.target.value)}
              />
              {erroresCheckout.bankOwner ? <p className="mb-3 -mt-2 text-xs font-medium text-red-500">{erroresCheckout.bankOwner}</p> : null}
              <InputField
                variant="auth"
                extra="mb-3"
                label="Banco*"
                placeholder="Nombre del banco"
                id="checkout-bank-name"
                value={checkoutForm.bankName}
                state={erroresCheckout.bankName ? "error" : undefined}
                onChange={(e) => cambiarCampoCheckout("bankName", e.target.value)}
              />
              {erroresCheckout.bankName ? <p className="mb-3 -mt-2 text-xs font-medium text-red-500">{erroresCheckout.bankName}</p> : null}
              <InputField
                variant="auth"
                extra="mb-3"
                label="Número de cuenta*"
                placeholder="00000000"
                id="checkout-bank-account"
                value={checkoutForm.bankAccount}
                state={erroresCheckout.bankAccount ? "error" : undefined}
                onChange={(e) => cambiarCampoCheckout("bankAccount", e.target.value)}
              />
              {erroresCheckout.bankAccount ? <p className="mb-3 -mt-2 text-xs font-medium text-red-500">{erroresCheckout.bankAccount}</p> : null}
            </>
          ) : null}

          {total > 0 ? (
            <>
              <InputField
                variant="auth"
                extra="mb-3"
                label="Dirección*"
                placeholder="Calle y número"
                id="checkout-address1"
                value={checkoutForm.addressLine1}
                state={erroresCheckout.addressLine1 ? "error" : undefined}
                onChange={(e) => cambiarCampoCheckout("addressLine1", e.target.value)}
              />
              {erroresCheckout.addressLine1 ? <p className="mb-3 -mt-2 text-xs font-medium text-red-500">{erroresCheckout.addressLine1}</p> : null}
              <div className="mb-3 flex gap-2">
                <div className="flex-1">
                  <InputField
                    variant="auth"
                    label="Ciudad*"
                    placeholder="Ciudad"
                    id="checkout-city"
                    value={checkoutForm.city}
                    state={erroresCheckout.city ? "error" : undefined}
                    onChange={(e) => cambiarCampoCheckout("city", e.target.value)}
                  />
                </div>
                <div className="w-28">
                  <InputField
                    variant="auth"
                    label="Postal*"
                    placeholder="00000"
                    id="checkout-postal"
                    value={checkoutForm.postal}
                    state={erroresCheckout.postal ? "error" : undefined}
                    onChange={(e) => cambiarCampoCheckout("postal", e.target.value)}
                  />
                </div>
              </div>
              {erroresCheckout.city ? <p className="mb-3 -mt-2 text-xs font-medium text-red-500">{erroresCheckout.city}</p> : null}
              <InputField
                variant="auth"
                extra="mb-3"
                label="Provincia / Departamento*"
                placeholder="Provincia"
                id="checkout-province"
                value={checkoutForm.province}
                state={erroresCheckout.province ? "error" : undefined}
                onChange={(e) => cambiarCampoCheckout("province", e.target.value)}
              />
              {erroresCheckout.province ? <p className="mb-3 -mt-2 text-xs font-medium text-red-500">{erroresCheckout.province}</p> : null}
            </>
          ) : null}

          <dl className="mb-4 rounded-xl border border-gray-200 p-3 text-sm dark:border-white/10">
            <div className="flex justify-between py-1">
              <dt className="text-gray-500 dark:text-white/60">Subtotal</dt>
              <dd className="font-medium text-navy-700 dark:text-white">{money(subtotal)}</dd>
            </div>
            {descuento > 0 ? (
              <div className="flex justify-between py-1">
                <dt className="text-green-500">Descuento · {promotionCode}</dt>
                <dd className="font-medium text-green-500">-{money(descuento)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between border-t border-gray-100 py-1 pt-2 dark:border-white/10">
              <dt className="font-bold text-navy-700 dark:text-white">Total hoy</dt>
              <dd className="font-bold text-navy-700 dark:text-white">{money(total)}</dd>
            </div>
          </dl>

          <label className="mb-4 flex items-start gap-2 text-xs text-gray-600 dark:text-white/70">
            <input
              type="checkbox"
              checked={checkoutForm.terms}
              onChange={(e) => cambiarCampoCheckout("terms", e.target.checked)}
              className="mt-0.5"
            />
            Acepto los términos de servicio y la política de privacidad de Nexxus.
          </label>
          {erroresCheckout.terms ? <p className="mb-3 -mt-2 text-xs font-medium text-red-500">{erroresCheckout.terms}</p> : null}

          {error ? (
            <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-500 dark:bg-red-400/10 dark:text-red-400">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={procesandoPago}
            className="linear mt-2 w-full rounded-xl bg-brand-500 py-[12px] text-base font-medium text-white transition duration-200 hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-brand-400"
          >
            {procesandoPago ? "Procesando pago..." : `Pagar ${money(total)} y continuar`}
          </button>
        </form>
      </div>
    );
  }

  if (paso === 3) {
    return (
      <div className="mt-10 mb-16 flex h-full w-full items-center justify-center px-2 md:mx-0 md:px-0 lg:mb-10 lg:items-center lg:justify-start">
        <form onSubmit={enviarEmpresa} className="w-full max-w-full md:pl-4 lg:pl-0 xl:max-w-[440px]">
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-green-50 px-3 py-2 text-sm font-medium text-green-600 dark:bg-green-400/10 dark:text-green-400">
            <MdCheckCircle className="h-5 w-5" />
            Plan {checkoutInfo?.plan} confirmado. Último paso para activar tu panel.
          </div>
          <h4 className="mb-2.5 text-3xl font-bold text-navy-700 dark:text-white">Datos de tu empresa</h4>

          <div className="mb-4">
            <label className="ml-1.5 text-sm font-medium text-navy-700 dark:text-white">Logo de la empresa</label>
            <label
              htmlFor="empresa-logo"
              className="mt-2 flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-gray-300 bg-white/0 text-center text-xs font-medium text-gray-500 hover:border-brand-500 dark:!border-white/15 dark:text-white/60"
            >
              {logoPreview ? (
                <img alt="Logo de la empresa" src={logoPreview} className="h-full w-full object-cover" />
              ) : (
                <span className="px-2">Subir logo</span>
              )}
            </label>
            <input
              id="empresa-logo"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => seleccionarLogo(e.target.files?.[0])}
            />
            <p className="mt-1.5 text-xs text-gray-500 dark:text-white/50">Opcional. JPG, PNG o WEBP, máximo 3 MB.</p>
            {errores.logo ? <p className="mt-1 text-xs font-medium text-red-500">{errores.logo}</p> : null}
          </div>

          <InputField
            variant="auth"
            extra="mb-3"
            label="Nombre de la empresa*"
            placeholder="Mi Empresa S.A."
            id="empresa-nombre"
            value={empresa.nombre}
            state={errores.nombre ? "error" : undefined}
            onChange={(e) => setEmpresa((a) => ({ ...a, nombre: e.target.value }))}
          />
          {errores.nombre ? <p className="mb-3 -mt-2 text-xs font-medium text-red-500">{errores.nombre}</p> : null}

          <div className="mb-3">
            <label htmlFor="empresa-pais" className="ml-1.5 text-sm font-medium text-navy-700 dark:text-white">País*</label>
            <select
              id="empresa-pais"
              value={empresa.pais}
              onChange={(e) => {
                const pais = FALLBACK_COUNTRIES.find((c) => c.name === e.target.value);
                setEmpresa((a) => ({ ...a, pais: e.target.value }));
                if (pais) setPrefijo(pais.dialCode);
              }}
              className={`mt-2 flex h-12 w-full items-center rounded-xl border bg-white/0 p-3 text-sm outline-none dark:text-white ${errores.pais ? "border-red-500" : "border-gray-200 dark:!border-white/10"}`}
            >
              <option value="">Selecciona un país</option>
              {FALLBACK_COUNTRIES.map((c) => (
                <option key={c.code} value={c.name}>{c.name}</option>
              ))}
            </select>
            {errores.pais ? <p className="mt-1 text-xs font-medium text-red-500">{errores.pais}</p> : null}
          </div>

          <InputField
            variant="auth"
            extra="mb-3"
            label="Ciudad*"
            placeholder="San Salvador"
            id="empresa-ciudad"
            value={empresa.ciudad}
            state={errores.ciudad ? "error" : undefined}
            onChange={(e) => setEmpresa((a) => ({ ...a, ciudad: e.target.value }))}
          />
          {errores.ciudad ? <p className="mb-3 -mt-2 text-xs font-medium text-red-500">{errores.ciudad}</p> : null}

          <InputField
            variant="auth"
            extra="mb-3"
            label="Dirección*"
            placeholder="Calle Principal #123"
            id="empresa-direccion"
            value={empresa.direccion}
            state={errores.direccion ? "error" : undefined}
            onChange={(e) => setEmpresa((a) => ({ ...a, direccion: e.target.value }))}
          />
          {errores.direccion ? <p className="mb-3 -mt-2 text-xs font-medium text-red-500">{errores.direccion}</p> : null}

          <div className="mb-3 flex gap-2">
            <div className="w-28">
              <label htmlFor="empresa-prefijo" className="ml-1.5 text-sm font-medium text-navy-700 dark:text-white">Prefijo</label>
              <select
                id="empresa-prefijo"
                value={prefijo}
                onChange={(e) => setPrefijo(e.target.value)}
                className="mt-2 flex h-12 w-full items-center rounded-xl border border-gray-200 bg-white/0 p-3 text-sm outline-none dark:!border-white/10 dark:text-white"
              >
                {FALLBACK_COUNTRIES.map((c) => (
                  <option key={c.code} value={c.dialCode}>{c.dialCode}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <InputField
                variant="auth"
                label="Teléfono*"
                placeholder="7000-0000"
                id="empresa-telefono"
                value={empresa.telefono}
                state={errores.telefono ? "error" : undefined}
                onChange={(e) => setEmpresa((a) => ({ ...a, telefono: formatPhoneNumber(e.target.value, prefijo) }))}
              />
            </div>
          </div>
          {errores.telefono ? <p className="mb-3 -mt-2 text-xs font-medium text-red-500">{errores.telefono}</p> : null}

          <InputField
            variant="auth"
            extra="mb-3"
            label="Nombre de la sede principal*"
            placeholder="Sede central"
            id="empresa-sede"
            value={empresa.sedePrincipal}
            state={errores.sedePrincipal ? "error" : undefined}
            onChange={(e) => setEmpresa((a) => ({ ...a, sedePrincipal: e.target.value }))}
          />
          {errores.sedePrincipal ? <p className="mb-3 -mt-2 text-xs font-medium text-red-500">{errores.sedePrincipal}</p> : null}

          {error ? (
            <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-500 dark:bg-red-400/10 dark:text-red-400">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={cargando}
            className="linear mt-2 w-full rounded-xl bg-brand-500 py-[12px] text-base font-medium text-white transition duration-200 hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-brand-400"
          >
            {cargando ? "Creando empresa..." : "Crear empresa"}
          </button>
        </form>
      </div>
    );
  }

  if (requiereConfirmacion) return <ConfirmarCorreo />;

  return (
    <div className="mt-16 mb-16 flex h-full w-full items-center justify-center px-2 md:mx-0 md:px-0 lg:mb-10 lg:items-center lg:justify-start">
      <form onSubmit={crearCuenta} className="mt-[8vh] w-full max-w-full flex-col items-center md:pl-4 lg:pl-0 xl:max-w-[420px]">
        <h4 className="mb-2.5 text-4xl font-bold text-navy-700 dark:text-white">Crea tu cuenta</h4>
        <p className="mb-9 ml-1 text-base text-gray-600 dark:text-white/70">Registra tu empresa en Nexxus.</p>

        <button
          type="button"
          onClick={crearCuentaGoogle}
          disabled={cargando}
          className="mb-6 flex h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-lightPrimary hover:cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 dark:bg-navy-800"
        >
          <div className="rounded-full text-xl"><FcGoogle /></div>
          <h5 className="text-sm font-medium text-navy-700 dark:text-white">Continuar con Google</h5>
        </button>
        <div className="mb-6 flex items-center gap-3">
          <div className="h-px w-full bg-gray-200 dark:bg-navy-700" />
          <p className="text-base text-gray-600 dark:text-white"> o </p>
          <div className="h-px w-full bg-gray-200 dark:bg-navy-700" />
        </div>

        <InputField
          variant="auth"
          extra="mb-3"
          label="Nombre completo*"
          placeholder="Tu nombre"
          id="registro-nombre"
          value={cuenta.nombre}
          state={errores.nombre ? "error" : undefined}
          onChange={(e) => setCuenta((a) => ({ ...a, nombre: e.target.value }))}
        />
        {errores.nombre ? <p className="mb-3 -mt-2 text-xs font-medium text-red-500">{errores.nombre}</p> : null}

        <InputField
          variant="auth"
          extra="mb-3"
          label="Correo*"
          placeholder="tu@empresa.com"
          id="registro-correo"
          type="email"
          autoComplete="username"
          value={cuenta.correo}
          state={errores.correo ? "error" : undefined}
          onChange={(e) => setCuenta((a) => ({ ...a, correo: e.target.value }))}
        />
        {errores.correo ? <p className="mb-3 -mt-2 text-xs font-medium text-red-500">{errores.correo}</p> : null}

        <InputField
          variant="auth"
          extra="mb-3"
          label="Contraseña*"
          placeholder="Mínimo 8 caracteres"
          id="registro-password"
          type="password"
          autoComplete="new-password"
          value={cuenta.password}
          state={errores.password ? "error" : undefined}
          onChange={(e) => setCuenta((a) => ({ ...a, password: e.target.value }))}
        />
        {cuenta.password ? (
          <ul className="mb-3 -mt-1 grid grid-cols-1 gap-0.5 text-xs">
            {reglasPassword(cuenta.password).map(([texto, valido]) => (
              <li key={texto} className={valido ? "text-green-500" : "text-gray-400 dark:text-white/40"}>
                {valido ? "✓" : "•"} {texto}
              </li>
            ))}
          </ul>
        ) : null}
        {errores.password ? <p className="mb-3 -mt-2 text-xs font-medium text-red-500">{errores.password}</p> : null}

        <InputField
          variant="auth"
          extra="mb-3"
          label="Confirmar contraseña*"
          placeholder="Repite tu contraseña"
          id="registro-confirmar"
          type="password"
          autoComplete="new-password"
          value={cuenta.confirmar}
          state={errores.confirmar ? "error" : undefined}
          onChange={(e) => setCuenta((a) => ({ ...a, confirmar: e.target.value }))}
        />
        {errores.confirmar ? <p className="mb-3 -mt-2 text-xs font-medium text-red-500">{errores.confirmar}</p> : null}

        {error ? (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-500 dark:bg-red-400/10 dark:text-red-400">{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={cargando}
          className="linear mt-2 w-full rounded-xl bg-brand-500 py-[12px] text-base font-medium text-white transition duration-200 hover:bg-brand-600 active:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-brand-400 dark:text-white dark:hover:bg-brand-300 dark:active:bg-brand-200"
        >
          {cargando ? "Creando cuenta..." : "Continuar"}
        </button>

        <p className="mt-4 text-sm text-gray-600 dark:text-white/70">
          ¿Ya tienes cuenta?{" "}
          <Link to="/auth/sa-login" className="font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400">
            Inicia sesión
          </Link>
        </p>
      </form>
    </div>
  );
}
