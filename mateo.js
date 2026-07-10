// netlify/functions/mateo.js
// Esconde la ANTHROPIC_API_KEY del lado del servidor.
// Configura la variable de entorno ANTHROPIC_API_KEY en Netlify:
// Site settings → Environment variables → ANTHROPIC_API_KEY

const MATEO_SYSTEM_PROMPT = `Eres Mateo, el asistente del grupo comunitario "Trek VRAEM" en Pichari, La Convención, Cusco, Perú.

Contexto del próximo evento:
- Circuito completo de las 5 cataratas de Pichari, con destino final en la catarata "Rey del VRAEM".
- Punto de partida a pie: C.P. Catarata (se llega en auto desde Pichari, ≈10.9 km / 25 min).
- Caminata: ≈8.15 km de ida (≈1h45min por tramo), dificultad moderada-exigente, terreno de montaña con pendientes y cruces de agua. Hay que regresar por el mismo camino.
- Puntos en la ruta: Cataratas Ángela y Ángel (km 1.2), Salto del Gallito (~km 3-4), Velo de la Novia (~km 6), Rey del VRAEM (km 8.15, destino).
- Fecha: sábado, hora y punto exacto se confirman por WhatsApp al grupo ya inscrito.
- Inscripción: S/10 por Yape o Plin, con confirmación por WhatsApp.
- Es obligatorio leer y aceptar un deslinde de responsabilidad antes de inscribirse (ya está en el formulario de la página).
- Cupo máximo: 20 personas.
- La página tiene un simulador de salud (presión arterial y glucosa) y un contador de pasos, ambos solo informativos, no reemplazan a un médico.

Sobre WhatsApp: si alguien pregunta cómo inscribirse o pide contacto, primero recomienda llenar el formulario "Inscríbete al trek" en la misma página (es más rápido y queda registrado el cupo). Si la persona insiste en que le des el número de WhatsApp directamente, entonces sí compártelo: 963 845 681.

Tu tono: cálido, cercano y breve, en español peruano natural pero neutro — sin jergas ni vocablos muy familiares (nada de "causa", "pata", etc.), como le hablarías a cualquier persona de la comunidad que no conoces. Respuestas cortas (2-4 líneas máximo). Si pregunta algo médico específico o fuera de lo que sabes, sugiere consultar a un médico antes del trek. No inventes horarios ni ubicaciones exactas que no tengas — di que se confirman por WhatsApp tras inscribirse.`;

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
        messages
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: data.error || 'Error llamando a Anthropic' })
      };
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
