/* DATOS: ediciones de Steam. Galería y capturas locales; referencias en docs/FUENTES.md. */
const GAMES = [
  {
    "id": "horizon",
    "name": "Horizon Zero Dawn™ Complete Edition",
    "platforms": [
      "PC · Windows"
    ],
    "genres": [
      "Acción",
      "RPG"
    ],
    "year": 2020,
    "synopsis": "Explora una Tierra reconquistada por máquinas.",
    "description": "Acompaña a Aloy en una aventura de exploración, combate y descubrimiento entre ruinas de una civilización perdida.",
    "featured": true,
    "cover": "assets/images/horizon.jpg",
    "alt": "Arte promocional de Horizon Zero Dawn™ Complete Edition",
    "source": "https://store.steampowered.com/app/1151640/",
    "releaseDate": "7 AGO 2020",
    "hero": "assets/images/horizon-scene.jpg",
    "gallery": [
      {
        "src": "assets/images/horizon-scene.jpg",
        "label": "Captura del juego"
      },
      {
        "src": "assets/images/horizon.jpg",
        "label": "Arte promocional"
      },
      {
        "src": "assets/images/horizon-wide.jpg",
        "label": "Ambientación"
      }
    ],
    "coverPosition": "center",
    "heroPosition": "center"
  },
  {
    "id": "hollow",
    "name": "Hollow Knight",
    "platforms": [
      "PC · Windows",
      "Mac",
      "Linux"
    ],
    "genres": [
      "Aventura",
      "Acción"
    ],
    "year": 2017,
    "synopsis": "Un insecto explora un reino subterráneo en ruinas.",
    "description": "Metroidvania de dibujo a mano con combates exigentes y un mapa interconectado.",
    "featured": true,
    "cover": "assets/images/hollow.jpg",
    "alt": "Arte promocional de Hollow Knight",
    "source": "https://store.steampowered.com/app/367520/",
    "releaseDate": "24 FEB 2017",
    "hero": "assets/images/hollow-scene.jpg",
    "gallery": [
      {
        "src": "assets/images/hollow-scene.jpg",
        "label": "Captura del juego"
      },
      {
        "src": "assets/images/hollow.jpg",
        "label": "Arte promocional"
      },
      {
        "src": "assets/images/hollow-wide.jpg",
        "label": "Ambientación"
      }
    ],
    "coverPosition": "center",
    "heroPosition": "center"
  },
  {
    "id": "celeste",
    "name": "Celeste",
    "platforms": [
      "PC · Windows",
      "Mac",
      "Linux"
    ],
    "genres": [
      "Plataformas"
    ],
    "year": 2018,
    "synopsis": "Escala una montaña y enfrenta tus dudas.",
    "description": "Plataformas precisas con opciones de asistencia y una historia personal.",
    "featured": false,
    "cover": "assets/images/celeste.jpg",
    "alt": "Arte promocional de Celeste",
    "source": "https://store.steampowered.com/app/504230/",
    "releaseDate": "25 ENE 2018",
    "hero": "assets/images/celeste-scene.jpg",
    "gallery": [
      {
        "src": "assets/images/celeste-scene.jpg",
        "label": "Captura del juego"
      },
      {
        "src": "assets/images/celeste.jpg",
        "label": "Arte promocional"
      },
      {
        "src": "assets/images/celeste-wide.jpg",
        "label": "Ambientación"
      }
    ],
    "coverPosition": "center",
    "heroPosition": "center"
  },
  {
    "id": "hades",
    "name": "Hades",
    "platforms": [
      "PC · Windows",
      "Mac"
    ],
    "genres": [
      "Acción",
      "Roguelike"
    ],
    "year": 2020,
    "synopsis": "Escapa del inframundo en cada intento.",
    "description": "Acción rápida donde cada fuga mejora tus armas y avanza la historia.",
    "featured": true,
    "cover": "assets/images/hades.jpg",
    "alt": "Arte promocional de Hades",
    "source": "https://store.steampowered.com/app/1145360/",
    "releaseDate": "17 SEP 2020",
    "hero": "assets/images/hades-scene.jpg",
    "gallery": [
      {
        "src": "assets/images/hades-scene.jpg",
        "label": "Captura del juego"
      },
      {
        "src": "assets/images/hades.jpg",
        "label": "Arte promocional"
      },
      {
        "src": "assets/images/hades-wide.jpg",
        "label": "Ambientación"
      }
    ],
    "coverPosition": "center",
    "heroPosition": "center"
  },
  {
    "id": "stardew",
    "name": "Stardew Valley",
    "platforms": [
      "PC · Windows",
      "Mac",
      "Linux"
    ],
    "genres": [
      "Simulación",
      "RPG"
    ],
    "year": 2016,
    "synopsis": "Una nueva vida empieza en tu granja.",
    "description": "Cultiva, pesca, explora minas y conoce a los habitantes del valle a tu propio ritmo.",
    "featured": false,
    "cover": "assets/images/stardew.jpg",
    "alt": "Arte promocional de Stardew Valley",
    "source": "https://store.steampowered.com/app/413150/",
    "releaseDate": "26 FEB 2016",
    "hero": "assets/images/stardew-scene.jpg",
    "gallery": [
      {
        "src": "assets/images/stardew-scene.jpg",
        "label": "Captura del juego"
      },
      {
        "src": "assets/images/stardew.jpg",
        "label": "Arte promocional"
      },
      {
        "src": "assets/images/stardew-wide.jpg",
        "label": "Ambientación"
      }
    ],
    "coverPosition": "center",
    "heroPosition": "center"
  },
  {
    "id": "portal2",
    "name": "Portal 2",
    "platforms": [
      "PC · Windows",
      "Linux"
    ],
    "genres": [
      "Puzles"
    ],
    "year": 2011,
    "synopsis": "Resuelve puzles con portales y humor negro.",
    "description": "Secuela con nuevas mecánicas de gel y un modo cooperativo muy elogiado.",
    "featured": false,
    "cover": "assets/images/portal2.jpg",
    "alt": "Arte promocional de Portal 2",
    "source": "https://store.steampowered.com/app/620/",
    "releaseDate": "18 ABR 2011",
    "hero": "assets/images/portal2-scene.jpg",
    "gallery": [
      {
        "src": "assets/images/portal2-scene.jpg",
        "label": "Captura del juego"
      },
      {
        "src": "assets/images/portal2.jpg",
        "label": "Arte promocional"
      },
      {
        "src": "assets/images/portal2-wide.jpg",
        "label": "Ambientación"
      }
    ],
    "coverPosition": "center",
    "heroPosition": "center"
  },
  {
    "id": "witcher3",
    "name": "The Witcher 3: Wild Hunt — Remastered",
    "platforms": [
      "PC · Windows"
    ],
    "genres": [
      "RPG"
    ],
    "year": 2015,
    "synopsis": "Geralt busca a su hija adoptiva en un mundo vivo.",
    "description": "RPG de decisiones con consecuencias, monstruos y misiones secundarias memorables.",
    "featured": true,
    "cover": "assets/images/witcher3.jpg",
    "alt": "Arte promocional de The Witcher 3: Wild Hunt — Remastered",
    "source": "https://store.steampowered.com/app/292030/",
    "releaseDate": "18 MAY 2015",
    "hero": "assets/images/witcher3-scene.jpg",
    "gallery": [
      {
        "src": "assets/images/witcher3-scene.jpg",
        "label": "Captura del juego"
      },
      {
        "src": "assets/images/witcher3.jpg",
        "label": "Arte promocional"
      },
      {
        "src": "assets/images/witcher3-wide.jpg",
        "label": "Ambientación"
      }
    ],
    "coverPosition": "center",
    "heroPosition": "center"
  },
  {
    "id": "terraria",
    "name": "Terraria",
    "platforms": [
      "PC · Windows",
      "Mac",
      "Linux"
    ],
    "genres": [
      "Aventura",
      "Supervivencia"
    ],
    "year": 2011,
    "synopsis": "Excava, construye y explora un mundo de posibilidades.",
    "description": "Una aventura de construcción en dos dimensiones con biomas, criaturas y tesoros por descubrir.",
    "featured": false,
    "cover": "assets/images/terraria.jpg",
    "alt": "Arte promocional de Terraria",
    "source": "https://store.steampowered.com/app/105600/",
    "releaseDate": "16 MAY 2011",
    "hero": "assets/images/terraria-scene.jpg",
    "gallery": [
      {
        "src": "assets/images/terraria-scene.jpg",
        "label": "Captura del juego"
      },
      {
        "src": "assets/images/terraria.jpg",
        "label": "Arte promocional"
      },
      {
        "src": "assets/images/terraria-wide.jpg",
        "label": "Ambientación"
      }
    ],
    "coverPosition": "center",
    "heroPosition": "center"
  },
  {
    "id": "psychonauts",
    "name": "Psychonauts 2",
    "platforms": [
      "PC · Windows",
      "Mac",
      "Linux"
    ],
    "genres": [
      "Plataformas",
      "Aventura"
    ],
    "year": 2021,
    "synopsis": "Viaja por mundos que nacen de la imaginación.",
    "description": "Raz utiliza sus habilidades psíquicas para explorar mentes y resolver misterios en una aventura de plataformas.",
    "featured": false,
    "cover": "assets/images/psychonauts.jpg",
    "alt": "Arte promocional de Psychonauts 2",
    "source": "https://store.steampowered.com/app/607080/",
    "releaseDate": "24 AGO 2021",
    "hero": "assets/images/psychonauts-scene.jpg",
    "gallery": [
      {
        "src": "assets/images/psychonauts-scene.jpg",
        "label": "Captura del juego"
      },
      {
        "src": "assets/images/psychonauts.jpg",
        "label": "Arte promocional"
      },
      {
        "src": "assets/images/psychonauts-wide.jpg",
        "label": "Ambientación"
      }
    ],
    "coverPosition": "center",
    "heroPosition": "center"
  },
  {
    "id": "elden",
    "name": "ELDEN RING",
    "platforms": [
      "PC · Windows"
    ],
    "genres": [
      "RPG",
      "Acción"
    ],
    "year": 2022,
    "synopsis": "Un vasto mundo abierto de desafíos oscuros.",
    "description": "Acción RPG con exploración libre, jefes memorables y construcción de personaje profunda.",
    "featured": true,
    "cover": "assets/images/elden.jpg",
    "alt": "Arte promocional de ELDEN RING",
    "source": "https://store.steampowered.com/app/1245620/",
    "releaseDate": "24 FEB 2022",
    "hero": "assets/images/elden-scene.jpg",
    "gallery": [
      {
        "src": "assets/images/elden-scene.jpg",
        "label": "Captura del juego"
      },
      {
        "src": "assets/images/elden.jpg",
        "label": "Arte promocional"
      },
      {
        "src": "assets/images/elden-wide.jpg",
        "label": "Ambientación"
      }
    ],
    "coverPosition": "center",
    "heroPosition": "center"
  },
  {
    "id": "disco",
    "name": "Disco Elysium - The Final Cut",
    "platforms": [
      "PC · Windows",
      "Mac"
    ],
    "genres": [
      "RPG"
    ],
    "year": 2019,
    "synopsis": "Un detective sin memoria investiga un caso.",
    "description": "RPG de diálogo donde tus habilidades internas opinan y moldean la historia.",
    "featured": false,
    "cover": "assets/images/disco.jpg",
    "alt": "Arte promocional de Disco Elysium - The Final Cut",
    "source": "https://store.steampowered.com/app/632470/",
    "releaseDate": "15 OCT 2019",
    "hero": "assets/images/disco-scene.jpg",
    "gallery": [
      {
        "src": "assets/images/disco-scene.jpg",
        "label": "Captura del juego"
      },
      {
        "src": "assets/images/disco.jpg",
        "label": "Arte promocional"
      },
      {
        "src": "assets/images/disco-wide.jpg",
        "label": "Ambientación"
      }
    ],
    "coverPosition": "center",
    "heroPosition": "center"
  },
  {
    "id": "cuphead",
    "name": "Cuphead",
    "platforms": [
      "PC · Windows",
      "Mac"
    ],
    "genres": [
      "Acción",
      "Plataformas"
    ],
    "year": 2017,
    "synopsis": "Jefes difíciles con estética de dibujos de los años 30.",
    "description": "Run and gun con animación dibujada a mano y cooperativo local.",
    "featured": false,
    "cover": "assets/images/cuphead.jpg",
    "alt": "Arte promocional de Cuphead",
    "source": "https://store.steampowered.com/app/268910/",
    "releaseDate": "29 SEP 2017",
    "hero": "assets/images/cuphead-scene.jpg",
    "gallery": [
      {
        "src": "assets/images/cuphead-scene.jpg",
        "label": "Captura del juego"
      },
      {
        "src": "assets/images/cuphead.jpg",
        "label": "Arte promocional"
      },
      {
        "src": "assets/images/cuphead-wide.jpg",
        "label": "Ambientación"
      }
    ],
    "coverPosition": "center",
    "heroPosition": "center"
  },
  {
    "id": "undertale",
    "name": "Undertale",
    "platforms": [
      "PC · Windows",
      "Mac",
      "Linux"
    ],
    "genres": [
      "RPG"
    ],
    "year": 2015,
    "synopsis": "Un RPG donde puedes no pelear.",
    "description": "Cada encuentro permite hablar o luchar, y el mundo reacciona a tu elección.",
    "featured": false,
    "cover": "assets/images/undertale.jpg",
    "alt": "Arte promocional de Undertale",
    "source": "https://store.steampowered.com/app/391540/",
    "releaseDate": "15 SEP 2015",
    "hero": "assets/images/undertale-scene.jpg",
    "gallery": [
      {
        "src": "assets/images/undertale-scene.jpg",
        "label": "Captura del juego"
      },
      {
        "src": "assets/images/undertale.jpg",
        "label": "Arte promocional"
      },
      {
        "src": "assets/images/undertale-wide.jpg",
        "label": "Ambientación"
      }
    ],
    "coverPosition": "center",
    "heroPosition": "center"
  },
  {
    "id": "rocket",
    "name": "Rocket League®",
    "platforms": [
      "PC · Windows"
    ],
    "genres": [
      "Deportes"
    ],
    "year": 2015,
    "synopsis": "Fútbol con coches propulsados por cohetes.",
    "description": "Partidas cortas y competitivas con física precisa y mucho estilo.",
    "featured": false,
    "cover": "assets/images/rocket.jpg",
    "alt": "Arte promocional de Rocket League®",
    "source": "https://store.steampowered.com/app/252950/",
    "releaseDate": "6 JUL 2015",
    "hero": "assets/images/rocket-scene.jpg",
    "gallery": [
      {
        "src": "assets/images/rocket-scene.jpg",
        "label": "Captura del juego"
      },
      {
        "src": "assets/images/rocket.jpg",
        "label": "Arte promocional"
      },
      {
        "src": "assets/images/rocket-wide.jpg",
        "label": "Ambientación"
      }
    ],
    "coverPosition": "center",
    "heroPosition": "center"
  },
  {
    "id": "doom",
    "name": "DOOM Eternal",
    "platforms": [
      "PC · Windows"
    ],
    "genres": [
      "Shooter"
    ],
    "year": 2020,
    "synopsis": "Velocidad y ferocidad contra hordas demoníacas.",
    "description": "Shooter que premia el movimiento constante y la gestión de recursos.",
    "featured": false,
    "cover": "assets/images/doom.jpg",
    "alt": "Arte promocional de DOOM Eternal",
    "source": "https://store.steampowered.com/app/782330/",
    "releaseDate": "19 MAR 2020",
    "hero": "assets/images/doom-scene.jpg",
    "gallery": [
      {
        "src": "assets/images/doom-scene.jpg",
        "label": "Captura del juego"
      },
      {
        "src": "assets/images/doom.jpg",
        "label": "Arte promocional"
      },
      {
        "src": "assets/images/doom-wide.jpg",
        "label": "Ambientación"
      }
    ],
    "coverPosition": "center",
    "heroPosition": "center"
  },
  {
    "id": "alyx",
    "name": "Half-Life: Alyx",
    "platforms": [
      "PC · Windows"
    ],
    "genres": [
      "Shooter"
    ],
    "year": 2020,
    "synopsis": "Aventura de realidad virtual en el universo Half-Life.",
    "description": "Juego VR con puzles, combate y exploración ambientado antes de Half-Life 2.",
    "featured": false,
    "cover": "assets/images/alyx.jpg",
    "alt": "Arte promocional de Half-Life: Alyx",
    "source": "https://store.steampowered.com/app/546560/",
    "releaseDate": "23 MAR 2020",
    "hero": "assets/images/alyx-scene.jpg",
    "gallery": [
      {
        "src": "assets/images/alyx-scene.jpg",
        "label": "Captura del juego"
      },
      {
        "src": "assets/images/alyx.jpg",
        "label": "Arte promocional"
      },
      {
        "src": "assets/images/alyx-wide.jpg",
        "label": "Ambientación"
      }
    ],
    "coverPosition": "center",
    "heroPosition": "center"
  },
  {
    "id": "hifi",
    "name": "Hi-Fi RUSH",
    "platforms": [
      "PC · Windows"
    ],
    "genres": [
      "Acción"
    ],
    "year": 2023,
    "synopsis": "Combate al ritmo de la música.",
    "description": "Acción donde atacas y esquivas al compás, con estética de dibujos animados.",
    "featured": true,
    "cover": "assets/images/hifi.jpg",
    "alt": "Arte promocional de Hi-Fi RUSH",
    "source": "https://store.steampowered.com/app/1817230/",
    "releaseDate": "25 ENE 2023",
    "hero": "assets/images/hifi-scene.jpg",
    "gallery": [
      {
        "src": "assets/images/hifi-scene.jpg",
        "label": "Captura del juego"
      },
      {
        "src": "assets/images/hifi.jpg",
        "label": "Arte promocional"
      },
      {
        "src": "assets/images/hifi-wide.jpg",
        "label": "Ambientación"
      }
    ],
    "coverPosition": "center",
    "heroPosition": "center"
  },
  {
    "id": "bg3",
    "name": "Baldur's Gate 3",
    "platforms": [
      "PC · Windows",
      "Mac"
    ],
    "genres": [
      "RPG"
    ],
    "year": 2023,
    "synopsis": "Rol por turnos con libertad de decisión.",
    "description": "RPG de Larian basado en reglas de D&D, jugable solo o en cooperativo.",
    "featured": true,
    "cover": "assets/images/bg3.jpg",
    "alt": "Arte promocional de Baldur's Gate 3",
    "source": "https://store.steampowered.com/app/1086940/",
    "releaseDate": "3 AGO 2023",
    "hero": "assets/images/bg3-scene.jpg",
    "gallery": [
      {
        "src": "assets/images/bg3-scene.jpg",
        "label": "Captura del juego"
      },
      {
        "src": "assets/images/bg3.jpg",
        "label": "Arte promocional"
      },
      {
        "src": "assets/images/bg3-wide.jpg",
        "label": "Ambientación"
      }
    ],
    "coverPosition": "center",
    "heroPosition": "center"
  },
  {
    "id": "forza",
    "name": "Forza Horizon 5",
    "platforms": [
      "PC · Windows"
    ],
    "genres": [
      "Carreras"
    ],
    "year": 2021,
    "synopsis": "Festival de carreras en un México abierto.",
    "description": "Conduce cientos de coches por distintos biomas y eventos.",
    "featured": false,
    "cover": "assets/images/forza.jpg",
    "alt": "Arte promocional de Forza Horizon 5",
    "source": "https://store.steampowered.com/app/1551360/",
    "releaseDate": "8 NOV 2021",
    "hero": "assets/images/forza-scene.jpg",
    "gallery": [
      {
        "src": "assets/images/forza-scene.jpg",
        "label": "Captura del juego"
      },
      {
        "src": "assets/images/forza.jpg",
        "label": "Arte promocional"
      },
      {
        "src": "assets/images/forza-wide.jpg",
        "label": "Ambientación"
      }
    ],
    "coverPosition": "center",
    "heroPosition": "center"
  },
  {
    "id": "civilization",
    "name": "Sid Meier’s Civilization® VI",
    "platforms": [
      "PC · Windows",
      "Mac",
      "Linux"
    ],
    "genres": [
      "Estrategia"
    ],
    "year": 2016,
    "synopsis": "Construye una civilización que resista al tiempo.",
    "description": "Dirige tu imperio por turnos: explora, investiga, negocia y elige tu camino hacia la victoria.",
    "featured": false,
    "cover": "assets/images/civilization.jpg",
    "alt": "Arte promocional de Sid Meier’s Civilization® VI",
    "source": "https://store.steampowered.com/app/289070/",
    "releaseDate": "20 OCT 2016",
    "hero": "assets/images/civilization-scene.jpg",
    "gallery": [
      {
        "src": "assets/images/civilization-scene.jpg",
        "label": "Captura del juego"
      },
      {
        "src": "assets/images/civilization.jpg",
        "label": "Arte promocional"
      },
      {
        "src": "assets/images/civilization-wide.jpg",
        "label": "Ambientación"
      }
    ],
    "coverPosition": "center",
    "heroPosition": "center"
  },
  {
    "id": "rdr2",
    "name": "Red Dead Redemption 2",
    "platforms": [
      "PC · Windows"
    ],
    "genres": [
      "Aventura",
      "Acción"
    ],
    "year": 2019,
    "synopsis": "El ocaso de una banda de forajidos.",
    "description": "Aventura en mundo abierto con narrativa extensa en el Salvaje Oeste.",
    "featured": false,
    "cover": "assets/images/rdr2.jpg",
    "alt": "Arte promocional de Red Dead Redemption 2",
    "source": "https://store.steampowered.com/app/1174180/",
    "releaseDate": "5 DIC 2019",
    "hero": "assets/images/rdr2-scene.jpg",
    "gallery": [
      {
        "src": "assets/images/rdr2-scene.jpg",
        "label": "Captura del juego"
      },
      {
        "src": "assets/images/rdr2.jpg",
        "label": "Arte promocional"
      },
      {
        "src": "assets/images/rdr2-wide.jpg",
        "label": "Ambientación"
      }
    ],
    "coverPosition": "center",
    "heroPosition": "center"
  },
  {
    "id": "outer",
    "name": "Outer Wilds",
    "platforms": [
      "PC · Windows"
    ],
    "genres": [
      "Aventura",
      "Puzles"
    ],
    "year": 2020,
    "synopsis": "Explora un sistema solar atrapado en un bucle.",
    "description": "Misterio de exploración donde el conocimiento es tu único progreso.",
    "featured": false,
    "cover": "assets/images/outer.jpg",
    "alt": "Arte promocional de Outer Wilds",
    "source": "https://store.steampowered.com/app/753640/",
    "releaseDate": "18 JUN 2020",
    "hero": "assets/images/outer-scene.jpg",
    "gallery": [
      {
        "src": "assets/images/outer-scene.jpg",
        "label": "Captura del juego"
      },
      {
        "src": "assets/images/outer.jpg",
        "label": "Arte promocional"
      },
      {
        "src": "assets/images/outer-wide.jpg",
        "label": "Ambientación"
      }
    ],
    "coverPosition": "center",
    "heroPosition": "center"
  },
  {
    "id": "souls",
    "name": "DARK SOULS™: REMASTERED",
    "platforms": [
      "PC · Windows"
    ],
    "genres": [
      "RPG",
      "Acción"
    ],
    "year": 2018,
    "synopsis": "Un reino en decadencia y combates implacables.",
    "description": "Acción RPG de diseño interconectado que popularizó el género.",
    "featured": false,
    "cover": "assets/images/souls.jpg",
    "alt": "Arte promocional de DARK SOULS™: REMASTERED",
    "source": "https://store.steampowered.com/app/570940/",
    "releaseDate": "23 MAY 2018",
    "hero": "assets/images/souls-scene.jpg",
    "gallery": [
      {
        "src": "assets/images/souls-scene.jpg",
        "label": "Captura del juego"
      },
      {
        "src": "assets/images/souls.jpg",
        "label": "Arte promocional"
      },
      {
        "src": "assets/images/souls-wide.jpg",
        "label": "Ambientación"
      }
    ],
    "coverPosition": "center",
    "heroPosition": "center"
  },
  {
    "id": "among",
    "name": "Among Us",
    "platforms": [
      "PC · Windows"
    ],
    "genres": [
      "Social"
    ],
    "year": 2018,
    "synopsis": "Encuentra al impostor de tu tripulación.",
    "description": "Completa tareas, detecta sabotajes y debate con tus compañeros en partidas de deducción social.",
    "featured": false,
    "cover": "assets/images/among.jpg",
    "alt": "Arte promocional de Among Us",
    "source": "https://store.steampowered.com/app/945360/",
    "releaseDate": "16 NOV 2018",
    "hero": "assets/images/among-scene.jpg",
    "gallery": [
      {
        "src": "assets/images/among-scene.jpg",
        "label": "Captura del juego"
      },
      {
        "src": "assets/images/among.jpg",
        "label": "Arte promocional"
      },
      {
        "src": "assets/images/among-wide.jpg",
        "label": "Ambientación"
      }
    ],
    "coverPosition": "center",
    "heroPosition": "center"
  }
];
