import { Course } from '@/domain/entities/Course';
import { Documento } from '@/domain/entities/Documento';

/**
 * Cursos y documentos predefinidos informativos de primera mano para la plataforma Nexxus.
 * Contienen información médica, psicológica, legal de RRHH y de seguridad validada y real.
 */
export const PREDEFINED_COURSES: Course[] = [
  {
    id: 'predef-primeros-auxilios',
    empresaId: 'global',
    titulo: 'Manual de Primeros Auxilios y Soporte Vital Básico',
    descripcion: 'Guía práctica esencial sobre actuación médica de emergencia, RCP, maniobra de Heimlich, control de hemorragias y tratamiento de quemaduras.',
    duracion: '25 min',
    categoria: 'seguridad',
    puntos: 100,
    modulos: [
      {
        titulo: 'Protocolo PAS y Evaluación de Emergencias',
        contenido_texto: `En cualquier situación de emergencia médica, el primer respondedor debe aplicar rigurosamente el **Protocolo PAS**:

1. **PROTEGER**: Antes de tocar o acercarse a la víctima, verifique que la escena sea segura para usted. Evalúe riesgos de descargas eléctricas, derrames tóxicos, derrumbes o tránsito vehicular.

2. **AVISAR**: Llame de inmediato a los servicios de emergencia (911 o la línea médica interna de la empresa). Proporcione la ubicación exacta, número de afectados y su estado de conciencia.

3. **SOCORRER**: Evalúe el nivel de conciencia mediante la regla AVDI (Alerta, Respuesta Verbal, Respuesta al Dolor, Inconsciente). Compruebe la respiración observando el movimiento del tórax durante 10 segundos (Método Ver, Oír y Sentir).

💡 **Consejo Vital**: Nunca mueva a una víctima con sospecha de trauma en columna o cuello a menos que exista riesgo inminente de explosión o derrumbe.`,
        evaluacion_corta: {
          pregunta: '¿Cuál es el primer paso del protocolo PAS antes de atender a una víctima?',
          opciones: ['Socorrer de inmediato', 'Proteger y asegurar la zona', 'Avisar a la ambulancia', 'Mover a la víctima'],
          respuestaCorrecta: 'Proteger y asegurar la zona',
        },
      },
      {
        titulo: 'Reanimación Cardiopulmonar (RCP) en Adultos',
        contenido_texto: `Si la persona está inconsciente y **no respira de forma normal** (o solo jadea agónicamente):

1. **Posición**: Coloque a la víctima boca arriba sobre una superficie firme y plana. Arrodíllese a un costado.

2. **Compresiones**: Coloque el talón de una mano en el centro del tórax (mitad inferior del esternón) y la otra mano entrelazada encima. Con los brazos rectos, comprima el pecho con una profundidad de **5 a 6 cm**.

3. **Ritmo**: Mantenga una frecuencia de **100 a 120 compresiones por minuto** (al ritmo de la canción 'Stayin Alive').

4. **Ciclo**: Realice 30 compresiones seguidas de 2 insuflaciones de rescate si cuenta con entrenamiento. Si no tiene entrenamiento, mantenga **compresiones continuas sin interrupción** hasta la llegada del equipo médico o un Desfibrilador Externo Automático (DEA).

🚨 **Nota de Emergencia**: Si dispone de un DEA, enciéndalo inmediatamente y siga las instrucciones de voz.`,
        evaluacion_corta: {
          pregunta: '¿Cuál es la frecuencia recomendada de compresiones por minuto al aplicar RCP?',
          opciones: ['60 a 80 compresiones', '80 a 100 compresiones', '100 a 120 compresiones', 'Más de 150 compresiones'],
          respuestaCorrecta: '100 a 120 compresiones',
        },
      },
      {
        titulo: 'Maniobra de Heimlich para Atragantamientos',
        contenido_texto: `La obstrucción de la vía aérea por cuerpo extraño (OVACE) requiere intervención urgente cuando la víctima se lleva las manos al cuello y no puede emitir sonidos ni toser:

1. **Evaluación**: Pregunte '¿Te estás atragantando?'. Si asiente y no puede toser, actúe de inmediato.

2. **Posición**: Colóquese detrás de la víctima y rodee su cintura con sus brazos.

3. **Puño y Empuje**: Forme un puño con una mano y colóquelo por encima del ombligo y por debajo del esternón. Cubra el puño con su otra mano.

4. **Compresión**: Presione hacia adentro y hacia arriba de manera firme y rápida. Repita hasta expulsar el objeto o hasta que la víctima pierda el conocimiento (en cuyo caso inicie RCP).`,
        evaluacion_corta: {
          pregunta: '¿Dónde se debe posicionar el puño para realizar la maniobra de Heimlich?',
          opciones: ['Sobre el pecho', 'Por encima del ombligo y debajo del esternón', 'En la espalda', 'Sobre las costillas flotantes'],
          respuestaCorrecta: 'Por encima del ombligo y debajo del esternón',
        },
      },
      {
        titulo: 'Hemorragias y Quemaduras',
        contenido_texto: `**Control de Hemorragias severas:**
- Aplique **presión directa y continua** sobre la herida con una gasa limpia o paño esterilizado por al menos 10 minutos ininterrumpidos.
- Si el sangrado empapa la gasa, **no la retire**; coloque más capas encima y mantenga la presión.
- Eleve la extremidad afectada por encima del nivel del corazón si no hay sospecha de fractura.

**Atención de Quemaduras:**
- Enfríe la superficie quemada con **agua limpia y templada corriendo durante 15 a 20 minutos**.
- Nunca aplique hielo directo, pasta dental, aceites ni remedios caseros.
- No rompa las ampollas formadas y cubra la zona holgadamente con una gasa estéril humedecida.`,
        evaluacion_corta: {
          pregunta: '¿Qué se debe hacer inmediatamente ante una quemadura de primer o segundo grado?',
          opciones: ['Aplicar crema o hielo directamente', 'Romper las ampollas inmediatamente', 'Enfriar con agua limpia templada por 15-20 minutos', 'Cubrir con algodón seco'],
          respuestaCorrecta: 'Enfriar con agua limpia templada por 15-20 minutos',
        },
      },
    ],
  },
  {
    id: 'predef-ayuda-psicologica',
    empresaId: 'global',
    titulo: 'Primeros Auxilios Psicológicos y Salud Mental Laboral',
    descripcion: 'Herramientas de contención emocional, protocolos ante ataques de pánico, prevención del estrés laboral agudo y apoyo psicológico.',
    duracion: '20 min',
    categoria: 'habilidades_blandas',
    puntos: 100,
    modulos: [
      {
        titulo: 'Primeros Auxilios Psicológicos (PAP) en el Entorno Laboral',
        contenido_texto: `Los Primeros Auxilios Psicológicos buscan estabilizar emocionalmente a un compañero de trabajo tras un evento estresante o crisis emocional:

1. **Escucha Activa**: Brinde atención completa, escuche sin interrumpir, juzgar ni dar consejos apresurados. Valide sus emociones ('Entiendo que esto es muy difícil').

2. **Entorno Seguro**: Traslade a la persona a un espacio privado, tranquilo y con temperatura agradable para reducir sobreestímulos.

3. **Calma y Presencia**: Mantenga un tono de voz pausado, sereno y empático. Respete el silencio si la persona no desea hablar de inmediato.`,
        evaluacion_corta: {
          pregunta: '¿Cuál es la actitud idónea al brindar primeros auxilios psicológicos?',
          opciones: ['Minimizar el problema', 'Escuchar activamente sin juzgar ni interrumpir', 'Obligar a hablar inmediatamente', 'Dar opiniones personales y juzgar'],
          respuestaCorrecta: 'Escuchar activamente sin juzgar ni interrumpir',
        },
      },
      {
        titulo: 'Manejo Inmediato de Crisis de Ansiedad y Pánico',
        contenido_texto: `Ante un episodio agudo de hiperventilación, taquicardia o pánico en el trabajo:

1. **Técnica de Respiración 4-7-8**:
   - Inhale por la nariz lenta y profundamente durante **4 segundos**.
   - Sostenga el aire en sus pulmones por **7 segundos**.
   - Exhale el aire suavemente por la boca durante **8 segundos**. Repita durante 3 a 5 minutos.

2. **Técnica de Enraizamiento (Grounding 5-4-3-2-1)** para reconectar con el presente:
   - Identifique **5 cosas** que pueda ver a su alrededor.
   - Identifique **4 cosas** que pueda tocar físicamente.
   - Identifique **3 sonidos** que escuche en el entorno.
   - Identifique **2 olores** que perciba.
   - Identifique **1 sabor** en su boca.`,
        evaluacion_corta: {
          pregunta: '¿En qué consiste el primer paso de la técnica de respiración 4-7-8?',
          opciones: ['Sostener el aire 7 segundos', 'Inhalar lentamente por 4 segundos', 'Exhalar por 8 segundos', 'Respirar lo más rápido posible'],
          respuestaCorrecta: 'Inhalar lentamente por 4 segundos',
        },
      },
      {
        titulo: 'Detección del Burnout y Cuidado de la Salud Mental',
        contenido_texto: `El **Síndrome de Burnout** o agotamiento profesional es un estado de desgaste físico, mental y emocional causado por estrés laboral prolongado:

- **Señales de alerta**: Fatiga crónica que no mejora descansando, irritabilidad, cinismo hacia las tareas, disminución del rendimiento y dolores somáticos (cefaleas, tensión muscular).
- **Acciones preventivas**:
  - Establezca pausas activas de 5 minutos por cada 90 minutos de trabajo continuo.
  - Practique la desconexión digital fuera de su horario laboral.
  - Comunique a su supervisor o RRHH si siente que las cargas asignadas sobrepasan su capacidad.`,
        evaluacion_corta: {
          pregunta: '¿Cuál de los siguientes es un síntoma característico del síndrome de Burnout?',
          opciones: ['Mayor energía en el trabajo', 'Fatiga emocional crónica e irritabilidad constante', 'Aumento de la creatividad cotidiana', 'Ninguna alteración física o mental'],
          respuestaCorrecta: 'Fatiga emocional crónica e irritabilidad constante',
        },
      },
    ],
  },
  {
    id: 'predef-recursos-humanos',
    empresaId: 'global',
    titulo: 'Guía de Recursos Humanos, Derechos Laborales y Convivencia',
    descripcion: 'Normativa de la empresa, derechos del trabajador, solicitud de licencias, prevención del acoso laboral y canales de atención.',
    duracion: '18 min',
    categoria: 'onboarding',
    puntos: 100,
    modulos: [
      {
        titulo: 'Derechos del Colaborador y Código de Conducta',
        contenido_texto: `Todo colaborador de la organización cuenta con el respaldo de normativas laborales claras que garantizan un ambiente digno, seguro y respetuoso:

1. **Derecho a un Trato Digno e Inclusivo**: Igualdad de oportunidades sin discriminación por género, raza, religión, edad, orientación o discapacidad.
2. **Ambiente Libre de Acoso**: Política estricta de Tolerancia Cero frente al acoso laboral (*mobbing*), hostigamiento sexual o verbal.
3. **Confidencialidad**: Resguardo estricto de los datos personales y expedientes laborales de cada empleado.`,
        evaluacion_corta: {
          pregunta: '¿Qué política aplica la organización ante el acoso laboral o violencia en el trabajo?',
          opciones: ['Tolerancia Cero y canales confidenciales de atención', 'Revisión solo si es reiterado', 'Manejo informal entre compañeros', 'Ignorar denuncias verbales'],
          respuestaCorrecta: 'Tolerancia Cero y canales confidenciales de atención',
        },
      },
      {
        titulo: 'Trámite de Licencias, Permisos y Vacaciones',
        contenido_texto: `Procedimientos estandarizados para la gestión de ausencias y descansos:

- **Incapacidades Médicas**: Notifique a su jefatura y a RRHH dentro de las primeras **24 a 48 horas** enviando el comprobante médico oficial.
- **Solicitud de Vacaciones**: Debe tramitarse con un mínimo de **15 días de anticipación** mediante la plataforma o formulario institucional.
- **Permisos Especiales**: Licencias por maternidad/paternidad, duelo o matrimonio deben adjuntar los certificados legales correspondientes.`,
        evaluacion_corta: {
          pregunta: '¿En qué plazo se debe notificar una incapacidad médica a RRHH?',
          opciones: ['Al finalizar el mes', 'Dentro de las primeras 24 a 48 horas', 'A los 15 días hábiles', 'No se requiere notificar'],
          respuestaCorrecta: 'Dentro de las primeras 24 a 48 horas',
        },
      },
      {
        titulo: 'Resolución de Conflictos y Canal de Ética',
        contenido_texto: `Si experimenta o atestigua alguna discrepancia o infracción a las políticas internas:

1. **Diálogo Directo y Mediación**: Busque una conversación respetuosa centrada en hechos. Si no es posible, solicite la intermediación de Recursos Humanos.
2. **Canal de Ética Confidencial**: Para situaciones sensibles o irregularidades, puede presentar un reporte anónimo en el sistema de cumplimiento corporativo.`,
        evaluacion_corta: {
          pregunta: '¿Cuál es el medio institucional para reportar de forma segura violaciones al código de ética?',
          opciones: ['Redes sociales públicas', 'Canal de Ética confidencial de la empresa', 'Comentarios en grupos informales', 'No existen canales oficiales'],
          respuestaCorrecta: 'Canal de Ética confidencial de la empresa',
        },
      },
    ],
  },
  {
    id: 'predef-emergencias-evacuacion',
    empresaId: 'global',
    titulo: 'Protocolo de Emergencias, Uso de Extintores y Evacuación',
    descripcion: 'Medidas ante incendios, sismos, clasificación de fuego, maniobra de extintores y coordinación con brigadas de seguridad.',
    duracion: '22 min',
    categoria: 'seguridad',
    puntos: 100,
    modulos: [
      {
        titulo: 'Prevención de Incendios y Uso del Extintor (Método PASS/RACE)',
        contenido_texto: `**Clasificación del Fuego:**
- **Clase A**: Sólidos comunes (madera, papel, cartón, plástico).
- **Clase B**: Líquidos y gases inflamables (gasolina, pintura, alcohol).
- **Clase C**: Equipos eléctricos energizados (computadoras, tableros, maquinaria).

**Técnica de Operación del Extintor (PASS):**
1. **P** (Pull/Jalar): Rompa el sello y jale el pasador de seguridad.
2. **A** (Aim/Apuntar): Apunte la manguera hacia la **base del fuego**, no a las llamas superiores.
3. **S** (Squeeze/Apretar): Presione la palanca para descargar el agente extintor (PQS o CO2).
4. **S** (Sweep/Barrer): Realice un movimiento de abanico de lado a lado cubriendo la base.`,
        evaluacion_corta: {
          pregunta: 'Al usar un extintor, ¿hacia dónde se debe dirigir el chorro descargado?',
          opciones: ['Hacia el humo superior', 'Hacia la base del fuego', 'Hacia el centro de las llamas', 'Hacia el techo'],
          respuestaCorrecta: 'Hacia la base del fuego',
        },
      },
      {
        titulo: 'Protocolo de Evacuación ante Sismos o Terremotos',
        contenido_texto: `**Durante la Sacudida:**
- **Repliegue**: Aléjese inmediatamente de ventanas, espejos, libreros y objetos suspendidos.
- **Protección**: Agáchese, cúbrase debajo de un escritorio o mesa resistente y sujétase fuertemente (*Agáchate, Cúbrete y Sujétate*).

**Durante la Evacuación:**
- Espere a que cese el movimiento sísmico principal.
- Desplácese por las rutas de evacuación señalizadas con letreros verdes fotoluminiscentes.
- **NO use elevadores o ascensores bajo ninguna circunstancia**. Use únicamente las escaleras de emergencia.
- Camine rápido sin correr, no empuje y deje las pertenencias voluminosas.`,
        evaluacion_corta: {
          pregunta: '¿Por qué vía debe realizarse la evacuación de un edificio en emergencia?',
          opciones: ['Por elevadores rápidos', 'Únicamente por escaleras de emergencia señalizadas', 'Por ventanas de seguridad', 'Por montacargas'],
          respuestaCorrecta: 'Únicamente por escaleras de emergencia señalizadas',
        },
      },
      {
        titulo: 'Punto de Encuentro y Brigadas de Seguridad',
        contenido_texto: `Una vez fuera de las instalaciones:

1. **Punto de Encuentro Exterior**: Diríjase directamente a la zona segura delimitada fuera del inmueble.
2. **Pase de Lista**: Reporte su presencia ante el Brigadista de su piso o área (identificado con chaleco reflectante).
3. **No Reingresar**: Permanezca en el punto de encuentro hasta que la autoridad competente o brigada emita la declaratoria formal de zona segura (*Luz Verde*).`,
        evaluacion_corta: {
          pregunta: '¿Cuándo se permite el reingreso al edificio tras una evacuación?',
          opciones: ['En cuanto cese la alarma', 'Únicamente cuando los brigadistas autoricen formalmente', 'Cuando cada empleado lo decida', 'A los 5 minutos exactos'],
          respuestaCorrecta: 'Únicamente cuando los brigadistas autoricen formalmente',
        },
      },
    ],
  },
];

/**
 * Documentos predefinidos institucionales con contenido completo verificado para el Centro de Documentos.
 */
export const PREDEFINED_DOCUMENTS: Documento[] = [
  {
    id: 'doc-predef-primeros-auxilios',
    userId: 'global',
    empresaId: 'global',
    titulo: 'Manual Oficial de Primeros Auxilios y Soporte Vital',
    tipo: 'rrhh',
    url: '',
    fechaSubida: '2026-01-01T00:00:00.000Z',
    leido: true,
    tamano: '1.8 MB',
    categoria: 'Salud y Seguridad',
    contenido_completo: `# MANUAL OFICIAL DE PRIMEROS AUXILIOS Y SOPORTE VITAL BÁSICO

## 1. PROTOCOLO DE ACTUACIÓN PAS (PROTEGER, AVISAR, SOCORRER)
Ante cualquier emergencia médica en las instalaciones, el primer respondedor debe seguir los tres pasos fundamentales:

1. **PROTEGER:** 
   - Evalúe el entorno inmediatamente.
   - Asegúrese de que no existan peligros activos como cables desnudos energizados, derrames químicos o riesgo de colapso.
   - No intervenga si su vida corre peligro.

2. **AVISAR:**
   - Comuníquese de inmediato con el equipo médico interno o llame al 911.
   - Proporcione: Dirección exacta, punto de referencia, número de heridos y estado aparente.

3. **SOCORRER:**
   - Verifique el nivel de respuesta mediante la escala **AVDI** (Alerta, Respuesta a Voz, Respuesta a Dolor, Inconsciente).
   - Compruebe la respiración colocando su oreja cerca de la boca de la víctima mientras observa el tórax durante 10 segundos (Ver, Oír y Sentir).

---

## 2. REANIMACIÓN CARDIOPULMONAR (RCP) EN ADULTOS
Si la víctima está inconsciente y **no respira de forma normal**:

- Coloque el talón de su mano dominante en el centro del tórax (mitad inferior del esternón) e intercale los dedos de la otra mano.
- Mantenga los brazos completamente rectos y comprima a una profundidad de **5 a 6 cm**.
- Frecuencia recomendada: **100 a 120 compresiones por minuto**.
- Mantenga las compresiones continuas hasta contar con ayuda médica o un Desfibrilador (DEA).

---

## 3. ATRAGANTAMIENTO (MANIOBRA DE HEIMLICH)
Si la persona no puede hablar, toser ni respirar debido a una obstrucción:

- Colóquese detrás de la persona y abrace su cintura.
- Forme un puño con una mano sobre el abdomen (entre el ombligo y las costillas).
- Apriete firmemente hacia adentro y hacia arriba hasta liberar la vía aérea.

---

## 4. QUEMADURAS Y HEMORRAGIAS
- **Hemorragias:** Presión directa sobre la herida con tela limpia. Nunca retire las gasas empapadas.
- **Quemaduras:** Enfríe con abundante agua corriente durante 15 a 20 minutos. No aplique ungüentos ni rompa ampollas.`,
  },
  {
    id: 'doc-predef-salud-mental',
    userId: 'global',
    empresaId: 'global',
    titulo: 'Guía de Apoyo Psicológico y Bienestar Emocional en el Trabajo',
    tipo: 'rrhh',
    url: '',
    fechaSubida: '2026-01-01T00:00:00.000Z',
    leido: true,
    tamano: '1.4 MB',
    categoria: 'Salud Mental',
    contenido_completo: `# GUÍA DE APOYO PSICOLÓGICO Y BIENESTAR EMOCIONAL EN EL TRABAJO

## 1. PRIMEROS AUXILIOS PSICOLÓGICOS (PAP)
La salud mental es un pilar fundamental del bienestar en Nexxus. Cuando un colaborador experimenta estrés agudo o angustia emocional:

- **Escucha Empática:** Escuche de forma activa sin interrumpir, dar juicios de valor ni minimizar su vivencia.
- **Ambiente Tranquilo:** Traslade a la persona a una sala privada con poca interferencia de ruido y luz suave.
- **Acompañamiento:** Permanezca a su lado respetando sus tiempos sin forzar la conversación.

---

## 2. MANEJO DE CRISIS DE ANSIEDAD Y ATAQUES DE PÁNICO
Si presencias o experimentas un episodio de pánico:

### A. Respiración Guiada 4-7-8:
1. Inhale aire por la nariz lentamente contando **4 segundos**.
2. Retenga el aire en sus pulmones por **7 segundos**.
3. Exhale suavemente por la boca durante **8 segundos**.

### B. Técnica de Enraizamiento (Grounding 5-4-3-2-1):
Mire a su alrededor y nombre mentalmente:
- 5 Objetos a su vista.
- 4 Texturas que pueda tocar.
- 3 Sonidos en el ambiente.
- 2 Aromas que perciba.
- 1 Sabor presente.

---

## 3. PREVENCIÓN DEL BURNOUT Y ESTRÉS CRÓNICO
- Realice **pausas activas de 5 minutos** por cada hora y media de trabajo enfocado.
- Establezca límites claros entre su vida profesional y laboral.
- Utilice los programas confidenciales de apoyo psicológico de la empresa cuando lo requiera.`,
  },
  {
    id: 'doc-predef-rrhh-derechos',
    userId: 'global',
    empresaId: 'global',
    titulo: 'Manual de Recursos Humanos, Código de Conducta y Derechos Laborales',
    tipo: 'contrato',
    url: '',
    fechaSubida: '2026-01-01T00:00:00.000Z',
    leido: true,
    tamano: '2.1 MB',
    categoria: 'Normativa e Inclusión',
    contenido_completo: `# MANUAL DE RECURSOS HUMANOS, CÓDIGO DE CONDUCTA Y DERECHOS LABORALES

## 1. DERECHOS FUNDAMENTALES DEL TRABAJADOR
Nexxus garantiza a todos sus colaboradores:

- **Trato Digno e Igualitario:** Sin tolerancia a discriminaciones por origen, género, religión, raza, edad u orientación.
- **Tolerancia Cero al Acoso:** Protección total contra hostigamiento o acoso en cualquier jerarquía.
- **Confidencialidad de Datos:** Resguardo seguro de su expediente e información salarial.

---

## 2. POLÍTICA DE INCAPACIDADES Y VACACIONES
- **Incapacidades Médicas:** Deben reportarse dentro de las primeras **24 a 48 horas** a su supervisor directo y presentar comprobante oficial.
- **Vacaciones Anuales:** Deben solicitarse con al menos **15 días de anticipación** mediante la plataforma Nexxus.

---

## 3. CANALES ÉTICOS Y RESOLUCIÓN DE CONFLICTOS
Si detecta algún incumplimiento ético o norma laboral, utilice el **Canal de Ética Confidencial** dispuesto por el área de Recursos Humanos.`,
  },
  {
    id: 'doc-predef-emergencias-evacuacion',
    userId: 'global',
    empresaId: 'global',
    titulo: 'Protocolo de Respuesta ante Emergencias, Extintores y Evacuación',
    tipo: 'rrhh',
    url: '',
    fechaSubida: '2026-01-01T00:00:00.000Z',
    leido: true,
    tamano: '2.5 MB',
    categoria: 'Prevención y Evacuación',
    contenido_completo: `# PROTOCOLO OFICIAL DE RESPUESTA ANTE EMERGENCIAS Y EVACUACIÓN

## 1. PREVENCIÓN DE INCENDIOS Y USO DE EXTINTORES
Conozca el método **PASS** para operar un extintor de manera segura:

1. **P (Pull/Jalar):** Retire el pasador de seguridad rompiendo el plástico.
2. **A (Aim/Apuntar):** Apunte la boquilla hacia la **base del fuego**.
3. **S (Squeeze/Apretar):** Presione la manija de disparo de forma constante.
4. **S (Sweep/Barrer):** Mueva la manguera en abanico sobre la base.

---

## 2. EVACUACIÓN ANTE SISMOS U OTRAS CONTINGENCIAS
- **Durante el sismo:** Repliegue en zona segura, manténgase alejado de ventanas y adopte la posición de protección.
- **Durante la evacuación:** Siga las luces e itinerarios verdes. **NUNCA USE ELEVADORES**.
- **Punto de Encuentro:** Diríjase al área exterior designada y aguarde el pase de lista de los brigadistas.`,
  },
];
