/* course.config.js — Planillas Inteligentes */
window.COURSE_CONFIG = {
  "name": "Planillas Inteligentes",
  "slug": "planillas",
  "logo": "img/especializate-logo-blanco.png",
  "subtitle": "Organizá, analizá y automatizá tus planillas con ayuda de IA.",
  "links": {
    "rutas": "inicio.html",
    "progreso": "progreso.html",
    "badges": "badges.html"
  },
  "intro": {
    "label": "Inicio y bienvenida",
    "href": "inicio.html",
    "eyebrow": "Bienvenida",
    "title": "Inicio y bienvenida",
    "description": "Antes de comenzar, conocé especIAlizate, el programa del curso y una introducción al recorrido. Al completar estos tres contenidos se habilita el Módulo 1.",
    "resources": [
      {
        "step": "intro.especializate",
        "required": true,
        "label": "Sobre especIAlizate",
        "kind": "video",
        "youtubeId": "tc5-5os3mDk",
        "description": "Mirá este video para conocer qué es especIAlizate y cómo está organizado el recorrido."
      },
      {
        "step": "intro.introduccion",
        "required": true,
        "label": "Introducción al curso",
        "kind": "video",
        "youtubeId": "mEFWBdhKSgY",
        "description": "En este video vas a conocer la propuesta del curso y cómo se organiza el recorrido."
      },
      {
        "step": "intro.programa",
        "required": true,
        "label": "Programa del curso",
        "kind": "pdf",
        "url": "https://drive.google.com/file/d/1WJmM2uzwEAPCooK0HIVVnIdKOIZhxR6X/view?usp=sharing",
        "description": "Consultá el programa para conocer la propuesta formativa, los objetivos y la modalidad de cursada."
      }
    ]
  },
  "modules": [
    {
      "n": 1,
      "title": "Fundamentos y primeros pasos",
      "description": "En este módulo vas a dar tus primeros pasos con Google Sheets y la inteligencia artificial. Vas a aprender a preparar tu entorno de trabajo, comprender cómo se organiza una planilla, realizar cálculos básicos, limpiar datos y utilizar la IA como asistente sin perder el criterio humano.",
      "href": "modulo.html?m=1",
      "estimatedTime": "",
      "video": {
        "youtubeId": "PmuEajAZNh4",
        "duration": null
      },
      "quizUrl": "https://aulasvirtuales.bue.edu.ar/mod/quiz/view.php?id=979587",
      "objectives": [
        "Configurar Google Sheets y asistentes de IA para trabajar de manera organizada y segura.",
        "Reconocer celdas, rangos, filas, columnas y tipos de datos.",
        "Crear fórmulas y utilizar funciones básicas como SUMA, PROMEDIO, MAX, MIN y CONTAR.",
        "Detectar, limpiar y estandarizar datos problemáticos.",
        "Identificar errores de formato, categorías inconsistentes y registros duplicados.",
        "Utilizar prompts para pedir ayuda a la IA durante el trabajo con planillas y su evaluación crítica aplicando el principio GIGO."
      ],
      "promptbook": {
        "url": "https://drive.google.com/file/d/1XgNR6sxsDtwhRBIzm0iC4OO_0Kk4IdAR/preview",
        "label": "Promptbook",
        "description": "Prompts útiles para acompañarte en las prácticas de este módulo."
      },
      "units": [
        {
          "n": 1,
          "title": "Configuración del entorno y acceso",
          "description": "Vas a preparar las herramientas que utilizarás durante el curso, aprendiendo a acceder a Google Sheets y a trabajar en paralelo con asistentes de IA. También conocerás buenas prácticas para proteger información sensible antes de compartir datos.",
          "video": {
            "youtubeId": "r9dr6XtaPBQ"
          },
          "resources": [
            {
              "id": "m1u1-material",
              "category": "Material de estudio",
              "type": "Presentación (Gamma)",
              "label": "Presentación del tema",
              "required": true,
              "url": "https://gamma.app/docs/Planillas-Inteligentes-para-Finanzas-8huxo9t8y6ikotc"
            },
            {
              "id": "m1u1-doc",
              "category": "Material complementario",
              "type": "Documento PDF",
              "label": "Material complementario",
              "required": false,
              "url": "https://drive.google.com/file/d/1aemeSv25bptpKEZoFCbzd3U7YSXvnbKK/view?usp=drive_link"
            }
          ]
        },
        {
          "n": 2,
          "title": "Anatomía de la planilla y diagnóstico",
          "description": "Vas a conocer cómo está organizada una hoja de cálculo y cómo orientarte dentro de ella. Aprenderás a identificar celdas y rangos, reconocer distintos tipos de datos y detectar rápidamente posibles errores de formato.",
          "video": {
            "youtubeId": "COUwpZg-uVE"
          },
          "resources": [
            {
              "id": "m1u2-material",
              "category": "Material de estudio",
              "type": "Presentación (Gamma)",
              "label": "Presentación del tema",
              "required": true,
              "url": "https://gamma.app/docs/M1-U2-Planillas-Inteligentes-para-Finanzas--hafnws5dczttb8f"
            },
            {
              "id": "m1u2-doc",
              "category": "Material complementario",
              "type": "Documento PDF",
              "label": "Material complementario",
              "required": false,
              "url": "https://drive.google.com/file/d/1O2yLhwkJRjmvM8qqFj0WIdG5rjIseBSn/view?usp=drive_link"
            }
          ]
        },
        {
          "n": 3,
          "title": "Caja de herramientas básicas (Sandbox)",
          "description": "Vas a comenzar a transformar datos mediante fórmulas y funciones básicas de Google Sheets. Aprenderás cómo se construye una fórmula y cómo utilizar rangos para obtener totales, promedios, máximos, mínimos y realizar conteos.",
          "video": {
            "youtubeId": "CqT9JYS6Xrk"
          },
          "resources": [
            {
              "id": "m1u3-material",
              "category": "Material de estudio",
              "type": "Presentación (Gamma)",
              "label": "Presentación del tema",
              "required": true,
              "url": "https://gamma.app/docs/M1-U3-Planillas-Inteligentes-para-Finanzas-2m74lsdit6xca5h",
              "sandbox": {
                "dataset": "https://docs.google.com/spreadsheets/d/1atl4yaj6skmHUAU0IiOCGLrTvB0YUwcORatlDgCOHc0/edit?usp=drive_link",
                "goldcopy": "https://docs.google.com/spreadsheets/d/1z-1tRTY6MlBoekomtiOC4FMEG_7xykh6IsZT5bsvne0/edit?usp=drive_link",
                "video": "https://youtu.be/ABz5UVopq5I"
              }
            },
            {
              "id": "m1u3-doc",
              "category": "Material complementario",
              "type": "Documento PDF",
              "label": "Material complementario",
              "required": false,
              "url": "https://drive.google.com/file/d/13NwNR9w7RcFBrMbf2bdRY5Ui4Sgt0Dfz/view?usp=drive_link"
            }
          ]
        },
        {
          "n": 4,
          "title": "Taller práctico: limpieza de datos",
          "description": "Vas a aplicar un proceso completo de diagnóstico y limpieza sobre una base de datos. Trabajarás sobre formatos incorrectos, fechas, categorías inconsistentes y registros duplicados para convertir una base desordenada en información confiable para el análisis.",
          "video": {
            "youtubeId": "qsnM2zF1E_U"
          },
          "resources": [
            {
              "id": "m1u4-material",
              "category": "Material de estudio",
              "type": "Presentación (Gamma)",
              "label": "Presentación del tema",
              "required": true,
              "url": "https://gamma.app/docs/M1-U4-Planillas-Inteligentes-para-Finanzas-4ci9llyqsxtalua?mode=doc"
            },
            {
              "id": "m1u4-doc",
              "category": "Material complementario",
              "type": "Documento PDF",
              "label": "Material complementario",
              "required": false,
              "url": "https://drive.google.com/file/d/1MnkDIFm7Z8NX3fk6i_35hpKqCGt0nq0r/view?usp=drive_link"
            }
          ],
          "buho": {
            "consigna": "https://gamma.app/docs/M1-U4-Proyecto-Buho-Escribidor-d71g63mdj5e5ub1?mode=doc",
            "dataset": "https://docs.google.com/spreadsheets/d/1PqK7GC7wOAGLFpO1wbN0ya9pJcBjwrx_vj3fUTgpXgk/edit?usp=drive_link",
            "goldcopy": "https://docs.google.com/spreadsheets/d/10Gt-P5L5mx1VCm1yWbrXLB7jqm74GqHdPIv2S7IdhpE/edit?usp=drive_link",
            "video": "https://youtu.be/ZcW8xJjJEwU"
          }
        },
        {
          "n": 5,
          "title": "Auditoría y cierre",
          "description": "Vas a profundizar el uso de la IA como asistente para trabajar con Google Sheets y, especialmente, aprenderás a evaluar críticamente sus propuestas. El objetivo es reconocer cuándo una respuesta puede ser útil y cuándo una solución aparentemente rápida puede introducir errores o riesgos en los datos.",
          "video": {
            "youtubeId": "gvGWJFbPVJ8"
          },
          "resources": [
            {
              "id": "m1u5-material",
              "category": "Material de estudio",
              "type": "Presentación (Gamma)",
              "label": "Presentación del tema",
              "required": true,
              "url": "https://gamma.app/docs/M1-U5-Planillas-Inteligentes-para-Finanzas-0d6anest0yaklh3?mode=doc"
            },
            {
              "id": "m1u5-doc",
              "category": "Material complementario",
              "type": "Documento PDF",
              "label": "Material complementario",
              "required": false,
              "url": "https://drive.google.com/file/d/1s1O0YCstvuxarvr7HE_DNipb8Q-T2CnG/view?usp=drive_link"
            }
          ]
        }
      ]
    },
    {
      "n": 2,
      "title": "Funciones inteligentes",
      "description": "En este módulo vas a transformar una base de datos en una herramienta capaz de responder preguntas y detectar situaciones relevantes. Vas a combinar funciones de Google Sheets con inteligencia artificial para resumir información, relacionar datos, aplicar reglas y construir resultados confiables.",
      "href": "modulo.html?m=2",
      "estimatedTime": "",
      "video": {
        "youtubeId": "Aljq_cywUDE",
        "duration": null
      },
      "quizUrl": "https://aulasvirtuales.bue.edu.ar/mod/quiz/view.php?id=979588",
      "objectives": [
        "Organizar los datos con rangos con nombre para trabajar mejor con asistentes de IA.",
        "Pedir fórmulas en lenguaje natural y revisar críticamente las respuestas obtenidas.",
        "Agrupar y resumir información mediante SUMAR.SI.CONJUNTO.",
        "Relacionar información proveniente de distintas tablas utilizando BUSCARX.",
        "Aplicar lógica condicional con la función SI para construir alertas automáticas a partir de reglas de negocio.",
        "Crear un resumen ejecutivo, controles de integridad y auditorías antes de utilizar los datos para el análisis."
      ],
      "promptbook": {
        "url": "https://drive.google.com/file/d/1-ngSJA4ouuruy91NLSdSWAKh7gdG48kf/preview",
        "label": "Promptbook",
        "description": "Prompts útiles para acompañarte en las prácticas de este módulo."
      },
      "units": [
        {
          "n": 1,
          "title": "Hablando el idioma de la IA",
          "description": "Vas a aprender a organizar tus datos utilizando rangos con nombre para reemplazar referencias técnicas por conceptos fáciles de interpretar. Esto te permitirá comunicarte mejor con la IA, pedir fórmulas en lenguaje natural y reducir errores provocados por referencias poco claras.",
          "video": {
            "youtubeId": "sNfIbTNURsk"
          },
          "resources": [
            {
              "id": "m2u1-material",
              "category": "Material de estudio",
              "type": "Presentación (Gamma)",
              "label": "Presentación del tema",
              "required": true,
              "url": "https://gamma.app/docs/M2-U1-Planillas-Inteligentes-con-IA-rocm78l3ou16ox6"
            },
            {
              "id": "m2u1-doc",
              "category": "Material complementario",
              "type": "Documento PDF",
              "label": "Material complementario",
              "required": false,
              "url": "https://drive.google.com/file/d/1a3ox95FtybYzwTNdsJlIx4ySCPMZOs9W/view?usp=drive_link"
            }
          ],
          "buho": {
            "consigna": "https://gamma.app/docs/M2-U1-Proyecto-Buho-Escribidor-0kmkva8u32384n3",
            "goldcopy": "https://docs.google.com/spreadsheets/d/1pE4pE1VJ_yworppUODpV0vCEPAv79IrVz54dRCdVFBQ/edit?usp=drive_link",
            "video": "https://youtu.be/M1bGhFyG_J0"
          }
        },
        {
          "n": 2,
          "title": "Lógica condicional (SUMAR.SI.CONJUNTO)",
          "description": "Vas a aprender a pasar de una lista extensa de movimientos a información resumida y útil. Utilizarás SUMAR.SI.CONJUNTO para agrupar datos según determinadas condiciones y construir una tabla que se actualiza automáticamente.",
          "video": {
            "youtubeId": "GZDNuz2U62U"
          },
          "resources": [
            {
              "id": "m2u2-material",
              "category": "Material de estudio",
              "type": "Presentación (Gamma)",
              "label": "Presentación del tema",
              "required": true,
              "url": "https://gamma.app/docs/M2-U2-Planillas-Inteligentes-con-IA-msc78lr05dvpbki",
              "sandbox": {
                "dataset": "https://docs.google.com/spreadsheets/d/1FCZ9yU6u7q0pL0qzWFloGa6iEpwbTQ7II3gJzAiuwdg/edit?usp=sharing",
                "goldcopy": "https://docs.google.com/spreadsheets/d/1SO6wQmeyTlBcffATCSI63huw5m2RUC_yPwo8n6Bq6d4/edit?usp=sharing",
                "video": "https://www.youtube.com/embed/VE9DR-dUgUs?rel=0"
              }
            },
            {
              "id": "m2u2-doc",
              "category": "Material complementario",
              "type": "Documento PDF",
              "label": "Material complementario",
              "required": false,
              "url": "https://drive.google.com/file/d/10lXXcLOZ7ZS6LqaeNtXi3OP8sBYbUMXd/view?usp=drive_link"
            }
          ],
          "buho": {
            "consigna": "https://gamma.app/docs/M2-U2-Proyecto-Buho-Escribidor-tovmfi66hpa99y4",
            "goldcopy": "https://docs.google.com/spreadsheets/d/1BcvdNWTnxZvILaEWlfhUgFiZxOXwTOdiqtDCKibWjWg/edit?usp=drive_link",
            "video": "https://youtu.be/VGtW74jMGhg"
          }
        },
        {
          "n": 3,
          "title": "Enriquecimiento de datos (BUSCARX)",
          "description": "Vas a aprender a conectar información proveniente de distintas tablas mediante un dato en común. Con BUSCARX podrás incorporar información externa a tus análisis y crear relaciones entre diferentes fuentes de datos sin tener que copiar información manualmente.",
          "video": {
            "youtubeId": "ItYUbyWj8A8"
          },
          "resources": [
            {
              "id": "m2u3-material",
              "category": "Material de estudio",
              "type": "Presentación (Gamma)",
              "label": "Presentación del tema",
              "required": true,
              "url": "https://gamma.app/docs/M2-U3-Planillas-Inteligentes-con-IA-Enriquecimiento-de-Datos-BUS-kyte18ewesic9g8",
              "sandbox": {
                "dataset": "https://docs.google.com/spreadsheets/d/1FCZ9yU6u7q0pL0qzWFloGa6iEpwbTQ7II3gJzAiuwdg/edit?usp=sharing",
                "goldcopy": "https://docs.google.com/spreadsheets/d/1SO6wQmeyTlBcffATCSI63huw5m2RUC_yPwo8n6Bq6d4/edit?usp=sharing",
                "video": "https://youtu.be/VVf-X_MnaTw"
              }
            },
            {
              "id": "m2u3-doc",
              "category": "Material complementario",
              "type": "Documento PDF",
              "label": "Material complementario",
              "required": false,
              "url": "https://drive.google.com/file/d/1nXV6DnRO4BaaFaZ5H48WrKlzNrIcjDZp/view?usp=drive_link"
            }
          ],
          "buho": {
            "consigna": "https://gamma.app/docs/M2-U3-Proyecto-Buho-Escribidor-hz75uhwl477wwwg",
            "dataset": "https://drive.google.com/file/d/1UyPfzgmnCELtEd9xj4d-0DMceuRIRtyp/view?usp=drive_link",
            "goldcopy": "https://docs.google.com/spreadsheets/d/1dMKFlRmemYb5cUYYXUGIoIiXa9BBVPBR_qp1R00WfxY/edit?usp=drive_link",
            "video": "https://www.youtube.com/embed/1JHkg4k-5Kg?rel=0"
          }
        },
        {
          "n": 4,
          "title": "Inteligencia de negocio (Función SI / IF)",
          "description": "Vas a incorporar reglas y decisiones automáticas dentro de la planilla utilizando la función SI. Aprenderás a comparar valores, contemplar excepciones y generar alertas que permitan interpretar rápidamente el estado de los datos.",
          "video": {
            "youtubeId": "-kbSIcAtB5Q"
          },
          "resources": [
            {
              "id": "m2u4-material",
              "category": "Material de estudio",
              "type": "Presentación (Gamma)",
              "label": "Presentación del tema",
              "required": true,
              "url": "https://gamma.app/docs/M2-U4-Planillas-Inteligentes-para-Finanzas-5fgngokl5p2vxxp",
              "sandbox": {
                "dataset": "https://docs.google.com/spreadsheets/d/1FCZ9yU6u7q0pL0qzWFloGa6iEpwbTQ7II3gJzAiuwdg/edit?usp=sharing",
                "goldcopy": "https://docs.google.com/spreadsheets/d/1SO6wQmeyTlBcffATCSI63huw5m2RUC_yPwo8n6Bq6d4/edit?usp=sharing",
                "video": "https://youtu.be/73WX2VL02Nw"
              }
            },
            {
              "id": "m2u4-doc",
              "category": "Material complementario",
              "type": "Documento PDF",
              "label": "Material complementario",
              "required": false,
              "url": "https://drive.google.com/file/d/1Dae6W1SACDPNYhuwlvRq36oSYG6o9IF1/view?usp=drive_link"
            }
          ],
          "buho": {
            "consigna": "https://gamma.app/docs/M2-U4-Proyecto-Buho-Escribidor-vjocykg81vsnih0",
            "goldcopy": "https://docs.google.com/spreadsheets/d/1QRoGJnnm3rZHkGHsSMITNcsPF_5QNGjxe_ic9h3n7wI/edit?usp=drive_link",
            "video": "https://youtu.be/UlrUihvYD14"
          }
        },
        {
          "n": 5,
          "title": "Integración final y auditoría",
          "description": "Vas a integrar lo trabajado durante el módulo para construir una visión general de los resultados. Crearás indicadores de ingresos, gastos y resultado del período, y realizarás controles para comprobar que la información obtenida sea coherente y confiable.",
          "video": {
            "youtubeId": "W5eygoeG7Eo"
          },
          "resources": [
            {
              "id": "m2u5-material",
              "category": "Material de estudio",
              "type": "Presentación (Gamma)",
              "label": "Presentación del tema",
              "required": true,
              "url": "https://gamma.app/docs/M2-U5-Planillas-Inteligentes-para-Finanzas-cyk9meo85pfncw5"
            },
            {
              "id": "m2u5-doc",
              "category": "Material complementario",
              "type": "Documento PDF",
              "label": "Material complementario",
              "required": false,
              "url": "https://drive.google.com/file/d/1_77_zOmEtvQCclxh3JwVLGmgYtEkpkLG/view?usp=drive_link"
            }
          ],
          "buho": {
            "consigna": "https://gamma.app/docs/M2-U5-Proyecto-Buho-Escribidor-2v3a362xvg8uvne",
            "goldcopy": "https://docs.google.com/spreadsheets/d/1aArhGc3agAd0mtXMFilm94DhnZrweFAWxMB9gyN_mxg/edit?usp=drive_link",
            "video": "https://youtu.be/h8lfUXgAzmg"
          }
        }
      ]
    },
    {
      "n": 3,
      "title": "Asistentes de IA en planillas",
      "description": "En este módulo vas a transformar los datos y cálculos de tu planilla en información clara para la toma de decisiones. Vas a construir dashboards, analizar patrones con tablas dinámicas, utilizar la IA para interpretar datos y aprender a validar críticamente sus conclusiones.",
      "href": "modulo.html?m=3",
      "estimatedTime": "",
      "video": {
        "youtubeId": "XpzR5Sx-nrI",
        "duration": null
      },
      "quizUrl": "https://aulasvirtuales.bue.edu.ar/mod/quiz/view.php?id=979589",
      "objectives": [
        "Diseñar un Dashboard vinculando datos entre diferentes hojas, aplicando criterios de diseño y formato para mejorar la lectura de la información.",
        "Crear y utilizar Tablas Dinámicas",
        "Identificar patrones y comportamientos temporales.",
        "Utilizar IA para interpretar datos y redactar análisis ejecutivos.",
        "Trabajar con archivos CSV, y detectar errores y posibles alucinaciones en respuestas generadas por IA.",
        "Aplicar validaciones de datos para prevenir errores futuros."
      ],
      "promptbook": {
        "url": "https://drive.google.com/file/d/1u1PFHlW5Mp8RXP5Kk60yObTolqUcdCzC/preview",
        "label": "Promptbook",
        "description": "Prompts útiles para acompañarte en las prácticas de este módulo."
      },
      "units": [
        {
          "n": 1,
          "title": "Preparando el tablero de control",
          "description": "Vas a aprender a organizar y presentar los resultados de un análisis mediante un Dashboard. Trabajarás con vinculación entre hojas, formatos y criterios de diseño visual para transformar datos técnicos en información clara y fácil de interpretar.",
          "video": {
            "youtubeId": "rKAmDDZc3M0"
          },
          "resources": [
            {
              "id": "m3u1-material",
              "category": "Material de estudio",
              "type": "Presentación (Gamma)",
              "label": "Presentación del tema",
              "required": true,
              "url": "https://gamma.app/docs/M3-U1-ehw7thg932lfou8",
              "sandbox": {
                "dataset": "https://docs.google.com/spreadsheets/d/162M_FBmvMsgiciu4e--HPRfP0Rb7MXnuQjbDdmrkZ7U/edit?usp=sharing",
                "goldcopy": "https://docs.google.com/spreadsheets/d/1uEUewWKT5zEBiwKXe94T1LlR-0-G7lRMfwDDV4erUys/edit?usp=sharing",
                "video": "https://youtu.be/uoVrIPoe44E"
              }
            },
            {
              "id": "m3u1-doc",
              "category": "Material complementario",
              "type": "Documento PDF",
              "label": "Material complementario",
              "required": false,
              "url": "https://drive.google.com/file/d/1lr7n6oHrz_3ocoWpDx9581DHGOQ9s8zJ/view?usp=drive_link"
            }
          ],
          "buho": {
            "consigna": "https://gamma.app/docs/M3-U1-Proyecto-Buho-Escribidor-6zvkf8rvvy265nx",
            "goldcopy": "https://docs.google.com/spreadsheets/d/1P3ncGNxodBvGuLJskNHW6jHXhDdOy122MhGDxn6uQmU/edit?usp=sharing",
            "video": "https://youtu.be/9J_wBGdGsDo"
          }
        },
        {
          "n": 2,
          "title": "Análisis de temporada",
          "description": "Vas a utilizar Tablas Dinámicas para resumir información e identificar patrones temporales. Aprenderás a organizar los datos por períodos y a utilizar la IA para interpretar los resultados y convertirlos en un análisis ejecutivo.",
          "video": {
            "youtubeId": "AaQONeUKxCo"
          },
          "resources": [
            {
              "id": "m3u2-material",
              "category": "Material de estudio",
              "type": "Presentación (Gamma)",
              "label": "Presentación del tema",
              "required": true,
              "url": "https://gamma.app/docs/M3-U2-a3cbi4fvps54oc0",
              "sandbox": {
                "dataset": "https://docs.google.com/spreadsheets/d/1F9M2E1L7Lkg5ow36mtibXXFaNkGcb4jojX-RAzp-Wh4/edit?usp=sharing",
                "goldcopy": "https://docs.google.com/spreadsheets/d/1O3RiGU-15TZOTzMWK1ql2oqT1q9MDcC5AciJHjaUQSM/edit?usp=sharing",
                "video": "https://youtu.be/vsHonF6TJvw"
              }
            },
            {
              "id": "m3u2-doc",
              "category": "Material complementario",
              "type": "Documento PDF",
              "label": "Material complementario",
              "required": false,
              "url": "https://drive.google.com/file/d/18BiHfevsEJw4tLxndWIZjY_ocJqhxiGb/view?usp=drive_link"
            }
          ],
          "buho": {
            "consigna": "https://gamma.app/docs/M3-U2-Proyecto-Buho-Escribidor-vnj3wpns4wrmizt",
            "goldcopy": "https://docs.google.com/spreadsheets/d/1JcejDNSSWFpSH8BYGY0U7wfclTpqV912n2NABpoPdq4/edit?usp=sharing",
            "video": "https://youtu.be/egDGBZRAEK8"
          }
        },
        {
          "n": 3,
          "title": "Automatizar resúmenes, análisis o mensajes a partir de datos",
          "description": "Vas a incorporar la IA como parte del proceso de análisis de datos. Aprenderás a trabajar con prompts estructurados y archivos de datos para generar tanto análisis detallados como resúmenes ejecutivos adaptados a diferentes necesidades.",
          "video": {
            "youtubeId": "K6obExLXWk0"
          },
          "resources": [
            {
              "id": "m3u3-material",
              "category": "Material de estudio",
              "type": "Presentación (Gamma)",
              "label": "Presentación del tema",
              "required": true,
              "url": "https://gamma.app/docs/M3-U3-Planilla-Inteligentes-para-Finanzas-628tva6i3je358c",
              "sandbox": {
                "dataset": "https://docs.google.com/spreadsheets/d/1rkMaW365KP43D-ZZxY72UAmCG7UMVdrB03y_wUb-Dn0/edit?usp=sharing",
                "goldcopy": "https://docs.google.com/document/d/1VQdIfh0V3aglZXAKstyZ8zFRUnW7pvLWLkUb5HjwQeI/edit?usp=sharing",
                "video": "https://youtu.be/fNASq5oRKNY"
              }
            },
            {
              "id": "m3u3-doc",
              "category": "Material complementario",
              "type": "Documento PDF",
              "label": "Material complementario",
              "required": false,
              "url": "https://drive.google.com/file/d/1BfM5cEUhsm7tzU28-x4_uYQowQu_EdG4/view?usp=drive_link"
            }
          ],
          "buho": {
            "consigna": "https://gamma.app/docs/M3-U3-Proyecto-Buho-Escribidor-0cla4suki4625vf",
            "goldcopy": "https://docs.google.com/spreadsheets/d/1W_hx96Xgl-UCZ6eVGkXRHI2B5ywmY86mz2-ZinKI8Uc/edit?usp=sharing",
            "video": "https://youtu.be/2U7nkenF6i4"
          }
        },
        {
          "n": 4,
          "title": "Cierre y validación: el rol del auditor",
          "description": "Vas a aprender a revisar críticamente los análisis generados por IA y contrastarlos con los datos reales. También incorporarás herramientas de validación para prevenir errores y asegurar que la información de la planilla siga siendo consistente y confiable.",
          "video": {
            "youtubeId": "JP8BMEiwG_M"
          },
          "resources": [
            {
              "id": "m3u4-material",
              "category": "Material de estudio",
              "type": "Presentación (Gamma)",
              "label": "Presentación del tema",
              "required": true,
              "url": "https://gamma.app/docs/M3-U4-Planilla-Inteligentes-para-Finanzas-hc6c3ywbttlzc1f"
            },
            {
              "id": "m3u4-doc",
              "category": "Material complementario",
              "type": "Documento PDF",
              "label": "Material complementario",
              "required": false,
              "url": "https://drive.google.com/file/d/1JeZ8J9oTXlJdS8OokYiVIsG5vwm2E_z4/view?usp=drive_link"
            }
          ],
          "buho": {
            "consigna": "https://gamma.app/docs/M3-U4-Proyecto-Buho-Escribidor-5n6s2jsqmg75bbt",
            "goldcopy": "https://docs.google.com/spreadsheets/d/1VoeyOyvUTtCght3gdh5cAgxiNg_lpG8K_D5-vzPqBho/edit?usp=sharing",
            "video": "https://youtu.be/MIHDhC6Vbb8"
          }
        }
      ]
    },
    {
      "n": 4,
      "title": "Automatización y flujos simples",
      "description": "En este módulo vas a aprender a transformar una planilla en un sistema capaz de detectar situaciones relevantes, tomar decisiones y ejecutar acciones automáticamente. Vas a combinar fórmulas, lógica condicional, generación de textos y scripts con IA para reducir tareas manuales y construir flujos de trabajo más eficientes.",
      "href": "modulo.html?m=4",
      "estimatedTime": "",
      "video": {
        "youtubeId": "6dT_K8rY4CA",
        "duration": null
      },
      "quizUrl": "https://aulasvirtuales.bue.edu.ar/mod/quiz/view.php?id=979590",
      "objectives": [
        "Comprender cómo funciona un flujo de automatización mediante Evento → Acción → Resultado.",
        "Vas a saber identificar las situaciones que requieren intervención de las que no.",
        "Combinar funciones SI e Y para construir condiciones lógicas que permitan activar acciones desde la propia planilla.",
        "Generar alertas automáticas a partir de reglas de negocio.",
        "Crear textos y reportes dinámicos utilizando TEXTJOIN / UNIRCADENAS y TEXTO.",
        "Utilizar HIPERVINCULO y enlaces para preparar comunicaciones automáticas.",
        "Utilizar IA para generar y comprender scripts de Google Apps Script.",
        "Automatizar tareas estructurales, aplicando protocolos de seguridad."
      ],
      "promptbook": {
        "url": "https://drive.google.com/file/d/1_CBDLRZhTC8XJ3MzCEvY8NX3dFvnCUfh/preview",
        "label": "Promptbook",
        "description": "Prompts útiles para acompañarte en las prácticas de este módulo."
      },
      "units": [
        {
          "n": 1,
          "title": "El concepto de flujo: auditoría y reporte",
          "description": "Vas a conocer los fundamentos de una automatización y aprender a pensar los procesos como una secuencia de evento, acción y resultado. También vas a definir qué situaciones realmente necesitan una alerta y preparar la planilla para detectar esos casos automáticamente.",
          "video": {
            "youtubeId": "kSzh7yDSZnc"
          },
          "resources": [
            {
              "id": "m4u1-material",
              "category": "Material de estudio",
              "type": "Presentación (Gamma)",
              "label": "Presentación del tema",
              "required": true,
              "url": "https://gamma.app/docs/M4-U1-Planilla-Inteligentes-para-Finanzas-8dl8m6uyenbbrw4"
            },
            {
              "id": "m4u1-doc",
              "category": "Material complementario",
              "type": "Documento PDF",
              "label": "Material complementario",
              "required": false,
              "url": "https://drive.google.com/file/d/1L_bvrfbFJqoDKfMLh_b0bBLeWIVoP5fa/view?usp=drive_link"
            }
          ],
          "buho": {
            "consigna": "https://gamma.app/docs/M4-U1-Proyecto-Buho-Escribidor-5as10nxilk3dr6l",
            "goldcopy": "https://docs.google.com/spreadsheets/d/1ZmqBB8--H9bHSaJVeLo44t2XruBJU2Ag0CfvaITFg4w/edit?usp=sharing",
            "video": "https://youtu.be/MUdWThnctcc"
          }
        },
        {
          "n": 2,
          "title": "El cerebro lógico",
          "description": "Vas a incorporar lógica condicional para que la planilla pueda tomar decisiones según varias condiciones simultáneas. Aprenderás a combinar las funciones SI y Y para crear filtros inteligentes que distingan entre información normal y situaciones que requieren una acción.",
          "video": {
            "youtubeId": "7YzSgQjGAQk"
          },
          "resources": [
            {
              "id": "m4u2-material",
              "category": "Material de estudio",
              "type": "Presentación (Gamma)",
              "label": "Presentación del tema",
              "required": true,
              "url": "https://gamma.app/docs/M4-U2-Planilla-Inteligentes-para-Finanzas-dl2igf1acmn1s4s",
              "sandbox": {
                "dataset": "https://docs.google.com/spreadsheets/d/1pF7a3uAd2j2BxaBtC1wJnsO7DGF_2T8jwOp44wAAKGs/edit?usp=sharing",
                "goldcopy": "https://docs.google.com/spreadsheets/d/1hSzod0Q10VLq1XKV6KJ-2AmsosRUA4bovC5yNoE_lNE/edit?usp=sharing",
                "video": "https://youtu.be/Seo9vFqn57c"
              }
            },
            {
              "id": "m4u2-doc",
              "category": "Material complementario",
              "type": "Documento PDF",
              "label": "Material complementario",
              "required": false,
              "url": "https://drive.google.com/file/d/1ueBPsgLQSQIRRLFruMc42RcIMhIvus-m/view?usp=drive_link"
            }
          ],
          "buho": {
            "consigna": "https://gamma.app/docs/M4-U2-Proyecto-Buho-Escribidor-fotvvefsgvxdbod",
            "goldcopy": "https://docs.google.com/spreadsheets/d/1nLJWchEGaM3V80-3DZbiYqOy1Is9T_cPiyiNPBMfuRk/edit?usp=sharing",
            "video": "https://youtu.be/qbPO8R7PPXY"
          }
        },
        {
          "n": 3,
          "title": "Automatización: el reporte inteligente",
          "description": "Vas a transformar las alertas de la planilla en mensajes listos para utilizar. Aprenderás a generar textos dinámicos, reunir información de varias filas en un único reporte y crear hipervínculos que preparen automáticamente un correo con los datos relevantes.",
          "video": {
            "youtubeId": "-y20TQThzc4"
          },
          "resources": [
            {
              "id": "m4u3-material",
              "category": "Material de estudio",
              "type": "Presentación (Gamma)",
              "label": "Presentación del tema",
              "required": true,
              "url": "https://gamma.app/docs/M4-U3-Planilla-Inteligentes-para-Finanzas-zourmxzt7ruophg",
              "sandbox": {
                "dataset": "https://docs.google.com/spreadsheets/d/11O87tfXsZHw0XCn9jBbS8v_Ed_e-9vDmvMwSJ4tx_AI/edit?usp=sharing",
                "goldcopy": "https://docs.google.com/spreadsheets/d/1HCtsCWqTrDhrKsVuVzWnTeAnwN5NU_YaSPjfX2VDuAE/edit?usp=sharing",
                "video": "https://youtu.be/no5s8wn4Mck"
              }
            },
            {
              "id": "m4u3-doc",
              "category": "Material complementario",
              "type": "Documento PDF",
              "label": "Material complementario",
              "required": false,
              "url": "https://drive.google.com/file/d/1l4C7Bje0Vb0zx2BJDW3wDTmNj7kUNpRt/view?usp=drive_link"
            }
          ],
          "buho": {
            "consigna": "https://gamma.app/docs/M4-U3-Proyecto-Buho-Escribidor-6jlttidi958cqx8",
            "goldcopy": "https://docs.google.com/spreadsheets/d/1-iP4hNC9Y4n-8aOSZKMqIw3HiMMVn2rGa0GE56ku_wY/edit?usp=sharing",
            "video": "https://youtu.be/sQeQNRQtRc4"
          }
        },
        {
          "n": 4,
          "title": "Mantenimiento: el botón rojo",
          "description": "Vas a dar el salto de las fórmulas a la automatización con Google Apps Script, utilizando la IA como apoyo para generar código. Aprenderás a crear acciones que modifican la estructura de la planilla y a implementar mecanismos de respaldo para proteger los datos antes de realizar operaciones de limpieza.",
          "video": {
            "youtubeId": "WePQ6teWOEI"
          },
          "resources": [
            {
              "id": "m4u4-material",
              "category": "Material de estudio",
              "type": "Presentación (Gamma)",
              "label": "Presentación del tema",
              "required": true,
              "url": "https://gamma.app/docs/M4-U4-Planilla-Inteligentes-para-Finanzas-e64t58h7vnaqssf",
              "sandbox": {
                "dataset": "https://docs.google.com/spreadsheets/d/1Qfq2SQu2JnsDbXxo0K4i8aOedhIMHewBGhOdwDIhkTA/edit?usp=sharing",
                "goldcopy": "https://docs.google.com/spreadsheets/d/1uSK3TCD6xE1DBR9eKdmldyCp3qZaRx_4o2TNcCrJ_e4/edit?usp=sharing",
                "video": "https://youtu.be/LfuKLKkFiPQ"
              }
            },
            {
              "id": "m4u4-doc",
              "category": "Material complementario",
              "type": "Documento PDF",
              "label": "Material complementario",
              "required": false,
              "url": "https://drive.google.com/file/d/1oFUcY-DPbazrCOKTEY68WvfV87Re4lL3/view?usp=drive_link"
            }
          ],
          "buho": {
            "consigna": "https://gamma.app/docs/M4-U4-Proyecto-Buho-Escribidor-vaslmuq7z30rdrv",
            "goldcopy": "https://docs.google.com/spreadsheets/d/1QPqlHhXTnzsT1-EXttn-0NpHompU-MFCMFQjFIUBHl8/edit?usp=drive_link",
            "video": "https://youtu.be/p_6Tgqwh06w"
          }
        }
      ]
    },
    {
      "n": 5,
      "title": "Visualización de datos y tableros de control",
      "description": "En este módulo vas a transformar datos y análisis en un tablero visual, interactivo y reutilizable. Vas a aprender a estructurar información para responder preguntas de negocio, elegir visualizaciones adecuadas, construir dashboards dinámicos y aplicar criterios de seguridad y privacidad.",
      "href": "modulo.html?m=5",
      "estimatedTime": "",
      "video": {
        "youtubeId": "r2KvXR0QjbM",
        "duration": null
      },
      "quizUrl": "https://aulasvirtuales.bue.edu.ar/mod/quiz/view.php?id=979591",
      "objectives": [
        "Analizar y organizar información mediante Tablas Dinámicas.",
        "Elegir visualizaciones adecuadas para comunicar tendencias, comparaciones y desvíos.",
        "Construir dashboards dinámicos con filtros, selectores y criterios de UX.",
        "Utilizar IA como apoyo para el análisis y la visualización de datos.",
        "Aplicar buenas prácticas de seguridad, privacidad y mantenimiento de la planilla."
      ],
      "promptbook": {
        "url": "https://drive.google.com/file/d/167jytaTmcWhHuSjBwpkDGc6yAkARtBxt/preview",
        "label": "Promptbook",
        "description": "Prompts útiles para acompañarte en las prácticas de este módulo."
      },
      "units": [
        {
          "n": 1,
          "title": "Inteligencia de negocios (Pivot Tables)",
          "description": "Vas a aprender a transformar datos aislados en diferentes vistas de análisis mediante Tablas Dinámicas. Trabajarás con tendencias, categorías, rankings y agrupaciones temporales para responder preguntas concretas y preparar las bases que alimentarán el Dashboard.",
          "video": {
            "youtubeId": "NgUaOA6bzdo"
          },
          "resources": [
            {
              "id": "m5u1-material",
              "category": "Material de estudio",
              "type": "Presentación (Gamma)",
              "label": "Presentación del tema",
              "required": true,
              "url": "https://gamma.app/docs/M5-U1-Planillas-inteligentes-para-finanzas-y7lb99aqfatp6z1",
              "sandbox": {
                "dataset": "https://docs.google.com/spreadsheets/d/1aQ9_iRGGrT1GsIXUnWBOtsfqywGnhgdnlmBpcnpqZzw/edit?usp=sharing",
                "goldcopy": "https://docs.google.com/spreadsheets/d/1lANALMQyn6FsZPNb7sYgFbp3A4rHUVEJBs7R36QOPwE/edit?usp=drive_link",
                "video": "https://youtu.be/FwevKg3i0aM"
              }
            },
            {
              "id": "m5u1-doc",
              "category": "Material complementario",
              "type": "Documento PDF",
              "label": "Material complementario",
              "required": false,
              "url": "https://drive.google.com/file/d/11Tva8-e07OhF71avyZxROlVo0iJ-8lI_/view?usp=drive_link"
            }
          ],
          "buho": {
            "consigna": "https://gamma.app/docs/M5-U1-Proyecto-Buho-Escribidor-i3wrlannjg039h9",
            "goldcopy": "https://docs.google.com/spreadsheets/d/16gpRo0ggS0Q6xrQpAOGoiW58yLWvm6-Y4T1NuuO1pwY/edit?usp=sharing",
            "video": "https://youtu.be/ZNtG4T5i2Co"
          }
        },
        {
          "n": 2,
          "title": "Visualización de datos (Storytelling y Desvíos)",
          "description": "Vas a transformar los análisis en visualizaciones que permitan interpretar rápidamente lo que sucede. Aprenderás a elegir entre gráficos de tendencia, composición y comparación, y a representar desvíos entre los resultados reales y lo planificado.",
          "video": {
            "youtubeId": "l2WT4xDwpcQ"
          },
          "resources": [
            {
              "id": "m5u2-material",
              "category": "Material de estudio",
              "type": "Presentación (Gamma)",
              "label": "Presentación del tema",
              "required": true,
              "url": "https://gamma.app/docs/M5-U2-Planillas-Inteligentes-para-Finanzas-la8k24d7uyqymt5",
              "sandbox": {
                "dataset": "https://docs.google.com/spreadsheets/d/1eF1inuCA9Zv_zz5mSKFInyKa1r3EIxYajb4DlUjlapc/edit?usp=drive_link",
                "goldcopy": "https://docs.google.com/spreadsheets/d/1g1WPfKwWXQHAGLnJl5ij2MJjkM4NKMdNurUZllQjhE4/edit?usp=sharing",
                "video": "https://youtu.be/IiDFAhQXbTg"
              }
            },
            {
              "id": "m5u2-doc",
              "category": "Material complementario",
              "type": "Documento PDF",
              "label": "Material complementario",
              "required": false,
              "url": "https://drive.google.com/file/d/1M31W5XSei7OHtGJ9kyJGX4C-AV-c5wc6/view?usp=drive_link"
            }
          ],
          "buho": {
            "consigna": "https://gamma.app/docs/M5-U2-Proyecto-Buho-Escribidor-imi5g73g3ybna1l",
            "goldcopy": "https://docs.google.com/spreadsheets/d/12KXX3iKG1Ojm4VuhGg1Gkw2ueNbAOJlR3b7gkYpfBS0/edit?usp=drive_link",
            "video": "https://youtu.be/dCVyHOV76FM"
          }
        },
        {
          "n": 3,
          "title": "El Dashboard dinámico (UX y Filtrado)",
          "description": "Vas a integrar gráficos, indicadores y controles dentro de un Dashboard interactivo. Aplicarás principios de experiencia de usuario y crearás filtros, selectores y capas de datos dinámicas para que la información cambie según las necesidades del usuario.",
          "video": {
            "youtubeId": "YG2XSi-a5tQ"
          },
          "resources": [
            {
              "id": "m5u3-material",
              "category": "Material de estudio",
              "type": "Presentación (Gamma)",
              "label": "Presentación del tema",
              "required": true,
              "url": "https://gamma.app/docs/M5-U3-Planillas-Inteligentes-para-Finanzas-82pgj950sw88yfv",
              "sandbox": {
                "dataset": "https://docs.google.com/spreadsheets/d/1C-L0V0jhpvetwiJotnpU8AZSrKUjLagtyMlGq_qAr14/edit?usp=sharing",
                "goldcopy": "https://docs.google.com/spreadsheets/d/16BrYtY2IyOFKnrOtNjLNCMxB4AzhDADZRL_OKIMHa-s/edit?usp=sharing",
                "video": "https://youtu.be/d2fDQU0j72A"
              }
            },
            {
              "id": "m5u3-doc",
              "category": "Material complementario",
              "type": "Documento PDF",
              "label": "Material complementario",
              "required": false,
              "url": "https://drive.google.com/file/d/1eAOjXRxqBmKDiG3KE_hznpbHUoTzxk3x/view?usp=drive_link"
            }
          ],
          "buho": {
            "consigna": "https://gamma.app/docs/M5-U3-Proyecto-Buho-Escribidor-92ehz69bxssylap",
            "goldcopy": "https://docs.google.com/spreadsheets/d/1uW5eXLliocreaslpfcKwyS6BsN6C9mlOlw8EgIX6UEI/edit?usp=drive_link",
            "video": "https://youtu.be/rG4dOo3dJqM"
          }
        },
        {
          "n": 4,
          "title": "El sistema circular (seguridad y nuevo período)",
          "description": "Vas a preparar tu sistema para que pueda utilizarse de manera segura y recurrente. Aprenderás a proteger información sensible, trabajar con datos anonimizados o sintéticos, cerrar un período, conservar el histórico y dejar la planilla preparada para comenzar un nuevo ciclo.",
          "video": {
            "youtubeId": "arai3vdBNgY"
          },
          "resources": [
            {
              "id": "m5u4-material",
              "category": "Material de estudio",
              "type": "Presentación (Gamma)",
              "label": "Presentación del tema",
              "required": true,
              "url": "https://gamma.app/docs/M5-U4-Planillas-Inteligentes-para-Finanzas-g4v1tctyemxk6cg"
            },
            {
              "id": "m5u4-doc",
              "category": "Material complementario",
              "type": "Documento PDF",
              "label": "Material complementario",
              "required": false,
              "url": "https://drive.google.com/file/d/1oKQZX_L3wVtj6-yYeq4jxIfSPdaI-eNT/view?usp=drive_link"
            }
          ],
          "buho": {
            "consigna": "https://gamma.app/docs/M5-U4-Proyecto-Buho-Escribidor-f2v29g88r6bfv55",
            "dataset": "https://docs.google.com/spreadsheets/d/1tn6Cq4WRvl1FhDPmyGUswp5f5Q7Gb6ETZJakjluKjsU/edit?usp=drive_link",
            "goldcopy": "https://docs.google.com/spreadsheets/d/15pi_IftTdnyCXGXXn-SFzYIR2YRCz5SAq0vcoMt6SEo/edit?usp=drive_link",
            "video": "https://youtu.be/zxHI__RVppY"
          }
        }
      ]
    }
  ],
  "final": {
    "label": "Evaluación final",
    "href": "final.html",
    "description": "La evaluación final integra todo el recorrido. Se habilita al completar los cinco módulos; se rinde y se aprueba en Moodle, donde también se valida la disponibilidad de tu certificación.",
    "quizUrl": "https://aulasvirtuales.bue.edu.ar/mod/quiz/view.php?id=979592",
    "certUrl": "https://aulasvirtuales.bue.edu.ar/mod/customcert/view.php?id=980625"
  },
  "closing": {
    "label": "Cierre del curso",
    "gamma": "https://gamma.app/docs/Cierre-Planillas-inteligentes-skrxzge1vcne862",
    "description": "Un cierre para integrar todo lo trabajado en el curso."
  }
};
