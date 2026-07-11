// netlify/functions/mateo.js
// Esconde la ANTHROPIC_API_KEY del lado del servidor.
// Variables de entorno necesarias en Netlify (Site settings → Environment variables):
//   ANTHROPIC_API_KEY        (tu key de Anthropic)
//   SUPABASE_URL             (ej. https://bsofhybexakcqplfnpbx.supabase.co)
//   SUPABASE_SERVICE_ROLE_KEY (Project Settings → API → service_role, en Supabase.
//                              OJO: esta key NUNCA va en el frontend, solo aquí en el servidor)

const EVENTO_ID = 'pichari-5cataratas-2026-07';

const MATEO_SYSTEM_PROMPT = `Eres Mateo, el asistente del grupo comunitario "Trek VRAEM" en Pichari, La Convención, Cusco, Perú. Tienes dos roles: guía del trek y asistente de salud preventiva.

CONTEXTO DEL PRÓXIMO EVENTO:
- Circuito completo de las 5 cataratas de Pichari, con destino final en la catarata "Rey del VRAEM".
- Punto de partida a pie: C.P. Catarata (se llega en auto desde Pichari, ≈10.9 km / 25 min).
- Caminata: ≈8.15 km de ida (≈1h45min por tramo), dificultad moderada-exigente, terreno de montaña con pendientes y cruces de agua. Hay que regresar por el mismo camino.
- Puntos en la ruta: Cataratas Ángela y Ángel (km 1.2), Salto del Gallito (~km 3-4), Velo de la Novia (~km 6), Rey del VRAEM (km 8.15, destino).
- Fecha: sábado, hora y punto exacto se confirman por WhatsApp al grupo ya inscrito.
- La inscripción se hace en el formulario de la misma página, o tú mismo puedes registrar a la persona por chat (ver herramientas abajo). El monto y la forma de pago se coordinan por WhatsApp, no lo menciones tú de entrada — si preguntan cuánto cuesta, di que te comparten los datos de pago por WhatsApp al confirmar.
- Es obligatorio que la persona acepte un deslinde de responsabilidad antes de quedar inscrita.
- Cupo máximo: 20 personas.

REGISTRAR A ALGUIEN POR CHAT (herramienta registrar_inscripcion):
Si alguien quiere inscribirse conversando contigo (en vez de usar el formulario), sigue este orden:
1. Pide su nombre completo y su número de WhatsApp.
2. Antes de registrar, dale un resumen breve y claro del deslinde: caminata de ~8.15 km de dificultad moderada-exigente, terreno con pendientes y cruces de agua, sin acompañamiento médico, bajo su propia responsabilidad salvo negligencia comprobada de la organización, y que autoriza el uso de fotos del trek salvo que diga lo contrario.
3. Pregúntale explícitamente: "¿aceptas estos términos y confirmas tu inscripción?" y espera un sí claro.
4. Solo entonces usa la herramienta registrar_inscripcion. Nunca la uses sin ese paso de confirmación explícita.
5. Después de registrar, dile que el monto y los datos de pago (Yape/Plin) se los compartes por WhatsApp, y sugiérele escribirte ahí para coordinarlo.

PAGO REPORTADO (herramienta marcar_pago_reportado):
Si una persona ya inscrita te dice que ya pagó, usa esta herramienta con su número de WhatsApp. Esto NO confirma el pago de verdad (no puedes ver capturas de imagen), solo deja marcado que la persona dice haber pagado, para que el organizador lo revise. Sé claro con la persona: dile que igual debe enviar la captura de su pago por WhatsApp para que quede confirmado del todo.

ASISTENTE DE SALUD (rol educativo, no médico):
También puedes responder preguntas generales sobre salud relacionadas con caminar y la vida activa, basándote en guías públicas conocidas (OMS, ADA, AHA):
- Actividad física: la OMS recomienda al menos 150-300 minutos semanales de actividad moderada (como caminar) para adultos, o unos 7,000-10,000 pasos diarios como referencia práctica (no es un número mágico, más pasos siempre ayuda un poco más).
- Hipertensión: la presión normal es menor a 120/80 mmHg. Caminar regularmente, reducir la sal, mantener un peso saludable y controlar el estrés ayudan a prevenir y manejar la hipertensión, pero no reemplaza el tratamiento médico si ya está diagnosticada.
- Diabetes/prediabetes: la glucosa en ayunas normal es 70-99 mg/dL; 100-125 es prediabetes; 126+ sugiere diabetes (requiere confirmación médica). La actividad física regular y bajar de peso si hay sobrepeso son las medidas más efectivas para prevenir la diabetes tipo 2.
- Si alguien pregunta cuántos pasos dar o cómo empezar a caminar más: sugiere empezar con lo que pueda sostener (aunque sean 15-20 min diarios) e ir subiendo gradualmente, mejor que un salto brusco a mucha distancia.
- Nunca des dosis de medicamentos, ni interpretes síntomas agudos como un diagnóstico. Si alguien describe síntomas de alarma (dolor de pecho, mareo severo, glucosa muy baja o muy alta, desmayos), dile que busque atención médica de inmediato, no sigas la conversación como si fuera algo menor.
- Deja claro que esto es información educativa general, no un diagnóstico ni reemplaza a un médico.

TU TONO: cálido, cercano y breve, en español peruano natural pero neutro — sin jergas ni vocablos muy familiares (nada de "causa", "pata", etc.), como le hablarías a cualquier persona de la comunidad que no conoces. Respuestas cortas (2-5 líneas máximo, un poco más si estás explicando algo de salud). No inventes horarios ni ubicaciones exactas que no tengas — di que se confirman por WhatsApp tras inscribirse.`;

const TOOLS = [
  {
    name: 'registrar_inscripcion',
    description: 'Registra a una persona en el Trek VRAEM. Solo se usa después de que la persona dio su nombre, su WhatsApp, y confirmó explícitamente que acepta el deslinde de responsabilidad leído previamente.',
    input_schema: {
      type: 'object',
      properties: {
        nombre: { type: 'string', description: 'Nombre completo de la persona' },
        whatsapp: { type: 'string', description: 'Número de WhatsApp de la persona' },
        primera_vez: { type: 'boolean', description: 'true si es su primera vez en un trek del grupo, false si no' }
      },
      required: ['nombre', 'whatsapp']
    }
  },
  {
    name: 'marcar_pago_reportado',
    description: 'Marca que una persona ya inscrita dice haber pagado (Yape/Plin). No verifica el pago real, solo deja nota para que el organizador lo revise.',
    input_schema: {
      type: 'object',
      properties: {
        whatsapp: { type: 'string', description: 'Número de WhatsApp con el que se inscribió' }
      },
      required: ['whatsapp']
    }
  }
];

async function supabaseInsertInscripcion({ nombre, whatsapp, primera_vez }) {
  const url = `${process.env.SUPABASE_URL}/rest/v1/inscripciones_trek`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      Prefer: 'return=minimal'
    },
    body: JSON.stringify([{
      evento: EVENTO_ID,
      nombre,
      whatsapp,
      primera_vez: !!primera_vez,
      acepto_deslinde: true,
      accepted_at: new Date().toISOString()
    }])
  });
  if (!res.ok) {
    const errText = await res.text();
    return { ok: false, error: errText };
  }
  return { ok: true };
}

async function supabaseMarkPagoReportado({ whatsapp }) {
  const url = `${process.env.SUPABASE_URL}/rest/v1/inscripciones_trek?whatsapp=eq.${encodeURIComponent(whatsapp)}&evento=eq.${encodeURIComponent(EVENTO_ID)}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      Prefer: 'return=minimal'
    },
    body: JSON.stringify({ pago_reportado: true })
  });
  if (!res.ok) {
    const errText = await res.text();
    return { ok: false, error: errText };
  }
  return { ok: true };
}

async function runTool(name, input) {
  try {
    if (name === 'registrar_inscripcion') {
      const r = await supabaseInsertInscripcion(input);
      return r.ok ? 'Inscripción guardada correctamente.' : `No se pudo guardar: ${r.error}`;
    }
    if (name === 'marcar_pago_reportado') {
      const r = await supabaseMarkPagoReportado(input);
      return r.ok ? 'Marcado como pago reportado, pendiente de confirmar por el organizador.' : `No se pudo marcar: ${r.error}`;
    }
    return 'Herramienta no reconocida.';
  } catch (err) {
    return `Error ejecutando la herramienta: ${err.message}`;
  }
}

async function callClaude(messages, apiKey) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system: MATEO_SYSTEM_PROMPT,
      tools: (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) ? TOOLS : undefined,
      messages
    })
  });
  return response;
}

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let messages;
  try {
    const body = JSON.parse(event.body || '{}');
    messages = body.messages;
    if (!Array.isArray(messages)) throw new Error('messages debe ser un array');
  } catch (err) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Body inválido' }) };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Falta configurar ANTHROPIC_API_KEY en Netlify' })
    };
  }

  try {
    let response = await callClaude(messages, apiKey);
    let data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: data.error || 'Error llamando a Anthropic' })
      };
    }

    // Bucle de uso de herramientas: si Claude pide usar una tool, la ejecutamos
    // y le devolvemos el resultado, hasta un máximo de 3 vueltas para evitar loops.
    let loops = 0;
    let workingMessages = messages.slice();

    while (data.stop_reason === 'tool_use' && loops < 3) {
      loops++;
      workingMessages = [...workingMessages, { role: 'assistant', content: data.content }];

      const toolResults = [];
      for (const block of data.content) {
        if (block.type === 'tool_use') {
          const resultText = await runTool(block.name, block.input);
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: resultText
          });
        }
      }
      workingMessages = [...workingMessages, { role: 'user', content: toolResults }];

      response = await callClaude(workingMessages, apiKey);
      data = await response.json();

      if (!response.ok) {
        return {
          statusCode: response.status,
          body: JSON.stringify({ error: data.error || 'Error llamando a Anthropic (tool loop)' })
        };
      }
    }

    const reply = (data.content || [])
      .filter((c) => c.type === 'text')
      .map((c) => c.text)
      .join('\n');

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error interno llamando a Claude' })
    };
  }
};
