---
name: buscar-trabajo
description: Lanza al agente cazador-empleo para buscar y evaluar trabajos con Claude Code (≥ $45/h, remoto o híbrido desde West Palm Beach), actualizar el pipeline y preparar postulaciones. Úsalo cuando el usuario diga "busca trabajo", "nuevas ofertas", "cómo va mi búsqueda", "prepara la postulación".
---

# /buscar-trabajo

1. Delega en el subagente `cazador-empleo` (Agent tool, `subagent_type: "cazador-empleo"`) con este encargo:
   "Ejecuta tu flujo completo: lee job-search/perfil.md y job-search/pipeline.md, busca ofertas nuevas, evalúalas, actualiza el pipeline, prepara postulaciones para las de puntaje ≥ 70 y devuelve el reporte final."
   - Si el usuario pasó argumentos (ej. una URL de oferta o "solo prepara la postulación de X"), inclúyelos y pide al agente que se limite a eso.
2. Muestra al usuario el reporte del agente tal cual (en español), con los títulos enlazados.
3. Si hubo cambios en `job-search/`, haz commit con un mensaje tipo `job-search: actualización AAAA-MM-DD` y push a la rama actual.
