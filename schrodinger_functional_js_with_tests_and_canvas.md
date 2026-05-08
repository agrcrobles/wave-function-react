# Ecuación de Schrödinger funcional en TypeScript + Tests Unitarios + Canvas

Este proyecto implementa una versión educativa y funcional de la ecuación de Schrödinger.

Objetivos:

- usar funciones puras
- mantener operaciones matemáticas pequeñas y componibles
- agregar comentarios humanos explicando cada paso
- permitir ejecución local inmediata
- visualizar la función de onda en Canvas
- incluir tests unitarios

Estructura sugerida del proyecto:

```txt
quantum-wave/
├── package.json
├── tsconfig.json
├── jest.config.js
├── src/
│   ├── schrodinger.ts
│   └── index.html
└── tests/
    └── schrodinger.test.ts
```

Instalación:

```bash
npm install
```

Correr tests:

```bash
npm test
```

Abrir visualización:

Abrir directamente:

```txt
src/index.html
```

O usando VSCode Live Server.


## Implementación funcional

```ts
// schrodinger.ts

// Constante reducida de Planck.
// Es una constante fundamental de mecánica cuántica.
export const hbar = 1.054571817e-34;

// Multiplica un número por sí mismo.
// Representa x².
export const square = (x: number): number =>
  x * x;

// Función pura de multiplicación currificada.
// multiply(2)(3) => 6
export const multiply = (a: number) =>
  (b: number): number =>
    a * b;

// División funcional.
// divide(10)(2) => 5
export const divide = (a: number) =>
  (b: number): number =>
    a / b;

// Cambia el signo.
// negate(5) => -5
export const negate = (x: number): number =>
  -x;

// Suma funcional currificada.
// add(2)(3) => 5
export const add = (a: number) =>
  (b: number): number =>
    a + b;

// Aproximación discreta de segunda derivada.
// Esto representa la curvatura de la función de onda.
// En mecánica cuántica la curvatura está relacionada
// con energía cinética.
export const secondDerivative = (
  psiLeft: number,
  psiCenter: number,
  psiRight: number,
  dx: number
): number =>
  (psiLeft - 2 * psiCenter + psiRight) / square(dx);

// Término cinético de Schrödinger.
// Representa cómo cambia la onda en el espacio.
export const kineticTerm = (
  mass: number,
  secondDeriv: number
): number =>
  negate(
    divide(square(hbar))(2 * mass)
  ) * secondDeriv;

// Energía potencial.
// Multiplica el potencial por la amplitud ψ.
export const potentialTerm = (
  potential: number,
  psi: number
): number =>
  potential * psi;

// Hamiltoniano.
// Combina energía cinética y potencial.
// Es el corazón matemático de Schrödinger.
export const hamiltonian = (
  mass: number,
  potential: number,
  psiLeft: number,
  psiCenter: number,
  psiRight: number,
  dx: number
): number => {

  // Calculamos la curvatura espacial.
  const d2psi = secondDerivative(
    psiLeft,
    psiCenter,
    psiRight,
    dx
  );

  // Energía cinética.
  const kinetic = kineticTerm(
    mass,
    d2psi
  );

  // Energía potencial.
  const potentialEnergy = potentialTerm(
    potential,
    psiCenter
  );

  // Energía total.
  return add(kinetic)(potentialEnergy);
};
```

---

# Tests Unitarios (Jest)

```ts
// schrodinger.test.ts

import {
  square,
  secondDerivative,
  potentialTerm,
  hamiltonian
} from './schrodinger';

describe('Schrodinger Functional Math', () => {

  test('square()', () => {
    expect(square(3)).toBe(9);
  });

  test('secondDerivative()', () => {

    const result = secondDerivative(
      1,
      2,
      1,
      1
    );

    expect(result).toBe(-2);
  });

  test('potentialTerm()', () => {

    const result = potentialTerm(
      10,
      2
    );

    expect(result).toBe(20);
  });

  test('hamiltonian()', () => {

    const result = hamiltonian(
      1,
      5,
      1,
      2,
      1,
      1
    );

    expect(typeof result).toBe('number');
  });
});
```

---

# Configuración Jest

```bash
npm install --save-dev jest ts-jest @types/jest
```

```bash
npx ts-jest config:init
```

En package.json:

```json
{
  "scripts": {
    "test": "jest"
  }
}
```

---

# Representación gráfica en Canvas

La siguiente visualización dibuja una función de onda simple usando HTML5 Canvas.

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Schrödinger Wave</title>

  <style>

    /* Fondo negro estilo simulador cuántico */
    body {
      margin: 0;
      background: black;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
    }

    /* Canvas principal */
    canvas {
      border: 1px solid white;
    }

  </style>
</head>
<body>

<canvas id="wave" width="1000" height="400"></canvas>

<script>

// Obtenemos el canvas.
const canvas = document.getElementById('wave');

// Contexto 2D.
const ctx = canvas.getContext('2d');

// Dimensiones.
const width = canvas.width;
const height = canvas.height;

// Centro vertical.
const centerY = height / 2;

// Función de onda simplificada.
// ψ(x,t)
// Usamos una sinusoidal para representar propagación.
const psi = (x, t) => {
  return Math.sin((x * 0.02) - (t * 0.05));
};

// Tiempo inicial.
let time = 0;

// Dibuja eje horizontal.
const drawAxis = () => {

  ctx.strokeStyle = '#333';
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.moveTo(0, centerY);
  ctx.lineTo(width, centerY);
  ctx.stroke();
};

// Dibuja la onda cuántica.
const drawWave = () => {

  // Limpiamos frame anterior.
  ctx.clearRect(0, 0, width, height);

  drawAxis();

  ctx.beginPath();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#00ffcc';

  // Recorremos el eje X.
  for (let x = 0; x < width; x++) {

    // Calculamos amplitud.
    const amplitude = psi(x, time);

    // Convertimos amplitud en coordenada Y.
    const y = centerY + amplitude * 100;

    // Primer punto.
    if (x === 0) {
      ctx.moveTo(x, y);
    }
    // Resto de línea.
    else {
      ctx.lineTo(x, y);
    }
  }

  // Dibujamos.
  ctx.stroke();

  // Avanza el tiempo.
  time += 1;

  // Próximo frame.
  requestAnimationFrame(drawWave);
};

// Iniciamos simulación.
drawWave();

</script>

</body>
</html>
```

---

# Qué representa el gráfico

La onda animada representa una función de onda cuántica simplificada:

ψ(x,t)

- El eje X representa posición.
- El eje Y representa amplitud.
- La animación representa evolución temporal.
- La onda sinusoidal imita propagación cuántica.

---

# Próximos pasos posibles

Podrías extender esto con:

- números complejos
- operadores de Fourier
- paquetes gaussianos
- colapso de función de onda
- experimento de doble rendija
- visualización probabilística |ψ|²
- WebGL
- React + Canvas
- simulación discreta de Schrödinger

