import { describe, it, expect } from 'vitest';
import {
  limpiarTexto,
  normalizar,
  validarCorreo,
  reglasPassword,
  seguridadPassword,
  validarTelefono,
  validarEmpresaForm,
} from '../registro';

describe('limpiarTexto / normalizar', () => {
  it('colapsa espacios repetidos y recorta los extremos', () => {
    expect(limpiarTexto('  Nexxus   Inc  ')).toBe('Nexxus Inc');
  });

  it('normaliza a minúsculas', () => {
    expect(normalizar('  Nexxus   Inc  ')).toBe('nexxus inc');
  });
});

describe('validarCorreo', () => {
  it('rechaza correos con espacios', () => {
    expect(validarCorreo('ana perez@correo.com')).toMatch(/espacios/);
  });

  it('rechaza correos sin formato válido', () => {
    expect(validarCorreo('no-es-un-correo')).toMatch(/válido/);
  });

  it('acepta un correo válido', () => {
    expect(validarCorreo('ana.perez@empresa.com')).toBeUndefined();
  });
});

describe('reglasPassword / seguridadPassword', () => {
  it('marca cada regla individualmente (longitud, mayúscula, minúscula, número, especial)', () => {
    const reglas = reglasPassword('abc');
    expect(reglas.find(([texto]) => texto.includes('8 caracteres'))?.[1]).toBe(false);
    expect(reglas.find(([texto]) => texto.includes('minúscula'))?.[1]).toBe(true);
    expect(reglas.find(([texto]) => texto.includes('mayúscula'))?.[1]).toBe(false);
  });

  it('una contraseña que cumple todas las reglas tiene seguridad 5/5', () => {
    expect(seguridadPassword('Nexxus2026!')).toBe(5);
  });

  it('una contraseña débil tiene seguridad baja', () => {
    expect(seguridadPassword('abc')).toBeLessThanOrEqual(2);
  });
});

describe('validarTelefono', () => {
  it('rechaza un teléfono vacío', () => {
    expect(validarTelefono('', '+503')).toMatch(/Ingresa un teléfono/);
  });

  it('rechaza un teléfono más corto de lo esperado para el país', () => {
    expect(validarTelefono('123', '+503')).toMatch(/muy corto/);
  });

  it('acepta un teléfono con la longitud esperada para El Salvador (+503, 8 dígitos)', () => {
    expect(validarTelefono('7000-0000', '+503')).toBeUndefined();
  });

  it('usa la configuración de respaldo para prefijos no listados', () => {
    expect(validarTelefono('1234567', '+999')).toBeUndefined(); // 7 dígitos, dentro del rango 7-15 del fallback
  });
});

describe('validarEmpresaForm', () => {
  const empresaValida = {
    nombre: 'Nexxus Inc',
    pais: 'El Salvador',
    ciudad: 'San Salvador',
    direccion: 'Calle Principal 123, Colonia Escalón',
    telefono: '7000-0000',
    sedePrincipal: 'Casa Matriz',
  };

  it('no reporta errores para un formulario completo y válido', () => {
    expect(validarEmpresaForm(empresaValida, '+503')).toEqual({});
  });

  it('reporta un error por campo cuando faltan datos obligatorios', () => {
    const errores = validarEmpresaForm(
      { nombre: '', pais: '', ciudad: '', direccion: 'corta', telefono: '', sedePrincipal: '' },
      '+503'
    );

    expect(errores.nombre).toBeDefined();
    expect(errores.pais).toBeDefined();
    expect(errores.ciudad).toBeDefined();
    expect(errores.direccion).toBeDefined();
    expect(errores.telefono).toBeDefined();
    expect(errores.sedePrincipal).toBeDefined();
  });
});
